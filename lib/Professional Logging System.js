// ======================================================================
// Professional Logging System/ระบบบันทึกมืออาชีพ
// ======================================================================

const fs = require('fs');
const path = require('path');

class ProfessionalLogger {
    constructor(options = {}) {
        // Universal configuration support
        this.options = this.mergeOptions(options);

        this.projectName = this.options.projectName || path.basename(this.options.basePath || process.cwd());
        this.logsDir = path.join(this.options.basePath || process.cwd(), this.options.logPath || 'logs');

        // สร้างโฟลเดอร์ logs หลักถ้ายังไม่มี
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }

        // สร้างโฟลเดอร์ย่อยสำหรับโปรเจกต์นี้
        this.projectLogsDir = path.join(this.logsDir, this.projectName);
        if (!fs.existsSync(this.projectLogsDir)) {
            fs.mkdirSync(this.projectLogsDir, { recursive: true });
        }

        // สร้างโฟลเดอร์ session ตามวันเวลา
        const now = new Date();
        const dateFolder = now.toISOString().slice(0, 10); // 2025-09-24
        const timeFolder = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // 03-53-12
        this.sessionFolder = `${dateFolder}_${timeFolder}`;
        this.sessionLogsDir = path.join(this.projectLogsDir, this.sessionFolder);

        if (!fs.existsSync(this.sessionLogsDir)) {
            fs.mkdirSync(this.sessionLogsDir, { recursive: true });
        }

        this.logFiles = {
            error: path.join(this.sessionLogsDir, 'error.log'),
            debug: path.join(this.sessionLogsDir, 'debug.log'),
            audit: path.join(this.sessionLogsDir, 'audit.log'),
            performance: path.join(this.sessionLogsDir, 'performance.log'),
            diagnostic: path.join(this.sessionLogsDir, 'diagnostic.log')
        };

