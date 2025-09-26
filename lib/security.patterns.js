// ======================================================================
// CHAHUADEV UNIVERSAL SECURITY PATTERNS CONFIGURATION v1.0
// ======================================================================
// @author บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// @purpose องค์ความรู้ด้านความปลอดภัยแยกจาก Logic การสแกน
// ======================================================================

// ======================================================================
// MOCK VIOLATION PATTERNS - รูปแบบการหลอกลวง
// ======================================================================
const MOCK_PATTERNS = [
    // Mock libraries และ functions
    {
        pattern: /\.mock\s*\(/gi,
        type: 'MOCK_FUNCTION',
        severity: 'CRITICAL',
        category: 'MOCK_LIBRARY',
        description: 'Mock function detected - การหลอกลวงด้วย mock function',
        recommendation: 'ใช้การเรียก function จริงแทน mock'
    },
    {
        pattern: /jest\.mock\s*\(/gi,
        type: 'JEST_MOCK',
        severity: 'CRITICAL',
        category: 'MOCK_LIBRARY',
        description: 'Jest mock detected - การใช้ Jest mock',
        recommendation: 'ใช้การทดสอบด้วยข้อมูลจริงแทน Jest mock'
    },
    {
        pattern: /sinon\.mock\s*\(/gi,
        type: 'SINON_MOCK',
        severity: 'CRITICAL',
        category: 'MOCK_LIBRARY',
        description: 'Sinon mock detected - การใช้ Sinon mock',
        recommendation: 'ใช้การทดสอบด้วยข้อมูลจริงแทน Sinon mock'
    },
    {
        pattern: /mockImplementation/gi,
        type: 'MOCK_IMPLEMENTATION',
        severity: 'CRITICAL',
        category: 'MOCK_BEHAVIOR',
        description: 'Mock implementation detected - การจำลองพฤติกรรม',
        recommendation: 'สร้าง implementation จริงแทนการ mock'
    },
    {
        pattern: /mockReturnValue/gi,
        type: 'MOCK_RETURN',
        severity: 'CRITICAL',
        category: 'MOCK_DATA',
        description: 'Mock return value detected - การส่งคืนค่าปลอม',
        recommendation: 'ใช้การประมวลผลจริงแทนการส่งคืนค่าปลอม'
    },
    {
        pattern: /mockResolvedValue/gi,
        type: 'MOCK_RESOLVED',
        severity: 'CRITICAL',
        category: 'MOCK_ASYNC',
        description: 'Mock resolved value detected - การจำลอง Promise resolved',
        recommendation: 'ใช้ async operation จริงแทน mock'
    },
    {
        pattern: /mockRejectedValue/gi,
        type: 'MOCK_REJECTED',
        severity: 'CRITICAL',
        category: 'MOCK_ASYNC',
        description: 'Mock rejected value detected - การจำลอง Promise rejected',
        recommendation: 'ใช้ error handling จริงแทน mock rejection'
    },
    {
        pattern: /createMock/gi,
        type: 'CREATE_MOCK',
        severity: 'CRITICAL',
        category: 'MOCK_FACTORY',
        description: 'Create mock detected - การสร้าง mock object',
        recommendation: 'สร้าง real object แทน mock object'
    },
    {
        pattern: /mock.*data/gi,
        type: 'MOCK_DATA',
        severity: 'HIGH',
        category: 'MOCK_DATA',
        description: 'Mock data detected - ข้อมูลปลอม',
        recommendation: 'ใช้ข้อมูลจริงจากแหล่งที่เชื่อถือได้'
    },
    {
        pattern: /fake.*data/gi,
        type: 'FAKE_DATA',
        severity: 'HIGH',
        category: 'MOCK_DATA',
        description: 'Fake data detected - ข้อมูลปลอม',
        recommendation: 'ใช้ข้อมูลจริงแทนข้อมูลปลอม'
    },
    {
        pattern: /stub\s*\(/gi,
        type: 'STUB_FUNCTION',
        severity: 'HIGH',
        category: 'MOCK_BEHAVIOR',
        description: 'Stub function detected - การใช้ stub',
        recommendation: 'ใช้ function จริงแทน stub'
    },
    {
        pattern: /spy\s*\(/gi,
        type: 'SPY_FUNCTION',
        severity: 'MEDIUM',
        category: 'MOCK_MONITORING',
        description: 'Spy function detected - การใช้ spy',
        recommendation: 'ใช้การ monitoring จริงแทน spy'
    },

    // Fallback และ callback ที่หลอกลวง
    {
        pattern: /createEmpty.*Analysis/gi,
        type: 'FAKE_ANALYSIS',
        severity: 'CRITICAL',
        category: 'FAKE_RESULTS',
        description: 'Fake empty analysis detected - การวิเคราะห์ปลอม',
        recommendation: 'สร้างการวิเคราะห์จริงแทนการส่งคืนข้อมูลว่าง'
    },
    {
        pattern: /fallback.*data/gi,
        type: 'FALLBACK_DATA',
        severity: 'HIGH',
        category: 'FALLBACK_MECHANISM',
        description: 'Fallback data detected - ข้อมูล fallback',
        recommendation: 'จัดการ error อย่างชัดเจนแทนการใช้ fallback data'
    },
    {
        pattern: /default.*empty/gi,
        type: 'EMPTY_DEFAULT',
        severity: 'MEDIUM',
        category: 'DEFAULT_VALUES',
        description: 'Empty default detected - ค่า default ที่ว่าง',
        recommendation: 'ใช้ค่า default ที่มีความหมายแทนค่าว่าง'
    },
    {
        pattern: /\|\|\s*\{\}/gi,
        type: 'EMPTY_OBJECT_FALLBACK',
        severity: 'MEDIUM',
        category: 'FALLBACK_MECHANISM',
        description: 'Empty object fallback detected - การใช้ empty object เป็น fallback',
        recommendation: 'จัดการกรณีที่ไม่มีข้อมูลอย่างชัดเจน'
    },
    {
        pattern: /\|\|\s*\[\]/gi,
        type: 'EMPTY_ARRAY_FALLBACK',
        severity: 'MEDIUM',
        category: 'FALLBACK_MECHANISM',
        description: 'Empty array fallback detected - การใช้ empty array เป็น fallback',
        recommendation: 'จัดการกรณีที่ไม่มี array อย่างชัดเจน'
    },
    {
        pattern: /\|\|\s*null/gi,
        type: 'NULL_FALLBACK',
        severity: 'LOW',
        category: 'FALLBACK_MECHANISM',
        description: 'Null fallback detected - การใช้ null เป็น fallback',
        recommendation: 'ใช้ explicit null checking แทน fallback'
    },
    {
        pattern: /\?\s*.*\s*:\s*\{/gi,
        type: 'TERNARY_FALLBACK',
        severity: 'MEDIUM',
        category: 'FALLBACK_MECHANISM',
        description: 'Ternary fallback object detected - การใช้ ternary กับ object fallback',
        recommendation: 'ใช้ explicit condition checking'
    }
];

// ======================================================================
// CACHE VIOLATION PATTERNS - รูปแบบการใช้แคช
// ======================================================================
const CACHE_PATTERNS = [
    // Cache libraries
    {
        pattern: /require.*cache/gi,
        type: 'CACHE_REQUIRE',
        severity: 'CRITICAL',
        category: 'CACHE_LIBRARY',
        description: 'Cache library detected - การใช้ cache library',
        recommendation: 'ใช้การประมวลผลแบบ real-time แทน cache'
    },
    {
        pattern: /import.*cache/gi,
        type: 'CACHE_IMPORT',
        severity: 'CRITICAL',
        category: 'CACHE_LIBRARY',
        description: 'Cache import detected - การ import cache',
        recommendation: 'ใช้การประมวลผลแบบ real-time แทน cache'
    },
    {
        pattern: /redis/gi,
        type: 'REDIS_CACHE',
        severity: 'HIGH',
        category: 'EXTERNAL_CACHE',
        description: 'Redis cache detected - การใช้ Redis',
        recommendation: 'ใช้ direct database access แทน Redis cache'
    },
    {
        pattern: /memcached/gi,
        type: 'MEMCACHED',
        severity: 'HIGH',
        category: 'EXTERNAL_CACHE',
        description: 'Memcached detected - การใช้ Memcached',
        recommendation: 'ใช้ direct data source แทน Memcached'
    },
    {
        pattern: /node-cache/gi,
        type: 'NODE_CACHE',
        severity: 'HIGH',
        category: 'IN_MEMORY_CACHE',
        description: 'Node-cache detected - การใช้ node-cache',
        recommendation: 'ใช้การประมวลผลแบบ real-time แทน node-cache'
    },
    {
        pattern: /lru-cache/gi,
        type: 'LRU_CACHE',
        severity: 'HIGH',
        category: 'IN_MEMORY_CACHE',
        description: 'LRU cache detected - การใช้ LRU cache',
        recommendation: 'ใช้การประมวลผลแบบ real-time แทน LRU cache'
    },

    // Cache operations
    {
        pattern: /\.cache\s*\(/gi,
        type: 'CACHE_FUNCTION',
        severity: 'HIGH',
        category: 'CACHE_OPERATION',
        description: 'Cache function detected - การใช้ cache function',
        recommendation: 'ใช้การประมวลผลโดยตรงแทน cache function'
    },
    {
        pattern: /\.get\s*\(\s*['"`].*cache/gi,
        type: 'CACHE_GET',
        severity: 'HIGH',
        category: 'CACHE_OPERATION',
        description: 'Cache get operation detected - การดึงข้อมูลจาก cache',
        recommendation: 'ใช้การดึงข้อมูลจากแหล่งจริงแทน cache'
    },
    {
        pattern: /\.set\s*\(\s*['"`].*cache/gi,
        type: 'CACHE_SET',
        severity: 'HIGH',
        category: 'CACHE_OPERATION',
        description: 'Cache set operation detected - การเก็บข้อมูลใน cache',
        recommendation: 'ใช้การเก็บข้อมูลในแหล่งจริงแทน cache'
    },
    {
        pattern: /enableCache.*true/gi,
        type: 'ENABLE_CACHE',
        severity: 'CRITICAL',
        category: 'CACHE_CONFIG',
        description: 'Cache enabled - การเปิดใช้ cache',
        recommendation: 'ตั้งค่า enableCache = false หรือลบการใช้ cache'
    },
    {
        pattern: /useCache.*true/gi,
        type: 'USE_CACHE',
        severity: 'CRITICAL',
        category: 'CACHE_CONFIG',
        description: 'Cache usage enabled - การเปิดใช้งาน cache',
        recommendation: 'ตั้งค่า useCache = false'
    },
    {
        pattern: /cacheResults/gi,
        type: 'CACHE_RESULTS',
        severity: 'HIGH',
        category: 'CACHE_DATA',
        description: 'Cache results detected - การ cache ผลลัพธ์',
        recommendation: 'ประมวลผลใหม่ทุกครั้งแทนการ cache results'
    },
    {
        pattern: /cached.*data/gi,
        type: 'CACHED_DATA',
        severity: 'HIGH',
        category: 'CACHE_DATA',
        description: 'Cached data detected - ข้อมูลที่แคช',
        recommendation: 'ใช้ข้อมูล real-time แทนข้อมูลที่แคช'
    },
    {
        pattern: /memoize/gi,
        type: 'MEMOIZATION',
        severity: 'MEDIUM',
        category: 'FUNCTION_CACHE',
        description: 'Memoization detected - การ memoize',
        recommendation: 'เรียกใช้ function ใหม่ทุกครั้งแทน memoization'
    },
    {
        pattern: /localStorage/gi,
        type: 'LOCAL_STORAGE',
        severity: 'LOW',
        category: 'BROWSER_CACHE',
        description: 'Local storage detected - การใช้ local storage',
        recommendation: 'ใช้ server-side storage หรือ session-based storage'
    },
    {
        pattern: /sessionStorage/gi,
        type: 'SESSION_STORAGE',
        severity: 'LOW',
        category: 'BROWSER_CACHE',
        description: 'Session storage detected - การใช้ session storage',
        recommendation: 'ใช้ server-side session management'
    }
];

// ======================================================================
// PERFORMANCE VIOLATION PATTERNS - รูปแบบการปลอมแปลงประสิทธิภาพ
// ======================================================================
const PERFORMANCE_VIOLATIONS = [
    {
        pattern: /mock.*performance/gi,
        type: 'MOCK_PERFORMANCE',
        severity: 'CRITICAL',
        category: 'FAKE_METRICS',
        description: 'Mock performance data detected - ข้อมูลประสิทธิภาพปลอม',
        recommendation: 'ใช้การวัดประสิทธิภาพจริงแทนข้อมูลปลอม'
    },
    {
        pattern: /fake.*timing/gi,
        type: 'FAKE_TIMING',
        severity: 'CRITICAL',
        category: 'FAKE_METRICS',
        description: 'Fake timing data detected - เวลาปลอม',
        recommendation: 'ใช้การวัดเวลาจริงด้วย performance.now() หรือ process.hrtime()'
    },
    {
        pattern: /simulate.*load/gi,
        type: 'SIMULATED_LOAD',
        severity: 'HIGH',
        category: 'FAKE_LOAD',
        description: 'Simulated load detected - การจำลองโหลด',
        recommendation: 'ใช้การทดสอบโหลดจริงแทนการจำลอง'
    },
    {
        pattern: /dummy.*response/gi,
        type: 'DUMMY_RESPONSE',
        severity: 'HIGH',
        category: 'FAKE_RESPONSE',
        description: 'Dummy response detected - response ปลอม',
        recommendation: 'ใช้ real API response แทน dummy response'
    }
];

// ======================================================================
// SECURITY VIOLATION CATEGORIES - หมวดหมู่ของการละเมิด
// ======================================================================
const VIOLATION_CATEGORIES = {
    // Mock Categories
    MOCK_LIBRARY: {
        name: 'Mock Library Usage',
        description: 'การใช้ library สำหรับ mock',
        impact: 'สูง - ทำให้การทดสอบไม่สะท้อนความจริง'
    },
    MOCK_BEHAVIOR: {
        name: 'Mock Behavior Implementation',
        description: 'การจำลองพฤติกรรมของ function หรือ method',
        impact: 'สูง - ทำให้ logic ไม่ได้รับการทดสอบจริง'
    },
    MOCK_DATA: {
        name: 'Mock Data Usage',
        description: 'การใช้ข้อมูลปลอมแทนข้อมูลจริง',
        impact: 'กลาง - ทำให้ผลการทดสอบไม่แม่นยำ'
    },
    FAKE_RESULTS: {
        name: 'Fake Analysis Results',
        description: 'การส่งคืนผลการวิเคราะห์ปลอม',
        impact: 'สูงมาก - หลอกลวงผู้ใช้งาน'
    },

    // Cache Categories
    CACHE_LIBRARY: {
        name: 'Cache Library Usage',
        description: 'การใช้ library สำหรับ caching',
        impact: 'สูง - ทำให้ข้อมูลไม่เป็น real-time'
    },
    CACHE_OPERATION: {
        name: 'Cache Operations',
        description: 'การดำเนินการกับ cache (get/set)',
        impact: 'กลาง - ทำให้ข้อมูลอาจไม่ใหม่'
    },
    EXTERNAL_CACHE: {
        name: 'External Cache Systems',
        description: 'การใช้ระบบ cache ภายนอก (Redis, Memcached)',
        impact: 'สูง - ทำให้มี dependency กับระบบ cache'
    },

    // Fallback Categories
    FALLBACK_MECHANISM: {
        name: 'Fallback Mechanisms',
        description: 'การใช้กลไกสำรอง (fallback)',
        impact: 'กลาง - อาจซ่อนปัญหาที่แท้จริง'
    }
};

// ======================================================================
// SEVERITY LEVELS - ระดับความรุนแรง
// ======================================================================
const SEVERITY_LEVELS = {
    CRITICAL: {
        level: 4,
        name: 'Critical',
        description: 'การละเมิดร้ายแรงที่ต้องแก้ไขทันที',
        color: '\x1b[41m\x1b[37m', // สีแดงพื้น ข้อความขาว
        emoji: '🚨',
        action: 'ลบหรือแก้ไขทันที'
    },
    HIGH: {
        level: 3,
        name: 'High',
        description: 'การละเมิดระดับสูงที่ควรแก้ไขโดยเร็ว',
        color: '\x1b[31m', // สีแดง
        emoji: '⚠️',
        action: 'วางแผนแก้ไขภายใน 1 วัน'
    },
    MEDIUM: {
        level: 2,
        name: 'Medium',
        description: 'การละเมิดระดับกลางที่ควรพิจารณาแก้ไข',
        color: '\x1b[33m', // สีเหลือง
        emoji: '🔶',
        action: 'วางแผนแก้ไขภายใน 1 สัปดาห์'
    },
    LOW: {
        level: 1,
        name: 'Low',
        description: 'การละเมิดระดับต่ำที่สามารถแก้ไขได้ในอนาคต',
        color: '\x1b[34m', // สีน้ำเงิน
        emoji: '🔷',
        action: 'วางแผนแก้ไขตามความสะดวก'
    }
};

// ======================================================================
// EXEMPTION PATTERNS - รูปแบบที่ได้รับการยกเว้น
// ======================================================================
const DEFAULT_EXEMPTIONS = [
    // Test files ที่ได้รับอนุญาตใช้ mock (เฉพาะในกรณีจำเป็น)
    /\/test\/.*\.test\.js$/i,
    /\/tests\/.*\.spec\.js$/i,
    /__tests__\/.*\.js$/i,

    // Configuration files
    /\.config\.js$/i,
    /config\/.*\.js$/i,

    // Development utilities
    /dev-utils\/.*\.js$/i,
    /development\/.*\.js$/i
];

// ======================================================================
// EXPORT PATTERNS
// ======================================================================
module.exports = {
    MOCK_PATTERNS,
    CACHE_PATTERNS,
    PERFORMANCE_VIOLATIONS,
    VIOLATION_CATEGORIES,
    SEVERITY_LEVELS,
    DEFAULT_EXEMPTIONS,

    // Utility functions
    getAllPatterns() {
        return [
            ...MOCK_PATTERNS,
            ...CACHE_PATTERNS,
            ...PERFORMANCE_VIOLATIONS
        ];
    },

    getPatternsByCategory(category) {
        return this.getAllPatterns().filter(pattern => pattern.category === category);
    },

    getPatternsBySeverity(severity) {
        return this.getAllPatterns().filter(pattern => pattern.severity === severity);
    },

    getCriticalPatterns() {
        return this.getPatternsBySeverity('CRITICAL');
    },

    getPatternStats() {
        const allPatterns = this.getAllPatterns();
        const stats = {
            total: allPatterns.length,
            bySeverity: {},
            byCategory: {}
        };

        // Count by severity
        Object.keys(SEVERITY_LEVELS).forEach(severity => {
            stats.bySeverity[severity] = allPatterns.filter(p => p.severity === severity).length;
        });

        // Count by category
        Object.keys(VIOLATION_CATEGORIES).forEach(category => {
            stats.byCategory[category] = allPatterns.filter(p => p.category === category).length;
        });

        return stats;
    }
};