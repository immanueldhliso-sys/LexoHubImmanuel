# LexoHub AWS SAM Deployment Guide

## Overview

This guide covers deploying the LexoHub document processing infrastructure using AWS SAM (Serverless Application Model).

## Why AWS SAM?

AWS SAM is the **mandatory deployment method** for LexoHub's AWS infrastructure because it provides:

- **Simplified Serverless Development**: Purpose-built for Lambda, API Gateway, and DynamoDB
- **Local Testing**: Test Lambda functions locally before deployment
- **Built-in Best Practices**: Automatic IAM role generation with least-privilege
- **Faster Deployments**: Incremental deployments and change sets
- **Integrated Debugging**: Built-in debugging support for Lambda functions
- **CloudFormation Compatible**: Uses CloudFormation under the hood

## Prerequisites

### Required Tools

1. **AWS SAM CLI** (v1.100.0+)
   ```bash
   # Windows (via MSI installer)
   # Download from: https://github.com/aws/aws-sam-cli/releases/latest
   
   # macOS
   brew install aws-sam-cli
   
   # Linux
   pip install aws-sam-cli
   
   # Verify installation
   sam --version
   ```

2. **AWS CLI** (v2.x)
   ```bash
   aws --version
   ```

3. **Python 3.11+**
   ```bash
   python --version
   ```

4. **Docker** (for local testing and container builds)
   ```bash
   docker --version
   ```

### AWS Configuration

```bash
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

## Project Structure

```
aws/
├── template.yaml              # SAM template (main infrastructure)
├── samconfig.toml            # SAM configuration for environments
├── lambda/
│   ├── lambda0-classification/
│   │   ├── index.py
│   │   └── requirements.txt
│   └── tier1-simple-extraction/
│       ├── index.py
│       └── requirements.txt
├── events/
│   └── s3-event.json         # Test event for local invocation
└── scripts/
    ├── deploy-sam.ps1        # PowerShell deployment script
    └── deploy-sam.sh         # Bash deployment script
```

## Deployment Methods

### Method 1: Guided Deployment (First Time)

**Windows:**
```powershell
cd aws\scripts
.\deploy-sam.ps1 -Environment production -Guided
```

**Linux/Mac:**
```bash
cd aws/scripts
chmod +x deploy-sam.sh
./deploy-sam.sh production true
```

The guided deployment will prompt you for:
- Stack name
- AWS Region
- Parameter values
- Confirmation before deployment
- Save configuration to samconfig.toml

### Method 2: Automated Deployment

After initial guided deployment:

**Windows:**
```powershell
.\deploy-sam.ps1 -Environment production
```

**Linux/Mac:**
```bash
./deploy-sam.sh production
```

### Method 3: Manual SAM Commands

```bash
cd aws

# Build the application
sam build --use-container

# Deploy with saved configuration
sam deploy --config-env production

# Or deploy with guided prompts
sam deploy --guided
```

## Environment-Specific Deployments

### Development Environment
```bash
sam deploy --config-env development
```

### Staging Environment
```bash
sam deploy --config-env staging
```

### Production Environment
```bash
sam deploy --config-env production
```

## Local Testing

### Test Lambda Functions Locally

**Invoke Lambda 0 with test event:**
```bash
cd aws
sam local invoke Lambda0ClassificationFunction -e events/s3-event.json
```

**Start local API (if API Gateway is added):**
```bash
sam local start-api
```

**Start Lambda endpoint:**
```bash
sam local start-lambda
```

### Test with Custom Events

Create custom event files in `aws/events/`:

```json
{
  "Records": [{
    "detail": {
      "bucket": {"name": "test-bucket"},
      "object": {"key": "test.pdf"}
    }
  }]
}
```

Then invoke:
```bash
sam local invoke Lambda0ClassificationFunction -e events/custom-event.json
```

## Monitoring and Debugging

### View Lambda Logs

**Real-time log tailing:**
```bash
sam logs -n Lambda0ClassificationFunction --stack-name lexohub-phase1-prod --tail
```

**View recent logs:**
```bash
sam logs -n Lambda0ClassificationFunction --stack-name lexohub-phase1-prod
```

**Filter logs by time:**
```bash
sam logs -n Lambda0ClassificationFunction --stack-name lexohub-phase1-prod \
  --start-time '10min ago' --end-time '5min ago'
```

### CloudWatch Insights

```bash
aws logs start-query \
  --log-group-name /aws/lambda/lexohub-lambda0-classification-production \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc'
```

## SAM Template Structure

### Key Sections

**Globals:**
```yaml
Globals:
  Function:
    Runtime: python3.11
    Timeout: 300
    MemorySize: 512
```

**Lambda Function:**
```yaml
Lambda0ClassificationFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: lambda/lambda0-classification/
    Handler: index.lambda_handler
    Events:
      S3Event:
        Type: EventBridgeRule
    Policies:
      - S3ReadPolicy
      - DynamoDBReadPolicy