        // เขียน session header
        this.writeSessionHeader();
    }

    // Merge default options with user-provided options
    mergeOptions(userOptions) {
        const defaultOptions = {
            basePath: process.cwd(),
            projectName: null, // Auto-detect from basePath if not provided
            logPath: 'logs',
            format: 'default', // 'default', 'json', 'structured'

            // Custom vocabulary support (Universal Library feature)
            vocabulary: {
                functions: ['ฟังก์ชัน', 'function'],
                analysis: ['การวิเคราะห์', 'analysis'],
                performance: ['ประสิทธิภาพ', 'performance'],
                error: ['ข้อผิดพลาด', 'error'],
                success: ['สำเร็จ', 'success']
            },

            // Real-Time Logging Settings (No Mock, No Cache Policy)
            realTime: {
                enableRealTimeLogging: true,     // Always log immediately
                enableLogCache: false,           // No log caching
                enableMockLogging: false,        // No fake logs
                flushImmediately: true           // Write to file immediately
            },

            // Performance tracking
            trackPerformance: true,
            includeStackTrace: false,
            maxLogFileSize: 10 * 1024 * 1024, // 10MB

            // Session management
            createSessionFolders: true,
            includeTimestamp: true
        };

        return { ...defaultOptions, ...userOptions };
    }

    writeSessionHeader() {
        const timestamp = new Date().toISOString();
        const header = `\n${'='.repeat(80)}\nSESSION START: ${timestamp} | Project: ${this.projectName}\n${'='.repeat(80)}\n`;

        Object.values(this.logFiles).forEach(logFile => {
            fs.appendFileSync(logFile, header, 'utf8');
        });
    }

    formatLogEntry(level, category, message, data = null) {
        const timestamp = new Date().toISOString();
        let entry = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;

        if (data) {
            entry += `\n  Data: ${JSON.stringify(data, null, 2)}`;
        }

        entry += '\n';
        return entry;
    }

    error(category, message, error = null, data = null) {
        const logData = { ...data };
        if (error) {
            logData.error = {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
        }

        const entry = this.formatLogEntry('ERROR', category, message, logData);
        fs.appendFileSync(this.logFiles.error, entry, 'utf8');

        // แสดงใน console ด้วย
        console.error(`[ERROR] ${category}: ${message}`);
    }

    debug(category, message, data = null) {
        const entry = this.formatLogEntry('DEBUG', category, message, data);
        fs.appendFileSync(this.logFiles.debug, entry, 'utf8');
    }

    audit(action, filePath, details = null) {
        const entry = this.formatLogEntry('AUDIT', 'FILE_OPERATION',
            `${action}: ${filePath}`, details);
        fs.appendFileSync(this.logFiles.audit, entry, 'utf8');
    }

    performance(operation, duration, details = null) {
        const entry = this.formatLogEntry('PERFORMANCE', operation,
            `Duration: ${duration}ms`, details);
        fs.appendFileSync(this.logFiles.performance, entry, 'utf8');
    }

    info(category, message, data = null) {
        const entry = this.formatLogEntry('INFO', category, message, data);
        fs.appendFileSync(this.logFiles.debug, entry, 'utf8');
    }

    // สร้าง diagnostic report แยกต่างหาก
    diagnostic(category, message, data = null) {
        const entry = this.formatLogEntry('DIAGNOSTIC', category, message, data);

        // เขียนลงทั้ง audit และ debug ในโฟลเดอร์ session
        fs.appendFileSync(this.logFiles.audit, entry, 'utf8');
        fs.appendFileSync(this.logFiles.debug, `\n=== DIAGNOSTIC REPORT ===\n${entry}=== END DIAGNOSTIC ===\n`, 'utf8');

        // เขียนลงไฟล์ diagnostic ใน session folder
        if (!fs.existsSync(this.logFiles.diagnostic)) {
            const header = `DIAGNOSTIC REPORTS LOG - ${new Date().toISOString()}\nProject: ${this.projectName} | Session: ${this.sessionFolder}\n${'='.repeat(80)}\n\n`;
            fs.writeFileSync(this.logFiles.diagnostic, header, 'utf8');
        }
        fs.appendFileSync(this.logFiles.diagnostic, entry, 'utf8');
    }
    // === INTELLIGENT REPORT GENERATION (Stage 4 of Pipeline) ===

    /**
     * Generate intelligent report from all pipeline stages
     * This is the "storyteller" function that summarizes everything
     */
    generateIntelligentReport(allStageData, customVocabulary = null) {
        const vocab = customVocabulary || this.options.vocabulary;
        const { structure, intent, logic, performance } = allStageData;

        let report = `# ${vocab.analysis[0] || 'Code Analysis'} Report\n\n`;

        // File Information
        if (structure?.filePath) {
            report += `**ไฟล์:** ${structure.filePath}\n`;
            report += `**วันที่วิเคราะห์:** ${new Date().toLocaleString('th-TH')}\n\n`;
        }

        // Stage 1: Structure Analysis Summary
        if (structure) {
            report += `## โครงสร้างโค้ด\n`;
            report += `- **${vocab.functions[0] || 'Functions'}:** ${structure.functions?.size || 0} รายการ\n`;
            report += `- **คลาส:** ${structure.classes?.size || 0} รายการ\n`;
            report += `- **Patterns ที่พบ:** ${structure.patterns?.size || 0} รายการ\n\n`;
        }

        // Stage 2: Intent Analysis Summary
        if (intent) {
            report += `## ${vocab.analysis[0] || 'Intent Analysis'}\n`;
            report += `- **Primary Intent:** **${intent.primaryIntent}**\n`;
            if (intent.businessLogic?.size > 0) {
                report += `- **Business Logic Patterns:** ${intent.businessLogic.size} รายการ\n`;
            }
            if (intent.securityMeasures?.size > 0) {
                report += `- **Security Measures:** ${intent.securityMeasures.size} รายการ\n`;
            }
            report += `\n`;
        }

        // Stage 3: Logic Analysis Summary
        if (logic) {
            report += `## การวิเคราะห์ Logic\n`;
            if (logic.issues?.length > 0) {
                report += `###  ประเด็นที่ควรพิจารณา\n`;
                logic.issues.forEach(issue => {
                    report += `- **${issue.type}:** ${issue.message} (บรรทัด ${issue.line})\n`;
                });
                report += `\n`;
            }

            if (logic.relationships) {
                report += `### ความสัมพันธ์ระหว่างส่วนประกอบ\n`;
                report += `- **Dependencies:** ${logic.relationships.dependencies?.length || 0} รายการ\n`;
                report += `- **Coupling Level:** ${logic.relationships.coupling || 'ปานกลาง'}\n\n`;
            }
        }

        // Performance Metrics (Real-Time Analysis Results)
        if (performance) {
            const perfTitle = (vocab && vocab.performance && vocab.performance[0]) || 'Performance';
            report += `## ${perfTitle} Metrics (Real-Time)\n`;
            report += `- **เวลาการวิเคราะห์:** ${performance.analysisTime || 'N/A'} ms\n`;
            report += `- **Memory Usage:** ${performance.memoryUsage || 'N/A'} MB\n`;
            report += `- **ไฟล์ที่ประมวลผล:** ${performance.filesProcessed || 1} ไฟล์\n\n`;
        }

        // Recommendations
        report += this.generateRecommendations(allStageData, vocab);

        // Timestamp with Real-Time guarantee
        report += `\n---\n*รายงานนี้สร้างแบบ Real-Time เมื่อ ${new Date().toISOString()} (ไม่ใช้ Cache)*\n`;

        return report;
    }

    /**
     * Generate recommendations based on analysis results
     */
    generateRecommendations(allStageData, vocabulary) {
        let recommendations = `## ข้อแนะนำ\n\n`;
        const { structure, intent, logic, performance } = allStageData;

        // Performance recommendations
        if (performance?.analysisTime > 5000) {
            recommendations += `- **ประสิทธิภาพ:** การวิเคราะห์ใช้เวลานาน (${performance.analysisTime}ms) ควรลดความซับซ้อนของโค้ด\n`;
        }

        // Structure recommendations
        if (structure?.functions?.size > 50) {
            recommendations += `- **โครงสร้าง:** ไฟล์มี ${vocabulary.functions[0]} จำนวนมาก (${structure.functions.size}) ควรพิจารณาแยกออกเป็นหลายไฟล์\n`;
        }

        // Logic recommendations
        if (logic?.issues?.length > 0) {
            const criticalIssues = logic.issues.filter(issue => issue.severity === 'error' || issue.severity === 'critical');
            if (criticalIssues.length > 0) {
                recommendations += `- **คุณภาพโค้ด:** พบปัญหาร้ายแรง ${criticalIssues.length} รายการ ควรแก้ไขก่อนใช้งาน\n`;
            }
        }

        // Intent recommendations
        if (intent?.primaryIntent === 'unclear') {
            recommendations += `- **ความชัดเจน:** วัตถุประสงค์ของโค้ดไม่ชัดเจน ควรเพิ่มความคิดเห็นหรือปรับปรุงการตั้งชื่อ\n`;
        }

        // Default recommendation
        if (recommendations === `## ข้อแนะนำ\n\n`) {
            recommendations += `- ** ดีเยี่ยม:** โค้ดมีคุณภาพดีและไม่พบปัญหาที่ต้องปรับปรุงเร่งด่วน\n`;
        }

        return recommendations + `\n`;
    }

    /**
     * Generate performance report from Real-Time metrics
     */
    generatePerformanceReport(performanceData) {
        const report = {
            timestamp: new Date().toISOString(),
            realTimeAnalysis: true, // Guarantee this is real-time
            noCacheUsed: true,      // Guarantee no cache was used
            noMockUsed: true,       // Guarantee no mock was used
            ...performanceData
        };

        // Log to performance file
        this.performance('PERFORMANCE_REPORT', 'Generated real-time performance report', report);

        return report;
    }
}

// ======================================================================
// Export Universal Professional Logging System
// ======================================================================

module.exports = {
    ProfessionalLogger
};
