import json
import boto3
from typing import Dict, Any
from datetime import datetime

textract_client = boto3.client('textract')
dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')

METADATA_TABLE = dynamodb.Table('lexohub-document-metadata-production')
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:YOUR_ACCOUNT:lexohub-textract-completion'

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    for record in event.get('Records', []):
        message_body = json.loads(record['body'])
        
        if 'JobId' in message_body:
            handle_textract_completion(message_body)
        else:
            start_textract_job(message_body)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }

def start_textract_job(classification: Dict[str, Any]) -> None:
    bucket = classification['bucket']
    key = classification['key']
    document_id = classification.get('document_id', key.split('/')[-1])
    
    try:
        response = textract_client.start_document_text_detection(
            DocumentLocation={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            },
            NotificationChannel={
                'SNSTopicArn': SNS_TOPIC_ARN,
                'RoleArn': 'arn:aws:iam::YOUR_ACCOUNT:role/lexohub-textract-role'
            },
            JobTag=document_id
        )
        
        job_id = response['JobId']
        
        update_metadata(
            document_id=document_id,
            status='PROCESSING',
            job_id=job_id,
            tier=1,
            classification=classification
        )
        
        print(f"Started Textract job {job_id} for document {document_id}")
        
    except Exception as e:
        print(f"Error starting Textract job: {str(e)}")
        update_metadata(
            document_id=document_id,
            status='FAILED',
            error=str(e)
        )
        raise

def handle_textract_completion(message: Dict[str, Any]) -> None:
    job_id = message['JobId']
    status = message['Status']
    
    if status != 'SUCCEEDED':
        print(f"Textract job {job_id} failed with status {status}")
        return
    
    try:
        results = get_textract_results(job_id)
        
        extracted_text = extract_text_from_results(results)
        
        confidence_score = calculate_confidence_score(results)
        
        document_id = message.get('JobTag', job_id)
        
        update_metadata(
            document_id=document_id,
            status='COMPLETED',
            extracted_text=extracted_text,
            confidence=confidence_score,
            tier=1,
            completion_time=datetime.utcnow().isoformat()
        )
        
        print(f"Completed processing for document {document_id} with confidence {confidence_score}")
        
    except Exception as e:
        print(f"Error handling Textract completion: {str(e)}")
        raise

def get_textract_results(job_id: str) -> list:
    results = []
    next_token = None
    
    while True:
        if next_token:
            response = textract_client.get_document_text_detection(
                JobId=job_id,
                NextToken=next_token
            )
        else:
            response = textract_client.get_document_text_detection(
                JobId=job_id
            )
        
        results.extend(response.get('Blocks', []))
        
        next_token = response.get('NextToken')
        if not next_token:
            break
    
    return results

def extract_text_from_results(blocks: list) -> str:
    lines = []
    
    for block in blocks:
        if block['BlockType'] == 'LINE':
            lines.append(block.get('Text', ''))
    
    return '\n'.join(lines)

def calculate_confidence_score(blocks: list) -> float:
    if not blocks:
        return 0.0
    
    confidences = []
    
    for block in blocks:
        if block['BlockType'] in ['LINE', 'WORD']:
            confidence = block.get('Confidence', 0)
            confidences.append(confidence)
    
    if not confidences:
        return 0.0
    
    avg_confidence = sum(confidences) / len(confidences)
    
    return round(avg_confidence / 100, 4)

def update_metadata(
    document_id: str,
    status: str,
    **kwargs
) -> None:
    try:
        update_expression_parts = ['#status = :status', 'updatedAt = :updated_at']
        expression_attribute_names = {'#status': 'status'}
        expression_attribute_values = {
            ':status': status,
            ':updated_at': datetime.utcnow().isoformat()
        }
        
        if 'job_id' in kwargs:
            update_expression_parts.append('jobId = :job_id')
            expression_attribute_values[':job_id'] = kwargs['job_id']
        
        if 'tier' in kwargs:
            update_expression_parts.append('processingTier = :tier')
            expression_attribute_values[':tier'] = kwargs['tier']
        
        if 'classification' in kwargs:
            update_expression_parts.append('classification = :classification')
            expression_attribute_values[':classification'] = kwargs['classification']
        
        if 'extracted_text' in kwargs:
            update_expression_parts.append('extractedText = :text')
            expression_attribute_values[':text'] = kwargs['extracted_text']
        
        if 'confidence' in kwargs:
            update_expression_parts.append('confidence = :confidence')
            expression_attribute_values[':confidence'] = kwargs['confidence']
        
        if 'error' in kwargs:
            update_expression_parts.append('errorMessage = :error')
            expression_attribute_values[':error'] = kwargs['error']
        
        if 'completion_time' in kwargs:
            update_expression_parts.append('completionTime = :completion_time')
            expression_attribute_values[':completion_time'] = kwargs['completion_time']
        
        update_expression = 'SET ' + ', '.join(update_expression_parts)
        
        METADATA_TABLE.update_item(
            Key={'documentId': document_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
        
    except Exception as e:
        print(f"Error updating metadata: {str(e)}")
        raise
