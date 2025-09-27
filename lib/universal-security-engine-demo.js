#!/usr/bin/env node
// ======================================================================
// CHAHUADEV UNIVERSAL SECURITY ENGINE DEMO v1.0
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// @license MIT
// @contact chahuadev@gmail.com
// ======================================================================


const { UniversalSecurityEngine } = require('./universal-security-engine.js');
const SecurityPatterns = require('./security.patterns.js');

console.log(' CHAHUADEV UNIVERSAL SECURITY ENGINE DEMO v2.0');
console.log('='.repeat(80));
console.log(' แสดงความสามารถของ Universal Security Engine');
console.log('');

// ======================================================================
// DEMO 1: BASIC USAGE - การใช้งานพื้นฐาน
// ======================================================================
async function demo1_BasicUsage() {
    console.log(' DEMO 1: การใช้งานพื้นฐาน');
    console.log('-'.repeat(50));

    // สร้าง engine ใหม่
    const engine = new UniversalSecurityEngine();

    // ดักฟัง events
    let violationCount = 0;
    engine.on('violation', (violation) => {
        violationCount++;
        console.log(`    Violation ${violationCount}: ${violation.type} (${violation.severity})`);
    });

    console.log(' สแกนไฟล์: lib/universal-security-engine.js (ตัวเอง)');
    await engine.scanFile('./lib/universal-security-engine.js');

    const summary = engine.generateSummaryReport();
    console.log(` ผลลัพธ์: พบ ${summary.summary.totalViolations} violations`);
    console.log(` Compliance Score: ${summary.summary.complianceScore}%`);
    console.log('');
}

// ======================================================================
// DEMO 2: CUSTOM CONFIGURATION - การปรับแต่ง Configuration
// ======================================================================
async function demo2_CustomConfiguration() {
    console.log(' DEMO 2: การปรับแต่ง Configuration');
    console.log('-'.repeat(50));

    // สร้าง engine ด้วย custom config
    const engine = new UniversalSecurityEngine({
        minSeverityLevel: 'HIGH',
        ignorePatterns: ['EMPTY_ARRAY_FALLBACK'],
        exemptFiles: [/test.*\.js$/],
        customMockPatterns: [
            {
                pattern: /customMock/gi,
                type: 'CUSTOM_MOCK',
                severity: 'CRITICAL',
                category: 'CUSTOM',
                description: 'Custom mock pattern detected',
                recommendation: 'Remove custom mock usage'
            }
        ]
    });

    console.log('  Configuration ที่ใช้:');
    console.log('   - Min Severity: HIGH');
    console.log('   - Ignore Patterns: EMPTY_ARRAY_FALLBACK');
    console.log('   - Custom Mock Patterns: 1 pattern');

    let violationCount = 0;
    engine.on('violation', (violation) => {
        violationCount++;
        console.log(`    ${violation.severity}: ${violation.type} - ${violation.description}`);
    });

    console.log('\n สแกนไฟล์: test-violations.js');
    await engine.scanFile('../test-violations.js');

    const summary = engine.generateSummaryReport();
    console.log(` ผลลัพธ์: พบ ${summary.summary.totalViolations} violations (HIGH+ เท่านั้น)`);
    console.log('');
}

// ======================================================================
// DEMO 3: DYNAMIC PATTERN MANAGEMENT - การจัดการ Pattern แบบ Dynamic
// ======================================================================
async function demo3_DynamicPatterns() {
    console.log(' DEMO 3: การจัดการ Pattern แบบ Dynamic');
    console.log('-'.repeat(50));

    const engine = new UniversalSecurityEngine();

    // เพิ่ม custom pattern
    console.log(' เพิ่ม Custom Pattern:');
    engine.addCustomPattern('MOCK', /customFakeData/gi, {
        type: 'CUSTOM_FAKE_DATA',
        severity: 'HIGH',
        category: 'CUSTOM_FAKE',
        description: 'Custom fake data pattern',
        recommendation: 'Use real data instead'
    });
    console.log('    เพิ่ม CUSTOM_FAKE_DATA pattern แล้ว');

    // แสดง patterns ทั้งหมด
    const allPatterns = engine.getAllPatterns();
    console.log(` จำนวน Patterns ทั้งหมด: ${allPatterns.MOCK_PATTERNS.length + allPatterns.CACHE_PATTERNS.length + allPatterns.PERFORMANCE_VIOLATIONS.length}`);

    // ลบ pattern
    console.log(' ลบ Pattern:');
    const removed = engine.removePattern('MOCK', 'CUSTOM_FAKE_DATA');
    if (removed) {
        console.log(`    ลบ ${removed.type} แล้ว`);
    }

    console.log('');
}

