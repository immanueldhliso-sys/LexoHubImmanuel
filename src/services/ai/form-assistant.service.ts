import { ClaudeRequest, ClaudeResponse } from '../aws-bedrock.service';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'tel';
  value?: string | number;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
}

export interface FormAssistantSuggestion {
  field: string;
  suggestedValue: string | number;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{ value: string | number; confidence: number }>;
}

export interface FormAssistantResponse {
  success: boolean;
  suggestions?: FormAssistantSuggestion[];
  error?: string;
  processingTime?: number;
}

export interface FormContext {
  formType: 'invoice' | 'matter' | 'time-entry' | 'pro-forma' | 'client';
  existingData?: Record<string, unknown>;
  relatedData?: {
    matters?: Array<{ id: string; title: string; client_name: string }>;
    clients?: Array<{ id: string; name: string; email: string }>;
    recentEntries?: Array<Record<string, unknown>>;
  };
  userPreferences?: Record<string, unknown>;
}

class FormAssistantService {
  private apiKey: string;
  private region: string;
  private modelId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_AWS_BEDROCK_API_KEY || '';
    this.region = import.meta.env.VITE_AWS_BEDROCK_REGION || 'us-east-1';
    this.modelId = import.meta.env.VITE_AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';
    this.baseUrl = `https://bedrock-runtime.${this.region}.amazonaws.com`;
  }

  async suggestFormCompletions(
    fields: FormField[],
    context: FormContext,
    userInput?: string
  ): Promise<FormAssistantResponse> {
    const startTime = Date.now();

    try {
      if (!fields || fields.length === 0) {
        return {
          success: false,
          error: 'No form fields provided'
        };
      }

      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(fields, context, userInput);

      const request: ClaudeRequest = {
        anthropic_version: '2023-06-01',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        system: systemPrompt
      };

      const response = await this.makeRequest(request);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to get form suggestions'
        };
      }

      const suggestions = this.parseResponse(response.data);

      return {
        success: true,
        suggestions,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Form assistant error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }

  async smartFillForm(
    fields: FormField[],
    context: FormContext,
    naturalLanguageInput: string
  ): Promise<FormAssistantResponse> {
    const startTime = Date.now();

    try {
      const systemPrompt = `You are an intelligent form-filling assistant for a South African legal practice management system. Your role is to extract structured data from natural language input and map it to form fields.

Context:
- South African legal terminology and practices
- Date formats: DD/MM/YYYY or natural language
- Currency: South African Rand (R)
- Common legal work types: Research, Drafting, Client Meeting, Court Appearance, Consultation, Review
- Matter references may include client names, case numbers, or descriptions

Instructions:
1. Parse the natural language input
2. Extract relevant information for each form field
3. Provide confidence scores for each suggestion
4. Handle ambiguity with alternative suggestions
5. Respect field types and validation rules
6. Return results in valid JSON format`;

      const userPrompt = `Parse this natural language input and suggest values for the form fields:

**Input:** "${naturalLanguageInput}"

**Form Fields:**
${fields.map(f => `- ${f.name} (${f.type}): ${f.label}${f.required ? ' [Required]' : ''}`).join('\n')}

**Context:**
- Form Type: ${context.formType}
${context.relatedData?.matters ? `- Available Matters: ${context.relatedData.matters.map(m => `${m.title} (${m.client_name})`).join(', ')}` : ''}
${context.existingData ? `- Existing Data: ${JSON.stringify(context.existingData)}` : ''}

Return a JSON array of suggestions in this format:
[
  {
    "field": "field_name",
    "suggestedValue": "value",
    "confidence": 0.95,
    "reasoning": "Why this value was suggested",
    "alternatives": [
      {"value": "alternative_value", "confidence": 0.75}
    ]
  }
]

Only suggest values for fields where you can extract relevant information from the input.`;

      const request: ClaudeRequest = {
        anthropic_version: '2023-06-01',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        system: systemPrompt
      };

      const response = await this.makeRequest(request);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to process smart fill'
        };
      }

      const suggestions = this.parseResponse(response.data);

      return {
        success: true,
        suggestions,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Smart fill error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }

  private buildSystemPrompt(context: FormContext): string {
    const formTypeContext = {
      'invoice': 'Invoice generation for legal services with fee calculations and disbursements',
      'matter': 'Legal matter creation with client details, case information, and risk assessment',
      'time-entry': 'Time tracking for billable legal work with activity descriptions',
      'pro-forma': 'Pro forma invoice creation for advance fee estimates',
      'client': 'Client information management with contact details and preferences'
    };

    return `You are an intelligent form completion assistant for a South African legal practice management system called LexoHub.

**Current Form Context:**
- Form Type: ${context.formType}
- Purpose: ${formTypeContext[context.formType]}

**Your Capabilities:**
1. Analyze partially filled forms and suggest completions
2. Learn from user patterns and preferences
3. Validate data against South African legal standards
4. Provide confidence scores for suggestions
5. Offer alternative suggestions when uncertain

**South African Legal Context:**
- Currency: South African Rand (R)
- Date Format: DD/MM/YYYY
- Common practice areas: Civil Litigation, Commercial Law, Family Law, Criminal Defense
- Billing practices: Hourly rates, contingency fees, fixed fees
- Professional standards: Legal Practice Act compliance

**Instructions:**
1. Analyze the form fields and existing data
2. Provide intelligent suggestions based on context
3. Prioritize accuracy over speed
4. Flag potential errors or inconsistencies
5. Return structured JSON responses only`;
  }

  private buildUserPrompt(fields: FormField[], context: FormContext, userInput?: string): string {
    let prompt = `Analyze this form and provide intelligent completion suggestions:\n\n`;

    prompt += `**Form Fields:**\n`;
    fields.forEach(field => {
      prompt += `- ${field.name} (${field.type}): ${field.label}`;
      if (field.value) prompt += ` [Current: ${field.value}]`;
      if (field.required) prompt += ` [Required]`;
      if (field.options) prompt += ` [Options: ${field.options.map(o => o.label).join(', ')}]`;
      prompt += `\n`;
    });

    if (context.existingData && Object.keys(context.existingData).length > 0) {
      prompt += `\n**Existing Form Data:**\n${JSON.stringify(context.existingData, null, 2)}\n`;
    }

    if (context.relatedData) {
      if (context.relatedData.matters && context.relatedData.matters.length > 0) {
        prompt += `\n**Available Matters:**\n`;
        context.relatedData.matters.forEach(m => {
          prompt += `- ${m.title} (Client: ${m.client_name})\n`;
        });
      }

      if (context.relatedData.recentEntries && context.relatedData.recentEntries.length > 0) {
        prompt += `\n**Recent Similar Entries:**\n${JSON.stringify(context.relatedData.recentEntries.slice(0, 3), null, 2)}\n`;
      }
    }

    if (userInput) {
      prompt += `\n**User Input/Request:**\n"${userInput}"\n`;
    }

    prompt += `\n**Task:**\nProvide intelligent suggestions for completing this form. Return a JSON array of suggestions:\n\n`;
    prompt += `[\n`;
    prompt += `  {\n`;
    prompt += `    "field": "field_name",\n`;
    prompt += `    "suggestedValue": "suggested value",\n`;
    prompt += `    "confidence": 0.95,\n`;
    prompt += `    "reasoning": "explanation for this suggestion",\n`;
    prompt += `    "alternatives": [{"value": "alt_value", "confidence": 0.75}]\n`;
    prompt += `  }\n`;
    prompt += `]\n\n`;
    prompt += `Only suggest values for fields where you have high confidence. Consider:\n`;
    prompt += `- Field dependencies and relationships\n`;
    prompt += `- Data validation rules\n`;
    prompt += `- South African legal standards\n`;
    prompt += `- User patterns and preferences\n`;

    return prompt;
  }

  private async makeRequest(request: ClaudeRequest): Promise<{ success: boolean; data?: ClaudeResponse; error?: string }> {
    try {
      if (!this.apiKey || this.apiKey.includes('bedrock-api-key-')) {
        console.warn('Form Assistant: Using fallback mode');
        return this.generateFallbackResponse(request);
      }

      const url = `${this.baseUrl}/model/${this.modelId}/invoke`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Amz-Target': 'AmazonBedrockRuntime.InvokeModel'
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: ClaudeResponse = await response.json();

      return {
        success: true,
        data
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private generateFallbackResponse(request: ClaudeRequest): { success: boolean; data: ClaudeResponse } {
    const fallbackSuggestions = [
      {
        field: 'description',
        suggestedValue: 'Legal consultation and advice',
        confidence: 0.7,
        reasoning: 'Common legal service description'
      }
    ];

    return {
      success: true,
      data: {
        id: `msg_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        content: [{
          type: 'text',
          text: JSON.stringify(fallbackSuggestions)
        }],
        model: this.modelId,
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 150
        }
      }
    };
  }

  private parseResponse(response: ClaudeResponse): FormAssistantSuggestion[] {
    try {
      if (!response.content || response.content.length === 0) {
        return [];
      }

      let textContent = response.content[0]?.text || '';

      if (textContent.startsWith('```json')) {
        textContent = textContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (textContent.startsWith('```')) {
        textContent = textContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        textContent = jsonMatch[0];
      }

      const suggestions: FormAssistantSuggestion[] = JSON.parse(textContent);

      return suggestions.filter(s => 
        s.field && 
        s.suggestedValue !== undefined && 
        typeof s.confidence === 'number' &&
        s.confidence >= 0 && 
        s.confidence <= 1
      );

    } catch (error) {
      console.error('Failed to parse form assistant response:', error);
      return [];
    }
  }
}

export default new FormAssistantService();
