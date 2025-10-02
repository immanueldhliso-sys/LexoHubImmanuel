param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('development', 'staging', 'production')]
    [string]$Environment = 'production',
    
    [Parameter(Mandatory=$false)]
    [string]$Region = 'us-east-1',
    
    [Parameter(Mandatory=$false)]
    [string]$StackName = 'lexohub-phase1'
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LexoHub Phase 1 Deployment Script" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Deploy-CloudFormationStack {
    param(
        [string]$StackName,
        [string]$TemplateFile,
        [hashtable]$Parameters
    )
    
    Write-Host "Deploying stack: $StackName" -ForegroundColor Yellow
    
    $paramString = ($Parameters.GetEnumerator() | ForEach-Object { 
        "ParameterKey=$($_.Key),ParameterValue=$($_.Value)" 
    }) -join ' '
    
    $stackExists = aws cloudformation describe-stacks --stack-name $StackName --region $Region 2>$null
    
    if ($stackExists) {
        Write-Host "Stack exists. Updating..." -ForegroundColor Yellow
        aws cloudformation update-stack `
            --stack-name $StackName `
            --template-body file://$TemplateFile `
            --parameters $paramString `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $Region
    } else {
        Write-Host "Creating new stack..." -ForegroundColor Yellow
        aws cloudformation create-stack `
            --stack-name $StackName `
            --template-body file://$TemplateFile `
            --parameters $paramString `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $Region
    }
    
    Write-Host "Waiting for stack operation to complete..." -ForegroundColor Yellow
    aws cloudformation wait stack-create-complete --stack-name $StackName --region $Region 2>$null
    if ($LASTEXITCODE -ne 0) {
        aws cloudformation wait stack-update-complete --stack-name $StackName --region $Region
    }
    
    Write-Host "Stack $StackName deployed successfully!" -ForegroundColor Green
}

function Deploy-Lambda {
    param(
        [string]$FunctionName,
        [string]$SourceDir,
        [string]$Handler,
        [string]$Runtime,
        [string]$RoleArn,
        [int]$MemorySize = 512,
        [int]$Timeout = 300,
        [hashtable]$Environment = @{}
    )
    
    Write-Host "Deploying Lambda function: $FunctionName" -ForegroundColor Yellow
    
    $zipFile = "$env:TEMP\$FunctionName.zip"
    
    Push-Location $SourceDir
    
    if (Test-Path "requirements.txt") {
        Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
        pip install -r requirements.txt -t . --upgrade
    }
    
    Write-Host "Creating deployment package..." -ForegroundColor Yellow
    Compress-Archive -Path * -DestinationPath $zipFile -Force
    
    Pop-Location
    
    $functionExists = aws lambda get-function --function-name $FunctionName --region $Region 2>$null
    
    $envVars = ($Environment.GetEnumerator() | ForEach-Object { 
        "$($_.Key)=$($_.Value)" 
    }) -join ','
    
    if ($functionExists) {
        Write-Host "Updating function code..." -ForegroundColor Yellow
        aws lambda update-function-code `
            --function-name $FunctionName `
            --zip-file fileb://$zipFile `
            --region $Region
        
        Write-Host "Updating function configuration..." -ForegroundColor Yellow
        aws lambda update-function-configuration `
            --function-name $FunctionName `
            --handler $Handler `
            --runtime $Runtime `
            --role $RoleArn `
            --memory-size $MemorySize `
            --timeout $Timeout `
            --environment "Variables={$envVars}" `
            --region $Region
    } else {
        Write-Host "Creating new function..." -ForegroundColor Yellow
        aws lambda create-function `
            --function-name $FunctionName `
            --runtime $Runtime `
            --role $RoleArn `
            --handler $Handler `
            --zip-file fileb://$zipFile `
            --memory-size $MemorySize `
            --timeout $Timeout `
            --environment "Variables={$envVars}" `
            --region $Region
    }
    
    Remove-Item $zipFile -Force
    
    Write-Host "Lambda function $FunctionName deployed successfully!" -ForegroundColor Green
}

Write-Host "Step 1: Deploying Storage Infrastructure..." -ForegroundColor Cyan
Deploy-CloudFormationStack `
    -StackName "$StackName-storage" `
    -TemplateFile "aws/infrastructure/cloudformation/phase1-storage.yaml" `
    -Parameters @{
        Environment = $Environment
    }

Write-Host ""
Write-Host "Step 2: Getting Stack Outputs..." -ForegroundColor Cyan
$outputs = aws cloudformation describe-stacks `
    --stack-name "$StackName-storage" `
    --region $Region `
    --query 'Stacks[0].Outputs' | ConvertFrom-Json

$bucketName = ($outputs | Where-Object { $_.OutputKey -eq 'DocumentBucketName' }).OutputValue
$metadataTable = ($outputs | Where-Object { $_.OutputKey -eq 'MetadataTableName' }).OutputValue
$templateCacheTable = ($outputs | Where-Object { $_.OutputKey -eq 'TemplateCacheTableName' }).OutputValue
$lambdaRoleArn = ($outputs | Where-Object { $_.OutputKey -eq 'LambdaExecutionRoleArn' }).OutputValue

Write-Host "Bucket: $bucketName" -ForegroundColor Gray
Write-Host "Metadata Table: $metadataTable" -ForegroundColor Gray
Write-Host "Template Cache: $templateCacheTable" -ForegroundColor Gray
Write-Host "Lambda Role: $lambdaRoleArn" -ForegroundColor Gray

Write-Host ""
Write-Host "Step 3: Deploying Lambda 0 Classification Function..." -ForegroundColor Cyan
Deploy-Lambda `
    -FunctionName "lexohub-lambda0-classification-$Environment" `
    -SourceDir "aws/lambda/lambda0-classification" `
    -Handler "index.lambda_handler" `
    -Runtime "python3.11" `
    -RoleArn $lambdaRoleArn `
    -MemorySize 512 `
    -Timeout 300 `
    -Environment @{
        TEMPLATE_CACHE_TABLE = $templateCacheTable
        DOCUMENT_BUCKET = $bucketName
        ENVIRONMENT = $Environment
    }

Write-Host ""
Write-Host "Step 4: Deploying Tier 1 Extraction Function..." -ForegroundColor Cyan
Deploy-Lambda `
    -FunctionName "lexohub-tier1-extraction-$Environment" `
    -SourceDir "aws/lambda/tier1-simple-extraction" `
    -Handler "index.lambda_handler" `
    -Runtime "python3.11" `
    -RoleArn $lambdaRoleArn `
    -MemorySize 1024 `
    -Timeout 900 `
    -Environment @{
        METADATA_TABLE = $metadataTable
        DOCUMENT_BUCKET = $bucketName
        ENVIRONMENT = $Environment
    }

Write-Host ""
Write-Host "Step 5: Configuring Provisioned Concurrency for Lambda 0..." -ForegroundColor Cyan
aws lambda put-provisioned-concurrency-config `
    --function-name "lexohub-lambda0-classification-$Environment" `
    --provisioned-concurrent-executions 2 `
    --qualifier '$LATEST' `
    --region $Region

Write-Host ""
Write-Host "Step 6: Deploying Monitoring Dashboard..." -ForegroundColor Cyan
Deploy-CloudFormationStack `
    -StackName "$StackName-monitoring" `
    -TemplateFile "aws/infrastructure/cloudformation/phase1-monitoring.yaml" `
    -Parameters @{
        Environment = $Environment
        Lambda0FunctionName = "lexohub-lambda0-classification-$Environment"
        Tier1FunctionName = "lexohub-tier1-extraction-$Environment"
        Tier0QueueName = "lexohub-tier0-queue-$Environment"
        Tier1QueueName = "lexohub-tier1-queue-$Environment"
        Tier2QueueName = "lexohub-tier2-queue-$Environment"
        Tier3QueueName = "lexohub-tier3-queue-$Environment"
    }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Phase 1 Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure EventBridge rule to trigger Lambda 0 on S3 uploads" -ForegroundColor White
Write-Host "2. Create SQS queues for each processing tier" -ForegroundColor White
Write-Host "3. Set up SNS topic for Textract completion notifications" -ForegroundColor White
Write-Host "4. Test the pipeline with sample documents" -ForegroundColor White
Write-Host ""
Write-Host "Resources Created:" -ForegroundColor Yellow
Write-Host "- S3 Bucket: $bucketName" -ForegroundColor White
Write-Host "- DynamoDB Tables: $metadataTable, $templateCacheTable" -ForegroundColor White
Write-Host "- Lambda Functions: lexohub-lambda0-classification-$Environment, lexohub-tier1-extraction-$Environment" -ForegroundColor White
Write-Host "- CloudWatch Dashboard: LexoHub-DocumentProcessing-$Environment" -ForegroundColor White
