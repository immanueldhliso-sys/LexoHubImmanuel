param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('development', 'staging', 'production')]
    [string]$Environment = 'production',
    
    [Parameter(Mandatory=$false)]
    [string]$Region = 'us-east-1'
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LexoHub AWS Quick Setup" -ForegroundColor Cyan
Write-Host "This script will deploy Phase 1 infrastructure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking prerequisites..." -ForegroundColor Yellow

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
Write-Host "Deployment Configuration:" -ForegroundColor Yellow
Write-Host "  Environment: $Environment" -ForegroundColor White
Write-Host "  Region: $Region" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue with deployment? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting deployment..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$scriptDir\deploy-phase1.ps1" -Environment $Environment -Region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Quick Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Copy .env.aws.example to .env.local" -ForegroundColor White
    Write-Host "2. Update .env.local with your AWS resource names" -ForegroundColor White
    Write-Host "3. Run 'npm install' to install AWS SDK dependencies" -ForegroundColor White
    Write-Host "4. Test document upload to S3 bucket" -ForegroundColor White
    Write-Host ""
    Write-Host "View CloudWatch Dashboard:" -ForegroundColor Yellow
    Write-Host "https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=LexoHub-DocumentProcessing-$Environment" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Deployment failed. Check error messages above." -ForegroundColor Red
    exit 1
}