// ======================================================================
// DEMO 4: EVENT-DRIVEN ARCHITECTURE - สถาปัตยกรรมแบบ Event-Driven
// ======================================================================
async function demo4_EventDrivenArchitecture() {
    console.log(' DEMO 4: สถาปัตยกรรมแบบ Event-Driven');
    console.log('-'.repeat(50));

    const engine = new UniversalSecurityEngine();

    // Custom Event Handlers
    engine.on('scanStarted', (data) => {
        console.log(` เริ่มสแกน: ${data.target}`);
    });

    engine.on('fileStarted', (data) => {
        console.log(` กำลังสแกน: ${data.filePath}`);
    });

    engine.on('violation', (violation) => {
        // Custom violation handler - ส่ง notification, log to database, etc.
        console.log(` [${violation.id}] ${violation.severity}: ${violation.type}`);
        console.log(`    ${violation.file}:${violation.line}`);
        console.log(`    ${violation.recommendation}`);
    });

    engine.on('error', (errorData) => {
        console.log(` Error: ${errorData.error.message}`);
    });

    engine.on('scanCompleted', (data) => {
        console.log(` สแกนเสร็จสิ้น - ใช้เวลา ${data.stats.duration}ms`);
        console.log(` สรุป: ${data.stats.totalViolations} violations ใน ${data.stats.scannedFiles} ไฟล์`);
    });

    console.log(' Event Listeners ติดตั้งแล้ว - เริ่มสแกน...');
    await engine.scanFile('../test-violations.js');
    console.log('');
}

