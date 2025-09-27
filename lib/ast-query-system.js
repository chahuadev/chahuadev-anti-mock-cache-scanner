#!/usr/bin/env node
// ======================================================================
// CHAHUADEV AST QUERY SYSTEM v1.0 - DIRECT AST RULE ENGINE
// ======================================================================
// Purpose: Replace Regex patterns with direct AST queries for 100% accuracy
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// ======================================================================

class ASTQuerySystem {
    constructor(logger) {
        this.logger = logger;
        this.astRules = this.initializeASTRules();
        this.queryCache = new Map();
    }

    /**
     * Initialize AST-based rules (replacing regex patterns)
     */
    initializeASTRules() {
        return {
            // Mock-related violations
            JEST_MOCK: {
                query: (ast) => this.findCallExpressions(ast, 'jest', 'mock'),
                severity: 'CRITICAL',
                category: 'MOCK_VIOLATIONS',
                description: 'Jest mock detected via AST analysis',
                recommendation: 'Remove jest.mock() and use real implementations'
            },

            JEST_FN: {
                query: (ast) => this.findCallExpressions(ast, 'jest', 'fn'),
                severity: 'CRITICAL',
                category: 'MOCK_VIOLATIONS',
                description: 'Jest fn() mock detected via AST analysis',
                recommendation: 'Replace jest.fn() with real function implementations'
            },

            MOCK_IMPLEMENTATION: {
                query: (ast) => this.findMethodCalls(ast, 'mockImplementation'),
                severity: 'CRITICAL',
                category: 'MOCK_VIOLATIONS',
                description: 'mockImplementation detected via AST analysis',
                recommendation: 'Use real implementation instead of mocking'
            },

            MOCK_RETURN_VALUE: {
                query: (ast) => this.findMethodCalls(ast, 'mockReturnValue'),
                severity: 'CRITICAL',
                category: 'MOCK_VIOLATIONS',
                description: 'mockReturnValue detected via AST analysis',
                recommendation: 'Return actual computed values instead of mocked ones'
            },

            // Cache-related violations
            CACHE_SET: {
                query: (ast) => this.findMethodCalls(ast, 'set', (node) => {
                    return this.isObjectRelatedToCache(node.object);
                }),
                severity: 'HIGH',
                category: 'CACHE_VIOLATIONS',
                description: 'Cache.set() operation detected via AST analysis',
                recommendation: 'Avoid caching operations; compute values in real-time'
            },

            CACHE_GET: {
                query: (ast) => this.findMethodCalls(ast, 'get', (node) => {
                    return this.isObjectRelatedToCache(node.object);
                }),
                severity: 'HIGH',
                category: 'CACHE_VIOLATIONS',
                description: 'Cache.get() operation detected via AST analysis',
                recommendation: 'Retrieve fresh data instead of cached values'
            },

            // Performance violations  
            EVAL_USAGE: {
                query: (ast) => this.findCallExpressions(ast, null, 'eval'),
                severity: 'CRITICAL',
                category: 'PERFORMANCE_VIOLATIONS',
                description: 'eval() usage detected via AST analysis',
                recommendation: 'Replace eval() with safer alternatives'
            },

            FUNCTION_CONSTRUCTOR: {
                query: (ast) => this.findNewExpressions(ast, 'Function'),
                severity: 'HIGH',
                category: 'PERFORMANCE_VIOLATIONS',
                description: 'Function constructor detected via AST analysis',
                recommendation: 'Use function declarations instead of Function constructor'
            }
        };
    }

    /**
     * Analyze AST using rule-based queries instead of regex
     */
    analyzeAST(ast, filePath) {
        const violations = [];

        try {
            for (const [ruleName, rule] of Object.entries(this.astRules)) {
                const matches = rule.query(ast);

                for (const match of matches) {
                    violations.push({
                        type: ruleName,
                        severity: rule.severity,
                        category: rule.category,
                        description: rule.description,
                        recommendation: rule.recommendation,
                        line: match.line,
                        column: match.column,
                        filePath: filePath,
                        astNode: match.node,
                        detectionMethod: 'AST_QUERY',
                        confidence: 1.0, // 100% accuracy with AST
                        timestamp: new Date().toISOString()
                    });
                }
            }

            this.logger.debug('AST_ANALYSIS_COMPLETED', {
                filePath,
                rulesApplied: Object.keys(this.astRules).length,
                violationsFound: violations.length,
                method: 'DIRECT_AST_QUERY'
            });

            return violations;

        } catch (error) {
            this.logger.error('AST_ANALYSIS_ERROR', {
                filePath,
                error: error.message
            });
            return [];
        }
    }

