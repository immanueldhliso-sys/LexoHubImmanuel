# Document Processing System - Setup Guide

## ✅ Files Created

All necessary files have been created and integrated:

### Components
- ✅ `src/components/document-processing/ProcessingProgressTracker.tsx`
- ✅ `src/components/document-processing/DocumentUploadWithProcessing.tsx`
- ✅ `src/components/matters/DocumentProcessingModal.tsx`

### Pages
- ✅ `src/pages/MattersPage.tsx` (updated with "Process Doc" button)

### Dependencies
- ✅ `package.json` updated with AWS SDK packages

## 🔧 Installation Steps

### 1. Install Dependencies

Run this command to install the new AWS SDK packages:

```bash
npm install
```

This will install:
- `@aws-sdk/client-s3` - S3 file storage
- `@aws-sdk/client-dynamodb` - Document metadata storage
- `@aws-sdk/client-bedrock-runtime` - AI processing
- `@aws-sdk/client-sqs` - Queue management
- `@aws-sdk/client-sns` - Notifications
- `@aws-sdk/client-textract` - OCR processing

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_access_key_here
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key_here
VITE_AWS_DOCUMENT_BUCKET=lexohub-documents-processing
```

### 3. AWS Infrastructure Setup

You need to deploy the AWS infrastructure:

#### Option A: Manual Setup
Follow the steps in `AWS_DOCUMENT_PROCESSING_IMPLEMENTATION.md`

#### Option B: Automated Deployment (Recommended)
Use the provided CloudFormation or Terraform scripts (to be created)

### 4. Test the Feature

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the Matters page
3. Click "Process Doc" on any matter card
4. Upload a PDF document
5. Watch the real-time processing progress

## 🎯 What's Working Now

### UI Components ✅
- Progress tracker with visual steps
- Document upload with drag-and-drop
- Real-time status updates
- Confidence score display
- Error handling

### Integration ✅
- "Process Doc" button on matter cards
- Modal opens with upload interface
- Matter context passed to processing
- Completion callbacks

## ⚠️ What Needs AWS Setup

### Backend Services (Not Yet Deployed)
- ❌ S3 bucket for document storage
- ❌ DynamoDB tables for metadata
- ❌ Lambda functions for processing
- ❌ EventBridge rules for triggers
- ❌ SQS queues for tier routing
- ❌ IAM roles and permissions

## 🚀 Quick Start (Development Mode)

For development without AWS:

1. **Mock Mode**: Create a mock service that simulates processing:

```typescript
// src/services/document-processing/mock.service.ts
export const mockDocumentProcessing = async (file: File) => {
  // Simulate upload
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate classification
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate extraction
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock data
  return {
    documentId: 'mock-' + Date.now(),
    extractedData: {
      invoice_number: 'INV-001',
      date: '2025-10-02',
      total_amount: '5000.00',
      client_name: 'Mock Client'
    },
    confidence: 0.95,
    tier: 2
  };
};
```

2. **Update DocumentUploadWithProcessing.tsx** to use mock service in development

## 📊 Processing Tiers

Once AWS is set up, documents will be processed through:

- **Tier 0**: Template-based (< 100ms, $0.0001/doc)
- **Tier 1**: Simple OCR (2-5s, $0.001/page)
- **Tier 2**: Structured extraction (5-15s, $0.015/page)
- **Tier 3**: AI-powered (15-60s, $0.02-0.15/doc)

## 🔍 Troubleshooting

### Error: "Cannot find module '@aws-sdk/client-s3'"
**Solution**: Run `npm install`

### Error: "AWS credentials not configured"
**Solution**: Add AWS credentials to `.env` file

### Error: "Bucket does not exist"
**Solution**: Create S3 bucket or update bucket name in `.env`

### Error: "Access Denied"
**Solution**: Check IAM permissions for your AWS credentials

## 📚 Documentation

- `AWS_DOCUMENT_PROCESSING_IMPLEMENTATION.md` - Full implementation guide
- `AWS_LAMBDA_FUNCTIONS.md` - Lambda function code
- `AWS_DOCUMENT_PROCESSING_UI_INTEGRATION.md` - UI integration details
- `INTEGRATION_QUICK_REFERENCE.md` - Quick reference for integrations

## ✨ Features

### Current (UI Only)
- ✅ Visual progress tracking
- ✅ File upload interface
- ✅ Real-time status updates
- ✅ Error handling
- ✅ Matter integration

### Coming Soon (After AWS Setup)
- ⏳ Actual document processing
- ⏳ AI-powered extraction
- ⏳ Template learning
- ⏳ Multi-tier routing
- ⏳ Cost optimization

## 🎉 Ready to Use

The UI is complete and ready! Just run:

```bash
npm install
npm run dev
```

Then navigate to Matters page and click "Process Doc" on any matter card.

**Note**: Without AWS infrastructure, the processing will fail at the upload step. Set up AWS or use mock mode for development.
