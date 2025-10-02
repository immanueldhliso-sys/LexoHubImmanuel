# AWS Lambda Functions - Complete Implementation

## Tier 1: Simple Text Extraction

```typescript
// lambda/tier1/simple-extraction.ts
import { SQSEvent } from 'aws-lambda';
import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from '@aws-sdk/client-textract';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';

export class Tier1SimpleExtraction {
  private textractClient: TextractClient;
  private dynamoClient: DynamoDBClient;
  private snsClient: SNSClient;

  constructor() {
    this.textractClient = new TextractClient({});
    this.dynamoClient = new DynamoDBClient({});
    this.snsClient = new SNSClient({});
  }

  async handler(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      await this.processDocument(message);
    }
  }

  private async processDocument(message: any): Promise<void> {
    const jobId = await this.startTextractJob(message.documentId);
    
    await this.subscribeToCompletion(jobId, message.documentId);
  }

  private async startTextractJob(documentId: string): Promise<string> {
    const response = await this.textractClient.send(new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: process.env.DOCUMENT_BUCKET!,
          Name: documentId
        }
      },
      NotificationChannel: {
        SNSTopicArn: process.env.TEXTRACT_SNS_TOPIC!,
        RoleArn: process.env.TEXTRACT_ROLE_ARN!
      }
    }));

    return response.JobId!;
  }

  private async subscribeToCompletion(jobId: string, documentId: string): Promise<void> {
    await this.snsClient.send(new SubscribeCommand({
      TopicArn: process.env.TEXTRACT_SNS_TOPIC!,
      Protocol: 'lambda',
      Endpoint: process.env.TIER1_COMPLETION_LAMBDA_ARN!,
      Attributes: {
        FilterPolicy: JSON.stringify({
          JobId: [jobId]
        })
      }
    }));
  }

  async handleCompletion(jobId: string, documentId: string): Promise<void> {
    const result = await this.textractClient.send(new GetDocumentTextDetectionCommand({
      JobId: jobId
    }));

    const extractedText = result.Blocks
      ?.filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .join('\n') || '';

    const confidence = this.calculateAggregateConfidence(result.Blocks || []);

    await this.saveResults(documentId, extractedText, confidence, 1);
  }

  private calculateAggregateConfidence(blocks: any[]): number {
    const confidences = blocks
      .filter(block => block.Confidence !== undefined)
      .map(block => block.Confidence);

    return confidences.length > 0
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length / 100
      : 0;
  }

  private async saveResults(documentId: string, extractedText: string, confidence: number, tier: number): Promise<void> {
    await this.dynamoClient.send(new PutItemCommand({
      TableName: 'DocumentMetadata',
      Item: {
        documentId: { S: documentId },
        extractedText: { S: extractedText },
        confidence: { N: confidence.toString() },
        processingTier: { N: tier.toString() },
        processingStatus: { S: 'completed' },
        completedAt: { N: Date.now().toString() }
      }
    }));
  }
}

export const handler = async (event: SQSEvent) => {
  const processor = new Tier1SimpleExtraction();
  await processor.handler(event);
};

export const completionHandler = async (event: any) => {
  const processor = new Tier1SimpleExtraction();
  const message = JSON.parse(event.Records[0].Sns.Message);
  await processor.handleCompletion(message.JobId, message.DocumentId);
};
```

## Tier 2: Structured Analysis

