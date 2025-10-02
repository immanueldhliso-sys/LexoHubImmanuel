# Intelligent Document Processing System - Implementation Plan

## Overview
This document outlines the implementation of LexoHub's Intelligent Document Processing System using AWS services including S3, Lambda, Textract, Bedrock, Step Functions, and DynamoDB.

## Architecture Components

### Core Services
- **AWS S3** - Document storage with intelligent tiering
- **AWS Lambda** - Serverless processing functions
- **AWS Textract** - OCR and document analysis
- **AWS Bedrock** - AI-powered field extraction
- **AWS Step Functions** - Workflow orchestration
- **Amazon DynamoDB** - Metadata and template cache
- **Amazon SQS** - Tiered processing queues
- **Amazon A2I** - Human review workflow
- **Amazon EventBridge** - Event-driven triggers

### Processing Tiers
- **Tier 0** - Template-based fast path (512MB Lambda, <100ms)
- **Tier 1** - Simple text extraction (Textract basic)
- **Tier 2** - Structured data extraction (Textract forms/tables)
- **Tier 3** - AI-powered extraction (Bedrock Claude models)

## Phase 1: Foundation Infrastructure (Weeks 1-2)

### Week 1: Core Storage and Data Tables

#### S3 Bucket Configuration
```typescript
// src/services/aws/s3-document-storage.service.ts
import { S3Client, CreateBucketCommand, PutBucketVersioningCommand, 
         PutBucketLifecycleConfigurationCommand, PutBucketNotificationConfigurationCommand } from '@aws-sdk/client-s3';

export class S3DocumentStorageService {
  private s3Client: S3Client;
  private bucketName = 'lexohub-documents-processing';

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.VITE_AWS_REGION || 'us-east-1'
    });
  }

  async setupBucket(): Promise<void> {
    await this.createBucket();
    await this.enableVersioning();
    await this.configureIntelligentTiering();
    await this.setupLifecyclePolicy();
    await this.configureEventBridge();
  }

  private async createBucket(): Promise<void> {
    await this.s3Client.send(new CreateBucketCommand({
      Bucket: this.bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: process.env.VITE_AWS_REGION as any
      }
    }));
  }

  private async enableVersioning(): Promise<void> {
    await this.s3Client.send(new PutBucketVersioningCommand({
      Bucket: this.bucketName,
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    }));
  }

  private async configureIntelligentTiering(): Promise<void> {
    await this.s3Client.send(new PutBucketLifecycleConfigurationCommand({
      Bucket: this.bucketName,
      LifecycleConfiguration: {
        Rules: [{
          Id: 'IntelligentTiering',
          Status: 'Enabled',
          Transitions: [{
            Days: 0,
            StorageClass: 'INTELLIGENT_TIERING'
          }]
        }]
      }
    }));
  }

  private async setupLifecyclePolicy(): Promise<void> {
    await this.s3Client.send(new PutBucketLifecycleConfigurationCommand({
      Bucket: this.bucketName,
      LifecycleConfiguration: {
        Rules: [{
          Id: 'GlacierTransition',
          Status: 'Enabled',
          Transitions: [{
            Days: 90,
            StorageClass: 'GLACIER'
          }]
        }]
      }
    }));
  }

  private async configureEventBridge(): Promise<void> {
    await this.s3Client.send(new PutBucketNotificationConfigurationCommand({
      Bucket: this.bucketName,
      NotificationConfiguration: {
        EventBridgeConfiguration: {}
      }
    }));
  }
}
```

