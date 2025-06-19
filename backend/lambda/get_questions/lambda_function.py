"""
Lambda function to retrieve survey questions from S3
Supports both company and employee question sets
"""
import json
import logging
import os
import sys
import urllib.parse

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

def extract_question_type_from_event(event):
    """
    Robust extraction of the 'type' query parameter from various event formats.
    Handles API Gateway proxy integration, direct invocation, and testing scenarios.
    """
    question_type = None
    
    logger.info(f"=== EXTRACTING QUESTION TYPE ===")
    logger.info(f"Event keys: {list(event.keys()) if event else 'None/Empty'}")
    logger.info(f"Event type: {type(event)}")
    
    # Handle empty or None events
    if not event or not isinstance(event, dict):
        logger.warning("Event is empty or not a dictionary")
        return None
    
    # Method 1: API Gateway Proxy Integration - queryStringParameters
    if 'queryStringParameters' in event:
        query_params = event['queryStringParameters']
        logger.info(f"queryStringParameters: {query_params}")
        if query_params and isinstance(query_params, dict):
            question_type = query_params.get('type')
            if question_type:
                logger.info(f"✅ Found type in queryStringParameters: {question_type}")
                return question_type
    
    # Method 2: API Gateway Proxy Integration - multiValueQueryStringParameters  
    if 'multiValueQueryStringParameters' in event:
        multi_params = event['multiValueQueryStringParameters']
        logger.info(f"multiValueQueryStringParameters: {multi_params}")
        if multi_params and isinstance(multi_params, dict) and 'type' in multi_params:
            if isinstance(multi_params['type'], list) and multi_params['type']:
                question_type = multi_params['type'][0]
                logger.info(f"✅ Found type in multiValueQueryStringParameters: {question_type}")
                return question_type
    
    # Method 3: Parse from raw query string if available
    if 'rawQueryString' in event:
        raw_query = event['rawQueryString']
        logger.info(f"rawQueryString: {raw_query}")
        if raw_query:
            try:
                parsed_query = urllib.parse.parse_qs(raw_query)
                if 'type' in parsed_query and parsed_query['type']:
                    question_type = parsed_query['type'][0]
                    logger.info(f"✅ Found type in rawQueryString: {question_type}")
                    return question_type
            except Exception as e:
                logger.warning(f"Failed to parse rawQueryString: {e}")
    
    # Method 4: Check in path parameters (alternative API design)
    if 'pathParameters' in event:
        path_params = event['pathParameters']
        logger.info(f"pathParameters: {path_params}")
        if path_params and isinstance(path_params, dict):
            question_type = path_params.get('type')
            if question_type:
                logger.info(f"✅ Found type in pathParameters: {question_type}")
                return question_type
    
    # Method 5: Direct parameter in event (for testing/direct invocation)
    if 'type' in event:
        question_type = event['type']
        logger.info(f"✅ Found type in direct event: {question_type}")
        return question_type
    
    # Method 6: Check in HTTP method context (if present)
    if 'requestContext' in event:
        request_context = event['requestContext']
        if isinstance(request_context, dict) and 'http' in request_context:
            http_context = request_context['http']
            if 'queryString' in http_context:
                try:
                    query_string = http_context['queryString']
                    logger.info(f"requestContext.http.queryString: {query_string}")
                    parsed_query = urllib.parse.parse_qs(query_string)
                    if 'type' in parsed_query and parsed_query['type']:
                        question_type = parsed_query['type'][0]
                        logger.info(f"✅ Found type in requestContext.http.queryString: {question_type}")
                        return question_type
                except Exception as e:
                    logger.warning(f"Failed to parse query string from requestContext: {e}")
    
    # Method 7: Parse query string from path if it contains '?'
    if 'path' in event:
        path = event['path']
        if '?' in path:
            try:
                query_string = path.split('?', 1)[1]
                logger.info(f"Query string from path: {query_string}")
                parsed_query = urllib.parse.parse_qs(query_string)
                if 'type' in parsed_query and parsed_query['type']:
                    question_type = parsed_query['type'][0]
                    logger.info(f"✅ Found type in path query string: {question_type}")
                    return question_type
            except Exception as e:
                logger.warning(f"Failed to parse query string from path: {e}")
    
    logger.info(f"=== FINAL EXTRACTED QUESTION TYPE: {question_type} ===")
    return question_type

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
        logger.info(f"=== GET QUESTIONS REQUEST START ===")
        logger.info(f"Function: {context.function_name if context else 'TEST'}")
        logger.info(f"Request ID: {context.aws_request_id if context else 'TEST'}")
        
        # Log the event structure safely
        if event:
            logger.info(f"Event keys: {list(event.keys())}")
            logger.info(f"HTTP Method: {event.get('httpMethod', 'N/A')}")
            logger.info(f"Path: {event.get('path', 'N/A')}")
            logger.info(f"Query params: {event.get('queryStringParameters', 'N/A')}")
        else:
            logger.warning("Received empty event")
        
        # Extract the question type using robust method
        question_type = extract_question_type_from_event(event)
        
        # Validate the question type
        if not question_type:
            error_details = {
                'error': 'Missing required parameter: type',
                'message': 'Please specify type=company or type=employee in query parameters',
                'received_event_keys': list(event.keys()) if event else [],
                'debug_info': {
                    'queryStringParameters': event.get('queryStringParameters') if event else None,
                    'multiValueQueryStringParameters': event.get('multiValueQueryStringParameters') if event else None,
                    'pathParameters': event.get('pathParameters') if event else None,
                    'rawQueryString': event.get('rawQueryString') if event else None,
                    'httpMethod': event.get('httpMethod') if event else None,
                    'resource': event.get('resource') if event else None,
                    'path': event.get('path') if event else None
                },
                'help': 'Use: GET /questions?type=company or GET /questions?type=employee'
            }
            logger.error(f"Missing 'type' query parameter. Debug info: {json.dumps(error_details, indent=2)}")
            return lambda_response(400, error_details)
        
        # Validate the question type value
        if question_type not in ['company', 'employee']:
            logger.error(f"Invalid question type: {question_type}")
            return lambda_response(400, {
                'error': 'Invalid type parameter',
                'message': 'Type must be either "company" or "employee"',
                'received_type': question_type
            })
        
        # Determine CSV file path
        csv_key = f"questions/{question_type}_questions.csv"
        
        # Read questions from CSV
        logger.info(f"Reading questions from {csv_key}")
        questions = s3_utils.read_csv_file(csv_key)
        
        logger.info(f"Raw CSV data loaded: {len(questions)} rows")
        if questions:
            logger.info(f"First CSV row keys: {list(questions[0].keys())}")
            logger.info(f"First CSV row sample: {json.dumps(questions[0], default=str)}")
        
        # Process questions to ensure proper data types
        processed_questions = []
        for i, question in enumerate(questions):
            try:
                processed_question = {
                    'id': str(question.get('id', '')).strip(),
                    'text': str(question.get('text', '')).strip(),
                    'type': str(question.get('type', 'text')).strip(),
                    'section': str(question.get('section', '')).strip(),
                    'required': str(question.get('required', '')).lower().strip() in ['true', '1', 'yes'],
                    'options': []
                }
                
                # Parse options if they exist
                options_str = str(question.get('options', '')).strip()
                if options_str and options_str.lower() not in ['', 'none', 'null']:
                    # Split options by semicolon or pipe
                    if ';' in options_str:
                        processed_question['options'] = [opt.strip() for opt in options_str.split(';') if opt.strip()]
                    elif '|' in options_str:
                        processed_question['options'] = [opt.strip() for opt in options_str.split('|') if opt.strip()]
                    else:
                        processed_question['options'] = [options_str.strip()]
                
                # Only add questions with valid IDs
                if processed_question['id']:
                    processed_questions.append(processed_question)
                    logger.debug(f"Processed question {i+1}: {processed_question['id']}")
                
            except Exception as e:
                logger.warning(f"Error processing question {i}: {e}. Question data: {question}")
                continue
        
        logger.info(f"Successfully processed {len(processed_questions)} questions for {question_type}")
        
        if not processed_questions:
            logger.error(f"No valid questions found in {csv_key}")
            return lambda_response(404, {
                'error': 'No questions found',
                'message': f'No valid questions available for type: {question_type}',
                'csv_key': csv_key
            })
        
        # Return successful response
        response_data = {
            'type': question_type,
            'questions': processed_questions,
            'total_questions': len(processed_questions),
            'timestamp': context.aws_request_id if context else 'test',
            'success': True
        }
        
        logger.info(f"Returning response with {len(processed_questions)} questions")
        logger.info(f"Response data keys: {list(response_data.keys())}")
        logger.info(f"Questions field type: {type(response_data['questions'])}")
        
        final_response = lambda_response(200, response_data)
        logger.info(f"Final response status: {final_response.get('statusCode')}")
        
        return final_response
        
    except FileNotFoundError as e:
        logger.error(f"Questions file not found: {str(e)}")
        return lambda_response(404, {
            'error': 'Questions file not found',
            'message': f'No questions available for type: {question_type if "question_type" in locals() else "unknown"}',
            'csv_key': csv_key if 'csv_key' in locals() else 'unknown'
        })
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return lambda_response(500, {
            'error': 'Internal server error',
            'message': 'Failed to retrieve questions',
            'request_id': context.aws_request_id if context else None,
            'debug_info': str(e) if log_level == 'DEBUG' else 'Enable DEBUG logging for details'
        })


