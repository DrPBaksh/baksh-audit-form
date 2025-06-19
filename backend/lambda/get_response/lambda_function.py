"""
Lambda function to get existing survey responses from S3
Handles both company and employee response retrieval
"""
import json
import logging
import os
import sys
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

def parse_query_params(event):
    """
    Parse query parameters from API Gateway event
    """
    query_params = {}
    
    # Handle different event formats
    if 'queryStringParameters' in event and event['queryStringParameters']:
        query_params = event['queryStringParameters']
    elif 'query' in event:
        query_params = event['query']
    
    logger.info(f"Parsed query parameters: {query_params}")
    return query_params

def lambda_handler(event, context):
    """
    Lambda handler to get existing survey responses
    
    Expected query parameters:
    - type: "company" or "employee" (required)
    - company_id: string (required)
    - employee_id: string (required for employee type)
    
    Returns:
    - 200: Response data found
    - 404: No response found
    - 400: Invalid request
    - 500: Internal error
    """
    try:
        logger.info(f"=== GET RESPONSE REQUEST START ===")
        logger.info(f"Received event keys: {list(event.keys())}")
        logger.info(f"HTTP Method: {event.get('httpMethod', 'N/A')}")
        logger.info(f"Request ID: {context.aws_request_id if context else 'N/A'}")
        
        # Parse query parameters
        query_params = parse_query_params(event)
        
        # Validate required parameters
        response_type = query_params.get('type')
        company_id = query_params.get('company_id')
        employee_id = query_params.get('employee_id')
        
        if not response_type:
            return lambda_response(400, {
                'error': 'Missing type parameter',
                'message': 'Type must be specified (company or employee)',
                'received_params': list(query_params.keys())
            })
        
        if response_type not in ['company', 'employee']:
            return lambda_response(400, {
                'error': 'Invalid type parameter',
                'message': 'Type must be either "company" or "employee"',
                'received_type': response_type
            })
        
        if not company_id:
            return lambda_response(400, {
                'error': 'Missing company_id parameter',
                'message': 'Company ID is required',
                'received_params': list(query_params.keys())
            })
        
        # Validate employee-specific requirements
        if response_type == 'employee' and not employee_id:
            return lambda_response(400, {
                'error': 'Missing employee_id parameter',
                'message': 'Employee ID is required for employee responses',
                'received_params': list(query_params.keys())
            })
        
        # Sanitize IDs
        company_id = ''.join(c for c in company_id if c.isalnum() or c in '-_')
        if employee_id:
            employee_id = ''.join(c for c in employee_id if c.isalnum() or c in '-_.')
        
        logger.info(f"Getting {response_type} response for company: {company_id}, employee: {employee_id or 'N/A'}")
        
        # Determine storage path
        if response_type == 'company':
            json_key = f"companies/{company_id}/form.json"
        else:
            json_key = f"companies/{company_id}/employees/{employee_id}.json"
        
        # Try to read the response from S3
        try:
            response_data = s3_utils.read_json_file(json_key)
            logger.info(f"Found existing response at {json_key}")
            
            # Return the response data
            return lambda_response(200, {
                'found': True,
                'type': response_type,
                'company_id': company_id,
                'employee_id': employee_id,
                'responses': response_data.get('responses', {}),
                'submitted_at': response_data.get('submitted_at'),
                'updated_at': response_data.get('updated_at'),
                'files': response_data.get('files', []),
                'storage_path': json_key,
                'request_id': context.aws_request_id if context else None
            })
            
        except Exception as e:
            # Check if it's a "not found" error vs other errors
            error_str = str(e).lower()
            if 'nosuchkey' in error_str or 'not found' in error_str or '404' in error_str:
                logger.info(f"No existing response found at {json_key}")
                return lambda_response(404, {
                    'found': False,
                    'message': 'No existing response found',
                    'type': response_type,
                    'company_id': company_id,
                    'employee_id': employee_id,
                    'storage_path': json_key,
                    'request_id': context.aws_request_id if context else None
                })
            else:
                # Some other error occurred
                logger.error(f"Error reading response from S3: {e}")
                raise e
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return lambda_response(500, {
            'error': 'Internal server error',
            'message': 'Failed to get response',
            'request_id': context.aws_request_id if context else None,
            'error_details': str(e) if log_level == 'DEBUG' else 'Enable DEBUG logging for details'
        })


# For local testing
if __name__ == "__main__":
    # Test events for different scenarios
    test_events = [
        # API Gateway format - company response
        {
            'httpMethod': 'GET',
            'queryStringParameters': {
                'type': 'company',
                'company_id': 'test-company-123'
            }
        },
        # API Gateway format - employee response
        {
            'httpMethod': 'GET',
            'queryStringParameters': {
                'type': 'employee',
                'company_id': 'test-company-123',
                'employee_id': 'john.doe'
            }
        },
        # Direct invocation format
        {
            'query': {
                'type': 'company',
                'company_id': 'direct-test-company'
            }
        },
        # Invalid - missing type
        {
            'queryStringParameters': {
                'company_id': 'test-company'
            }
        },
        # Invalid - missing employee_id for employee type
        {
            'queryStringParameters': {
                'type': 'employee',
                'company_id': 'test-company'
            }
        }
    ]
    
    # Mock context
    class MockContext:
        def __init__(self):
            self.function_name = 'get_response_test'
            self.function_version = '$LATEST'
            self.memory_limit_in_mb = 512
            self.remaining_time_in_millis = 60000
            self.aws_request_id = 'test-request-id-' + str(hash(str(datetime.now())))[:8]
    
    # Set environment variables for testing
    os.environ['SURVEY_BUCKET'] = 'test-bucket'
    os.environ['LOG_LEVEL'] = 'DEBUG'
    
    # Run tests
    for i, test_event in enumerate(test_events):
        print(f"\n{'='*60}")
        print(f"TEST {i+1}: {test_event.get('httpMethod', 'Direct')} - Type: {test_event.get('queryStringParameters', test_event.get('query', {})).get('type', 'Missing')}")
        print('='*60)
        result = lambda_handler(test_event, MockContext())
        print(json.dumps(result, indent=2, default=str))
