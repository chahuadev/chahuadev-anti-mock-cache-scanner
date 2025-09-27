// ======================================================================
// ENHANCED JAVASCRIPT TOKENIZER ENGINE v1.0 
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @version 1.0.0
// @license MIT
// @contact chahuadev@gmail.com
// ======================================================================


// Token types:ประเภทของโทเค็น
const TOKEN_TYPES = {
    // คำหลัก - Keywords
    KEYWORD: 'KEYWORD',

    // ชื่อตัวแปร/ฟังก์ชัน - Identifiers
    IDENTIFIER: 'IDENTIFIER',

    // เครื่องหมาย - Operators and punctuation
    EQUALS: 'EQUALS',           // =
    ARROW: 'ARROW',             // =>
    PAREN_OPEN: 'PAREN_OPEN',   // (
    PAREN_CLOSE: 'PAREN_CLOSE', // )
    BRACE_OPEN: 'BRACE_OPEN',   // {
    BRACE_CLOSE: 'BRACE_CLOSE', // }
    BRACKET_OPEN: 'BRACKET_OPEN',   // [
    BRACKET_CLOSE: 'BRACKET_CLOSE', // ]
    SEMICOLON: 'SEMICOLON',     // ;
    COMMA: 'COMMA',             // ,

    // คอมเมนต์ - Comments
    LINE_COMMENT: 'LINE_COMMENT',     // //
    BLOCK_COMMENT: 'BLOCK_COMMENT',   // /* */

    // สตริง - Strings
    STRING: 'STRING',

    // ตัวเลข - Numbers
    NUMBER: 'NUMBER',

    // ช่องว่าง - Whitespace
    WHITESPACE: 'WHITESPACE',
    NEWLINE: 'NEWLINE',

    // จุดสิ้นสุด - End of file
    EOF: 'EOF'
};

