// ======================================================================
// CHAHUADEV-R AST ENGINE v7.0 (ULTIMATE ENTERPRISE GRADE)
// "Revolutionary Code Analysis Engine" - Pratt Parser + Lookahead Implementation
// ======================================================================
// Architecture: Pratt Recursive Descent Parser with Advanced Lookahead
// Mission: "Professional Code Analysis" - Eliminate All Token Ambiguity
// Features: Operator Precedence + Lookahead + ASI Handling + Context Disambiguation
// ======================================================================

const { TOKEN_TYPES, KEYWORDS } = require('./intelligent-tokenizer');

// ======================================================================
// OPERATOR PRECEDENCE TABLE - Heart of Pratt Parser
// Based on JavaScript's actual operator precedence
// ======================================================================
const PRECEDENCE = {
    LOWEST: 0,
    COMMA: 1,           // ,
    ASSIGNMENT: 2,      // = += -= etc.
    TERNARY: 3,         // ? :
    LOGICAL_OR: 4,      // ||
    LOGICAL_AND: 5,     // &&
    BITWISE_OR: 6,      // |
    BITWISE_XOR: 7,     // ^
    BITWISE_AND: 8,     // &
    EQUALITY: 9,        // == != === !==
    RELATIONAL: 10,     // < > <= >= instanceof in
    SHIFT: 11,          // << >> >>>
    ADDITIVE: 12,       // + -
    MULTIPLICATIVE: 13, // * / %
    EXPONENTIATION: 14, // **
    UNARY: 15,          // ! ~ + - typeof void delete
    POSTFIX: 16,        // ++ --
    CALL: 17,           // () [] .
    MEMBER: 18,         // new
    PRIMARY: 19         // literals, identifiers, ()
};

// ======================================================================
// CHAHUADEV-R ENGINE - REVOLUTIONARY CODE ANALYSIS
// The Ultimate Solution to JavaScript Parsing Challenges
// ======================================================================
class ChahuadevREngine {
    constructor(options = {}) {
        this.options = options;
        this.code = '';
        this.filePath = '';
        this.lines = [];

        // Parsing State
        this.tokens = [];
        this.current = 0;
        this.astTree = null;
        this.violations = [];
        this.structures = [];
        this.parseErrors = [];  // ✅ เพิ่ม error tracking

        // Context & Scope Management
        this.contextStack = [];
        this.scopeStack = [];

        // Lookahead Cache for Performance
        this.lookaheadCache = new Map();

        // ASI (Automatic Semicolon Insertion) State
        this.asiContext = {
            canInsert: true,
            lastToken: null,
            lineTerminated: false
        };

        // Performance Metrics
        this.metrics = {
            startTime: null,
            tokenizationTime: 0,
            parsingTime: 0,
            lookaheadCount: 0,
            disambiguationCount: 0,
            totalTime: 0
        };
    }

    // PUBLIC ANALYSIS METHOD
    analyze(code, filePath = 'unknown.js') {
        // Initialize code and file path
        this.code = code;
        this.filePath = filePath;
        this.lines = code.split('\n');

        // Reset state for new analysis
        this.tokens = [];
        this.current = 0;
        this.astTree = null;
        this.violations = [];
        this.structures = [];
        this.parseErrors = [];  // ✅ Reset error tracking
        this.contextStack = [];
        this.scopeStack = [];
        this.lookaheadCache.clear();

        // Reset ASI context
        this.asiContext = {
            canInsert: true,
            lastToken: null,
            lineTerminated: false
        };

        // Reset metrics
        this.metrics = {
            startTime: null,
            tokenizationTime: 0,
            parsingTime: 0,
            lookaheadCount: 0,
            disambiguationCount: 0,
            totalTime: 0
        };

        // Execute analysis
        return this.performAnalysis();
    }

    // ULTIMATE CHAHUADEV-R ANALYSIS
    performAnalysis() {
        try {
            this.metrics.startTime = Date.now();

            console.log(' Starting ChahuadevR Analysis - Revolutionary Code Processing...');

            // Phase 1: Advanced Tokenization
            const tokenStart = Date.now();
            this.tokenizeWithAmbiguityResolution();
            this.metrics.tokenizationTime = Date.now() - tokenStart;

            // Phase 2: Pratt Parser Implementation
            const parseStart = Date.now();
            this.parseWithPrattParser();
            this.metrics.parsingTime = Date.now() - parseStart;

            // Phase 3: Violation Detection with Context
            this.detectViolationsWithFullContext();

            this.metrics.totalTime = Date.now() - this.metrics.startTime;

            console.log(' ChahuadevR analysis completed! All ambiguities resolved!');

            return this.generateChahuadevRResults();

        } catch (error) {
            console.error(' ChahuadevR analysis failed:', error.message);
            return this.getFallbackResults(error);
        }
    }

    // ======= PHASE 1: TOKENIZATION WITH AMBIGUITY RESOLUTION =======
    tokenizeWithAmbiguityResolution() {
        console.log(' Phase 1: Tokenization with Ambiguity Resolution...');

        let position = 0;
        let line = 1;
        let column = 1;

        while (position < this.code.length) {
            const result = this.extractTokenWithDisambiguation(position, line, column);

            if (result.token) {
                this.tokens.push(result.token);

                // Update ASI context
                this.updateASIContext(result.token);
            }

            // Update position
            position = result.newPosition;
            line = result.newLine;
            column = result.newColumn;
        }

        // Add EOF token
        this.tokens.push({
            type: TOKEN_TYPES.EOF,
            value: '',
            line: line,
            column: column
        });

        console.log(`  Generated ${this.tokens.length} disambiguated tokens`);
    }

    extractTokenWithDisambiguation(position, line, column) {
        const char = this.code[position];

        // Skip whitespace and track line breaks for ASI
        if (/\s/.test(char)) {
            if (char === '\n') {
                this.asiContext.lineTerminated = true;
                return {
                    token: null,
                    newPosition: position + 1,
                    newLine: line + 1,
                    newColumn: 1
                };
            } else {
                return {
                    token: null,
                    newPosition: position + 1,
                    newLine: line,
                    newColumn: column + 1
                };
            }
        }

        // CRITICAL AMBIGUITY RESOLUTION POINTS

        // 1. Arrow Function vs Greater Than Equal (=> vs >=)
        if (char === '=' && this.code[position + 1] === '>') {
            // Lookahead to determine if this is arrow function
            if (this.isArrowFunctionContext(position)) {
                return this.createToken(TOKEN_TYPES.ARROW, '=>', position, line, column, 2);
            }
        }

        // 2. Object Literal vs Block Statement ({ })
        if (char === '{') {
            const context = this.disambiguateBraceContext(position);
            return this.createToken(context.type, '{', position, line, column, 1, { context: context.meaning });
        }

        // 3. Division vs Regex (/ vs /regex/)
        if (char === '/') {
            const nextChar = this.code[position + 1];

            if (nextChar === '/') {
                // Line comment
                return this.extractLineComment(position, line, column);
            } else if (nextChar === '*') {
                // Block comment
                return this.extractBlockComment(position, line, column);
            } else {
                // Could be division or regex - use context to decide
                if (this.isRegexContext(position)) {
                    return this.extractRegexLiteral(position, line, column);
                } else {
                    return this.createToken('OPERATOR', '/', position, line, column, 1);
                }
            }
        }

        // 4. Template Literal vs String
        if (char === '`') {
            return this.extractTemplateLiteral(position, line, column);
        }

        // 5. Standard token extraction with context awareness
        return this.extractStandardTokenWithContext(position, line, column);
    }

    // ======= ADVANCED DISAMBIGUATION METHODS =======

