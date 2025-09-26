#!/usr/bin/env node
// ======================================================================
// CHAHUADEV UNIVERSAL SECURITY SCANNER CLI v2.0
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @purpose CLI Interface สำหรับ Universal Security Engine
// ======================================================================

const fs = require('fs');
const path = require('path');
const { UniversalSecurityEngine, SecurityPatterns } = require('./universal-security-engine.js');

// ======================================================================
// CLI PRESENTATION LAYER
// ======================================================================
class SecurityScannerCLI {
    constructor() {
        this.engine = null;
        this.outputFormats = ['console', 'json', 'csv', 'html'];
        this.startTime = null;
        this.targetPath = null;
    }

    // สร้าง engine ด้วย configuration
    createEngine(options = {}) {
        this.engine = new UniversalSecurityEngine(options);

        // ดักฟัง events จาก engine
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
        });

        this.engine.on('fileStarted', (data) => {
            process.stdout.write(` ${data.filePath}...`);
        });

        this.engine.on('fileCompleted', (data) => {
            if (data.violations > 0) {
                console.log(`  ${data.violations} violations`);
            } else {
                console.log(`  clean`);
            }
        });

        this.engine.on('fileSkipped', (data) => {
            console.log(`  Skipped: ${data.filePath} (${data.reason})`);
        });

        // Violation events  
        this.engine.on('violation', (violation) => {
            this.reportViolation(violation);
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

    // สร้างรายงานสรุปบน console
    generateConsoleReport(stats) {
        // สร้าง log file ก่อนแสดงรายงาน
        this.generateLogFile(stats);

        console.log(' UNIVERSAL SECURITY SCANNER REPORT v2.0');
        console.log('='.repeat(80));
        console.log(` Files Scanned: ${stats.scannedFiles}`);
        console.log(` Total Violations: ${stats.totalViolations}`);
        console.log(`  Duration: ${stats.duration}ms`);
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
        cli.startTime = new Date().toISOString();
        cli.targetPath = config.target;

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
        this.engine = new UniversalSecurityEngine();
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