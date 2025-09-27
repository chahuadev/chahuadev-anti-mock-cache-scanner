#!/usr/bin/env node

// ======================================================================
// CHAHUADEV PROFESSIONAL LOGGING & SECURITY SYSTEM v1.0
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// @license MIT
// @contact chahuadev@gmail.com
// ======================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// ======================================================================
// SECURITY CONFIGURATION & CONSTANTS
// ======================================================================

const SECURITY_CONFIG = {
    // File size limits (10MB maximum)
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes

    // Path length limits
    MAX_PATH_LENGTH: 4096,

    // Parsing limits for complexity attacks
    MAX_DEPTH: 100,
    MAX_TOKENS: 100000,
    MAX_PARSING_TIME: 30000, // 30 seconds

    // System directories blacklist (Cross-platform)
    FORBIDDEN_PATHS: [
        // Windows system paths
        /^[A-Z]:\\Windows\\/i,
        /^[A-Z]:\\Program Files\\/i,
        /^[A-Z]:\\Program Files \(x86\)\\/i,
        /^[A-Z]:\\System Volume Information\\/i,
        /^[A-Z]:\\ProgramData\\/i,
        /^[A-Z]:\\Users\\[^\\]+\\AppData\\/i,

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
        /^\/dev\//,
        /^\/var\/log\//,
        /^\/tmp\//,

        // macOS system paths
        /^\/System\//,
        /^\/Library\/System\//,
        /^\/private\//,
        /^\/Applications\/Utilities\//,

        // Common development paths to avoid
        /node_modules/,
        /\.git/,
        /\.npm/,
        /\.cache/,
        /\.vscode/,
        /\.idea/,
        /coverage/,
        /dist/,
        /build/,
        /\.next/,
        /\.nuxt/
    ],

    // Dangerous file patterns
    DANGEROUS_PATTERNS: [
        /\.\.\//g,                    // Path traversal
        /\.\.\\/g,                    // Windows path traversal
        /\x00/g,                      // Null bytes
        /[<>"|?*\x00-\x1f]/g,        // Dangerous characters
        /eval\s*\(/gi,               // Code execution
        /exec\s*\(/gi,               // Command execution
        /spawn\s*\(/gi,              // Process spawning
        /child_process/gi,           // Child process module
    ]
};

// ======================================================================
// CUSTOM ERROR CLASSES
// ======================================================================

class SecurityError extends Error {
    constructor(message, path = null, code = null) {
        super(message);
        this.name = 'SecurityError';
        this.path = path;
        this.code = code;
        this.timestamp = new Date().toISOString();
    }
}

class PathValidationError extends SecurityError {
    constructor(message, path, code) {
        super(message, path, code);
        this.name = 'PathValidationError';
    }
}

class FileSizeError extends SecurityError {
    constructor(message, path, size) {
        super(message, path, 'FILE_TOO_LARGE');
        this.name = 'FileSizeError';
        this.fileSize = size;
    }
}

class SymlinkError extends SecurityError {
    constructor(message, path, target) {
        super(message, path, 'UNSAFE_SYMLINK');
        this.name = 'SymlinkError';
        this.target = target;
    }
}

// ======================================================================
// SECURITY MANAGER CLASS
// ======================================================================

class SecurityManager {
    constructor(options = {}) {
        this.options = {
            enablePathValidation: true,
            enableFileSizeCheck: true,
            enableSymlinkCheck: true,
            enableSystemDirProtection: true,
            customForbiddenPaths: [],
            customMaxFileSize: SECURITY_CONFIG.MAX_FILE_SIZE,
            ...options
        };

        this.workingDirectory = process.cwd();
        this.sessionId = this.generateSessionId();
    }

    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `SEC_${timestamp}_${random}`;
    }

    // ==========================================
    // PATH VALIDATION & SANITIZATION
    // ==========================================

    validateInput(target) {
        if (!target || typeof target !== 'string') {
            throw new PathValidationError('Invalid target path - must be non-empty string', target, 'INVALID_TYPE');
        }

        if (target.length > SECURITY_CONFIG.MAX_PATH_LENGTH) {
            throw new PathValidationError(
                `Path too long (${target.length} > ${SECURITY_CONFIG.MAX_PATH_LENGTH})`,
                target,
                'PATH_TOO_LONG'
            );
        }

        // Check for dangerous characters
        const dangerousChars = /[<>"|?*\x00-\x1f]/;
        if (dangerousChars.test(target)) {
            throw new PathValidationError(
                'Dangerous characters detected in path',
                target,
                'DANGEROUS_CHARS'
            );
        }

        return true;
    }

    sanitizePath(inputPath) {
        if (!this.options.enablePathValidation) return inputPath;

        // Normalize the path
        const normalizedPath = path.normalize(inputPath);

        // Check for null bytes
        if (normalizedPath.includes('\x00')) {
            throw new PathValidationError(
                'Null bytes in path are not allowed',
                inputPath,
                'NULL_BYTES'
            );
        }

        return normalizedPath;
    }

    isPathSafe(targetPath) {
        if (!this.options.enableSystemDirProtection) return true;

        const normalizedPath = path.resolve(targetPath);

        // Check against forbidden paths
        const allForbiddenPaths = [
            ...SECURITY_CONFIG.FORBIDDEN_PATHS,
            ...this.options.customForbiddenPaths
        ];

        for (const forbiddenPattern of allForbiddenPaths) {
            if (forbiddenPattern.test(normalizedPath)) {
                throw new SecurityError(
                    `Access to protected directory denied: ${normalizedPath}`,
                    targetPath,
                    'SYSTEM_DIR_ACCESS'
                );
            }
        }

        // Path traversal protection
        if (normalizedPath.includes('..')) {
            throw new SecurityError(
                'Path traversal attempt detected',
                targetPath,
                'PATH_TRAVERSAL'
            );
        }

        // Working directory enforcement
        if (!normalizedPath.startsWith(this.workingDirectory)) {
            throw new SecurityError(
                `Target path is outside working directory: ${normalizedPath}`,
                targetPath,
                'OUTSIDE_WORKING_DIR'
            );
        }

        return true;
    }

    // ==========================================
    // FILE SECURITY CHECKS
    // ==========================================

    checkFileSize(filePath) {
        if (!this.options.enableFileSizeCheck) return true;

        try {
            const stats = fs.statSync(filePath);
            const maxSize = this.options.customMaxFileSize;

            if (stats.size > maxSize) {
                throw new FileSizeError(
                    `File size ${stats.size} bytes exceeds limit ${maxSize} bytes`,
                    filePath,
                    stats.size
                );
            }

            return true;
        } catch (error) {
            if (error instanceof FileSizeError) throw error;
            throw new SecurityError(
                `Cannot check file size: ${error.message}`,
                filePath,
                'STAT_ERROR'
            );
        }
    }

    checkSymlinkSafety(filePath, depth = 0) {
        if (!this.options.enableSymlinkCheck) {
            return { isSymlink: false, target: null, stats: null };
        }

        const MAX_SYMLINK_DEPTH = 10;

        if (depth > MAX_SYMLINK_DEPTH) {
            throw new SymlinkError(
                `Symlink chain too deep (${depth} levels)`,
                filePath,
                'MAX_DEPTH_EXCEEDED'
            );
        }

        try {
            const stats = fs.lstatSync(filePath);

            if (stats.isSymbolicLink()) {
                const linkTarget = fs.readlinkSync(filePath);
                const resolvedTarget = path.resolve(path.dirname(filePath), linkTarget);

                // Validate symlink target
                this.isPathSafe(resolvedTarget);

                // Check if target points outside project
                const projectRoot = this.workingDirectory;
                const relativePath = path.relative(projectRoot, resolvedTarget);

                if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
                    throw new SymlinkError(
                        `Symlink points outside project: ${filePath} -> ${resolvedTarget}`,
                        filePath,
                        resolvedTarget
                    );
                }

                // Recursive check for symlink chains
                if (fs.existsSync(resolvedTarget)) {
                    return this.checkSymlinkSafety(resolvedTarget, depth + 1);
                }

                return { isSymlink: true, target: resolvedTarget, stats };
            }

            return { isSymlink: false, target: null, stats };
        } catch (error) {
            if (error instanceof SymlinkError || error instanceof SecurityError) {
                throw error;
            }

            throw new SecurityError(
                `Symlink safety check failed: ${error.message}`,
                filePath,
                'SYMLINK_CHECK_ERROR'
            );
        }
    }

    // ==========================================
    // COMPREHENSIVE SECURITY VALIDATION
    // ==========================================

    performFullSecurityCheck(filePath, options = {}) {
        const checkOptions = {
            requireWrite: false,
            checkContent: false,
            ...options
        };

        try {
            // 1. Input validation
            this.validateInput(filePath);

            // 2. Path sanitization
            const sanitizedPath = this.sanitizePath(filePath);

            // 3. Path safety check
            this.isPathSafe(sanitizedPath);

            // 4. Symlink safety check
            const symlinkInfo = this.checkSymlinkSafety(sanitizedPath);

            // 5. File size check (if file exists)
            if (fs.existsSync(sanitizedPath)) {
                const stats = fs.statSync(sanitizedPath);
                if (stats.isFile()) {
                    this.checkFileSize(sanitizedPath);
                }
            }

            return {
                success: true,
                sanitizedPath,
                symlinkInfo,
                securityLevel: 'SAFE',
                sessionId: this.sessionId
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    name: error.name,
                    message: error.message,
                    code: error.code,
                    path: error.path
                },
                securityLevel: 'UNSAFE',
                sessionId: this.sessionId
            };
        }
    }
}

// ======================================================================
// PROFESSIONAL LOGGING SYSTEM
// ======================================================================

class ProfessionalLogger {
    constructor(projectName = null, options = {}) {
        this.projectName = projectName || path.basename(process.cwd());
        this.sessionId = this.generateSessionId();
        this.startTime = new Date();

        this.options = {
            enableFileLogging: true,
            enableConsoleLogging: true,
            logLevel: 'INFO', // DEBUG, INFO, WARN, ERROR
            maxLogFileSize: 50 * 1024 * 1024, // 50MB
            keepLogFiles: 30, // days
            includeSystemInfo: true,
            ...options
        };

        this.security = new SecurityManager();
        this.setupLoggingDirectories();
        this.writeSessionHeader();
    }

    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const hash = crypto.createHash('md5').update(`${timestamp}-${random}`).digest('hex').substring(0, 8);
        return `LOG_${timestamp}_${hash}`;
    }

    setupLoggingDirectories() {
        if (!this.options.enableFileLogging) return;

        try {
            // Create main logs directory
            this.logsDir = path.join(process.cwd(), 'logs');
            if (!fs.existsSync(this.logsDir)) {
                fs.mkdirSync(this.logsDir, { recursive: true });
            }

            // Create project-specific directory
            this.projectLogsDir = path.join(this.logsDir, this.projectName);
            if (!fs.existsSync(this.projectLogsDir)) {
                fs.mkdirSync(this.projectLogsDir, { recursive: true });
            }

            // Create session directory
            const now = new Date();
            const dateFolder = now.toISOString().slice(0, 10); // 2025-09-26
            const timeFolder = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // 14-30-45
            this.sessionFolder = `${dateFolder}_${timeFolder}_${this.sessionId.slice(-8)}`;
            this.sessionLogsDir = path.join(this.projectLogsDir, this.sessionFolder);

            if (!fs.existsSync(this.sessionLogsDir)) {
                fs.mkdirSync(this.sessionLogsDir, { recursive: true });
            }

            // Define log files
            this.logFiles = {
                error: path.join(this.sessionLogsDir, 'error.log'),
                debug: path.join(this.sessionLogsDir, 'debug.log'),
                audit: path.join(this.sessionLogsDir, 'audit.log'),
                security: path.join(this.sessionLogsDir, 'security.log'),
                performance: path.join(this.sessionLogsDir, 'performance.log'),
                system: path.join(this.sessionLogsDir, 'system.log'),
                combined: path.join(this.sessionLogsDir, 'combined.log')
            };

            console.log(`\n Logs directory created: ${this.sessionLogsDir}`);
        } catch (error) {
            console.error(`[LOGGER] Failed to setup logging directories: ${error.message}`);
            this.options.enableFileLogging = false;
        }
    }

    writeSessionHeader() {
        if (!this.options.enableFileLogging) return;

        const timestamp = new Date().toISOString();
        const systemInfo = this.options.includeSystemInfo ? this.getSystemInfo() : {};

        const header = [
            '='.repeat(100),
            `SESSION START: ${timestamp}`,
            `Project: ${this.projectName}`,
            `Session ID: ${this.sessionId}`,
            `Node.js: ${process.version}`,
            `Platform: ${process.platform} ${process.arch}`,
            this.options.includeSystemInfo ? `System: ${systemInfo.hostname} | ${systemInfo.totalMemory}GB RAM | ${systemInfo.cpuCount} CPUs` : '',
            `Working Directory: ${process.cwd()}`,
            `Log Level: ${this.options.logLevel}`,
            '='.repeat(100),
            ''
        ].filter(Boolean).join('\n');

        // Write to all log files
        Object.values(this.logFiles).forEach(logFile => {
            try {
                fs.appendFileSync(logFile, header, 'utf8');
            } catch (error) {
                console.error(`[LOGGER] Failed to write session header to ${logFile}: ${error.message}`);
            }
        });
    }

    getSystemInfo() {
        try {
            const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100;
            const freeMemory = Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100;
            const cpuCount = os.cpus().length;
            const uptime = Math.round(os.uptime() / 3600 * 100) / 100;

            return {
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                totalMemory,
                freeMemory,
                cpuCount,
                uptime
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    formatLogEntry(level, category, message, data = null, metadata = {}) {
        const timestamp = new Date().toISOString();
        const processInfo = `PID:${process.pid}`;
        const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

        let entry = [
            `[${timestamp}]`,
            `[${level.toUpperCase()}]`,
            `[${category}]`,
            `[${processInfo}]`,
            `[${memoryUsage}MB]`,
            message
        ].join(' ');

        if (data) {
            entry += `\n  Data: ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`;
        }

        if (Object.keys(metadata).length > 0) {
            entry += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
        }

        entry += '\n';
        return entry;
    }

    writeToFile(logFile, entry) {
        if (!this.options.enableFileLogging || !logFile) return;

        try {
            fs.appendFileSync(logFile, entry, 'utf8');
        } catch (error) {
            console.error(`[LOGGER] Failed to write to log file ${logFile}: ${error.message}`);
        }
    }

    // ==========================================
    // LOGGING METHODS
    // ==========================================

    debug(category, message, data = null, metadata = {}) {
        if (this.shouldLog('DEBUG')) {
            const entry = this.formatLogEntry('DEBUG', category, message, data, metadata);
            this.writeToFile(this.logFiles?.debug, entry);
            this.writeToFile(this.logFiles?.combined, entry);

            if (this.options.enableConsoleLogging && this.options.logLevel === 'DEBUG') {
                console.debug(`[DEBUG] ${category}: ${message}`);
            }
        }
    }

    info(category, message, data = null, metadata = {}) {
        if (this.shouldLog('INFO')) {
            const entry = this.formatLogEntry('INFO', category, message, data, metadata);
            this.writeToFile(this.logFiles?.debug, entry);
            this.writeToFile(this.logFiles?.combined, entry);

            if (this.options.enableConsoleLogging) {
                console.info(`[INFO] ${category}: ${message}`);
            }
        }
    }

    warn(category, message, data = null, metadata = {}) {
        if (this.shouldLog('WARN')) {
            const entry = this.formatLogEntry('WARN', category, message, data, metadata);
            this.writeToFile(this.logFiles?.debug, entry);
            this.writeToFile(this.logFiles?.combined, entry);

            if (this.options.enableConsoleLogging) {
                console.warn(`[WARN] ${category}: ${message}`);
            }
        }
    }

    error(category, message, error = null, data = null, metadata = {}) {
        const errorData = { ...data };
        if (error) {
            errorData.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code || null
            };
        }

        const entry = this.formatLogEntry('ERROR', category, message, errorData, metadata);
        this.writeToFile(this.logFiles?.error, entry);
        this.writeToFile(this.logFiles?.combined, entry);

        if (this.options.enableConsoleLogging) {
            console.error(`[ERROR] ${category}: ${message}`);
            if (error && this.options.logLevel === 'DEBUG') {
                console.error(error.stack);
            }
        }
    }

    security(action, details = null, severity = 'INFO', metadata = {}) {
        const securityData = {
            action,
            severity,
            sessionId: this.sessionId,
            workingDirectory: process.cwd(),
            userAgent: process.env.USER || process.env.USERNAME || 'unknown',
            timestamp: new Date().toISOString(),
            ...details
        };

        const entry = this.formatLogEntry('SECURITY', 'SECURITY_EVENT', action, securityData, metadata);
        this.writeToFile(this.logFiles?.security, entry);
        this.writeToFile(this.logFiles?.combined, entry);

        if (severity === 'CRITICAL' || severity === 'HIGH') {
            this.error('SECURITY', `Security event: ${action}`, null, securityData, metadata);
        }
    }

    audit(action, filePath, details = null, metadata = {}) {
        const auditData = {
            action,
            filePath,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            ...details
        };

        const entry = this.formatLogEntry('AUDIT', 'FILE_OPERATION', `${action}: ${filePath}`, auditData, metadata);
        this.writeToFile(this.logFiles?.audit, entry);
        this.writeToFile(this.logFiles?.combined, entry);
    }

    performance(operation, duration, details = null, metadata = {}) {
        const perfData = {
            operation,
            duration,
            sessionId: this.sessionId,
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            ...details
        };

        const entry = this.formatLogEntry('PERFORMANCE', operation, `Duration: ${duration}ms`, perfData, metadata);
        this.writeToFile(this.logFiles?.performance, entry);
        this.writeToFile(this.logFiles?.combined, entry);
    }

    system(event, details = null, metadata = {}) {
        const systemData = {
            event,
            sessionId: this.sessionId,
            systemInfo: this.getSystemInfo(),
            processInfo: {
                pid: process.pid,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            },
            ...details
        };

        const entry = this.formatLogEntry('SYSTEM', 'SYSTEM_EVENT', event, systemData, metadata);
        this.writeToFile(this.logFiles?.system, entry);
        this.writeToFile(this.logFiles?.combined, entry);
    }

    shouldLog(level) {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const currentLevelIndex = levels.indexOf(this.options.logLevel);
        const messageLevel = levels.indexOf(level);
        return messageLevel >= currentLevelIndex;
    }

    // ==========================================
    // SESSION MANAGEMENT
    // ==========================================

    generateReport() {
        const duration = Date.now() - this.startTime.getTime();
        const systemInfo = this.getSystemInfo();

        const report = {
            session: {
                id: this.sessionId,
                projectName: this.projectName,
                startTime: this.startTime.toISOString(),
                duration: `${Math.round(duration / 1000)}s`,
                endTime: new Date().toISOString()
            },
            system: systemInfo,
            logging: {
                enabled: this.options.enableFileLogging,
                level: this.options.logLevel,
                location: this.sessionLogsDir,
                files: this.logFiles
            },
            security: {
                sessionId: this.security.sessionId,
                workingDirectory: this.security.workingDirectory,
                options: this.security.options
            }
        };

        return report;
    }

    close() {
        try {
            const report = this.generateReport();

            // Write final session report
            if (this.options.enableFileLogging) {
                const reportFile = path.join(this.sessionLogsDir, 'session-report.json');
                fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');

                const footer = [
                    '',
                    '='.repeat(100),
                    `SESSION END: ${new Date().toISOString()}`,
                    `Duration: ${report.session.duration}`,
                    `Report: ${reportFile}`,
                    '='.repeat(100),
                    ''
                ].join('\n');

                Object.values(this.logFiles).forEach(logFile => {
                    try {
                        fs.appendFileSync(logFile, footer, 'utf8');
                    } catch (error) {
                        console.error(`[LOGGER] Failed to write session footer to ${logFile}: ${error.message}`);
                    }
                });

                console.log(`\n Session report saved: ${reportFile}`);
            }

            this.system('SESSION_END', { report });
        } catch (error) {
            console.error(`[LOGGER] Failed to close session: ${error.message}`);
        }
    }
}

// ======================================================================
// TOKENIZER SECURITY MANAGER
// ======================================================================

class TokenizerSecurityManager {
    constructor(options = {}) {
        this.options = {
            maxDepth: SECURITY_CONFIG.MAX_DEPTH,
            maxTokens: SECURITY_CONFIG.MAX_TOKENS,
            maxParsingTime: SECURITY_CONFIG.MAX_PARSING_TIME,
            enableTimeoutProtection: true,
            enableComplexityCheck: true,
            enableMemoryMonitoring: true,
            memoryThreshold: 512 * 1024 * 1024, // 512MB
            ...options
        };

        this.logger = new ProfessionalLogger('TokenizerSecurity');
        this.reset();
    }

    reset() {
        this.currentDepth = 0;
        this.tokenCount = 0;
        this.startTime = null;
        this.initialMemory = null;
        this.complexityScore = 0;
    }

    startParsing(filePath = 'unknown') {
        this.reset();
        this.startTime = Date.now();
        this.initialMemory = process.memoryUsage().heapUsed;
        this.filePath = filePath;

        this.logger.debug('TOKENIZER_START', `Starting tokenization: ${filePath}`, {
            maxDepth: this.options.maxDepth,
            maxTokens: this.options.maxTokens,
            maxTime: this.options.maxParsingTime
        });
    }

    checkComplexity() {
        if (!this.options.enableComplexityCheck) return;

        // Check parsing time
        if (this.options.enableTimeoutProtection && this.startTime) {
            const elapsed = Date.now() - this.startTime;
            if (elapsed > this.options.maxParsingTime) {
                throw new SecurityError(
                    `Parsing timeout: ${elapsed}ms > ${this.options.maxParsingTime}ms`,
                    this.filePath,
                    'PARSING_TIMEOUT'
                );
            }
        }

        // Check token count
        if (this.tokenCount > this.options.maxTokens) {
            throw new SecurityError(
                `Token limit exceeded: ${this.tokenCount} > ${this.options.maxTokens}`,
                this.filePath,
                'TOKEN_LIMIT_EXCEEDED'
            );
        }

        // Check nesting depth
        if (this.currentDepth > this.options.maxDepth) {
            throw new SecurityError(
                `Nesting depth exceeded: ${this.currentDepth} > ${this.options.maxDepth}`,
                this.filePath,
                'DEPTH_LIMIT_EXCEEDED'
            );
        }

        // Check memory usage
        if (this.options.enableMemoryMonitoring && this.initialMemory) {
            const currentMemory = process.memoryUsage().heapUsed;
            const memoryDiff = currentMemory - this.initialMemory;

            if (memoryDiff > this.options.memoryThreshold) {
                throw new SecurityError(
                    `Memory usage exceeded: ${Math.round(memoryDiff / 1024 / 1024)}MB > ${Math.round(this.options.memoryThreshold / 1024 / 1024)}MB`,
                    this.filePath,
                    'MEMORY_LIMIT_EXCEEDED'
                );
            }
        }
    }

    enterScope() {
        this.currentDepth++;
        this.complexityScore += this.currentDepth;
        this.checkComplexity();
    }

    exitScope() {
        if (this.currentDepth > 0) {
            this.currentDepth--;
        }
    }

    addToken(tokenType = 'unknown') {
        this.tokenCount++;

        // Add complexity based on token type
        const complexityWeights = {
            'function': 2,
            'class': 3,
            'loop': 2,
            'conditional': 1,
            'operator': 0.5,
            'unknown': 1
        };

        this.complexityScore += complexityWeights[tokenType] || 1;
        this.checkComplexity();
    }

    finishParsing() {
        const duration = this.startTime ? Date.now() - this.startTime : 0;
        const memoryUsed = this.initialMemory
            ? process.memoryUsage().heapUsed - this.initialMemory
            : 0;

        const report = {
            filePath: this.filePath,
            duration,
            tokenCount: this.tokenCount,
            maxDepth: Math.max(this.currentDepth, 0),
            complexityScore: this.complexityScore,
            memoryUsed: Math.round(memoryUsed / 1024 / 1024), // MB
            success: true
        };

        this.logger.performance('TOKENIZER_COMPLETE', duration, report);
        return report;
    }

    handleError(error) {
        const duration = this.startTime ? Date.now() - this.startTime : 0;

        const report = {
            filePath: this.filePath,
            duration,
            tokenCount: this.tokenCount,
            maxDepth: this.currentDepth,
            complexityScore: this.complexityScore,
            error: error.message,
            success: false
        };

        this.logger.error('TOKENIZER_ERROR', `Tokenization failed: ${this.filePath}`, error, report);
        return report;
    }
}

// ======================================================================
// EXPORTS
// ======================================================================

module.exports = {
    // Main classes
    ProfessionalLogger,
    SecurityManager,
    TokenizerSecurityManager,

    // Error classes
    SecurityError,
    PathValidationError,
    FileSizeError,
    SymlinkError,

    // Configuration
    SECURITY_CONFIG,

    // Utility function for quick setup
    createLogger: (projectName, options = {}) => new ProfessionalLogger(projectName, options),
    createSecurityManager: (options = {}) => new SecurityManager(options),
    createTokenizerSecurity: (options = {}) => new TokenizerSecurityManager(options)
};

// ======================================================================
// CLI USAGE EXAMPLE (when run directly)
// ======================================================================

if (require.main === module) {
    console.log('='.repeat(80));
    console.log('CHAHUADEV PROFESSIONAL LOGGING & SECURITY SYSTEM v3.0');
    console.log('='.repeat(80));
    console.log();

    // Example usage
    const logger = new ProfessionalLogger('test-project', { logLevel: 'DEBUG' });
    const security = new SecurityManager();

    logger.info('SYSTEM', 'Professional Logging & Security System initialized');
    logger.debug('TEST', 'This is a debug message', { test: true });
    logger.warn('TEST', 'This is a warning message');
    logger.error('TEST', 'This is an error message', new Error('Test error'));

    // Test security
    try {
        const result = security.performFullSecurityCheck(__filename);
        logger.security('SELF_CHECK', result, 'INFO');
    } catch (error) {
        logger.security('SELF_CHECK_FAILED', { error: error.message }, 'ERROR');
    }

    // Close logger
    setTimeout(() => {
        logger.close();
        console.log('\nLogging session completed. Check the logs/ directory for output.');
    }, 1000);
}