    /**
     * Find call expressions: obj.method() or function()
     */
    findCallExpressions(ast, objectName = null, methodName) {
        const matches = [];

        this.walkAST(ast, (node) => {
            if (node.type === 'CallExpression') {
                if (objectName && methodName) {
                    // Looking for obj.method()
                    if (node.callee && node.callee.type === 'MemberExpression') {
                        if (node.callee.object && node.callee.object.name === objectName &&
                            node.callee.property && node.callee.property.name === methodName) {
                            matches.push({
                                node: node,
                                line: node.loc ? node.loc.start.line : 0,
                                column: node.loc ? node.loc.start.column : 0
                            });
                        }
                    }
                } else if (methodName) {
                    // Looking for function()
                    if (node.callee && node.callee.name === methodName) {
                        matches.push({
                            node: node,
                            line: node.loc ? node.loc.start.line : 0,
                            column: node.loc ? node.loc.start.column : 0
                        });
                    }
                }
            }
        });

        return matches;
    }

    /**
     * Find method calls with optional filter
     */
    findMethodCalls(ast, methodName, filterFn = null) {
        const matches = [];

        this.walkAST(ast, (node) => {
            if (node.type === 'CallExpression' &&
                node.callee &&
                node.callee.type === 'MemberExpression' &&
                node.callee.property &&
                node.callee.property.name === methodName) {

                if (!filterFn || filterFn(node.callee)) {
                    matches.push({
                        node: node,
                        line: node.loc ? node.loc.start.line : 0,
                        column: node.loc ? node.loc.start.column : 0
                    });
                }
            }
        });

        return matches;
    }

    /**
     * Find new expressions: new Constructor()
     */
    findNewExpressions(ast, constructorName) {
        const matches = [];

        this.walkAST(ast, (node) => {
            if (node.type === 'NewExpression' &&
                node.callee &&
                node.callee.name === constructorName) {
                matches.push({
                    node: node,
                    line: node.loc ? node.loc.start.line : 0,
                    column: node.loc ? node.loc.start.column : 0
                });
            }
        });

        return matches;
    }

    /**
     * Check if object is related to cache
     */
    isObjectRelatedToCache(objectNode) {
        if (!objectNode) return false;

        const cacheRelatedNames = [
            'cache', 'Cache', 'redis', 'Redis',
            'memcached', 'Memcached', 'localStorage',
            'sessionStorage', 'cacheManager'
        ];

        if (objectNode.name) {
            return cacheRelatedNames.some(name =>
                objectNode.name.toLowerCase().includes(name.toLowerCase())
            );
        }

        return false;
    }

    /**
     * Walk AST tree and apply visitor function
     */
    walkAST(node, visitor) {
        if (!node || typeof node !== 'object') return;

        visitor(node);

        for (const key in node) {
            if (key === 'parent') continue; // Avoid circular references

            const child = node[key];
            if (Array.isArray(child)) {
                child.forEach(item => this.walkAST(item, visitor));
            } else if (child && typeof child === 'object') {
                this.walkAST(child, visitor);
            }
        }
    }

    /**
     * Add custom AST rule
     */
    addRule(name, rule) {
        this.astRules[name] = rule;
        this.logger.info('AST_RULE_ADDED', { name, category: rule.category });
    }

    /**
     * Remove AST rule
     */
    removeRule(name) {
        delete this.astRules[name];
        this.logger.info('AST_RULE_REMOVED', { name });
    }

    /**
     * Get statistics about AST analysis
     */
    getStatistics() {
        return {
            totalRules: Object.keys(this.astRules).length,
            cacheSize: this.queryCache.size,
            rulesCategories: this.getRulesByCategory(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get rules grouped by category
     */
    getRulesByCategory() {
        const categories = {};
        for (const [name, rule] of Object.entries(this.astRules)) {
            if (!categories[rule.category]) {
                categories[rule.category] = [];
            }
            categories[rule.category].push(name);
        }
        return categories;
    }
}

module.exports = ASTQuerySystem;