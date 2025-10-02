import React from 'react';
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react';

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tier?: number;
  confidence?: number;
}

interface ProcessingProgressTrackerProps {
  documentId: string;
  steps: ProcessingStep[];
  currentStep: number;
}

export const ProcessingProgressTracker: React.FC<ProcessingProgressTrackerProps> = ({
  documentId,
  steps,
  currentStep
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Document Processing</h2>
        <p className="text-sm text-neutral-600">Document ID: {documentId}</p>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-200" />

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex items-start gap-4">
              <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                step.status === 'completed' 
                  ? 'bg-status-success-500 border-status-success-200'
                  : step.status === 'in_progress'
                  ? 'bg-mpondo-gold-500 border-mpondo-gold-200 animate-pulse'
                  : step.status === 'failed'
                  ? 'bg-status-error-500 border-status-error-200'
                  : 'bg-neutral-100 border-neutral-300'
              }`}>
                {step.status === 'completed' && (
                  <CheckCircle className="w-8 h-8 text-white" />
                )}
                {step.status === 'in_progress' && (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                )}
                {step.status === 'pending' && (
                  <Circle className="w-8 h-8 text-neutral-400" />
                )}
                {step.status === 'failed' && (
                  <XCircle className="w-8 h-8 text-white" />
                )}
              </div>

              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold text-neutral-900">{step.name}</h3>
                {step.tier !== undefined && (
                  <p className="text-sm text-neutral-600">Processing Tier: {step.tier}</p>
                )}
                {step.confidence !== undefined && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-neutral-600">Confidence</span>
                      <span className="font-semibold text-neutral-900">
                        {(step.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          step.confidence >= 0.9
                            ? 'bg-status-success-500'
                            : step.confidence >= 0.7
                            ? 'bg-mpondo-gold-500'
                            : 'bg-status-warning-500'
                        }`}
                        style={{ width: `${step.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-judicial-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-judicial-blue-900">
            Overall Progress
          </span>
          <span className="text-sm font-semibold text-judicial-blue-900">
            {currentStep} of {steps.length} steps
          </span>
        </div>
        <div className="mt-2 w-full bg-judicial-blue-200 rounded-full h-3">
          <div
            className="bg-judicial-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