```typescript
// lambda/tier2/structured-analysis.ts
import { SQSEvent } from 'aws-lambda';
import { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } from '@aws-sdk/client-textract';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

interface StructuredData {
  forms: Record<string, string>;
  tables: any[][];
  queries: Record<string, string>;
}

export class Tier2StructuredAnalysis {
  private textractClient: TextractClient;
  private dynamoClient: DynamoDBClient;

  constructor() {
    this.textractClient = new TextractClient({});
    this.dynamoClient = new DynamoDBClient({});
  }

  async handler(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      await this.processDocument(message);
    }
  }

  private async processDocument(message: any): Promise<void> {
    const featureTypes = this.selectFeatureTypes(message.documentType);
    
    const jobId = await this.startAnalysisJob(message.documentId, featureTypes);
    
    setTimeout(async () => {
      await this.pollAndProcessResults(jobId, message.documentId);
    }, 5000);
  }

  private selectFeatureTypes(documentType: string): string[] {
    const featureMap: Record<string, string[]> = {
      invoice: ['FORMS', 'TABLES'],
      contract: ['FORMS', 'QUERIES'],
      court_filing: ['FORMS'],
      engagement_letter: ['FORMS', 'TABLES']
    };

    return featureMap[documentType] || ['FORMS'];
  }

  private async startAnalysisJob(documentId: string, featureTypes: string[]): Promise<string> {
    const response = await this.textractClient.send(new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: process.env.DOCUMENT_BUCKET!,
          Name: documentId
        }
      },
      FeatureTypes: featureTypes as any[],
      NotificationChannel: {
        SNSTopicArn: process.env.TEXTRACT_SNS_TOPIC!,
        RoleArn: process.env.TEXTRACT_ROLE_ARN!
      }
    }));

    return response.JobId!;
  }

  private async pollAndProcessResults(jobId: string, documentId: string): Promise<void> {
    let nextToken: string | undefined;
    const allBlocks: any[] = [];

    do {
      const response = await this.textractClient.send(new GetDocumentAnalysisCommand({
        JobId: jobId,
        NextToken: nextToken
      }));

      if (response.Blocks) {
        allBlocks.push(...response.Blocks);
      }

      nextToken = response.NextToken;
    } while (nextToken);

    const structuredData = this.parseStructuredData(allBlocks);
    const confidence = this.calculateConfidence(allBlocks);

    await this.saveResults(documentId, structuredData, confidence);
  }

  private parseStructuredData(blocks: any[]): StructuredData {
    const forms: Record<string, string> = {};
    const tables: any[][] = [];
    const queries: Record<string, string> = {};

    const keyValuePairs = this.extractKeyValuePairs(blocks);
    Object.assign(forms, keyValuePairs);

    const extractedTables = this.extractTables(blocks);
    tables.push(...extractedTables);

    return { forms, tables, queries };
  }

  private extractKeyValuePairs(blocks: any[]): Record<string, string> {
    const pairs: Record<string, string> = {};
    const keyMap = new Map<string, any>();
    const valueMap = new Map<string, any>();

    blocks.forEach(block => {
      if (block.BlockType === 'KEY_VALUE_SET') {
        if (block.EntityTypes?.includes('KEY')) {
          keyMap.set(block.Id, block);
        } else if (block.EntityTypes?.includes('VALUE')) {
          valueMap.set(block.Id, block);
        }
      }
    });

    keyMap.forEach((keyBlock, keyId) => {
      const keyText = this.getBlockText(keyBlock, blocks);
      
      const valueId = keyBlock.Relationships
        ?.find((rel: any) => rel.Type === 'VALUE')
        ?.Ids?.[0];

      if (valueId && valueMap.has(valueId)) {
        const valueBlock = valueMap.get(valueId);
        const valueText = this.getBlockText(valueBlock, blocks);
        pairs[keyText] = valueText;
      }
    });

    return pairs;
  }

  private extractTables(blocks: any[]): any[][] {
    const tables: any[][] = [];
    const tableBlocks = blocks.filter(block => block.BlockType === 'TABLE');

    tableBlocks.forEach(tableBlock => {
      const cells = this.getTableCells(tableBlock, blocks);
      const table = this.organizeCellsIntoTable(cells);
      tables.push(table);
    });

    return tables;
  }

  private getTableCells(tableBlock: any, blocks: any[]): any[] {
    const cellIds = tableBlock.Relationships
      ?.find((rel: any) => rel.Type === 'CHILD')
      ?.Ids || [];

    return cellIds
      .map((id: string) => blocks.find(block => block.Id === id))
      .filter((block: any) => block?.BlockType === 'CELL');
  }

  private organizeCellsIntoTable(cells: any[]): any[][] {
    const maxRow = Math.max(...cells.map(cell => cell.RowIndex || 0));
    const maxCol = Math.max(...cells.map(cell => cell.ColumnIndex || 0));

    const table: any[][] = Array(maxRow).fill(null).map(() => Array(maxCol).fill(''));

    cells.forEach(cell => {
      const row = (cell.RowIndex || 1) - 1;
      const col = (cell.ColumnIndex || 1) - 1;
      table[row][col] = cell.Text || '';
    });

    return table;
  }

  private getBlockText(block: any, blocks: any[]): string {
    const childIds = block.Relationships
      ?.find((rel: any) => rel.Type === 'CHILD')
      ?.Ids || [];

    return childIds
      .map((id: string) => blocks.find(b => b.Id === id))
      .filter((b: any) => b?.BlockType === 'WORD')
      .map((b: any) => b.Text)
      .join(' ');
  }

  private calculateConfidence(blocks: any[]): number {
    const confidences = blocks
      .filter(block => block.Confidence !== undefined)
      .map(block => block.Confidence);

    return confidences.length > 0
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length / 100
      : 0;
  }

  private async saveResults(documentId: string, structuredData: StructuredData, confidence: number): Promise<void> {
    await this.dynamoClient.send(new PutItemCommand({
      TableName: 'DocumentMetadata',
      Item: {
        documentId: { S: documentId },
        structuredData: { S: JSON.stringify(structuredData) },
        confidence: { N: confidence.toString() },
        processingTier: { N: '2' },
        processingStatus: { S: 'completed' },
        completedAt: { N: Date.now().toString() }
      }
    }));
  }
}

export const handler = async (event: SQSEvent) => {
  const processor = new Tier2StructuredAnalysis();
  await processor.handler(event);
};
```

