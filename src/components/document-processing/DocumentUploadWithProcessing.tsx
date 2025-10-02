import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '../../design-system/components';
import { ProcessingProgressTracker } from './ProcessingProgressTracker';
import { toast } from 'react-hot-toast';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

interface DocumentUploadWithProcessingProps {
  matterId: string;
  onComplete?: (documentId: string, extractedData: any) => void;
  onCancel?: () => void;
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tier?: number;
  confidence?: number;
}

export const DocumentUploadWithProcessing: React.FC<DocumentUploadWithProcessingProps> = ({
  matterId,
  onComplete,
  onCancel
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const s3Client = new S3Client({
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
    }
  });

  const dynamoClient = new DynamoDBClient({
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
    }
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const initializeProcessingSteps = (): ProcessingStep[] => {
    return [
      {
        id: 'upload',
        name: 'Uploading Document',
        status: 'in_progress',
        tier: undefined,
        confidence: undefined
      },
      {
        id: 'classification',
        name: 'Classifying Document',
        status: 'pending',
        tier: undefined,
        confidence: undefined
      },
      {
        id: 'extraction',
        name: 'Extracting Data',
        status: 'pending',
        tier: undefined,
        confidence: undefined
      },
      {
        id: 'validation',
        name: 'Validating Results',
        status: 'pending',
        tier: undefined,
        confidence: undefined
      },
      {
        id: 'complete',
        name: 'Processing Complete',
        status: 'pending',
        tier: undefined,
        confidence: undefined
      }
    ];
  };

  const uploadToS3 = async (file: File, docId: string): Promise<void> => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    await s3Client.send(new PutObjectCommand({
      Bucket: import.meta.env.VITE_AWS_DOCUMENT_BUCKET || 'lexohub-documents-processing',
      Key: `${matterId}/${docId}/${file.name}`,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        matterId,
        documentId: docId,
        originalName: file.name
      }
    }));
  };

  const pollProcessingStatus = async (docId: string): Promise<void> => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        throw new Error('Processing timeout');
      }

      attempts++;

      try {
        const response = await dynamoClient.send(new GetItemCommand({
          TableName: 'DocumentMetadata',
          Key: {
            documentId: { S: docId }
          }
        }));

        if (!response.Item) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return poll();
        }

        const status = response.Item.processingStatus?.S;
        const tier = response.Item.processingTier?.N;
        const confidence = response.Item.confidence?.N;

        if (status === 'classifying') {
          updateStep('classification', 'in_progress', undefined, undefined);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return poll();
        }

        if (status === 'processing') {
          updateStep('classification', 'completed', undefined, undefined);
          updateStep('extraction', 'in_progress', tier ? parseInt(tier) : undefined, undefined);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return poll();
        }

        if (status === 'validating') {
          updateStep('extraction', 'completed', tier ? parseInt(tier) : undefined, confidence ? parseFloat(confidence) : undefined);
          updateStep('validation', 'in_progress', undefined, undefined);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return poll();
        }

        if (status === 'completed') {
          updateStep('validation', 'completed', undefined, undefined);
          updateStep('complete', 'completed', undefined, undefined);
          
          const extractedData = response.Item.extractedData?.S 
            ? JSON.parse(response.Item.extractedData.S)
            : null;

          if (onComplete) {
            onComplete(docId, extractedData);
          }
          
          toast.success('Document processed successfully!');
          return;
        }

        if (status === 'failed') {
          const errorMessage = response.Item.errorMessage?.S || 'Processing failed';
          throw new Error(errorMessage);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        return poll();
      } catch (error) {
        console.error('Polling error:', error);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return poll();
      }
    };

    await poll();
  };

  const updateStep = (
    stepId: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    tier?: number,
    confidence?: number
  ) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step => {
        if (step.id === stepId) {
          return { ...step, status, tier, confidence };
        }
        return step;
      });

      const completedCount = newSteps.filter(s => s.status === 'completed').length;
      setCurrentStep(completedCount);

      return newSteps;
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProcessing(true);
    const docId = uuidv4();
    setDocumentId(docId);

    const processingSteps = initializeProcessingSteps();
    setSteps(processingSteps);
    setCurrentStep(0);

    try {
      await uploadToS3(selectedFile, docId);
      
      updateStep('upload', 'completed', undefined, undefined);
      updateStep('classification', 'in_progress', undefined, undefined);

      await dynamoClient.send(new PutItemCommand({
        TableName: 'DocumentMetadata',
        Item: {
          documentId: { S: docId },
          matterId: { S: matterId },
          fileName: { S: selectedFile.name },
          fileSize: { N: selectedFile.size.toString() },
          uploadTimestamp: { N: Date.now().toString() },
          processingStatus: { S: 'classifying' }
        }
      }));

      await pollProcessingStatus(docId);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error((error as Error).message || 'Failed to process document');
      
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.status === 'in_progress' ? { ...step, status: 'failed' as const } : step
        )
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setProcessing(false);
    setDocumentId(null);
    setSteps([]);
    setCurrentStep(0);
  };

  if (processing && documentId) {
    return (
      <div className="space-y-6">
        <ProcessingProgressTracker
          documentId={documentId}
          steps={steps}
          currentStep={currentStep}
        />
        
        {steps.every(s => s.status === 'completed' || s.status === 'failed') && (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleRemoveFile}>
              Process Another Document
            </Button>
            {onCancel && (
              <Button variant="primary" onClick={onCancel}>
                Done
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Upload Document for Processing
        </h2>
        <p className="text-neutral-600">
          Upload a PDF document to extract data using AI-powered processing
        </p>
      </div>

      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center hover:border-mpondo-gold-500 transition-colors cursor-pointer"
        >
          <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-neutral-900 mb-2">
            Drop your PDF here or click to browse
          </p>
          <p className="text-sm text-neutral-600 mb-4">
            Maximum file size: 50MB
          </p>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="inline-flex items-center px-4 py-2 bg-mpondo-gold-500 text-white rounded-lg hover:bg-mpondo-gold-600 transition-colors font-medium">
              Select File
            </span>
          </label>
        </div>
      ) : (
        <div className="border border-neutral-300 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-judicial-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-judicial-blue-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{selectedFile.name}</p>
                <p className="text-sm text-neutral-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-neutral-500 hover:text-neutral-700 transition-colors"
              disabled={uploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={uploading}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-judicial-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-judicial-blue-900 mb-2">
          Intelligent Processing
        </h3>
        <ul className="text-sm text-judicial-blue-700 space-y-1">
          <li>• Automatic document classification</li>
          <li>• Multi-tier processing (Template, OCR, AI)</li>
          <li>• Extracts forms, tables, and key-value pairs</li>
          <li>• AI-powered field mapping with Claude models</li>
          <li>• Real-time progress tracking</li>
        </ul>
      </div>
    </div>
  );
};
