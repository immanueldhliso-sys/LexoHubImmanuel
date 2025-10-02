# LexoHub AWS SAM - Quick Start

## 🚀 5-Minute Deployment

### Prerequisites Check
```bash
sam --version    # Should be v1.100.0+
aws --version    # Should be v2.x
python --version # Should be 3.11+
docker --version # Required for builds
```

### Deploy in 3 Steps

**1. Install SAM CLI** (if not installed)
```bash
# macOS
brew install aws-sam-cli

# Windows: Download from
# https://github.com/aws/aws-sam-cli/releases/latest

# Linux
pip install aws-sam-cli
```

**2. Configure AWS**
```bash
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)
```

**3. Deploy**
```bash
cd aws/scripts

# Windows
.\deploy-sam.ps1 -Environment production -Guided

# Linux/Mac
./deploy-sam.sh production true
```

## 📋 Essential Commands

### Build & Deploy
```bash
cd aws
sam build --use-container              # Build with dependencies
sam deploy --guided                    # First deployment
sam deploy --config-env production     # Subsequent deployments
```

### Local Testing
```bash
sam local invoke Lambda0ClassificationFunction -e events/s3-event.json
sam local start-api                    # Start local API
```

### Monitoring
```bash
sam logs -n Lambda0ClassificationFunction --tail
sam logs -n Tier1ExtractionFunction --start-time '1h ago'
```

### Cleanup
```bash
sam delete --stack-name lexohub-phase1-prod
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `template.yaml` | Main SAM template (infrastructure as code) |
| `samconfig.toml` | Environment configurations |
| `scripts/deploy-sam.ps1` | PowerShell deployment script |
| `scripts/deploy-sam.sh` | Bash deployment script |
| `events/s3-event.json` | Test event for local invocation |

## 🔧 Common Issues

### "SAM CLI not found"
```bash
pip install aws-sam-cli
```

### "Docker not running"
Start Docker Desktop, then retry build

### "Access Denied"
Check IAM permissions:
- AWSCloudFormationFullAccess
- IAMFullAccess
- AWSLambda_FullAccess

### "Stack already exists"
```bash
sam deploy --no-confirm-changeset  # Update existing
# OR
sam delete --stack-name NAME       # Delete and recreate
```

## 📊 What Gets Deployed

- ✅ S3 bucket for document storage
- ✅ DynamoDB tables (metadata, template cache)
- ✅ Lambda functions (classification, extraction)
- ✅ SQS queues (4 tiers + validation + DLQ)
- ✅ SNS topic for Textract notifications
- ✅ CloudWatch alarms and monitoring
- ✅ IAM roles with least-privilege access

## 💰 Estimated Cost

~$19/month for 1000 documents/day (excludes Textract)

## 📚 Documentation

- **Full Guide**: `SAM_DEPLOYMENT_GUIDE.md`
- **Architecture**: `README.md`
- **Migration**: `SAM_MIGRATION_COMPLETE.md`
- **Constitution**: `../Systemprompts/LEXO_CONSTITUTION.md`

## 🎯 Next Steps After Deployment

1. **Test Upload**
   ```bash
   aws s3 cp test.pdf s3://lexohub-documents-production/matters/test/
   ```

2. **Check Logs**
   ```bash
   sam logs -n Lambda0ClassificationFunction --tail
   ```

3. **Verify DynamoDB**
   ```bash
   aws dynamodb scan --table-name lexohub-document-metadata-production --limit 5
   ```

4. **View Dashboard**
   ```
   https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards
   ```

## ⚠️ Important Notes

- **SAM is mandatory** - Do not use CloudFormation templates directly
- **Use container builds** - Always include `--use-container` flag
- **Test locally first** - Use `sam local invoke` before deploying
- **Monitor costs** - Check AWS Cost Explorer regularly

## 🆘 Get Help

```bash
sam --help
sam build --help
sam deploy --help
sam local --help
```

---

**Ready to deploy?** Run: `cd aws/scripts && ./deploy-sam.sh production true`
