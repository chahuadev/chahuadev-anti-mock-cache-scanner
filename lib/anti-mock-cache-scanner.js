#!/usr/bin/env node
// ======================================================================
// CHAHUADEV LEGACY ANTI-MOCK ANTI-CACHE SCANNER v1.0 (DEPRECATED)
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @purpose Legacy wrapper - redirects to Universal Security Scanner v2.0
// @deprecated ใช้ universal-security-scanner.js แทน
// ======================================================================

console.log('  WARNING: anti-mock-cache-scanner.js is DEPRECATED!');
console.log(' กรุณาใช้: node universal-security-scanner.js แทน');
console.log(' กำลัง redirect ไปยัง Universal Security Scanner v2.0...');
console.log('');

// ======================================================================
// REDIRECT TO UNIVERSAL SECURITY SCANNER
// ======================================================================
const { spawn } = require('child_process');
const path = require('path');

// สร้าง command สำหรับเรียก Universal Security Scanner
const universalScannerPath = path.join(__dirname, 'universal-security-scanner.js');
const args = process.argv.slice(2); // ส่ง arguments ต่อ

console.log(` Running: node ${universalScannerPath} ${args.join(' ')}`);
console.log('='.repeat(80));

// เรียก Universal Security Scanner
const child = spawn('node', [universalScannerPath, ...args], {
    stdio: 'inherit',
    cwd: __dirname
});

child.on('close', (code) => {
    console.log('='.repeat(80));
    console.log(' TIP: ใช้ universal-security-scanner.js โดยตรงเพื่อประสิทธิภาพที่ดีกว่า');
    process.exit(code);
});

child.on('error', (error) => {
    console.error(' Error running Universal Security Scanner:', error.message);
    console.log('');
    console.log(' แนะนำให้เรียกโดยตรง:');
    console.log(`   node universal-security-scanner.js ${args.join(' ')}`);
    process.exit(1);
});

// ======================================================================
// LEGACY EXPORT (for backward compatibility)
// ======================================================================
if (require.main !== module) {
    // ถ้าถูกเรียกแบบ require() ให้ส่งคืน legacy interface
    module.exports = {
        // Legacy class wrapper
        AntiMockCacheScanner: class AntiMockCacheScanner {
            constructor() {
                console.warn('  AntiMockCacheScanner is deprecated. Use UniversalSecurityEngine instead.');

                // โหลด Universal Security Engine
                const { UniversalSecurityEngine } = require('../chahuadev-code-analyzer/lib/universal-security-engine.js');
                this.engine = new UniversalSecurityEngine();

                // Map legacy properties
                this.violations = [];
                this.scannedFiles = 0;
                this.totalViolations = 0;
                this.criticalViolations = 0;
                this.highViolations = 0;
                this.mediumViolations = 0;
                this.lowViolations = 0;

                // Listen to engine events to update legacy properties
                this.engine.on('violation', (violation) => {
                    this.violations.push(violation);
                    this.totalViolations++;

                    switch (violation.severity) {
                        case 'CRITICAL': this.criticalViolations++; break;
                        case 'HIGH': this.highViolations++; break;
                        case 'MEDIUM': this.mediumViolations++; break;
                        case 'LOW': this.lowViolations++; break;
                    }
                });

                this.engine.on('fileCompleted', () => {
                    this.scannedFiles++;
                });
            }

            async scanFile(filePath) {
                console.warn('  Using legacy scanFile. Consider upgrading to UniversalSecurityEngine.');
                return await this.engine.scanFile(filePath);
            }

            async scanDirectory(dirPath, recursive = true) {
                console.warn('  Using legacy scanDirectory. Consider upgrading to UniversalSecurityEngine.');
                this.engine.config.scanConfig.recursive = recursive;
                return await this.engine.scanDirectory(dirPath);
            }

            generateReport() {
                console.warn('  Using legacy generateReport. Consider upgrading to UniversalSecurityEngine.');
                const modernReport = this.engine.generateSummaryReport();

                // Convert to legacy format
                return {
                    scannedFiles: this.scannedFiles,
                    totalViolations: this.totalViolations,
                    criticalViolations: this.criticalViolations,
                    highViolations: this.highViolations,
                    mediumViolations: this.mediumViolations,
                    lowViolations: this.lowViolations,
                    violations: this.violations,
                    isCompliant: modernReport.summary.isCompliant
                };
            }

            generateDetailedReport() {
                console.warn('  Using legacy generateDetailedReport. Consider upgrading to UniversalSecurityEngine.');
                return this.engine.generateDetailedReport();
            }
        },

        // Re-export modern components for migration
        UniversalSecurityEngine: require('../chahuadev-code-analyzer/lib/universal-security-engine.js').UniversalSecurityEngine,
        SecurityPatterns: require('../chahuadev-code-analyzer/lib/security.patterns.js'),

        // Legacy patterns (deprecated)
        VIOLATION_PATTERNS: {
            MOCK_PATTERNS: require('../chahuadev-code-analyzer/lib/security.patterns.js').MOCK_PATTERNS,
            CACHE_PATTERNS: require('../chahuadev-code-analyzer/lib/security.patterns.js').CACHE_PATTERNS,
            PERFORMANCE_VIOLATIONS: require('../chahuadev-code-analyzer/lib/security.patterns.js').PERFORMANCE_VIOLATIONS
        }
    };
}