#### DynamoDB Tables Setup
```typescript
// src/services/aws/dynamodb-setup.service.ts
import { DynamoDBClient, CreateTableCommand, UpdateTimeToLiveCommand } from '@aws-sdk/client-dynamodb';

export class DynamoDBSetupService {
  private dynamoClient: DynamoDBClient;

  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.VITE_AWS_REGION || 'us-east-1'
    });
  }

  async setupTables(): Promise<void> {
    await this.createDocumentMetadataTable();
    await this.createTemplateCacheTable();
  }

  private async createDocumentMetadataTable(): Promise<void> {
    await this.dynamoClient.send(new CreateTableCommand({
      TableName: 'DocumentMetadata',
      KeySchema: [
        { AttributeName: 'documentId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'documentId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'processingStatus', AttributeType: 'S' },
        { AttributeName: 'uploadTimestamp', AttributeType: 'N' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'uploadTimestamp', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: 'StatusIndex',
          KeySchema: [
            { AttributeName: 'processingStatus', KeyType: 'HASH' },
            { AttributeName: 'uploadTimestamp', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      }
    }));

    await this.dynamoClient.send(new UpdateTimeToLiveCommand({
      TableName: 'DocumentMetadata',
      TimeToLiveSpecification: {
        Enabled: true,
        AttributeName: 'ttl'
      }
    }));
  }

  private async createTemplateCacheTable(): Promise<void> {
    await this.dynamoClient.send(new CreateTableCommand({
      TableName: 'TemplateCache',
      KeySchema: [
        { AttributeName: 'structuralHash', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'structuralHash', AttributeType: 'S' },
        { AttributeName: 'documentType', AttributeType: 'S' },
        { AttributeName: 'confidence', AttributeType: 'N' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'DocumentTypeIndex',
          KeySchema: [
            { AttributeName: 'documentType', KeyType: 'HASH' },
            { AttributeName: 'confidence', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 5
          }
        }
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 20,
        WriteCapacityUnits: 10
      }
    }));

    await this.dynamoClient.send(new UpdateTimeToLiveCommand({
      TableName: 'TemplateCache',
      TimeToLiveSpecification: {
        Enabled: true,
        AttributeName: 'expiresAt'
      }
    }));
  }
}
```

### Week 2: Lambda 0 Classification Function

```typescript
// lambda/classification/lambda0-classifier.ts
import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as crypto from 'crypto';

interface ClassificationResult {
  documentId: string;
  structuralHash: string;
  documentType: string;
  targetTier: 0 | 1 | 2 | 3;
  confidence: number;
  templateMatch: boolean;
}

export class Lambda0Classifier {
  private s3Client: S3Client;
  private dynamoClient: DynamoDBClient;
  private sqsClient: SQSClient;

  constructor() {
    this.s3Client = new S3Client({});
    this.dynamoClient = new DynamoDBClient({});
    this.sqsClient = new SQSClient({});
  }

  async handler(event: S3Event): Promise<void> {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      const result = await this.classifyDocument(bucket, key);
      await this.routeToTier(result);
    }
  }

  private async classifyDocument(bucket: string, key: string): Promise<ClassificationResult> {
    const documentBuffer = await this.getDocumentFromS3(bucket, key);
    const structuralHash = this.generateStructuralHash(documentBuffer);
    
    const templateMatch = await this.checkTemplateCache(structuralHash);
    
    if (templateMatch) {
      return {
        documentId: key,
        structuralHash,
        documentType: templateMatch.documentType,
        targetTier: 0,
        confidence: templateMatch.confidence,
        templateMatch: true
      };
    }

    const classification = await this.analyzeDocumentStructure(documentBuffer, key);
    
    return {
      documentId: key,
      structuralHash,
      ...classification,
      templateMatch: false
    };
  }

  private async getDocumentFromS3(bucket: string, key: string): Promise<Buffer> {
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));

    return Buffer.from(await response.Body!.transformToByteArray());
  }

  private generateStructuralHash(documentBuffer: Buffer): string {
    return crypto
      .createHash('sha256')
      .update(documentBuffer.slice(0, 4096))
      .digest('hex');
  }

  private async checkTemplateCache(structuralHash: string): Promise<any> {
    const response = await this.dynamoClient.send(new GetItemCommand({
      TableName: 'TemplateCache',
      Key: {
        structuralHash: { S: structuralHash }
      }
    }));

    if (response.Item && parseFloat(response.Item.confidence.N!) > 0.95) {
      return {
        documentType: response.Item.documentType.S,
        confidence: parseFloat(response.Item.confidence.N!),
        fieldMappings: JSON.parse(response.Item.fieldMappings.S!)
      };
    }

    return null;
  }

  private async analyzeDocumentStructure(documentBuffer: Buffer, filename: string): Promise<{
    documentType: string;
    targetTier: 1 | 2 | 3;
    confidence: number;
  }> {
    const filenamePatterns = {
      invoice: /invoice|bill|receipt/i,
      contract: /contract|agreement/i,
      court_filing: /filing|motion|pleading/i,
      engagement_letter: /engagement|retainer/i
    };

    for (const [type, pattern] of Object.entries(filenamePatterns)) {
      if (pattern.test(filename)) {
        return {
          documentType: type,
          targetTier: this.determineInitialTier(type),
          confidence: 0.7
        };
      }
    }

    return {
      documentType: 'unknown',
      targetTier: 2,
      confidence: 0.5
    };
  }

  private determineInitialTier(documentType: string): 1 | 2 | 3 {
    const tierMapping: Record<string, 1 | 2 | 3> = {
      invoice: 2,
      contract: 3,
      court_filing: 3,
      engagement_letter: 2,
      unknown: 1
    };

    return tierMapping[documentType] || 2;
  }

  private async routeToTier(result: ClassificationResult): Promise<void> {
    const queueUrls: Record<number, string> = {
      0: process.env.TIER0_QUEUE_URL!,
      1: process.env.TIER1_QUEUE_URL!,
      2: process.env.TIER2_QUEUE_URL!,
      3: process.env.TIER3_QUEUE_URL!
    };

    await this.sqsClient.send(new SendMessageCommand({
      QueueUrl: queueUrls[result.targetTier],
      MessageBody: JSON.stringify(result),
      MessageAttributes: {
        documentType: {
          DataType: 'String',
          StringValue: result.documentType
        },
        tier: {
          DataType: 'Number',
          StringValue: result.targetTier.toString()
        }
      }
    }));
  }
}

export const handler = async (event: S3Event) => {
  const classifier = new Lambda0Classifier();
  await classifier.handler(event);
};
```

