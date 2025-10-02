# LexoHub AWS Document Processing Infrastructure

This directory contains the AWS infrastructure and Lambda functions for the LexoHub intelligent document processing system.

## Architecture Overview

The system uses a tiered processing approach to optimize cost and performance:

- **Tier 0**: Template-based extraction (fastest, lowest cost)
- **Tier 1**: Simple text extraction using Textract
- **Tier 2**: Structured data extraction (forms, tables)
- **Tier 3**: AI-powered extraction using Amazon Bedrock

## Directory Structure

```
aws/
├── infrastructure/
│   └── cloudformation/
│       ├── phase1-storage.yaml          # S3, DynamoDB, IAM
│       ├── phase1-monitoring.yaml       # CloudWatch dashboards and alarms
│       ├── phase2-queues.yaml           # SQS queues (to be created)
│       ├── phase2-stepfunctions.yaml    # Step Functions workflow (to be created)
│       └── ...
├── lambda/
│   ├── lambda0-classification/
│   │   ├── index.py                     # Classification logic
│   │   └── requirements.txt
│   ├── tier0-template-extraction/       # (to be created)
│   ├── tier1-simple-extraction/
│   │   ├── index.py                     # Textract simple extraction
│   │   └── requirements.txt
│   ├── tier2-structured-extraction/     # (to be created)
│   └── tier3-ai-extraction/             # (to be created)
└── scripts/
    ├── deploy-phase1.ps1                # PowerShell deployment script
    ├── deploy-phase1.sh                 # Bash deployment script
    └── ...
```

## Phase 1: Foundation Infrastructure

### Prerequisites

1. **AWS SAM CLI** installed (v1.100.0+) - **MANDATORY**
2. AWS CLI v2.x installed and configured
3. Python 3.11 or later
4. Docker (for local testing and container builds)
5. PowerShell 7+ (Windows) or Bash (Linux/Mac)
6. AWS account with appropriate permissions

### Installation

**Install SAM CLI:**

Windows:
```powershell
# Download MSI installer from:
# https://github.com/aws/aws-sam-cli/releases/latest
```

macOS:
```bash
brew install aws-sam-cli
```

Linux:
```bash
pip install aws-sam-cli
```

Verify:
```bash
sam --version
```

### Deployment

**IMPORTANT**: LexoHub uses AWS SAM (Serverless Application Model) as the **mandatory deployment method**. Do not use raw CloudFormation templates.

#### Windows (PowerShell)

```powershell
cd aws\scripts
.\deploy-sam.ps1 -Environment production -Guided
```

#### Linux/Mac (Bash)

```bash
cd aws/scripts
chmod +x deploy-sam.sh
./deploy-sam.sh production true
```

#### Manual SAM Deployment

```bash
cd aws
sam build --use-container
sam deploy --guided --config-env production
```

### What Gets Deployed

#### Storage Infrastructure
- **S3 Bucket**: Document storage with versioning, Intelligent-Tiering, and Glacier lifecycle
- **DynamoDB Tables**:
  - `DocumentMetadata`: Stores processing results and metadata
  - `TemplateCache`: Stores learned document templates
- **IAM Roles**: Least-privilege roles for Lambda, EventBridge, and Textract

#### Lambda Functions
- **Lambda 0 Classification**: Analyzes documents and routes to appropriate tier
  - Memory: 512MB
  - Timeout: 5 minutes
  - Provisioned Concurrency: 2 instances
  
- **Tier 1 Extraction**: Simple text extraction using Textract
  - Memory: 1024MB
  - Timeout: 15 minutes

#### Monitoring
- CloudWatch Dashboard with metrics for:
  - Lambda invocations, duration, errors, throttles
  - SQS queue depth and message flow
- CloudWatch Alarms for:
  - Lambda throttling
  - High error rates
  - Queue depth issues

## Lambda 0 Classification Logic

The classification function performs the following steps:

1. **Structural Hash Generation**: Creates a hash based on document layout
2. **Template Cache Lookup**: Checks if document matches known template
3. **Filename Pattern Matching**: Analyzes filename for document type
4. **Header Analysis**: Examines first page for content indicators
5. **Tier Determination**: Routes to appropriate processing tier

### Routing Logic

```
Template Match (>85% confidence) → Tier 0
Simple document (<3 pages, no tables/forms) → Tier 1
Structured document (tables/forms) → Tier 2
Complex document (>10 pages or low confidence) → Tier 3
```

## Tier 1 Extraction Process

1. Receives message from SQS queue
2. Starts asynchronous Textract job
3. Waits for SNS notification
4. Retrieves results and calculates confidence
5. Stores extracted text in DynamoDB

## Environment Variables

Lambda functions use the following environment variables:

- `TEMPLATE_CACHE_TABLE`: DynamoDB table for templates
- `METADATA_TABLE`: DynamoDB table for document metadata
- `DOCUMENT_BUCKET`: S3 bucket name
- `ENVIRONMENT`: Deployment environment (development/staging/production)

## Cost Optimization

### Tier 0 (Template-Based)
- **Cost**: ~$0.0001 per document
- **Speed**: <1 second
- **Use Case**: Known document formats

### Tier 1 (Simple Textract)
- **Cost**: ~$0.0015 per page
- **Speed**: 5-10 seconds
- **Use Case**: Simple text documents

### Tier 2 (Structured Textract)
- **Cost**: ~$0.05 per page
- **Speed**: 10-30 seconds
- **Use Case**: Forms and tables

### Tier 3 (AI Extraction)
- **Cost**: ~$0.10-$0.50 per document
- **Speed**: 30-60 seconds
- **Use Case**: Complex or handwritten documents

## Monitoring and Alerts

### CloudWatch Dashboard

Access the dashboard at:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=LexoHub-DocumentProcessing-production
```

### Key Metrics

- **Invocations**: Number of Lambda executions
- **Duration**: Average processing time
- **Errors**: Failed executions
- **Throttles**: Rate-limited requests
- **Queue Depth**: Pending messages in SQS

### Alarms

Alarms are configured for:
- Lambda throttling (>5 in 5 minutes)
- High error rate (>10 in 10 minutes)
- Queue depth (>1000 messages)

## Next Steps (Phase 2)

1. Create SQS queues for each tier
2. Implement Step Functions orchestration workflow
3. Deploy Tier 2 structured extraction function
4. Set up EventBridge rules for S3 triggers
5. Configure SNS topics for notifications

## Troubleshooting

### Lambda Deployment Issues

If Lambda deployment fails:
```powershell
aws lambda get-function --function-name lexohub-lambda0-classification-production --region us-east-1
aws logs tail /aws/lambda/lexohub-lambda0-classification-production --follow
```

### DynamoDB Access Issues

Verify IAM role permissions:
```powershell
aws iam get-role-policy --role-name lexohub-lambda-execution-production --policy-name DynamoDBAccess
```

### S3 Event Notifications

Check EventBridge configuration:
```powershell
aws s3api get-bucket-notification-configuration --bucket lexohub-documents-production
```

## Security Best Practices

1. **Encryption**: All data encrypted at rest (S3, DynamoDB)
2. **IAM**: Least-privilege access policies
3. **VPC**: Lambda functions can be deployed in VPC (Phase 5)
4. **Logging**: All actions logged to CloudWatch
5. **Versioning**: S3 versioning enabled for document recovery

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review CloudWatch Alarms
3. Verify IAM permissions
4. Check AWS service quotas

## License

Proprietary - LexoHub Internal Use Only