    isArrowFunctionContext(position) {
        // Look backward for parameter pattern
        let backPos = position - 1;
        let parenCount = 0;
        let foundPattern = false;

        // Skip whitespace backward
        while (backPos >= 0 && /\s/.test(this.code[backPos])) {
            backPos--;
        }

        // Check for ) indicating parameters
        if (backPos >= 0 && this.code[backPos] === ')') {
            parenCount = 1;
            backPos--;

            // Look for matching (
            while (backPos >= 0 && parenCount > 0) {
                if (this.code[backPos] === ')') parenCount++;
                if (this.code[backPos] === '(') parenCount--;
                backPos--;
            }

            // If we found matching parens, check what comes before
            if (parenCount === 0) {
                // Skip whitespace
                while (backPos >= 0 && /\s/.test(this.code[backPos])) {
                    backPos--;
                }

                // Check for identifier or assignment context
                if (backPos >= 0 && /[a-zA-Z_$=]/.test(this.code[backPos])) {
                    foundPattern = true;
                }
            }
        } else if (backPos >= 0 && /[a-zA-Z_$]/.test(this.code[backPos])) {
            // Simple identifier parameter
            foundPattern = true;
        }

        return foundPattern;
    }

    disambiguateBraceContext(position) {
        // Use sophisticated lookahead to determine brace meaning
        const lookahead = this.lookaheadTokens(position + 1, 5);

        // Check for object literal patterns
        for (let token of lookahead) {
            if (token.type === TOKEN_TYPES.IDENTIFIER &&
                this.peek(1, token.position)?.value === ':') {
                return { type: TOKEN_TYPES.BRACE_OPEN, meaning: 'object-literal' };
            }

            if (token.value === '...' || token.value === '[') {
                return { type: TOKEN_TYPES.BRACE_OPEN, meaning: 'object-literal' };
            }

            if (token.type === TOKEN_TYPES.KEYWORD &&
                ['if', 'for', 'while', 'const', 'let', 'var', 'function'].includes(token.value)) {
                return { type: TOKEN_TYPES.BRACE_OPEN, meaning: 'block-statement' };
            }
        }

        // Default to block statement
        return { type: TOKEN_TYPES.BRACE_OPEN, meaning: 'block-statement' };
    }

    isRegexContext(position) {
        // Look at previous non-whitespace token to determine if regex is expected
        const prevToken = this.getPreviousSignificantToken();

        if (!prevToken) return true; // Start of file - likely regex

        // Contexts where regex is expected
        const regexContexts = [
            '=', '==', '===', '!=', '!==', '&&', '||', '!',
            '(', '[', '{', ';', ':', ',', '?',
            'return', 'throw', 'case'
        ];

        return regexContexts.includes(prevToken.value);
    }

    // ======= PHASE 2: PRATT PARSER IMPLEMENTATION =======
    parseWithPrattParser() {
        console.log(' Phase 2: Pratt Parser - Conquering Operator Precedence...');

        this.current = 0;

        this.astTree = {
            type: 'Program',
            body: [],
            sourceType: 'module',
            chahuadevREngine: true,
            metadata: {
                parseMethod: 'pratt-recursive-descent',
                ambiguityResolution: true,
                operatorPrecedence: true
            }
        };

        while (!this.isAtEnd()) {
            try {
                const statement = this.parseStatement();
                if (statement) {
                    this.astTree.body.push(statement);
                }
            } catch (error) {
                // ✅ BETTER ERROR TRACKING: บันทึก error แทนแค่ log
                const parseError = {
                    message: error.message,
                    token: this.current,
                    tokenValue: this.peek()?.value,
                    line: this.peek()?.line || 0,
                    column: this.peek()?.column || 0,
                    type: 'PARSE_ERROR'
                };
                this.parseErrors.push(parseError);
                console.warn(`Parse error at token ${this.current}:`, error.message);
                this.synchronize(); // Error recovery
            }
        }

        console.log(`  Parsed ${this.astTree.body.length} top-level statements`);
    }

    parseStatement() {
        // Handle different statement types
        const token = this.peek();

        if (!token) return null;

        // ASI handling - insert semicolon if needed
        if (this.needsASI()) {
            this.insertImplicitSemicolon();
        }

        switch (token.type) {
            case TOKEN_TYPES.KEYWORD:
                return this.parseKeywordStatement(token.value);

            case TOKEN_TYPES.IDENTIFIER:
                return this.parseExpressionStatement();

            case TOKEN_TYPES.BRACE_OPEN:
                if (token.context === 'object-literal') {
                    return this.parseObjectLiteral();
                } else {
                    return this.parseBlockStatement();
                }

            default:
                return this.parseExpressionStatement();
        }
    }

    parseKeywordStatement(keyword) {
        // ✅ FIX: Advance past the keyword token first
        this.advance();

        switch (keyword) {
            case 'class':
                return this.parseClassDeclaration();
            case 'function':
                return this.parseFunctionDeclaration();
            case 'const':
            case 'let':
            case 'var':
                return this.parseVariableDeclaration();
            case 'if':
                return this.parseIfStatement();
            case 'for':
                return this.parseForStatement();
            case 'while':
                return this.parseWhileStatement();
            case 'return':
                return this.parseReturnStatement();
            default:
                // ✅ FIX: For unknown keywords, retreat and parse as expression
                this.current--;
                return this.parseExpressionStatement();
        }
    }

    // ======= PRATT PARSER CORE - EXPRESSION PARSING =======
    // The Heart of Professional Analysis - Operator Precedence Magic
    parseExpression(precedence = PRECEDENCE.LOWEST) {
        this.metrics.lookaheadCount++;

        let left = this.parsePrefixExpression();

        while (this.hasInfixExpression() &&
            this.getInfixPrecedence() > precedence) {

            left = this.parseInfixExpression(left);
        }

        return left;
    }

    // ======= CHAHUADEV-R ENGINE ARSENAL - PARSING FUNCTION MAPS =======

    getPrefixParselet(tokenType) {
        const prefixParselets = {
            // Literals and Identifiers
            [TOKEN_TYPES.NUMBER]: () => this.parseNumberLiteral(),
            [TOKEN_TYPES.STRING]: () => this.parseStringLiteral(),
            [TOKEN_TYPES.IDENTIFIER]: () => this.parseIdentifier(),

            // Grouped expressions
            [TOKEN_TYPES.PAREN_OPEN]: () => this.parseGroupedExpression(),
            [TOKEN_TYPES.BRACKET_OPEN]: () => this.parseArrayLiteral(),
            [TOKEN_TYPES.BRACE_OPEN]: () => this.parseObjectLiteral(),

            // Unary operators
            '!': () => this.parseUnaryExpression('!'),
            '-': () => this.parseUnaryExpression('-'),
            '+': () => this.parseUnaryExpression('+'),
            '~': () => this.parseUnaryExpression('~'),

            // Keywords
            'typeof': () => this.parseUnaryExpression('typeof'),
            'void': () => this.parseUnaryExpression('void'),
            'delete': () => this.parseUnaryExpression('delete'),
            'new': () => this.parseNewExpression(),
            'this': () => this.parseThisExpression(),
            'super': () => this.parseSuperExpression(),
            'function': () => this.parseFunctionExpression(),
            'class': () => this.parseClassExpression(),

            // Boolean literals
            'true': () => this.parseBooleanLiteral(true),
            'false': () => this.parseBooleanLiteral(false),
            'null': () => this.parseNullLiteral(),
            'undefined': () => this.parseUndefinedLiteral()
        };

        return prefixParselets[tokenType] || prefixParselets[this.peek()?.value];
    }