## Implementation Status Tracking

### Progress Tracker Component
```typescript
// src/components/document-processing/ProcessingProgressTracker.tsx
import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tier?: number;
  confidence?: number;
}

interface ProcessingProgressTrackerProps {
  documentId: string;
  steps: ProcessingStep[];
  currentStep: number;
}

export const ProcessingProgressTracker: React.FC<ProcessingProgressTrackerProps> = ({
  documentId,
  steps,
  currentStep
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Document Processing</h2>
        <p className="text-sm text-neutral-600">Document ID: {documentId}</p>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-200" />

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex items-start gap-4">
              <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                step.status === 'completed' 
                  ? 'bg-status-success-500 border-status-success-200'
                  : step.status === 'in_progress'
                  ? 'bg-mpondo-gold-500 border-mpondo-gold-200 animate-pulse'
                  : step.status === 'failed'
                  ? 'bg-status-error-500 border-status-error-200'
                  : 'bg-neutral-100 border-neutral-300'
              }`}>
                {step.status === 'completed' && (
                  <CheckCircle className="w-8 h-8 text-white" />
                )}
                {step.status === 'in_progress' && (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                )}
                {step.status === 'pending' && (
                  <Circle className="w-8 h-8 text-neutral-400" />
                )}
                {step.status === 'failed' && (
                  <span className="text-white font-bold text-xl">!</span>
                )}
              </div>

              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold text-neutral-900">{step.name}</h3>
                {step.tier !== undefined && (
                  <p className="text-sm text-neutral-600">Processing Tier: {step.tier}</p>
                )}
                {step.confidence !== undefined && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-neutral-600">Confidence</span>
                      <span className="font-semibold text-neutral-900">
                        {(step.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          step.confidence >= 0.9
                            ? 'bg-status-success-500'
                            : step.confidence >= 0.7
                            ? 'bg-mpondo-gold-500'
                            : 'bg-status-warning-500'
                        }`}
                        style={{ width: `${step.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-judicial-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-judicial-blue-900">
            Overall Progress
          </span>
          <span className="text-sm font-semibold text-judicial-blue-900">
            {currentStep} of {steps.length} steps
          </span>
        </div>
        <div className="mt-2 w-full bg-judicial-blue-200 rounded-full h-3">
          <div
            className="bg-judicial-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
```

## Next Steps

See the complete implementation plan in:
- `AWS_DOCUMENT_PROCESSING_PHASES.md` - Detailed phase breakdown
- `AWS_LAMBDA_FUNCTIONS.md` - All Lambda function implementations
- `AWS_STEP_FUNCTIONS_WORKFLOW.md` - Orchestration workflows
