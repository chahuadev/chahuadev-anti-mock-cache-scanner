#!/usr/bin/env node
// ======================================================================
// CHAHUADEV UNIVERSAL SECURITY SCANNER CLI v1.0
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// @license MIT
// @contact chahuadev@gmail.com
// ======================================================================


const fs = require('fs');
const path = require('path');
const { UniversalSecurityEngine, SecurityPatterns } = require('./universal-security-engine.js');
const { ProfessionalLogger, SecurityManager, TokenizerSecurityManager } = require('./professional-logging-system.js');
const { AIFileAnalyzer } = require('./ai-file-analyzer.js');
const { ChahuadevREngine } = require('./chahuadev-r-engine.js');

// ======================================================================
// CLI PRESENTATION LAYER
// ======================================================================
class SecurityScannerCLI {
    constructor() {
        this.engine = null;
        this.outputFormats = ['console', 'json', 'csv', 'html'];
        this.startTime = null;
        this.targetPath = null;

        // Initialize Professional Logging System
        this.logger = new ProfessionalLogger('chahuadev-anti-mock-cache-scanner', {
            logLevel: 'INFO',
            enableFileLogging: true,
            enableConsoleLogging: false // ปิดเพื่อไม่รบกวนการแสดงผล
        });

        // Initialize Security Manager with relaxed path checking for scanning
        this.securityManager = new SecurityManager({
            enablePathValidation: true,
            enableFileSizeCheck: true,
            enableSymlinkCheck: true,
            enableSystemDirProtection: true // ป้องกันไดเรกทอรี่ระบบ แต่อนุญาตสแกนโปรเจคอื่น
        });

        // Initialize AI File Analyzer
        this.aiAnalyzer = new AIFileAnalyzer({
            enableDeepAnalysis: true,
            enableIntentDetection: true,
            detailedReporting: true,
            minConfidenceLevel: 0.4
        });

        console.log(`  Professional Logging System initialized`);
        console.log(`  AI File Analyzer v3.0 initialized`);
        this.logger.system('CLI_INITIALIZED', {
            outputFormats: this.outputFormats,
            logLevel: this.logger.options.logLevel,
            aiAnalyzerEnabled: true
        });
    }

    //  สร้าง engine ด้วย Dependency Injection - "ผู้ประกอบร่าง Mothership"
    createEngine(options = {}) {
        // 1. สร้าง "อวัยวะ" ทุกชิ้นที่นี่ที่เดียว
        this.rEngine = new ChahuadevREngine();

        // 2. "ฉีด" dependencies เข้าไปใน Engine หลัก
        this.engine = new UniversalSecurityEngine(
            this.rEngine,      //  Injected: Advanced Pratt Parser
            this.aiAnalyzer,   //  Injected: AI File Analyzer  
            this.logger,       //  Injected: Professional Logger
            options            //  Injected: Configuration
        );

        // 3. ดักฟัง events จาก engine
        this.setupEventListeners();
    }

