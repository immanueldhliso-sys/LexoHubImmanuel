/**
 * AWS Bedrock Service for Claude API Integration
 * Enhanced with comprehensive error handling, retry logic, and fallbacks
 */

export interface ClaudeRequest {
  anthropic_version: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  system?: string;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ExtractedTimeEntry {
  matter_reference?: string;
  client_name?: string;
  duration_minutes?: number;
  activity_type?: string;
  description?: string;
  date?: string;
  is_billable?: boolean;
  confidence_score?: number;
  extracted_entities?: {
    matters?: string[];
    clients?: string[];
    durations?: string[];
    activities?: string[];
    dates?: string[];
  };
}

export interface ServiceStatus {
  isAvailable: boolean;
  lastError?: string;
  lastSuccessfulCall?: Date;
  consecutiveFailures: number;
  rateLimitInfo?: {
    remaining: number;
    resetTime: Date;
  };
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class AWSBedrockService {
  private apiKey: string;
  private region: string;
  private modelId: string;
  private baseUrl: string;
  private status: ServiceStatus;
  private retryConfig: RetryConfig;
  private circuitBreaker: {
    state: CircuitBreakerState;
    failureCount: number;
    lastFailureTime: Date | null;
    nextAttemptTime: Date | null;
  };

  constructor() {
    this.apiKey = import.meta.env.VITE_AWS_BEDROCK_API_KEY || '';
    this.region = import.meta.env.VITE_AWS_BEDROCK_REGION || 'us-east-1';
    this.modelId = import.meta.env.VITE_AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';
    this.baseUrl = `https://bedrock-runtime.${this.region}.amazonaws.com`;
    
    this.status = {
      isAvailable: true,
      consecutiveFailures: 0
    };

    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      retryableErrors: [
        'ThrottlingException',
        'ServiceUnavailableException',
        'InternalServerException',
        'TooManyRequestsException',
        'NetworkError',
        'TimeoutError'
      ]
    };

    this.circuitBreaker = {
      state: CircuitBreakerState.CLOSED,
      failureCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null
    };
  }

  /**
   * Initialize the service with configuration validation
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're in demo/fallback mode
      if (!this.apiKey || this.apiKey.includes('bedrock-api-key-')) {
        console.warn('AWS Bedrock: Initializing in demo/fallback mode');
        this.status.isAvailable = true;
        this.status.consecutiveFailures = 0;
        this.status.lastSuccessfulCall = new Date();
        this.resetCircuitBreaker();
        
        console.log('AWS Bedrock service initialized in demo mode');
        return { success: true };
      }

      // Validate configuration for production mode
      if (!this.region) {
        throw new Error('AWS Bedrock region is not configured');
      }

      if (!this.modelId) {
        throw new Error('AWS Bedrock model ID is not configured');
      }

      // Test connection with a simple request
      const testResult = await this.testConnection();
      
      if (testResult.success) {
        this.status.isAvailable = true;
        this.status.consecutiveFailures = 0;
        this.status.lastSuccessfulCall = new Date();
        this.resetCircuitBreaker();
        
        console.log('AWS Bedrock service initialized successfully');
        return { success: true };
      } else {
        throw new Error(testResult.error || 'Connection test failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('AWS Bedrock service initialization failed:', errorMessage);
      
      this.status.isAvailable = false;
      this.status.lastError = errorMessage;
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Extract time entry data from transcription with comprehensive error handling
   */
  async extractTimeEntryData(
    transcription: string,
    availableMatters: Array<{ id: string; title: string; client_name: string; attorney: string }> = []
  ): Promise<{ success: boolean; data?: ExtractedTimeEntry; error?: string }> {
    try {
      // Check circuit breaker
      if (!this.canMakeRequest()) {
        return {
          success: false,
          error: 'Service temporarily unavailable due to repeated failures'
        };
      }

      // Validate input
      if (!transcription || transcription.trim().length === 0) {
        return {
          success: false,
          error: 'Transcription text is required'
        };
      }

      if (transcription.length > 10000) {
        return {
          success: false,
          error: 'Transcription text is too long (max 10,000 characters)'
        };
      }

      const systemPrompt = this.buildSystemPrompt(availableMatters);
      const extractionPrompt = this.buildExtractionPrompt(transcription);

      const request: ClaudeRequest = {
        anthropic_version: '2023-06-01',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        system: systemPrompt,
        stop_sequences: ['</json>']
      };

      const response = await this.makeRequestWithRetry(request);
      
      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to extract time entry data'
        };
      }

