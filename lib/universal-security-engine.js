// ======================================================================
// CHAHUADEV UNIVERSAL SECURITY ENGINE v2.0
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @purpose Universal Security Scanner Engine แยก Logic จาก Configuration และ Presentation
// ======================================================================

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// โหลด Security Patterns Configuration
const SecurityPatterns = require('./security.patterns.js');

// ======================================================================
// UNIVERSAL SECURITY ENGINE CLASS
// ======================================================================
class UniversalSecurityEngine extends EventEmitter {
    constructor(options = {}) {
        super();

        // โหลด Patterns พื้นฐาน
        this.basePatterns = {
            MOCK_PATTERNS: SecurityPatterns.MOCK_PATTERNS,
            CACHE_PATTERNS: SecurityPatterns.CACHE_PATTERNS,
            PERFORMANCE_VIOLATIONS: SecurityPatterns.PERFORMANCE_VIOLATIONS
        };

        // รวม Patterns ที่ผู้ใช้ส่งเข้ามา
        this.patterns = {
            MOCK_PATTERNS: [
                ...this.basePatterns.MOCK_PATTERNS,
                ...(options.customMockPatterns || [])
            ],
            CACHE_PATTERNS: [
                ...this.basePatterns.CACHE_PATTERNS,
                ...(options.customCachePatterns || [])
            ],
            PERFORMANCE_VIOLATIONS: [
                ...this.basePatterns.PERFORMANCE_VIOLATIONS,
                ...(options.customPerformancePatterns || [])
            ]
        };

        // Configuration
        this.config = {
            // กฎที่ต้องการยกเว้น
            ignorePatterns: options.ignorePatterns || [],

            // ไฟล์ที่ได้รับการยกเว้น
            exemptFiles: options.exemptFiles || SecurityPatterns.DEFAULT_EXEMPTIONS,

            // Severity ต่ำสุดที่จะรายงาน
            minSeverityLevel: options.minSeverityLevel || 'LOW',

            // Categories ที่จะตรวจสอบ
            enabledCategories: options.enabledCategories || null, // null = ทั้งหมด

            // การตั้งค่าการสแกน
            scanConfig: {
                recursive: options.recursive !== false, // default true
                followSymlinks: options.followSymlinks || false,
                maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
                skipDirectories: options.skipDirectories || ['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode', '.idea'],
                allowedExtensions: options.allowedExtensions || ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte']
            }
        };

        // Statistics
        this.stats = {
            scannedFiles: 0,
            totalViolations: 0,
            violationsBySeverity: {
                CRITICAL: 0,
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0
            },
            violationsByCategory: {},
            startTime: null,
            endTime: null,
            duration: 0
        };

        // Initialize violation categories stats
        Object.keys(SecurityPatterns.VIOLATION_CATEGORIES).forEach(category => {
            this.stats.violationsByCategory[category] = 0;
        });

        this.violations = [];

        // Severity level mapping
        this.severityLevels = SecurityPatterns.SEVERITY_LEVELS;
        this.minSeverityNum = this.severityLevels[this.config.minSeverityLevel]?.level || 1;
    }

    // ======================================================================
    // CORE SCANNING METHODS
    // ======================================================================

    // สแกนไฟล์เดี่ยว
    scanFile(filePath) {
        return new Promise((resolve, reject) => {
            try {
                // ตรวจสอบการมีอยู่ของไฟล์
                if (!fs.existsSync(filePath)) {
                    const error = new Error(`File not found: ${filePath}`);
                    this.emit('error', { type: 'FILE_NOT_FOUND', error, filePath });
                    reject(error);
                    return;
                }

                // ตรวจสอบขนาดไฟล์
                const stats = fs.statSync(filePath);
                if (stats.size > this.config.scanConfig.maxFileSize) {
                    const warning = { type: 'FILE_TOO_LARGE', filePath, size: stats.size };
                    this.emit('warning', warning);
                    resolve([]);
                    return;
                }

                // ตรวจสอบว่าไฟล์ได้รับการยกเว้นหรือไม่
                if (this.isFileExempt(filePath)) {
                    this.emit('fileSkipped', { filePath, reason: 'EXEMPTED' });
                    resolve([]);
                    return;
                }

                // อ่านไฟล์
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');
                const fileViolations = [];

                this.emit('fileStarted', { filePath, lineCount: lines.length });

                // สแกนแต่ละบรรทัด
                lines.forEach((line, lineNumber) => {
                    const actualLineNumber = lineNumber + 1;

                    // ตรวจสอบ Mock violations
                    this.checkPatterns(this.patterns.MOCK_PATTERNS, line, filePath, actualLineNumber, fileViolations);

                    // ตรวจสอบ Cache violations  
                    this.checkPatterns(this.patterns.CACHE_PATTERNS, line, filePath, actualLineNumber, fileViolations);

                    // ตรวจสอบ Performance violations
                    this.checkPatterns(this.patterns.PERFORMANCE_VIOLATIONS, line, filePath, actualLineNumber, fileViolations);
                });

                this.stats.scannedFiles++;
                this.emit('fileCompleted', { filePath, violations: fileViolations.length });

                resolve(fileViolations);

            } catch (error) {
                this.emit('error', { type: 'SCAN_ERROR', error, filePath });
                reject(error);
            }
        });
    }

