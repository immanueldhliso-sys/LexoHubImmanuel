# AWS SAM Migration Complete

## Summary

The LexoHub AWS infrastructure has been successfully migrated to use **AWS SAM (Serverless Application Model)** as the mandatory deployment method.

## What Changed

### ✅ New SAM Infrastructure

1. **Main SAM Template** (`template.yaml`)
   - Replaces all CloudFormation templates
   - Uses SAM-specific resource types (`AWS::Serverless::Function`)
   - Simplified Lambda function definitions
   - Built-in IAM policy templates
   - Automatic event source mappings

2. **SAM Configuration** (`samconfig.toml`)
   - Environment-specific configurations
   - Deployment parameters for dev/staging/production
   - Build and deployment settings

3. **SAM Deployment Scripts**
   - `deploy-sam.ps1` (PowerShell)
   - `deploy-sam.sh` (Bash)
   - Automated prerequisite checks
   - Guided and automated deployment modes

4. **Local Testing Support**
   - Test event files in `events/` directory
   - Local Lambda invocation capability
   - Docker-based local testing

5. **Comprehensive Documentation**
   - `SAM_DEPLOYMENT_GUIDE.md` - Complete SAM deployment guide
   - Updated `README.md` with SAM instructions
   - Migration guide and best practices

### 🗑️ Deprecated Files

The following CloudFormation-based files are **deprecated** and should not be used:

- `infrastructure/cloudformation/phase1-storage.yaml`
- `infrastructure/cloudformation/phase1-queues.yaml`
- `infrastructure/cloudformation/phase1-monitoring.yaml`
- `scripts/deploy-phase1.ps1`
- `scripts/deploy-phase1.sh`

**Note**: These files are kept for reference but should not be used for deployment.

## Key Benefits of SAM

### 1. Simplified Development
```yaml
# CloudFormation (verbose)
Lambda0Function:
  Type: AWS::Lambda::Function
  Properties:
    Runtime: python3.11
    Handler: index.handler
    Code:
      S3Bucket: deployment-bucket
      S3Key: lambda.zip
    Role: !GetAtt LambdaRole.Arn

# SAM (concise)
Lambda0Function:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: lambda/lambda0/
    Handler: index.handler
    Policies:
      - S3ReadPolicy:
          BucketName: !Ref Bucket
```

### 2. Local Testing
```bash
# Test Lambda locally before deployment
sam local invoke Lambda0ClassificationFunction -e events/s3-event.json

# Start local API
sam local start-api

# Debug with breakpoints
sam local invoke --debug
```

### 3. Built-in Best Practices
- Automatic least-privilege IAM policies
- Event source mappings
- API Gateway integration
- CloudWatch Logs configuration
- X-Ray tracing support

### 4. Faster Deployments
- Incremental deployments
- Change set previews
- Parallel builds
- Cached dependencies

## Migration Guide

### For New Deployments

Use SAM from the start:

```bash
cd aws
sam build --use-container
sam deploy --guided --config-env production
```

### For Existing CloudFormation Stacks

If you already deployed using CloudFormation:

1. **Export existing resources** (if needed)
2. **Delete CloudFormation stack**:
   ```bash
   aws cloudformation delete-stack --stack-name lexohub-phase1-storage
   ```
3. **Deploy with SAM**:
   ```bash
   sam deploy --guided
   ```

**Note**: This will recreate resources. Ensure you have backups of critical data.

## Quick Start

### 1. Install SAM CLI

**Windows:**
Download from https://github.com/aws/aws-sam-cli/releases/latest

**macOS:**
```bash
brew install aws-sam-cli
```

**Linux:**
```bash
pip install aws-sam-cli
```

### 2. Configure AWS Credentials

```bash
aws configure
```

### 3. Deploy

**Guided deployment (first time):**
```bash
cd aws/scripts
./deploy-sam.sh production true
```

**Automated deployment:**
```bash
./deploy-sam.sh production
```

### 4. Test Locally

```bash
cd aws
sam local invoke Lambda0ClassificationFunction -e events/s3-event.json
```

### 5. Monitor

```bash
sam logs -n Lambda0ClassificationFunction --tail
```

