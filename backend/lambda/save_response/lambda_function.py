"""
Lambda function to save survey responses to S3
Handles both company and employee responses with file uploads
"""
import json
import logging
import os
import sys
import base64
import uuid
from datetime import datetime

# Add the shared layer to the path
sys.path.append('/opt/python')

from s3_utils import S3Utils, lambda_response

# Set up logging
logger = logging.getLogger(__name__)
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(getattr(logging, log_level))

# Initialize S3 utilities
SURVEY_BUCKET = os.environ.get('SURVEY_BUCKET')
s3_utils = S3Utils(SURVEY_BUCKET)

def parse_request_body(event):
    """
    Robust parsing of request body from various event formats.
    Handles API Gateway proxy integration and direct invocation.
    """
    logger.info(f"Parsing request body from event keys: {list(event.keys())}")
    
    # Method 1: Standard API Gateway proxy integration
    if 'body' in event:
        body = event['body']
        
        # Handle base64 encoded body
        if event.get('isBase64Encoded', False):
            try:
                body = base64.b64decode(body).decode('utf-8')
                logger.info("Decoded base64 encoded body")
            except Exception as e:
                logger.error(f"Failed to decode base64 body: {e}")
                raise ValueError("Failed to decode base64 encoded body")
        
        # Parse JSON body
        if body:
            try:
                if isinstance(body, str):
                    request_data = json.loads(body)
                else:
                    request_data = body
                logger.info(f"Successfully parsed request body with keys: {list(request_data.keys())}")
                return request_data
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in request body: {e}")
                raise ValueError("Request body must be valid JSON")
        else:
            logger.warning("Empty request body")
            return {}
    
    # Method 2: Direct invocation with data directly in event
    # Check if the event itself contains the request data
    required_fields = ['type', 'company_id', 'responses']
    if all(field in event for field in required_fields[:2]):  # At least type and company_id
        logger.info("Using event data directly (direct invocation)")
        return event
    
    # Method 3: Check if data is in a nested structure
    for key in ['data', 'requestData', 'payload']:
        if key in event and isinstance(event[key], dict):
            logger.info(f"Found request data in event['{key}']")
            return event[key]
    
    # If we get here, we couldn't find valid request data
    logger.error("No valid request data found in event")
    raise ValueError("No valid request data found")