// คำหลักของ JavaScript, TypeScript, JSX, TSX ครบถ้วน - Complete keywords for JS/TS/JSX/TSX
const KEYWORDS = new Set([
    // ═══════════════════════════════════════════════════════════════
    // JavaScript Core Keywords
    // ═══════════════════════════════════════════════════════════════
    'function', 'const', 'let', 'var', 'async', 'await',
    'class', 'constructor', 'static', 'get', 'set', 'abstract',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case',
    'return', 'break', 'continue', 'throw', 'try', 'catch',
    'import', 'export', 'default', 'from', 'as', 'finally',
    'with', 'delete', 'new', 'this', 'super', 'instanceof',
    'of', 'in', 'null', 'undefined', 'true', 'false',
    'yield', 'debugger', 'arguments', 'eval',

    // ═══════════════════════════════════════════════════════════════
    // TypeScript Specific Keywords
    // ═══════════════════════════════════════════════════════════════
    'interface', 'type', 'enum', 'namespace', 'module',
    'declare', 'readonly', 'public', 'private', 'protected',
    'implements', 'extends', 'keyof', 'typeof', 'infer',
    'never', 'unknown', 'any', 'void', 'string', 'number', 'boolean',
    'object', 'symbol', 'bigint', 'unique', 'is', 'asserts',
    'override', 'satisfies', 'out', 'in', 'const',

    // ═══════════════════════════════════════════════════════════════
    // Advanced TypeScript Utility Types & Keywords
    // ═══════════════════════════════════════════════════════════════
    'Partial', 'Required', 'Pick', 'Omit', 'Exclude', 'Extract',
    'NonNullable', 'Parameters', 'ReturnType', 'InstanceType',
    'ThisType', 'Record', 'Readonly', 'Array', 'Promise',
    'Awaited', 'ConstructorParameters', 'ThisParameterType',
    'OmitThisParameter', 'Uppercase', 'Lowercase', 'Capitalize', 'Uncapitalize',

    // ═══════════════════════════════════════════════════════════════
    // React Core Components & Hooks
    // ═══════════════════════════════════════════════════════════════
    'React', 'Component', 'PureComponent', 'memo', 'forwardRef',
    'createContext', 'useContext', 'createRef', 'useRef',
    'useState', 'useEffect', 'useReducer', 'useCallback', 'useMemo',
    'useLayoutEffect', 'useImperativeHandle', 'useDebugValue',
    'useDeferredValue', 'useTransition', 'useId', 'useSyncExternalStore',
    'useInsertionEffect', 'startTransition', 'flushSync',

    // ═══════════════════════════════════════════════════════════════
    // React Advanced Components & APIs  
    // ═══════════════════════════════════════════════════════════════
    'Fragment', 'StrictMode', 'Suspense', 'SuspenseList', 'Profiler',
    'createElement', 'createFactory', 'cloneElement', 'isValidElement',
    'Children', 'lazy', 'ErrorBoundary', 'Portal', 'createPortal',

    // ═══════════════════════════════════════════════════════════════
    // React Router & State Management
    // ═══════════════════════════════════════════════════════════════
    'Router', 'Route', 'Routes', 'Link', 'NavLink', 'Navigate',
    'useNavigate', 'useLocation', 'useParams', 'useSearchParams',
    'Outlet', 'BrowserRouter', 'HashRouter', 'MemoryRouter',
    'Provider', 'Consumer', 'connect', 'useSelector', 'useDispatch',

    // ═══════════════════════════════════════════════════════════════
    // JSX Specific Elements & Attributes
    // ═══════════════════════════════════════════════════════════════
    'JSX', 'IntrinsicElements', 'ElementType', 'ComponentProps',
    'PropsWithChildren', 'PropsWithRef', 'RefAttributes',
    'ClassAttributes', 'HTMLAttributes', 'DOMAttributes',
    'CSSProperties', 'MouseEvent', 'KeyboardEvent', 'FormEvent',
    'ChangeEvent', 'FocusEvent', 'TouchEvent', 'WheelEvent',

    // ═══════════════════════════════════════════════════════════════
    // Next.js Specific Keywords
    // ═══════════════════════════════════════════════════════════════
    'GetServerSideProps', 'GetStaticProps', 'GetStaticPaths',
    'NextPage', 'NextApiRequest', 'NextApiResponse', 'NextApiHandler',
    'AppProps', 'Document', 'Head', 'Image', 'Link',
    'useRouter', 'withRouter', 'getServerSideProps', 'getStaticProps',

    // ═══════════════════════════════════════════════════════════════
    // Node.js & Server-side Keywords
    // ═══════════════════════════════════════════════════════════════
    'require', 'module', 'exports', '__dirname', '__filename',
    'process', 'global', 'Buffer', 'console', 'setTimeout', 'setInterval',
    'clearTimeout', 'clearInterval', 'setImmediate', 'clearImmediate',

    // ═══════════════════════════════════════════════════════════════
    // Testing Framework Keywords
    // ═══════════════════════════════════════════════════════════════
    'describe', 'it', 'test', 'expect', 'beforeEach', 'afterEach',
    'beforeAll', 'afterAll', 'jest', 'mock', 'spy', 'stub',
    'render', 'screen', 'fireEvent', 'waitFor', 'act',

    // ═══════════════════════════════════════════════════════════════
    // Build Tools & Bundlers Keywords
    // ═══════════════════════════════════════════════════════════════
    'webpack', 'vite', 'rollup', 'parcel', 'babel', 'tsc',
    'eslint', 'prettier', 'tsconfig', 'package', 'dependencies',

    // ═══════════════════════════════════════════════════════════════
    // CSS-in-JS & Styling Libraries
    // ═══════════════════════════════════════════════════════════════
    'styled', 'css', 'keyframes', 'createGlobalStyle', 'ThemeProvider',
    'makeStyles', 'useStyles', 'withStyles', 'createStyles',
    'Box', 'Stack', 'Grid', 'Container', 'Paper', 'Card',

    // ═══════════════════════════════════════════════════════════════
    // Database & API Keywords
    // ═══════════════════════════════════════════════════════════════
    'fetch', 'axios', 'query', 'mutation', 'subscription',
    'GraphQL', 'REST', 'API', 'endpoint', 'middleware',
    'mongoose', 'prisma', 'sequelize', 'typeorm', 'knex',

    // ═══════════════════════════════════════════════════════════════
    // Common Library & Framework Keywords
    // ═══════════════════════════════════════════════════════════════
    'lodash', 'moment', 'dayjs', 'date-fns', 'ramda',
    'rxjs', 'observable', 'subject', 'subscription',
    'express', 'koa', 'fastify', 'nest', 'apollo',

    // ═══════════════════════════════════════════════════════════════
    // Development & Debugging Keywords
    // ═══════════════════════════════════════════════════════════════
    'development', 'production', 'staging', 'test',
    'debug', 'trace', 'warn', 'error', 'info', 'log',
    'performance', 'profiler', 'benchmark', 'optimization'
]);

