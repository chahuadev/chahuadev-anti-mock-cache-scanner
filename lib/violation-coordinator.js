#!/usr/bin/env node
// ======================================================================
// CHAHUADEV VIOLATION COORDINATOR v1.0 - INTEGRATED ANALYSIS SYSTEM
// ======================================================================
// Purpose: Coordinate between Security Patterns and AI Analysis to eliminate redundancy
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// ======================================================================

class ViolationCoordinator {
    constructor(aiAnalyzer, logger) {
        this.aiAnalyzer = aiAnalyzer;
        this.logger = logger;
        this.processedViolations = new Map();
        this.enhancementCache = new Map();
    }

    /**
     * Enhanced Violation Processing Pipeline
     * Phase 1: Primary Pattern Detection (from Security Patterns)
     * Phase 2: AI Enhancement & Deep Analysis
     * Phase 3: Deduplication & Context Enrichment
     */
    async processViolation(violation, codeContext) {
        try {
            // Generate unique violation signature to prevent duplicates
            const violationSignature = this.generateViolationSignature(violation);

            if (this.processedViolations.has(violationSignature)) {
                // Return cached enhanced violation if already processed
                return this.processedViolations.get(violationSignature);
            }

            // Phase 1: Basic violation already detected by Security Patterns
            let enhancedViolation = { ...violation };

            // Phase 2: AI Enhancement (only when needed)
            if (this.shouldEnhanceWithAI(violation)) {
                const aiEnhancement = await this.getAIEnhancement(violation, codeContext);
                enhancedViolation = this.mergeAIEnhancement(enhancedViolation, aiEnhancement);

                this.logger.debug('VIOLATION_AI_ENHANCED', {
                    type: violation.type,
                    originalSeverity: violation.severity,
                    enhancedSeverity: enhancedViolation.severity,
                    aiConfidence: aiEnhancement.confidence
                });
            }

            // Phase 3: Context Enrichment
            enhancedViolation = this.enrichWithContext(enhancedViolation, codeContext);

            // Cache the result
            this.processedViolations.set(violationSignature, enhancedViolation);

            return enhancedViolation;

        } catch (error) {
            this.logger.error('VIOLATION_PROCESSING_ERROR', {
                violation: violation.type,
                error: error.message
            });
            return violation; // Return original violation if enhancement fails
        }
    }

    /**
     * Generate unique signature for violation to prevent duplicates
     */
    generateViolationSignature(violation) {
        const key = `${violation.type}_${violation.line}_${violation.column}_${violation.filePath}`;
        return require('crypto').createHash('md5').update(key).digest('hex');
    }

    /**
     * Determine if violation needs AI enhancement
     * Only enhance complex violations that benefit from deep analysis
     */
    shouldEnhanceWithAI(violation) {
        const complexTypes = [
            'MOCK_IMPLEMENTATION',
            'CACHE_OPERATIONS',
            'PERFORMANCE_VIOLATIONS',
            'EVAL_USAGE',
            'ASYNC_OPERATIONS'
        ];

        return complexTypes.includes(violation.category) ||
            violation.severity === 'CRITICAL' ||
            violation.type.includes('COMPLEX');
    }

    /**
     * Get AI Enhancement for specific violation
     * Focus on deep context analysis rather than pattern matching
     */
    async getAIEnhancement(violation, codeContext) {
        const cacheKey = `${violation.type}_${violation.line}`;

        if (this.enhancementCache.has(cacheKey)) {
            return this.enhancementCache.get(cacheKey);
        }

        try {
            // AI focuses on ENHANCEMENT, not duplication
            const enhancement = await this.aiAnalyzer.analyzeViolationContext({
                violation: violation,
                codeContext: codeContext,
                focusArea: 'ENHANCEMENT', // Not pattern matching!
                analysisType: 'DEEP_CONTEXT'
            });

            const result = {
                confidence: enhancement.confidence || 0.8,
                riskLevel: this.calculateRiskLevel(violation, enhancement),
                businessImpact: enhancement.businessImpact,
                suggestedFix: enhancement.suggestedFix,
                contextualReasons: enhancement.reasons,
                relatedPatterns: enhancement.relatedPatterns,
                severityAdjustment: this.calculateSeverityAdjustment(enhancement)
            };

            this.enhancementCache.set(cacheKey, result);
            return result;

        } catch (error) {
            this.logger.warn('AI_ENHANCEMENT_FAILED', {
                violation: violation.type,
                error: error.message
            });

            // Return basic enhancement if AI fails
            return {
                confidence: 0.5,
                riskLevel: 'MEDIUM',
                businessImpact: 'Unknown',
                suggestedFix: 'Review and fix manually'
            };
        }
    }

    /**
     * Merge AI enhancement with original violation
     */
    mergeAIEnhancement(violation, aiEnhancement) {
        return {
            ...violation,
            aiEnhanced: true,
            confidence: aiEnhancement.confidence,
            riskLevel: aiEnhancement.riskLevel,
            businessImpact: aiEnhancement.businessImpact,
            enhancedRecommendation: aiEnhancement.suggestedFix || violation.recommendation,
            contextualReasons: aiEnhancement.contextualReasons,
            relatedPatterns: aiEnhancement.relatedPatterns,
            severity: this.adjustSeverity(violation.severity, aiEnhancement.severityAdjustment),
            enhancedAt: new Date().toISOString(),
            processingMethod: 'AI_COORDINATED'
        };
    }

    /**
     * Enrich violation with additional context
     */
    enrichWithContext(violation, codeContext) {
        return {
            ...violation,
            codeContext: {
                functionName: codeContext.functionName,
                className: codeContext.className,
                moduleType: codeContext.moduleType,
                dependencies: codeContext.dependencies,
                complexity: codeContext.complexity
            },
            enrichedAt: new Date().toISOString()
        };
    }

    /**
     * Calculate risk level based on violation and AI analysis
     */
    calculateRiskLevel(violation, aiAnalysis) {
        const severityWeights = {
            'CRITICAL': 100,
            'HIGH': 75,
            'MEDIUM': 50,
            'LOW': 25
        };

        const baseScore = severityWeights[violation.severity] || 50;
        const aiConfidence = aiAnalysis.confidence || 0.5;
        const adjustedScore = baseScore * aiConfidence;

        if (adjustedScore >= 90) return 'EXTREME';
        if (adjustedScore >= 75) return 'HIGH';
        if (adjustedScore >= 50) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Calculate severity adjustment based on AI analysis
     */
    calculateSeverityAdjustment(aiAnalysis) {
        if (!aiAnalysis.confidence || aiAnalysis.confidence < 0.6) {
            return 0; // No adjustment if low confidence
        }

        // Adjust based on business impact
        if (aiAnalysis.businessImpact === 'CRITICAL') return 1;
        if (aiAnalysis.businessImpact === 'LOW') return -1;
        return 0;
    }

    /**
     * Adjust severity based on AI recommendations
     */
    adjustSeverity(originalSeverity, adjustment) {
        const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const currentIndex = severityLevels.indexOf(originalSeverity);
        const newIndex = Math.max(0, Math.min(3, currentIndex + adjustment));
        return severityLevels[newIndex];
    }

    /**
     * Get processing statistics
     */
    getStatistics() {
        return {
            processedViolations: this.processedViolations.size,
            cachedEnhancements: this.enhancementCache.size,
            duplicatesAvoided: this.processedViolations.size,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Clear caches (for testing or memory management)
     */
    clearCaches() {
        this.processedViolations.clear();
        this.enhancementCache.clear();
    }
}

module.exports = ViolationCoordinator;