    // ตั้งค่า event listeners
    setupEventListeners() {
        if (!this.engine) return;

        // Scan events
        this.engine.on('scanStarted', (data) => {
            console.log(` เริ่มสแกน: ${data.target}`);
            console.log(` Configuration: Recursive=${data.config.scanConfig.recursive}, MinSeverity=${data.config.minSeverityLevel}`);
            console.log('');

            // Log scan start
            try {
                if (this.logger && typeof this.logger.audit === 'function') {
                    this.logger.audit('SCAN_STARTED', data.target, {
                        config: data.config,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (logError) {
                // Silently ignore logging errors
            }
        });

        this.engine.on('fileStarted', (data) => {
            process.stdout.write(` ${data.filePath}...`);

            // Log detailed file start info
            try {
                if (this.logger && typeof this.logger.info === 'function') {
                    this.logger.info('FILE_SCAN_STARTED', `Starting scan: ${data.filePath}`, {
                        filePath: data.filePath,
                        lineCount: data.lineCount,
                        fileSize: this.getFileSize(data.filePath),
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (logError) {
                // Silently ignore logging errors
            }
        });

        this.engine.on('fileCompleted', (data) => {
            const aiEnhancedText = data.aiEnhanced ? ' (AI-Enhanced)' : '';
            const aiIssuesText = data.aiIssues > 0 ? ` | AI: ${data.aiIssues} issues` : '';

            if (data.violations > 0) {
                console.log(`  ${data.violations} violations${aiEnhancedText}${aiIssuesText}`);

                // Log security violations with AI enhancement info
                try {
                    if (this.logger && typeof this.logger.security === 'function') {
                        this.logger.security('VIOLATIONS_DETECTED', {
                            filePath: data.filePath,
                            violationCount: data.violations,
                            aiEnhanced: data.aiEnhanced,
                            aiIssues: data.aiIssues,
                            scanDuration: data.scanTime
                        }, data.violations > 5 ? 'HIGH' : 'MEDIUM');
                    }
                } catch (logError) {
                    // Silently ignore logging errors
                }

                // AI analysis is now integrated - no separate call needed
            } else {
                console.log(`  clean${aiEnhancedText}${aiIssuesText}`);

                // Log clean file with AI info
                try {
                    if (this.logger && typeof this.logger.audit === 'function') {
                        this.logger.audit('FILE_CLEAN', data.filePath, {
                            aiEnhanced: data.aiEnhanced,
                            aiIssues: data.aiIssues,
                            scanDuration: data.scanTime
                        });
                    }
                } catch (logError) {
                    // Silently ignore logging errors
                }
            }
        });

        this.engine.on('fileSkipped', (data) => {
            console.log(`  Skipped: ${data.filePath} (${data.reason})`);

            // Log skipped file
            try {
                if (this.logger && typeof this.logger.debug === 'function') {
                    this.logger.debug('FILE_SKIPPED', `File skipped: ${data.filePath}`, {
                        reason: data.reason,
                        filePath: data.filePath
                    });
                }
            } catch (logError) {
                // Silently ignore logging errors
            }
        });

        // Violation events  
        this.engine.on('violation', (violation) => {
            this.reportViolation(violation);

            // Log individual violation with proper context binding
            try {
                const severity = violation.severity.toLowerCase() === 'critical' ? 'CRITICAL' :
                    violation.severity.toLowerCase() === 'high' ? 'HIGH' : 'MEDIUM';

                if (this.logger && typeof this.logger.security === 'function') {
                    this.logger.security('VIOLATION_FOUND', {
                        violationId: violation.id,
                        filePath: violation.file,
                        type: violation.type,
                        severity: violation.severity,
                        category: violation.category,
                        line: violation.line,
                        code: violation.code,
                        description: violation.description,
                        recommendation: violation.recommendation,
                        pattern: violation.pattern,
                        matches: violation.matches,
                        aiEnhanced: violation.aiEnhanced || false,
                        aiConfidence: violation.aiConfidence || 0,
                        aiGenerated: violation.aiGenerated || false,
                        timestamp: violation.timestamp
                    }, severity);
                }
            } catch (logError) {
                // Silently ignore logging errors during scanning
            }
        });

        // AI Analysis events
        this.engine.on('aiAnalysisCompleted', (data) => {
            try {
                if (this.logger && typeof this.logger.info === 'function') {
                    this.logger.info('AI_ANALYSIS_COMPLETED', `AI analysis completed for ${data.filePath}`, {
                        filePath: data.filePath,
                        analysisType: data.analysis?.type || 'general',
                        confidence: data.analysis?.analysis?.intent?.confidence || 0,
                        quality: data.analysis?.analysis?.quality?.overallScore || 0,
                        issues: data.analysis?.issues?.length || 0,
                        detectedPatterns: data.analysis?.detectedPatterns || [],
                        codeComplexity: data.analysis?.analysis?.complexity || null,
                        errorAnalysis: data.analysis?.analysis?.errorAnalysis || null,
                        performanceAnalysis: data.analysis?.analysis?.performance || null,
                        securityAnalysis: data.analysis?.analysis?.security || null,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (logError) {
                // Silently ignore logging errors
            }
        });

        // Error events
        this.engine.on('error', (errorData) => {
            console.error(` Error: ${errorData.error.message}`);
            if (errorData.filePath) {
                console.error(`    File: ${errorData.filePath}`);
            }
        });

        this.engine.on('warning', (warningData) => {
            console.log(`  Warning: ${warningData.type}`);
            if (warningData.filePath) {
                console.log(`    File: ${warningData.filePath}`);
            }
        });

        // Scan completion
        this.engine.on('scanCompleted', (data) => {
            console.log('\n' + '='.repeat(80));
            this.generateConsoleReport(data.stats);

            // Log scan completion with comprehensive stats
            try {
                if (this.logger && typeof this.logger.audit === 'function') {
                    this.logger.audit('SCAN_COMPLETED', this.targetPath, {
                        totalFiles: data.stats.totalFiles || 0,
                        scannedFiles: data.stats.scannedFiles,
                        totalViolations: data.stats.totalViolations,
                        violationsBySeverity: data.stats.violationsBySeverity,
                        violationsByCategory: data.stats.violationsByCategory,
                        aiEnhancedFiles: data.stats.aiEnhancedFiles || 0,
                        aiDetectedIssues: data.stats.aiDetectedIssues || 0,
                        aiAnalysisFailures: data.stats.aiAnalysisFailures || 0,
                        scanDuration: data.stats.duration,
                        startTime: data.stats.startTime,
                        endTime: data.stats.endTime,
                        timestamp: new Date().toISOString(),
                        engineVersion: '2.0',
                        aiEnhanced: true
                    });
                }

                // Generate and close logging session
                if (this.logger && typeof this.logger.generateReport === 'function') {
                    const logReport = this.logger.generateReport();
                    console.log(`\n  Session logs saved to: ${logReport.logging.location}`);
                }

                // Close logger gracefully
                if (this.logger && typeof this.logger.close === 'function') {
                    setTimeout(() => {
                        this.logger.close();
                    }, 500);
                }
            } catch (logError) {
                console.log(`\n   Logging session completed with minor errors`);
            }
        });
    }

    // รายงาน violation แบบ real-time
    reportViolation(violation) {
        const emoji = this.getSeverityEmoji(violation.severity);
        const color = this.getSeverityColor(violation.severity);

        console.log(`\n${emoji} ${color}${violation.severity}${this.getResetColor()} VIOLATION DETECTED!`);
        console.log(`    ID: ${violation.id}`);
        console.log(`    File: ${violation.file}`);
        console.log(`    Line: ${violation.line}`);
        console.log(`     Type: ${violation.type}`);
        console.log(`    Category: ${violation.category}`);
        console.log(`    Description: ${violation.description}`);
        console.log(`    Recommendation: ${violation.recommendation}`);
        console.log(`    Code: ${violation.code}`);
        console.log(`    Matches: ${violation.matches.join(', ')}`);
        console.log('');
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    // Utility method to get file size
    getFileSize(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                return {
                    bytes: stats.size,
                    readable: this.formatFileSize(stats.size)
                };
            }
        } catch (error) {
            return { bytes: 0, readable: '0 B' };
        }
        return { bytes: 0, readable: '0 B' };
    }

    // Format file size in readable format
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // ==========================================
    // AI ANALYSIS INTEGRATION
    // ==========================================

    async performAIAnalysis(filePath, violationCount) {
        try {
            // Check if AI analysis is enabled
            if (!this.enableAIAnalysis) return;

            // Only perform AI analysis on files with violations for performance
            if (violationCount === 0) return;

            console.log(`\n AI Analysis: ${path.basename(filePath)}...`);

            const analysis = await this.aiAnalyzer.analyzeFile(filePath, {
                focusOnErrors: true,
                focusOnDebug: true,
                includeIntentAnalysis: true
            });

            this.displayAIAnalysisResults(analysis, filePath);

            // Log AI analysis results
            if (this.logger && typeof this.logger.audit === 'function') {
                this.logger.audit('AI_ANALYSIS_COMPLETED', filePath, {
                    violationCount,
                    confidence: analysis.metadata.confidence,
                    riskLevel: analysis.metadata.riskLevel,
                    totalIssues: analysis.issues.length,
                    totalIntents: analysis.intents.reduce((sum, i) => sum + i.count, 0)
                });
            }

        } catch (error) {
            console.log(`     AI analysis failed: ${error.message.substring(0, 50)}...`);

            if (this.logger && typeof this.logger.error === 'function') {
                this.logger.error('AI_ANALYSIS_ERROR', `AI analysis failed for ${filePath}`, error);
            }
        }
    }

    displayAIAnalysisResults(analysis, filePath) {
        const shortPath = path.basename(filePath);

        // Display AI insights
        if (analysis.insights && analysis.insights.length > 0) {
            console.log(`    AI Insights (${analysis.insights.length}):`);

            for (const insight of analysis.insights.slice(0, 3)) {
                const emoji = insight.severity === 'CRITICAL' ? '' :
                    insight.severity === 'HIGH' ? '' :
                        insight.severity === 'MEDIUM' ? '' : '';

                console.log(`     ${emoji} ${insight.title}`);
                console.log(`       ${insight.description}`);
            }
        }

        // Display intent detection results
        if (analysis.intents && analysis.intents.length > 0) {
            const totalIntents = analysis.intents.reduce((sum, i) => sum + i.count, 0);
            console.log(`    Code Intent Detection (${totalIntents} patterns):`);

            for (const intent of analysis.intents.slice(0, 4)) {
                const confidence = Math.round(intent.confidence * 100);
                const emoji = intent.category === 'debugging' ? '' :
                    intent.category === 'error_handling' ? '' :
                        intent.category === 'async_operations' ? '' :
                            intent.category === 'security_operations' ? '' :
                                intent.category === 'network_operations' ? '' : '';

                console.log(`     ${emoji} ${intent.category.toUpperCase()}: ${intent.count} (${confidence}% confidence)`);

                // Show sample patterns
                const samples = intent.items.slice(0, 2);
                for (const sample of samples) {
                    console.log(`       Line ${sample.line}: ${sample.context.substring(0, 50)}...`);
                }
            }
        }

        // Display quality analysis
        const qualityIssues = analysis.issues.filter(i => i.type === 'QUALITY_ISSUE');
        if (qualityIssues.length > 0) {
            console.log(`    Code Quality Issues (${qualityIssues.length}):`);

            const groupedIssues = qualityIssues.reduce((acc, issue) => {
                const key = issue.category;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            for (const [category, count] of Object.entries(groupedIssues).slice(0, 3)) {
                const emoji = category === 'potential_bugs' ? '' :
                    category === 'performance_issues' ? '' :
                        category === 'memory_leaks' ? '' : '';

                console.log(`     ${emoji} ${category.toUpperCase()}: ${count} issues`);
            }
        }

        // Display error analysis
        const errorIssues = analysis.issues.filter(i => i.type === 'ERROR_ANALYSIS');
        if (errorIssues.length > 0) {
            console.log(`    Error Pattern Analysis (${errorIssues.length}):`);

            const errorCategories = errorIssues.reduce((acc, issue) => {
                acc[issue.category] = (acc[issue.category] || 0) + 1;
                return acc;
            }, {});

            for (const [category, count] of Object.entries(errorCategories).slice(0, 3)) {
                const emoji = category === 'syntax_errors' ? '' :
                    category === 'runtime_errors' ? '' :
                        category === 'logical_errors' ? '' : '';

                console.log(`     ${emoji} ${category.toUpperCase()}: ${count} patterns`);
            }
        }

        // Display overall metrics
        const qualityScore = analysis.metrics?.qualityScore || 0;
        const riskScore = analysis.metrics?.riskScore || 0;
        const complexity = analysis.metadata?.fileInfo?.complexity?.level || 'Unknown';

        console.log(`    Metrics: Quality ${qualityScore}/100, Risk ${riskScore}/100, Complexity: ${complexity}`);

        // Display recommendations
        if (analysis.metadata?.recommendations && analysis.metadata.recommendations.length > 0) {
            console.log(`    Top Recommendation: ${analysis.metadata.recommendations[0].action}`);
        }

        console.log('');
    }

    // สร้างรายงานสรุปบน console
    generateConsoleReport(stats) {
        // สร้าง log file ก่อนแสดงรายงาน
        this.generateLogFile(stats);

        console.log(' UNIVERSAL SECURITY SCANNER REPORT v2.0 (AI-Enhanced)');
        console.log('='.repeat(80));
        console.log(` Files Scanned: ${stats.scannedFiles}`);
        console.log(` Total Violations: ${stats.totalViolations}`);
        console.log(` AI Enhanced Files: ${stats.aiEnhancedFiles || 0}`);
        console.log(` AI Detected Issues: ${stats.aiDetectedIssues || 0}`);
        console.log(` Duration: ${stats.duration}ms`);
        console.log('');

        console.log(' VIOLATIONS BY SEVERITY:');
        Object.keys(stats.violationsBySeverity).forEach(severity => {
            const count = stats.violationsBySeverity[severity];
            const emoji = this.getSeverityEmoji(severity);
            const severityInfo = SecurityPatterns.SEVERITY_LEVELS[severity];
            console.log(`   ${emoji} ${severity}: ${count} (${severityInfo.description})`);
        });
        console.log('');

        console.log(' VIOLATIONS BY CATEGORY:');
        Object.keys(stats.violationsByCategory).forEach(category => {
            const count = stats.violationsByCategory[category];
            if (count > 0) {
                const categoryInfo = SecurityPatterns.VIOLATION_CATEGORIES[category];
                console.log(`    ${category}: ${count} - ${categoryInfo?.name || 'Unknown category'}`);
            }
        });
        console.log('');

        // Compliance status
        if (stats.totalViolations === 0) {
            console.log(' CLEAN! No Mock/Cache violations detected.');
            console.log(' "No Mock, No Cache Policy" compliance verified!');
        } else {
            console.log(' VIOLATIONS DETECTED!');
            console.log(' "No Mock, No Cache Policy" violations found!');

            if (stats.violationsBySeverity.CRITICAL > 0) {
                console.log('\n CRITICAL ACTION REQUIRED:');
                console.log('   Remove all Mock/Cache implementations immediately!');
                console.log('   Use real file system operations and authentic analysis only!');
            }
        }

        console.log('='.repeat(80));
        console.log(`Scan completed at: ${new Date().toISOString()}`);
        console.log('='.repeat(80));
    }

    // สร้างรายงาน JSON
    async generateJSONReport(outputPath) {
        if (!this.engine) return null;

        const report = this.engine.generateDetailedReport();
        const reportFile = outputPath || `security-scan-report-${Date.now()}.json`;

        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        console.log(`\n Detailed JSON report saved: ${reportFile}`);

        return reportFile;
    }

    // สร้างรายงาน CSV
    async generateCSVReport(outputPath) {
        if (!this.engine) return null;

        const violations = this.engine.violations;
        const reportFile = outputPath || `security-scan-report-${Date.now()}.csv`;

        // CSV Headers
        const headers = ['ID', 'Timestamp', 'File', 'Line', 'Severity', 'Category', 'Type', 'Description', 'Code', 'Recommendation'];
        let csvContent = headers.join(',') + '\n';

        // CSV Rows
        violations.forEach(violation => {
            const row = [
                violation.id,
                violation.timestamp,
                `"${violation.file}"`,
                violation.line,
                violation.severity,
                violation.category,
                violation.type,
                `"${violation.description}"`,
                `"${violation.code.replace(/"/g, '""')}"`,
                `"${violation.recommendation.replace(/"/g, '""')}"`
            ];
            csvContent += row.join(',') + '\n';
        });

        fs.writeFileSync(reportFile, csvContent);
        console.log(`\n CSV report saved: ${reportFile}`);

        return reportFile;
    }

    // สร้างไฟล์ log รายละเอียดการสแกน
    generateLogFile(stats) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logDir = 'logs';
            const logFile = path.join(logDir, `security-scan-${timestamp}.log`);

            // สร้างโฟลเดอร์ logs ถ้าไม่มี
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            // เนื้อหา log file
            let logContent = '';
            logContent += '='.repeat(100) + '\n';
            logContent += 'CHAHUADEV UNIVERSAL SECURITY SCANNER - DETAILED LOG v2.0\n';
            logContent += '='.repeat(100) + '\n';
            logContent += `Scan Started: ${stats.startTime}\n`;
            logContent += `Scan Completed: ${new Date().toISOString()}\n`;
            logContent += `Duration: ${stats.duration}ms\n`;
            logContent += `Target: ${stats.target || 'Unknown'}\n`;
            logContent += `Files Scanned: ${stats.scannedFiles}\n`;
            logContent += `Total Violations: ${stats.totalViolations}\n`;
            logContent += '\n';

            // Summary by severity
            logContent += 'VIOLATIONS BY SEVERITY:\n';
            logContent += '-'.repeat(50) + '\n';
            Object.keys(stats.violationsBySeverity).forEach(severity => {
                const count = stats.violationsBySeverity[severity];
                const severityInfo = SecurityPatterns.SEVERITY_LEVELS[severity];
                logContent += `${severity.padEnd(10)}: ${count.toString().padStart(3)} - ${severityInfo.description}\n`;
            });
            logContent += '\n';

            // Summary by category
            logContent += 'VIOLATIONS BY CATEGORY:\n';
            logContent += '-'.repeat(50) + '\n';
            Object.keys(stats.violationsByCategory).forEach(category => {
                const count = stats.violationsByCategory[category];
                if (count > 0) {
                    const categoryInfo = SecurityPatterns.VIOLATION_CATEGORIES[category];
                    logContent += `${category.padEnd(20)}: ${count.toString().padStart(3)} - ${categoryInfo?.name || 'Unknown category'}\n`;
                }
            });
            logContent += '\n';

            // Detailed violations
            if (this.engine && this.engine.violations.length > 0) {
                logContent += 'DETAILED VIOLATIONS:\n';
                logContent += '='.repeat(100) + '\n';

                this.engine.violations.forEach((violation, index) => {
                    logContent += `[${(index + 1).toString().padStart(3)}] ${violation.severity} VIOLATION\n`;
                    logContent += `     ID: ${violation.id}\n`;
                    logContent += `     Timestamp: ${violation.timestamp}\n`;
                    logContent += `     File: ${violation.file}\n`;
                    logContent += `     Line: ${violation.line}\n`;
                    logContent += `     Type: ${violation.type}\n`;
                    logContent += `     Category: ${violation.category}\n`;
                    logContent += `     Description: ${violation.description}\n`;
                    logContent += `     Code: ${violation.code}\n`;
                    logContent += `     Matches: ${violation.matches}\n`;
                    logContent += `     Recommendation: ${violation.recommendation}\n`;
                    logContent += '-'.repeat(80) + '\n';
                });
            }

            // System information
            logContent += '\nSYSTEM INFORMATION:\n';
            logContent += '-'.repeat(50) + '\n';
            logContent += `Node.js Version: ${process.version}\n`;
            logContent += `Platform: ${process.platform}\n`;
            logContent += `Architecture: ${process.arch}\n`;
            logContent += `Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`;
            logContent += `Scanner Version: 2.0.0\n`;
            logContent += '\n';

            // Policy compliance
            logContent += 'POLICY COMPLIANCE:\n';
            logContent += '-'.repeat(50) + '\n';
            if (stats.totalViolations === 0) {
                logContent += 'STATUS: COMPLIANT\n';
                logContent += 'RESULT: "No Mock, No Cache Policy" compliance verified!\n';
                logContent += 'ACTION: No action required - code is clean\n';
            } else {
                logContent += 'STATUS: NON-COMPLIANT\n';
                logContent += 'RESULT: "No Mock, No Cache Policy" violations found!\n';
                if (stats.violationsBySeverity.CRITICAL > 0) {
                    logContent += 'ACTION: CRITICAL - Remove all Mock/Cache implementations immediately!\n';
                } else if (stats.violationsBySeverity.HIGH > 0) {
                    logContent += 'ACTION: HIGH PRIORITY - Address high-severity violations\n';
                } else {
                    logContent += 'ACTION: REVIEW - Consider addressing medium/low violations\n';
                }
            }

            logContent += '\n';
            logContent += '='.repeat(100) + '\n';
            logContent += 'End of Detailed Security Scan Log\n';
            logContent += '='.repeat(100) + '\n';

            // เขียนไฟล์ log
            fs.writeFileSync(logFile, logContent, 'utf8');
            console.log(`\n Detailed log saved: ${logFile}`);

            return logFile;
        } catch (error) {
            console.error(`\n Warning: Could not create log file - ${error.message}`);
            return null;
        }
    }

    // Utility methods
    getSeverityEmoji(severity) {
        return SecurityPatterns.SEVERITY_LEVELS[severity]?.emoji || '';
    }

    getSeverityColor(severity) {
        return SecurityPatterns.SEVERITY_LEVELS[severity]?.color || '\x1b[0m';
    }

    getResetColor() {
        return '\x1b[0m';
    }
}

// ======================================================================
// CLI INTERFACE
// ======================================================================
async function main() {
    const args = process.argv.slice(2);

    console.log(' CHAHUADEV UNIVERSAL SECURITY SCANNER v2.0');
    console.log(' Enforcing "No Mock, No Cache Policy" - Zero Tolerance');
    console.log('');

    // ตรวจสอบ help ก่อน
    if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        showHelp();
        process.exit(args.length === 0 ? 1 : 0);
    }

    try {
        const config = parseArguments(args);
        const cli = new SecurityScannerCLI();

        // เก็บข้อมูล scan session
        cli.startTime = Date.now();
        cli.targetPath = config.target;
        cli.enableAIAnalysis = config.aiAnalysis;

        // Security validation of target path (สำหรับ security scanner เราจะเช็คแค่ระบบและไฟล์อันตราย)
        try {
            // ตรวจสอบว่าเป็น path ที่อันตรายหรือไม่ (ป้องกันระบบไดเรกทอรี่)
            const normalizedTarget = path.resolve(config.target);
            let isSystemPath = false;

            for (const forbiddenPattern of cli.securityManager.options.customForbiddenPaths.concat([
                // Windows system paths
                /^[A-Z]:\\Windows\\/i,
                /^[A-Z]:\\Program Files\\/i,
                /^[A-Z]:\\Program Files \(x86\)\\/i,
                /^[A-Z]:\\System Volume Information\\/i,
                // Linux/Unix system paths  
                /^\/etc\//,
                /^\/usr\/bin\//,
                /^\/usr\/sbin\//,
                /^\/bin\//,
                /^\/sbin\//,
                /^\/root\//,
                /^\/boot\//,
                /^\/proc\//,
                /^\/sys\//,
                /^\/dev\//
            ])) {
                if (forbiddenPattern.test(normalizedTarget)) {
                    isSystemPath = true;
                    break;
                }
            }

            if (isSystemPath) {
                if (cli.logger && typeof cli.logger.security === 'function') {
                    cli.logger.security('SYSTEM_PATH_BLOCKED', {
                        target: config.target,
                        resolvedPath: normalizedTarget
                    }, 'HIGH');
                }
                console.error(` Cannot scan system directory: ${normalizedTarget}`);
                process.exit(1);
            }

            // ตรวจสอบว่าไฟล์/โฟลเดอร์มีอยู่จริง
            if (!fs.existsSync(config.target)) {
                if (cli.logger && typeof cli.logger.error === 'function') {
                    cli.logger.error('TARGET_NOT_FOUND', `Target not found: ${config.target}`);
                }
                console.error(` Target not found: ${config.target}`);
                process.exit(1);
            }

            if (cli.logger && typeof cli.logger.security === 'function') {
                cli.logger.security('TARGET_VALIDATED', {
                    target: config.target,
                    resolvedPath: normalizedTarget,
                    isDirectory: fs.statSync(config.target).isDirectory()
                }, 'INFO');
            }

        } catch (error) {
            if (cli.logger && typeof cli.logger.error === 'function') {
                cli.logger.error('SECURITY_CHECK_ERROR',
                    `Failed to perform security check: ${config.target}`,
                    error
                );
            }
            console.error(` Security check failed: ${error.message}`);
            process.exit(1);
        }

        // สร้าง engine ด้วย configuration
        cli.createEngine(config.engineOptions);

        console.log(` Target: ${config.target}`);
        console.log(` Recursive: ${config.engineOptions.recursive}`);
        console.log(` Output Formats: ${config.outputs.join(', ')}`);
        console.log(` Strict Mode: ${config.strict}`);
        console.log(`  Min Severity: ${config.engineOptions.minSeverityLevel}`);
        console.log('');

        // สแกน
        let violations = [];
        if (fs.statSync(config.target).isDirectory()) {
            violations = await cli.engine.scanDirectory(config.target);
        } else {
            violations = await cli.engine.scanFile(config.target);
        }

        // สร้างรายงานพร้อมข้อมูล session
        const summary = cli.engine.generateSummaryReport();

        // เพิ่มข้อมูล session ลงใน summary
        if (summary && summary.summary) {
            summary.summary.startTime = cli.startTime;
            summary.summary.target = cli.targetPath;
        }

        // สร้างรายงานตามที่ต้องการ
        if (config.outputs.includes('json')) {
            await cli.generateJSONReport(config.jsonOutput);
        }

        if (config.outputs.includes('csv')) {
            await cli.generateCSVReport(config.csvOutput);
        }

        // ตรวจสอบ strict mode
        if (config.strict && !summary.summary.isCompliant) {
            console.log('\n STRICT MODE: Exiting with error due to violations!');
            process.exit(1);
        }

        console.log('\n Scan completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error(`\n Scanner Error: ${error.message}`);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// ======================================================================
// ARGUMENT PARSING
// ======================================================================
function parseArguments(args) {
    const config = {
        target: args[0],
        outputs: ['console'],
        strict: false,
        jsonOutput: null,
        csvOutput: null,
        aiAnalysis: true, // AI Analysis enabled by default
        engineOptions: {
            recursive: true,
            minSeverityLevel: 'LOW',
            ignorePatterns: [],
            exemptFiles: [],
            customMockPatterns: [],
            customCachePatterns: [],
            customPerformancePatterns: []
        }
    };

    for (let i = 1; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--no-recursive':
                config.engineOptions.recursive = false;
                break;

            case '--strict':
                config.strict = true;
                break;

            case '--report-json':
                config.outputs.push('json');
                if (args[i + 1] && !args[i + 1].startsWith('--')) {
                    config.jsonOutput = args[++i];
                }
                break;

            case '--report-csv':
                config.outputs.push('csv');
                if (args[i + 1] && !args[i + 1].startsWith('--')) {
                    config.csvOutput = args[++i];
                }
                break;

            case '--min-severity':
                if (args[i + 1]) {
                    const severity = args[++i].toUpperCase();
                    if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity)) {
                        config.engineOptions.minSeverityLevel = severity;
                    }
                }
                break;

            case '--ignore-pattern':
                if (args[i + 1]) {
                    config.engineOptions.ignorePatterns.push(new RegExp(args[++i], 'gi'));
                }
                break;

            case '--exempt-file':
                if (args[i + 1]) {
                    config.engineOptions.exemptFiles.push(new RegExp(args[++i]));
                }
                break;

            case '--no-ai':
                config.aiAnalysis = false;
                break;

            case '--ai-analysis':
                config.aiAnalysis = true;
                break;

            // Help จะถูกจัดการก่อนหน้านี้แล้ว
        }
    }

    return config;
}

// ======================================================================
// HELP FUNCTION
// ======================================================================
function showHelp() {
    console.log('Usage: node universal-security-scanner.js <file|directory> [options]');
    console.log('');
    console.log(' Universal Security Scanner v2.0');
    console.log('   Advanced Mock/Cache violation detection with configurable patterns');
    console.log('');
    console.log('Options:');
    console.log('  --no-recursive         Disable recursive directory scanning');
    console.log('  --strict              Exit with error code if violations found');
    console.log('  --report-json [file]  Generate JSON report (optional custom filename)');
    console.log('  --report-csv [file]   Generate CSV report (optional custom filename)');
    console.log('  --min-severity LEVEL  Minimum severity to report (CRITICAL|HIGH|MEDIUM|LOW)');
    console.log('  --ignore-pattern REGEX  Ignore patterns matching regex');
    console.log('  --exempt-file REGEX   Exempt files matching regex');
    console.log('  --ai-analysis         Enable AI file analysis (default: enabled)');
    console.log('  --no-ai               Disable AI file analysis for faster scanning');
    console.log('  --help, -h           Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node universal-security-scanner.js ./src');
    console.log('  node universal-security-scanner.js code-analyzer.js --strict');
    console.log('  node universal-security-scanner.js ./lib --report-json --min-severity HIGH');
    console.log('  node universal-security-scanner.js ./src --ignore-pattern "test.*mock" --exempt-file "__tests__"');
    console.log('');
    console.log(' Pattern Categories:');
    Object.keys(SecurityPatterns.VIOLATION_CATEGORIES).forEach(category => {
        const info = SecurityPatterns.VIOLATION_CATEGORIES[category];
        console.log(`  ${category}: ${info.name}`);
    });
}

// ======================================================================
// LEGACY SUPPORT (รองรับ API เดิมสำหรับ backward compatibility)
// ======================================================================
class AntiMockCacheScanner {
    constructor() {
        console.warn('  AntiMockCacheScanner is deprecated. Use UniversalSecurityEngine instead.');

        //  Legacy Support with Dependency Injection
        const rEngine = new ChahuadevREngine();
        const aiAnalyzer = new AIFileAnalyzer();
        const logger = new ProfessionalLogger('legacy-scanner');

        this.engine = new UniversalSecurityEngine(rEngine, aiAnalyzer, logger);
    }

    scanFile(filePath) {
        return this.engine.scanFile(filePath);
    }

    scanDirectory(dirPath, recursive = true) {
        return this.engine.scanDirectory(dirPath);
    }

    generateReport() {
        const report = this.engine.generateSummaryReport();
        return {
            scannedFiles: report.summary.scannedFiles,
            totalViolations: report.summary.totalViolations,
            criticalViolations: report.summary.severityBreakdown.CRITICAL,
            highViolations: report.summary.severityBreakdown.HIGH,
            mediumViolations: report.summary.severityBreakdown.MEDIUM,
            lowViolations: report.summary.severityBreakdown.LOW,
            violations: this.engine.violations,
            isCompliant: report.summary.isCompliant
        };
    }
}

// รันถ้าเรียกโดยตรง
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    SecurityScannerCLI,
    UniversalSecurityEngine,
    SecurityPatterns,
    AntiMockCacheScanner // Legacy support
};