    // ตรวจสอบ patterns ในบรรทัด
    checkPatterns(patterns, line, filePath, lineNumber, violations) {
        patterns.forEach(patternObj => {
            try {
                // ตรวจสอบว่ากฎนี้ถูกยกเว้นหรือไม่
                if (this.isPatternIgnored(patternObj)) {
                    return;
                }

                // ตรวจสอบ severity level
                const patternSeverityLevel = this.severityLevels[patternObj.severity]?.level || 1;
                if (patternSeverityLevel < this.minSeverityNum) {
                    return;
                }

                // ตรวจสอบ category
                if (this.config.enabledCategories && !this.config.enabledCategories.includes(patternObj.category)) {
                    return;
                }

                // ตรวจสอบ pattern
                const matches = line.match(patternObj.pattern);
                if (matches) {
                    const violation = {
                        id: this.generateViolationId(),
                        timestamp: new Date().toISOString(),
                        file: filePath,
                        line: lineNumber,
                        code: line.trim(),
                        type: patternObj.type,
                        severity: patternObj.severity,
                        category: patternObj.category,
                        description: patternObj.description,
                        recommendation: patternObj.recommendation || 'ไม่มีคำแนะนำ',
                        pattern: patternObj.pattern.source,
                        matches: matches,
                        context: {
                            linesBefore: [], // TODO: เพิ่ม context lines
                            linesAfter: []   // TODO: เพิ่ม context lines
                        }
                    };

                    violations.push(violation);
                    this.violations.push(violation);
                    this.stats.totalViolations++;

                    // อัปเดต statistics
                    this.stats.violationsBySeverity[patternObj.severity]++;
                    this.stats.violationsByCategory[patternObj.category] =
                        (this.stats.violationsByCategory[patternObj.category] || 0) + 1;

                    // ส่ง event
                    this.emit('violation', violation);
                }
            } catch (error) {
                this.emit('error', {
                    type: 'PATTERN_CHECK_ERROR',
                    error,
                    pattern: patternObj,
                    filePath,
                    lineNumber
                });
            }
        });
    }

    // สแกนไดเรกทอรี่ทั้งหมด
    async scanDirectory(dirPath) {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(dirPath)) {
                    const error = new Error(`Directory not found: ${dirPath}`);
                    this.emit('error', { type: 'DIRECTORY_NOT_FOUND', error, dirPath });
                    reject(error);
                    return;
                }

                this.emit('scanStarted', { target: dirPath, config: this.config });
                this.stats.startTime = Date.now();

