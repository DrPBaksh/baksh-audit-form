#!/usr/bin/env python3
"""
Quick API Diagnostics Script
Performs focused testing to diagnose API issues including the new GET /responses endpoint

"""

import requests
import json
import sys
import uuid
from typing import Dict, Any

def test_api_endpoint(api_url: str, endpoint: str, method: str = "GET", params: Dict = None, data: Dict = None) -> Dict[str, Any]:
    """Test a single API endpoint and return detailed results"""
    url = f"{api_url.rstrip('/')}{endpoint}"
    
    try:
        print(f"🔍 Testing: {method} {url}")
        if params:
            print(f"   Parameters: {params}")
        if data:
            print(f"   Data: {list(data.keys()) if isinstance(data, dict) else data}")
        
        if method.upper() == "GET":
            response = requests.get(url, params=params, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        # Try to parse JSON response
        try:
            response_data = response.json()
            print(f"   Response Type: {type(response_data)}")
            print(f"   Response Keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'N/A'}")
            
            # Check specific fields for different endpoints
            if 'questions' in endpoint and method.upper() == "GET":
                if isinstance(response_data, dict):
                    has_questions = 'questions' in response_data
                    questions_type = type(response_data.get('questions', None))
                    questions_count = len(response_data.get('questions', [])) if isinstance(response_data.get('questions'), list) else 0
                    
                    print(f"   Has 'questions' field: {has_questions}")
                    print(f"   Questions field type: {questions_type}")
                    print(f"   Questions count: {questions_count}")
                    
                    if has_questions and questions_count > 0:
                        print(f"   First question keys: {list(response_data['questions'][0].keys())}")
                        print(f"   First question ID: {response_data['questions'][0].get('id', 'N/A')}")
                else:
                    print(f"   ❌ Response is not a dictionary!")
            
            elif 'responses' in endpoint and method.upper() == "GET":
                if isinstance(response_data, dict):
                    has_data = 'data' in response_data
                    print(f"   Has 'data' field: {has_data}")
                    if has_data:
                        data_obj = response_data.get('data', {})
                        has_responses = 'responses' in data_obj
                        print(f"   Has 'responses' in data: {has_responses}")
                        if has_responses:
                            response_count = len(data_obj.get('responses', {}))
                            print(f"   Response count: {response_count}")
            
            elif 'responses' in endpoint and method.upper() == "POST":
                if isinstance(response_data, dict):
                    has_message = 'message' in response_data
                    has_company = 'company_id' in response_data
                    print(f"   Has 'message' field: {has_message}")
                    print(f"   Has 'company_id' field: {has_company}")
                    if 'employee_id' in response_data:
                        print(f"   Has 'employee_id' field: True")
            
            return {
                'success': True,
                'status_code': response.status_code,
                'data': response_data,
                'response_time': response.elapsed.total_seconds()
            }
            
        except json.JSONDecodeError:
            print(f"   ❌ Response is not valid JSON")
            print(f"   Raw response: {response.text[:200]}...")
            return {
                'success': False,
                'status_code': response.status_code,
                'error': 'Invalid JSON response',
                'raw_response': response.text
            }
    
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """Main diagnostic function"""
    if len(sys.argv) < 2:
        print("Usage: python diagnose_api.py <API_URL>")
        print("Example: python diagnose_api.py https://abc123.execute-api.eu-west-2.amazonaws.com/dev")
        sys.exit(1)
    
    api_url = sys.argv[1]
    
    print("🏥 Baksh Audit Form API Diagnostics")
    print("=" * 50)
    print(f"API URL: {api_url}")
    print()
    
    # Generate test IDs for response testing
    test_company_id = f"diag-company-{uuid.uuid4().hex[:8]}"
    test_employee_id = f"diag-employee-{uuid.uuid4().hex[:8]}"
    
    # Test data for POST tests
    test_company_data = {
        "type": "company",
        "company_id": test_company_id,
        "responses": {
            "c001": "Test response for diagnostics",
            "c002": "Pilot implementation"
        }
    }
    
    test_employee_data = {
        "type": "employee",
        "company_id": test_company_id,
        "employee_id": test_employee_id,
        "responses": {
            "e001": "Test Employee",
            "e002": "2-3 years"
        }
    }
    
    # Test cases
    tests = [
        # Questions endpoint tests
        {
            'name': 'Company Questions',
            'endpoint': '/questions',
            'method': 'GET',
            'params': {'type': 'company'},
            'expect_success': True
        },
        {
            'name': 'Employee Questions',
            'endpoint': '/questions',
            'method': 'GET',
            'params': {'type': 'employee'},
            'expect_success': True
        },
        {
            'name': 'Invalid Question Type',
            'endpoint': '/questions',
            'method': 'GET',
            'params': {'type': 'invalid'},
            'expect_success': False,
            'expected_status': 400
        },
        {
            'name': 'Missing Type Parameter',
            'endpoint': '/questions',
            'method': 'GET',
            'params': None,
            'expect_success': False,
            'expected_status': 400
        },
        
        # Response saving tests
        {
            'name': 'Save Company Response',
            'endpoint': '/responses',
            'method': 'POST',
            'data': test_company_data,
            'expect_success': True
        },
        {
            'name': 'Save Employee Response',
            'endpoint': '/responses',
            'method': 'POST',
            'data': test_employee_data,
            'expect_success': True
        },
        
        # Response retrieval tests
        {
            'name': 'Get Saved Company Response',
            'endpoint': '/responses',
            'method': 'GET',
            'params': {'type': 'company', 'company_id': test_company_id},
            'expect_success': True
        },
        {
            'name': 'Get Saved Employee Response',
            'endpoint': '/responses',
            'method': 'GET',
            'params': {'type': 'employee', 'company_id': test_company_id, 'employee_id': test_employee_id},
            'expect_success': True
        },
        {
            'name': 'Get Non-existent Response',
            'endpoint': '/responses',
            'method': 'GET',
            'params': {'type': 'company', 'company_id': 'nonexistent-company'},
            'expect_success': False,
            'expected_status': 404
        },
        {
            'name': 'Get Response Missing Parameters',
            'endpoint': '/responses',
            'method': 'GET',
            'params': {'type': 'company'},  # Missing company_id
            'expect_success': False,
            'expected_status': 400
        }
    ]
    
    results = []
    
    for test in tests:
        print(f"\n📋 Test: {test['name']}")
        print("-" * 40)
        
        result = test_api_endpoint(
            api_url, 
            test['endpoint'], 
            test['method'],
            test.get('params'),
            test.get('data')
        )
        result['test_name'] = test['name']
        result['expected_success'] = test['expect_success']
        results.append(result)
        
        # Determine test outcome
        if test['expect_success']:
            # Should succeed with 200
            if result.get('success') and result.get('status_code') == 200:
                print("   ✅ PASS: Request successful")
            else:
                print("   ❌ FAIL: Request should have succeeded")
        else:
            # Should fail with specific status code
            expected_status = test.get('expected_status', 400)
            if result.get('status_code') == expected_status:
                print(f"   ✅ PASS: Correctly returned {expected_status} status")
            else:
                print(f"   ❌ FAIL: Should have returned {expected_status} status, got {result.get('status_code')}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 DIAGNOSTIC SUMMARY")
    print("=" * 50)
    
    # Count test results
    question_tests = [r for r in results if 'Questions' in r['test_name']]
    save_tests = [r for r in results if 'Save' in r['test_name']]
    get_tests = [r for r in results if 'Get' in r['test_name']]
    
    successful_question_tests = [r for r in question_tests if r.get('success') and r.get('status_code') == 200]
    successful_save_tests = [r for r in save_tests if r.get('success') and r.get('status_code') == 200]
    successful_get_tests = [r for r in get_tests if r['test_name'] in ['Get Saved Company Response', 'Get Saved Employee Response'] and r.get('success')]
    
    print(f"Questions endpoint tests: {len(successful_question_tests)}/2 passed")
    print(f"Save response tests: {len(successful_save_tests)}/2 passed")
    print(f"Get response tests: {len(successful_get_tests)}/2 passed")
    
    # Overall assessment
    critical_tests_passed = len(successful_question_tests) == 2
    save_functionality_works = len(successful_save_tests) == 2
    get_functionality_works = len(successful_get_tests) == 2
    
    print(f"\n🎯 Overall Status:")
    if critical_tests_passed and save_functionality_works and get_functionality_works:
        print("✅ All core functionality is working!")
        print("🎉 API is ready for production use")
    elif critical_tests_passed:
        print("✅ Basic question loading works")
        if not save_functionality_works:
            print("⚠️  Response saving has issues")
        if not get_functionality_works:
            print("⚠️  Response retrieval has issues")
    else:
        print("❌ Critical issues found with question loading")
    
    print(f"\n🔧 Recommendations:")
    if not critical_tests_passed:
        print("   1. Check S3 bucket has question CSV files")
        print("   2. Verify Lambda function permissions")
        print("   3. Check CloudWatch logs for get-questions function")
    elif not save_functionality_works:
        print("   1. Check CloudWatch logs for save-response function")
        print("   2. Verify S3 bucket write permissions")
        print("   3. Check Lambda function timeout settings")
    elif not get_functionality_works:
        print("   1. Deploy the new get-response Lambda function")
        print("   2. Update API Gateway to include GET /responses endpoint")
        print("   3. Check CloudWatch logs for get-response function")
    else:
        print("   1. Test the frontend application")
        print("   2. Check browser console for JavaScript errors")
        print("   3. Verify frontend config.js has correct API URL")
    
    # Show failed tests in detail
    failed_tests = [r for r in results if not (
        (r['expected_success'] and r.get('success') and r.get('status_code') == 200) or
        (not r['expected_success'] and r.get('status_code') in [400, 404])
    )]
    
    if failed_tests:
        print(f"\n❌ Failed Tests Details:")
        for result in failed_tests:
            error_msg = result.get('error', f"HTTP {result.get('status_code', '?')}")
            print(f"   • {result['test_name']}: {error_msg}")
    
    # Exit with appropriate code
    all_tests_passed = len(failed_tests) == 0
    sys.exit(0 if all_tests_passed else 1)

if __name__ == "__main__":
    main()