// ======================================================================
// Security Manager สำหรับ Parser/ระบบจัดการความปลอดภัยสำหรับ Parser
// ======================================================================
class TokenizerSecurityManager {
    constructor(options = {}) {
        // SECURITY: กำหนดขีดจำกัดการทำงานเพื่อป้องกัน DoS attacks
        this.MAX_DEPTH = options.maxDepth || 100;           // ความลึกสูงสุดของ nested structures
        this.MAX_TOKENS = options.maxTokens || 500000;      // จำนวน token สูงสุด
        this.MAX_PARSING_TIME = options.maxParsingTime || 30000; // เวลาประมวลผลสูงสุด (30 วินาที)
        this.MAX_LOOP_ITERATIONS = options.maxLoopIterations || 1000000; // จำนวนการวนลูปสูงสุด

        this.startTime = null;
        this.iterationCount = 0;
        this.currentDepth = 0;
        this.warnings = [];
    }

    // เริ่มต้นการตรวจสอบ
    startParsing() {
        this.startTime = Date.now();
        this.iterationCount = 0;
        this.currentDepth = 0;
        this.warnings = [];
    }

    // ตรวจสอบการวนลูปแต่ละครั้ง
    checkIteration() {
        this.iterationCount++;

        // ตรวจสอบ timeout
        if (this.startTime && (Date.now() - this.startTime) > this.MAX_PARSING_TIME) {
            throw new Error(`SECURITY: Parsing timeout after ${this.MAX_PARSING_TIME}ms. File may contain malicious patterns.`);
        }

        // ตรวจสอบจำนวนการวนลูป
        if (this.iterationCount > this.MAX_LOOP_ITERATIONS) {
            throw new Error(`SECURITY: Too many parsing iterations (${this.MAX_LOOP_ITERATIONS}). File may contain complexity attack patterns.`);
        }
    }

    // ตรวจสอบความลึก
    enterDepth() {
        this.currentDepth++;
        if (this.currentDepth > this.MAX_DEPTH) {
            throw new Error(`SECURITY: Parsing depth exceeded ${this.MAX_DEPTH} levels. File may contain deeply nested malicious structures.`);
        }
    }

    // ออกจากความลึก
    exitDepth() {
        if (this.currentDepth > 0) {
            this.currentDepth--;
        }
    }

    // ตรวจสอบจำนวน tokens
    checkTokenCount(tokenCount) {
        if (tokenCount > this.MAX_TOKENS) {
            throw new Error(`SECURITY: Token count exceeded ${this.MAX_TOKENS}. File too complex for safe processing.`);
        }
    }

    // เพิ่มคำเตือน
    addWarning(message) {
        this.warnings.push(`SECURITY WARNING: ${message}`);
    }

    // รับสถิติ
    getStats() {
        return {
            processingTime: this.startTime ? Date.now() - this.startTime : 0,
            iterations: this.iterationCount,
            maxDepth: this.currentDepth,
            warnings: this.warnings
        };
    }
}

// JavaScript Tokenizer:โทเค็นไนเซอร์ JavaScript
class JavaScriptTokenizer {
    constructor(code, securityOptions = {}) {
        this.code = code;
        this.cursor = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.braceDepth = 0; // ติดตาม depth ของ {}
        this.parenDepth = 0; // ติดตาม depth ของ ()
        this.bracketDepth = 0; // ติดตาม depth ของ []
        // SECURITY: เพิ่ม Security Manager
        this.security = new TokenizerSecurityManager(securityOptions);
    }

    // แปลงโค้ดทั้งหมดเป็น tokens - Tokenize entire code
    tokenize() {
        // SECURITY: เริ่มต้นการตรวจสอบ
        this.security.startParsing();

        try {
            while (this.cursor < this.code.length) {
                // SECURITY: ตรวจสอบในแต่ละการวนลูป
                this.security.checkIteration();
                this.readNextToken();
            }

            // SECURITY: ตรวจสอบจำนวน tokens ทั้งหมด
            this.security.checkTokenCount(this.tokens.length);

            // เพิ่ม EOF token
            this.addToken(TOKEN_TYPES.EOF, '', this.line, this.column);

            // แสดงสถิติความปลอดภัยถ้ามีคำเตือน
            const stats = this.security.getStats();
            if (stats.warnings.length > 0) {
                console.warn('Tokenizer Security Warnings:');
                stats.warnings.forEach(warning => console.warn(` - ${warning}`));
            }

            return {
                tokens: this.tokens,
                stats: stats
            };
        } catch (error) {
            // รายงานข้อผิดพลาดด้านความปลอดภัย
            if (error.message.includes('SECURITY:')) {
                console.error(`SECURITY ALERT: ${error.message}`);
                console.error('File processing stopped for security reasons.');
            }
            throw error;
        }
    }