def lambda_handler(event, context):
    """
    Lambda handler to save survey responses
    
    Expected POST body:
    {
        "type": "company" | "employee",
        "company_id": "string",
        "employee_id": "string" (required for employee type),
        "responses": {...},
        "files": [
            {
                "filename": "string",
                "content": "base64_encoded_content",
                "content_type": "string"
            }
        ]
    }
    
    Returns:
    - 200: Response saved successfully
    - 400: Invalid request
    - 500: Internal error
    """
    try:
        logger.info(f"=== SAVE RESPONSE REQUEST START ===")
        logger.info(f"Received event keys: {list(event.keys())}")
        logger.info(f"HTTP Method: {event.get('httpMethod', 'N/A')}")
        logger.info(f"Request ID: {context.aws_request_id if context else 'N/A'}")
        
        # Parse request body with robust error handling
        try:
            request_data = parse_request_body(event)
        except ValueError as e:
            return lambda_response(400, {
                'error': 'Invalid request body',
                'message': str(e),
                'help': 'Ensure request body contains valid JSON with required fields'
            })
        
        # Validate required fields
        response_type = request_data.get('type')
        company_id = request_data.get('company_id')
        responses = request_data.get('responses', {})
        
        if not response_type:
            return lambda_response(400, {
                'error': 'Missing type',
                'message': 'Type must be specified (company or employee)',
                'received_fields': list(request_data.keys())
            })
        
        if response_type not in ['company', 'employee']:
            return lambda_response(400, {
                'error': 'Invalid type',
                'message': 'Type must be either "company" or "employee"',
                'received_type': response_type
            })
        
        if not company_id:
            return lambda_response(400, {
                'error': 'Missing company_id',
                'message': 'Company ID is required',
                'received_fields': list(request_data.keys())
            })
        
        # Validate employee-specific requirements
        employee_id = None
        if response_type == 'employee':
            employee_id = request_data.get('employee_id')
            if not employee_id:
                return lambda_response(400, {
                    'error': 'Missing employee_id',
                    'message': 'Employee ID is required for employee responses',
                    'received_fields': list(request_data.keys())
                })
        
        # Sanitize IDs (remove special characters)
        company_id = ''.join(c for c in company_id if c.isalnum() or c in '-_')
        if employee_id:
            employee_id = ''.join(c for c in employee_id if c.isalnum() or c in '-_')
        
        logger.info(f"Processing {response_type} response for company: {company_id}, employee: {employee_id or 'N/A'}")
        
        # Prepare response data
        timestamp = datetime.utcnow().isoformat() + 'Z'
        response_data = {
            'type': response_type,
            'company_id': company_id,
            'responses': responses,
            'submitted_at': timestamp,
            'updated_at': timestamp,
            'request_id': context.aws_request_id if context else None
        }
        
        if employee_id:
            response_data['employee_id'] = employee_id
        
        # Determine storage path
        if response_type == 'company':
            json_key = f"companies/{company_id}/form.json"
        else:
            json_key = f"companies/{company_id}/employees/{employee_id}.json"
        
        # Check if response already exists to preserve created_at timestamp
        try:
            existing_data = s3_utils.read_json_file(json_key)
            if existing_data.get('submitted_at'):
                response_data['submitted_at'] = existing_data['submitted_at']
                logger.info("Preserved original submission timestamp")
        except Exception as e:
            # No existing response or error reading, which is fine for new submissions
            logger.debug(f"No existing response found or error reading: {e}")
        
        # Save response data
        logger.info(f"Saving response to {json_key}")
        s3_utils.write_json_file(json_key, response_data)
        
        # Handle file uploads for employee responses
        uploaded_files = []
        files = request_data.get('files', [])
        
        if files and response_type == 'employee':
            logger.info(f"Processing {len(files)} file uploads")
            
            for i, file_data in enumerate(files):
                try:
                    filename = file_data.get('filename', f'upload_{uuid.uuid4()}')
                    content_type = file_data.get('content_type', 'application/octet-stream')
                    file_content_b64 = file_data.get('content', '')
                    
                    if not file_content_b64:
                        logger.warning(f"Empty file content for file {i+1}: {filename}")
                        continue
                    
                    # Decode base64 content
                    try:
                        file_content = base64.b64decode(file_content_b64)
                    except Exception as e:
                        logger.error(f"Failed to decode base64 content for {filename}: {e}")
                        continue
                    
                    # Create safe filename
                    safe_filename = ''.join(c for c in filename if c.isalnum() or c in '.-_')
                    if not safe_filename:
                        safe_filename = f'upload_{uuid.uuid4()}'
                    
                    # Upload file
                    file_key = f"companies/{company_id}/employees/{employee_id}/files/{safe_filename}"
                    s3_utils.upload_file(file_key, file_content, content_type)
                    
                    uploaded_files.append({
                        'filename': safe_filename,
                        'original_filename': filename,
                        'content_type': content_type,
                        'size': len(file_content),
                        'uploaded_at': timestamp,
                        'file_key': file_key
                    })
                    
                    logger.info(f"Successfully uploaded file: {safe_filename} ({len(file_content)} bytes)")
                    
                except Exception as e:
                    logger.error(f"Failed to upload file {i+1} ({filename}): {str(e)}")
                    # Continue with other files instead of failing the entire request
        elif files and response_type == 'company':
            logger.warning("File uploads are not supported for company responses")
        
        # Update response data with file information
        if uploaded_files:
            response_data['files'] = uploaded_files
            s3_utils.write_json_file(json_key, response_data)
            logger.info(f"Updated response with {len(uploaded_files)} file references")
        
        logger.info(f"Successfully saved {response_type} response for {company_id}")
        
        # Return successful response
        return lambda_response(200, {
            'message': 'Response saved successfully',
            'type': response_type,
            'company_id': company_id,
            'employee_id': employee_id,
            'response_count': len(responses),
            'uploaded_files': len(uploaded_files),
            'saved_at': timestamp,
            'storage_path': json_key,
            'request_id': context.aws_request_id if context else None
        })
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return lambda_response(500, {
            'error': 'Internal server error',
            'message': 'Failed to save response',
            'request_id': context.aws_request_id if context else None,
            'error_details': str(e) if log_level == 'DEBUG' else 'Enable DEBUG logging for details'
        })


# For local testing
if __name__ == "__main__":
    # Test events for different scenarios
    test_events = [
        # API Gateway Proxy Integration format with JSON body
        {
            'httpMethod': 'POST',
            'body': json.dumps({
                'type': 'company',
                'company_id': 'test-company-123',
                'responses': {
                    'q1': 'Yes',
                    'q2': 'Advanced',
                    'q3': 'We have a comprehensive AI strategy'
                }
            }),
            'isBase64Encoded': False,
            'headers': {'Content-Type': 'application/json'}
        },
        # Employee response with files
        {
            'httpMethod': 'POST',
            'body': json.dumps({
                'type': 'employee',
                'company_id': 'test-company-123',
                'employee_id': 'john-doe',
                'responses': {
                    'q1': 'Intermediate',
                    'q2': 'Daily',
                    'q3': 'ChatGPT, Copilot'
                },
                'files': [
                    {
                        'filename': 'resume.pdf',
                        'content': base64.b64encode(b'fake pdf content').decode(),
                        'content_type': 'application/pdf'
                    }
                ]
            }),
            'isBase64Encoded': False
        },
        # Direct invocation format
        {
            'type': 'company',
            'company_id': 'direct-test-company',
            'responses': {'q1': 'Test response'}
        },
        # Invalid event (should fail gracefully)
        {
            'body': '{"invalid": "data"}'
        }
    ]
    
    # Mock context
    class MockContext:
        def __init__(self):
            self.function_name = 'save_response_test'
            self.function_version = '$LATEST'
            self.memory_limit_in_mb = 512
            self.remaining_time_in_millis = 60000
            self.aws_request_id = 'test-request-id-' + str(uuid.uuid4())[:8]
    
    # Set environment variables for testing
    os.environ['SURVEY_BUCKET'] = 'test-bucket'
    os.environ['LOG_LEVEL'] = 'DEBUG'
    
    # Run tests
    for i, test_event in enumerate(test_events):
        print(f"\n{'='*60}")
        print(f"TEST {i+1}: {test_event.get('httpMethod', 'Direct')} - {test_event.get('type', 'Unknown type')}")
        print('='*60)
        result = lambda_handler(test_event, MockContext())
        print(json.dumps(result, indent=2, default=str))
