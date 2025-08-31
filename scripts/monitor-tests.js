#!/usr/bin/env node

/**
 * Test Monitoring and Alerting System
 * Monitors test execution and provides real-time feedback
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestMonitor {
  constructor(config = {}) {
    this.config = {
      testResultsDir: config.testResultsDir || './test-results',
      playwrightReportDir: config.playwrightReportDir || './playwright-report',
      webhookUrl: config.webhookUrl || null,
      alertThresholds: {
        failureRate: config.failureThreshold || 0.1, // 10%
        responseTime: config.responseTimeThreshold || 5000, // 5s
        testDuration: config.testDurationThreshold || 300000, // 5min
      },
      ...config
    };
    
    this.metrics = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      startTime: null,
      endTime: null,
      testResults: []
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    console.log(`${prefix} ${message}`);
  }

  async startMonitoring() {
    this.log('🔍 Starting test monitoring system...');
    this.metrics.startTime = Date.now();

    // Watch test results directory
    if (fs.existsSync(this.config.testResultsDir)) {
      this.watchTestResults();
    }

    // Monitor system resources
    this.monitorSystemResources();

    // Setup alerts
    this.setupAlerts();

    this.log('✅ Test monitoring system started');
  }

  watchTestResults() {
    this.log('👁️ Watching test results directory...');
    
    fs.watch(this.config.testResultsDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.json')) {
        this.processTestResult(path.join(this.config.testResultsDir, filename));
      }
    });
  }

  processTestResult(resultFile) {
    try {
      if (!fs.existsSync(resultFile)) return;

      const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
      this.updateMetrics(result);
      this.checkAlerts(result);
      
    } catch (error) {
      this.log(`❌ Error processing test result: ${error.message}`, 'ERROR');
    }
  }

  updateMetrics(result) {
    this.metrics.totalTests++;
    
    switch (result.status) {
      case 'passed':
        this.metrics.passedTests++;
        break;
      case 'failed':
        this.metrics.failedTests++;
        break;
      case 'skipped':
        this.metrics.skippedTests++;
        break;
    }

    this.metrics.testResults.push({
      name: result.title || 'Unknown Test',
      status: result.status,
      duration: result.duration || 0,
      timestamp: Date.now(),
      error: result.error || null
    });

    this.reportProgress();
  }

  reportProgress() {
    const { totalTests, passedTests, failedTests, skippedTests } = this.metrics;
    const failureRate = totalTests > 0 ? (failedTests / totalTests) * 100 : 0;
    
    this.log(`📊 Progress: ${totalTests} total, ${passedTests} passed, ${failedTests} failed, ${skippedTests} skipped (${failureRate.toFixed(1)}% failure rate)`);
  }

  checkAlerts(result) {
    const alerts = [];

    // Check failure rate
    const failureRate = this.metrics.totalTests > 0 ? 
      (this.metrics.failedTests / this.metrics.totalTests) : 0;
    
    if (failureRate > this.config.alertThresholds.failureRate) {
      alerts.push({
        type: 'HIGH_FAILURE_RATE',
        message: `High failure rate detected: ${(failureRate * 100).toFixed(1)}%`,
        severity: 'HIGH'
      });
    }

    // Check test duration
    if (result.duration > this.config.alertThresholds.responseTime) {
      alerts.push({
        type: 'SLOW_TEST',
        message: `Slow test detected: ${result.title} took ${result.duration}ms`,
        severity: 'MEDIUM'
      });
    }

    // Process alerts
    alerts.forEach(alert => this.sendAlert(alert));
  }

  sendAlert(alert) {
    this.log(`🚨 ALERT [${alert.severity}]: ${alert.message}`, 'ALERT');
    
    if (this.config.webhookUrl) {
      this.sendWebhookAlert(alert);
    }
  }

  async sendWebhookAlert(alert) {
    try {
      const payload = {
        text: `Test Alert: ${alert.message}`,
        severity: alert.severity,
        timestamp: new Date().toISOString(),
        metrics: this.getMetricsSummary()
      };

      // Implement webhook sending logic here
      this.log('📤 Webhook alert sent', 'INFO');
      
    } catch (error) {
      this.log(`❌ Failed to send webhook alert: ${error.message}`, 'ERROR');
    }
  }

  monitorSystemResources() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      this.log(`💾 Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB, Uptime: ${uptime.toFixed(0)}s`);
      
      // Check for memory leaks
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
        this.sendAlert({
          type: 'HIGH_MEMORY_USAGE',
          message: `High memory usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          severity: 'HIGH'
        });
      }
    }, 30000); // Check every 30 seconds
  }

  setupAlerts() {
    // Setup periodic summary alerts
    setInterval(() => {
      if (this.metrics.totalTests > 0) {
        this.sendSummaryReport();
      }
    }, 300000); // Every 5 minutes
  }

  sendSummaryReport() {
    const summary = this.getMetricsSummary();
    this.log(`📈 Test Summary: ${JSON.stringify(summary, null, 2)}`);
  }

  getMetricsSummary() {
    const duration = this.metrics.endTime || Date.now() - this.metrics.startTime;
    
    return {
      totalTests: this.metrics.totalTests,
      passedTests: this.metrics.passedTests,
      failedTests: this.metrics.failedTests,
      skippedTests: this.metrics.skippedTests,
      failureRate: this.metrics.totalTests > 0 ? 
        ((this.metrics.failedTests / this.metrics.totalTests) * 100).toFixed(2) + '%' : '0%',
      duration: `${(duration / 1000).toFixed(2)}s`,
      avgTestDuration: this.metrics.testResults.length > 0 ?
        `${(this.metrics.testResults.reduce((sum, test) => sum + test.duration, 0) / this.metrics.testResults.length).toFixed(0)}ms` : '0ms'
    };
  }

  async generateFinalReport() {
    this.metrics.endTime = Date.now();
    
    const report = {
      summary: this.getMetricsSummary(),
      testResults: this.metrics.testResults,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Save final report
    const reportPath = path.join(this.config.testResultsDir, 'final-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📋 Final report saved to: ${reportPath}`);
    this.log(`🎯 Final Summary: ${JSON.stringify(report.summary, null, 2)}`);
    
    return report;
  }

  async stopMonitoring() {
    this.log('⏹️ Stopping test monitoring...');
    await this.generateFinalReport();
    this.log('✅ Test monitoring stopped');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};
  
  // Parse CLI arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    switch (key) {
      case 'webhook-url':
        config.webhookUrl = value;
        break;
      case 'failure-threshold':
        config.failureThreshold = parseFloat(value);
        break;
      case 'response-time-threshold':
        config.responseTimeThreshold = parseInt(value);
        break;
      case 'test-results-dir':
        config.testResultsDir = value;
        break;
    }
  }
  
  const monitor = new TestMonitor(config);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down test monitor...');
    await monitor.stopMonitoring();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await monitor.stopMonitoring();
    process.exit(0);
  });
  
  monitor.startMonitoring().catch(error => {
    console.error('❌ Failed to start test monitor:', error);
    process.exit(1);
  });
}

module.exports = TestMonitor;