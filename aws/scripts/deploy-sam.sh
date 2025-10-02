#!/bin/bash

set -e

ENVIRONMENT=${1:-production}
GUIDED=${2:-false}
SKIP_BUILD=${3:-false}

echo "========================================"
echo "LexoHub SAM Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "========================================"
echo ""

test_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v sam &> /dev/null; then
        echo "ERROR: AWS SAM CLI not found. Please install SAM CLI."
        echo "Installation: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
        exit 1
    fi
    echo "✓ SAM CLI installed: $(sam --version)"
    
    if ! command -v aws &> /dev/null; then
        echo "ERROR: AWS CLI not found. Please install AWS CLI v2."
        exit 1
    fi
    echo "✓ AWS CLI installed: $(aws --version)"
    
    if ! command -v python &> /dev/null; then
        echo "ERROR: Python not found. Please install Python 3.11+."
        exit 1
    fi
    echo "✓ Python installed: $(python --version)"
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "ERROR: AWS credentials not configured. Run 'aws configure'."
        exit 1
    fi
    echo "✓ AWS credentials configured"
    
    local account=$(aws sts get-caller-identity --query Account --output text)
    local user=$(aws sts get-caller-identity --query Arn --output text)
    echo "  Account: $account"
    echo "  User: $user"
    
    echo ""
}

build_sam_application() {
    echo "Building SAM application..."
    
    cd "$(dirname "$0")/.."
    
    sam build --use-container
    
    if [ $? -ne 0 ]; then
        echo "ERROR: SAM build failed."
        exit 1
    fi
    
    echo "✓ SAM build completed successfully"
    echo ""
}

deploy_sam_application() {
    local is_guided=$1
    
    echo "Deploying SAM application..."
    
    cd "$(dirname "$0")/.."
    
    if [ "$is_guided" = "true" ]; then
        echo "Running guided deployment..."
        sam deploy --guided --config-env "$ENVIRONMENT"
    else
        sam deploy --config-env "$ENVIRONMENT"
    fi
    
    if [ $? -ne 0 ]; then
        echo "ERROR: SAM deployment failed."
        exit 1
    fi
    
    echo "✓ SAM deployment completed successfully"
    echo ""
}

get_stack_outputs() {
    echo "Retrieving stack outputs..."
    
    local stack_name
    case $ENVIRONMENT in
        development)
            stack_name="lexohub-phase1-dev"
            ;;
        staging)
            stack_name="lexohub-phase1-staging"
            ;;
        production)
            stack_name="lexohub-phase1-prod"
            ;;
    esac
    
    echo ""
    echo "Stack Outputs:"
    echo "========================================"
    
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
    
    echo ""
}

test_prerequisites

if [ "$SKIP_BUILD" != "true" ]; then
    build_sam_application
else
    echo "Skipping build step..."
    echo ""
fi

deploy_sam_application "$GUIDED"

get_stack_outputs

echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Test Lambda functions with 'sam local invoke'"
echo "2. Upload a test document to S3 bucket"
echo "3. Monitor CloudWatch Logs for processing"
echo "4. Check DynamoDB tables for results"
echo ""
echo "Useful Commands:"
echo "  sam logs -n Lambda0ClassificationFunction --stack-name $stack_name --tail"
echo "  sam local invoke Lambda0ClassificationFunction -e events/s3-event.json"
echo "  aws s3 cp test.pdf s3://lexohub-documents-$ENVIRONMENT/matters/test/"