## Tier 3: Bedrock AI Integration

```typescript
// lambda/tier3/bedrock-extraction.ts
import { SQSEvent } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } from '@aws-sdk/client-textract';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

type ClaudeModel = 'claude-3-5-haiku' | 'claude-3-5-sonnet' | 'claude-3-opus';

export class Tier3BedrockExtraction {
  private bedrockClient: BedrockRuntimeClient;
  private textractClient: TextractClient;
  private dynamoClient: DynamoDBClient;

  private modelIds: Record<ClaudeModel, string> = {
    'claude-3-5-haiku': 'anthropic.claude-3-5-haiku-20241022-v1:0',
    'claude-3-5-sonnet': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'claude-3-opus': 'anthropic.claude-3-opus-20240229-v1:0'
  };

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({});
    this.textractClient = new TextractClient({});
    this.dynamoClient = new DynamoDBClient({});
  }

  async handler(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      await this.processDocument(message);
    }
  }

  private async processDocument(message: any): Promise<void> {
    const textractData = await this.getTextractData(message.documentId);
    
    const model = this.selectModel(textractData.confidence, message.documentType);
    
    const extractedData = await this.extractWithBedrock(
      textractData.text,
      message.documentType,
      model
    );

    await this.saveResults(message.documentId, extractedData, model);
  }

  private async getTextractData(documentId: string): Promise<{ text: string; confidence: number }> {
    const jobId = await this.startTextractJob(documentId);
    
    await this.waitForCompletion(jobId);
    
    const result = await this.textractClient.send(new GetDocumentAnalysisCommand({
      JobId: jobId
    }));

    const text = result.Blocks
      ?.filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .join('\n') || '';

    const confidence = result.Blocks
      ?.filter(block => block.Confidence !== undefined)
      .reduce((sum, block) => sum + (block.Confidence || 0), 0) / (result.Blocks?.length || 1) / 100;

    return { text, confidence: confidence || 0 };
  }

  private async startTextractJob(documentId: string): Promise<string> {
    const response = await this.textractClient.send(new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: process.env.DOCUMENT_BUCKET!,
          Name: documentId
        }
      },
      FeatureTypes: ['FORMS', 'TABLES', 'QUERIES']
    }));

    return response.JobId!;
  }

  private async waitForCompletion(jobId: string): Promise<void> {
    let status = 'IN_PROGRESS';
    
    while (status === 'IN_PROGRESS') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await this.textractClient.send(new GetDocumentAnalysisCommand({
        JobId: jobId
      }));
      
      status = result.JobStatus || 'FAILED';
    }
  }

  private selectModel(textractConfidence: number, documentType: string): ClaudeModel {
    if (textractConfidence > 0.9) {
      return 'claude-3-5-haiku';
    }
    
    if (textractConfidence > 0.7 || ['invoice', 'engagement_letter'].includes(documentType)) {
      return 'claude-3-5-sonnet';
    }
    
    return 'claude-3-opus';
  }

  private async extractWithBedrock(
    text: string,
    documentType: string,
    model: ClaudeModel
  ): Promise<any> {
    const prompt = this.constructPrompt(text, documentType);
    
    try {
      return await this.invokeModel(prompt, model);
    } catch (error) {
      return await this.fallbackChain(prompt, model);
    }
  }

  private constructPrompt(text: string, documentType: string): string {
    const fieldMappings: Record<string, string[]> = {
      invoice: ['invoice_number', 'date', 'total_amount', 'vendor_name', 'line_items'],
      contract: ['parties', 'effective_date', 'termination_date', 'key_terms', 'signatures'],
      court_filing: ['case_number', 'court_name', 'filing_date', 'parties', 'relief_sought'],
      engagement_letter: ['client_name', 'matter_description', 'fee_structure', 'scope_of_work']
    };

    const fields = fieldMappings[documentType] || [];

    return `You are a legal document extraction AI. Extract the following fields from this ${documentType}:

