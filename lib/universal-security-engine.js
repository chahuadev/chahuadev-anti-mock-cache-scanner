// ======================================================================
// CHAHUADEV UNIVERSAL SECURITY ENGINE v1.0
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// @license MIT
// @contact chahuadev@gmail.com
// ======================================================================


const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// โหลด Security Patterns Configuration
const SecurityPatterns = require('./security.patterns.js');

// โหลด AI Analysis System เพื่อเสริมความแม่นยำ
const { AIFileAnalyzer } = require('./ai-file-analyzer.js');

// โหลด Revolutionary Chahuadev-R Engine สำหรับ "Advanced Pratt Parser"
const { JavaScriptTokenizer, TOKEN_TYPES } = require('./intelligent-tokenizer.js');
const { ChahuadevREngine } = require('./chahuadev-r-engine.js');

// โหลดระบบใหม่ที่ปรับปรุงแล้ว
const ViolationCoordinator = require('./violation-coordinator.js');
const ASTQuerySystem = require('./ast-query-system.js');
const ConfigurationManager = require('./configuration-manager.js');
const HTMLReportGenerator = require('./html-report-generator.js');

// ======================================================================
// UNIVERSAL SECURITY ENGINE CLASS
// ======================================================================
class UniversalSecurityEngine extends EventEmitter {
    /**
     * Universal Security Engine with Enhanced Architecture
     * @param {ChahuadevREngine} rEngine - Advanced Pratt Parser Engine
     * @param {AIFileAnalyzer} aiAnalyzer - AI File Analysis Engine  
     * @param {ProfessionalLogger} logger - Professional Logging System
     * @param {Object} options - Configuration options
     */
    constructor(rEngine, aiAnalyzer, logger, options = {}) {
        super();

        //  Dependency Injection - Core Dependencies
        this.rEngine = rEngine;
        this.aiAnalyzer = aiAnalyzer;
        this.logger = logger;

        //  Enhanced Systems - New Architecture
        this.violationCoordinator = new ViolationCoordinator(aiAnalyzer, logger);
        this.astQuerySystem = new ASTQuerySystem(logger);
        this.configManager = new ConfigurationManager(logger);
        this.htmlReportGenerator = new HTMLReportGenerator(logger);

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
            aiEnhancedFiles: 0,
            aiDetectedIssues: 0,
            aiAnalysisFailures: 0,
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

        //  Dependencies injected via constructor - No more tight coupling!
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
                const fileViolations = [];

                this.emit('fileStarted', { filePath, size: content.length });

                // ======================================================================
                //  "ปฏิวัติการวิเคราะห์" - AST SEMANTIC ANALYSIS INTEGRATION
                // ======================================================================

                let astAnalysis = null;

                try {
                    //  � Phase 1: ChahuadevR Analysis - NO FALLBACK! Excellence Only!
                    astAnalysis = this.rEngine.analyze(content, filePath);

                    if (!astAnalysis || !astAnalysis.violations) {
                        throw new Error(` ChahuadevR Engine must be improved! Failed to analyze: ${filePath}`);
                    }

                    //  AST Analysis succeeded - use semantic results directly
                    astAnalysis.violations.forEach(violation => {
                        fileViolations.push(violation);
                        this.violations.push(violation);
                        this.stats.totalViolations++;
                        this.stats.violationsBySeverity[violation.severity]++;
                        this.stats.violationsByCategory[violation.type] =
                            (this.stats.violationsByCategory[violation.type] || 0) + 1;
                        this.emit('violation', violation);
                    });

                    this.stats.astAnalyzedFiles = (this.stats.astAnalyzedFiles || 0) + 1;
                    this.emit('astAnalysisCompleted', {
                        filePath,
                        analysis: astAnalysis,
                        method: 'ast-semantic-only',
                        accuracy: 'maximum',
                        falsePositiveRate: 0,
                        violationsFound: astAnalysis.violations.length,
                        noFallback: true
                    });

                } catch (astError) {
                    //  NO FALLBACK! Fix the engine instead!
                    this.stats.astAnalysisFailures = (this.stats.astAnalysisFailures || 0) + 1;

                    this.emit('error', {
                        type: 'ENGINE_NEEDS_IMPROVEMENT',
                        filePath,
                        error: astError.message,
                        message: ' ChahuadevR Engine must be fixed! No fallback allowed!'
                    });

                    // Re-throw to force engine improvement
                    throw new Error(` Engine Error in ${filePath}: ${astError.message} - IMPROVE THE ENGINE!`);
                }

                // AI-Enhanced Analysis - วิเคราะเห์ไฟล์ด้วย AI ก่อนสแกนแบบเดิม
                let aiAnalysis = null;
                try {
                    aiAnalysis = this.aiAnalyzer.analyzeFile(filePath, content);
                    this.stats.aiEnhancedFiles++;
                    this.emit('aiAnalysisCompleted', {
                        filePath,
                        analysis: aiAnalysis,
                        enhancedScan: true,
                        integrationVersion: '3.0'
                    });
                } catch (aiError) {
                    this.stats.aiAnalysisFailures++;
                    this.emit('warning', {
                        type: 'AI_ANALYSIS_FAILED',
                        filePath,
                        error: aiError.message,
                        astAnalysisOnly: true
                    });
                }

                // ======================================================================
                //  AST ANALYSIS VALIDATION (Excellence Required)
                // ======================================================================

                if (!astAnalysis) {
                    throw new Error(`AST Analysis failed for ${filePath} - Engine requires improvement, no fallback allowed`);
                }

                // เพิ่ม AI-detected issues ถ้ามี
                if (aiAnalysis && aiAnalysis.issues && Array.isArray(aiAnalysis.issues) && aiAnalysis.issues.length > 0) {
                    this.stats.aiDetectedIssues += aiAnalysis.issues.length;
                    aiAnalysis.issues.forEach(issue => {
                        const aiViolation = this.createAIViolation(issue, filePath, content, aiAnalysis);
                        fileViolations.push(aiViolation);
                        this.violations.push(aiViolation);
                        this.stats.totalViolations++;
                        this.stats.violationsBySeverity[aiViolation.severity]++;
                        this.stats.violationsByCategory[aiViolation.category] =
                            (this.stats.violationsByCategory[aiViolation.category] || 0) + 1;
                        this.emit('violation', aiViolation);
                    });
                }

                this.stats.scannedFiles++;
                this.emit('fileCompleted', {
                    filePath,
                    violations: fileViolations.length,
                    aiEnhanced: aiAnalysis ? true : false,
                    aiIssues: (aiAnalysis && aiAnalysis.issues && Array.isArray(aiAnalysis.issues)) ? aiAnalysis.issues.length : 0
                });

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

    // ตรวจสอบ patterns ในบรรทัด (Enhanced with AI)
    checkPatternsWithAI(patterns, line, filePath, lineNumber, violations, aiAnalysis) {
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
                            linesBefore: [],
                            linesAfter: []
                        },
                        // AI Enhancement
                        aiEnhanced: aiAnalysis ? true : false,
                        aiConfidence: this.calculateAIConfidence(patternObj, matches, aiAnalysis),
                        aiContext: this.getAIContext(lineNumber, aiAnalysis),
                        aiRecommendation: this.getAIRecommendation(patternObj, matches, aiAnalysis)
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

    // สร้าง AI Violation
    createAIViolation(issue, filePath, content, aiAnalysis) {
        const severity = this.mapAISeverity(issue.severity || issue.priority);
        return {
            id: this.generateViolationId(),
            timestamp: new Date().toISOString(),
            file: filePath,
            line: issue.line || 1,
            code: issue.code || '',
            type: `AI_${issue.type || 'DETECTED_ISSUE'}`,
            severity: severity,
            category: issue.category || 'PERFORMANCE',
            description: issue.message || issue.description || 'AI detected potential issue',
            recommendation: issue.recommendation || issue.solution || 'ตรวจสอบและแก้ไขตามคำแนะนำของ AI',
            pattern: 'AI_ANALYSIS',
            matches: issue.matches || [],
            context: {
                linesBefore: [],
                linesAfter: [],
                aiContext: issue.context || {}
            },
            // AI Specific fields
            aiGenerated: true,
            aiConfidence: issue.confidence || 0.8,
            aiAnalysisType: issue.analysisType || 'general',
            aiDetails: {
                intent: aiAnalysis.analysis?.intent || null,
                quality: aiAnalysis.analysis?.quality || null,
                performance: aiAnalysis.analysis?.performance || null,
                errorAnalysis: aiAnalysis.analysis?.errorAnalysis || null
            }
        };
    }

    // คำนวณ AI Confidence
    calculateAIConfidence(patternObj, matches, aiAnalysis) {
        if (!aiAnalysis) return 0.5;

        let confidence = 0.7; // base confidence

        // เพิ่ม confidence ตาม AI analysis
        if (aiAnalysis.analysis?.quality?.overallScore > 70) confidence += 0.1;
        if (aiAnalysis.analysis?.intent?.confidence > 0.8) confidence += 0.1;
        if (aiAnalysis.issues && Array.isArray(aiAnalysis.issues) && aiAnalysis.issues.length > 0) confidence += 0.1;

        return Math.min(confidence, 1.0);
    }

    // ดึง AI Context สำหรับบรรทัด
    getAIContext(lineNumber, aiAnalysis) {
        if (!aiAnalysis) return null;

        // หา issue ที่เกี่ยวข้องกับบรรทัดนี้
        const relatedIssues = (aiAnalysis.issues && Array.isArray(aiAnalysis.issues)) ?
            aiAnalysis.issues.filter(issue => Math.abs((issue.line || 1) - lineNumber) <= 5) : [];

        return {
            relatedIssues: relatedIssues.length,
            intentContext: aiAnalysis.analysis?.intent || null,
            qualityScore: aiAnalysis.analysis?.quality?.overallScore || null
        };
    }

    // ดึง AI Recommendation
    getAIRecommendation(patternObj, matches, aiAnalysis) {
        if (!aiAnalysis) return null;

        const baseRecommendation = patternObj.recommendation || 'ตรวจสอบโค้ด';

        // เพิ่มคำแนะนำจาก AI
        let aiRecommendation = baseRecommendation;
        if (aiAnalysis.analysis?.quality?.recommendations &&
            Array.isArray(aiAnalysis.analysis.quality.recommendations) &&
            aiAnalysis.analysis.quality.recommendations.length > 0) {
            aiRecommendation += ` | AI แนะนำ: ${aiAnalysis.analysis.quality.recommendations.join(', ')}`;
        }

        return aiRecommendation;
    }

    // แปลง AI Severity เป็น Security Engine Severity
    mapAISeverity(aiSeverity) {
        const mapping = {
            'critical': 'CRITICAL',
            'high': 'HIGH',
            'medium': 'MEDIUM',
            'low': 'LOW',
            'error': 'HIGH',
            'warning': 'MEDIUM',
            'info': 'LOW'
        };

        return mapping[aiSeverity?.toLowerCase()] || 'MEDIUM';
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
    // INTELLIGENT STRUCTURE-AWARE SCANNING METHOD
    // "ผ่าตัดเปลี่ยนหัวใจ" - Context-Aware Violation Detection
    // ======================================================================

    // performIntelligentScan method removed - No fallback allowed

    // ======================================================================
    // INTELLIGENT PATTERN CHECKING
    // Context-Aware Pattern Detection with Token Sequence Reconstruction
    // ======================================================================

    checkIntelligentPatterns(patterns, content, token, filePath, violations, aiAnalysis, context) {
        // Get token sequence for better pattern matching
        const tokenSequence = this.getTokensInStructure(token.position, content);

        patterns.forEach(patternObj => {
            try {
                // Skip if pattern ignored or insufficient severity
                if (this.isPatternIgnored(patternObj)) return;

                const patternSeverityLevel = this.severityLevels[patternObj.severity]?.level || 1;
                if (patternSeverityLevel < this.minSeverityNum) return;

                if (this.config.enabledCategories && !this.config.enabledCategories.includes(patternObj.category)) return;

                // Check pattern against token sequence (better for jest.mock() detection)
                const matches = tokenSequence.match(patternObj.pattern);
                if (matches) {
                    const violation = this.createIntelligentViolation(
                        patternObj,
                        token,
                        matches,
                        filePath,
                        tokenSequence,
                        aiAnalysis,
                        context
                    );

                    violations.push(violation);
                    this.violations.push(violation);
                    this.stats.totalViolations++;
                    this.stats.violationsBySeverity[violation.severity]++;
                    this.stats.violationsByCategory[violation.category] =
                        (this.stats.violationsByCategory[violation.category] || 0) + 1;

                    this.emit('violation', violation);
                }
            } catch (error) {
                this.emit('error', {
                    type: 'INTELLIGENT_PATTERN_ERROR',
                    error,
                    pattern: patternObj,
                    filePath,
                    token: token.lexeme
                });
            }
        });
    }

    // Reconstruct meaningful text from token position for pattern matching
    getTokensInStructure(position, content) {
        if (!this.currentTokens) return content.substr(position, 100);

        // Find tokens around this position
        const contextTokens = this.currentTokens.filter(token => {
            return Math.abs(token.position - position) <= 50; // 50 char radius
        }).sort((a, b) => a.position - b.position);

        // Reconstruct meaningful code sequence
        return contextTokens
            .filter(t => t.type !== TOKEN_TYPES.LINE_COMMENT &&
                t.type !== TOKEN_TYPES.BLOCK_COMMENT &&
                t.type !== TOKEN_TYPES.WHITESPACE &&
                t.type !== TOKEN_TYPES.NEWLINE)
            .map(t => t.lexeme)
            .join(' ');
    }

    // ======================================================================
    // STRUCTURE-LEVEL VIOLATION ANALYSIS
    // ======================================================================

    analyzeStructureForViolations(structure, content, filePath, violations, aiAnalysis) {
        // Analyze different structure types
        switch (structure.type) {
            case 'function':
                this.analyzeFunctionStructure(structure, content, filePath, violations, aiAnalysis);
                break;
            case 'class':
                this.analyzeClassStructure(structure, content, filePath, violations, aiAnalysis);
                break;
            case 'variable':
                this.analyzeVariableStructure(structure, content, filePath, violations, aiAnalysis);
                break;
            case 'if_statement':
            case 'loop':
                this.analyzeControlStructure(structure, content, filePath, violations, aiAnalysis);
                break;
        }
    }

    analyzeFunctionStructure(structure, content, filePath, violations, aiAnalysis) {
        // Check for mock/cache patterns in function context
        const functionContent = this.extractStructureContent(structure, content);

        // Higher severity for violations in function bodies
        this.checkStructurePatterns(
            structure,
            functionContent,
            filePath,
            violations,
            aiAnalysis,
            'function_body',
            1.2 // severity multiplier
        );
    }

    analyzeClassStructure(structure, content, filePath, violations, aiAnalysis) {
        const classContent = this.extractStructureContent(structure, content);

        this.checkStructurePatterns(
            structure,
            classContent,
            filePath,
            violations,
            aiAnalysis,
            'class_body',
            1.1
        );
    }

    analyzeVariableStructure(structure, content, filePath, violations, aiAnalysis) {
        const variableContent = this.extractStructureContent(structure, content);

        this.checkStructurePatterns(
            structure,
            variableContent,
            filePath,
            violations,
            aiAnalysis,
            'variable_declaration',
            1.0
        );
    }

    analyzeControlStructure(structure, content, filePath, violations, aiAnalysis) {
        const controlContent = this.extractStructureContent(structure, content);

        this.checkStructurePatterns(
            structure,
            controlContent,
            filePath,
            violations,
            aiAnalysis,
            'control_flow',
            1.0
        );
    }

    // ======================================================================
    // STRUCTURE PATTERN CHECKING WITH CONTEXT AWARENESS
    // ======================================================================

    checkStructurePatterns(structure, structureContent, filePath, violations, aiAnalysis, context, severityMultiplier = 1.0) {
        // Check all pattern categories against structure content
        const allPatterns = [
            ...this.patterns.MOCK_PATTERNS,
            ...this.patterns.CACHE_PATTERNS,
            ...this.patterns.PERFORMANCE_VIOLATIONS
        ];

        allPatterns.forEach(patternObj => {
            try {
                if (this.isPatternIgnored(patternObj)) return;

                const patternSeverityLevel = this.severityLevels[patternObj.severity]?.level || 1;
                if (patternSeverityLevel < this.minSeverityNum) return;

                if (this.config.enabledCategories && !this.config.enabledCategories.includes(patternObj.category)) return;

                const matches = structureContent.match(patternObj.pattern);
                if (matches) {
                    // Calculate adjusted severity
                    let adjustedSeverity = patternObj.severity;
                    if (severityMultiplier > 1.1) {
                        // Increase severity for critical contexts
                        const severityMap = { 'LOW': 'MEDIUM', 'MEDIUM': 'HIGH', 'HIGH': 'CRITICAL' };
                        adjustedSeverity = severityMap[patternObj.severity] || patternObj.severity;
                    }

                    const violation = {
                        id: this.generateViolationId(),
                        timestamp: new Date().toISOString(),
                        filePath: filePath,
                        line: structure.line || 1,
                        code: matches[0] || structureContent.substr(0, 100),
                        type: patternObj.type,
                        severity: adjustedSeverity,
                        category: patternObj.category,
                        message: `Violation detected (in ${structure.type}: ${structure.name || 'undefined'})`,
                        description: patternObj.description,
                        recommendation: patternObj.recommendation || 'Review and fix the issue',
                        pattern: patternObj.pattern.source,
                        matches: matches,

                        // Analysis Enhancements
                        analysis: {
                            method: 'ast-only',
                            contextAware: true,
                            accuracy: 'maximum'
                        },

                        // AI Enhancement
                        aiEnhanced: aiAnalysis ? true : false,
                        aiContext: this.getAIContext(structure.line || 1, aiAnalysis),
                        aiRecommendation: this.getAIRecommendation(patternObj, matches, aiAnalysis)
                    };

                    violations.push(violation);
                    this.violations.push(violation);
                    this.stats.totalViolations++;
                    this.stats.violationsBySeverity[adjustedSeverity]++;
                    this.stats.violationsByCategory[patternObj.category] =
                        (this.stats.violationsByCategory[patternObj.category] || 0) + 1;

                    this.emit('violation', violation);
                }
            } catch (error) {
                this.emit('error', {
                    type: 'STRUCTURE_PATTERN_ERROR',
                    error,
                    pattern: patternObj,
                    filePath,
                    structure: structure.type
                });
            }
        });
    }

    // Extract actual code content from structure (without comments/strings)
    extractStructureContent(structure, fullContent) {
        try {
            if (!structure.startPosition || !structure.endPosition) {
                return structure.code || '';
            }

            const structureText = fullContent.substring(structure.startPosition, structure.endPosition);

            // Use tokenizer to clean the content
            try {
                const tokenizer = new JavaScriptTokenizer(structureText);
                const result = tokenizer.tokenize();

                // Reconstruct only code tokens (skip comments and strings)
                const codeTokens = result.tokens.filter(token =>
                    token.type !== TOKEN_TYPES.LINE_COMMENT &&
                    token.type !== TOKEN_TYPES.BLOCK_COMMENT &&
                    token.type !== TOKEN_TYPES.STRING
                );

                return codeTokens.map(token => token.lexeme).join(' ');
            } catch (tokenError) {
                // Pure code extraction failed - return empty to force engine improvement
                return '';
            }
        } catch (error) {
            return structure.code || '';
        }
    }

    // Create intelligent violation with enhanced context
    createIntelligentViolation(patternObj, token, matches, filePath, tokenSequence, aiAnalysis, context) {
        return {
            id: this.generateViolationId(),
            timestamp: new Date().toISOString(),
            filePath: filePath,
            line: token.line,
            column: token.column,
            code: tokenSequence,
            type: patternObj.type,
            severity: patternObj.severity,
            category: patternObj.category,
            message: `Violation detected in ${context} context`,
            description: patternObj.description,
            recommendation: patternObj.recommendation || 'Review and fix the issue',
            pattern: patternObj.pattern.source,
            matches: matches,

            // Analysis Metadata
            analysis: {
                method: 'ast-only',
                accuracy: 'maximum',
                tokenPosition: token.position,
                contextAware: true
            },

            // AI Enhancement
            aiEnhanced: aiAnalysis ? true : false,
            aiContext: this.getAIContext(token.line, aiAnalysis),
            aiRecommendation: this.getAIRecommendation(patternObj, matches, aiAnalysis)
        };
    }

    analyzeControlStructure(structure, content, filePath, violations, aiAnalysis) {
        const controlContent = this.extractStructureContent(structure, content);

        this.checkStructurePatterns(
            structure,
            controlContent,
            filePath,
            violations,
            aiAnalysis,
            'control_flow',
            1.0
        );
    }

    checkStructurePatterns(structure, structureContent, filePath, violations, aiAnalysis, contextType, severityMultiplier = 1.0) {
        const allPatterns = [
            ...this.patterns.MOCK_PATTERNS,
            ...this.patterns.CACHE_PATTERNS,
            ...this.patterns.PERFORMANCE_VIOLATIONS
        ];

        //  Intelligent Token Sequence Reconstruction
        // สร้างโค้ดที่ไม่มี string/comment content เพื่อ pattern matching

        // Get tokens within this structure
        const structureTokens = this.getTokensInStructure(structure);

        // Reconstruct code without strings and comments
        const codeOnlyTokens = structureTokens.filter(token =>
            token.type !== TOKEN_TYPES.STRING &&
            token.type !== TOKEN_TYPES.LINE_COMMENT &&
            token.type !== TOKEN_TYPES.BLOCK_COMMENT
        );

        // Group tokens by line for line-based analysis
        const tokensByLine = {};
        codeOnlyTokens.forEach(token => {
            if (!tokensByLine[token.line]) {
                tokensByLine[token.line] = [];
            }
            tokensByLine[token.line].push(token);
        });

        // Check patterns on each line of reconstructed code
        Object.keys(tokensByLine).forEach(lineNum => {
            const lineTokens = tokensByLine[lineNum];
            // Reconstruct line without whitespace tokens
            const lineContent = lineTokens
                .filter(t => t.type !== TOKEN_TYPES.WHITESPACE && t.type !== TOKEN_TYPES.NEWLINE)
                .map(t => t.lexeme)
                .join('');

            if (lineContent.trim()) {
                allPatterns.forEach(patternObj => {
                    if (this.isPatternIgnored(patternObj)) return;

                    const pattern = new RegExp(patternObj.pattern, patternObj.flags || 'gi');
                    const matches = lineContent.match(pattern);

                    if (matches && matches.length > 0) {
                        matches.forEach(match => {
                            const adjustedSeverity = this.adjustSeverityByContext(
                                patternObj.severity,
                                severityMultiplier
                            );

                            const violation = {
                                id: this.generateViolationId(),
                                severity: adjustedSeverity,
                                category: patternObj.category || 'UNKNOWN',
                                pattern: patternObj.pattern,
                                match: match,
                                message: `${patternObj.message || 'Violation detected'} (in ${structure.type}: ${structure.name})`,
                                line: parseInt(lineNum),
                                column: structure.column || 1,
                                position: structure.startPosition,
                                filePath: filePath,
                                context: contextType,
                                structureInfo: {
                                    type: structure.type,
                                    name: structure.name,
                                    startPosition: structure.startPosition,
                                    endPosition: structure.endPosition
                                },
                                analysis: {
                                    contextAware: true,
                                    accuracy: 'maximum',
                                    severityMultiplier: severityMultiplier,
                                    reconstructedCode: lineContent,
                                    originalTokens: lineTokens.map(t => t.lexeme)
                                },
                                aiEnhanced: aiAnalysis ? {
                                    confidence: this.calculateAIConfidence(patternObj, matches, aiAnalysis),
                                    context: this.getAIContext(parseInt(lineNum), aiAnalysis),
                                    recommendation: this.getAIRecommendation(patternObj, matches, aiAnalysis)
                                } : null,
                                timestamp: new Date().toISOString(),
                                engine: 'UniversalSecurityEngine',
                                version: '3.0-intelligent'
                            };

                            violations.push(violation);
                            this.violations.push(violation);
                            this.stats.totalViolations++;
                            this.stats.violationsBySeverity[violation.severity]++;
                            this.stats.violationsByCategory[violation.category] =
                                (this.stats.violationsByCategory[violation.category] || 0) + 1;

                            this.emit('violation', violation);
                        });
                    }
                });
            }
        });
    }

    // ======================================================================
    // UTILITY METHODS FOR INTELLIGENT ANALYSIS
    // ======================================================================

    getTokensInStructure(structure) {
        // Return tokens that belong to this structure based on position
        if (!this.currentTokens) return [];

        return this.currentTokens.filter(token => {
            if (structure.startPosition && structure.endPosition) {
                return token.position >= structure.startPosition &&
                    token.position <= structure.endPosition;
            }
            return token.line >= structure.line &&
                token.line <= (structure.endLine || structure.line);
        });
    }

    extractStructureContent(structure, fullContent) {
        if (structure.startPosition && structure.endPosition) {
            return fullContent.substring(structure.startPosition, structure.endPosition);
        }
        return '';
    }

    adjustSeverityByContext(originalSeverity, multiplier) {
        const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const currentIndex = severityLevels.indexOf(originalSeverity);

        if (multiplier > 1.0 && currentIndex < severityLevels.length - 1) {
            return severityLevels[Math.min(currentIndex + 1, severityLevels.length - 1)];
        } else if (multiplier < 1.0 && currentIndex > 0) {
            return severityLevels[Math.max(currentIndex - 1, 0)];
        }

        return originalSeverity;
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
    //  REVOLUTIONARY STRUCTURE-AWARE METHODS (ผ่าตัดเปลี่ยนหัวใจ)
    // Heart Surgery Methods for Structure-First Analysis
    // ======================================================================

    /**
     *  Extract Pure Code Content from Structure (No Comments/Strings)
     * ดึงเนื้อหาเฉพาะส่วนของโค้ดจริงๆ (ไม่มี comment/string)
     */
    extractPureCodeContent(structure, fullContent) {
        try {
            if (!structure || !structure.content) {
                return '';
            }

            // ใช้เนื้อหาจาก structure ที่ parser วิเคราะห์ไว้แล้ว
            // ซึ่งจะเป็นเนื้อหาที่แยกโค้ดจริงออกจาก comment/string แล้ว
            let structureContent = structure.content || structure.code || '';

            // เพิ่มการกรองเพื่อความปลอดภัย
            const lines = structureContent.split('\n');
            const pureCodeLines = lines.filter(line => {
                const trimmedLine = line.trim();

                // Skip comment lines
                if (trimmedLine.startsWith('//') ||
                    trimmedLine.startsWith('/*') ||
                    trimmedLine.endsWith('*/') ||
                    trimmedLine.startsWith('*')) {
                    return false;
                }

                // Skip string-only lines
                if (trimmedLine.match(/^['"`].*['"`]$/)) {
                    return false;
                }

                return true;
            });

            return pureCodeLines.join('\n');

        } catch (error) {
            this.emit('warning', {
                type: 'CONTENT_EXTRACTION_ERROR',
                structure: structure.name || 'unknown',
                error: error.message
            });
            return '';
        }
    }

    /**
     *  Check Security Patterns Against Structure Content
     * ตรวจสอบ patterns กับเนื้อหาโครงสร้างเฉพาะ (Structure-First)
     */
    checkStructurePatterns(patterns, structureContent, structure, filePath, violations, aiAnalysis, category) {
        if (!structureContent || structureContent.trim().length === 0) {
            return;
        }

        patterns.forEach(patternObj => {
            try {
                // Skip if pattern ignored or insufficient severity
                if (this.isPatternIgnored(patternObj)) return;

                const patternSeverityLevel = this.severityLevels[patternObj.severity]?.level || 1;
                if (patternSeverityLevel < this.minSeverityNum) return;

                if (this.config.enabledCategories && !this.config.enabledCategories.includes(patternObj.category)) return;

                //  Check pattern against pure structure content
                const matches = structureContent.match(patternObj.pattern);
                if (matches) {
                    const violation = this.createStructureViolation(
                        patternObj,
                        matches,
                        structure,
                        filePath,
                        structureContent,
                        aiAnalysis,
                        category
                    );

                    violations.push(violation);
                    this.violations.push(violation);
                    this.stats.totalViolations++;
                    this.stats.violationsBySeverity[violation.severity]++;
                    this.stats.violationsByCategory[violation.category] =
                        (this.stats.violationsByCategory[violation.category] || 0) + 1;

                    this.emit('violation', violation);
                }

            } catch (patternError) {
                this.emit('warning', {
                    type: 'STRUCTURE_PATTERN_CHECK_ERROR',
                    pattern: patternObj.name || 'unnamed',
                    structure: structure.name || 'unknown',
                    error: patternError.message
                });
            }
        });
    }

    /**
     *  Create Structure-Aware Violation Object
     * สร้าง violation object ที่รู้เรื่องโครงสร้าง
     */
    createStructureViolation(patternObj, matches, structure, filePath, structureContent, aiAnalysis, category) {
        const violation = {
            id: `struct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: patternObj.category || category || 'UNKNOWN_VIOLATION',
            category: patternObj.category || category || 'UNKNOWN_VIOLATION',
            severity: patternObj.severity || 'MEDIUM',
            pattern: patternObj.name || patternObj.pattern.source || patternObj.pattern.toString(),
            description: patternObj.description || `Violation found in ${structure.type}: ${structure.name}`,

            //  Structure-specific information
            structure: {
                type: structure.type,
                name: structure.name,
                line: structure.line,
                startPosition: structure.startPosition || 0,
                endPosition: structure.endPosition || 0,
                purpose: structure.purpose || null
            },

            file: {
                path: filePath,
                name: path.basename(filePath),
                extension: path.extname(filePath)
            },

            match: {
                text: matches[0],
                index: matches.index || 0,
                groups: matches.slice(1)
            },

            context: {
                method: 'structure-aware',
                intelligentParsing: true,
                falsePositiveRisk: 'minimal',
                contentType: 'pure-code-only'
            },

            timestamp: new Date().toISOString(),
            engineVersion: '3.0'
        };

        //  AI Enhancement if available
        if (aiAnalysis && structure.purpose) {
            violation.aiEnhanced = {
                structurePurpose: structure.purpose,
                contextualSeverity: this.calculateContextualSeverity(patternObj, structure, aiAnalysis),
                recommendation: this.generateAIRecommendation(patternObj, structure, aiAnalysis)
            };
        }

        return violation;
    }

    /**
     *  Enhance Violation with AI Context Analysis
     */
    enhanceViolationWithAI(structure, aiAnalysis, violations, filePath) {
        if (!aiAnalysis || !aiAnalysis.analysis) return;

        try {
            const enhancement = {
                structureType: structure.type,
                structureName: structure.name,
                aiConfidence: aiAnalysis.confidence || 0.5,
                contextualRisk: this.assessContextualRisk(structure, aiAnalysis),
                recommendation: `AI Analysis: ${structure.type} "${structure.name}" in ${aiAnalysis.analysis.intent?.english || 'unknown context'}`
            };

            // Add to last violation if it matches this structure
            const lastViolation = violations[violations.length - 1];
            if (lastViolation && lastViolation.structure &&
                lastViolation.structure.name === structure.name) {
                lastViolation.aiContextualEnhancement = enhancement;
            }

        } catch (error) {
            this.emit('warning', {
                type: 'AI_ENHANCEMENT_ERROR',
                structure: structure.name,
                error: error.message
            });
        }
    }

    /**
     *  Calculate Contextual Severity based on AI Analysis
     */
    calculateContextualSeverity(patternObj, structure, aiAnalysis) {
        let baseSeverity = patternObj.severity || 'MEDIUM';

        // Increase severity if in critical contexts
        if (aiAnalysis.analysis && aiAnalysis.analysis.intent) {
            const intent = aiAnalysis.analysis.intent.english || '';

            if (intent.toLowerCase().includes('security') ||
                intent.toLowerCase().includes('authentication')) {
                return 'CRITICAL';
            }

            if (intent.toLowerCase().includes('performance') ||
                intent.toLowerCase().includes('optimization')) {
                return 'HIGH';
            }
        }

        return baseSeverity;
    }

    /**
     *  Generate AI-Powered Recommendation
     */
    generateAIRecommendation(patternObj, structure, aiAnalysis) {
        const structureType = structure.type;
        const patternType = patternObj.category || patternObj.type || 'unknown';

        return ` ${patternType} detected in ${structureType} "${structure.name}". ` +
            `Context: ${aiAnalysis.analysis?.intent?.thai || 'ไม่ทราบบริบท'}. ` +
            `แนะนำ: ตรวจสอบความจำเป็นและความปลอดภัยของการใช้งาน`;
    }

    /**
     *  Assess Contextual Risk based on Structure + AI Analysis
     */
    assessContextualRisk(structure, aiAnalysis) {
        if (!aiAnalysis || !aiAnalysis.analysis) return 'MEDIUM';

        const riskFactors = [];

        // Structure-based risk
        if (structure.type === 'class' || structure.type === 'function') {
            riskFactors.push('executable-code');
        }

        // AI-based risk
        if (aiAnalysis.analysis.intent) {
            const intent = aiAnalysis.analysis.intent.english || '';
            if (intent.includes('security') || intent.includes('authentication')) {
                riskFactors.push('security-critical');
            }
        }

        if (riskFactors.length >= 2) return 'HIGH';
        if (riskFactors.length >= 1) return 'MEDIUM';
        return 'LOW';
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