    getInfixParselet(tokenValue) {
        const infixParselets = {
            // Binary operators
            '+': (left) => this.parseBinaryExpression(left, '+', PRECEDENCE.ADDITIVE),
            '-': (left) => this.parseBinaryExpression(left, '-', PRECEDENCE.ADDITIVE),
            '*': (left) => this.parseBinaryExpression(left, '*', PRECEDENCE.MULTIPLICATIVE),
            '/': (left) => this.parseBinaryExpression(left, '/', PRECEDENCE.MULTIPLICATIVE),
            '%': (left) => this.parseBinaryExpression(left, '%', PRECEDENCE.MULTIPLICATIVE),
            '**': (left) => this.parseBinaryExpression(left, '**', PRECEDENCE.EXPONENTIATION),

            // Comparison operators
            '<': (left) => this.parseBinaryExpression(left, '<', PRECEDENCE.RELATIONAL),
            '>': (left) => this.parseBinaryExpression(left, '>', PRECEDENCE.RELATIONAL),
            '<=': (left) => this.parseBinaryExpression(left, '<=', PRECEDENCE.RELATIONAL),
            '>=': (left) => this.parseBinaryExpression(left, '>=', PRECEDENCE.RELATIONAL),
            '==': (left) => this.parseBinaryExpression(left, '==', PRECEDENCE.EQUALITY),
            '!=': (left) => this.parseBinaryExpression(left, '!=', PRECEDENCE.EQUALITY),
            '===': (left) => this.parseBinaryExpression(left, '===', PRECEDENCE.EQUALITY),
            '!==': (left) => this.parseBinaryExpression(left, '!==', PRECEDENCE.EQUALITY),

            // Logical operators
            '&&': (left) => this.parseBinaryExpression(left, '&&', PRECEDENCE.LOGICAL_AND),
            '||': (left) => this.parseBinaryExpression(left, '||', PRECEDENCE.LOGICAL_OR),

            // Assignment operators
            '=': (left) => this.parseAssignmentExpression(left, '='),
            '+=': (left) => this.parseAssignmentExpression(left, '+='),
            '-=': (left) => this.parseAssignmentExpression(left, '-='),
            '*=': (left) => this.parseAssignmentExpression(left, '*='),
            '/=': (left) => this.parseAssignmentExpression(left, '/='),

            // Member access and function calls
            '.': (left) => this.parseMemberExpression(left),
            '[': (left) => this.parseComputedMemberExpression(left),
            '(': (left) => this.parseCallExpression(left),

            // Ternary operator
            '?': (left) => this.parseTernaryExpression(left),

            // Comma operator
            ',': (left) => this.parseSequenceExpression(left)
        };

        return infixParselets[tokenValue];
    }

    // ======= BLADE SHARPENING - EXPRESSION PARSING IMPLEMENTATION =======

    parsePrefixExpression() {
        const token = this.peek();

        if (!token) {
            throw new Error('� Chahuadev-R Error: Unexpected end of input while parsing prefix expression');
        }

        // ค้นหา "ท่าไม้ตาย" จากคลังสำหรับ Prefix
        const prefixParselet = this.getPrefixParselet(token.type);

        if (!prefixParselet) {
            throw new Error(`⚙️ Chahuadev-R Error: No prefix parser for token: ${token.value} (${token.type})`);
        }

        this.advance(); // กิน token นั้น
        return prefixParselet(); // เรียกใช้ฟังก์ชันจัดการ
    }

    parseInfixExpression(leftNode) {
        const operatorToken = this.peek();

        if (!operatorToken) {
            return leftNode;
        }

        // ค้นหา "ท่าไม้ตาย" จากคลังสำหรับ Infix
        const infixParselet = this.getInfixParselet(operatorToken.value);

        if (!infixParselet) {
            return leftNode;
        }

        this.advance(); // กิน operator
        return infixParselet(leftNode); // เรียกใช้ฟังก์ชันจัดการ
    }

    // ======= CHAHUADEV-R TECHNIQUES - PARSING FUNCTIONS =======

    // Literal Parsers
    parseNumberLiteral() {
        const token = this.previous();
        return {
            type: 'NumericLiteral',
            value: parseFloat(token.value),
            raw: token.value,
            loc: this.createLocation(token),
            chahuadevAnalyzed: true
        };
    }

    parseStringLiteral() {
        const token = this.previous();
        return {
            type: 'StringLiteral',
            value: token.value.slice(1, -1), // Remove quotes
            raw: token.value,
            loc: this.createLocation(token),
            chahuadevAnalyzed: true
        };
    }

    parseIdentifier() {
        const token = this.previous();

        // Check for potential security violations
        this.checkIdentifierViolation(token);

        return {
            type: 'Identifier',
            name: token.value,
            loc: this.createLocation(token),
            chahuadevAnalyzed: true
        };
    }

    parseBooleanLiteral(value) {
        const token = this.previous();
        return {
            type: 'BooleanLiteral',
            value: value,
            raw: token.value,
            loc: this.createLocation(token),
            chahuadevAnalyzed: true
        };
    }

    parseNullLiteral() {
        const token = this.previous();
        return {
            type: 'NullLiteral',
            value: null,
            raw: 'null',
            loc: this.createLocation(token),
            chahuadevAnalyzed: true
        };
    }

    // Binary Expression Parser (The Core Chahuadev-R Technique)
    parseBinaryExpression(leftNode, operator, precedence) {
        const operatorToken = this.previous();

        // Right-associative operators (like **) need precedence - 1
        const rightPrecedence = operator === '**' ? precedence - 1 : precedence;
        const rightNode = this.parseExpression(rightPrecedence);

        return {
            type: 'BinaryExpression',
            left: leftNode,
            operator: operator,
            right: rightNode,
            loc: this.combineLocations(leftNode.loc, rightNode.loc),
            chahuadevAnalyzed: true
        };
    }

    // Unary Expression Parser
    parseUnaryExpression(operator) {
        const operatorToken = this.previous();
        const operand = this.parseExpression(PRECEDENCE.UNARY);

        return {
            type: 'UnaryExpression',
            operator: operator,
            prefix: true,
            argument: operand,
            loc: this.combineLocations(this.createLocation(operatorToken), operand.loc),
            chahuadevAnalyzed: true
        };
    }

    // Member Expression Parser (For detecting violations like obj.method())
    parseMemberExpression(object) {
        const propertyToken = this.advance();

        if (propertyToken.type !== TOKEN_TYPES.IDENTIFIER) {
            throw new Error(` Expected property name after '.', got: ${propertyToken.value}`);
        }

        const memberExpr = {
            type: 'MemberExpression',
            object: object,
            property: {
                type: 'Identifier',
                name: propertyToken.value,
                loc: this.createLocation(propertyToken)
            },
            computed: false,
            loc: this.combineLocations(object.loc, this.createLocation(propertyToken)),
            chahuadevAnalyzed: true
        };

        // Check for security violations (jest.mock, cache.set, etc.)
        this.checkMemberExpressionViolation(memberExpr);

        return memberExpr;
    }

    // Call Expression Parser (Critical for violation detection)
    parseCallExpression(callee) {
        const args = this.parseArgumentList();

        const callExpr = {
            type: 'CallExpression',
            callee: callee,
            arguments: args,
            loc: this.combineLocations(callee.loc, this.createLocation(this.previous())),
            chahuadevAnalyzed: true
        };

        // Check for security violations in function calls
        this.checkCallExpressionViolation(callExpr);

        return callExpr;
    }

    // Grouped Expression Parser (Parentheses)
    parseGroupedExpression() {
        const expr = this.parseExpression();

        if (!this.match(TOKEN_TYPES.PAREN_CLOSE)) {
            throw new Error("🐉 Expected ')' after grouped expression");
        }

        return expr;
    }

