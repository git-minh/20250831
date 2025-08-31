#!/bin/bash

# Comprehensive Test Runner for Authentication System
# Supports local development and CI/CD environments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TEST_RESULTS_DIR="$PROJECT_DIR/test-results"
PLAYWRIGHT_REPORT_DIR="$PROJECT_DIR/playwright-report"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT=${ENVIRONMENT:-"development"}
TEST_TYPE=${TEST_TYPE:-"full"}
BROWSER=${BROWSER:-"chromium"}
PARALLEL=${PARALLEL:-"false"}
HEADLESS=${HEADLESS:-"true"}
CI=${CI:-"false"}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Function to show usage
show_usage() {
    echo "Authentication Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --environment    Test environment (development|staging|production) [default: development]"
    echo "  --type          Test type (full|smoke|security|performance|visual|unit) [default: full]"
    echo "  --browser       Browser (chromium|firefox|webkit|all) [default: chromium]"
    echo "  --parallel      Run tests in parallel (true|false) [default: false]"
    echo "  --headless      Run in headless mode (true|false) [default: true]"
    echo "  --docker        Run in Docker environment"
    echo "  --setup         Run setup only"
    echo "  --cleanup       Cleanup test artifacts"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --type smoke --browser chromium"
    echo "  $0 --type security --parallel true"
    echo "  $0 --environment staging --type performance"
    echo "  $0 --docker --type full"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --type)
            TEST_TYPE="$2"
            shift 2
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        --parallel)
            PARALLEL="$2"
            shift 2
            ;;
        --headless)
            HEADLESS="$2"
            shift 2
            ;;
        --docker)
            USE_DOCKER="true"
            shift
            ;;
        --setup)
            SETUP_ONLY="true"
            shift
            ;;
        --cleanup)
            CLEANUP_ONLY="true"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        exit 1
    fi
    
    # Check if project dependencies are installed
    if [ ! -d "$PROJECT_DIR/node_modules" ]; then
        print_warning "Dependencies not found, installing..."
        cd "$PROJECT_DIR"
        pnpm install
    fi
    
    # Check if Playwright browsers are installed
    if ! pnpm exec playwright --version &> /dev/null; then
        print_warning "Playwright not found, installing..."
        pnpm exec playwright install --with-deps
    fi
    
    print_success "Prerequisites checked"
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment..."
    
    # Check required environment variables
    case "$ENVIRONMENT" in
        "development")
            required_vars=("CONVEX_DEPLOYMENT" "CONVEX_SITE_URL")
            ;;
        "staging")
            required_vars=("CONVEX_DEPLOYMENT_STAGING" "CONVEX_SITE_URL_STAGING")
            ;;
        "production")
            required_vars=("CONVEX_DEPLOYMENT_PROD" "CONVEX_SITE_URL_PROD")
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable not set: $var"
            exit 1
        fi
    done
    
    print_success "Environment validated"
}

# Function to setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."
    
    # Create directories
    mkdir -p "$TEST_RESULTS_DIR"
    mkdir -p "$PLAYWRIGHT_REPORT_DIR"
    mkdir -p "$PROJECT_DIR/tests/auth/.auth"
    
    # Build application if not in CI
    if [ "$CI" != "true" ]; then
        print_status "Building application..."
        cd "$PROJECT_DIR"
        pnpm run build
    fi
    
    print_success "Test environment setup complete"
}

# Function to run authentication setup
run_auth_setup() {
    print_status "Running authentication setup..."
    
    cd "$PROJECT_DIR"
    
    # Start application in background if not in CI
    if [ "$CI" != "true" ]; then
        pnpm start &
        APP_PID=$!
        
        # Wait for application to be ready
        print_status "Waiting for application to start..."
        timeout 60 bash -c 'until curl -f http://localhost:3000; do sleep 2; done'
        
        if [ $? -ne 0 ]; then
            print_error "Application failed to start"
            kill $APP_PID 2>/dev/null || true
            exit 1
        fi
    fi
    
    # Run setup tests
    pnpm exec playwright test tests/setup/auth-setup.spec.ts
    
    print_success "Authentication setup complete"
}

