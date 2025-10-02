# Phase 1: Foundation Infrastructure - Deployment Guide

## Overview

This guide walks through deploying the Phase 1 infrastructure for LexoHub's intelligent document processing system.

## Prerequisites

### Required Tools
- AWS CLI v2.x or later
- Python 3.11+
- pip (Python package manager)
- PowerShell 7+ (Windows) or Bash (Linux/Mac)
- Git

### AWS Account Setup
1. AWS account with administrator access
2. AWS CLI configured with credentials
3. Sufficient service limits:
   - Lambda: 10 concurrent executions
   - DynamoDB: 5 tables
   - S3: 1 bucket
   - SQS: 6 queues

### Verify Prerequisites

```bash
aws --version
python --version
pip --version
```

## Deployment Steps

### Step 1: Configure AWS Credentials

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

### Step 2: Clone Repository

```bash
cd /path/to/LexoHub
```

### Step 3: Deploy Storage Infrastructure

This creates S3 bucket, DynamoDB tables, and IAM roles.

**Windows:**
```powershell
cd aws\scripts
.\deploy-phase1.ps1 -Environment production -Region us-east-1
```

**Linux/Mac:**
```bash
cd aws/scripts
chmod +x deploy-phase1.sh
./deploy-phase1.sh production us-east-1
```

**Expected Output:**
```
========================================
LexoHub Phase 1 Deployment Script
Environment: production
Region: us-east-1
========================================

Step 1: Deploying Storage Infrastructure...
Deploying stack: lexohub-phase1-storage
Creating new stack...
Waiting for stack creation to complete...
Stack lexohub-phase1-storage deployed successfully!

Step 2: Getting Stack Outputs...
Bucket: lexohub-documents-production
Metadata Table: lexohub-document-metadata-production
Template Cache: lexohub-template-cache-production
Lambda Role: arn:aws:iam::123456789012:role/lexohub-lambda-execution-production
```

### Step 4: Deploy SQS Queues

After storage infrastructure is deployed, deploy the queues:

```bash
aws cloudformation create-stack \
  --stack-name lexohub-phase1-queues \
  --template-body file://aws/infrastructure/cloudformation/phase1-queues.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=Lambda0FunctionArn,ParameterValue=arn:aws:lambda:us-east-1:ACCOUNT:function:lexohub-lambda0-classification-production \
  --region us-east-1

aws cloudformation wait stack-create-complete \
  --stack-name lexohub-phase1-queues \
  --region us-east-1
```

### Step 5: Update Lambda Environment Variables

After queues are created, update Lambda functions with queue URLs:

```bash
TIER0_QUEUE_URL=$(aws cloudformation describe-stacks \
  --stack-name lexohub-phase1-queues \
  --query 'Stacks[0].Outputs[?OutputKey==`Tier0QueueUrl`].OutputValue' \
  --output text)

TIER1_QUEUE_URL=$(aws cloudformation describe-stacks \
  --stack-name lexohub-phase1-queues \
  --query 'Stacks[0].Outputs[?OutputKey==`Tier1QueueUrl`].OutputValue' \
  --output text)

aws lambda update-function-configuration \
  --function-name lexohub-lambda0-classification-production \
  --environment "Variables={TIER0_QUEUE_URL=$TIER0_QUEUE_URL,TIER1_QUEUE_URL=$TIER1_QUEUE_URL,...}" \
  --region us-east-1
```

### Step 6: Configure Event Trigger

The EventBridge rule is automatically created by the queues stack. Verify it:

```bash
aws events describe-rule \
  --name lexohub-s3-document-upload-production \
  --region us-east-1
```

### Step 7: Test the Pipeline

Upload a test document:

```bash
aws s3 cp test-document.pdf s3://lexohub-documents-production/matters/test-matter-001/documents/
```

Monitor Lambda execution:

```bash
aws logs tail /aws/lambda/lexohub-lambda0-classification-production --follow
```

Check DynamoDB for results:

```bash
aws dynamodb scan \
  --table-name lexohub-document-metadata-production \
  --limit 10
```

## Verification Checklist

### Infrastructure Created

- [ ] S3 bucket: `lexohub-documents-production`
  - [ ] Versioning enabled
  - [ ] Intelligent-Tiering configured
  - [ ] EventBridge notifications enabled
  
- [ ] DynamoDB tables:
  - [ ] `lexohub-document-metadata-production`
  - [ ] `lexohub-template-cache-production`
  - [ ] Streams enabled on metadata table
  
- [ ] IAM roles:
  - [ ] `lexohub-lambda-execution-production`
  - [ ] `lexohub-eventbridge-production`
  
- [ ] Lambda functions:
  - [ ] `lexohub-lambda0-classification-production` (512MB, 5min timeout)
  - [ ] `lexohub-tier1-extraction-production` (1024MB, 15min timeout)
  - [ ] Provisioned concurrency configured on Lambda 0
  