    // อ่าน token ถัดไป - Read next token
    readNextToken() {
        const char = this.currentChar();

        // ข้ามช่องว่าง - Skip whitespace
        if (this.isWhitespace(char)) {
            this.readWhitespace();
            return;
        }

        // อ่านบรรทัดใหม่ - Read newline
        if (char === '\n') {
            this.addToken(TOKEN_TYPES.NEWLINE, char, this.line, this.column);
            this.advance();
            this.line++;
            this.column = 1;
            return;
        }

        // อ่านตัวอักษร (identifier หรือ keyword) - Read letters
        if (this.isLetter(char) || char === '_' || char === '$') {
            this.readIdentifierOrKeyword();
            return;
        }

        // อ่านตัวเลข - Read numbers
        if (this.isDigit(char)) {
            this.readNumber();
            return;
        }

        // อ่านสตริง - Read strings
        if (char === '"' || char === "'" || char === '`') {
            this.readString(char);
            return;
        }

        // อ่านคอมเมนต์ - Read comments
        if (char === '/' && this.peek() === '/') {
            this.readLineComment();
            return;
        }

        if (char === '/' && this.peek() === '*') {
            this.readBlockComment();
            return;
        }

        // อ่าน arrow function (=>) - Read arrow operator
        if (char === '=' && this.peek() === '>') {
            this.addToken(TOKEN_TYPES.ARROW, '=>', this.line, this.column);
            this.advance(2);
            return;
        }

        // อ่านเครื่องหมายต่างๆ - Read operators and punctuation
        this.readOperatorOrPunctuation(char);
    }

    // อ่าน identifier หรือ keyword - Read identifier or keyword
    readIdentifierOrKeyword() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        while (this.cursor < this.code.length &&
            (this.isAlphaNumeric(this.currentChar()) ||
                this.currentChar() === '_' ||
                this.currentChar() === '$')) {
            value += this.currentChar();
            this.advance();
        }