                this._scanDirectoryRecursive(dirPath)
                    .then(allViolations => {
                        this.stats.endTime = Date.now();
                        this.stats.duration = this.stats.endTime - this.stats.startTime;

                        this.emit('scanCompleted', {
                            target: dirPath,
                            violations: allViolations,
                            stats: this.stats
                        });

                        resolve(allViolations);
                    })
                    .catch(reject);

            } catch (error) {
                this.emit('error', { type: 'DIRECTORY_SCAN_ERROR', error, dirPath });
                reject(error);
            }
        });
    }

    // สแกนไดเรกทอรี่แบบ recursive
    async _scanDirectoryRecursive(dirPath) {
        const files = fs.readdirSync(dirPath);
        const allViolations = [];
        const scanPromises = [];

        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (this.config.scanConfig.recursive && !this.shouldSkipDirectory(file)) {
                    scanPromises.push(this._scanDirectoryRecursive(fullPath));
                }
            } else if (this.shouldScanFile(file)) {
                scanPromises.push(this.scanFile(fullPath));
            }
        }

        const results = await Promise.all(scanPromises);
        results.forEach(result => {
            if (Array.isArray(result)) {
                allViolations.push(...result);
            }
        });

        return allViolations;
    }

    // ======================================================================
    // UTILITY METHODS
    // ======================================================================

    // ตรวจสอบว่าควร skip directory หรือไม่
    shouldSkipDirectory(dirName) {
        return this.config.scanConfig.skipDirectories.includes(dirName);
    }

    // ตรวจสอบว่าควร scan file หรือไม่
    shouldScanFile(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        return this.config.scanConfig.allowedExtensions.includes(ext);
    }

    // ตรวจสอบว่าไฟล์ได้รับการยกเว้นหรือไม่
    isFileExempt(filePath) {
        return this.config.exemptFiles.some(exemptPattern => {
            if (typeof exemptPattern === 'string') {
                return filePath.includes(exemptPattern);
            } else if (exemptPattern instanceof RegExp) {
                return exemptPattern.test(filePath);
            }
            return false;
        });
    }

    // ตรวจสอบว่า pattern ถูกยกเว้นหรือไม่
    isPatternIgnored(patternObj) {
        return this.config.ignorePatterns.some(ignoreRegex => {
            if (typeof ignoreRegex === 'string') {
                return patternObj.type === ignoreRegex || patternObj.category === ignoreRegex;
            } else if (ignoreRegex instanceof RegExp) {
                return ignoreRegex.test(patternObj.pattern.source);
            }
            return false;
        });
    }

    // สร้าง violation ID
    generateViolationId() {
        return `VIO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ======================================================================
    // REPORTING METHODS
    // ======================================================================

    // สร้างรายงานสรุป
    generateSummaryReport() {
        return {
            metadata: {
                engineVersion: '2.0',
                scanTimestamp: new Date().toISOString(),
                duration: this.stats.duration,
                policy: {
                    name: "No Mock, No Cache Policy",
                    description: "การห้ามใช้ Mock, Cache, หรือการหลอกลวงใดๆ ในระบบ",
                    enforced: true,
                    version: "2.0"
                }
            },
            summary: {
                scannedFiles: this.stats.scannedFiles,
                totalViolations: this.stats.totalViolations,
                severityBreakdown: this.stats.violationsBySeverity,
                categoryBreakdown: this.stats.violationsByCategory,
                isCompliant: this.stats.totalViolations === 0,
                complianceScore: this.calculateComplianceScore()
            },
            configuration: {
                patternsUsed: {
                    mockPatterns: this.patterns.MOCK_PATTERNS.length,
                    cachePatterns: this.patterns.CACHE_PATTERNS.length,
                    performancePatterns: this.patterns.PERFORMANCE_VIOLATIONS.length
                },
                scanConfig: this.config.scanConfig,
                exemptions: {
                    ignorePatterns: this.config.ignorePatterns.length,
                    exemptFiles: this.config.exemptFiles.length
                }
            }
        };
    }

    // สร้างรายงานละเอียด
    generateDetailedReport() {
        const summary = this.generateSummaryReport();
        return {
            ...summary,
            violations: this.violations,
            recommendations: this.generateRecommendations()
        };
    }

    // คำนวณคะแนน compliance
    calculateComplianceScore() {
        if (this.stats.scannedFiles === 0) return 100;

        const totalPossibleViolations = this.stats.scannedFiles * 10; // สมมติ
        const violationPenalty = this.stats.totalViolations;
        const score = Math.max(0, 100 - (violationPenalty / totalPossibleViolations) * 100);

        return Math.round(score * 100) / 100;
    }

    // สร้างคำแนะนำ
    generateRecommendations() {
        const recommendations = [];

        // คำแนะนำตาม severity
        if (this.stats.violationsBySeverity.CRITICAL > 0) {
            recommendations.push({
                priority: 'URGENT',
                title: 'ลบ Critical Violations ทันที',
                description: `พบการละเมิดระดับ Critical ${this.stats.violationsBySeverity.CRITICAL} จุด ที่ต้องแก้ไขทันที`,
                actions: ['ลบหรือแทนที่การใช้ Mock/Cache ทั้งหมด', 'ใช้การประมวลผล real-time แทน']
            });
        }

        if (this.stats.violationsBySeverity.HIGH > 0) {
            recommendations.push({
                priority: 'HIGH',
                title: 'แก้ไข High Priority Violations',
                description: `พบการละเมิดระดับสูง ${this.stats.violationsBySeverity.HIGH} จุด ที่ควรแก้ไขโดยเร็ว`,
                actions: ['วางแผนแก้ไขภายใน 1 วัน', 'ประเมินผลกระทบต่อระบบ']
            });
        }

        // คำแนะนำตาม category
        Object.keys(this.stats.violationsByCategory).forEach(category => {
            const count = this.stats.violationsByCategory[category];
            if (count > 0) {
                const categoryInfo = SecurityPatterns.VIOLATION_CATEGORIES[category];
                if (categoryInfo) {
                    recommendations.push({
                        priority: 'MEDIUM',
                        title: `แก้ไขปัญหาหมวด ${categoryInfo.name}`,
                        description: `${categoryInfo.description} - พบ ${count} จุด`,
                        impact: categoryInfo.impact
                    });
                }
            }
        });

        return recommendations;
    }

    // ======================================================================
    // ADVANCED FEATURES
    // ======================================================================

    // เพิ่ม pattern แบบ dynamic
    addCustomPattern(type, pattern, options = {}) {
        const patternObj = {
            pattern: pattern,
            type: options.type || `CUSTOM_${type.toUpperCase()}`,
            severity: options.severity || 'MEDIUM',
            category: options.category || 'CUSTOM',
            description: options.description || 'Custom pattern violation',
            recommendation: options.recommendation || 'แก้ไขตามนโยบายองค์กร'
        };

        switch (type.toUpperCase()) {
            case 'MOCK':
                this.patterns.MOCK_PATTERNS.push(patternObj);
                break;
            case 'CACHE':
                this.patterns.CACHE_PATTERNS.push(patternObj);
                break;
            case 'PERFORMANCE':
                this.patterns.PERFORMANCE_VIOLATIONS.push(patternObj);
                break;
            default:
                throw new Error(`Unknown pattern type: ${type}`);
        }

        this.emit('patternAdded', { type, pattern: patternObj });
    }

    // ลบ pattern
    removePattern(type, patternType) {
        const patterns = this.patterns[type.toUpperCase() + '_PATTERNS'] ||
            this.patterns[type.toUpperCase() + '_VIOLATIONS'];

        if (!patterns) {
            throw new Error(`Unknown pattern type: ${type}`);
        }

        const index = patterns.findIndex(p => p.type === patternType);
        if (index !== -1) {
            const removed = patterns.splice(index, 1)[0];
            this.emit('patternRemoved', { type, pattern: removed });
            return removed;
        }

        return null;
    }

    // รีเซ็ต statistics
    resetStats() {
        this.stats = {
            scannedFiles: 0,
            totalViolations: 0,
            violationsBySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
            violationsByCategory: {},
            startTime: null,
            endTime: null,
            duration: 0
        };

        Object.keys(SecurityPatterns.VIOLATION_CATEGORIES).forEach(category => {
            this.stats.violationsByCategory[category] = 0;
        });

        this.violations = [];
        this.emit('statsReset');
    }

    // ======================================================================
    // EXPORT INTERFACE
    // ======================================================================

    // ได้รับ patterns ทั้งหมด
    getAllPatterns() {
        return {
            MOCK_PATTERNS: this.patterns.MOCK_PATTERNS,
            CACHE_PATTERNS: this.patterns.CACHE_PATTERNS,
            PERFORMANCE_VIOLATIONS: this.patterns.PERFORMANCE_VIOLATIONS
        };
    }

    // ได้รับ configuration
    getConfiguration() {
        return { ...this.config };
    }

    // ได้รับ statistics
    getStatistics() {
        return { ...this.stats };
    }
}

// ======================================================================
// EXPORT
// ======================================================================
module.exports = {
    UniversalSecurityEngine,
    SecurityPatterns
};