      const extractedData = this.parseClaudeResponse(response.data!);
      
      if (!extractedData.success) {
        return {
          success: false,
          error: extractedData.error || 'Failed to parse extraction results'
        };
      }

      // Update success metrics
      this.status.lastSuccessfulCall = new Date();
      this.status.consecutiveFailures = 0;
      this.resetCircuitBreaker();

      return {
        success: true,
        data: extractedData.data
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error';
      console.error('Time entry extraction failed:', errorMessage);
      
      this.recordFailure(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Make HTTP request with retry logic and circuit breaker
   */
  private async makeRequestWithRetry(request: ClaudeRequest): Promise<{ success: boolean; data?: ClaudeResponse; error?: string }> {
    let lastError: string = '';
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt);
          console.log(`Retrying AWS Bedrock request (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}) after ${delay}ms delay`);
          await this.sleep(delay);
        }

        const response = await this.makeHttpRequest(request);
        
        if (response.success) {
          return response;
        }

        lastError = response.error || 'Unknown error';
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempt === this.retryConfig.maxRetries) {
          break;
        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error';
        
        if (!this.isRetryableError(lastError) || attempt === this.retryConfig.maxRetries) {
          break;
        }
      }
    }

    return {
      success: false,
      error: lastError
    };
  }

  /**
   * Make actual HTTP request to AWS Bedrock
   */
  private async makeHttpRequest(request: ClaudeRequest): Promise<{ success: boolean; data?: ClaudeResponse; error?: string }> {
    try {
      const url = `${this.baseUrl}/model/${this.modelId}/invoke`;
      
      // For development/demo purposes, we'll simulate the AWS Bedrock response
      // In production, this would use proper AWS SDK with IAM credentials
      if (!this.apiKey || this.apiKey.includes('bedrock-api-key-')) {
        console.warn('AWS Bedrock: Using fallback mode - API key not properly configured');
        
        // Return a simulated successful response for demo purposes
        const simulatedResponse: ClaudeResponse = {
          id: `msg_${Date.now()}`,
          type: 'message',
          role: 'assistant',
          content: [{
            type: 'text',
            text: JSON.stringify({
              matter_reference: 'Unknown',
              client_name: 'Unknown Client',
              duration_minutes: 60,
              activity_type: 'General Legal Work',
              description: request.messages[0]?.content || 'Voice transcription processed',
              date: new Date().toISOString().split('T')[0],
              is_billable: true,
              confidence_score: 0.7
            })
          }],
          model: this.modelId,
          stop_reason: 'end_turn',
          usage: {
            input_tokens: 100,
            output_tokens: 150
          }
        };
        
        return {
          success: true,
          data: simulatedResponse
        };
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Amz-Target': 'AmazonBedrockRuntime.InvokeModel'
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Use default error message if JSON parsing fails
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            this.status.rateLimitInfo = {
              remaining: 0,
              resetTime: new Date(Date.now() + parseInt(retryAfter) * 1000)
            };
          }
          throw new Error('TooManyRequestsException');
        }

        throw new Error(errorMessage);
      }

      const data: ClaudeResponse = await response.json();
      
      // Update rate limit info if available
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const resetTime = response.headers.get('X-RateLimit-Reset');
      
      if (remaining && resetTime) {
        this.status.rateLimitInfo = {
          remaining: parseInt(remaining),
          resetTime: new Date(parseInt(resetTime) * 1000)
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      let errorMessage = 'Network error';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'TimeoutError';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'NetworkError';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Build system prompt with South African legal context
   */
  private buildSystemPrompt(availableMatters: Array<{ id: string; title: string; client_name: string; attorney: string }>): string {
    const mattersContext = availableMatters.length > 0 
      ? `Available matters for reference:\n${availableMatters.map(m => 
          `- ID: ${m.id}, Title: ${m.title}, Client: ${m.client_name}, Attorney: ${m.attorney}`
        ).join('\n')}\n\n`
      : '';

    return `You are an AI assistant specialized in extracting structured time entry data from voice transcriptions for South African legal practices.

${mattersContext}Context:
- South African legal terminology and practices
- Common Afrikaans legal terms may be present
- Time formats: hours and minutes (e.g., "2 hours 30 minutes", "1.5 hours", "90 minutes")
- Date formats: DD/MM/YYYY, DD-MM-YYYY, or natural language (e.g., "today", "yesterday", "last Friday")
- Work types: Research, Drafting, Client Meeting, Court Appearance, Consultation, Review, Administration, Travel
- Matter references may include client names, case numbers, or matter descriptions

Instructions:
1. Extract all relevant information from the transcription
2. Match matter references against available matters using fuzzy matching
3. Provide confidence scores (0.0 to 1.0) for each extracted field
4. Handle South African accents and pronunciation variations
5. Return results in valid JSON format only

Response format (JSON only):
{
  "matter_reference": "string or null",
  "client_name": "string or null", 
  "duration_minutes": number or null,
  "activity_type": "string or null",
  "description": "string",
  "date": "YYYY-MM-DD or null",
  "is_billable": boolean,
  "confidence_score": number,
  "extracted_entities": {
    "matters": ["array of potential matter matches"],
    "clients": ["array of potential client names"],
    "durations": ["array of duration mentions"],
    "activities": ["array of activity types"],
    "dates": ["array of date mentions"]
  }
}`;
  }

  /**
   * Build extraction prompt for the transcription
   */
  private buildExtractionPrompt(transcription: string): string {
    return `Please extract time entry data from this voice transcription:

"${transcription}"

Analyze the transcription and extract structured time entry information. Pay special attention to:
- Matter or client references (may be partial or mispronounced)
- Duration mentions (in any format)
- Activity descriptions
- Date references
- Billable status indicators

Return only valid JSON in the specified format.`;
  }

  /**
   * Parse Claude's response and extract structured data
   */
  private parseClaudeResponse(response: ClaudeResponse): { success: boolean; data?: ExtractedTimeEntry; error?: string } {
    try {
      if (!response.content || response.content.length === 0) {
        return {
          success: false,
          error: 'Empty response from Claude'
        };
      }

      const textContent = response.content[0]?.text;
      if (!textContent) {
        return {
          success: false,
          error: 'No text content in Claude response'
        };
      }

      // Extract JSON from the response (handle potential markdown formatting)
      let jsonText = textContent.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Find JSON object in the text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const extractedData: ExtractedTimeEntry = JSON.parse(jsonText);
      
      // Validate required fields and data types
      const validationResult = this.validateExtractedData(extractedData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Invalid extracted data: ${validationResult.errors.join(', ')}`
        };
      }

      return {
        success: true,
        data: extractedData
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'JSON parsing error';
      console.error('Failed to parse Claude response:', errorMessage, response);
      
      return {
        success: false,
        error: `Failed to parse extraction results: ${errorMessage}`
      };
    }
  }

  /**
   * Validate extracted data structure and types
   */
  private validateExtractedData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof data !== 'object' || data === null) {
      errors.push('Data must be an object');
      return { isValid: false, errors };
    }

    // Validate optional fields with correct types
    if (data.matter_reference !== undefined && data.matter_reference !== null && typeof data.matter_reference !== 'string') {
      errors.push('matter_reference must be a string or null');
    }

    if (data.client_name !== undefined && data.client_name !== null && typeof data.client_name !== 'string') {
      errors.push('client_name must be a string or null');
    }

    if (data.duration_minutes !== undefined && data.duration_minutes !== null && typeof data.duration_minutes !== 'number') {
      errors.push('duration_minutes must be a number or null');
    }

    if (data.activity_type !== undefined && data.activity_type !== null && typeof data.activity_type !== 'string') {
      errors.push('activity_type must be a string or null');
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
      errors.push('description must be a string');
    }

    if (data.date !== undefined && data.date !== null && typeof data.date !== 'string') {
      errors.push('date must be a string or null');
    }

    if (data.is_billable !== undefined && typeof data.is_billable !== 'boolean') {
      errors.push('is_billable must be a boolean');
    }

    if (data.confidence_score !== undefined && (typeof data.confidence_score !== 'number' || data.confidence_score < 0 || data.confidence_score > 1)) {
      errors.push('confidence_score must be a number between 0 and 1');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Generate AI-powered fee optimization recommendations using Claude
   */
  async generateFeeOptimizationRecommendations(
    matterData: {
      id: string;
      briefType: string;
      wipValue: number;
      estimatedFee: number;
      riskLevel?: string;
      clientType?: string;
      urgency?: string;
      complexity?: string;
      marketPosition?: string;
    },
    marketData?: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Check circuit breaker
      if (!this.canMakeRequest()) {
        return {
          success: false,
          error: 'Service temporarily unavailable due to repeated failures'
        };
      }

      // Validate input
      if (!matterData || !matterData.id) {
        return {
          success: false,
          error: 'Matter data is required for fee optimization'
        };
      }

      // Construct the prompt for fee optimization
      const systemPrompt = `You are an expert South African legal fee optimization consultant with deep knowledge of the South African legal market, fee structures, and practice economics. Your role is to analyze legal matters and provide data-driven fee optimization recommendations.

Key considerations for South African legal practice:
- Understand the competitive landscape of South African legal fees
- Consider the economic context and client affordability
- Factor in practice area specialization and market positioning
- Account for risk-adjusted pricing models
- Consider performance-based and alternative fee arrangements
- Understand the regulatory environment and ethical considerations

Provide recommendations that are:
- Commercially viable and competitive
- Ethically compliant with South African legal practice rules
- Data-driven and evidence-based
- Practical and implementable
- Risk-adjusted for the specific matter type`;

      const userPrompt = `Analyze the following legal matter and provide comprehensive fee optimization recommendations:

**Matter Details:**
- Matter ID: ${matterData.id}
- Practice Area: ${matterData.briefType}
- Current WIP Value: R${matterData.wipValue.toLocaleString()}
- Estimated Fee: R${matterData.estimatedFee.toLocaleString()}
- Risk Level: ${matterData.riskLevel || 'Not specified'}
- Client Type: ${matterData.clientType || 'Not specified'}
- Matter Urgency: ${matterData.urgency || 'Standard'}
- Complexity Level: ${matterData.complexity || 'Medium'}
- Market Position: ${matterData.marketPosition || 'Standard'}

**Market Context:**
${marketData ? JSON.stringify(marketData, null, 2) : 'No specific market data provided - use general South African legal market knowledge'}

Please provide a comprehensive fee optimization analysis in the following JSON format:

{
  "matterId": "${matterData.id}",
  "currentModel": "string (identified current fee model)",
  "recommendedModel": "string (optimal fee model recommendation)",
  "projectedIncrease": number (percentage increase in revenue potential),
  "confidence": number (confidence score 0-1),
  "rationale": [
    "string (key reason 1)",
    "string (key reason 2)",
    "string (key reason 3)"
  ],
  "implementationSteps": [
    {
      "step": "string (action description)",
      "timeline": "string (time estimate)",
      "effort": "low|medium|high"
    }
  ],
  "riskAssessment": {
    "clientAcceptance": number (probability 0-1),
    "marketCompetitiveness": number (score 0-1),
    "reputationRisk": number (risk level 0-1)
  },
  "optimizationFactors": {
    "urgency": number (impact score 0-1),
    "complexity": number (impact score 0-1),
    "clientType": number (impact score 0-1),
    "marketPosition": number (impact score 0-1)
  },
  "alternativeModels": [
    {
      "model": "string (fee model name)",
      "description": "string (model description)",
      "suitability": number (score 0-1),
      "expectedIncrease": number (percentage)
    }
  ],
  "marketAnalysis": {
    "competitorPricing": "string (market positioning)",
    "demandTrend": "increasing|stable|decreasing",
    "priceElasticity": "high|medium|low"
  }
}

Ensure all numerical values are realistic and based on South African legal market conditions. Focus on practical, implementable recommendations that balance revenue optimization with client relationships and market competitiveness.`;

      const request: ClaudeRequest = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userPrompt
        }]
      };

      const response = await this.makeRequestWithRetry(request);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to get fee optimization recommendations'
        };
      }

      // Parse the response
      return this.parseFeeOptimizationResponse(response.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in fee optimization';
      console.error('Error generating fee optimization recommendations:', errorMessage);
      
      this.recordFailure(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Parse fee optimization response from Claude
   */
  private parseFeeOptimizationResponse(response: ClaudeResponse): { success: boolean; data?: any; error?: string } {
    try {
      if (!response.content || response.content.length === 0) {
        return {
          success: false,
          error: 'Empty response from Claude'
        };
      }

      const textContent = response.content[0]?.text;
      if (!textContent) {
        return {
          success: false,
          error: 'No text content in Claude response'
        };
      }

      // Extract JSON from the response (handle potential markdown formatting)
      let jsonText = textContent.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Find JSON object in the text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const optimizationData = JSON.parse(jsonText);
      
      // Validate the optimization data structure
      const validationResult = this.validateFeeOptimizationData(optimizationData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Invalid optimization data: ${validationResult.errors.join(', ')}`
        };
      }

      return {
        success: true,
        data: optimizationData
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'JSON parsing error';
      console.error('Failed to parse fee optimization response:', errorMessage, response);
      
      return {
        success: false,
        error: `Failed to parse optimization results: ${errorMessage}`
      };
    }
  }

  /**
   * Validate fee optimization data structure
   */
  private validateFeeOptimizationData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof data !== 'object' || data === null) {
      errors.push('Data must be an object');
      return { isValid: false, errors };
    }

    // Required fields
    if (!data.matterId || typeof data.matterId !== 'string') {
      errors.push('matterId is required and must be a string');
    }

    if (!data.currentModel || typeof data.currentModel !== 'string') {
      errors.push('currentModel is required and must be a string');
    }

    if (!data.recommendedModel || typeof data.recommendedModel !== 'string') {
      errors.push('recommendedModel is required and must be a string');
    }

    if (typeof data.projectedIncrease !== 'number') {
      errors.push('projectedIncrease must be a number');
    }

    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
      errors.push('confidence must be a number between 0 and 1');
    }

    if (!Array.isArray(data.rationale)) {
      errors.push('rationale must be an array');
    }

    if (!Array.isArray(data.implementationSteps)) {
      errors.push('implementationSteps must be an array');
    }

    if (typeof data.riskAssessment !== 'object') {
      errors.push('riskAssessment must be an object');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Test connection to AWS Bedrock
   */
  private async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // In demo mode, always return success
      if (!this.apiKey || this.apiKey.includes('bedrock-api-key-')) {
        return { success: true };
      }

      const testRequest: ClaudeRequest = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 10,
        messages: [{
          role: "user",
          content: "Test connection"
        }]
      };

      const result = await this.makeHttpRequest(testRequest);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current service status
   */
  getServiceStatus(): ServiceStatus {
    return { ...this.status };
  }

  /**
   * Circuit breaker logic
   */
  private canMakeRequest(): boolean {
    const now = new Date();

    switch (this.circuitBreaker.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        if (this.circuitBreaker.nextAttemptTime && now >= this.circuitBreaker.nextAttemptTime) {
          this.circuitBreaker.state = CircuitBreakerState.HALF_OPEN;
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  private recordFailure(error: string): void {
    this.status.consecutiveFailures++;
    this.status.lastError = error;
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = new Date();

    // Open circuit breaker if failure threshold is reached
    if (this.circuitBreaker.failureCount >= 5) { // Configurable threshold
      this.circuitBreaker.state = CircuitBreakerState.OPEN;
      this.circuitBreaker.nextAttemptTime = new Date(Date.now() + 60000); // 1 minute timeout
      console.warn('Circuit breaker opened due to repeated failures');
    }
  }

  private resetCircuitBreaker(): void {
    this.circuitBreaker.state = CircuitBreakerState.CLOSED;
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.lastFailureTime = null;
    this.circuitBreaker.nextAttemptTime = null;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: string): boolean {
    return this.retryConfig.retryableErrors.some(retryableError => 
      error.includes(retryableError)
    );
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate AI-powered cash flow optimization recommendations using Claude
   */
  async generateCashFlowOptimization(
    cashFlowData: {
      currentCashPosition: number;
      collectionRate: number;
      averageCollectionDays: number;
      monthlyRecurringRevenue: number;
      outstandingInvoices: number;
      totalOutstanding: number;
      activeMatters: number;
      practiceType: string;
      marketConditions: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Check circuit breaker
      if (!this.canMakeRequest()) {
        return {
          success: false,
          error: 'Service temporarily unavailable due to repeated failures'
        };
      }

      // Validate input
      if (!cashFlowData) {
        return {
          success: false,
          error: 'Cash flow data is required for optimization'
        };
      }

      // Construct the prompt for cash flow optimization
      const systemPrompt = `You are an expert South African legal practice cash flow optimization consultant with deep knowledge of legal practice economics, financial management, and cash flow strategies specific to the South African legal market.

Key considerations for South African legal practice cash flow:
- Understand the unique challenges of legal practice cash flow in South Africa
- Consider the economic environment and client payment behaviors
- Factor in trust account regulations and compliance requirements
- Account for seasonal variations in legal work and collections
- Consider the impact of economic conditions on client payment patterns
- Understand the regulatory environment for legal practice financial management

Provide recommendations that are:
- Practical and immediately implementable
- Compliant with South African legal practice regulations
- Risk-adjusted for the current economic environment
- Focused on sustainable cash flow improvement
- Balanced between aggressive collection and client relationship preservation`;

      const userPrompt = `Analyze the following legal practice cash flow situation and provide comprehensive optimization recommendations:

**Current Cash Flow Metrics:**
- Current Cash Position: ${cashFlowData.currentCashPosition} days runway
- Collection Rate: ${(cashFlowData.collectionRate * 100).toFixed(1)}%
- Average Collection Days: ${cashFlowData.averageCollectionDays} days
- Monthly Recurring Revenue: R${cashFlowData.monthlyRecurringRevenue.toLocaleString()}
- Outstanding Invoices: ${cashFlowData.outstandingInvoices} invoices
- Total Outstanding Amount: R${cashFlowData.totalOutstanding.toLocaleString()}
- Active Matters: ${cashFlowData.activeMatters}
- Practice Type: ${cashFlowData.practiceType}
- Market Conditions: ${cashFlowData.marketConditions}

Please provide a comprehensive cash flow optimization analysis in the following JSON format:

{
  "strategies": [
    {
      "id": "string (unique identifier)",
      "title": "string (strategy name)",
      "description": "string (detailed description)",
      "impact": "high|medium|low",
      "effort": "low|medium|high",
      "timeline": "string (implementation timeframe)",
      "projectedImprovement": number (percentage improvement expected),
      "category": "collections|billing|financing|operations"
    }
  ],
  "priorityActions": [
    "string (immediate action 1)",
    "string (immediate action 2)",
    "string (immediate action 3)"
  ],
  "projectedImprovement": number (overall percentage improvement in cash flow),
  "confidence": number (confidence score 0-1),
  "timeline": "string (overall implementation timeline)",
  "implementationSteps": [
    {
      "step": "string (action description)",
      "timeline": "string (time estimate)",
      "effort": "low|medium|high",
      "priority": "high|medium|low"
    }
  ],
  "riskAssessment": {
    "clientRelationshipRisk": number (risk level 0-1),
    "implementationRisk": number (risk level 0-1),
    "financialRisk": number (risk level 0-1)
  },
  "keyMetrics": {
    "targetCollectionRate": number (target percentage),
    "targetCollectionDays": number (target days),
    "projectedCashPosition": number (projected days runway),
    "estimatedROI": number (return on investment percentage)
  },
  "alternativeStrategies": [
    {
      "strategy": "string (alternative approach)",
      "description": "string (strategy description)",
      "suitability": number (score 0-1),
      "expectedImprovement": number (percentage)
    }
  ],
  "marketContext": {
    "economicFactors": "string (relevant economic considerations)",
    "industryTrends": "string (legal industry trends affecting cash flow)",
    "competitivePosition": "string (practice positioning analysis)"
  }
}

Focus on practical, implementable strategies that consider the South African legal market context, economic conditions, and regulatory requirements. Prioritize strategies that provide the best balance of impact and feasibility.`;

      const request: ClaudeRequest = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: userPrompt
        }]
      };

      const response = await this.makeRequestWithRetry(request);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to get cash flow optimization recommendations'
        };
      }

      // Parse the response
      return this.parseCashFlowOptimizationResponse(response.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in cash flow optimization';
      console.error('Error generating cash flow optimization recommendations:', errorMessage);
      
      this.recordFailure(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Parse cash flow optimization response from Claude
   */
  private parseCashFlowOptimizationResponse(response: ClaudeResponse): { success: boolean; data?: any; error?: string } {
    try {
      if (!response.content || response.content.length === 0) {
        return {
          success: false,
          error: 'Empty response from Claude'
        };
      }

      const textContent = response.content[0]?.text;
      if (!textContent) {
        return {
          success: false,
          error: 'No text content in Claude response'
        };
      }

      // Extract JSON from the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          error: 'No valid JSON found in Claude response'
        };
      }

      let parsedData;
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse JSON from Claude response'
        };
      }

      // Validate the parsed data
      const validation = this.validateCashFlowOptimizationData(parsedData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid cash flow optimization data: ${validation.errors.join(', ')}`
        };
      }

      // Record successful call
      this.status.lastSuccessfulCall = new Date();
      this.status.consecutiveFailures = 0;
      this.resetCircuitBreaker();

      return {
        success: true,
        data: parsedData
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      return {
        success: false,
        error: `Failed to parse cash flow optimization response: ${errorMessage}`
      };
    }
  }

  /**
   * Validate cash flow optimization data structure
   */
  private validateCashFlowOptimizationData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object');
      return { isValid: false, errors };
    }

    // Validate required fields
    if (!Array.isArray(data.strategies)) {
      errors.push('strategies must be an array');
    }

    if (!Array.isArray(data.priorityActions)) {
      errors.push('priorityActions must be an array');
    }

    if (typeof data.projectedImprovement !== 'number') {
      errors.push('projectedImprovement must be a number');
    }

    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
      errors.push('confidence must be a number between 0 and 1');
    }

    if (typeof data.timeline !== 'string') {
      errors.push('timeline must be a string');
    }

    // Validate strategies structure
    if (Array.isArray(data.strategies)) {
      data.strategies.forEach((strategy: any, index: number) => {
        if (!strategy.id || typeof strategy.id !== 'string') {
          errors.push(`Strategy ${index}: id must be a string`);
        }
        if (!strategy.title || typeof strategy.title !== 'string') {
          errors.push(`Strategy ${index}: title must be a string`);
        }
        if (!strategy.description || typeof strategy.description !== 'string') {
          errors.push(`Strategy ${index}: description must be a string`);
        }
        if (!['high', 'medium', 'low'].includes(strategy.impact)) {
          errors.push(`Strategy ${index}: impact must be high, medium, or low`);
        }
        if (!['low', 'medium', 'high'].includes(strategy.effort)) {
          errors.push(`Strategy ${index}: effort must be low, medium, or high`);
        }
      });
    }

    return {
       isValid: errors.length === 0,
       errors
     };
   }
}

// Export singleton instance
export const awsBedrockService = new AWSBedrockService();
export default awsBedrockService;