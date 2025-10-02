# LexoHub AWS Implementation Guide

## Quick Start: Priority AWS Services

### 1. Amazon S3 + CloudFront Setup (Immediate Impact)

#### A. S3 Configuration for File Storage

```typescript
// src/services/aws/s3-storage.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.VITE_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.VITE_S3_BUCKET_NAME!;
  }

  // Upload document with metadata
  async uploadDocument(file: File, matterID: string, documentType: string): Promise<string> {
    const key = `matters/${matterID}/documents/${Date.now()}-${file.name}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: file.type,
      Metadata: {
        'matter-id': matterID,
        'document-type': documentType,
        'upload-date': new Date().toISOString(),
        'file-size': file.size.toString(),
      },
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA', // Cost optimization for legal documents
    });

    await this.s3Client.send(command);
    return key;
  }

  // Generate presigned URL for secure downloads
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // Generate presigned URL for direct uploads (reduces server load)
  async getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
```

#### B. CloudFront Configuration

```yaml
# cloudfront-config.yml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  LexoHubDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt S3Bucket.DomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${OriginAccessIdentity}'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad # Managed-CachingOptimized
          Compress: true
        CacheBehaviors:
          - PathPattern: '/api/*'
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: https-only
            CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
            TTL: 0 # No caching for API calls
          - PathPattern: '/documents/*'
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: https-only
            CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6 # Managed-CachingOptimizedForUncompressedObjects
        Enabled: true
        DefaultRootObject: index.html
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html # SPA routing support
```

### 2. AWS Lambda for Document Processing

#### A. Document OCR Lambda Function

```typescript
// lambda/document-ocr/index.ts
import { S3Event, Context } from 'aws-lambda';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const textract = new TextractClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event: S3Event, context: Context) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    try {
      // Only process PDF and image files
      if (!key.match(/\.(pdf|jpg|jpeg|png|tiff)$/i)) {
        continue;
      }

      // Extract text using Textract
      const textractCommand = new DetectDocumentTextCommand({
        Document: {
          S3Object: {
            Bucket: bucket,
            Name: key,
          },
        },
      });

      const textractResponse = await textract.send(textractCommand);
      
      // Extract text content
      const extractedText = textractResponse.Blocks
        ?.filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join('\n') || '';

      // Save extracted text to S3
      const textKey = key.replace(/\.[^.]+$/, '.txt');
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: textKey,
        Body: extractedText,
        ContentType: 'text/plain',
        Metadata: {
          'source-document': key,
          'extraction-date': new Date().toISOString(),
          'extraction-method': 'aws-textract',
        },
      });

      await s3.send(putCommand);

      // Update database with extracted text
      await updateDocumentText(key, extractedText);

    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      // Send to DLQ or retry mechanism
    }
  }
};

async function updateDocumentText(s3Key: string, extractedText: string) {
  // Update Supabase with extracted text
  // This would integrate with your existing document service
}
```

#### B. Data Export Lambda Function

```typescript
// lambda/data-export/index.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ses = new SESClient({ region: process.env.AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { userId, exportOptions } = JSON.parse(event.body || '{}');

    // Generate export data (this would use your existing export service)
    const exportData = await generateExportData(userId, exportOptions);

    // Upload to S3
    const key = `exports/${userId}/${Date.now()}-export.${exportOptions.format}`;
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.EXPORT_BUCKET!,
      Key: key,
      Body: exportData,
      ContentType: getContentType(exportOptions.format),
      Expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await s3.send(uploadCommand);

    // Generate download URL
    const downloadUrl = `https://${process.env.EXPORT_BUCKET}.s3.amazonaws.com/${key}`;

    // Send email notification
    await sendExportNotification(userId, downloadUrl);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        downloadUrl,
        expiresIn: '7 days',
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Export failed' }),
    };
  }
};
```

### 3. ElastiCache for Performance

#### A. Redis Caching Service

```typescript
// src/services/aws/redis-cache.service.ts
import Redis from 'ioredis';

export class RedisCacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.VITE_REDIS_HOST,
      port: parseInt(process.env.VITE_REDIS_PORT || '6379'),
      password: process.env.VITE_REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  // Cache matter search results
  async cacheMatterSearch(query: string, results: any[], ttl: number = 300): Promise<void> {
    const key = `matter_search:${this.hashQuery(query)}`;
    await this.redis.setex(key, ttl, JSON.stringify(results));
  }

  async getCachedMatterSearch(query: string): Promise<any[] | null> {
    const key = `matter_search:${this.hashQuery(query)}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Cache user preferences
  async cacheUserPreferences(userId: string, preferences: any): Promise<void> {
    const key = `user_prefs:${userId}`;
    await this.redis.setex(key, 3600, JSON.stringify(preferences)); // 1 hour
  }

  // Cache document metadata
  async cacheDocumentMetadata(documentId: string, metadata: any): Promise<void> {
    const key = `doc_meta:${documentId}`;
    await this.redis.setex(key, 1800, JSON.stringify(metadata)); // 30 minutes
  }

  // Rate limiting
  async checkRateLimit(userId: string, action: string, limit: number, window: number): Promise<boolean> {
    const key = `rate_limit:${userId}:${action}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return current <= limit;
  }

  private hashQuery(query: string): string {
    // Simple hash function for cache keys
    return Buffer.from(query).toString('base64').slice(0, 32);
  }
}
```

### 4. API Gateway Integration

#### A. Enhanced API Service

```typescript
// src/services/aws/api-gateway.service.ts
export class ApiGatewayService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.VITE_API_GATEWAY_URL!;
    this.apiKey = process.env.VITE_API_GATEWAY_KEY!;
  }

  // Enhanced document upload with progress tracking
  async uploadDocumentWithProgress(
    file: File, 
    matterID: string, 
    onProgress: (progress: number) => void
  ): Promise<string> {
    // Get presigned upload URL
    const uploadUrlResponse = await fetch(`${this.baseUrl}/documents/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        matterID,
      }),
    });

    const { uploadUrl, documentId } = await uploadUrlResponse.json();

    // Upload directly to S3 with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(documentId);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  // Batch operations for better performance
  async batchUpdateMatters(updates: Array<{id: string, data: any}>): Promise<void> {
    await fetch(`${this.baseUrl}/matters/batch-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({ updates }),
    });
  }
}
```

### 5. Environment Configuration

#### A. Environment Variables

```bash
# .env.production
# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key

