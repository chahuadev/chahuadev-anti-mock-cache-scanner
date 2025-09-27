#!/usr/bin/env node
// ======================================================================
// CHAHUADEV CONFIGURATION MANAGER v1.0 - ENTERPRISE CONFIG SYSTEM
// ======================================================================
// Purpose: Manage complex configurations for large projects
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// ======================================================================

const fs = require('fs');
const path = require('path');

class ConfigurationManager {
    constructor(logger) {
        this.logger = logger;
        this.config = {};
        this.configFiles = [
            '.scanner-rc.json',
            '.scanner-rc.js',
            'scanner.config.json',
            'scanner.config.js',
            'chahuadev.config.json',
            'chahuadev.config.js'
        ];
        this.defaultConfig = this.getDefaultConfiguration();
    }

    /**
     * Load configuration from multiple sources with priority
     */
    async loadConfiguration(projectPath = process.cwd(), cliArgs = {}) {
        try {
            // Priority order: CLI Args > Project Config > Default Config
            let mergedConfig = { ...this.defaultConfig };

            // 1. Try to load project-specific config
            const projectConfig = await this.loadProjectConfig(projectPath);
            if (projectConfig) {
                mergedConfig = this.mergeConfigurations(mergedConfig, projectConfig);
                this.logger.info('PROJECT_CONFIG_LOADED', {
                    path: projectPath,
                    source: projectConfig._configSource
                });
            }

            // 2. Apply CLI arguments (highest priority)
            if (Object.keys(cliArgs).length > 0) {
                mergedConfig = this.mergeConfigurations(mergedConfig, cliArgs);
                this.logger.info('CLI_CONFIG_APPLIED', {
                    overrides: Object.keys(cliArgs)
                });
            }

            // 3. Validate final configuration
            const validatedConfig = this.validateConfiguration(mergedConfig);

            this.config = validatedConfig;
            this.logger.info('CONFIGURATION_LOADED', {
                totalRules: validatedConfig.rules ? Object.keys(validatedConfig.rules).length : 0,
                severity: validatedConfig.minSeverity,
                outputFormat: validatedConfig.output.format
            });

            return validatedConfig;

        } catch (error) {
            this.logger.error('CONFIG_LOAD_ERROR', {
                error: error.message,
                fallbackToDefault: true
            });

            this.config = this.defaultConfig;
            return this.defaultConfig;
        }
    }

    /**
     * Load project-specific configuration file
     */
    async loadProjectConfig(projectPath) {
        for (const configFile of this.configFiles) {
            const configPath = path.join(projectPath, configFile);

            if (fs.existsSync(configPath)) {
                try {
                    let config;

                    if (configFile.endsWith('.js')) {
                        // Load JavaScript config
                        delete require.cache[require.resolve(configPath)];
                        config = require(configPath);
                    } else {
                        // Load JSON config
                        const content = fs.readFileSync(configPath, 'utf8');
                        config = JSON.parse(content);
                    }

                    config._configSource = configPath;
                    return config;

                } catch (error) {
                    this.logger.warn('CONFIG_PARSE_ERROR', {
                        file: configPath,
                        error: error.message
                    });
                    continue;
                }
            }
        }

        return null;
    }

    /**
     * Get default configuration
     */
    getDefaultConfiguration() {
        return {
            // Analysis settings
            minSeverity: 'MEDIUM',
            strict: false,
            includePatterns: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
            excludePatterns: [
                '**/node_modules/**',
                '**/dist/**',
                '**/build/**',
                '**/*.min.js',
                '**/coverage/**',
                '**/.git/**'
            ],

            // Rule configurations
            rules: {
                'JEST_MOCK': {
                    enabled: true,
                    severity: 'CRITICAL',
                    autoFix: false
                },
                'JEST_FN': {
                    enabled: true,
                    severity: 'CRITICAL',
                    autoFix: false
                },
                'CACHE_OPERATIONS': {
                    enabled: true,
                    severity: 'HIGH',
                    whitelist: []
                },
                'EVAL_USAGE': {
                    enabled: true,
                    severity: 'CRITICAL',
                    autoFix: false
                },
                'PERFORMANCE_VIOLATIONS': {
                    enabled: true,
                    severity: 'MEDIUM',
                    threshold: 100
                }
            },

            // Analysis engines
            engines: {
                chahuadevR: {
                    enabled: true,
                    fallbackAllowed: false,
                    parseTimeout: 5000
                },
                astQuery: {
                    enabled: true,
                    cacheResults: true,
                    maxCacheSize: 1000
                },
                aiAnalyzer: {
                    enabled: false, // Disabled by default for performance
                    enhanceOnlyComplex: true,
                    confidence: 0.7
                }
            },

            // Output settings
            output: {
                format: 'console', // console, json, html, xml
                file: null,
                verbose: false,
                showContext: true,
                maxContextLines: 3,
                groupByCategory: true,
                showStatistics: true
            },

            // Performance settings  
            performance: {
                maxFileSize: '10MB',
                maxConcurrency: 4,
                timeout: 30000,
                enableProfiling: false
            },

            // Integration settings
            integration: {
                git: {
                    enabled: false,
                    checkOnCommit: false,
                    blockOnViolations: false
                },
                ci: {
                    enabled: false,
                    exitOnError: true,
                    failThreshold: 'HIGH'
                },
                ide: {
                    enableRealtime: false,
                    showInlineWarnings: true
                }
            },

            // Logging
            logging: {
                level: 'INFO',
                file: null,
                maxFileSize: '50MB',
                enableAudit: false
            }
        };
    }