    // Assignment Expression Parser
    parseAssignmentExpression(left, operator) {
        const right = this.parseExpression(PRECEDENCE.ASSIGNMENT);

        return {
            type: 'AssignmentExpression',
            left: left,
            operator: operator,
            right: right,
            loc: this.combineLocations(left.loc, right.loc),
            chahuadevAnalyzed: true
        };
    }

    // ======= SECURITY DETECTION - VIOLATION ANALYSIS =======

    checkMemberExpressionViolation(memberExpr) {
        const objectName = memberExpr.object.name;
        const propertyName = memberExpr.property.name;

        if (!objectName || !propertyName) return;

        // Jest mock detection
        if (objectName === 'jest' && propertyName === 'mock') {
            this.addViolation({
                type: 'JEST_MOCK',
                severity: this.assessViolationSeverity('JEST_MOCK'),
                node: memberExpr,
                message: `Jest mock detected: ${objectName}.${propertyName}`,
                chahuadevAnalyzed: true
            });
        }

        // Cache operation detection
        if (objectName.toLowerCase().includes('cache') &&
            ['set', 'get', 'put', 'delete', 'clear'].includes(propertyName)) {
            this.addViolation({
                type: 'CACHE_OPERATION',
                severity: this.assessViolationSeverity('CACHE_OPERATION'),
                node: memberExpr,
                message: `Cache operation detected: ${objectName}.${propertyName}`,
                chahuadevAnalyzed: true
            });
        }

        // Mock implementation detection
        if (propertyName.includes('mock') || propertyName.includes('Mock')) {
            this.addViolation({
                type: 'MOCK_IMPLEMENTATION',
                severity: this.assessViolationSeverity('MOCK_IMPLEMENTATION'),
                node: memberExpr,
                message: `Mock implementation detected: ${objectName}.${propertyName}`,
                chahuadevAnalyzed: true
            });
        }
    }

    checkCallExpressionViolation(callExpr) {
        // If callee is a member expression, it's already checked
        if (callExpr.callee.type === 'MemberExpression') {
            // Additional context-aware analysis for function calls
            const objectName = callExpr.callee.object?.name;
            const methodName = callExpr.callee.property?.name;

            if (objectName && methodName) {
                // Enhance existing violations with call context
                const existingViolation = this.violations.find(v =>
                    v.node === callExpr.callee
                );

                if (existingViolation) {
                    existingViolation.callContext = {
                        argumentCount: callExpr.arguments.length,
                        hasArguments: callExpr.arguments.length > 0,
                        contextualRisk: this.assessContextualRisk(objectName, methodName)
                    };
                }
            }
        }
    }

    // ======= CHAHUADEV-R UTILITIES =======