Fields to extract: ${fields.join(', ')}

Document text:
${text}

Return a JSON object with the extracted fields. If a field is not found, set it to null.`;
  }

  private async invokeModel(prompt: string, model: ClaudeModel): Promise<any> {
    const response = await this.bedrockClient.send(new InvokeModelCommand({
      modelId: this.modelIds[model],
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return JSON.parse(responseBody.content[0].text);
  }

  private async fallbackChain(prompt: string, currentModel: ClaudeModel): Promise<any> {
    const fallbackOrder: ClaudeModel[] = ['claude-3-5-haiku', 'claude-3-5-sonnet', 'claude-3-opus'];
    const currentIndex = fallbackOrder.indexOf(currentModel);

    for (let i = currentIndex + 1; i < fallbackOrder.length; i++) {
      try {
        return await this.invokeModel(prompt, fallbackOrder[i]);
      } catch (error) {
        if (i === fallbackOrder.length - 1) {
          throw error;
        }
      }
    }

    throw new Error('All models failed');
  }

  private async saveResults(documentId: string, extractedData: any, model: ClaudeModel): Promise<void> {
    await this.dynamoClient.send(new PutItemCommand({
      TableName: 'DocumentMetadata',
      Item: {
        documentId: { S: documentId },
        extractedData: { S: JSON.stringify(extractedData) },
        processingTier: { N: '3' },
        aiModel: { S: model },
        processingStatus: { S: 'completed' },
        completedAt: { N: Date.now().toString() }
      }
    }));
  }
}

export const handler = async (event: SQSEvent) => {
  const processor = new Tier3BedrockExtraction();
  await processor.handler(event);
};
```

## Tier 0: Template-Based Fast Path

```typescript
// lambda/tier0/template-extraction.ts
import { SQSEvent } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import * as pdfjsLib from 'pdfjs-dist';

export class Tier0TemplateExtraction {
  private s3Client: S3Client;
  private dynamoClient: DynamoDBClient;

  constructor() {
    this.s3Client = new S3Client({});
    this.dynamoClient = new DynamoDBClient({});
  }

  async handler(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      await this.processDocument(message);
    }
  }

  private async processDocument(message: any): Promise<void> {
    const template = await this.getTemplate(message.structuralHash);
    
    if (!template) {
      throw new Error('Template not found');
    }

    const documentBuffer = await this.getDocument(message.documentId);
    const extractedData = await this.extractUsingTemplate(documentBuffer, template.fieldMappings);

    await this.saveResults(message.documentId, extractedData);
  }

  private async getTemplate(structuralHash: string): Promise<any> {
    const response = await this.dynamoClient.send(new GetItemCommand({
      TableName: 'TemplateCache',
      Key: {
        structuralHash: { S: structuralHash }
      }
    }));

    if (!response.Item) {
      return null;
    }

    return {
      documentType: response.Item.documentType.S,
      fieldMappings: JSON.parse(response.Item.fieldMappings.S!)
    };
  }

  private async getDocument(documentId: string): Promise<Buffer> {
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: process.env.DOCUMENT_BUCKET!,
      Key: documentId
    }));

    return Buffer.from(await response.Body!.transformToByteArray());
  }

  private async extractUsingTemplate(documentBuffer: Buffer, fieldMappings: any): Promise<any> {
    const pdf = await pdfjsLib.getDocument({ data: documentBuffer }).promise;
    const extractedData: Record<string, string> = {};

    for (const [fieldName, coordinates] of Object.entries(fieldMappings)) {
      const { page, x, y, width, height } = coordinates as any;
      const pdfPage = await pdf.getPage(page);
      
      const textContent = await pdfPage.getTextContent();
      const text = this.extractTextFromRegion(textContent, x, y, width, height);
      
      extractedData[fieldName] = text;
    }

    return extractedData;
  }

  private extractTextFromRegion(textContent: any, x: number, y: number, width: number, height: number): string {
    const items = textContent.items.filter((item: any) => {
      const itemX = item.transform[4];
      const itemY = item.transform[5];
      
      return itemX >= x && itemX <= x + width &&
             itemY >= y && itemY <= y + height;
    });

    return items.map((item: any) => item.str).join(' ');
  }

  private async saveResults(documentId: string, extractedData: any): Promise<void> {
    await this.dynamoClient.send(new PutItemCommand({
      TableName: 'DocumentMetadata',
      Item: {
        documentId: { S: documentId },
        extractedData: { S: JSON.stringify(extractedData) },
        processingTier: { N: '0' },
        processingStatus: { S: 'completed' },
        completedAt: { N: Date.now().toString() }
      }
    }));
  }
}

export const handler = async (event: SQSEvent) => {
  const processor = new Tier0TemplateExtraction();
  await processor.handler(event);
};
```