- [ ] SQS queues:
  - [ ] `lexohub-tier0-queue-production`
  - [ ] `lexohub-tier1-queue-production`
  - [ ] `lexohub-tier2-queue-production`
  - [ ] `lexohub-tier3-queue-production`
  - [ ] `lexohub-validation-queue-production`
  - [ ] `lexohub-dlq-production`
  
- [ ] SNS topic:
  - [ ] `lexohub-textract-completion-production`
  
- [ ] CloudWatch:
  - [ ] Dashboard: `LexoHub-DocumentProcessing-production`
  - [ ] Alarms configured
  - [ ] Log groups created

### Functional Tests

1. **Upload Test Document**
   ```bash
   aws s3 cp sample.pdf s3://lexohub-documents-production/matters/test/documents/
   ```

2. **Verify Lambda 0 Execution**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name Invocations \
     --dimensions Name=FunctionName,Value=lexohub-lambda0-classification-production \
     --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Sum
   ```

3. **Check Queue Messages**
   ```bash
   aws sqs get-queue-attributes \
     --queue-url $TIER1_QUEUE_URL \
     --attribute-names ApproximateNumberOfMessages
   ```

4. **Verify DynamoDB Entry**
   ```bash
   aws dynamodb query \
     --table-name lexohub-document-metadata-production \
     --index-name StatusIndex \
     --key-condition-expression "processingStatus = :status" \
     --expression-attribute-values '{":status":{"S":"PROCESSING"}}'
   ```

## Cost Estimation

### Monthly Costs (1000 documents/day)

| Service | Usage | Cost |
|---------|-------|------|
| S3 Storage | 100GB | $2.30 |
| S3 Requests | 30K PUT, 30K GET | $0.15 |
| DynamoDB | 1M reads, 100K writes | $0.50 |
| Lambda Execution | 60K invocations | $1.20 |
| Lambda Provisioned | 2 instances 24/7 | $10.00 |
| SQS | 100K requests | $0.04 |
| CloudWatch | Logs + Metrics | $5.00 |
| **Total** | | **~$19.19/month** |

*Note: Textract costs not included (billed per page processed)*

## Troubleshooting

### Issue: Stack Creation Failed

**Symptom:** CloudFormation stack shows `CREATE_FAILED` or `ROLLBACK_COMPLETE`

**Solution:**
```bash
aws cloudformation describe-stack-events \
  --stack-name lexohub-phase1-storage \
  --max-items 20 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

Common causes:
- Insufficient IAM permissions
- Resource name conflicts
- Service quota limits reached

### Issue: Lambda Function Not Triggering

**Symptom:** Documents uploaded but Lambda not executing

**Solution:**
1. Verify EventBridge rule:
   ```bash
   aws events list-targets-by-rule \
     --rule lexohub-s3-document-upload-production
   ```

2. Check Lambda permissions:
   ```bash
   aws lambda get-policy \
     --function-name lexohub-lambda0-classification-production
   ```

3. Verify S3 EventBridge configuration:
   ```bash
   aws s3api get-bucket-notification-configuration \
     --bucket lexohub-documents-production
   ```

### Issue: Textract Job Not Starting

**Symptom:** Tier 1 Lambda executes but no Textract job

**Solution:**
1. Check IAM role permissions:
   ```bash
   aws iam get-role-policy \
     --role-name lexohub-lambda-execution-production \
     --policy-name TextractAccess
   ```

2. Verify SNS topic permissions:
   ```bash
   aws sns get-topic-attributes \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT:lexohub-textract-completion-production
   ```

### Issue: High Lambda Costs

**Symptom:** Unexpected Lambda charges

**Solution:**
1. Check provisioned concurrency usage:
   ```bash
   aws lambda get-provisioned-concurrency-config \
     --function-name lexohub-lambda0-classification-production \
     --qualifier $LATEST
   ```

2. Review Lambda duration metrics:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name Duration \
     --dimensions Name=FunctionName,Value=lexohub-lambda0-classification-production \
     --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 3600 \
     --statistics Average,Maximum
   ```

## Rollback

To remove all Phase 1 infrastructure:

```bash
aws cloudformation delete-stack --stack-name lexohub-phase1-monitoring
aws cloudformation delete-stack --stack-name lexohub-phase1-queues

aws lambda delete-function --function-name lexohub-lambda0-classification-production
aws lambda delete-function --function-name lexohub-tier1-extraction-production

aws cloudformation delete-stack --stack-name lexohub-phase1-storage
```

**Warning:** This will delete all data. Ensure you have backups.

## Next Steps

After Phase 1 is deployed and tested:

1. **Phase 2**: Deploy orchestration (Step Functions, Tier 2 Lambda)
2. **Phase 3**: Implement AI integration (Bedrock, A2I)
3. **Phase 4**: Add template learning and Tier 0 processing
4. **Phase 5**: Production hardening and disaster recovery

## Support

For deployment issues:
1. Check CloudWatch Logs
2. Review CloudFormation events
3. Verify IAM permissions
4. Check AWS service health dashboard

## Security Notes

- All data encrypted at rest
- IAM roles use least-privilege access
- S3 bucket blocks public access
- VPC deployment recommended for production (Phase 5)
- Enable CloudTrail for audit logging