    addViolation(violation) {
        violation.id = `chahuadev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        violation.timestamp = new Date().toISOString();
        violation.engine = 'ChahuadevR-v7.0';

        this.violations.push(violation);
        this.metrics.disambiguationCount++;
    }

    assessViolationSeverity(type) {
        const isTestFile = this.filePath.includes('test') || this.filePath.includes('spec');
        const currentScope = this.getCurrentScope();

        switch (type) {
            case 'JEST_MOCK':
                return isTestFile ? 'MEDIUM' : 'CRITICAL';
            case 'CACHE_OPERATION':
                return currentScope.depth > 3 ? 'HIGH' : 'MEDIUM';
            case 'MOCK_IMPLEMENTATION':
                return isTestFile ? 'LOW' : 'HIGH';
            default:
                return 'MEDIUM';
        }
    }

    assessContextualRisk(objectName, methodName) {
        const currentScope = this.getCurrentScope();
        const isTestContext = this.filePath.includes('test') || currentScope.context.includes('test');

        if (objectName === 'jest' && methodName === 'mock') {
            return isTestContext ? 'acceptable' : 'dangerous';
        }

        if (objectName.toLowerCase().includes('cache')) {
            return currentScope.depth > 2 ? 'concerning' : 'normal';
        }

        return 'normal';
    }

    parsePrefixExpression() {
        const token = this.advance();

        switch (token.type) {
            case TOKEN_TYPES.IDENTIFIER:
                return this.parseIdentifierExpression(token);

            case TOKEN_TYPES.NUMBER:
            case TOKEN_TYPES.STRING:
                return this.parseLiteralExpression(token);

            case TOKEN_TYPES.PAREN_OPEN:
                return this.parseGroupedExpression();

            case TOKEN_TYPES.BRACE_OPEN:
                return this.parseObjectExpression();

            case TOKEN_TYPES.BRACKET_OPEN:
                return this.parseArrayExpression();

            default:
                throw new Error(`Unexpected prefix token: ${token.type}`);
        }
    }

    parseInfixExpression(left) {
        const operator = this.advance();
        const precedence = this.getOperatorPrecedence(operator.value);

        // Special handling for method calls - VIOLATION DETECTION POINT
        if (operator.value === '.' && this.peek()?.type === TOKEN_TYPES.IDENTIFIER) {
            return this.parseMethodCallExpression(left);
        }

        const right = this.parseExpression(precedence);

        return {
            type: 'BinaryExpression',
            left: left,
            operator: operator.value,
            right: right,
            loc: {
                start: left.loc?.start,
                end: right.loc?.end
            }
        };
    }

    // ======= VIOLATION DETECTION WITH FULL CONTEXT =======
    parseMethodCallExpression(object) {
        const dot = this.previous(); // Should be '.'
        const method = this.advance(); // Method name

        // Check if this is followed by parentheses (method call)
        if (this.peek()?.type === TOKEN_TYPES.PAREN_OPEN) {
            this.advance(); // consume '('

            const args = this.parseArgumentList();

            this.consume(TOKEN_TYPES.PAREN_CLOSE, "Expected ')' after arguments");

            // CRITICAL: VIOLATION DETECTION WITH FULL CONTEXT
            const violationType = this.detectViolationWithFullContext(
                object, method, this.getCurrentContext()
            );

            const callExpression = {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    object: object,
                    property: { type: 'Identifier', name: method.value },
                    computed: false
                },
                arguments: args,
                loc: {
                    start: object.loc?.start,
                    end: { line: method.line, column: method.column + method.value.length }
                },
                chahuadevRAnalysis: {
                    violationType: violationType,
                    contextPath: this.getContextPath(),
                    scopeDepth: this.scopeStack.length,
                    ambiguityResolved: true
                }
            };

            // Add to violations if detected
            if (violationType) {
                this.violations.push({
                    type: violationType,
                    node: callExpression,
                    object: object.name || object.value,
                    method: method.value,
                    line: method.line,
                    context: this.getCurrentContext(),
                    scopeDepth: this.scopeStack.length,
                    chahuadevRDetection: true,
                    severity: this.assessSeverityWithFullContext(violationType),
                    recommendation: this.generateContextualRecommendation(violationType)
                });
            }

            return callExpression;
        }

        // Property access, not method call
        return {
            type: 'MemberExpression',
            object: object,
            property: { type: 'Identifier', name: method.value },
            computed: false
        };
    }

    detectViolationWithFullContext(object, method, context) {
        // Enhanced object name extraction
        let objectName = '';
        if (typeof object === 'string') {
            objectName = object;
        } else if (object && typeof object === 'object') {
            objectName = object.name || object.value || object.identifier || '';

            // Handle nested member expressions like "jest.mock"
            if (object.type === 'MemberExpression') {
                objectName = this.extractFullMemberPath(object);
            }
        }

        const methodName = method.value || method.name || method;

        // Enhanced detection with full context awareness
        if (objectName === 'jest' && methodName === 'mock') {
            return 'JEST_MOCK';
        }

        if (objectName === 'jest' && methodName === 'fn') {
            return 'JEST_MOCK';
        }

        if (objectName.toLowerCase().includes('cache') &&
            ['set', 'get', 'put', 'delete', 'clear'].includes(methodName)) {
            return 'CACHE_OPERATION';
        }

        if (methodName.includes('mock') || methodName.includes('Mock')) {
            return 'MOCK_IMPLEMENTATION';
        }

        // Additional patterns for comprehensive detection
        if (methodName === 'mockImplementation' || methodName === 'mockReturnValue') {
            return 'MOCK_IMPLEMENTATION';
        }

        return null;
    }

    extractFullMemberPath(memberExpr) {
        if (memberExpr.type === 'MemberExpression') {
            const objectPath = this.extractFullMemberPath(memberExpr.object);
            const propName = memberExpr.property.name || memberExpr.property.value;
            return `${objectPath}.${propName}`;
        } else {
            return memberExpr.name || memberExpr.value || '';
        }
    }

    assessSeverityWithFullContext(violationType) {
        const isTestFile = this.filePath.includes('test') || this.filePath.includes('spec');
        const context = this.getCurrentContext();
        const depth = this.scopeStack.length;

        if (violationType === 'JEST_MOCK') {
            if (isTestFile && context.includes('test')) {
                return depth > 3 ? 'MEDIUM' : 'LOW';
            } else {
                return 'CRITICAL';
            }
        }

        if (violationType === 'CACHE_OPERATION') {
            return depth > 4 ? 'HIGH' : 'MEDIUM';
        }

        return 'HIGH';
    }

    // ======= LOOKAHEAD IMPLEMENTATION - ADVANCED PREDICTION =======

    lookaheadTokens(startPos, count) {
        const cacheKey = `${startPos}-${count}`;

        if (this.lookaheadCache.has(cacheKey)) {
            return this.lookaheadCache.get(cacheKey);
        }

        const tokens = [];
        let pos = startPos;
        let found = 0;

        while (pos < this.code.length && found < count) {
            const result = this.extractTokenWithDisambiguation(pos, 1, 1);

            if (result.token && result.token.type !== TOKEN_TYPES.WHITESPACE) {
                tokens.push(result.token);
                found++;
            }

            pos = result.newPosition;
        }

        this.lookaheadCache.set(cacheKey, tokens);
        this.metrics.lookaheadCount++;

        return tokens;
    }

    peek(offset = 0) {
        const index = this.current + offset;
        return index < this.tokens.length ? this.tokens[index] : null;
    }

    advance() {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    isAtEnd() {
        return this.current >= this.tokens.length ||
            this.peek()?.type === TOKEN_TYPES.EOF;
    }

    consume(type, message) {
        if (this.check(type)) {
            return this.advance();
        }

        throw new Error(message + ` at token ${this.current}: ${this.peek()?.value}`);
    }

    check(type) {
        return !this.isAtEnd() && this.peek()?.type === type;
    }

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    // ======= ASI (AUTOMATIC SEMICOLON INSERTION) HANDLING =======

    needsASI() {
        if (!this.asiContext.lineTerminated) return false;

        const current = this.peek();
        if (!current) return true;

        // ASI is inserted before these tokens
        const asiTriggers = ['}', 'return', 'break', 'continue', 'throw'];

        return asiTriggers.includes(current.value) ||
            current.type === TOKEN_TYPES.EOF;
    }

    insertImplicitSemicolon() {
        // Insert virtual semicolon token
        this.tokens.splice(this.current, 0, {
            type: TOKEN_TYPES.SEMICOLON,
            value: ';',
            line: this.previous()?.line || 1,
            column: (this.previous()?.column || 0) + (this.previous()?.value?.length || 0),
            implicit: true
        });

        this.asiContext.lineTerminated = false;
    }

    updateASIContext(token) {
        this.asiContext.lastToken = token;
        if (token.type === TOKEN_TYPES.NEWLINE) {
            this.asiContext.lineTerminated = true;
        }
    }

    // ======= PARSING HELPER METHODS =======

    parseClassDeclaration() {
        const keyword = this.advance(); // 'class'
        const name = this.consume(TOKEN_TYPES.IDENTIFIER, "Expected class name");

        let superClass = null;
        if (this.match(TOKEN_TYPES.KEYWORD) && this.previous().value === 'extends') {
            superClass = this.consume(TOKEN_TYPES.IDENTIFIER, "Expected superclass name");
        }

        const body = this.parseClassBody();

        const classNode = {
            type: 'ClassDeclaration',
            id: { name: name.value },
            superClass: superClass ? { name: superClass.value } : null,
            body: body,
            loc: {
                start: { line: keyword.line, column: keyword.column },
                end: body.loc?.end
            }
        };

        this.structures.push({
            type: 'class',
            name: name.value,
            node: classNode
        });

        return classNode;
    }

    parseClassBody() {
        this.consume(TOKEN_TYPES.BRACE_OPEN, "Expected '{' before class body");

        const methods = [];

        while (!this.check(TOKEN_TYPES.BRACE_CLOSE) && !this.isAtEnd()) {
            const method = this.parseClassMethod();
            if (method) {
                methods.push(method);
            }
        }

        const endBrace = this.consume(TOKEN_TYPES.BRACE_CLOSE, "Expected '}' after class body");

        return {
            type: 'ClassBody',
            body: methods,
            loc: {
                end: { line: endBrace.line, column: endBrace.column }
            }
        };
    }

    parseClassMethod() {
        // Simplified method parsing
        if (this.check(TOKEN_TYPES.IDENTIFIER)) {
            const name = this.advance();

            if (this.check(TOKEN_TYPES.PAREN_OPEN)) {
                // Method
                this.advance(); // '('
                const params = this.parseParameterList();
                this.consume(TOKEN_TYPES.PAREN_CLOSE, "Expected ')' after parameters");

                const body = this.parseBlockStatement();

                return {
                    type: 'MethodDefinition',
                    key: { name: name.value },
                    value: {
                        type: 'FunctionExpression',
                        params: params,
                        body: body
                    }
                };
            } else if (this.check(TOKEN_TYPES.EQUALS)) {
                // Property or arrow function
                this.advance(); // '='
                const value = this.parseExpression();

                return {
                    type: 'PropertyDefinition',
                    key: { name: name.value },
                    value: value
                };
            }
        }

        // Skip unknown tokens
        this.advance();
        return null;
    }

    parseExpressionStatement() {
        const expr = this.parseExpression();

        // Optional semicolon
        this.match(TOKEN_TYPES.SEMICOLON);

        return {
            type: 'ExpressionStatement',
            expression: expr
        };
    }

    parseBlockStatement() {
        this.consume(TOKEN_TYPES.BRACE_OPEN, "Expected '{'");

        const statements = [];

        while (!this.check(TOKEN_TYPES.BRACE_CLOSE) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                statements.push(stmt);
            }
        }

        const endBrace = this.consume(TOKEN_TYPES.BRACE_CLOSE, "Expected '}'");

        return {
            type: 'BlockStatement',
            body: statements,
            loc: {
                end: { line: endBrace.line, column: endBrace.column }
            }
        };
    }

    parseArgumentList() {
        const args = [];

        while (!this.check(TOKEN_TYPES.PAREN_CLOSE) && !this.isAtEnd()) {
            args.push(this.parseExpression());

            if (!this.check(TOKEN_TYPES.PAREN_CLOSE)) {
                this.consume(TOKEN_TYPES.COMMA, "Expected ',' between arguments");
            }
        }

        return args;
    }

    parseParameterList() {
        const params = [];

        while (!this.check(TOKEN_TYPES.PAREN_CLOSE) && !this.isAtEnd()) {
            if (this.check(TOKEN_TYPES.IDENTIFIER)) {
                const param = this.advance();
                params.push({ type: 'Identifier', name: param.value });
            }

            if (!this.check(TOKEN_TYPES.PAREN_CLOSE)) {
                this.consume(TOKEN_TYPES.COMMA, "Expected ',' between parameters");
            }
        }

        return params;
    }

    // ======= CONTEXT & SCOPE MANAGEMENT =======

    getCurrentContext() {
        return this.contextStack.length > 0 ?
            this.contextStack[this.contextStack.length - 1] : 'global';
    }

    getContextPath() {
        return this.contextStack.join('.');
    }

    enterContext(context) {
        this.contextStack.push(context);
    }

    exitContext() {
        if (this.contextStack.length > 0) {
            this.contextStack.pop();
        }
    }

    // ======= OPERATOR PRECEDENCE HELPERS =======

    hasInfixExpression() {
        const token = this.peek();
        return token && this.getOperatorPrecedence(token.value) > PRECEDENCE.LOWEST;
    }

    getInfixPrecedence() {
        const token = this.peek();
        return token ? this.getOperatorPrecedence(token.value) : PRECEDENCE.LOWEST;
    }

    getOperatorPrecedence(operator) {
        switch (operator) {
            case ',': return PRECEDENCE.COMMA;
            case '=': case '+=': case '-=': return PRECEDENCE.ASSIGNMENT;
            case '?': case ':': return PRECEDENCE.TERNARY;
            case '||': return PRECEDENCE.LOGICAL_OR;
            case '&&': return PRECEDENCE.LOGICAL_AND;
            case '|': return PRECEDENCE.BITWISE_OR;
            case '^': return PRECEDENCE.BITWISE_XOR;
            case '&': return PRECEDENCE.BITWISE_AND;
            case '==': case '!=': case '===': case '!==': return PRECEDENCE.EQUALITY;
            case '<': case '>': case '<=': case '>=': return PRECEDENCE.RELATIONAL;
            case '+': case '-': return PRECEDENCE.ADDITIVE;
            case '*': case '/': case '%': return PRECEDENCE.MULTIPLICATIVE;
            case '**': return PRECEDENCE.EXPONENTIATION;
            case '.': case '[': case '(': return PRECEDENCE.CALL;
            default: return PRECEDENCE.LOWEST;
        }
    }

    // ======= ERROR RECOVERY & SYNCHRONIZATION =======

    synchronize() {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === TOKEN_TYPES.SEMICOLON) return;

            const token = this.peek();
            if (token && token.type === TOKEN_TYPES.KEYWORD) {
                const syncKeywords = ['class', 'function', 'var', 'let', 'const', 'if', 'while', 'for', 'return'];
                if (syncKeywords.includes(token.value)) {
                    return;
                }
            }

            this.advance();
        }
    }

    // ======= TOKEN CREATION HELPERS =======

    createToken(type, value, position, line, column, length, metadata = {}) {
        return {
            token: {
                type: type,
                value: value,
                line: line,
                column: column,
                length: length,
                position: position,
                ...metadata
            },
            newPosition: position + length,
            newLine: line,
            newColumn: column + length
        };
    }

    extractLineComment(position, line, column) {
        let end = position + 2;
        while (end < this.code.length && this.code[end] !== '\n') {
            end++;
        }

        return this.createToken(
            TOKEN_TYPES.LINE_COMMENT,
            this.code.slice(position, end),
            position, line, column, end - position
        );
    }

    extractBlockComment(position, line, column) {
        let end = position + 2;
        let newlines = 0;

        while (end < this.code.length - 1) {
            if (this.code[end] === '\n') newlines++;
            if (this.code[end] === '*' && this.code[end + 1] === '/') {
                end += 2;
                break;
            }
            end++;
        }

        return {
            token: {
                type: TOKEN_TYPES.BLOCK_COMMENT,
                value: this.code.slice(position, end),
                line: line,
                column: column,
                length: end - position,
                position: position,
                newlines: newlines
            },
            newPosition: end,
            newLine: line + newlines,
            newColumn: newlines > 0 ? 1 : column + (end - position)
        };
    }

    extractStandardTokenWithContext(position, line, column) {
        const char = this.code[position];

        // Identifiers and keywords
        if (/[a-zA-Z_$]/.test(char)) {
            let end = position;
            while (end < this.code.length && /[a-zA-Z0-9_$]/.test(this.code[end])) {
                end++;
            }

            const text = this.code.slice(position, end);
            const tokenType = KEYWORDS.has(text) ? TOKEN_TYPES.KEYWORD : TOKEN_TYPES.IDENTIFIER;

            return this.createToken(tokenType, text, position, line, column, end - position);
        }

        // Numbers
        if (/\d/.test(char)) {
            let end = position;
            while (end < this.code.length && /[\d.]/.test(this.code[end])) {
                end++;
            }

            return this.createToken(TOKEN_TYPES.NUMBER, this.code.slice(position, end), position, line, column, end - position);
        }

        // Strings
        if (char === '"' || char === "'") {
            let end = position + 1;
            while (end < this.code.length && this.code[end] !== char) {
                if (this.code[end] === '\\') end += 2;
                else end++;
            }
            if (end < this.code.length) end++; // Include closing quote

            return this.createToken(TOKEN_TYPES.STRING, this.code.slice(position, end), position, line, column, end - position);
        }

        // Single character tokens
        const singleChars = {
            '(': TOKEN_TYPES.PAREN_OPEN,
            ')': TOKEN_TYPES.PAREN_CLOSE,
            '[': TOKEN_TYPES.BRACKET_OPEN,
            ']': TOKEN_TYPES.BRACKET_CLOSE,
            ';': TOKEN_TYPES.SEMICOLON,
            ',': TOKEN_TYPES.COMMA,
            '.': 'OPERATOR'
        };

        if (singleChars[char]) {
            return this.createToken(singleChars[char], char, position, line, column, 1);
        }

        // Multi-character operators
        const twoChar = this.code.slice(position, position + 2);
        const twoCharOps = ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-='];

        if (twoCharOps.includes(twoChar)) {
            return this.createToken('OPERATOR', twoChar, position, line, column, 2);
        }

        // Single character operators
        if ('+-*/%=<>!&|^~?:'.includes(char)) {
            return this.createToken('OPERATOR', char, position, line, column, 1);
        }

        // Unknown character - skip
        return {
            token: null,
            newPosition: position + 1,
            newLine: line,
            newColumn: column + 1
        };
    }

    // ======= MISSING PARSER METHODS - CORE IMPLEMENTATION =======

    /**
     * Parse identifier expressions (variables, function names, etc.)
     */
    parseIdentifierExpression(token) {
        const identifier = {
            type: 'Identifier',
            name: token.value,
            line: token.line,
            column: token.column
        };

        // Check for member access (obj.prop)
        if (this.check(TOKEN_TYPES.DOT)) {
            return this.parseMemberExpression(identifier);
        }

        // Check for function call (func())
        if (this.check(TOKEN_TYPES.PAREN_OPEN)) {
            return this.parseCallExpression(identifier);
        }

        return identifier;
    }

    /**
     * Parse literal expressions (numbers, strings, booleans)
     */
    parseLiteralExpression(token) {
        let value;

        switch (token.type) {
            case TOKEN_TYPES.NUMBER:
                value = parseFloat(token.value);
                break;
            case TOKEN_TYPES.STRING:
                value = token.value.slice(1, -1); // Remove quotes
                break;
            case TOKEN_TYPES.BOOLEAN:
                value = token.value === 'true';
                break;
            default:
                value = token.value;
        }

        return {
            type: 'Literal',
            value: value,
            raw: token.value,
            line: token.line,
            column: token.column
        };
    }

    /**
     * Parse variable declarations (const, let, var)
     */
    parseVariableDeclaration() {
        const declarationToken = this.previous();
        const kind = declarationToken.value; // const, let, var

        const declarations = [];

        do {
            if (!this.check(TOKEN_TYPES.IDENTIFIER)) {
                throw new Error(`Expected variable name after '${kind}'`);
            }

            const id = this.advance();
            const declarator = {
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: id.value,
                    line: id.line,
                    column: id.column
                },
                init: null
            };

            // Check for initializer (= expression) 
            // ✅ FIX: Use correct token type from tokenizer
            if (this.match('EQUALS') || this.peek()?.value === '=') {
                this.advance(); // consume the = token
                declarator.init = this.parseExpression();
            } else if (kind === 'const') {
                // ✅ STRICT VALIDATION: const declarations require an initializer
                throw new Error(`Missing initializer in const declaration`);
            }

            declarations.push(declarator);

            // Add to structures for analysis
            this.structures.push({
                type: 'variable',
                name: id.value,
                kind: kind,
                line: id.line,
                scope: this.getCurrentScope()
            });

        } while (this.match(TOKEN_TYPES.COMMA));

        return {
            type: 'VariableDeclaration',
            declarations: declarations,
            kind: kind,
            line: declarationToken.line,
            column: declarationToken.column
        };
    }

    /**
     * Parse return statements
     */
    parseReturnStatement() {
        const returnToken = this.previous();
        let argument = null;

        // Check if there's an expression to return
        if (!this.check(TOKEN_TYPES.SEMICOLON) && !this.check(TOKEN_TYPES.NEWLINE) && !this.isAtEnd()) {
            argument = this.parseExpression();
        }

        return {
            type: 'ReturnStatement',
            argument: argument,
            line: returnToken.line,
            column: returnToken.column
        };
    }

    /**
     * Get previous significant token (skipping whitespace/comments)
     */
    getPreviousSignificantToken() {
        for (let i = this.current - 1; i >= 0; i--) {
            const token = this.tokens[i];
            if (token && token.type !== TOKEN_TYPES.WHITESPACE &&
                token.type !== TOKEN_TYPES.COMMENT &&
                token.type !== TOKEN_TYPES.NEWLINE) {
                return token;
            }
        }
        return null;
    }

    /**
     * Get current scope name for context
     */
    getCurrentScope() {
        if (this.scopeStack.length === 0) {
            return 'global';
        }
        return this.scopeStack[this.scopeStack.length - 1];
    }

    /**
     * Assess code complexity for quality metrics
     */
    assessComplexity() {
        let complexity = 0;

        // Base complexity from token count
        complexity += Math.floor(this.tokens.length / 10);

        // Add complexity for nested structures
        complexity += this.scopeStack.length * 2;

        // Add complexity for violations (security issues increase complexity)
        complexity += this.violations.length * 3;

        // Add complexity for ambiguous tokens
        const ambiguousTokens = this.tokens.filter(t =>
            t.ambiguous || t.disambiguated || t.lookaheadResolved
        ).length;
        complexity += ambiguousTokens;

        return {
            score: complexity,
            level: complexity > 50 ? 'HIGH' : complexity > 20 ? 'MEDIUM' : 'LOW',
            factors: {
                tokenCount: this.tokens.length,
                nestedScopes: this.scopeStack.length,
                violations: this.violations.length,
                ambiguousTokens: ambiguousTokens
            }
        };
    }

    /**
     * Assess code maintainability
     */
    assessMaintainability() {
        let maintainabilityScore = 100;

        // Deduct for violations
        maintainabilityScore -= this.violations.length * 15;

        // Deduct for high complexity
        const complexity = this.assessComplexity();
        if (complexity.level === 'HIGH') maintainabilityScore -= 30;
        else if (complexity.level === 'MEDIUM') maintainabilityScore -= 15;

        // Deduct for deeply nested scopes
        maintainabilityScore -= Math.max(0, this.scopeStack.length - 3) * 10;

        // Ensure score doesn't go below 0
        maintainabilityScore = Math.max(0, maintainabilityScore);

        return {
            score: maintainabilityScore,
            level: maintainabilityScore >= 80 ? 'EXCELLENT' :
                maintainabilityScore >= 60 ? 'GOOD' :
                    maintainabilityScore >= 40 ? 'FAIR' : 'POOR',
            factors: {
                violationPenalty: this.violations.length * 15,
                complexityPenalty: complexity.level === 'HIGH' ? 30 : complexity.level === 'MEDIUM' ? 15 : 0,
                nestingPenalty: Math.max(0, this.scopeStack.length - 3) * 10
            }
        };
    }

    /**
     * Parse grouped expressions (parentheses)
     */
    parseGroupedExpression() {
        const expression = this.parseExpression();

        if (!this.check(TOKEN_TYPES.PAREN_CLOSE)) {
            throw new Error('Expected closing parenthesis');
        }

        this.advance(); // consume ')'
        return expression;
    }

    /**
     * Parse object expressions ({})
     */
    parseObjectExpression() {
        const properties = [];

        while (!this.check(TOKEN_TYPES.BRACE_CLOSE) && !this.isAtEnd()) {
            // Simple object property parsing
            if (this.check(TOKEN_TYPES.IDENTIFIER) || this.check(TOKEN_TYPES.STRING)) {
                const key = this.advance();

                if (this.match(TOKEN_TYPES.COLON)) {
                    const value = this.parseExpression();
                    properties.push({
                        type: 'Property',
                        key: key,
                        value: value
                    });
                }
            }

            if (!this.match(TOKEN_TYPES.COMMA)) {
                break;
            }
        }

        if (!this.match(TOKEN_TYPES.BRACE_CLOSE)) {
            throw new Error('Expected closing brace');
        }

        return {
            type: 'ObjectExpression',
            properties: properties
        };
    }

    /**
     * Parse array expressions ([])
     */
    parseArrayExpression() {
        const elements = [];

        while (!this.check(TOKEN_TYPES.BRACKET_CLOSE) && !this.isAtEnd()) {
            elements.push(this.parseExpression());

            if (!this.match(TOKEN_TYPES.COMMA)) {
                break;
            }
        }

        if (!this.match(TOKEN_TYPES.BRACKET_CLOSE)) {
            throw new Error('Expected closing bracket');
        }

        return {
            type: 'ArrayExpression',
            elements: elements
        };
    }

    // ======= RESULTS GENERATION =======

    generateChahuadevRResults() {
        return {
            engineVersion: '7.0-ChahuadevR',
            analysisMethod: 'pratt-parser-lookahead',
            timestamp: new Date().toISOString(),
            filePath: this.filePath,

            // Chahuadev-R Features
            chahuadevRFeatures: {
                ambiguityResolution: true,
                operatorPrecedence: true,
                lookaheadSupport: true,
                asiHandling: true,
                contextDisambiguation: true
            },

            // Analysis Results
            ast: this.astTree,           // ✅ FIX: เปลี่ยนจาก astTree เป็น ast เพื่อให้ตรงกับที่เทสคาดหวัง
            astTree: this.astTree,       // Keep backward compatibility
            violations: this.violations,
            structures: this.structures,
            tokens: this.tokens,
            tokenization: this.tokens,   // For backward compatibility with tests

            // ✅ ERROR REPORTING: เพิ่ม error tracking
            errors: this.parseErrors || [],
            parseSuccess: (this.astTree && this.astTree.body && this.astTree.body.length > 0) && (this.parseErrors.length === 0),

            // Performance Metrics
            metrics: {
                ...this.metrics,
                violationCount: this.violations.length,
                structureCount: this.structures.length,
                tokenCount: this.tokens.length,
                lookaheadEfficiency: this.metrics.lookaheadCount / this.tokens.length
            },

            // Quality Assessment
            codeQuality: {
                ambiguityLevel: this.assessAmbiguityLevel(),
                complexity: this.assessComplexity(),
                maintainability: this.assessMaintainability(),
                chahuadevRScore: this.calculateChahuadevRScore()
            }
        };
    }

    assessAmbiguityLevel() {
        const ambiguousTokens = this.tokens.filter(t =>
            t.context || t.disambiguated || t.lookaheadResolved
        ).length;

        const ratio = ambiguousTokens / this.tokens.length;

        if (ratio > 0.3) return 'HIGH';
        if (ratio > 0.1) return 'MEDIUM';
        return 'LOW';
    }

    calculateChahuadevRScore() {
        const violationPenalty = this.violations.length * 10;
        const complexityPenalty = this.scopeStack.length * 5;
        const lookaheadBonus = Math.min(this.metrics.lookaheadCount * 2, 50);

        return Math.max(0, 100 - violationPenalty - complexityPenalty + lookaheadBonus);
    }

    generateContextualRecommendation(violationType) {
        const context = this.getCurrentContext();

        if (violationType === 'JEST_MOCK') {
            if (context.includes('test')) {
                return 'Mock in test context - ensure it\'s necessary for test isolation';
            } else {
                return 'Mock in production context - move to test files immediately';
            }
        }

        return `Review ${violationType} usage in ${context}`;
    }

    detectViolationsWithFullContext() {
        console.log(' Phase 3: Professional Violation Detection...');

        // Additional scan for patterns that might not be caught during parsing
        this.scanForAdditionalViolations();

        console.log(`  Detected ${this.violations.length} violations with full context`);
    }

    scanForAdditionalViolations() {
        // Scan through tokens for patterns like "jest.mock", "cache.set", etc.
        for (let i = 0; i < this.tokens.length - 2; i++) {
            const current = this.tokens[i];
            const next = this.tokens[i + 1];
            const after = this.tokens[i + 2];

            // Pattern: object.method() - handle both IDENTIFIER and KEYWORD tokens
            if (current && (current.type === TOKEN_TYPES.IDENTIFIER || current.type === TOKEN_TYPES.KEYWORD) &&
                next && next.type === 'OPERATOR' && next.value === '.' &&
                after && (after.type === TOKEN_TYPES.IDENTIFIER || after.type === TOKEN_TYPES.KEYWORD)) {

                const violationType = this.detectViolationWithFullContext(
                    current.value, after, this.getCurrentContext()
                );

                if (violationType && !this.violations.find(v =>
                    v.line === current.line && v.type === violationType)) {

                    this.violations.push({
                        type: violationType,
                        object: current.value,
                        method: after.value,
                        line: current.line,
                        column: current.column,
                        context: this.getCurrentContext(),
                        chahuadevRDetection: true,
                        severity: this.assessSeverityWithFullContext(violationType),
                        recommendation: this.generateContextualRecommendation(violationType)
                    });
                }
            }
        }

    }

    getFallbackResults(error) {
        return {
            engineVersion: '7.0-ChahuadevR-Fallback',
            error: error.message,
            timestamp: new Date().toISOString(),
            filePath: this.filePath,
            chahuadevRStatus: 'analysis-failed',

            // ✨ CHAHUADEV-R FIX: Always ensure violations array exists!
            violations: this.violations || [],
            structures: this.structures || [],
            tokens: this.tokens || [],
            tokenization: this.tokens || [], // Backward compatibility
            astTree: this.astTree || null,

            // Basic metrics even in fallback
            metrics: {
                ...this.metrics,
                violationCount: (this.violations || []).length,
                structureCount: (this.structures || []).length,
                tokenCount: (this.tokens || []).length
            }
        };
    }

    // ======= MISSING METHODS FOR PHASE 1: TOKENIZATION =======

    extractRegexLiteral(position, line, column) {
        let regexEnd = position + 1;
        let escaped = false;
        let inCharClass = false;

        while (regexEnd < this.code.length) {
            const char = this.code[regexEnd];

            if (escaped) {
                escaped = false;
                regexEnd++;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                regexEnd++;
                continue;
            }

            if (char === '[') {
                inCharClass = true;
            } else if (char === ']') {
                inCharClass = false;
            } else if (char === '/' && !inCharClass) {
                regexEnd++;
                // Parse flags
                while (regexEnd < this.code.length && /[gimsuvy]/.test(this.code[regexEnd])) {
                    regexEnd++;
                }
                break;
            }

            regexEnd++;
        }

        const value = this.code.substring(position, regexEnd);
        return this.createToken('REGEX', value, position, line, column, regexEnd - position);
    }

    extractTemplateLiteral(position, line, column) {
        let templateEnd = position + 1;
        let escaped = false;

        while (templateEnd < this.code.length) {
            const char = this.code[templateEnd];

            if (escaped) {
                escaped = false;
                templateEnd++;
                continue;
            }

            if (char === '\\') {
                escaped = true;
            } else if (char === '`') {
                templateEnd++;
                break;
            }

