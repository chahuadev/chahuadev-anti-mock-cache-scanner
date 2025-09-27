#!/usr/bin/env node
// ======================================================================
// CHAHUADEV HTML REPORT GENERATOR v1.0 - INTERACTIVE REPORT SYSTEM
// ======================================================================
// Purpose: Generate beautiful, interactive HTML reports for security scan results
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// ======================================================================

const fs = require('fs');
const path = require('path');

class HTMLReportGenerator {
    constructor(logger) {
        this.logger = logger;
        this.template = this.getHTMLTemplate();
        this.cssStyles = this.getCSSStyles();
        this.jsScripts = this.getJavaScripts();
    }

    /**
     * Generate comprehensive HTML report
     */
    async generateReport(scanResults, outputPath, config = {}) {
        try {
            const reportData = this.processResults(scanResults);
            const htmlContent = this.renderReport(reportData, config);

            fs.writeFileSync(outputPath, htmlContent, 'utf8');

            this.logger.info('HTML_REPORT_GENERATED', {
                path: outputPath,
                violationsCount: reportData.totalViolations,
                filesScanned: reportData.filesScanned,
                size: this.getFileSize(outputPath)
            });

            return {
                success: true,
                path: outputPath,
                url: `file://${path.resolve(outputPath)}`,
                summary: reportData.summary
            };

        } catch (error) {
            this.logger.error('HTML_REPORT_ERROR', {
                error: error.message,
                outputPath
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process scan results for report generation
     */
    processResults(scanResults) {
        const violations = scanResults.violations || [];
        const files = scanResults.files || [];

        // Group violations by category
        const violationsByCategory = this.groupBy(violations, 'category');

        // Group violations by severity
        const violationsBySeverity = this.groupBy(violations, 'severity');

        // Group violations by file
        const violationsByFile = this.groupBy(violations, 'filePath');

        // Calculate statistics
        const stats = {
            totalViolations: violations.length,
            filesScanned: files.length,
            filesWithViolations: Object.keys(violationsByFile).length,
            categories: Object.keys(violationsByCategory),
            severityBreakdown: Object.keys(violationsBySeverity).map(severity => ({
                severity,
                count: violationsBySeverity[severity].length,
                percentage: Math.round((violationsBySeverity[severity].length / violations.length) * 100)
            }))
        };

        return {
            scanResults,
            violations,
            violationsByCategory,
            violationsBySeverity,
            violationsByFile,
            summary: stats,
            totalViolations: violations.length,
            filesScanned: files.length,
            timestamp: new Date().toISOString(),
            reportId: this.generateReportId()
        };
    }

    /**
     * Render complete HTML report
     */
    renderReport(data, config) {
        const {
            violations,
            violationsByCategory,
            violationsBySeverity,
            violationsByFile,
            summary,
            timestamp,
            reportId
        } = data;

        return this.template
            .replace('{{TITLE}}', config.title || 'Chahuadev Security Scan Report')
            .replace('{{CSS_STYLES}}', this.cssStyles)
            .replace('{{JS_SCRIPTS}}', this.jsScripts)
            .replace('{{REPORT_ID}}', reportId)
            .replace('{{TIMESTAMP}}', new Date(timestamp).toLocaleString())
            .replace('{{SUMMARY_SECTION}}', this.renderSummarySection(summary))
            .replace('{{SEVERITY_CHART}}', this.renderSeverityChart(violationsBySeverity))
            .replace('{{CATEGORY_CHART}}', this.renderCategoryChart(violationsByCategory))
            .replace('{{VIOLATIONS_TABLE}}', this.renderViolationsTable(violations))
            .replace('{{FILES_SECTION}}', this.renderFilesSection(violationsByFile))
            .replace('{{DETAILS_SECTION}}', this.renderDetailsSection(violations));
    }

    /**
     * Render summary section
     */
    renderSummarySection(summary) {
        const criticalCount = summary.severityBreakdown.find(s => s.severity === 'CRITICAL')?.count || 0;
        const highCount = summary.severityBreakdown.find(s => s.severity === 'HIGH')?.count || 0;

        return `
            <div class="summary-grid">
                <div class="summary-card ${criticalCount > 0 ? 'critical' : ''}">
                    <div class="summary-number">${summary.totalViolations}</div>
                    <div class="summary-label">Total Violations</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${summary.filesScanned}</div>
                    <div class="summary-label">Files Scanned</div>
                </div>
                <div class="summary-card ${criticalCount > 0 ? 'critical' : ''}">
                    <div class="summary-number">${criticalCount}</div>
                    <div class="summary-label">Critical Issues</div>
                </div>
                <div class="summary-card ${highCount > 0 ? 'high' : ''}">
                    <div class="summary-number">${highCount}</div>
                    <div class="summary-label">High Priority</div>
                </div>
            </div>
        `;
    }

    /**
     * Render severity distribution chart
     */
    renderSeverityChart(violationsBySeverity) {
        const chartData = Object.keys(violationsBySeverity).map(severity => {
            return {
                severity,
                count: violationsBySeverity[severity].length,
                color: this.getSeverityColor(severity)
            };
        });

        const chartItems = chartData.map(item => `
            <div class="chart-item" style="background-color: ${item.color}">
                <span class="chart-label">${item.severity}</span>
                <span class="chart-value">${item.count}</span>
            </div>
        `).join('');

        return `
            <div class="chart-container">
                <h3>Violations by Severity</h3>
                <div class="severity-chart">
                    ${chartItems}
                </div>
            </div>
        `;
    }

    /**
     * Render category distribution chart
     */
    renderCategoryChart(violationsByCategory) {
        const chartItems = Object.keys(violationsByCategory).map(category => `
            <div class="category-item">
                <div class="category-name">${category.replace(/_/g, ' ')}</div>
                <div class="category-count">${violationsByCategory[category].length}</div>
                <div class="category-bar">
                    <div class="category-fill" style="width: ${this.getPercentage(violationsByCategory[category].length, Object.values(violationsByCategory).flat().length)}%"></div>
                </div>
            </div>
        `).join('');

        return `
            <div class="chart-container">
                <h3>Violations by Category</h3>
                <div class="category-chart">
                    ${chartItems}
                </div>
            </div>
        `;
    }

    /**
     * Render violations table
     */
    renderViolationsTable(violations) {
        const rows = violations.slice(0, 100).map(violation => `
            <tr class="violation-row ${violation.severity.toLowerCase()}">
                <td><span class="severity-badge ${violation.severity.toLowerCase()}">${violation.severity}</span></td>
                <td>${violation.category.replace(/_/g, ' ')}</td>
                <td class="file-path" title="${violation.filePath}">${this.shortenPath(violation.filePath)}</td>
                <td>${violation.line}:${violation.column || 0}</td>
                <td class="violation-description">${violation.description}</td>
                <td class="violation-actions">
                    <button onclick="showViolationDetails('${violation.type}', ${violation.line})" class="btn-details">Details</button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="table-container">
                <table class="violations-table">
                    <thead>
                        <tr>
                            <th>Severity</th>
                            <th>Category</th>
                            <th>File</th>
                            <th>Line:Col</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                ${violations.length > 100 ? `<div class="table-note">Showing first 100 violations of ${violations.length} total</div>` : ''}
            </div>
        `;
    }

    /**
     * Render files section
     */
    renderFilesSection(violationsByFile) {
        const fileItems = Object.keys(violationsByFile).slice(0, 50).map(filePath => {
            const fileViolations = violationsByFile[filePath];
            const criticalCount = fileViolations.filter(v => v.severity === 'CRITICAL').length;

            return `
                <div class="file-item ${criticalCount > 0 ? 'has-critical' : ''}">
                    <div class="file-header">
                        <span class="file-name" title="${filePath}">${path.basename(filePath)}</span>
                        <span class="file-violations">${fileViolations.length} issues</span>
                    </div>
                    <div class="file-path">${filePath}</div>
                    <div class="file-severity-breakdown">
                        ${this.renderFileSeverityBreakdown(fileViolations)}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="files-section">
                <h3>Files with Violations</h3>
                <div class="files-grid">
                    ${fileItems}
                </div>
            </div>
        `;
    }

    /**
     * Render details section
     */
    renderDetailsSection(violations) {
        return `
            <div id="details-modal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="closeDetailsModal()"></span>
                    <div id="details-content">
                        <!-- Dynamic content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get HTML template
     */
    getHTMLTemplate() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>{{CSS_STYLES}}</style>
</head>
<body>
    <div class="container">
        <header class="report-header">
            <h1>{{TITLE}}</h1>
            <div class="report-meta">
                <span class="report-id">Report ID: {{REPORT_ID}}</span>
                <span class="report-timestamp">Generated: {{TIMESTAMP}}</span>
            </div>
        </header>

        <main>
            <section class="summary-section">
                <h2>Summary</h2>
                {{SUMMARY_SECTION}}
            </section>

            <section class="charts-section">
                <div class="charts-grid">
                    {{SEVERITY_CHART}}
                    {{CATEGORY_CHART}}
                </div>
            </section>

            <section class="violations-section">
                <h2>Violations</h2>
                {{VIOLATIONS_TABLE}}
            </section>

            <section class="files-section">
                {{FILES_SECTION}}
            </section>
        </main>

        {{DETAILS_SECTION}}
    </div>

    <script>{{JS_SCRIPTS}}</script>
</body>
</html>
        `;
    }

    /**
     * Get CSS styles
     */
    getCSSStyles() {
        return `
            /* CSS styles would go here - truncated for brevity */
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
            .summary-card { background: white; padding: 20px; border-radius: 8px; text-align: center; }
            .critical { border-left: 4px solid #dc3545; }
            .high { border-left: 4px solid #fd7e14; }
            /* More styles... */
        `;
    }

    /**
     * Get JavaScript functionality
     */
    getJavaScripts() {
        return `
            function showViolationDetails(type, line) {
                // Show violation details in modal
                console.log('Show details for:', type, line);
            }
            
            function closeDetailsModal() {
                document.getElementById('details-modal').style.display = 'none';
            }
            
            // More JavaScript functionality...
        `;
    }

    // Helper methods
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) result[group] = [];
            result[group].push(item);
            return result;
        }, {});
    }

    getSeverityColor(severity) {
        const colors = {
            'CRITICAL': '#dc3545',
            'HIGH': '#fd7e14',
            'MEDIUM': '#ffc107',
            'LOW': '#28a745'
        };
        return colors[severity] || '#6c757d';
    }

    getPercentage(value, total) {
        return Math.round((value / total) * 100);
    }

    shortenPath(filePath) {
        const parts = filePath.split(path.sep);
        return parts.length > 3 ? `.../${parts.slice(-3).join('/')}` : filePath;
    }

    renderFileSeverityBreakdown(violations) {
        const breakdown = this.groupBy(violations, 'severity');
        return Object.keys(breakdown).map(severity =>
            `<span class="severity-count ${severity.toLowerCase()}">${breakdown[severity].length} ${severity}</span>`
        ).join(' ');
    }

    generateReportId() {
        return `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getFileSize(filePath) {
        const stats = fs.statSync(filePath);
        return Math.round(stats.size / 1024) + ' KB';
    }
}

module.exports = HTMLReportGenerator;