// ======================================================================
// DEMO 5: ADVANCED REPORTING - รายงานขั้นสูง
// ======================================================================
async function demo5_AdvancedReporting() {
    console.log(' DEMO 5: รายงานขั้นสูง');
    console.log('-'.repeat(50));

    const engine = new UniversalSecurityEngine();

    // สแกนไฟล์ทดสอบที่มีปัญหาจริง (AST Semantic Analysis)
    console.log(' สแกนไฟล์ทดสอบ test-violations.js ด้วย AST Semantic Analysis...');
    await engine.scanFile('test-violations.js');

    // สร้างรายงานขั้นสูง
    const detailedReport = engine.generateDetailedReport();

    console.log(' รายงานขั้นสูง:');
    console.log(`    Compliance Score: ${detailedReport.summary.complianceScore}%`);
    console.log(`     Duration: ${detailedReport.metadata.duration}ms`);
    console.log(`    Engine Version: ${detailedReport.metadata.engineVersion}`);

    console.log('\n Violations by Category:');
    Object.entries(detailedReport.summary.categoryBreakdown).forEach(([category, count]) => {
        if (count > 0) {
            const categoryInfo = SecurityPatterns.VIOLATION_CATEGORIES[category];
            console.log(`   ${category}: ${count} - ${categoryInfo?.name || 'Unknown'}`);
        }
    });

    console.log('\n Recommendations:');
    detailedReport.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority}] ${rec.title}`);
        console.log(`      ${rec.description}`);
    });

    console.log('');
}

// ======================================================================
// DEMO 6: PATTERN STATISTICS - สถิติของ Patterns
// ======================================================================
function demo6_PatternStatistics() {
    console.log(' DEMO 6: สถิติของ Patterns');
    console.log('-'.repeat(50));

    const stats = SecurityPatterns.getPatternStats();

    console.log(` Pattern Statistics:`);
    console.log(`    Total Patterns: ${stats.total}`);
    console.log('');

    console.log(' By Severity:');
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
        const emoji = SecurityPatterns.SEVERITY_LEVELS[severity]?.emoji || '';
        console.log(`   ${emoji} ${severity}: ${count} patterns`);
    });
    console.log('');

    console.log(' By Category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
        if (count > 0) {
            const categoryInfo = SecurityPatterns.VIOLATION_CATEGORIES[category];
            console.log(`    ${category}: ${count} patterns - ${categoryInfo?.name || 'Unknown'}`);
        }
    });
    console.log('');

    // แสดง Critical patterns
    const criticalPatterns = SecurityPatterns.getCriticalPatterns();
    console.log(` Critical Patterns (${criticalPatterns.length}):`);
    criticalPatterns.slice(0, 5).forEach((pattern, index) => {
        console.log(`   ${index + 1}. ${pattern.type} - ${pattern.description}`);
    });
    if (criticalPatterns.length > 5) {
        console.log(`   ... และอีก ${criticalPatterns.length - 5} patterns`);
    }
    console.log('');
}

// ======================================================================
// DEMO 7: PERFORMANCE COMPARISON - การเปรียบเทียบประสิทธิภาพ
// ======================================================================
async function demo7_PerformanceComparison() {
    console.log(' DEMO 7: การเปรียบเทียบประสิทธิภาพ');
    console.log('-'.repeat(50));

    // Engine แบบ Default
    console.log(' Engine แบบ Default:');
    const defaultEngine = new UniversalSecurityEngine();
    const start1 = Date.now();
    await defaultEngine.scanFile('code-analyzer.js');
    const duration1 = Date.now() - start1;
    const summary1 = defaultEngine.generateSummaryReport();
    console.log(`     เวลา: ${duration1}ms`);
    console.log(`    Violations: ${summary1.summary.totalViolations}`);

    // Engine แบบ High Severity Only
    console.log('\n Engine แบบ HIGH Severity เท่านั้น:');
    const highOnlyEngine = new UniversalSecurityEngine({ minSeverityLevel: 'HIGH' });
    const start2 = Date.now();
    await highOnlyEngine.scanFile('code-analyzer.js');
    const duration2 = Date.now() - start2;
    const summary2 = highOnlyEngine.generateSummaryReport();
    console.log(`     เวลา: ${duration2}ms`);
    console.log(`    Violations: ${summary2.summary.totalViolations}`);

    // Engine แบบ Critical Only
    console.log('\n Engine แบบ CRITICAL เท่านั้น:');
    const criticalOnlyEngine = new UniversalSecurityEngine({ minSeverityLevel: 'CRITICAL' });
    const start3 = Date.now();
    await criticalOnlyEngine.scanFile('code-analyzer.js');
    const duration3 = Date.now() - start3;
    const summary3 = criticalOnlyEngine.generateSummaryReport();
    console.log(`     เวลา: ${duration3}ms`);
    console.log(`    Violations: ${summary3.summary.totalViolations}`);

    console.log('\n Performance Summary:');
    console.log(`    Fastest: ${Math.min(duration1, duration2, duration3)}ms`);
    console.log(`    Slowest: ${Math.max(duration1, duration2, duration3)}ms`);
    console.log(`    Speed Improvement: ${((Math.max(duration1, duration2, duration3) - Math.min(duration1, duration2, duration3)) / Math.max(duration1, duration2, duration3) * 100).toFixed(1)}%`);
    console.log('');
}

// ======================================================================
// MAIN DEMO EXECUTION
// ======================================================================
async function runAllDemos() {
    try {
        await demo1_BasicUsage();
        await demo2_CustomConfiguration();
        await demo3_DynamicPatterns();
        await demo4_EventDrivenArchitecture();
        await demo5_AdvancedReporting();
        demo6_PatternStatistics();
        await demo7_PerformanceComparison();

        console.log(' ทุก Demo เสร็จสิ้นแล้ว!');
        console.log('='.repeat(80));
        console.log(' Universal Security Engine v2.0 พร้อมใช้งานแล้ว!');
        console.log(' ความสามารถหลัก:');
        console.log('    แยก Logic จาก Configuration และ Presentation');
        console.log('    Event-Driven Architecture');
        console.log('    Dynamic Pattern Management');
        console.log('    Advanced Reporting');
        console.log('    Configurable Security Policies');
        console.log('    Performance Optimizations');

    } catch (error) {
        console.error(' Demo Error:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
    }
}

// รันถ้าเรียกโดยตรง
if (require.main === module) {
    runAllDemos().catch(console.error);
}

module.exports = {
    demo1_BasicUsage,
    demo2_CustomConfiguration,
    demo3_DynamicPatterns,
    demo4_EventDrivenArchitecture,
    demo5_AdvancedReporting,
    demo6_PatternStatistics,
    demo7_PerformanceComparison,
    runAllDemos
};