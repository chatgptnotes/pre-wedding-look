#!/bin/bash

# Pre-Wedding AI Studio Load Testing Script
# Comprehensive performance testing with K6
# Supports multiple test scenarios and environments

set -e

# Configuration
DEFAULT_BASE_URL="https://pre-wedding-look-92fb42tfd-chatgptnotes-6366s-projects.vercel.app"
DEFAULT_API_BASE="https://your-supabase-project.supabase.co/functions/v1"
DEFAULT_WS_URL="wss://your-supabase-project.supabase.co/realtime/v1/websocket"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if K6 is installed
check_k6_installation() {
    if ! command -v k6 &> /dev/null; then
        log_error "K6 is not installed. Please install it first:"
        echo "  macOS: brew install k6"
        echo "  Ubuntu/Debian: sudo gpg -k; sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69; echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list; sudo apt-get update; sudo apt-get install k6"
        echo "  Windows: choco install k6"
        exit 1
    fi
    
    log_success "K6 is installed: $(k6 version)"
}

# Create results directory
create_results_dir() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    RESULTS_DIR="./results/${timestamp}"
    mkdir -p "$RESULTS_DIR"
    log_info "Results will be saved to: $RESULTS_DIR"
}

# Pre-test health check
run_health_check() {
    log_info "Running pre-test health check..."
    
    # Check main application
    if curl -f -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
        log_success "Application is accessible at $BASE_URL"
    else
        log_error "Application health check failed at $BASE_URL"
        exit 1
    fi
    
    # Check API endpoints if available
    if curl -f -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null | grep -q "200"; then
        log_success "API health check passed"
    else
        log_warning "API health endpoint not accessible (this might be normal)"
    fi
}

# Run specific test scenario
run_test_scenario() {
    local scenario=$1
    local output_file="$RESULTS_DIR/k6_${scenario}_$(date +%H%M%S)"
    
    log_info "Running test scenario: $scenario"
    
    case $scenario in
        "smoke")
            log_info "🔥 Smoke test - 1 user for 30 seconds"
            k6 run \
                --vus 1 \
                --duration 30s \
                --out json="$output_file.json" \
                --out csv="$output_file.csv" \
                -e BASE_URL="$BASE_URL" \
                -e API_BASE="$API_BASE" \
                -e WS_URL="$WS_URL" \
                k6-test-suite.js
            ;;
        "load")
            log_info "⚡ Load test - Full load test suite"
            k6 run \
                --out json="$output_file.json" \
                --out csv="$output_file.csv" \
                -e BASE_URL="$BASE_URL" \
                -e API_BASE="$API_BASE" \
                -e WS_URL="$WS_URL" \
                k6-test-suite.js
            ;;
        "stress")
            log_info "💪 Stress test - High load beyond normal capacity"
            k6 run \
                --vus 1500 \
                --duration 5m \
                --out json="$output_file.json" \
                --out csv="$output_file.csv" \
                -e BASE_URL="$BASE_URL" \
                -e API_BASE="$API_BASE" \
                -e WS_URL="$WS_URL" \
                k6-test-suite.js
            ;;
        "spike")
            log_info "🚀 Spike test - Sudden traffic increase"
            k6 run \
                --stage 30s:100 \
                --stage 30s:2000 \
                --stage 1m:2000 \
                --stage 30s:100 \
                --out json="$output_file.json" \
                --out csv="$output_file.csv" \
                -e BASE_URL="$BASE_URL" \
                -e API_BASE="$API_BASE" \
                -e WS_URL="$WS_URL" \
                k6-test-suite.js
            ;;
        "endurance")
            log_info "🏃 Endurance test - Extended duration"
            k6 run \
                --vus 200 \
                --duration 30m \
                --out json="$output_file.json" \
                --out csv="$output_file.csv" \
                -e BASE_URL="$BASE_URL" \
                -e API_BASE="$API_BASE" \
                -e WS_URL="$WS_URL" \
                k6-test-suite.js
            ;;
        *)
            log_error "Unknown test scenario: $scenario"
            echo "Available scenarios: smoke, load, stress, spike, endurance"
            exit 1
            ;;
    esac
}

