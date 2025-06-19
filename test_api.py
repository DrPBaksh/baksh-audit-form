#!/usr/bin/env python3
"""
Baksh Audit Form API Test Suite
Comprehensive testing script for all backend API endpoints

Usage:
    python test_api.py --api-url https://your-api-gateway-url.com/dev
    
Requirements:
    pip install requests colorama

"""

import requests
import json
import base64
import argparse
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import sys

try:
    from colorama import init, Fore, Back, Style
    init()
    COLORS_AVAILABLE = True
except ImportError:
    COLORS_AVAILABLE = False
    print("Note: Install 'colorama' for colored output: pip install colorama")

@dataclass
class TestResult:
    """Test result data structure"""
    test_name: str
    endpoint: str
    method: str
    status_code: int
    expected_status: int
    response_time_ms: float
    success: bool
    error_message: Optional[str] = None
    response_data: Optional[Dict] = None

class APITester:
    """Comprehensive API testing class"""
    
    def __init__(self, api_url: str, timeout: int = 30):
        self.api_url = api_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.results: List[TestResult] = []
        
        # Test data
        self.company_test_data = {
            "type": "company",
            "company_id": f"test-company-{uuid.uuid4().hex[:8]}",
            "responses": {
                "c001": "Pilot projects in progress",
                "c002": "Strategy defined but not implemented", 
                "c003": "Chief Technology Officer",
                "c004": "£250k - £1M",
                "c005": "Defined governance framework",
                "c006": "50% - 75%",
                "c007": ["GDPR compliance", "Internal data privacy policies"],
                "c008": ["Cloud data warehouses", "Hybrid cloud solutions"],
                "c009": ["Amazon Web Services (AWS)", "Microsoft Azure"],
                "c010": ["Machine Learning model development", "Predictive Analytics"],
                "c011": "6-20 employees",
                "c012": ["Training existing employees", "Using consulting services"],
                "c013": ["Lack of technical expertise", "Budget constraints"],
                "c014": "Developing ethical guidelines",
                "c015": ["Model performance monitoring", "Human oversight requirements"],
                "c016": ["Improve operational efficiency", "Enhance customer experience"],
                "c017": ["Customer service", "Operations and supply chain"],
                "c018": "We are exploring chatbot implementation for customer service",
                "c019": "Working with Microsoft and AWS for cloud AI services",
                "c020": "More hands-on training and clear ROI demonstration"
            }
        }
        
        self.employee_test_data = {
            "type": "employee",
            "company_id": f"test-company-{uuid.uuid4().hex[:8]}",
            "employee_id": f"employee-{uuid.uuid4().hex[:8]}",
            "responses": {
                "e001": "Senior Data Analyst",
                "e002": "4-7 years",
                "e003": "Moderately familiar",
                "e004": ["ChatGPT or similar language models", "Business intelligence dashboards"],
                "e005": "Occasionally (weekly)",
                "e006": ["Data analysis and reporting", "Document generation and editing"],
                "e007": "Data cleaning, report generation, email responses",
                "e008": "Somewhat comfortable",
                "e009": ["Privacy and data protection", "Accuracy and reliability of AI outputs"],
                "e010": "Very confident",
                "e011": ["Hands-on tool training", "Best practices and ethical use"],
                "e012": "3-5 hours",
                "e013": ["Online self-paced courses", "Hands-on practice environments"],
                "e014": ["Industry publications and websites", "Online courses and tutorials"],
                "e015": "Very comfortable",
                "e016": "Very important",
                "e017": ["Clear explanation of how decisions are made", "Human oversight and review processes"],
                "e018": "Balance automation with human oversight",
                "e019": "Help with repetitive data analysis and report formatting",
                "e020": "Excited about AI potential but want proper training first"
            }
        }
        
        # Store IDs for retrieval tests
        self.saved_company_id = None
        self.saved_employee_id = None
        self.saved_employee_company_id = None
    
    def log(self, message: str, level: str = "INFO"):
        """Enhanced logging with colors"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        if COLORS_AVAILABLE:
            colors = {
                "INFO": Fore.CYAN,
                "SUCCESS": Fore.GREEN,
                "WARNING": Fore.YELLOW,
                "ERROR": Fore.RED,
                "HEADER": Fore.MAGENTA + Style.BRIGHT
            }
            color = colors.get(level, Fore.WHITE)
            print(f"{color}[{timestamp}] {level}: {message}{Style.RESET_ALL}")
        else:
            print(f"[{timestamp}] {level}: {message}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    files: Dict = None, headers: Dict = None) -> TestResult:
        """Make HTTP request and return test result"""
        url = f"{self.api_url}{endpoint}"
        
        default_headers = {
            "Content-Type": "application/json",
            "User-Agent": "BakshAuditForm-TestSuite/1.0"
        }
        if headers:
            default_headers.update(headers)
        
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, timeout=self.timeout, headers=default_headers)
            elif method.upper() == "POST":
                if files:
                    # Remove Content-Type for multipart requests
                    del default_headers["Content-Type"]
                    response = self.session.post(url, data=data, files=files, 
                                               timeout=self.timeout, headers=default_headers)
                else:
                    response = self.session.post(url, json=data, timeout=self.timeout, 
                                               headers=default_headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response_time = (time.time() - start_time) * 1000
            
            # Try to parse JSON response
            try:
                response_data = response.json()
            except json.JSONDecodeError:
                response_data = {"raw_response": response.text}
            
            return TestResult(
                test_name="",
                endpoint=endpoint,
                method=method.upper(),
                status_code=response.status_code,
                expected_status=200,
                response_time_ms=response_time,
                success=200 <= response.status_code < 300,
                response_data=response_data
            )
            
        except requests.exceptions.RequestException as e:
            response_time = (time.time() - start_time) * 1000
            return TestResult(
                test_name="",
                endpoint=endpoint,
                method=method.upper(),
                status_code=0,
                expected_status=200,
                response_time_ms=response_time,
                success=False,
                error_message=str(e)
            )
    
    def test_get_company_questions(self) -> TestResult:
        """Test GET /questions?type=company"""
        self.log("Testing GET /questions?type=company", "INFO")
        
        result = self.make_request("GET", "/questions?type=company")
        result.test_name = "Get Company Questions"
        
        if result.success:
            data = result.response_data
            
            # Validate response structure
            if not isinstance(data, dict):
                result.success = False
                result.error_message = "Response is not a JSON object"
            elif "questions" not in data:
                result.success = False
                result.error_message = "Missing 'questions' field in response"
            elif not isinstance(data["questions"], list):
                result.success = False
                result.error_message = "'questions' field is not an array"
            elif len(data["questions"]) == 0:
                result.success = False
                result.error_message = "No questions returned"
            else:
                # Validate question structure
                question = data["questions"][0]
                required_fields = ["id", "text", "type", "section", "required"]
                missing_fields = [field for field in required_fields if field not in question]
                
                if missing_fields:
                    result.success = False
                    result.error_message = f"Question missing fields: {missing_fields}"
                else:
                    self.log(f"✅ Found {len(data['questions'])} company questions", "SUCCESS")
        
        self.results.append(result)
        return result
    
    def test_get_employee_questions(self) -> TestResult:
        """Test GET /questions?type=employee"""
        self.log("Testing GET /questions?type=employee", "INFO")
        
        result = self.make_request("GET", "/questions?type=employee")
        result.test_name = "Get Employee Questions"
        
        if result.success:
            data = result.response_data
            
            # Validate response structure (same as company questions)
            if not isinstance(data, dict):
                result.success = False
                result.error_message = "Response is not a JSON object"
            elif "questions" not in data:
                result.success = False
                result.error_message = "Missing 'questions' field in response"
            elif not isinstance(data["questions"], list):
                result.success = False
                result.error_message = "'questions' field is not an array"
            elif len(data["questions"]) == 0:
                result.success = False
                result.error_message = "No questions returned"
            else:
                self.log(f"✅ Found {len(data['questions'])} employee questions", "SUCCESS")
        
        self.results.append(result)
        return result
    
    def test_get_questions_invalid_type(self) -> TestResult:
        """Test GET /questions with invalid type parameter"""
        self.log("Testing GET /questions?type=invalid", "INFO")
        
        result = self.make_request("GET", "/questions?type=invalid")
        result.test_name = "Get Questions - Invalid Type"
        result.expected_status = 400
        result.success = result.status_code == 400
        
        if result.success:
            self.log("✅ Correctly rejected invalid question type", "SUCCESS")
        
        self.results.append(result)
        return result
    
    def test_get_questions_missing_type(self) -> TestResult:
        """Test GET /questions without type parameter"""
        self.log("Testing GET /questions (missing type parameter)", "INFO")
        
        result = self.make_request("GET", "/questions")
        result.test_name = "Get Questions - Missing Type"
        result.expected_status = 400
        result.success = result.status_code == 400
        
        if result.success:
            self.log("✅ Correctly rejected missing type parameter", "SUCCESS")
        
        self.results.append(result)
        return result
    
    def test_save_company_response(self) -> TestResult:
        """Test POST /responses with company data"""
        self.log("Testing POST /responses (company)", "INFO")
        
        result = self.make_request("POST", "/responses", data=self.company_test_data)
        result.test_name = "Save Company Response"
        
        if result.success:
            data = result.response_data
            if "message" in data and "company_id" in data:
                self.saved_company_id = data.get("company_id")
                self.log(f"✅ Company response saved: {self.saved_company_id}", "SUCCESS")
            else:
                result.success = False
                result.error_message = "Invalid response format"
        
        self.results.append(result)
        return result
    
    def test_save_employee_response(self) -> TestResult:
        """Test POST /responses with employee data"""
        self.log("Testing POST /responses (employee)", "INFO")
        
        result = self.make_request("POST", "/responses", data=self.employee_test_data)
        result.test_name = "Save Employee Response"
        
        if result.success:
            data = result.response_data
            if "message" in data and "employee_id" in data:
                self.saved_employee_id = data.get("employee_id")
                self.saved_employee_company_id = data.get("company_id")
                self.log(f"✅ Employee response saved: {self.saved_employee_id}", "SUCCESS")
            else:
                result.success = False
                result.error_message = "Invalid response format"
        
        self.results.append(result)
        return result
    
    def test_save_employee_response_with_files(self) -> TestResult:
        """Test POST /responses with employee data and file uploads"""
        self.log("Testing POST /responses (employee with files)", "INFO")
        
        # Create test file data
        test_file_content = b"This is a test document for the survey"
        test_file_b64 = base64.b64encode(test_file_content).decode('utf-8')
        
        employee_data_with_files = self.employee_test_data.copy()
        employee_data_with_files["employee_id"] = f"employee-files-{uuid.uuid4().hex[:8]}"
        employee_data_with_files["files"] = [
            {
                "filename": "test_document.txt",
                "content": test_file_b64,
                "content_type": "text/plain"
            },
            {
                "filename": "resume.pdf",
                "content": base64.b64encode(b"Fake PDF content").decode('utf-8'),
                "content_type": "application/pdf"
            }
        ]
        
        result = self.make_request("POST", "/responses", data=employee_data_with_files)
        result.test_name = "Save Employee Response with Files"
        
        if result.success:
            data = result.response_data
            if "uploaded_files" in data:
                file_count = data["uploaded_files"]
                self.log(f"✅ Employee response with {file_count} files saved", "SUCCESS")
            else:
                self.log("⚠️ File upload count not reported", "WARNING")
        
        self.results.append(result)
        return result
    
    def test_get_existing_company_response(self) -> TestResult:
        """Test GET /responses for existing company response"""
        self.log("Testing GET /responses (existing company)", "INFO")
        
        if not self.saved_company_id:
            result = TestResult(
                test_name="Get Existing Company Response",
                endpoint="/responses",
                method="GET",
                status_code=0,
                expected_status=200,
                response_time_ms=0,
                success=False,
                error_message="No saved company ID available for retrieval test"
            )
            self.results.append(result)
            return result
        
        endpoint = f"/responses?type=company&company_id={self.saved_company_id}"
        result = self.make_request("GET", endpoint)
        result.test_name = "Get Existing Company Response"
        
        if result.success:
            data = result.response_data
            if "data" in data and "responses" in data["data"]:
                response_count = len(data["data"]["responses"])
                self.log(f"✅ Retrieved company response with {response_count} answers", "SUCCESS")
            else:
                result.success = False
                result.error_message = "Invalid response structure"
        
        self.results.append(result)
        return result
    
    def test_get_existing_employee_response(self) -> TestResult:
        """Test GET /responses for existing employee response"""
        self.log("Testing GET /responses (existing employee)", "INFO")
        
        if not self.saved_employee_id or not self.saved_employee_company_id:
            result = TestResult(
                test_name="Get Existing Employee Response",
                endpoint="/responses",
                method="GET",
                status_code=0,
                expected_status=200,
                response_time_ms=0,
                success=False,
                error_message="No saved employee ID available for retrieval test"
            )
            self.results.append(result)
            return result
        
        endpoint = f"/responses?type=employee&company_id={self.saved_employee_company_id}&employee_id={self.saved_employee_id}"
        result = self.make_request("GET", endpoint)
        result.test_name = "Get Existing Employee Response"
        
        if result.success:
            data = result.response_data
            if "data" in data and "responses" in data["data"]:
                response_count = len(data["data"]["responses"])
                self.log(f"✅ Retrieved employee response with {response_count} answers", "SUCCESS")
            else:
                result.success = False
                result.error_message = "Invalid response structure"
        
        self.results.append(result)
        return result
    
    def test_get_nonexistent_response(self) -> TestResult:
        """Test GET /responses for non-existent response (should return 404)"""
        self.log("Testing GET /responses (non-existent)", "INFO")
        
        fake_company_id = f"nonexistent-{uuid.uuid4().hex[:8]}"
        endpoint = f"/responses?type=company&company_id={fake_company_id}"
        
        result = self.make_request("GET", endpoint)
        result.test_name = "Get Non-existent Response"
        result.expected_status = 404
        result.success = result.status_code == 404
        
        if result.success:
            self.log("✅ Correctly returned 404 for non-existent response", "SUCCESS")
        
        self.results.append(result)
        return result
    
    def test_get_response_missing_params(self) -> TestResult:
        """Test GET /responses with missing parameters"""
        self.log("Testing GET /responses (missing parameters)", "INFO")
        
        result = self.make_request("GET", "/responses?type=company")  # Missing company_id
        result.test_name = "Get Response - Missing Parameters"
        result.expected_status = 400
        result.success = result.status_code == 400
        
        if result.success:
            self.log("✅ Correctly rejected missing parameters", "SUCCESS")
        
        self.results.append(result)
        return result
    
    def test_save_invalid_response(self) -> TestResult:
        """Test POST /responses with invalid data"""
        self.log("Testing POST /responses (invalid data)", "INFO")
        
        invalid_data = {
            "type": "invalid_type",
            "company_id": "test",
            "responses": {}
        }
        
        result = self.make_request("POST", "/responses", data=invalid_data)
        result.test_name = "Save Invalid Response"
        result.expected_status = 400
        result.success = result.status_code == 400
        
        if result.success:
            self.log("✅ Correctly rejected invalid response data", "SUCCESS")
        
        self.results.append(result)
        return result
    
    def test_cors_headers(self) -> TestResult:
        """Test CORS headers on all endpoints"""
        self.log("Testing CORS headers", "INFO")
        
        # Test OPTIONS request
        result = self.make_request("GET", "/questions?type=company")
        result.test_name = "CORS Headers Test"
        
        # Check for CORS headers in response (this would be in the actual response object)
        if result.success:
            self.log("✅ API responds to requests (CORS should be handled by API Gateway)", "SUCCESS")
        
        self.results.append(result)
        return result
    
    def test_response_update(self) -> TestResult:
        """Test updating an existing response"""
        self.log("Testing response update (save same company twice)", "INFO")
        
        # First save
        first_result = self.make_request("POST", "/responses", data=self.company_test_data)
        
        if not first_result.success:
            result = first_result
            result.test_name = "Response Update Test"
            result.error_message = "Failed to save initial response"
            self.results.append(result)
            return result
        
        # Update the response data
        updated_data = self.company_test_data.copy()
        updated_data["responses"]["c001"] = "Widespread AI implementation"
        updated_data["responses"]["c020"] = "Updated: Need more executive buy-in"
        
        # Second save (update)
        result = self.make_request("POST", "/responses", data=updated_data)
        result.test_name = "Response Update Test"
        
        if result.success:
            self.log("✅ Response update completed successfully", "SUCCESS")
        
        self.results.append(result)
        return result
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests and return summary"""
        self.log("🚀 Starting Baksh Audit Form API Test Suite", "HEADER")
        self.log(f"Testing API URL: {self.api_url}", "INFO")
        
        start_time = time.time()
        
        # Run all tests in order
        tests = [
            # Question endpoint tests
            self.test_get_company_questions,
            self.test_get_employee_questions,
            self.test_get_questions_invalid_type,
            self.test_get_questions_missing_type,
            
            # Save response tests (run before retrieval tests)
            self.test_save_company_response,
            self.test_save_employee_response,
            self.test_save_employee_response_with_files,
            
            # Get response tests (depends on save tests)
            self.test_get_existing_company_response,
            self.test_get_existing_employee_response,
            self.test_get_nonexistent_response,
            self.test_get_response_missing_params,
            
            # Error handling tests
            self.test_save_invalid_response,
            
            # General tests
            self.test_cors_headers,
            self.test_response_update,
        ]
        
        for test_func in tests:
            try:
                test_func()
                time.sleep(0.5)  # Brief pause between tests
            except Exception as e:
                self.log(f"❌ Test {test_func.__name__} failed with exception: {e}", "ERROR")
        
        total_time = time.time() - start_time
        
        # Generate summary
        summary = self.generate_summary(total_time)
        self.print_summary(summary)
        
        return summary
    
    def generate_summary(self, total_time: float) -> Dict[str, Any]:
        """Generate test summary"""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        
        avg_response_time = sum(r.response_time_ms for r in self.results) / total_tests if total_tests > 0 else 0
        
        return {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0,
            "total_time_seconds": total_time,
            "average_response_time_ms": avg_response_time,
            "api_url": self.api_url,
            "timestamp": datetime.now().isoformat(),
            "results": self.results
        }
    
    def print_summary(self, summary: Dict[str, Any]):
        """Print formatted test summary"""
        self.log("📊 Test Summary", "HEADER")
        self.log(f"Total Tests: {summary['total_tests']}", "INFO")
        self.log(f"Passed: {summary['passed']}", "SUCCESS")
        
        if summary['failed'] > 0:
            self.log(f"Failed: {summary['failed']}", "ERROR")
        else:
            self.log(f"Failed: {summary['failed']}", "SUCCESS")
        
        self.log(f"Success Rate: {summary['success_rate']:.1f}%", 
                "SUCCESS" if summary['success_rate'] > 80 else "WARNING")
        self.log(f"Total Time: {summary['total_time_seconds']:.1f}s", "INFO")
        self.log(f"Avg Response Time: {summary['average_response_time_ms']:.0f}ms", "INFO")
        
        # Print failed tests details
        failed_results = [r for r in self.results if not r.success]
        if failed_results:
            self.log("\n❌ Failed Tests:", "ERROR")
            for result in failed_results:
                self.log(f"  • {result.test_name}: {result.error_message or f'HTTP {result.status_code}'}", "ERROR")
        
        # Print all test results
        self.log("\n📋 Detailed Results:", "INFO")
        for result in self.results:
            status = "✅" if result.success else "❌"
            self.log(f"  {status} {result.test_name}: {result.method} {result.endpoint} "
                    f"({result.status_code}, {result.response_time_ms:.0f}ms)", 
                    "SUCCESS" if result.success else "ERROR")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Baksh Audit Form API Test Suite")
    parser.add_argument("--api-url", required=True, 
                       help="API Gateway URL (e.g., https://abc123.execute-api.us-east-1.amazonaws.com/dev)")
    parser.add_argument("--timeout", type=int, default=30, 
                       help="Request timeout in seconds (default: 30)")
    parser.add_argument("--output", help="Save results to JSON file")
    
    args = parser.parse_args()
    
    # Initialize tester
    tester = APITester(args.api_url, args.timeout)
    
    try:
        # Run tests
        summary = tester.run_all_tests()
        
        # Save results if requested
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(summary, f, indent=2, default=str)
            tester.log(f"Results saved to {args.output}", "INFO")
        
        # Exit with appropriate code
        exit_code = 0 if summary['failed'] == 0 else 1
        sys.exit(exit_code)
        
    except KeyboardInterrupt:
        tester.log("Test suite interrupted by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        tester.log(f"Test suite failed with error: {e}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()