```

**DynamoDB Table:**
```yaml
DocumentMetadataTable:
  Type: AWS::DynamoDB::Table
  Properties:
    BillingMode: PAY_PER_REQUEST
```

## Common Operations

### Update Lambda Function Only

```bash
sam build
sam deploy --no-confirm-changeset
```

### Update with Parameter Changes

```bash
sam deploy --parameter-overrides Environment=staging
```

### Delete Stack

```bash
sam delete --stack-name lexohub-phase1-prod
```

### Validate Template

```bash
sam validate --lint
```

### Package for Manual Deployment

```bash
sam package --output-template-file packaged.yaml --s3-bucket my-deployment-bucket
```

## Troubleshooting

### Build Failures

**Issue:** Python dependencies not installing
```bash
# Use container build
sam build --use-container

# Or specify Python version
sam build --use-container --build-image public.ecr.aws/sam/build-python3.11
```

**Issue:** Docker not running
```bash
# Start Docker Desktop or Docker daemon
# Then retry build
```

### Deployment Failures

**Issue:** Insufficient IAM permissions
```bash
# Check your IAM user/role has these policies:
# - AWSCloudFormationFullAccess
# - IAMFullAccess
# - AWSLambda_FullAccess
# - AmazonS3FullAccess
# - AmazonDynamoDBFullAccess
```

**Issue:** Stack already exists
```bash
# Update existing stack
sam deploy --no-confirm-changeset

# Or delete and recreate
sam delete --stack-name lexohub-phase1-prod
sam deploy --guided
```

### Local Testing Issues

**Issue:** Lambda timeout locally
```bash
# Increase timeout in template.yaml
Timeout: 900  # 15 minutes
```

**Issue:** Environment variables not set
```bash
# Create env.json file
{
  "Lambda0ClassificationFunction": {
    "TEMPLATE_CACHE_TABLE": "lexohub-template-cache-production"
  }
}

# Use with local invoke
sam local invoke -n env.json
```

## Best Practices

### 1. Use Container Builds
Always use `--use-container` to ensure consistent builds:
```bash
sam build --use-container
```

### 2. Version Control samconfig.toml
Commit `samconfig.toml` to version control for reproducible deployments.

### 3. Use Parameter Overrides
Store environment-specific values in samconfig.toml:
```toml
[production.deploy.parameters]
parameter_overrides = "Environment=production BucketName=prod-bucket"
```

### 4. Enable Tracing
Add X-Ray tracing to Lambda functions:
```yaml
Globals:
  Function:
    Tracing: Active
```

### 5. Use Layers for Dependencies
For large dependencies, create Lambda layers:
```yaml
DependenciesLayer:
  Type: AWS::Serverless::LayerVersion
  Properties:
    ContentUri: dependencies/
    CompatibleRuntimes:
      - python3.11
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy SAM Application

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/setup-sam@v2
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: sam build --use-container
      - run: sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
```

### GitLab CI

```yaml
deploy:
  image: public.ecr.aws/sam/build-python3.11
  script:
    - sam build --use-container
    - sam deploy --no-confirm-changeset
  only:
    - main
```

## Cost Optimization

### Use SAM Policy Templates
SAM provides pre-built policy templates with least-privilege:
```yaml
Policies:
  - S3ReadPolicy:
      BucketName: !Ref DocumentStorageBucket
  - DynamoDBReadPolicy:
      TableName: !Ref MetadataTable
```

### Monitor Costs
```bash
aws cloudformation estimate-template-cost \
  --template-body file://template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production
```

## Migration from CloudFormation

If you have existing CloudFormation templates:

1. Add SAM Transform:
```yaml
Transform: AWS::Serverless-2016-10-31
```

2. Convert Lambda resources:
```yaml
# CloudFormation
Type: AWS::Lambda::Function

# SAM
Type: AWS::Serverless::Function
```

3. Simplify IAM policies with SAM policy templates

4. Deploy with SAM CLI

## Support and Resources

- **SAM Documentation**: https://docs.aws.amazon.com/serverless-application-model/
- **SAM CLI Reference**: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html
- **SAM Policy Templates**: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-templates.html
- **SAM Examples**: https://github.com/aws/serverless-application-model/tree/master/examples

## Quick Reference

```bash
# Build
sam build --use-container

# Validate
sam validate --lint

# Deploy
sam deploy --guided                    # First time
sam deploy --config-env production     # Subsequent

# Local testing
sam local invoke FunctionName -e events/event.json
sam local start-api
sam local start-lambda

# Logs
sam logs -n FunctionName --tail
sam logs -n FunctionName --start-time '1h ago'

# Delete
sam delete --stack-name stack-name

# List stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
```

---

**Remember**: AWS SAM is the **only approved deployment method** for LexoHub AWS infrastructure. Do not use raw CloudFormation templates or AWS CDK.
