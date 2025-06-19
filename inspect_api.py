#!/usr/bin/env python3
"""
Precise API Response Inspector
Debug exactly what the API is returning vs what the test expects
"""

import requests
import json
import sys

def inspect_api_response(api_url: str):
    """Inspect the exact API response to debug the test failures"""
    
    print("🔍 PRECISE API RESPONSE INSPECTION")
    print("=" * 60)
    print(f"API URL: {api_url}")
    print()
    
    # Test the company questions endpoint
    endpoint_url = f"{api_url}/questions?type=company"
    
    try:
        print(f"📡 Making request to: {endpoint_url}")
        response = requests.get(endpoint_url, timeout=30)
        
        print(f"📊 Response Details:")
        print(f"  Status Code: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
        print(f"  Content Length: {len(response.content)}")
        print()
        
        print("📝 Raw Response Content:")
        print("-" * 40)
        raw_content = response.text
        print(raw_content[:500] + "..." if len(raw_content) > 500 else raw_content)
        print("-" * 40)
        print()
        
        # Try to parse as JSON
        try:
            data = response.json()
            print("✅ Response is valid JSON")
            print(f"📋 JSON Structure Analysis:")
            print(f"  Type: {type(data)}")
            print(f"  Keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            if isinstance(data, dict):
                print(f"  Has 'questions' field: {'questions' in data}")
                
                if 'questions' in data:
                    questions = data['questions']
                    print(f"  Questions type: {type(questions)}")
                    print(f"  Questions count: {len(questions) if isinstance(questions, list) else 'Not a list'}")
                    
                    if isinstance(questions, list) and questions:
                        print(f"  First question keys: {list(questions[0].keys())}")
                        print(f"  First question ID: {questions[0].get('id', 'N/A')}")
                else:
                    print("  ❌ MISSING 'questions' field!")
                    print(f"  Available fields: {list(data.keys())}")
                    
                    # Check for error information
                    if 'error' in data:
                        print(f"  Error: {data['error']}")
                    if 'message' in data:
                        print(f"  Message: {data['message']}")
            else:
                print(f"  ❌ Response is not a dictionary: {data}")
                
        except json.JSONDecodeError as e:
            print(f"❌ Response is not valid JSON: {e}")
            print("This means the API is returning non-JSON content")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False
    
    print()
    print("🔬 COMPARISON WITH TEST EXPECTATIONS:")
    print("=" * 60)
    
    # Show what the test script expects
    print("Test script expects:")
    print("  1. HTTP 200 status code")
    print("  2. JSON response with 'questions' field")
    print("  3. 'questions' field should be an array")
    print("  4. Array should not be empty")
    print("  5. Each question should have: id, text, type, section, required")
    
    print()
    
    # Now test employee questions too
    print("🔄 Testing Employee Questions...")
    try:
        emp_response = requests.get(f"{api_url}/questions?type=employee", timeout=30)
        print(f"Employee Questions Status: {emp_response.status_code}")
        
        if emp_response.status_code == 200:
            emp_data = emp_response.json()
            has_questions = 'questions' in emp_data
            questions_count = len(emp_data.get('questions', [])) if has_questions else 0
            print(f"Employee Questions - Has 'questions': {has_questions}, Count: {questions_count}")
        
    except Exception as e:
        print(f"Employee questions test failed: {e}")
    
    # Test invalid type (should return 400)
    print()
    print("🚫 Testing Invalid Type (should return 400)...")
    try:
        invalid_response = requests.get(f"{api_url}/questions?type=invalid", timeout=30)
        print(f"Invalid Type Status: {invalid_response.status_code} (expected: 400)")
        
        if invalid_response.status_code != 400:
            print("❌ PROBLEM: Should return 400 for invalid type")
            print(f"Response: {invalid_response.text[:200]}")
    except Exception as e:
        print(f"Invalid type test failed: {e}")
    
    print()
    print("🎯 SUMMARY:")
    print("=" * 60)
    
    if response.status_code == 200:
        try:
            data = response.json()
            if isinstance(data, dict) and 'questions' in data and isinstance(data['questions'], list):
                print("✅ API is working correctly!")
                print("   The issue might be with the test script expectations or parsing")
                print("   Recommendation: Check frontend JavaScript console for errors")
            else:
                print("❌ API response format is incorrect")
                print("   The Lambda function may not be returning the expected structure")
                print("   Recommendation: Check Lambda function code and CloudWatch logs")
        except:
            print("❌ API is not returning valid JSON")
            print("   Recommendation: Check API Gateway configuration and Lambda function")
    else:
        print("❌ API is not returning HTTP 200")
        print("   Recommendation: Check deployment and AWS resources")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 inspect_api.py <API_URL>")
        print("Example: python3 inspect_api.py https://abc123.execute-api.eu-west-2.amazonaws.com/dev")
        sys.exit(1)
    
    api_url = sys.argv[1].rstrip('/')
    inspect_api_response(api_url)

if __name__ == "__main__":
    main()