    /**
     * Merge two configuration objects with deep merge
     */
    mergeConfigurations(base, override) {
        const result = { ...base };

        for (const [key, value] of Object.entries(override)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = this.mergeConfigurations(result[key] || {}, value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Validate configuration and apply defaults for missing values
     */
    validateConfiguration(config) {
        const validated = { ...config };

        // Validate severity levels
        const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        if (!validSeverities.includes(validated.minSeverity)) {
            this.logger.warn('INVALID_SEVERITY', {
                provided: validated.minSeverity,
                fallback: 'MEDIUM'
            });
            validated.minSeverity = 'MEDIUM';
        }

        // Validate output format
        const validFormats = ['console', 'json', 'html', 'xml'];
        if (!validFormats.includes(validated.output?.format)) {
            validated.output = validated.output || {};
            validated.output.format = 'console';
        }

        // Validate file patterns
        if (!Array.isArray(validated.includePatterns)) {
            validated.includePatterns = this.defaultConfig.includePatterns;
        }

        if (!Array.isArray(validated.excludePatterns)) {
            validated.excludePatterns = this.defaultConfig.excludePatterns;
        }

        // Validate rules configuration
        if (!validated.rules || typeof validated.rules !== 'object') {
            validated.rules = this.defaultConfig.rules;
        }

        return validated;
    }

    /**
     * Save current configuration to file
     */
    async saveConfiguration(filePath, format = 'json') {
        try {
            const configToSave = { ...this.config };
            delete configToSave._configSource; // Remove internal properties

            let content;
            if (format === 'js') {
                content = `module.exports = ${JSON.stringify(configToSave, null, 2)};`;
            } else {
                content = JSON.stringify(configToSave, null, 2);
            }

            fs.writeFileSync(filePath, content, 'utf8');

            this.logger.info('CONFIG_SAVED', {
                path: filePath,
                format: format
            });

            return true;
        } catch (error) {
            this.logger.error('CONFIG_SAVE_ERROR', {
                path: filePath,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Generate example configuration file
     */
    generateExampleConfig() {
        return {
            // Example configuration with comments
            "$schema": "https://chahuadev.com/schemas/scanner-config.json",

            "minSeverity": "HIGH",
            "strict": true,

            "includePatterns": [
                "src/**/*.js",
                "lib/**/*.ts"
            ],

            "excludePatterns": [
                "**/node_modules/**",
                "**/test/**",
                "**/*.test.js"
            ],

            "rules": {
                "JEST_MOCK": {
                    "enabled": true,
                    "severity": "CRITICAL",
                    "message": "Custom message for Jest mocks"
                },
                "CACHE_OPERATIONS": {
                    "enabled": true,
                    "severity": "HIGH",
                    "whitelist": ["redis.get", "cache.has"]
                }
            },

            "engines": {
                "aiAnalyzer": {
                    "enabled": true,
                    "confidence": 0.8
                }
            },

            "output": {
                "format": "json",
                "file": "scan-results.json",
                "verbose": true
            },

            "integration": {
                "git": {
                    "enabled": true,
                    "checkOnCommit": true
                }
            }
        };
    }

    /**
     * Get current configuration
     */
    getCurrentConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration at runtime
     */
    updateConfig(path, value) {
        const keys = path.split('.');
        let current = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;

        this.logger.info('CONFIG_UPDATED', {
            path: path,
            newValue: value
        });
    }
}

module.exports = ConfigurationManager;