# Function to run specific test type
run_tests() {
    print_status "Running $TEST_TYPE tests..."
    
    cd "$PROJECT_DIR"
    
    local test_command="pnpm exec playwright test"
    local browser_arg=""
    local parallel_arg=""
    
    # Set browser
    if [ "$BROWSER" != "all" ]; then
        browser_arg="--project=$BROWSER"
    fi
    
    # Set parallel execution
    if [ "$PARALLEL" == "true" ]; then
        parallel_arg="--workers=auto"
    else
        parallel_arg="--workers=1"
    fi
    
    case "$TEST_TYPE" in
        "smoke")
            $test_command tests/auth-registration.unauth.spec.ts tests/auth-session.spec.ts \
                --grep "should successfully register|should login existing user" \
                $browser_arg $parallel_arg
            ;;
        "security")
            $test_command tests/auth-errors.unauth.spec.ts \
                --grep "XSS|SQL|injection|malformed|CORS" \
                $browser_arg $parallel_arg
            ;;
        "performance")
            $test_command tests/auth-performance.perf.spec.ts \
                $browser_arg $parallel_arg
            ;;
        "visual")
            $test_command tests/auth-visual.visual.spec.ts \
                $browser_arg $parallel_arg
            ;;
        "unit")
            # Run unit tests if they exist
            if [ -d "$PROJECT_DIR/tests/unit" ]; then
                $test_command tests/unit/ $browser_arg $parallel_arg
            else
                print_warning "No unit tests found"
            fi
            ;;
        "full")
            $test_command tests/auth-*.spec.ts $browser_arg $parallel_arg
            ;;
        *)
            print_error "Invalid test type: $TEST_TYPE"
            exit 1
            ;;
    esac
    
    print_success "$TEST_TYPE tests completed"
}

# Function to generate reports
generate_reports() {
    print_status "Generating test reports..."
    
    cd "$PROJECT_DIR"
    
    # Generate HTML report
    pnpm exec playwright show-report --host=0.0.0.0 &
    REPORT_PID=$!
    
    # Generate JSON report if results exist
    if [ -f "$TEST_RESULTS_DIR/results.json" ]; then
        print_status "Processing test results..."
        # Add custom report processing here
    fi
    
    print_success "Reports generated"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    
    # Kill background processes
    if [ ! -z "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$REPORT_PID" ]; then
        kill $REPORT_PID 2>/dev/null || true
    fi
    
    # Clean up Docker containers if used
    if [ "$USE_DOCKER" == "true" ]; then
        docker-compose -f docker-compose.test.yml down
    fi
    
    print_success "Cleanup complete"
}

# Function to run in Docker
run_in_docker() {
    print_status "Running tests in Docker..."
    
    cd "$PROJECT_DIR"
    
    case "$TEST_TYPE" in
        "smoke"|"full")
            docker-compose -f docker-compose.test.yml up --abort-on-container-exit playwright-runner
            ;;
        "security")
            docker-compose -f docker-compose.test.yml up --abort-on-container-exit security-tester
            ;;
        "performance")
            docker-compose -f docker-compose.test.yml up --abort-on-container-exit performance-tester
            ;;
        "visual")
            docker-compose -f docker-compose.test.yml up --abort-on-container-exit visual-tester
            ;;
    esac
    
    print_success "Docker tests completed"
}

# Main execution flow
main() {
    print_status "Starting Authentication Test Runner"
    print_status "Environment: $ENVIRONMENT"
    print_status "Test Type: $TEST_TYPE"
    print_status "Browser: $BROWSER"
    print_status "Parallel: $PARALLEL"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    if [ "$CLEANUP_ONLY" == "true" ]; then
        cleanup
        exit 0
    fi
    
    check_prerequisites
    validate_environment
    setup_test_environment
    
    if [ "$SETUP_ONLY" == "true" ]; then
        run_auth_setup
        exit 0
    fi
    
    if [ "$USE_DOCKER" == "true" ]; then
        run_in_docker
    else
        run_auth_setup
        run_tests
        generate_reports
    fi
    
    print_success "Test execution completed successfully"
}

# Run main function
main "$@"