        const type = KEYWORDS.has(value) ? TOKEN_TYPES.KEYWORD : TOKEN_TYPES.IDENTIFIER;
        this.addToken(type, value, startLine, startColumn);
    }

    // อ่านตัวเลข - Read number
    readNumber() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        while (this.cursor < this.code.length && this.isDigit(this.currentChar())) {
            value += this.currentChar();
            this.advance();
        }

        // รองรับจุดทศนิยม - Support decimal points
        if (this.currentChar() === '.' && this.isDigit(this.peek())) {
            value += this.currentChar();
            this.advance();

            while (this.cursor < this.code.length && this.isDigit(this.currentChar())) {
                value += this.currentChar();
                this.advance();
            }
        }

        this.addToken(TOKEN_TYPES.NUMBER, value, startLine, startColumn);
    }

    // อ่านสตริง - Read string
    readString(quote) {
        const startLine = this.line;
        const startColumn = this.column;
        let value = quote;
        this.advance(); // ข้าม quote แรก

        while (this.cursor < this.code.length && this.currentChar() !== quote) {
            if (this.currentChar() === '\\') {
                value += this.currentChar();
                this.advance();
                if (this.cursor < this.code.length) {
                    value += this.currentChar();
                    this.advance();
                }
            } else {
                value += this.currentChar();
                this.advance();
            }
        }

        if (this.cursor < this.code.length) {
            value += this.currentChar(); // เพิ่ม quote ปิด
            this.advance();
        }

        this.addToken(TOKEN_TYPES.STRING, value, startLine, startColumn);
    }

    // อ่านคอมเมนต์บรรทัดเดียว - Read line comment
    readLineComment() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        while (this.cursor < this.code.length && this.currentChar() !== '\n') {
            value += this.currentChar();
            this.advance();
        }

        this.addToken(TOKEN_TYPES.LINE_COMMENT, value, startLine, startColumn);
    }

    // อ่านคอมเมนต์บล็อค - Read block comment
    readBlockComment() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        while (this.cursor < this.code.length - 1 &&
            !(this.currentChar() === '*' && this.peek() === '/')) {
            if (this.currentChar() === '\n') {
                this.line++;
                this.column = 1;
            }
            value += this.currentChar();
            this.advance();
        }

        if (this.cursor < this.code.length - 1) {
            value += this.currentChar(); // เพิ่ม *
            this.advance();
            value += this.currentChar(); // เพิ่ม /
            this.advance();
        }

        this.addToken(TOKEN_TYPES.BLOCK_COMMENT, value, startLine, startColumn);
    }

    // อ่านช่องว่าง - Read whitespace
    readWhitespace() {
        while (this.cursor < this.code.length && this.isWhitespace(this.currentChar())) {
            this.advance();
        }
    }

    // อ่านเครื่องหมายและตัวดำเนินการ - Read operators and punctuation
    readOperatorOrPunctuation(char) {
        const tokenMap = {
            '=': TOKEN_TYPES.EQUALS,
            '(': TOKEN_TYPES.PAREN_OPEN,
            ')': TOKEN_TYPES.PAREN_CLOSE,
            '{': TOKEN_TYPES.BRACE_OPEN,
            '}': TOKEN_TYPES.BRACE_CLOSE,
            '[': TOKEN_TYPES.BRACKET_OPEN,
            ']': TOKEN_TYPES.BRACKET_CLOSE,
            ';': TOKEN_TYPES.SEMICOLON,
            ',': TOKEN_TYPES.COMMA
        };

        // อัพเดท depth counters
        if (char === '{') this.braceDepth++;
        else if (char === '}') this.braceDepth--;
        else if (char === '(') this.parenDepth++;
        else if (char === ')') this.parenDepth--;
        else if (char === '[') this.bracketDepth++;
        else if (char === ']') this.bracketDepth--;

        const type = tokenMap[char] || TOKEN_TYPES.IDENTIFIER;
        this.addToken(type, char, this.line, this.column);
        this.advance();
    }

    // ======================================================================
    // HELPER METHODS (เครื่องมือช่วย) - Enhanced from fix-comments.js
    // ======================================================================

    // ตรวจสอบอักขระปัจจุบัน
    currentChar() {
        return this.cursor < this.code.length ? this.code[this.cursor] : '\0';
    }

    // ดูอักขระถัดไป
    peek() {
        return this.cursor + 1 < this.code.length ? this.code[this.cursor + 1] : '\0';
    }

    // ดูอักขระถัดไปๆ
    peekNext() {
        return this.cursor + 2 < this.code.length ? this.code[this.cursor + 2] : '\0';
    }

    // เดินหน้าไปข้างหน้า
    advance(steps = 1) {
        for (let i = 0; i < steps && this.cursor < this.code.length; i++) {
            const char = this.currentChar();
            this.cursor++;
            if (char === '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
        }
        return this.cursor > 0 ? this.code[this.cursor - 1] : '\0';
    }

    // ตรวจสอบว่าเป็นตัวเลขหรือไม่
    isDigit(char) {
        return /[0-9]/.test(char);
    }

    // ตรวจสอบว่าเป็นตัวอักษรหรือไม่ (รองรับภาษาไทย)
    isAlpha(char) {
        return /[a-zA-Zก-๙_$]/.test(char);
    }

    // ตรวจสอบตัวอักษรแบบพื้นฐาน
    isLetter(char) {
        return /[a-zA-Zก-๙]/.test(char);
    }

    // ตรวจสอบว่าเป็นตัวอักษรหรือตัวเลข
    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }

    // ตรวจสอบว่าเป็นช่องว่างหรือไม่
    isWhitespace(char) {
        return /\s/.test(char);
    }

    // ตรวจสอบจุดสิ้นสุด
    isAtEnd() {
        return this.cursor >= this.code.length;
    }

    // เพิ่ม token ลงในรายการ (Enhanced version)
    addToken(type, lexeme, line = this.line, column = this.column) {
        this.tokens.push({
            type: type,
            lexeme: lexeme,
            literal: null,
            line: line,
            column: column,
            position: this.cursor - lexeme.length,
            context: {
                braceDepth: this.braceDepth,
                parenDepth: this.parenDepth,
                bracketDepth: this.bracketDepth
            }
        });
    }

    // รีเซ็ตสถานะ - Reset state
    reset() {
        this.tokens = [];
        this.cursor = 0;
        this.line = 1;
        this.column = 1;
        this.braceDepth = 0;
        this.parenDepth = 0;
        this.bracketDepth = 0;
    }

    // รับสถิติการแยกแยะ - Get tokenization statistics
    getStats() {
        const stats = {};
        this.tokens.forEach(token => {
            stats[token.type] = (stats[token.type] || 0) + 1;
        });
        return {
            totalTokens: this.tokens.length,
            byType: stats,
            codeLines: this.line,
            structureDepth: {
                maxBraces: this.braceDepth,
                maxParens: this.parenDepth,
                maxBrackets: this.bracketDepth
            }
        };
    }

    // แสดงข้อมูล debug
    debug() {
        console.log(' Tokenizer Debug Info:');
        console.log(' Position:', this.cursor, 'Line:', this.line, 'Column:', this.column);
        console.log(' Tokens Generated:', this.tokens.length);
        console.log(' Structure Depth:', {
            braces: this.braceDepth,
            parens: this.parenDepth,
            brackets: this.bracketDepth
        });
    }
}

module.exports = {
    JavaScriptTokenizer,
    TokenizerSecurityManager,
    TOKEN_TYPES,
    KEYWORDS
};