param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('development', 'staging', 'production')]
    [string]$Environment = 'production',
    
    [Parameter(Mandatory=$false)]
    [switch]$Guided = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LexoHub SAM Deployment Script" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    $samVersion = sam --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: AWS SAM CLI not found. Please install SAM CLI." -ForegroundColor Red
        Write-Host "Installation: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ SAM CLI installed: $samVersion" -ForegroundColor Green
    
    $awsVersion = aws --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: AWS CLI not found. Please install AWS CLI v2." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ AWS CLI installed: $awsVersion" -ForegroundColor Green
    
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Python not found. Please install Python 3.11+." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Python installed: $pythonVersion" -ForegroundColor Green
    
    $awsIdentity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: AWS credentials not configured. Run 'aws configure'." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ AWS credentials configured" -ForegroundColor Green
    Write-Host "  Account: $($awsIdentity.Account)" -ForegroundColor Gray
    Write-Host "  User: $($awsIdentity.Arn)" -ForegroundColor Gray
    
    Write-Host ""
}

function Build-SAMApplication {
    Write-Host "Building SAM application..." -ForegroundColor Yellow
    
    Push-Location "$PSScriptRoot\.."
    
    sam build --use-container
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: SAM build failed." -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "✓ SAM build completed successfully" -ForegroundColor Green
    Pop-Location
    Write-Host ""
}

function Deploy-SAMApplication {
    param(
        [bool]$IsGuided
    )
    
    Write-Host "Deploying SAM application..." -ForegroundColor Yellow
    
    Push-Location "$PSScriptRoot\.."
    
    if ($IsGuided) {
        Write-Host "Running guided deployment..." -ForegroundColor Yellow
        sam deploy --guided --config-env $Environment
    } else {
        sam deploy --config-env $Environment
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: SAM deployment failed." -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "✓ SAM deployment completed successfully" -ForegroundColor Green
    Pop-Location
    Write-Host ""
}

function Get-StackOutputs {
    Write-Host "Retrieving stack outputs..." -ForegroundColor Yellow
    
    $stackName = switch ($Environment) {
        'development' { 'lexohub-phase1-dev' }
        'staging' { 'lexohub-phase1-staging' }
        'production' { 'lexohub-phase1-prod' }
    }
    
    $outputs = aws cloudformation describe-stacks `
        --stack-name $stackName `
        --query 'Stacks[0].Outputs' | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "Stack Outputs:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    foreach ($output in $outputs) {
        Write-Host "$($output.OutputKey): $($output.OutputValue)" -ForegroundColor White
    }
    
    Write-Host ""
}

Test-Prerequisites

if (-not $SkipBuild) {
    Build-SAMApplication
} else {
    Write-Host "Skipping build step..." -ForegroundColor Yellow
    Write-Host ""
}

Deploy-SAMApplication -IsGuided $Guided

Get-StackOutputs

Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test Lambda functions with 'sam local invoke'" -ForegroundColor White
Write-Host "2. Upload a test document to S3 bucket" -ForegroundColor White
Write-Host "3. Monitor CloudWatch Logs for processing" -ForegroundColor White
Write-Host "4. Check DynamoDB tables for results" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  sam logs -n Lambda0ClassificationFunction --stack-name $stackName --tail" -ForegroundColor Cyan
Write-Host "  sam local invoke Lambda0ClassificationFunction -e events/s3-event.json" -ForegroundColor Cyan
Write-Host "  aws s3 cp test.pdf s3://lexohub-documents-$Environment/matters/test/" -ForegroundColor Cyan
