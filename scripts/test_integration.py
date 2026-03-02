"""
Integration Test Script
Tests the complete backend-frontend integration.
"""

import asyncio
import sys
import time
from pathlib import Path
import requests
from colorama import init, Fore, Style

# Initialize colorama for colored output
init(autoreset=True)

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Test configuration
API_BASE_URL = "http://localhost:8000"
API_VERSION = "v1"
TEST_USER = {
    "email": "demo@hedgerl.com",
    "password": "demo123"
}


def print_section(title: str):
    """Print a section header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_test(test_name: str):
    """Print test name."""
    print(f"\n🧪 Test: {test_name}")


def print_success(message: str):
    """Print success message."""
    print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")


def print_error(message: str):
    """Print error message."""
    print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")


def print_info(message: str):
    """Print info message."""
    print(f"{Fore.CYAN}ℹ️  {message}{Style.RESET_ALL}")


def print_warning(message: str):
    """Print warning message."""
    print(f"{Fore.YELLOW}⚠️  {message}{Style.RESET_ALL}")


class IntegrationTester:
    """Integration test runner."""
    
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "total": 0
        }
    
    def test(self, name: str):
        """Decorator to mark a method as a test."""
        def decorator(func):
            def wrapper(*args, **kwargs):
                print_test(name)
                self.test_results["total"] += 1
                try:
                    result = func(*args, **kwargs)
                    if result or result is None:
                        self.test_results["passed"] += 1
                        print_success(f"{name} - PASSED")
                        return True
                    else:
                        self.test_results["failed"] += 1
                        print_error(f"{name} - FAILED")
                        return False
                except Exception as e:
                    self.test_results["failed"] += 1
                    print_error(f"{name} - FAILED: {str(e)}")
                    return False
            return wrapper
        return decorator
    
    def test_backend_health(self):
        """Test 1: Backend health check."""
        print_test("Backend Health Check")
        try:
            response = self.session.get(f"{API_BASE_URL}/api/{API_VERSION}/health")
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Backend is healthy: {data}")
                self.test_results["passed"] += 1
                return True
            else:
                print_error(f"Health check failed with status {response.status_code}")
                self.test_results["failed"] += 1
                return False
        except Exception as e:
            print_error(f"Health check error: {e}")
            self.test_results["failed"] += 1
            return False
    
    def test_authentication(self):
        """Test 2: User authentication."""
        print_test("User Authentication")
        try:
            # Login
            login_data = {
                "username": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/api/{API_VERSION}/auth/token",
                data=login_data
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                
                if self.token:
                    print_success(f"Login successful, token received")
                    print_info(f"Token: {self.token[:20]}...")
                    
                    # Set authorization header
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.token}"
                    })
                    
                    self.test_results["passed"] += 1
                    return True
                else:
                    print_error("No token in response")
                    self.test_results["failed"] += 1
                    return False
            else:
                print_error(f"Login failed with status {response.status_code}")
                print_error(f"Response: {response.text}")
                self.test_results["failed"] += 1
                return False
                
        except Exception as e:
            print_error(f"Authentication error: {e}")
            self.test_results["failed"] += 1
            return False
    
    def test_list_datasets(self):
        """Test 3: List datasets."""
        print_test("List Datasets")
        try:
            response = self.session.get(f"{API_BASE_URL}/api/{API_VERSION}/datasets/")
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Retrieved {len(data)} datasets")
                self.test_results["passed"] += 1
                return True
            else:
                print_error(f"Failed with status {response.status_code}")
                self.test_results["failed"] += 1
                return False
        except Exception as e:
            print_error(f"List datasets error: {e}")
            self.test_results["failed"] += 1
            return False
    
    def test_list_experiments(self):
        """Test 4: List experiments."""
        print_test("List Experiments")
        try:
            response = self.session.get(f"{API_BASE_URL}/api/{API_VERSION}/experiments/")
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Retrieved {len(data)} experiments")
                self.test_results["passed"] += 1
                return True
            else:
                print_error(f"Failed with status {response.status_code}")
                self.test_results["failed"] += 1
                return False
        except Exception as e:
            print_error(f"List experiments error: {e}")
            self.test_results["failed"] += 1
            return False
    
    def test_list_models(self):
        """Test 5: List models."""
        print_test("List Models")
        try:
            response = self.session.get(f"{API_BASE_URL}/api/{API_VERSION}/models/")
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Retrieved {len(data)} models")
                self.test_results["passed"] += 1
                return True
            else:
                print_error(f"Failed with status {response.status_code}")
                self.test_results["failed"] += 1
                return False
        except Exception as e:
            print_error(f"List models error: {e}")
            self.test_results["failed"] += 1
            return False
    
    def test_websocket_info(self):
        """Test 6: WebSocket connection info."""
        print_test("WebSocket Connection Info")
        try:
            response = self.session.get(f"{API_BASE_URL}/ws-info")
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"WebSocket info retrieved")
                print_info(f"Active connections: {data.get('total_connections', 0)}")
                self.test_results["passed"] += 1
                return True
            else:
                print_error(f"Failed with status {response.status_code}")
                self.test_results["failed"] += 1
                return False
        except Exception as e:
            print_error(f"WebSocket info error: {e}")
            self.test_results["failed"] += 1
            return False
    
    def test_cors_headers(self):
        """Test 7: CORS headers."""
        print_test("CORS Headers")
        try:
            response = self.session.options(
                f"{API_BASE_URL}/api/{API_VERSION}/health",
                headers={"Origin": "http://localhost:3000"}
            )
            
            cors_header = response.headers.get("Access-Control-Allow-Origin")
            if cors_header:
                print_success(f"CORS configured: {cors_header}")
                self.test_results["passed"] += 1
                return True
            else:
                print_warning("CORS header not found")
                self.test_results["failed"] += 1
                return False
        except Exception as e:
            print_error(f"CORS test error: {e}")
            self.test_results["failed"] += 1
            return False
    
    def print_summary(self):
        """Print test summary."""
        print_section("TEST SUMMARY")
        
        total = self.test_results["total"]
        passed = self.test_results["passed"]
        failed = self.test_results["failed"]
        
        print(f"\nTotal Tests: {total}")
        print(f"{Fore.GREEN}Passed: {passed}{Style.RESET_ALL}")
        print(f"{Fore.RED}Failed: {failed}{Style.RESET_ALL}")
        
        if failed == 0:
            print(f"\n{Fore.GREEN}{'🎉 ' * 10}")
            print(f"ALL TESTS PASSED!")
            print(f"{'🎉 ' * 10}{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.YELLOW}⚠️  Some tests failed. Please check the logs.{Style.RESET_ALL}")
        
        print("\n" + "=" * 60)
    
    def run_all_tests(self):
        """Run all integration tests."""
        print_section("🚀 INTEGRATION TEST SUITE")
        print_info(f"Testing API at: {API_BASE_URL}")
        print_info(f"API Version: {API_VERSION}")
        
        # Initialize total count
        self.test_results["total"] = 0
        
        # Run tests
        self.test_backend_health()
        self.test_authentication()
        
        # Only run authenticated tests if login succeeded
        if self.token:
            self.test_list_datasets()
            self.test_list_experiments()
            self.test_list_models()
        else:
            print_warning("Skipping authenticated tests due to login failure")
            self.test_results["total"] += 3
            self.test_results["failed"] += 3
        
        self.test_websocket_info()
        self.test_cors_headers()
        
        # Print results
        self.print_summary()
        
        return self.test_results["failed"] == 0


def main():
    """Main test execution."""
    print(f"\n{Fore.CYAN}{'=' * 60}")
    print(f"  Integration Test Script")
    print(f"  Derivative Hedging RL Platform")
    print(f"{'=' * 60}{Style.RESET_ALL}\n")
    
    # Check if backend is accessible
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        if response.status_code != 200:
            print_error(f"Backend is not accessible at {API_BASE_URL}")
            print_info("Please start the backend server:")
            print_info("  uvicorn src.api.main:app --reload")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to backend at {API_BASE_URL}")
        print_info("Please start the backend server:")
        print_info("  uvicorn src.api.main:app --reload")
        sys.exit(1)
    
    # Run tests
    tester = IntegrationTester()
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}⚠️  Tests cancelled by user{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}❌ Test suite error: {e}{Style.RESET_ALL}")
        sys.exit(1)
