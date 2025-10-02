#!/bin/bash

set -e

ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}
STACK_NAME=${3:-lexohub-phase1}

echo "========================================"
echo "LexoHub Phase 1 Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "========================================"
echo ""

deploy_cloudformation_stack() {
    local stack_name=$1
    local template_file=$2
    shift 2
    local parameters=("$@")
    
    echo "Deploying stack: $stack_name"
    
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$REGION" &>/dev/null; then
        echo "Stack exists. Updating..."
        aws cloudformation update-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --parameters "${parameters[@]}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "$REGION" || true
        
        echo "Waiting for stack update to complete..."
        aws cloudformation wait stack-update-complete --stack-name "$stack_name" --region "$REGION"
    else
        echo "Creating new stack..."
        aws cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --parameters "${parameters[@]}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "$REGION"
        
        echo "Waiting for stack creation to complete..."
        aws cloudformation wait stack-create-complete --stack-name "$stack_name" --region "$REGION"
    fi
    
    echo "Stack $stack_name deployed successfully!"
}

deploy_lambda() {
    local function_name=$1
    local source_dir=$2
    local handler=$3
    local runtime=$4
    local role_arn=$5
    local memory_size=$6
    local timeout=$7
    shift 7
    local env_vars=("$@")
    
    echo "Deploying Lambda function: $function_name"
    
    local zip_file="/tmp/${function_name}.zip"
    
    cd "$source_dir"
    
    if [ -f "requirements.txt" ]; then
        echo "Installing Python dependencies..."
        pip install -r requirements.txt -t . --upgrade
    fi
    
    echo "Creating deployment package..."
    zip -r "$zip_file" . -x "*.git*" -x "*__pycache__*"
    
    cd - > /dev/null
    
    local env_string=""
    if [ ${#env_vars[@]} -gt 0 ]; then
        env_string="Variables={"
        for var in "${env_vars[@]}"; do
            env_string+="$var,"
        done
        env_string="${env_string%,}}"
    fi
    
    if aws lambda get-function --function-name "$function_name" --region "$REGION" &>/dev/null; then
        echo "Updating function code..."
        aws lambda update-function-code \
            --function-name "$function_name" \
            --zip-file "fileb://$zip_file" \
            --region "$REGION"
        
        echo "Updating function configuration..."
        aws lambda update-function-configuration \
            --function-name "$function_name" \
            --handler "$handler" \
            --runtime "$runtime" \
            --role "$role_arn" \
            --memory-size "$memory_size" \
            --timeout "$timeout" \
            --environment "$env_string" \
            --region "$REGION"
    else
        echo "Creating new function..."
        aws lambda create-function \
            --function-name "$function_name" \
            --runtime "$runtime" \
            --role "$role_arn" \
            --handler "$handler" \
            --zip-file "fileb://$zip_file" \
            --memory-size "$memory_size" \
            --timeout "$timeout" \
            --environment "$env_string" \
            --region "$REGION"
    fi
    
    rm -f "$zip_file"
    
    echo "Lambda function $function_name deployed successfully!"
}

echo "Step 1: Deploying Storage Infrastructure..."
deploy_cloudformation_stack \
    "${STACK_NAME}-storage" \
    "aws/infrastructure/cloudformation/phase1-storage.yaml" \
    "ParameterKey=Environment,ParameterValue=$ENVIRONMENT"

echo ""
echo "Step 2: Getting Stack Outputs..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-storage" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`DocumentBucketName`].OutputValue' \
    --output text)

METADATA_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-storage" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`MetadataTableName`].OutputValue' \
    --output text)

TEMPLATE_CACHE_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-storage" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`TemplateCacheTableName`].OutputValue' \
    --output text)

LAMBDA_ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-storage" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaExecutionRoleArn`].OutputValue' \
    --output text)

echo "Bucket: $BUCKET_NAME"
echo "Metadata Table: $METADATA_TABLE"
echo "Template Cache: $TEMPLATE_CACHE_TABLE"
echo "Lambda Role: $LAMBDA_ROLE_ARN"

echo ""
echo "Step 3: Deploying Lambda 0 Classification Function..."
deploy_lambda \
    "lexohub-lambda0-classification-${ENVIRONMENT}" \
    "aws/lambda/lambda0-classification" \
    "index.lambda_handler" \
    "python3.11" \
    "$LAMBDA_ROLE_ARN" \
    512 \
    300 \
    "TEMPLATE_CACHE_TABLE=$TEMPLATE_CACHE_TABLE" \
    "DOCUMENT_BUCKET=$BUCKET_NAME" \
    "ENVIRONMENT=$ENVIRONMENT"

echo ""
echo "Step 4: Deploying Tier 1 Extraction Function..."
deploy_lambda \
    "lexohub-tier1-extraction-${ENVIRONMENT}" \
    "aws/lambda/tier1-simple-extraction" \
    "index.lambda_handler" \
    "python3.11" \
    "$LAMBDA_ROLE_ARN" \
    1024 \
    900 \
    "METADATA_TABLE=$METADATA_TABLE" \
    "DOCUMENT_BUCKET=$BUCKET_NAME" \
    "ENVIRONMENT=$ENVIRONMENT"

echo ""
echo "Step 5: Configuring Provisioned Concurrency for Lambda 0..."
aws lambda put-provisioned-concurrency-config \
    --function-name "lexohub-lambda0-classification-${ENVIRONMENT}" \
    --provisioned-concurrent-executions 2 \
    --qualifier '$LATEST' \
    --region "$REGION" || true

echo ""
echo "Step 6: Deploying Monitoring Dashboard..."
deploy_cloudformation_stack \
    "${STACK_NAME}-monitoring" \
    "aws/infrastructure/cloudformation/phase1-monitoring.yaml" \
    "ParameterKey=Environment,ParameterValue=$ENVIRONMENT" \
    "ParameterKey=Lambda0FunctionName,ParameterValue=lexohub-lambda0-classification-${ENVIRONMENT}" \
    "ParameterKey=Tier1FunctionName,ParameterValue=lexohub-tier1-extraction-${ENVIRONMENT}" \
    "ParameterKey=Tier0QueueName,ParameterValue=lexohub-tier0-queue-${ENVIRONMENT}" \
    "ParameterKey=Tier1QueueName,ParameterValue=lexohub-tier1-queue-${ENVIRONMENT}" \
    "ParameterKey=Tier2QueueName,ParameterValue=lexohub-tier2-queue-${ENVIRONMENT}" \
    "ParameterKey=Tier3QueueName,ParameterValue=lexohub-tier3-queue-${ENVIRONMENT}"

echo ""
echo "========================================"
echo "Phase 1 Deployment Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Configure EventBridge rule to trigger Lambda 0 on S3 uploads"
echo "2. Create SQS queues for each processing tier"
echo "3. Set up SNS topic for Textract completion notifications"
echo "4. Test the pipeline with sample documents"
echo ""
echo "Resources Created:"
echo "- S3 Bucket: $BUCKET_NAME"
echo "- DynamoDB Tables: $METADATA_TABLE, $TEMPLATE_CACHE_TABLE"
echo "- Lambda Functions: lexohub-lambda0-classification-${ENVIRONMENT}, lexohub-tier1-extraction-${ENVIRONMENT}"
echo "- CloudWatch Dashboard: LexoHub-DocumentProcessing-${ENVIRONMENT}"