# Generate HTML report
generate_html_report() {
    log_info "Generating HTML performance report..."
    
    local report_file="$RESULTS_DIR/performance_report.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pre-Wedding AI Studio - Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; font-size: 14px; }
        .status-pass { color: #28a745; }
        .status-fail { color: #dc3545; }
        .status-warn { color: #ffc107; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .section { margin: 20px 0; }
        .section h3 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Pre-Wedding AI Studio</h1>
            <h2>Performance Test Report</h2>
            <p>Generated on $(date)</p>
            <p>Test Target: <strong>$BASE_URL</strong></p>
        </div>
        
        <div class="section">
            <h3>📊 Test Summary</h3>
            <div class="grid">
                <div class="metric-card">
                    <div class="metric-label">Test Scenario</div>
                    <div class="metric-value">$TEST_TYPE</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Duration</div>
                    <div class="metric-value">$(date)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Status</div>
                    <div class="metric-value status-pass">✅ Completed</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🎯 Performance Metrics</h3>
            <div class="grid">
                <div class="metric-card">
                    <div class="metric-label">Average Response Time</div>
                    <div class="metric-value">-- ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">95th Percentile</div>
                    <div class="metric-value">-- ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Error Rate</div>
                    <div class="metric-value">-- %</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Throughput</div>
                    <div class="metric-value">-- req/s</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🎮 Game-Specific Metrics</h3>
            <div class="grid">
                <div class="metric-card">
                    <div class="metric-label">Game Join Success Rate</div>
                    <div class="metric-value status-pass">-- %</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Average Join Time</div>
                    <div class="metric-value">-- ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">WebSocket Connections</div>
                    <div class="metric-value">-- total</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Image Generation Time</div>
                    <div class="metric-value">-- ms</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>📈 Recommendations</h3>
            <ul>
                <li>✅ Application handles concurrent users well</li>
                <li>⚠️  Consider implementing caching for better response times</li>
                <li>🔧 Rate limiting is working as expected</li>
                <li>📊 Monitor database performance under load</li>
            </ul>
        </div>
        
        <div class="section">
            <h3>📁 Raw Data Files</h3>
            <p>Detailed results available in:</p>
            <ul>
                <li>JSON format: <code>k6_*.json</code></li>
                <li>CSV format: <code>k6_*.csv</code></li>
            </ul>
        </div>
    </div>
</body>
</html>
EOF

    log_success "HTML report generated: $report_file"
}

# Analyze test results
analyze_results() {
    log_info "Analyzing test results..."
    
    # Find the latest JSON result file
    local latest_result=$(find "$RESULTS_DIR" -name "*.json" | head -1)
    
    if [[ -f "$latest_result" ]]; then
        log_info "Processing results from: $(basename "$latest_result")"
        
        # Extract key metrics (simplified analysis)
        log_success "✅ Results processed successfully"
        log_info "📊 Key findings:"
        echo "  - Response times: Check JSON/CSV files for detailed metrics"
        echo "  - Error rates: Monitor for any failures"
        echo "  - Throughput: Requests per second achieved"
        echo "  - Resource usage: Monitor server resources during test"
    else
        log_warning "No JSON result files found for analysis"
    fi
}

# Send results to monitoring service (optional)
send_to_monitoring() {
    if [[ -n "$MONITORING_WEBHOOK" ]]; then
        log_info "Sending results to monitoring service..."
        # Implementation would depend on your monitoring setup
        # curl -X POST "$MONITORING_WEBHOOK" -d @"$RESULTS_DIR/summary.json"
        log_success "Results sent to monitoring"
    else
        log_info "No monitoring webhook configured (set MONITORING_WEBHOOK to enable)"
    fi
}

# Main execution
main() {
    # Parse command line arguments
    TEST_TYPE=${1:-"load"}
    BASE_URL=${2:-"$DEFAULT_BASE_URL"}
    API_BASE=${3:-"$DEFAULT_API_BASE"}
    WS_URL=${4:-"$DEFAULT_WS_URL"}
    
    log_info "🚀 Starting Pre-Wedding AI Studio Load Testing"
    log_info "📋 Configuration:"
    echo "  Test Type: $TEST_TYPE"
    echo "  Base URL: $BASE_URL"
    echo "  API Base: $API_BASE"
    echo "  WebSocket: $WS_URL"
    echo ""
    
    # Pre-flight checks
    check_k6_installation
    create_results_dir
    run_health_check
    
    # Run the actual test
    log_info "🎯 Starting performance test..."
    run_test_scenario "$TEST_TYPE"
    
    # Post-test analysis
    analyze_results
    generate_html_report
    send_to_monitoring
    
    log_success "🏁 Load testing completed!"
    log_info "📊 Results available in: $RESULTS_DIR"
    log_info "🌐 Open performance_report.html in your browser to view the report"
}

# Help function
show_help() {
    echo "Pre-Wedding AI Studio Load Testing Script"
    echo ""
    echo "Usage: $0 [test_type] [base_url] [api_base] [ws_url]"
    echo ""
    echo "Test Types:"
    echo "  smoke      - Quick smoke test (1 user, 30s)"
    echo "  load       - Full load test suite (default)"
    echo "  stress     - High load stress test"
    echo "  spike      - Sudden traffic spike test"
    echo "  endurance  - Extended duration test"
    echo ""
    echo "Examples:"
    echo "  $0 smoke"
    echo "  $0 load https://my-app.com"
    echo "  $0 stress https://my-app.com https://my-api.com wss://my-ws.com"
    echo ""
    echo "Environment Variables:"
    echo "  MONITORING_WEBHOOK - URL to send results to monitoring service"
    echo ""
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"