## Updated Directory Structure

```
aws/
├── template.yaml                    # ✅ SAM template (MAIN FILE)
├── samconfig.toml                   # ✅ SAM configuration
├── SAM_DEPLOYMENT_GUIDE.md          # ✅ Complete SAM guide
├── README.md                        # ✅ Updated with SAM instructions
├── lambda/
│   ├── lambda0-classification/
│   │   ├── index.py
│   │   └── requirements.txt
│   └── tier1-simple-extraction/
│       ├── index.py
│       └── requirements.txt
├── events/
│   └── s3-event.json               # ✅ Test events for local testing
├── scripts/
│   ├── deploy-sam.ps1              # ✅ SAM deployment (PowerShell)
│   ├── deploy-sam.sh               # ✅ SAM deployment (Bash)
│   ├── deploy-phase1.ps1           # ⚠️ DEPRECATED
│   └── deploy-phase1.sh            # ⚠️ DEPRECATED
└── infrastructure/
    └── cloudformation/              # ⚠️ DEPRECATED (kept for reference)
        ├── phase1-storage.yaml
        ├── phase1-queues.yaml
        └── phase1-monitoring.yaml
```

## System Prompt Updated

The LexoHub Constitution (`Systemprompts/LEXO_CONSTITUTION.md`) has been updated with:

```markdown
### AWS Infrastructure Deployment Standard
**CRITICAL**: All AWS infrastructure MUST be deployed using AWS SAM (Serverless Application Model).
- **No CloudFormation templates** - Convert to SAM templates
- **No CDK** - Use SAM for all infrastructure definitions
- **No manual AWS CLI deployments** - Use `sam deploy` commands
- **SAM Template Format**: Use `template.yaml` with SAM-specific resource types
- **Deployment Commands**: `sam build`, `sam deploy --guided`, `sam deploy`
- **Local Testing**: Use `sam local invoke` and `sam local start-api` for testing
```

## Common Commands

### Build
```bash
sam build --use-container
```

### Deploy
```bash
# First time (guided)
sam deploy --guided --config-env production

# Subsequent deployments
sam deploy --config-env production
```

### Local Testing
```bash
# Invoke function
sam local invoke Lambda0ClassificationFunction -e events/s3-event.json

# Start API
sam local start-api

# Start Lambda endpoint
sam local start-lambda
```

### Monitoring
```bash
# Tail logs
sam logs -n Lambda0ClassificationFunction --tail

# View recent logs
sam logs -n Lambda0ClassificationFunction --start-time '1h ago'
```

### Cleanup
```bash
sam delete --stack-name lexohub-phase1-prod
```

## Troubleshooting

### SAM CLI Not Found
```bash
# Install SAM CLI
pip install aws-sam-cli

# Or on macOS
brew install aws-sam-cli
```

### Docker Not Running
```bash
# Start Docker Desktop
# Then retry build
sam build --use-container
```

### Build Failures
```bash
# Use specific Python image
sam build --use-container --build-image public.ecr.aws/sam/build-python3.11
```

### Deployment Failures
```bash
# Check IAM permissions
aws iam get-user

# Validate template
sam validate --lint

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name lexohub-phase1-prod
```

## Next Steps

1. ✅ **Phase 1 Complete** - Foundation infrastructure with SAM
2. 🚧 **Phase 2** - Add Step Functions orchestration (SAM template)
3. 🚧 **Phase 3** - Implement Tier 2 and Tier 3 Lambda functions
4. 🚧 **Phase 4** - Add Amazon Bedrock integration
5. 🚧 **Phase 5** - Implement A2I human review workflow

## Support

For SAM-related issues:
- **Documentation**: https://docs.aws.amazon.com/serverless-application-model/
- **GitHub**: https://github.com/aws/aws-sam-cli
- **Examples**: https://github.com/aws/serverless-application-model/tree/master/examples

For LexoHub-specific issues:
- Check `SAM_DEPLOYMENT_GUIDE.md`
- Review CloudWatch Logs
- Verify IAM permissions

---

**Migration Date**: 2025-10-02  
**Status**: ✅ Complete  
**Deployment Method**: AWS SAM (Mandatory)
