import { useState, useCallback } from 'react';
import { Sparkles, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../../design-system/components';
import { Icon } from '../../design-system/components';
import FormAssistantService, {
  FormField,
  FormContext,
  FormAssistantSuggestion
} from '../../services/ai/form-assistant.service';
import toast from 'react-hot-toast';

interface FormAssistantProps {
  fields: FormField[];
  context: FormContext;
  onApplySuggestion: (field: string, value: string | number) => void;
  onApplyAll?: (suggestions: Record<string, string | number>) => void;
  className?: string;
}

export function FormAssistant({
  fields,
  context,
  onApplySuggestion,
  onApplyAll,
  className = ''
}: FormAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FormAssistantSuggestion[]>([]);
  const [naturalInput, setNaturalInput] = useState('');
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  const handleGetSuggestions = useCallback(async () => {
    setIsLoading(true);
    setSuggestions([]);

    try {
      const result = await FormAssistantService.suggestFormCompletions(
        fields,
        context
      );

      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
        toast.success(`Found ${result.suggestions.length} suggestions`);
      } else {
        toast.error(result.error || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast.error('Failed to get AI suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [fields, context]);

  const handleSmartFill = useCallback(async () => {
    if (!naturalInput.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }

    setIsLoading(true);
    setSuggestions([]);

    try {
      const result = await FormAssistantService.smartFillForm(
        fields,
        context,
        naturalInput
      );

      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
        toast.success(`Extracted ${result.suggestions.length} fields from your input`);
      } else {
        toast.error(result.error || 'Failed to process input');
      }
    } catch (error) {
      console.error('Error with smart fill:', error);
      toast.error('Failed to process your input');
    } finally {
      setIsLoading(false);
    }
  }, [naturalInput, fields, context]);

  const handleApplySuggestion = useCallback((suggestion: FormAssistantSuggestion) => {
    onApplySuggestion(suggestion.field, suggestion.suggestedValue);
    setAppliedFields(prev => new Set(prev).add(suggestion.field));
    toast.success(`Applied suggestion for ${suggestion.field}`);
  }, [onApplySuggestion]);

  const handleApplyAll = useCallback(() => {
    if (suggestions.length === 0) return;

    const values: Record<string, string | number> = {};
    suggestions.forEach(s => {
      if (s.confidence >= 0.7) {
        values[s.field] = s.suggestedValue;
      }
    });

    if (onApplyAll) {
      onApplyAll(values);
    } else {
      Object.entries(values).forEach(([field, value]) => {
        onApplySuggestion(field, value);
      });
    }

    setAppliedFields(new Set(Object.keys(values)));
    toast.success(`Applied ${Object.keys(values).length} suggestions`);
  }, [suggestions, onApplySuggestion, onApplyAll]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSmartFill();
    }
  }, [handleSmartFill]);

  if (!isOpen) {
    return (
      <div className={`flex justify-end ${className}`}>
        <Button
          variant="outline"
          size="md"
          onClick={() => setIsOpen(true)}
          className="gap-2"
          data-testid="form-assistant-toggle"
        >
          <Icon icon={Sparkles} className="w-4 h-4 text-mpondo-gold-600" noGradient />
          AI Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-mpondo-gold-50 to-judicial-blue-50 rounded-lg border border-mpondo-gold-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon={Sparkles} className="w-5 h-5 text-mpondo-gold-600" noGradient />
          <h3 className="text-lg font-semibold text-neutral-900">AI Form Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-neutral-200 rounded transition-colors"
          aria-label="Close assistant"
        >
          <Icon icon={X} className="w-5 h-5 text-neutral-600" noGradient />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Describe what you want to enter (optional)
          </label>
          <textarea
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="E.g., 'Meeting with John Smith about contract review, 2 hours yesterday' or just click 'Get Suggestions' for smart completions"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent resize-none"
            rows={3}
            disabled={isLoading}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Press Ctrl+Enter to analyze, or use the buttons below
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleSmartFill}
            disabled={isLoading || !naturalInput.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Icon icon={Loader2} className="w-4 h-4 animate-spin" noGradient />
                Analyzing...
              </>
            ) : (
              <>
                <Icon icon={Sparkles} className="w-4 h-4" noGradient />
                Smart Fill
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handleGetSuggestions}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Icon icon={Loader2} className="w-4 h-4 animate-spin" noGradient />
                Loading...
              </>
            ) : (
              'Get Suggestions'
            )}
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-800">
                Suggestions ({suggestions.length})
              </h4>
              {suggestions.filter(s => s.confidence >= 0.7).length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyAll}
                  className="text-xs"
                >
                  Apply All High Confidence
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suggestions.map((suggestion, index) => {
                const isApplied = appliedFields.has(suggestion.field);
                const confidenceColor = 
                  suggestion.confidence >= 0.9 ? 'text-status-success-600' :
                  suggestion.confidence >= 0.7 ? 'text-mpondo-gold-600' :
                  'text-status-warning-600';

                return (
                  <div
                    key={index}
                    className={`bg-white rounded-lg p-3 border ${
                      isApplied 
                        ? 'border-status-success-300 bg-status-success-50' 
                        : 'border-neutral-200'
                    } transition-all`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-neutral-900">
                            {suggestion.field}
                          </span>
                          <span className={`text-xs font-semibold ${confidenceColor}`}>
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                          {isApplied && (
                            <Icon icon={Check} className="w-4 h-4 text-status-success-600" noGradient />
                          )}
                        </div>
                        
                        <div className="text-sm text-neutral-700 font-mono bg-neutral-50 px-2 py-1 rounded mb-2">
                          {String(suggestion.suggestedValue)}
                        </div>

                        <p className="text-xs text-neutral-600">
                          {suggestion.reasoning}
                        </p>

                        {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-neutral-200">
                            <p className="text-xs text-neutral-500 mb-1">Alternatives:</p>
                            <div className="flex flex-wrap gap-1">
                              {suggestion.alternatives.map((alt, altIndex) => (
                                <button
                                  key={altIndex}
                                  onClick={() => onApplySuggestion(suggestion.field, alt.value)}
                                  className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                                >
                                  {String(alt.value)} ({Math.round(alt.confidence * 100)}%)
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant={isApplied ? "ghost" : "primary"}
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                        disabled={isApplied}
                        className="shrink-0"
                      >
                        {isApplied ? 'Applied' : 'Apply'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {suggestions.length === 0 && !isLoading && (
          <div className="text-center py-8 text-neutral-500">
            <Icon icon={AlertCircle} className="w-12 h-12 mx-auto mb-2 text-neutral-400" noGradient />
            <p className="text-sm">
              No suggestions yet. Enter text above or click "Get Suggestions" for smart completions.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-500 text-center">
          <Icon icon={Sparkles} className="w-3 h-3 inline mr-1" noGradient />
          Powered by AWS Bedrock Claude 3.5 Sonnet
        </p>
      </div>
    </div>
  );
}
