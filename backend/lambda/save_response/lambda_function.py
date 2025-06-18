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
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Parse request body
        try:
            if event.get('isBase64Encoded', False):
                body = base64.b64decode(event['body']).decode('utf-8')
            else:
                body = event.get('body', '{}')
            
            request_data = json.loads(body)
        except (json.JSONDecodeError, TypeError) as e:
            logger.error(f"Invalid JSON in request body: {str(e)}")
            return lambda_response(400, {
                'error': 'Invalid JSON',
                'message': 'Request body must be valid JSON'
            })
        
        # Validate required fields
        response_type = request_data.get('type')
        company_id = request_data.get('company_id')
        responses = request_data.get('responses', {})
        
        if not response_type:
            return lambda_response(400, {
                'error': 'Missing type',
                'message': 'Type must be specified (company or employee)'
            })
        
        if response_type not in ['company', 'employee']:
            return lambda_response(400, {
                'error': 'Invalid type',
                'message': 'Type must be either company or employee'
            })
        
        if not company_id:
            return lambda_response(400, {
                'error': 'Missing company_id',
                'message': 'Company ID is required'
            })
        
        # Validate employee-specific requirements
        employee_id = None
        if response_type == 'employee':
            employee_id = request_data.get('employee_id')
            if not employee_id:
                return lambda_response(400, {
                    'error': 'Missing employee_id',
                    'message': 'Employee ID is required for employee responses'
                })
        
        # Sanitize IDs (remove special characters)
        company_id = ''.join(c for c in company_id if c.isalnum() or c in '-_')
        if employee_id:
            employee_id = ''.join(c for c in employee_id if c.isalnum() or c in '-_')
        
        # Prepare response data
        timestamp = datetime.utcnow().isoformat() + 'Z'
        response_data = {
            'type': response_type,
            'company_id': company_id,
            'responses': responses,
            'submitted_at': timestamp,
            'updated_at': timestamp
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
        except:
            # No existing response, which is fine
            pass
        
        # Save response data
        logger.info(f"Saving response to {json_key}")
        s3_utils.write_json_file(json_key, response_data)
        
        # Handle file uploads for employee responses
        uploaded_files = []
        files = request_data.get('files', [])
        
        if files and response_type == 'employee':
            logger.info(f"Processing {len(files)} file uploads")
            
            for file_data in files:
                try:
                    filename = file_data.get('filename', f'upload_{uuid.uuid4()}')
                    content_type = file_data.get('content_type', 'application/octet-stream')
                    file_content_b64 = file_data.get('content', '')
                    
                    if not file_content_b64:
                        logger.warning(f"Empty file content for {filename}")
                        continue
                    
                    # Decode base64 content
                    file_content = base64.b64decode(file_content_b64)
                    
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
                        'uploaded_at': timestamp
                    })
                    
                    logger.info(f"Successfully uploaded file: {safe_filename}")
                    
                except Exception as e:
                    logger.error(f"Failed to upload file {filename}: {str(e)}")
                    # Continue with other files
        
        # Update response data with file information
        if uploaded_files:
            response_data['files'] = uploaded_files
            s3_utils.write_json_file(json_key, response_data)
        
        logger.info(f"Successfully saved {response_type} response for {company_id}")
        
        return lambda_response(200, {
            'message': 'Response saved successfully',
            'type': response_type,
            'company_id': company_id,
            'employee_id': employee_id,
            'uploaded_files': len(uploaded_files),
            'saved_at': timestamp
        })
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return lambda_response(500, {
            'error': 'Internal server error',
            'message': 'Failed to save response'
        })


# For local testing
if __name__ == "__main__":
    # Test event for company response
    test_event = {
        'body': json.dumps({
            'type': 'company',
            'company_id': 'test-company-123',
            'responses': {
                'q1': 'Yes',
                'q2': 'Advanced',
                'q3': 'We have a comprehensive AI strategy'
            }
        }),
        'isBase64Encoded': False
    }
    
    # Mock context
    class MockContext:
        def __init__(self):
            self.function_name = 'save_response_test'
            self.function_version = '$LATEST'
            self.memory_limit_in_mb = 512
            self.remaining_time_in_millis = 60000
    
    # Set environment variables for testing
    os.environ['SURVEY_BUCKET'] = 'test-bucket'
    os.environ['LOG_LEVEL'] = 'DEBUG'
    
    # Run test
    result = lambda_handler(test_event, MockContext())
    print(json.dumps(result, indent=2))