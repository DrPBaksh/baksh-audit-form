"""
Lambda function to retrieve survey questions from S3
Supports both company and employee question sets
"""
import json
import logging
import os
import sys

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
    Lambda handler to get survey questions
    
    Expected query parameters:
    - type: 'company' or 'employee'
    
    Returns:
    - 200: Questions data
    - 400: Invalid parameters
    - 500: Internal error
    """
    try:
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Handle different event formats for proxy integration
        query_params = {}
        question_type = None
        
        # Try multiple ways to extract query parameters
        if 'queryStringParameters' in event and event['queryStringParameters']:
            query_params = event['queryStringParameters']
        elif 'multiValueQueryStringParameters' in event and event['multiValueQueryStringParameters']:
            # Handle multi-value query parameters
            multi_params = event['multiValueQueryStringParameters']
            if 'type' in multi_params and multi_params['type']:
                question_type = multi_params['type'][0]  # Take first value
        elif 'type' in event:
            # Direct parameter (for testing)
            question_type = event['type']
        
        # Extract type from query parameters
        if not question_type and query_params:
            question_type = query_params.get('type')
        
        # Log what we extracted
        logger.info(f"Extracted query_params: {query_params}")
        logger.info(f"Extracted question_type: {question_type}")
        
        if not question_type:
            logger.error("Missing 'type' query parameter")
            return lambda_response(400, {
                'error': 'Missing required parameter: type',
                'message': 'Please specify type=company or type=employee',
                'received_event_keys': list(event.keys()),
                'query_params': query_params
            })
        
        if question_type not in ['company', 'employee']:
            logger.error(f"Invalid question type: {question_type}")
            return lambda_response(400, {
                'error': 'Invalid type parameter',
                'message': 'Type must be either company or employee'
            })
        
        # Determine CSV file path
        csv_key = f"questions/{question_type}_questions.csv"
        
        # Read questions from CSV
        logger.info(f"Reading questions from {csv_key}")
        questions = s3_utils.read_csv_file(csv_key)
        
        # Process questions to ensure proper data types
        processed_questions = []
        for question in questions:
            processed_question = {
                'id': question.get('id', ''),
                'text': question.get('text', ''),
                'type': question.get('type', 'text'),
                'section': question.get('section', ''),
                'required': question.get('required', '').lower() in ['true', '1', 'yes'],
                'options': []
            }
            
            # Parse options if they exist
            options_str = question.get('options', '')
            if options_str:
                # Split options by semicolon or pipe
                if ';' in options_str:
                    processed_question['options'] = [opt.strip() for opt in options_str.split(';') if opt.strip()]
                elif '|' in options_str:
                    processed_question['options'] = [opt.strip() for opt in options_str.split('|') if opt.strip()]
                else:
                    processed_question['options'] = [options_str.strip()]
            
            processed_questions.append(processed_question)
        
        logger.info(f"Successfully retrieved {len(processed_questions)} questions")
        
        return lambda_response(200, {
            'type': question_type,
            'questions': processed_questions,
            'total_questions': len(processed_questions)
        })
        
    except FileNotFoundError as e:
        logger.error(f"Questions file not found: {str(e)}")
        return lambda_response(400, {
            'error': 'Questions file not found',
            'message': f'No questions available for type: {question_type if question_type else "unknown"}'
        })
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return lambda_response(500, {
            'error': 'Internal server error',
            'message': 'Failed to retrieve questions'
        })


# For local testing
if __name__ == "__main__":
    # Test event for company response
    test_event = {
        'queryStringParameters': {
            'type': 'company'
        }
    }
    
    # Mock context
    class MockContext:
        def __init__(self):
            self.function_name = 'get_questions_test'
            self.function_version = '$LATEST'
            self.memory_limit_in_mb = 256
            self.remaining_time_in_millis = 30000
    
    # Set environment variables for testing
    os.environ['SURVEY_BUCKET'] = 'test-bucket'
    os.environ['LOG_LEVEL'] = 'DEBUG'
    
    # Run test
    result = lambda_handler(test_event, MockContext())
    print(json.dumps(result, indent=2))