# For local testing
if __name__ == "__main__":
    # Test events for different scenarios
    test_events = [
        # API Gateway Proxy Integration format
        {
            'httpMethod': 'GET',
            'queryStringParameters': {'type': 'company'},
            'pathParameters': None,
            'requestContext': {'requestId': 'test-123'}
        },
        # Alternative format with multiValueQueryStringParameters
        {
            'httpMethod': 'GET',
            'queryStringParameters': {'type': 'employee'},
            'multiValueQueryStringParameters': {'type': ['employee']},
            'pathParameters': None
        },
        # Direct invocation format
        {
            'type': 'company'
        },
        # Empty event (should fail gracefully)
        {}
    ]
    
    # Mock context
    class MockContext:
        def __init__(self):
            self.function_name = 'get_questions_test'
            self.function_version = '$LATEST'
            self.memory_limit_in_mb = 256
            self.remaining_time_in_millis = 30000
            self.aws_request_id = 'test-request-id'
    
    # Set environment variables for testing
    os.environ['SURVEY_BUCKET'] = 'test-bucket'
    os.environ['LOG_LEVEL'] = 'DEBUG'
    
    # Run tests
    for i, test_event in enumerate(test_events):
        print(f"\n{'='*50}")
        print(f"TEST {i+1}: {test_event}")
        print('='*50)
        result = lambda_handler(test_event, MockContext())
        print(json.dumps(result, indent=2))