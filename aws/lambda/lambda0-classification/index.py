import json
import hashlib
import re
import boto3
from typing import Dict, Any, Optional
import PyPDF2
import fitz

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs_client = boto3.client('sqs')

TEMPLATE_CACHE_TABLE = dynamodb.Table('lexohub-template-cache-production')
TIER0_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT/lexohub-tier0-queue'
TIER1_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT/lexohub-tier1-queue'
TIER2_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT/lexohub-tier2-queue'
TIER3_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT/lexohub-tier3-queue'

FILENAME_PATTERNS = {
    'invoice': r'(?i)(invoice|bill|receipt)[-_]?\d+',
    'contract': r'(?i)(contract|agreement)[-_]?[a-z0-9]+',
    'court_filing': r'(?i)(motion|petition|complaint|answer)[-_]?',
    'correspondence': r'(?i)(letter|memo|email)[-_]?',
    'pleading': r'(?i)(pleading|brief|memorandum)[-_]?'
}

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    for record in event.get('Records', []):
        if 'eventbridge' in record.get('source', ''):
            bucket = record['detail']['bucket']['name']
            key = record['detail']['object']['key']
        else:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
        
        try:
            classification_result = classify_document(bucket, key)
            
            route_to_tier(classification_result)
            
        except Exception as e:
            print(f"Error processing {key}: {str(e)}")
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('Classification complete')
    }

def classify_document(bucket: str, key: str) -> Dict[str, Any]:
    local_path = f'/tmp/{key.split("/")[-1]}'
    s3_client.download_file(bucket, key, local_path)
    
    structural_hash = generate_structural_hash(local_path)
    
    template_match = check_template_cache(structural_hash)
    
    if template_match and template_match['confidence'] > 0.85:
        return {
            'bucket': bucket,
            'key': key,
            'tier': 0,
            'structural_hash': structural_hash,
            'template_id': template_match['template_id'],
            'confidence': template_match['confidence'],
            'document_type': template_match['document_type']
        }
    
    filename_classification = classify_by_filename(key)
    
    header_analysis = analyze_document_header(local_path)
    
    tier = determine_processing_tier(
        template_match,
        filename_classification,
        header_analysis
    )
    
    return {
        'bucket': bucket,
        'key': key,
        'tier': tier,
        'structural_hash': structural_hash,
        'document_type': filename_classification or header_analysis.get('type', 'unknown'),
        'confidence': header_analysis.get('confidence', 0.5),
        'metadata': {
            'page_count': header_analysis.get('page_count', 0),
            'has_tables': header_analysis.get('has_tables', False),
            'has_forms': header_analysis.get('has_forms', False)
        }
    }

def generate_structural_hash(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        
        structural_features = []
        
        if len(doc) > 0:
            first_page = doc[0]
            
            text_blocks = first_page.get_text("dict")["blocks"]
            for block in text_blocks[:5]:
                if "lines" in block:
                    for line in block["lines"]:
                        bbox = line["bbox"]
                        structural_features.append(f"{int(bbox[0])},{int(bbox[1])}")
            
            structural_features.append(f"pages:{len(doc)}")
            structural_features.append(f"width:{int(first_page.rect.width)}")
            structural_features.append(f"height:{int(first_page.rect.height)}")
        
        doc.close()
        
        feature_string = "|".join(structural_features)
        return hashlib.sha256(feature_string.encode()).hexdigest()
        
    except Exception as e:
        print(f"Error generating structural hash: {str(e)}")
        return hashlib.sha256(file_path.encode()).hexdigest()

def check_template_cache(structural_hash: str) -> Optional[Dict[str, Any]]:
    try:
        response = TEMPLATE_CACHE_TABLE.query(
            KeyConditionExpression='structuralHash = :hash',
            ExpressionAttributeValues={':hash': structural_hash},
            ScanIndexForward=False,
            Limit=1
        )
        
        if response['Items']:
            template = response['Items'][0]
            return {
                'template_id': template['structuralHash'],
                'confidence': template.get('confidence', 0.0),
                'document_type': template.get('documentType', 'unknown'),
                'field_mappings': template.get('fieldMappings', {})
            }
        
        return None
        
    except Exception as e:
        print(f"Error checking template cache: {str(e)}")
        return None

def classify_by_filename(key: str) -> Optional[str]:
    filename = key.split('/')[-1].lower()
    
    for doc_type, pattern in FILENAME_PATTERNS.items():
        if re.search(pattern, filename):
            return doc_type
    
    return None

def analyze_document_header(file_path: str) -> Dict[str, Any]:
    try:
        doc = fitz.open(file_path)
        
        analysis = {
            'page_count': len(doc),
            'has_tables': False,
            'has_forms': False,
            'confidence': 0.6,
            'type': 'unknown'
        }
        
        if len(doc) > 0:
            first_page = doc[0]
            text = first_page.get_text()
            
            if any(keyword in text.lower() for keyword in ['invoice', 'bill to', 'amount due']):
                analysis['type'] = 'invoice'
                analysis['confidence'] = 0.7
            elif any(keyword in text.lower() for keyword in ['agreement', 'contract', 'parties']):
                analysis['type'] = 'contract'
                analysis['confidence'] = 0.7
            elif any(keyword in text.lower() for keyword in ['court', 'plaintiff', 'defendant']):
                analysis['type'] = 'court_filing'
                analysis['confidence'] = 0.8
            
            tables = first_page.find_tables()
            if tables:
                analysis['has_tables'] = True
            
            form_fields = first_page.widgets()
            if form_fields:
                analysis['has_forms'] = True
        
        doc.close()
        return analysis
        
    except Exception as e:
        print(f"Error analyzing document header: {str(e)}")
        return {
            'page_count': 0,
            'has_tables': False,
            'has_forms': False,
            'confidence': 0.3,
            'type': 'unknown'
        }

def determine_processing_tier(
    template_match: Optional[Dict[str, Any]],
    filename_classification: Optional[str],
    header_analysis: Dict[str, Any]
) -> int:
    if template_match and template_match['confidence'] > 0.85:
        return 0
    
    if header_analysis['page_count'] <= 3 and not header_analysis['has_tables'] and not header_analysis['has_forms']:
        return 1
    
    if header_analysis['has_tables'] or header_analysis['has_forms']:
        return 2
    
    if header_analysis['page_count'] > 10 or header_analysis['confidence'] < 0.5:
        return 3
    
    return 2

def route_to_tier(classification: Dict[str, Any]) -> None:
    tier = classification['tier']
    
    queue_urls = {
        0: TIER0_QUEUE_URL,
        1: TIER1_QUEUE_URL,
        2: TIER2_QUEUE_URL,
        3: TIER3_QUEUE_URL
    }
    
    queue_url = queue_urls.get(tier, TIER2_QUEUE_URL)
    
    message_body = json.dumps(classification)
    
    sqs_client.send_message(
        QueueUrl=queue_url,
        MessageBody=message_body,
        MessageAttributes={
            'Tier': {
                'StringValue': str(tier),
                'DataType': 'Number'
            },
            'DocumentType': {
                'StringValue': classification['document_type'],
                'DataType': 'String'
            }
        }
    )
    
    print(f"Routed document {classification['key']} to Tier {tier}")