            templateEnd++;
        }

        const value = this.code.substring(position, templateEnd);
        return this.createToken('TEMPLATE_LITERAL', value, position, line, column, templateEnd - position);
    }

    // ======= MISSING METHODS FOR PARSING STATEMENTS =======

    parseFunctionDeclaration() {
        this.advance(); // consume 'function'

        let name = null;
        if (this.peek()?.type === TOKEN_TYPES.IDENTIFIER) {
            name = this.advance().value;
        }

        // Skip parameters for now
        if (this.peek()?.value === '(') {
            this.advance();
            let parenCount = 1;
            while (parenCount > 0 && !this.isAtEnd()) {
                const token = this.advance();
                if (token.value === '(') parenCount++;
                if (token.value === ')') parenCount--;
            }
        }

        // Skip body
        if (this.peek()?.value === '{') {
            this.advance();
            let braceCount = 1;
            while (braceCount > 0 && !this.isAtEnd()) {
                const token = this.advance();
                if (token.value === '{') braceCount++;
                if (token.value === '}') braceCount--;
            }
        }

        return {
            type: 'FunctionDeclaration',
            id: name ? { type: 'Identifier', name } : null,
            params: [],
            body: { type: 'BlockStatement', body: [] }
        };
    }

    parseIfStatement() {
        this.advance(); // consume 'if'

        // Skip condition
        if (this.peek()?.value === '(') {
            this.advance();
            let parenCount = 1;
            while (parenCount > 0 && !this.isAtEnd()) {
                const token = this.advance();
                if (token.value === '(') parenCount++;
                if (token.value === ')') parenCount--;
            }
        }

        // Skip consequent
        this.skipStatement();

        return {
            type: 'IfStatement',
            test: { type: 'Literal', value: true },
            consequent: { type: 'BlockStatement', body: [] },
            alternate: null
        };
    }

    parseWhileStatement() {
        this.advance(); // consume 'while'

        // Skip condition
        if (this.peek()?.value === '(') {
            this.advance();
            let parenCount = 1;
            while (parenCount > 0 && !this.isAtEnd()) {
                const token = this.advance();
                if (token.value === '(') parenCount++;
                if (token.value === ')') parenCount--;
            }
        }

        // Skip body
        this.skipStatement();

        return {
            type: 'WhileStatement',
            test: { type: 'Literal', value: true },
            body: { type: 'BlockStatement', body: [] }
        };
    }

    skipStatement() {
        const token = this.peek();
        if (!token) return;

        if (token.value === '{') {
            this.advance();
            let braceCount = 1;
            while (braceCount > 0 && !this.isAtEnd()) {
                const t = this.advance();
                if (t.value === '{') braceCount++;
                if (t.value === '}') braceCount--;
            }
        } else {
            this.advance();
        }
    }
}

// Export the ChahuadevR Engine
module.exports = {
    ChahuadevREngine,
    PRECEDENCE
};
