#!/usr/bin/env node
// ======================================================================
// CHAHUADEV AI FILE ANALYZER v1.0 - INTELLIGENT CODE ANALYSIS SYSTEM
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// @license MIT
// @contact chahuadev@gmail.com
// ======================================================================



const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ProfessionalLogger, SecurityManager } = require('./professional-logging-system.js');

// ======================================================================
// AI ANALYSIS PATTERNS & INTELLIGENCE RULES
// ======================================================================

const AI_PATTERNS = {
    // Intent Detection Patterns
    INTENT_PATTERNS: {
        DEBUGGING: [
            /console\.(log|debug|info|warn|error)/gi,
            /debugger\s*;/gi,
            /debug\s*[:=]/gi,
            /\.debug\s*\(/gi,
            /debug\s*=\s*true/gi,
            /DEBUG\s*[:=]/gi,
            /logger\.(debug|trace)/gi,
            /__dirname.*debug/gi,
            /process\.env\.DEBUG/gi,
            /debug.*mode/gi
        ],
        ERROR_HANDLING: [
            /try\s*\{[\s\S]*?\}\s*catch/gi,
            /throw\s+new\s+Error/gi,
            /\.catch\s*\(/gi,
            /error\s*[:=]/gi,
            /Error\s*\(/gi,
            /exception/gi,
            /\.on\s*\(\s*['"]error['"]/gi,
            /process\.on\s*\(\s*['"]uncaughtException['"]/gi,
            /reject\s*\(/gi,
            /finally\s*\{/gi
        ],
        ASYNC_OPERATIONS: [
            /async\s+function/gi,
            /await\s+/gi,
            /Promise\s*\(/gi,
            /\.then\s*\(/gi,
            /setTimeout|setInterval/gi,
            /process\.nextTick/gi,
            /setImmediate/gi,
            /callback\s*\(/gi,
            /\.on\s*\(/gi,
            /EventEmitter/gi
        ],
        DATA_MANIPULATION: [
            /JSON\.(parse|stringify)/gi,
            /\.map\s*\(/gi,
            /\.filter\s*\(/gi,
            /\.reduce\s*\(/gi,
            /\.forEach\s*\(/gi,
            /Object\.(keys|values|entries)/gi,
            /Array\.(from|isArray)/gi,
            /\.sort\s*\(/gi,
            /\.slice\s*\(/gi,
            /\.splice\s*\(/gi
        ],
        FILE_OPERATIONS: [
            /fs\.(read|write|append)/gi,
            /require\s*\(\s*['"]fs['"]/gi,
            /path\.(join|resolve|dirname|basename)/gi,
            /__dirname|__filename/gi,
            /process\.cwd/gi,
            /\.exists\s*\(/gi,
            /\.createReadStream|\.createWriteStream/gi,
            /\.mkdirSync|\.mkdir/gi,
            /\.unlink|\.rmdir/gi,
            /\.stat\s*\(/gi
        ],
        SECURITY_OPERATIONS: [
            /crypto\./gi,
            /password|pwd|auth/gi,
            /token|jwt|bearer/gi,
            /encrypt|decrypt|hash/gi,
            /security|secure/gi,
            /sanitize|validate/gi,
            /escape|unescape/gi,
            /cors|csrf/gi,
            /session|cookie/gi,
            /permission|role|access/gi
        ],
        NETWORK_OPERATIONS: [
            /http\.|https\./gi,
            /request\s*\(/gi,
            /fetch\s*\(/gi,
            /axios\./gi,
            /socket\./gi,
            /server\.(listen|close)/gi,
            /req\.|res\./gi,
            /express\s*\(/gi,
            /middleware/gi,
            /port\s*[:=]/gi
        ]
    },

    // Code Quality Patterns
    QUALITY_PATTERNS: {
        POTENTIAL_BUGS: [
            /==\s*null|null\s*==/gi,           // Loose null comparison
            /==\s*undefined|undefined\s*==/gi,   // Loose undefined comparison
            /var\s+/gi,                          // var usage (should use let/const)
            /eval\s*\(/gi,                       // eval usage
            /with\s*\(/gi,                       // with statement
            /delete\s+/gi,                       // delete operator
            /arguments\s*\[/gi,                  // arguments object
            /function\s+\w+\s*\(\s*\)\s*\{[\s\S]*?return[\s\S]*?function/gi, // Function returning function
            /setTimeout\s*\(\s*["'][^"']*["']/gi, // setTimeout with string
        ],
        PERFORMANCE_ISSUES: [
            /for\s*\(\s*var\s+\w+\s*=\s*0\s*;[^;]*\.length\s*;/gi, // Length in loop condition
            /document\.(getElementById|querySelector)/gi,              // DOM queries
            /\$\s*\(/gi,                                              // jQuery usage
            /innerHTML\s*=/gi,                                        // innerHTML assignment
            /new\s+RegExp\s*\(/gi,                                   // RegExp constructor in loop
            /JSON\.(parse|stringify)\s*\(/gi,                        // JSON operations
            /\.concat\s*\(/gi,                                       // Array concat in loop
        ],
        MEMORY_LEAKS: [
            /setInterval\s*\(/gi,                // setInterval without clear
            /setTimeout\s*\(/gi,                 // setTimeout without clear  
            /addEventListener\s*\(/gi,           // Event listeners
            /\.on\s*\(\s*["'][^"']*["']/gi,     // Event emitter listeners
            /global\.|window\./gi,               // Global variables
            /closure/gi,                         // Closures
            /circular/gi,                        // Circular references
        ]
    },

    // Error Analysis Patterns  
    ERROR_PATTERNS: {
        SYNTAX_ERRORS: [
            /SyntaxError/gi,
            /Unexpected token/gi,
            /Unexpected end of input/gi,
            /Invalid or unexpected token/gi,
            /Missing \)/gi,
            /Missing \]/gi,
            /Missing \}/gi,
        ],
        RUNTIME_ERRORS: [
            /ReferenceError/gi,
            /TypeError/gi,
            /RangeError/gi,
            /is not defined/gi,
            /is not a function/gi,
            /Cannot read property/gi,
            /Cannot set property/gi,
            /null/gi,
            /undefined/gi,
        ],
        LOGICAL_ERRORS: [
            /infinite loop/gi,
            /stack overflow/gi,
            /maximum call stack/gi,
            /recursion/gi,
            /deadlock/gi,
            /race condition/gi,
            /concurrent/gi,
        ]
    }
};

// ======================================================================
// AI FILE ANALYZER CLASS
// ======================================================================

class AIFileAnalyzer {
    constructor(options = {}) {
        this.options = {
            enableDeepAnalysis: true,
            enableIntentDetection: true,
            enableQualityAnalysis: true,
            enablePerformanceAnalysis: true,
            enableSecurityAnalysis: true,
            minConfidenceLevel: 0.3,
            maxFileSize: 50 * 1024 * 1024, // 50MB
            includeLineNumbers: true,
            detailedReporting: true,
            ...options
        };

        this.logger = new ProfessionalLogger('ai-file-analyzer', {
            logLevel: 'DEBUG',
            enableFileLogging: true
        });

        this.security = new SecurityManager();
        this.analysisSession = this.generateSessionId();
        this.stats = this.initializeStats();
    }

    generateSessionId() {
        return `AI_ANALYSIS_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    initializeStats() {
        return {
            filesAnalyzed: 0,
            totalLines: 0,
            totalIntents: 0,
            totalIssues: 0,
            confidenceScores: [],
            analysisTime: 0,
            categories: {
                debugging: 0,
                errorHandling: 0,
                asyncOps: 0,
                dataManipulation: 0,
                fileOps: 0,
                securityOps: 0,
                networkOps: 0,
                bugs: 0,
                performance: 0,
                memoryLeaks: 0,
                syntaxErrors: 0,
                runtimeErrors: 0,
                logicalErrors: 0
            }
        };
    }

    // ==========================================
    // MAIN ANALYSIS ENGINE
    // ==========================================

    async analyzeFile(filePath, options = {}) {
        const startTime = Date.now();

        try {
            // Log analysis start
            this.logger.info('AI_ANALYSIS_STARTED', `Starting AI analysis for: ${filePath}`, {
                filePath: filePath,
                sessionId: this.analysisSession,
                timestamp: new Date().toISOString(),
                options: options
            });

            // Basic security validation (similar to scanner security validation)
            const normalizedPath = path.resolve(filePath);

            // Check for system directories only (allow project scanning)
            const systemPaths = [
                /^[A-Z]:\\Windows\\/i,
                /^[A-Z]:\\Program Files\\/i,
                /^[A-Z]:\\Program Files \(x86\)\\/i,
                /^[A-Z]:\\System Volume Information\\/i,
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
            ];

            let isSystemPath = false;
            for (const systemPattern of systemPaths) {
                if (systemPattern.test(normalizedPath)) {
                    isSystemPath = true;
                    break;
                }
            }

            if (isSystemPath) {
                throw new Error(`Cannot analyze system directory: ${normalizedPath}`);
            }

            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            this.logger.audit('ANALYSIS_STARTED', filePath, {
                sessionId: this.analysisSession,
                options: { ...this.options, ...options }
            });

            // Read and validate file
            const fileContent = await this.readFileSecurely(filePath);
            const fileInfo = this.getFileInfo(filePath, fileContent);

            // Perform AI analysis
            const analysis = await this.performDeepAnalysis(fileContent, fileInfo, options);

            // Calculate analysis metrics
            analysis.metadata = {
                sessionId: this.analysisSession,
                analysisTime: Date.now() - startTime,
                fileInfo,
                confidence: this.calculateOverallConfidence(analysis),
                riskLevel: this.assessRiskLevel(analysis),
                recommendations: this.generateRecommendations(analysis)
            };

            // Update statistics
            this.updateStats(analysis);

            // Log comprehensive analysis completion
            this.logger.audit('ANALYSIS_COMPLETED', filePath, {
                sessionId: this.analysisSession,
                analysisTime: analysis.metadata.analysisTime,
                confidence: analysis.metadata.confidence,
                issueCount: analysis.issues?.length || 0,
                intentCount: analysis.intents?.length || 0,
                qualityScore: analysis.metrics?.qualityScore || 0,
                riskScore: analysis.metrics?.riskScore || 0,
                complexity: analysis.metadata?.fileInfo?.complexity?.level || 'Unknown',
                fileInfo: {
                    size: analysis.metadata?.fileInfo?.fileSize || 0,
                    lines: analysis.metadata?.fileInfo?.lineCount || 0,
                    language: analysis.metadata?.fileInfo?.language || 'unknown'
                },
                detectedPatterns: analysis.detectedPatterns?.length || 0,
                recommendations: analysis.metadata?.recommendations?.length || 0,
                analysisType: 'comprehensive',
                engineVersion: '3.0'
            });

            // Log detailed breakdown by category
            if (analysis.issues && analysis.issues.length > 0) {
                const issueCategories = analysis.issues.reduce((acc, issue) => {
                    acc[issue.category] = (acc[issue.category] || 0) + 1;
                    return acc;
                }, {});

                this.logger.info('ISSUES_BREAKDOWN', `Analysis found ${analysis.issues.length} issues in ${filePath}`, {
                    sessionId: this.analysisSession,
                    filePath: filePath,
                    totalIssues: analysis.issues.length,
                    categories: issueCategories,
                    topSeverity: this.getHighestSeverity(analysis.issues)
                });
            }

            // Log intent analysis results
            if (analysis.intents && analysis.intents.length > 0) {
                this.logger.info('INTENT_ANALYSIS', `Detected ${analysis.intents.length} intents in ${filePath}`, {
                    sessionId: this.analysisSession,
                    filePath: filePath,
                    intents: analysis.intents.map(intent => ({
                        type: intent.type,
                        confidence: intent.confidence,
                        count: intent.count
                    })),
                    primaryIntent: analysis.intents[0]?.type || 'unknown'
                });
            }

            return analysis;

        } catch (error) {
            this.logger.error('ANALYSIS_FAILED', `Failed to analyze file: ${filePath}`, error, {
                sessionId: this.analysisSession,
                analysisTime: Date.now() - startTime
            });
            throw error;
        }
    }

    async readFileSecurely(filePath) {
        try {
            // Check file size
            const stats = fs.statSync(filePath);
            if (stats.size > this.options.maxFileSize) {
                throw new Error(`File too large: ${Math.round(stats.size / 1024 / 1024)}MB > ${Math.round(this.options.maxFileSize / 1024 / 1024)}MB`);
            }

            // Read file content
            const content = fs.readFileSync(filePath, 'utf8');

            this.logger.debug('FILE_READ', `Successfully read file: ${filePath}`, {
                size: stats.size,
                lines: content.split('\n').length
            });

            return content;

        } catch (error) {
            this.logger.error('FILE_READ_ERROR', `Failed to read file: ${filePath}`, error);
            throw error;
        }
    }

    getFileInfo(filePath, content) {
        const lines = content.split('\n');
        const extension = path.extname(filePath).toLowerCase();

        return {
            filePath,
            fileName: path.basename(filePath),
            fileSize: Buffer.byteLength(content, 'utf8'),
            lineCount: lines.length,
            extension,
            language: this.detectLanguage(extension, content),
            encoding: 'utf8',
            lastModified: fs.statSync(filePath).mtime,
            complexity: this.calculateComplexity(content)
        };
    }

    detectLanguage(extension, content) {
        const langMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml'
        };

        if (langMap[extension]) {
            return langMap[extension];
        }

        // Heuristic detection
        if (content.includes('#!/usr/bin/env node') || content.includes('require(') || content.includes('module.exports')) {
            return 'javascript';
        }
        if (content.includes('def ') || content.includes('import ') || content.includes('from ')) {
            return 'python';
        }

        return 'text';
    }

    calculateComplexity(content) {
        const lines = content.split('\n');
        let complexity = 0;

        // Cyclomatic complexity calculation
        const complexityPatterns = [
            /if\s*\(/gi,
            /else\s*if\s*\(/gi,
            /while\s*\(/gi,
            /for\s*\(/gi,
            /switch\s*\(/gi,
            /case\s+/gi,
            /catch\s*\(/gi,
            /\?\s*.*?\s*:/gi,  // Ternary operator
            /&&|\|\|/gi       // Logical operators
        ];

        for (const pattern of complexityPatterns) {
            const matches = content.match(pattern);
            complexity += matches ? matches.length : 0;
        }

        return {
            cyclomatic: complexity,
            lineComplexity: complexity / lines.length,
            level: complexity < 10 ? 'Low' : complexity < 20 ? 'Medium' : complexity < 50 ? 'High' : 'Very High'
        };
    }

    // ==========================================
    // DEEP AI ANALYSIS ENGINE
    // ==========================================

    async performDeepAnalysis(content, fileInfo, options = {}) {
        const analysis = {
            intents: [],
            issues: [],
            patterns: [],
            insights: [],
            metrics: {}
        };

        const lines = content.split('\n');

        // Intent Detection Analysis
        if (this.options.enableIntentDetection) {
            analysis.intents = await this.detectIntents(content, lines);
        }

        // Quality Analysis
        if (this.options.enableQualityAnalysis) {
            analysis.issues.push(...await this.analyzeQuality(content, lines));
        }

        // Performance Analysis
        if (this.options.enablePerformanceAnalysis) {
            analysis.issues.push(...await this.analyzePerformance(content, lines));
        }

        // Security Analysis
        if (this.options.enableSecurityAnalysis) {
            analysis.issues.push(...await this.analyzeSecurity(content, lines));
        }

        // Error Analysis
        analysis.issues.push(...await this.analyzeErrors(content, lines));

        // Pattern Recognition
        analysis.patterns = await this.recognizePatterns(content, lines);

        // Generate AI Insights
        analysis.insights = await this.generateInsights(content, analysis, fileInfo);

        // Calculate metrics
        analysis.metrics = this.calculateMetrics(analysis, fileInfo);

        return analysis;
    }

    async detectIntents(content, lines) {
        const intents = [];
        const intentCategories = Object.keys(AI_PATTERNS.INTENT_PATTERNS);

        for (const category of intentCategories) {
            const patterns = AI_PATTERNS.INTENT_PATTERNS[category];
            const categoryIntents = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNumber = i + 1;

                for (const pattern of patterns) {
                    const matches = line.match(pattern);
                    if (matches) {
                        for (const match of matches) {
                            categoryIntents.push({
                                type: 'INTENT',
                                category: category.toLowerCase(),
                                intent: this.categorizeIntent(category, match),
                                line: lineNumber,
                                column: line.indexOf(match) + 1,
                                match: match.trim(),
                                context: line.trim(),
                                confidence: this.calculateConfidence(match, line, category),
                                severity: this.getIntentSeverity(category),
                                description: this.getIntentDescription(category, match)
                            });
                        }
                    }
                }
            }

            if (categoryIntents.length > 0) {
                intents.push({
                    category: category.toLowerCase(),
                    count: categoryIntents.length,
                    confidence: this.calculateCategoryConfidence(categoryIntents),
                    items: categoryIntents
                });
            }
        }

        return intents;
    }

    async analyzeQuality(content, lines) {
        const issues = [];
        const qualityCategories = Object.keys(AI_PATTERNS.QUALITY_PATTERNS);

        for (const category of qualityCategories) {
            const patterns = AI_PATTERNS.QUALITY_PATTERNS[category];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNumber = i + 1;

                for (const pattern of patterns) {
                    const matches = line.match(pattern);
                    if (matches) {
                        for (const match of matches) {
                            issues.push({
                                type: 'QUALITY_ISSUE',
                                category: category.toLowerCase(),
                                severity: this.getQualitySeverity(category),
                                line: lineNumber,
                                column: line.indexOf(match) + 1,
                                match: match.trim(),
                                context: line.trim(),
                                description: this.getQualityDescription(category, match),
                                recommendation: this.getQualityRecommendation(category, match),
                                confidence: this.calculateConfidence(match, line, category)
                            });
                        }
                    }
                }
            }
        }

        return issues;
    }

    async analyzePerformance(content, lines) {
        const issues = [];

        // Analyze nested loops
        const nestedLoops = this.findNestedLoops(content, lines);
        issues.push(...nestedLoops);

        // Analyze DOM operations
        const domIssues = this.findDOMPerformanceIssues(content, lines);
        issues.push(...domIssues);

        // Analyze async patterns
        const asyncIssues = this.findAsyncPerformanceIssues(content, lines);
        issues.push(...asyncIssues);

        return issues;
    }

    async analyzeSecurity(content, lines) {
        const issues = [];

        // SQL Injection patterns
        const sqlPatterns = [
            /query\s*\+\s*|query\s*\+=\s*['"`]/gi,
            /SELECT\s+\*\s+FROM\s+\w+\s+WHERE\s+.*\+/gi,
            /\$\{\s*.*\s*\}/gi
        ];

        // XSS patterns
        const xssPatterns = [
            /innerHTML\s*=\s*.*\+/gi,
            /document\.write\s*\(/gi,
            /eval\s*\(/gi,
            /Function\s*\(/gi
        ];

        // Analyze all security patterns
        const allSecurityPatterns = [...sqlPatterns, ...xssPatterns];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            for (const pattern of allSecurityPatterns) {
                const matches = line.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        issues.push({
                            type: 'SECURITY_ISSUE',
                            category: 'security_vulnerability',
                            severity: 'HIGH',
                            line: lineNumber,
                            column: line.indexOf(match) + 1,
                            match: match.trim(),
                            context: line.trim(),
                            description: `Security vulnerability detected: ${this.getSecurityDescription(match)}`,
                            recommendation: `Fix security issue: ${this.getSecurityRecommendation(match)}`,
                            confidence: 0.8
                        });
                    }
                }
            }
        }

        return issues;
    }

    async analyzeErrors(content, lines) {
        const issues = [];
        const errorCategories = Object.keys(AI_PATTERNS.ERROR_PATTERNS);

        for (const category of errorCategories) {
            const patterns = AI_PATTERNS.ERROR_PATTERNS[category];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNumber = i + 1;

                for (const pattern of patterns) {
                    const matches = line.match(pattern);
                    if (matches) {
                        for (const match of matches) {
                            issues.push({
                                type: 'ERROR_ANALYSIS',
                                category: category.toLowerCase(),
                                severity: this.getErrorSeverity(category),
                                line: lineNumber,
                                column: line.indexOf(match) + 1,
                                match: match.trim(),
                                context: line.trim(),
                                description: this.getErrorDescription(category, match),
                                recommendation: this.getErrorRecommendation(category, match),
                                confidence: this.calculateConfidence(match, line, category)
                            });
                        }
                    }
                }
            }
        }

        return issues;
    }

    async recognizePatterns(content, lines) {
        const patterns = [];

        // Design pattern recognition
        const designPatterns = [
            { name: 'Singleton', pattern: /class\s+\w+[\s\S]*?constructor[\s\S]*?if\s*\([^)]*instance[^)]*\)/gi },
            { name: 'Factory', pattern: /create\w*\s*\([^)]*\)\s*\{[\s\S]*?new\s+/gi },
            { name: 'Observer', pattern: /(addEventListener|on\s*\(|emit\s*\(|subscribe)/gi },
            { name: 'Promise', pattern: /(new\s+Promise|async\s+function|await\s+)/gi },
            { name: 'Module', pattern: /(module\.exports|export\s+(default\s+)?|import\s+)/gi }
        ];

        for (const dp of designPatterns) {
            const matches = content.match(dp.pattern);
            if (matches && matches.length > 0) {
                patterns.push({
                    name: dp.name,
                    type: 'DESIGN_PATTERN',
                    count: matches.length,
                    confidence: matches.length > 2 ? 0.9 : 0.6,
                    description: `${dp.name} pattern detected`,
                    examples: matches.slice(0, 3).map(m => m.substring(0, 50) + '...')
                });
            }
        }

        return patterns;
    }

    async generateInsights(content, analysis, fileInfo) {
        const insights = [];

        // Code complexity insight
        if (fileInfo.complexity.level === 'High' || fileInfo.complexity.level === 'Very High') {
            insights.push({
                type: 'COMPLEXITY_WARNING',
                severity: 'MEDIUM',
                title: 'High Code Complexity Detected',
                description: `This file has ${fileInfo.complexity.level.toLowerCase()} complexity (${fileInfo.complexity.cyclomatic} cyclomatic complexity)`,
                recommendation: 'Consider breaking down complex functions into smaller, more manageable pieces',
                confidence: 0.9
            });
        }

        // Error handling insight
        const errorHandling = analysis.intents.find(i => i.category === 'error_handling');
        const asyncOps = analysis.intents.find(i => i.category === 'async_operations');

        if (asyncOps && (!errorHandling || errorHandling.count < asyncOps.count * 0.5)) {
            insights.push({
                type: 'ERROR_HANDLING_WARNING',
                severity: 'HIGH',
                title: 'Insufficient Error Handling',
                description: `Found ${asyncOps.count} async operations but only ${errorHandling?.count || 0} error handling patterns`,
                recommendation: 'Add proper error handling for all async operations using try-catch blocks',
                confidence: 0.8
            });
        }

        // Performance insight
        const performanceIssues = analysis.issues.filter(i => i.category.includes('performance'));
        if (performanceIssues.length > 5) {
            insights.push({
                type: 'PERFORMANCE_WARNING',
                severity: 'MEDIUM',
                title: 'Multiple Performance Issues',
                description: `Found ${performanceIssues.length} potential performance issues`,
                recommendation: 'Review and optimize performance-critical sections',
                confidence: 0.7
            });
        }

        // Security insight
        const securityIssues = analysis.issues.filter(i => i.type === 'SECURITY_ISSUE');
        if (securityIssues.length > 0) {
            insights.push({
                type: 'SECURITY_CRITICAL',
                severity: 'CRITICAL',
                title: 'Security Vulnerabilities Found',
                description: `Found ${securityIssues.length} security vulnerabilities that need immediate attention`,
                recommendation: 'Fix all security issues immediately before deployment',
                confidence: 0.95
            });
        }

        return insights;
    }

    // ==========================================
    // HELPER METHODS & UTILITIES
    // ==========================================

    findNestedLoops(content, lines) {
        const issues = [];
        const loopPatterns = [/for\s*\(/gi, /while\s*\(/gi, /forEach\s*\(/gi];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            for (const pattern of loopPatterns) {
                if (pattern.test(line)) {
                    // Check for nested loops in the next 20 lines
                    for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
                        for (const nestedPattern of loopPatterns) {
                            if (nestedPattern.test(lines[j]) && this.isWithinBlock(lines, i, j)) {
                                issues.push({
                                    type: 'PERFORMANCE_ISSUE',
                                    category: 'nested_loops',
                                    severity: 'MEDIUM',
                                    line: lineNumber,
                                    column: 1,
                                    match: line.trim(),
                                    context: `Nested loop detected at lines ${lineNumber}-${j + 1}`,
                                    description: 'Nested loops can cause performance issues with O(n²) or higher complexity',
                                    recommendation: 'Consider using more efficient algorithms or data structures',
                                    confidence: 0.8
                                });
                                break;
                            }
                        }
                    }
                }
            }
        }

        return issues;
    }

    findDOMPerformanceIssues(content, lines) {
        const issues = [];
        const domPatterns = [
            { pattern: /document\.getElementById|document\.querySelector/gi, issue: 'DOM query in loop' },
            { pattern: /innerHTML\s*=/gi, issue: 'innerHTML modification' },
            { pattern: /appendChild\s*\(/gi, issue: 'DOM manipulation' }
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            for (const domPattern of domPatterns) {
                const matches = line.match(domPattern.pattern);
                if (matches) {
                    issues.push({
                        type: 'PERFORMANCE_ISSUE',
                        category: 'dom_performance',
                        severity: 'LOW',
                        line: lineNumber,
                        column: line.indexOf(matches[0]) + 1,
                        match: matches[0],
                        context: line.trim(),
                        description: `${domPattern.issue} can impact performance`,
                        recommendation: 'Consider batching DOM operations or using document fragments',
                        confidence: 0.6
                    });
                }
            }
        }

        return issues;
    }

    findAsyncPerformanceIssues(content, lines) {
        const issues = [];

        // Check for sync operations in async functions
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            if (/async\s+function|async\s*\(/gi.test(line)) {
                // Check next lines for sync file operations
                for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                    if (/fs\.\w+Sync\s*\(/gi.test(lines[j])) {
                        issues.push({
                            type: 'PERFORMANCE_ISSUE',
                            category: 'async_performance',
                            severity: 'MEDIUM',
                            line: j + 1,
                            column: 1,
                            match: lines[j].trim(),
                            context: `Sync operation in async function (line ${lineNumber})`,
                            description: 'Synchronous operations in async functions can block the event loop',
                            recommendation: 'Use asynchronous alternatives (remove Sync suffix)',
                            confidence: 0.9
                        });
                    }
                }
            }
        }

        return issues;
    }

    isWithinBlock(lines, startLine, checkLine) {
        let braceCount = 0;
        for (let i = startLine; i <= checkLine; i++) {
            const line = lines[i];
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            if (braceCount < 0) return false;
        }
        return braceCount > 0;
    }

    categorizeIntent(category, match) {
        const intentMap = {
            'DEBUGGING': 'Code debugging and development logging',
            'ERROR_HANDLING': 'Error handling and exception management',
            'ASYNC_OPERATIONS': 'Asynchronous programming patterns',
            'DATA_MANIPULATION': 'Data processing and transformation',
            'FILE_OPERATIONS': 'File system operations',
            'SECURITY_OPERATIONS': 'Security and authentication',
            'NETWORK_OPERATIONS': 'Network communication and HTTP operations'
        };
        return intentMap[category] || 'General programming operation';
    }

    calculateConfidence(match, line, category) {
        let confidence = 0.5;

        // Length-based confidence
        confidence += Math.min(match.length / 50, 0.2);

        // Context-based confidence
        if (line.includes('function') || line.includes('const') || line.includes('let')) {
            confidence += 0.1;
        }

        // Category-specific confidence
        const categoryWeights = {
            'DEBUGGING': 0.9,
            'ERROR_HANDLING': 0.8,
            'ASYNC_OPERATIONS': 0.85,
            'SECURITY_OPERATIONS': 0.9
        };

        if (categoryWeights[category]) {
            confidence *= categoryWeights[category];
        }

        return Math.min(Math.max(confidence, 0.1), 1.0);
    }

    calculateCategoryConfidence(items) {
        if (items.length === 0) return 0;
        const sum = items.reduce((acc, item) => acc + item.confidence, 0);
        return sum / items.length;
    }

    calculateOverallConfidence(analysis) {
        const allItems = [
            ...analysis.intents.flatMap(i => i.items),
            ...analysis.issues,
            ...analysis.patterns
        ];

        if (allItems.length === 0) return 0;

        const confidences = allItems.map(item => item.confidence || 0.5);
        return confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }

    assessRiskLevel(analysis) {
        const criticalIssues = analysis.issues.filter(i => i.severity === 'CRITICAL').length;
        const highIssues = analysis.issues.filter(i => i.severity === 'HIGH').length;
        const securityIssues = analysis.issues.filter(i => i.type === 'SECURITY_ISSUE').length;

        if (criticalIssues > 0 || securityIssues > 0) return 'CRITICAL';
        if (highIssues > 3) return 'HIGH';
        if (analysis.issues.length > 10) return 'MEDIUM';
        return 'LOW';
    }

    generateRecommendations(analysis) {
        const recommendations = [];

        // Priority recommendations
        const criticalIssues = analysis.issues.filter(i => i.severity === 'CRITICAL');
        if (criticalIssues.length > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'Fix Security Vulnerabilities',
                description: `Address ${criticalIssues.length} critical security issues immediately`,
                impact: 'High security risk'
            });
        }

        // Performance recommendations
        const performanceIssues = analysis.issues.filter(i => i.category.includes('performance'));
        if (performanceIssues.length > 3) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Optimize Performance',
                description: `Review and fix ${performanceIssues.length} performance issues`,
                impact: 'Improved application performance'
            });
        }

        // Code quality recommendations
        const qualityIssues = analysis.issues.filter(i => i.type === 'QUALITY_ISSUE');
        if (qualityIssues.length > 5) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Improve Code Quality',
                description: `Address ${qualityIssues.length} code quality issues`,
                impact: 'Better maintainability and reliability'
            });
        }

        return recommendations;
    }

    // Severity and description getters
    getIntentSeverity(category) {
        const severityMap = {
            'DEBUGGING': 'INFO',
            'ERROR_HANDLING': 'MEDIUM',
            'SECURITY_OPERATIONS': 'HIGH',
            'ASYNC_OPERATIONS': 'MEDIUM'
        };
        return severityMap[category] || 'LOW';
    }

    getQualitySeverity(category) {
        const severityMap = {
            'POTENTIAL_BUGS': 'HIGH',
            'PERFORMANCE_ISSUES': 'MEDIUM',
            'MEMORY_LEAKS': 'HIGH'
        };
        return severityMap[category] || 'MEDIUM';
    }

    getErrorSeverity(category) {
        const severityMap = {
            'SYNTAX_ERRORS': 'CRITICAL',
            'RUNTIME_ERRORS': 'HIGH',
            'LOGICAL_ERRORS': 'HIGH'
        };
        return severityMap[category] || 'MEDIUM';
    }

    getIntentDescription(category, match) {
        const descriptions = {
            'DEBUGGING': `Debug operation: ${match}`,
            'ERROR_HANDLING': `Error handling: ${match}`,
            'ASYNC_OPERATIONS': `Async operation: ${match}`,
            'DATA_MANIPULATION': `Data operation: ${match}`,
            'FILE_OPERATIONS': `File operation: ${match}`,
            'SECURITY_OPERATIONS': `Security operation: ${match}`,
            'NETWORK_OPERATIONS': `Network operation: ${match}`
        };
        return descriptions[category] || `Code pattern: ${match}`;
    }

    getQualityDescription(category, match) {
        const descriptions = {
            'POTENTIAL_BUGS': `Potential bug pattern: ${match}`,
            'PERFORMANCE_ISSUES': `Performance issue: ${match}`,
            'MEMORY_LEAKS': `Memory leak risk: ${match}`
        };
        return descriptions[category] || `Quality issue: ${match}`;
    }

    getQualityRecommendation(category, match) {
        const recommendations = {
            'POTENTIAL_BUGS': 'Use strict equality (===) and proper variable declarations',
            'PERFORMANCE_ISSUES': 'Optimize DOM operations and cache frequently accessed elements',
            'MEMORY_LEAKS': 'Properly clean up event listeners and intervals'
        };
        return recommendations[category] || 'Review and improve code quality';
    }

    getErrorDescription(category, match) {
        const descriptions = {
            'SYNTAX_ERRORS': `Syntax error pattern: ${match}`,
            'RUNTIME_ERRORS': `Runtime error pattern: ${match}`,
            'LOGICAL_ERRORS': `Logical error pattern: ${match}`
        };
        return descriptions[category] || `Error pattern: ${match}`;
    }

    getErrorRecommendation(category, match) {
        const recommendations = {
            'SYNTAX_ERRORS': 'Fix syntax errors and validate code structure',
            'RUNTIME_ERRORS': 'Add null checks and proper error handling',
            'LOGICAL_ERRORS': 'Review algorithm logic and add proper validation'
        };
        return recommendations[category] || 'Review and fix error conditions';
    }

    getSecurityDescription(match) {
        if (match.includes('innerHTML')) return 'XSS vulnerability via innerHTML';
        if (match.includes('eval')) return 'Code injection via eval()';
        if (match.includes('query') && match.includes('+')) return 'SQL injection vulnerability';
        return 'Security vulnerability detected';
    }

    getSecurityRecommendation(match) {
        if (match.includes('innerHTML')) return 'Use textContent or sanitize HTML input';
        if (match.includes('eval')) return 'Avoid eval() and use safer alternatives';
        if (match.includes('query')) return 'Use parameterized queries or prepared statements';
        return 'Implement proper input validation and sanitization';
    }

    calculateMetrics(analysis, fileInfo) {
        return {
            totalIntents: analysis.intents.reduce((sum, i) => sum + i.count, 0),
            totalIssues: analysis.issues.length,
            totalPatterns: analysis.patterns.length,
            totalInsights: analysis.insights.length,
            issuesByCategory: this.groupByCategory(analysis.issues),
            issuesBySeverity: this.groupBySeverity(analysis.issues),
            complexityScore: fileInfo.complexity.cyclomatic,
            qualityScore: this.calculateQualityScore(analysis, fileInfo),
            riskScore: this.calculateRiskScore(analysis)
        };
    }

    groupByCategory(issues) {
        return issues.reduce((acc, issue) => {
            acc[issue.category] = (acc[issue.category] || 0) + 1;
            return acc;
        }, {});
    }

    groupBySeverity(issues) {
        return issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, {});
    }

    calculateQualityScore(analysis, fileInfo) {
        let score = 100;

        // Deduct for issues
        score -= analysis.issues.filter(i => i.severity === 'CRITICAL').length * 20;
        score -= analysis.issues.filter(i => i.severity === 'HIGH').length * 10;
        score -= analysis.issues.filter(i => i.severity === 'MEDIUM').length * 5;
        score -= analysis.issues.filter(i => i.severity === 'LOW').length * 2;

        // Deduct for complexity
        if (fileInfo.complexity.level === 'Very High') score -= 15;
        else if (fileInfo.complexity.level === 'High') score -= 10;
        else if (fileInfo.complexity.level === 'Medium') score -= 5;

        return Math.max(score, 0);
    }

    calculateRiskScore(analysis) {
        let score = 0;

        // Add for security issues
        score += analysis.issues.filter(i => i.type === 'SECURITY_ISSUE').length * 30;
        score += analysis.issues.filter(i => i.severity === 'CRITICAL').length * 25;
        score += analysis.issues.filter(i => i.severity === 'HIGH').length * 15;
        score += analysis.issues.filter(i => i.severity === 'MEDIUM').length * 10;

        return Math.min(score, 100);
    }

    updateStats(analysis) {
        this.stats.filesAnalyzed++;
        this.stats.totalIntents += analysis.intents.reduce((sum, i) => sum + i.count, 0);
        this.stats.totalIssues += analysis.issues.length;

        // Update category stats
        for (const issue of analysis.issues) {
            if (this.stats.categories[issue.category] !== undefined) {
                this.stats.categories[issue.category]++;
            }
        }

        this.stats.confidenceScores.push(analysis.metadata.confidence);
        this.stats.analysisTime += analysis.metadata.analysisTime;
    }

    // ==========================================
    // DETAILED REPORTING SYSTEM
    // ==========================================

    generateDetailedReport(analysis) {
        const report = {
            header: this.generateReportHeader(analysis),
            summary: this.generateSummary(analysis),
            intents: this.generateIntentsReport(analysis.intents),
            issues: this.generateIssuesReport(analysis.issues),
            patterns: this.generatePatternsReport(analysis.patterns),
            insights: this.generateInsightsReport(analysis.insights),
            metrics: analysis.metrics,
            recommendations: analysis.metadata.recommendations,
            footer: this.generateReportFooter(analysis)
        };

        return report;
    }

    generateReportHeader(analysis) {
        return {
            title: 'CHAHUADEV AI FILE ANALYSIS REPORT v3.0',
            sessionId: analysis.metadata.sessionId,
            timestamp: new Date().toISOString(),
            file: analysis.metadata.fileInfo.filePath,
            language: analysis.metadata.fileInfo.language,
            fileSize: `${Math.round(analysis.metadata.fileInfo.fileSize / 1024)} KB`,
            lineCount: analysis.metadata.fileInfo.lineCount,
            analysisTime: `${analysis.metadata.analysisTime}ms`,
            confidence: `${Math.round(analysis.metadata.confidence * 100)}%`,
            riskLevel: analysis.metadata.riskLevel
        };
    }

    generateSummary(analysis) {
        return {
            totalIntents: analysis.metrics.totalIntents,
            totalIssues: analysis.metrics.totalIssues,
            totalPatterns: analysis.metrics.totalPatterns,
            totalInsights: analysis.metrics.totalInsights,
            qualityScore: `${analysis.metrics.qualityScore}/100`,
            riskScore: `${analysis.metrics.riskScore}/100`,
            complexityLevel: analysis.metadata.fileInfo.complexity.level,
            cyclomaticComplexity: analysis.metadata.fileInfo.complexity.cyclomatic
        };
    }

    generateIntentsReport(intents) {
        return intents.map(intent => ({
            category: intent.category.toUpperCase(),
            count: intent.count,
            confidence: `${Math.round(intent.confidence * 100)}%`,
            details: intent.items.slice(0, 5).map(item => ({
                line: item.line,
                intent: item.intent,
                match: item.match,
                context: item.context,
                confidence: `${Math.round(item.confidence * 100)}%`
            }))
        }));
    }

    generateIssuesReport(issues) {
        const grouped = {};

        for (const issue of issues) {
            const key = `${issue.type}_${issue.category}`;
            if (!grouped[key]) {
                grouped[key] = {
                    type: issue.type,
                    category: issue.category.toUpperCase(),
                    severity: issue.severity,
                    count: 0,
                    items: []
                };
            }
            grouped[key].count++;
            grouped[key].items.push({
                line: issue.line,
                match: issue.match,
                context: issue.context,
                description: issue.description,
                recommendation: issue.recommendation,
                confidence: `${Math.round(issue.confidence * 100)}%`
            });
        }

        return Object.values(grouped);
    }

    generatePatternsReport(patterns) {
        return patterns.map(pattern => ({
            name: pattern.name,
            type: pattern.type,
            count: pattern.count,
            confidence: `${Math.round(pattern.confidence * 100)}%`,
            description: pattern.description,
            examples: pattern.examples
        }));
    }

    generateInsightsReport(insights) {
        return insights.map(insight => ({
            type: insight.type,
            severity: insight.severity,
            title: insight.title,
            description: insight.description,
            recommendation: insight.recommendation,
            confidence: `${Math.round(insight.confidence * 100)}%`
        }));
    }

    generateReportFooter(analysis) {
        return {
            generatedAt: new Date().toISOString(),
            analysisVersion: '3.0.0',
            sessionId: analysis.metadata.sessionId,
            totalAnalysisTime: `${analysis.metadata.analysisTime}ms`,
            disclaimer: 'This report is generated by AI analysis and should be reviewed by human experts.'
        };
    }

    async saveReport(analysis, outputPath) {
        try {
            const report = this.generateDetailedReport(analysis);
            const reportJson = JSON.stringify(report, null, 2);

            fs.writeFileSync(outputPath, reportJson, 'utf8');

            this.logger.audit('REPORT_SAVED', outputPath, {
                sessionId: analysis.metadata.sessionId,
                reportSize: Buffer.byteLength(reportJson, 'utf8')
            });

            return outputPath;
        } catch (error) {
            this.logger.error('REPORT_SAVE_ERROR', `Failed to save report: ${outputPath}`, error);
            throw error;
        }
    }

    getSessionReport() {
        return {
            sessionId: this.analysisSession,
            stats: this.stats,
            averageConfidence: this.stats.confidenceScores.length > 0
                ? this.stats.confidenceScores.reduce((a, b) => a + b, 0) / this.stats.confidenceScores.length
                : 0,
            averageAnalysisTime: this.stats.filesAnalyzed > 0
                ? this.stats.analysisTime / this.stats.filesAnalyzed
                : 0
        };
    }

    getHighestSeverity(issues) {
        const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        let highest = 'LOW';
        let highestValue = 0;

        for (const issue of issues) {
            const severity = issue.severity || 'LOW';
            const value = severityOrder[severity] || 0;
            if (value > highestValue) {
                highest = severity;
                highestValue = value;
            }
        }

        return highest;
    }

    close() {
        this.logger.close();
    }
}

// ======================================================================
// EXPORTS
// ======================================================================

module.exports = {
    AIFileAnalyzer,
    AI_PATTERNS,

    // Utility function
    createAnalyzer: (options = {}) => new AIFileAnalyzer(options)
};

// ======================================================================
// CLI USAGE (when run directly)
// ======================================================================

if (require.main === module) {
    const analyzer = new AIFileAnalyzer({
        enableDeepAnalysis: true,
        detailedReporting: true
    });

    const filePath = process.argv[2];

    if (!filePath) {
        console.log('Usage: node ai-file-analyzer.js <file-path>');
        console.log('Example: node ai-file-analyzer.js ./my-code.js');
        process.exit(1);
    }

    console.log(' CHAHUADEV AI FILE ANALYZER v3.0');
    console.log('='.repeat(80));

    analyzer.analyzeFile(filePath)
        .then(analysis => {
            const report = analyzer.generateDetailedReport(analysis);

            // Print detailed console report
            console.log('\n ANALYSIS SUMMARY:');
            console.log(`   File: ${report.header.file}`);
            console.log(`   Language: ${report.header.language}`);
            console.log(`   Size: ${report.header.fileSize} (${report.header.lineCount} lines)`);
            console.log(`   Analysis Time: ${report.header.analysisTime}`);
            console.log(`   Confidence: ${report.header.confidence}`);
            console.log(`   Risk Level: ${report.header.riskLevel}`);
            console.log(`   Quality Score: ${report.summary.qualityScore}`);
            console.log(`   Complexity: ${report.summary.complexityLevel} (${report.summary.cyclomaticComplexity})`);

            console.log('\n DETECTED INTENTS:');
            for (const intent of report.intents) {
                console.log(`   ${intent.category}: ${intent.count} occurrences (${intent.confidence} confidence)`);
                for (const detail of intent.details.slice(0, 2)) {
                    console.log(`     Line ${detail.line}: ${detail.context.substring(0, 60)}...`);
                }
            }

            console.log('\n  ISSUES FOUND:');
            for (const issueGroup of report.issues) {
                console.log(`   ${issueGroup.category} (${issueGroup.severity}): ${issueGroup.count} issues`);
                for (const item of issueGroup.items.slice(0, 2)) {
                    console.log(`     Line ${item.line}: ${item.description}`);
                }
            }

            console.log('\n INSIGHTS:');
            for (const insight of report.insights) {
                console.log(`   ${insight.severity}: ${insight.title}`);
                console.log(`     ${insight.description}`);
            }

            console.log('\n RECOMMENDATIONS:');
            for (const rec of report.recommendations) {
                console.log(`   ${rec.priority}: ${rec.action}`);
                console.log(`     ${rec.description}`);
            }

            // Save detailed report
            const reportPath = filePath.replace(/\.[^.]+$/, '_analysis_report.json');
            analyzer.saveReport(analysis, reportPath);
            console.log(`\n Detailed report saved: ${reportPath}`);

            analyzer.close();
        })
        .catch(error => {
            console.error(' Analysis failed:', error.message);
            analyzer.close();
            process.exit(1);
        });
}