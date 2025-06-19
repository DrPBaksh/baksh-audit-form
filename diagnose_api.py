#!/usr/bin/env python3
"""
Quick API Diagnostics Script
Performs focused testing to diagnose the survey loading issue
"""

import requests
import json
import sys
from typing import Dict, Any

def test_api_endpoint(api_url: str, endpoint: str, params: Dict = None) -> Dict[str, Any]:
    """Test a single API endpoint and return detailed results"""
    url = f"{api_url.rstrip('/')}{endpoint}"
    
    try:
        print(f"🔍 Testing: GET {url}")
        if params:
            print(f"   Parameters: {params}")
        
        response = requests.get(url, params=params, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        # Try to parse JSON response
        try:
            data = response.json()
            print(f"   Response Type: {type(data)}")
            print(f"   Response Keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
            
            # Check specific field for questions endpoint
            if 'questions' in endpoint:
                if isinstance(data, dict):
                    has_questions = 'questions' in data
                    questions_type = type(data.get('questions', None))
                    questions_count = len(data.get('questions', [])) if isinstance(data.get('questions'), list) else 0
                    
                    print(f"   Has 'questions' field: {has_questions}")
                    print(f"   Questions field type: {questions_type}")
                    print(f"   Questions count: {questions_count}")
                    
                    if has_questions and questions_count > 0:
                        print(f"   First question keys: {list(data['questions'][0].keys())}")
                        print(f"   First question ID: {data['questions'][0].get('id', 'N/A')}")
                else:
                    print(f"   ❌ Response is not a dictionary!")
            
            return {
                'success': True,
                'status_code': response.status_code,
                'data': data,
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
    
    # Test cases
    tests = [
        {
            'name': 'Company Questions',
            'endpoint': '/questions',
            'params': {'type': 'company'}
        },
        {
            'name': 'Employee Questions', 
            'endpoint': '/questions',
            'params': {'type': 'employee'}
        },
        {
            'name': 'Invalid Question Type',
            'endpoint': '/questions',
            'params': {'type': 'invalid'}
        },
        {
            'name': 'Missing Type Parameter',
            'endpoint': '/questions',
            'params': None
        }
    ]
    
    results = []
    
    for test in tests:
        print(f"\n📋 Test: {test['name']}")
        print("-" * 30)
        
        result = test_api_endpoint(api_url, test['endpoint'], test['params'])
        result['test_name'] = test['name']
        results.append(result)
        
        # Determine test outcome
        if test['name'] in ['Company Questions', 'Employee Questions']:
            # These should succeed and return questions
            if result.get('success') and result.get('status_code') == 200:
                data = result.get('data', {})
                if isinstance(data, dict) and 'questions' in data and isinstance(data['questions'], list):
                    print("   ✅ PASS: Questions returned successfully")
                else:
                    print("   ❌ FAIL: No questions field or not an array")
            else:
                print("   ❌ FAIL: Request unsuccessful")
        else:
            # These should fail with 400
            if result.get('status_code') == 400:
                print("   ✅ PASS: Correctly rejected invalid request")
            else:
                print("   ❌ FAIL: Should have returned 400 status")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 DIAGNOSTIC SUMMARY")
    print("=" * 50)
    
    successful_tests = [r for r in results if r.get('success') and r['test_name'] in ['Company Questions', 'Employee Questions']]
    total_question_tests = 2
    
    print(f"Question endpoint tests passed: {len(successful_tests)}/{total_question_tests}")
    
    if len(successful_tests) == total_question_tests:
        print("✅ API is working correctly!")
        print("🎯 The survey loading issue might be in the frontend or test expectations.")
    else:
        print("❌ API has issues that need to be fixed.")
        
        # Show specific problems
        for result in results:
            if result['test_name'] in ['Company Questions', 'Employee Questions'] and not result.get('success'):
                print(f"   • {result['test_name']}: {result.get('error', 'Unknown error')}")
    
    print("\n🔧 Recommended actions:")
    if len(successful_tests) == total_question_tests:
        print("   1. Check frontend JavaScript console for errors")
        print("   2. Verify frontend API configuration in js/config.js")
        print("   3. Test the full user flow in the browser")
    else:
        print("   1. Redeploy the backend with the latest Lambda function changes")
        print("   2. Check CloudWatch logs for the Lambda functions")
        print("   3. Verify S3 bucket has the questions CSV files")
    
    # Exit with appropriate code
    sys.exit(0 if len(successful_tests) == total_question_tests else 1)

if __name__ == "__main__":
    main()