## Deployment Configuration

```yaml
# serverless.yml
service: lexohub-document-processing

provider:
  name: aws
  runtime: nodejs18.x
  region: ${env:AWS_REGION, 'us-east-1'}
  memorySize: 512
  timeout: 900
  environment:
    DOCUMENT_BUCKET: ${self:custom.documentBucket}
    TEXTRACT_SNS_TOPIC: ${self:custom.textractSnsTopic}
    TEXTRACT_ROLE_ARN: ${self:custom.textractRoleArn}

functions:
  lambda0Classifier:
    handler: lambda/classification/lambda0-classifier.handler
    memorySize: 1024
    provisionedConcurrency: 2
    events:
      - eventBridge:
          pattern:
            source:
              - aws.s3
            detail-type:
              - Object Created
            detail:
              bucket:
                name:
                  - ${self:custom.documentBucket}

  tier0TemplateExtraction:
    handler: lambda/tier0/template-extraction.handler
    memorySize: 512
    provisionedConcurrency: 2
    events:
      - sqs:
          arn: !GetAtt Tier0Queue.Arn
          batchSize: 1

  tier1SimpleExtraction:
    handler: lambda/tier1/simple-extraction.handler
    memorySize: 1024
    events:
      - sqs:
          arn: !GetAtt Tier1Queue.Arn
          batchSize: 1

  tier2StructuredAnalysis:
    handler: lambda/tier2/structured-analysis.handler
    memorySize: 2048
    events:
      - sqs:
          arn: !GetAtt Tier2Queue.Arn
          batchSize: 1

  tier3BedrockExtraction:
    handler: lambda/tier3/bedrock-extraction.handler
    memorySize: 3008
    timeout: 900
    events:
      - sqs:
          arn: !GetAtt Tier3Queue.Arn
          batchSize: 1

resources:
  Resources:
    Tier0Queue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: lexohub-tier0-queue
        VisibilityTimeout: 900
        RedrivePolicy:
          deadLetterTargetArn: !GetAtt DeadLetterQueue.Arn
          maxReceiveCount: 3

    Tier1Queue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: lexohub-tier1-queue
        VisibilityTimeout: 900
        RedrivePolicy:
          deadLetterTargetArn: !GetAtt DeadLetterQueue.Arn
          maxReceiveCount: 3

    Tier2Queue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: lexohub-tier2-queue
        VisibilityTimeout: 900
        RedrivePolicy:
          deadLetterTargetArn: !GetAtt DeadLetterQueue.Arn
          maxReceiveCount: 3

    Tier3Queue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: lexohub-tier3-queue
        VisibilityTimeout: 900
        RedrivePolicy:
          deadLetterTargetArn: !GetAtt DeadLetterQueue.Arn
          maxReceiveCount: 3

    DeadLetterQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: lexohub-dlq
        MessageRetentionPeriod: 1209600

custom:
  documentBucket: lexohub-documents-${self:provider.stage}
  textractSnsTopic: arn:aws:sns:${self:provider.region}:${aws:accountId}:lexohub-textract-completion
  textractRoleArn: arn:aws:iam::${aws:accountId}:role/LexoHubTextractRole
```