# S3 Configuration
VITE_S3_BUCKET_NAME=lexohub-documents-prod
VITE_S3_REGION=us-east-1

# CloudFront
VITE_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# API Gateway
VITE_API_GATEWAY_URL=https://api.lexohub.com/v1
VITE_API_GATEWAY_KEY=your_api_key

# ElastiCache Redis
VITE_REDIS_HOST=lexohub-cache.abc123.cache.amazonaws.com
VITE_REDIS_PORT=6379
VITE_REDIS_PASSWORD=your_redis_password

# Monitoring
VITE_CLOUDWATCH_LOG_GROUP=/aws/lambda/lexohub
```

#### B. Webpack/Vite Configuration Updates

```typescript
// vite.config.ts - Enhanced for AWS
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@aws': path.resolve(__dirname, './src/services/aws'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'aws-sdk': ['@aws-sdk/client-s3', '@aws-sdk/client-textract'],
            'vendor': ['react', 'react-dom'],
            'ui': ['lucide-react', '@phosphor-icons/react'],
          },
        },
      },
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['@aws-sdk/client-s3', '@aws-sdk/client-textract'],
    },
  };
});
```

### 6. Deployment Scripts

#### A. AWS CDK Deployment

```typescript
// infrastructure/lexohub-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class LexoHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for documents
    const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: 'lexohub-documents-prod',
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{
        id: 'ArchiveOldDocuments',
        transitions: [{
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        }, {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        }],
      }],
    });

    // CloudFront Distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'Distribution', {
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: documentsBucket,
        },
        behaviors: [{
          isDefaultBehavior: true,
          compress: true,
          allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
        }],
      }],
    });

    // Lambda for document processing
    const documentProcessor = new lambda.Function(this, 'DocumentProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/document-ocr'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'LexoHubApi', {
      restApiName: 'LexoHub API',
      description: 'API for LexoHub application',
    });
  }
}
```

### 7. Monitoring and Alerts

#### A. CloudWatch Monitoring

```typescript
// src/services/aws/monitoring.service.ts
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

export class MonitoringService {
  private cloudWatch: CloudWatchClient;

  constructor() {
    this.cloudWatch = new CloudWatchClient({ region: process.env.VITE_AWS_REGION });
  }

  async trackDocumentUpload(success: boolean, fileSize: number, processingTime: number): Promise<void> {
    const metrics = [
      {
        MetricName: 'DocumentUploads',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'Status', Value: success ? 'Success' : 'Failure' },
        ],
      },
      {
        MetricName: 'DocumentSize',
        Value: fileSize,
        Unit: 'Bytes',
      },
      {
        MetricName: 'ProcessingTime',
        Value: processingTime,
        Unit: 'Milliseconds',
      },
    ];

    await this.cloudWatch.send(new PutMetricDataCommand({
      Namespace: 'LexoHub/Documents',
      MetricData: metrics,
    }));
  }

  async trackUserActivity(userId: string, action: string): Promise<void> {
    await this.cloudWatch.send(new PutMetricDataCommand({
      Namespace: 'LexoHub/UserActivity',
      MetricData: [{
        MetricName: 'UserActions',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'Action', Value: action },
          { Name: 'UserId', Value: userId },
        ],
      }],
    }));
  }
}
```

## Implementation Priority

### Week 1: Foundation
1. ✅ Set up S3 bucket and basic file upload
2. ✅ Configure CloudFront for static assets
3. ✅ Implement basic monitoring

### Week 2: Enhancement
1. ✅ Add ElastiCache for caching
2. ✅ Create Lambda functions for document processing
3. ✅ Set up API Gateway

### Week 3: Optimization
1. ✅ Implement advanced caching strategies
2. ✅ Add comprehensive monitoring
3. ✅ Performance testing and optimization

### Week 4: Production
1. ✅ Security hardening
2. ✅ Load testing
3. ✅ Go-live preparation

This implementation guide provides the foundation for transforming LexoHub into a highly scalable, resilient AWS-powered application while maintaining the existing Supabase backend for data management.