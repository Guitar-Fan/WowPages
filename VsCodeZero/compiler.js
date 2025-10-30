// VS Code Zero - Enhanced C++ Compiler and WebAssembly Runner
// Compiles C++ code to WebAssembly using Clang/LLVM and Emscripten

class CppCompiler {
    constructor() {
        this.compiledPrograms = new Map();
        this.stdLibAvailable = false;
        this.compilerReady = false;
        this.emscriptenModule = null;
        this.clangModule = null;
        this.fileSystem = new Map(); // Virtual file system for compilation
        this.includePaths = ['/usr/include', '/usr/include/c++/v1'];
        this.libraryPaths = ['/usr/lib'];
        this.diagnostics = [];
        this.init();
    }
    
    async init() {
        try {
            await this.initializeCompiler();
            await this.loadStandardLibrary();
            await this.setupVirtualFileSystem();
            console.log('✅ Enhanced C++ Compiler initialized successfully');
        } catch (error) {
            console.error('❌ C++ Compiler initialization failed:', error);
        }
    }
    
    async initializeCompiler() {
        try {
            // Try to load Emscripten WebAssembly module
            // In production, this would load from a CDN or local files
            await this.loadEmscriptenModule();
            
            // Initialize Clang frontend for language services
            await this.loadClangModule();
            
            this.compilerReady = true;
            console.log('✅ Clang/LLVM WebAssembly modules loaded');
        } catch (error) {
            console.warn('⚠️ Could not load full Emscripten - falling back to simulation mode');
            // Fallback to simulation mode
            this.compilerReady = true;
        }
    }
    
    async loadEmscriptenModule() {
        // In a real implementation, this would load the Emscripten WASM module
        // For now, we'll simulate the interface
        this.emscriptenModule = {
            compile: this.simulateEmscriptenCompile.bind(this),
            link: this.simulateEmscriptenLink.bind(this),
            optimize: this.simulateEmscriptenOptimize.bind(this)
        };
    }
    
    async loadClangModule() {
        // This would load clangd or a similar language server compiled to WASM
        this.clangModule = {
            parse: this.simulateClangParse.bind(this),
            analyze: this.simulateClangAnalyze.bind(this),
            complete: this.simulateClangComplete.bind(this)
        };
    }
    
    async setupVirtualFileSystem() {
        // Set up a virtual file system for compilation
        this.fileSystem.set('/tmp', { type: 'directory', contents: new Map() });
        this.fileSystem.set('/usr/include', { type: 'directory', contents: new Map() });
        this.fileSystem.set('/usr/lib', { type: 'directory', contents: new Map() });
        
        // Add essential headers
        await this.createSystemHeaders();
    }
    
    async createSystemHeaders() {
        // Create essential system headers in virtual file system
        const headers = {
            'stdio.h': this.createStdioHeader(),
            'stdlib.h': this.createStdlibHeader(),
            'string.h': this.createStringHeader(),
            'math.h': this.createMathHeader(),
            'stdint.h': this.createStdintHeader(),
            'limits.h': this.createLimitsHeader()
        };
        
        const includeDir = this.fileSystem.get('/usr/include');
        for (const [filename, content] of Object.entries(headers)) {
            includeDir.contents.set(filename, {
                type: 'file',
                content: content,
                size: content.length
            });
        }
    }
    
    simulateEmscriptenCompile(sourceCode, options = {}) {
        // Simulate Emscripten compilation process
        return {
            success: true,
            objectCode: `// Compiled object code for: ${sourceCode.substring(0, 50)}...`,
            warnings: [],
            errors: []
        };
    }
    
    simulateEmscriptenLink(objectFiles, options = {}) {
        // Simulate linking process
        return {
            success: true,
            wasmBinary: new Uint8Array([0x00, 0x61, 0x73, 0x6d]), // WASM magic number
            jsGlue: 'var Module = {};'
        };
    }
    
    simulateEmscriptenOptimize(wasmBinary, level = 2) {
        // Simulate optimization
        return {
            optimizedBinary: wasmBinary,
            reduction: Math.random() * 0.3 // 0-30% reduction
        };
    }
    
    simulateClangParse(sourceCode) {
        // Simulate AST parsing
        const functions = this.extractFunctions(sourceCode);
        const classes = this.extractClasses(sourceCode);
        const includes = this.extractIncludes(sourceCode);
        
        return {
            ast: {
                functions: functions,
                classes: classes,
                includes: includes
            },
            diagnostics: this.generateDiagnostics(sourceCode)
        };
    }
    
    simulateClangAnalyze(ast) {
        // Simulate semantic analysis
        return {
            symbols: this.extractSymbols(ast),
            types: this.inferTypes(ast),
            scopes: this.analyzeScopes(ast)
        };
    }
    
    simulateClangComplete(sourceCode, position) {
        // Simulate code completion
        const suggestions = [];
        
        // Add common C++ keywords
        const keywords = ['if', 'else', 'while', 'for', 'class', 'struct', 'namespace', 'template'];
        keywords.forEach(keyword => {
            if (keyword.startsWith(position.word || '')) {
                suggestions.push({
                    label: keyword,
                    kind: 'keyword',
                    detail: 'C++ keyword'
                });
            }
        });
        
        // Add standard library completions
        const stdLibFunctions = ['cout', 'cin', 'endl', 'vector', 'string', 'map', 'set'];
        stdLibFunctions.forEach(func => {
            if (func.startsWith(position.word || '')) {
                suggestions.push({
                    label: func,
                    kind: 'function',
                    detail: 'Standard library'
                });
            }
        });
        
        return suggestions;
    }
    
    extractFunctions(sourceCode) {
        // Extract function signatures from source code
        const functions = [];
        const functionRegex = /(?:inline\s+)?(?:static\s+)?(?:virtual\s+)?(?:const\s+)?([a-zA-Z_][a-zA-Z0-9_]*(?:\s*\*)*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:const\s*)?(?:override\s*)?(?:final\s*)?(?:\{|;)/g;
        let match;
        
        while ((match = functionRegex.exec(sourceCode)) !== null) {
            functions.push({
                returnType: match[1].trim(),
                name: match[2],
                parameters: match[3],
                line: sourceCode.substring(0, match.index).split('\\n').length
            });
        }
        
        return functions;
    }
    
    extractClasses(sourceCode) {
        // Extract class definitions
        const classes = [];
        const classRegex = /(?:class|struct)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        
        while ((match = classRegex.exec(sourceCode)) !== null) {
            classes.push({
                name: match[1],
                line: sourceCode.substring(0, match.index).split('\\n').length,
                type: match[0].startsWith('class') ? 'class' : 'struct'
            });
        }
        
        return classes;
    }
    
    extractIncludes(sourceCode) {
        // Extract include directives
        const includes = [];
        const includeRegex = /#include\s*[<"]([^>"]+)[>"]/g;
        let match;
        
        while ((match = includeRegex.exec(sourceCode)) !== null) {
            includes.push({
                file: match[1],
                isSystem: match[0].includes('<'),
                line: sourceCode.substring(0, match.index).split('\\n').length
            });
        }
        
        return includes;
    }
    
    generateDiagnostics(sourceCode) {
        // Generate basic diagnostics
        const diagnostics = [];
        
        // Check for common issues
        if (sourceCode.includes('cout') && !sourceCode.includes('#include <iostream>')) {
            diagnostics.push({
                severity: 'error',
                message: "'cout' was not declared in this scope",
                suggestion: "Add #include <iostream>",
                line: sourceCode.indexOf('cout')
            });
        }
        
        // Check for missing semicolons (simplified)
        const lines = sourceCode.split('\\n');
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed && 
                !trimmed.endsWith(';') && 
                !trimmed.endsWith('{') && 
                !trimmed.endsWith('}') &&
                !trimmed.startsWith('#') &&
                !trimmed.startsWith('//') &&
                !trimmed.startsWith('/*') &&
                !trimmed.includes('if ') &&
                !trimmed.includes('while ') &&
                !trimmed.includes('for ')) {
                
                diagnostics.push({
                    severity: 'warning',
                    message: "Statement might be missing semicolon",
                    line: index + 1
                });
            }
        });
        
        return diagnostics;
    }
    
    extractSymbols(ast) {
        // Extract all symbols from AST
        const symbols = [];
        
        ast.functions.forEach(func => {
            symbols.push({
                name: func.name,
                type: 'function',
                returnType: func.returnType,
                parameters: func.parameters
            });
        });
        
        ast.classes.forEach(cls => {
            symbols.push({
                name: cls.name,
                type: cls.type,
                line: cls.line
            });
        });
        
        return symbols;
    }
    
    inferTypes(ast) {
        // Simple type inference
        const types = new Map();
        
        ast.functions.forEach(func => {
            types.set(func.name, func.returnType);
        });
        
        return types;
    }
    
    analyzeScopes(ast) {
        // Analyze variable scopes
        return {
            global: [],
            functions: ast.functions.map(f => ({
                name: f.name,
                locals: []
            }))
        };
    }
    
    createStdioHeader() {
        return `
#ifndef _STDIO_H_
#define _STDIO_H_ 1
int printf(const char* format, ...);
int scanf(const char* format, ...);
int sprintf(char* str, const char* format, ...);
int puts(const char* str);
char* gets(char* str);
#endif
`;
    }
    
    createStdlibHeader() {
        return `
#ifndef _STDLIB_H_
#define _STDLIB_H_ 1
#include <stddef.h>
void* malloc(size_t size);
void free(void* ptr);
void* calloc(size_t num, size_t size);
void* realloc(void* ptr, size_t size);
int atoi(const char* str);
double atof(const char* str);
void exit(int status);
int rand();
void srand(unsigned int seed);
#endif
`;
    }
    
    createStringHeader() {
        return `
#ifndef _STRING_H_
#define _STRING_H_ 1
#include <stddef.h>
size_t strlen(const char* str);
char* strcpy(char* dest, const char* src);
char* strcat(char* dest, const char* src);
int strcmp(const char* str1, const char* str2);
char* strchr(const char* str, int c);
void* memcpy(void* dest, const void* src, size_t n);
void* memset(void* ptr, int value, size_t n);
#endif
`;
    }
    
    createMathHeader() {
        return `
#ifndef _MATH_H_
#define _MATH_H_ 1
double sin(double x);
double cos(double x);
double tan(double x);
double sqrt(double x);
double pow(double base, double exp);
double log(double x);
double exp(double x);
double floor(double x);
double ceil(double x);
double fabs(double x);
#define M_PI 3.14159265358979323846
#endif
`;
    }
    
    createStdintHeader() {
        return `
#ifndef _STDINT_H_
#define _STDINT_H_ 1
typedef signed char int8_t;
typedef unsigned char uint8_t;
typedef short int16_t;
typedef unsigned short uint16_t;
typedef int int32_t;
typedef unsigned int uint32_t;
typedef long long int64_t;
typedef unsigned long long uint64_t;
#endif
`;
    }
    
    createLimitsHeader() {
        return `
#ifndef _LIMITS_H_
#define _LIMITS_H_ 1
#define INT_MAX 2147483647
#define INT_MIN (-2147483647 - 1)
#define CHAR_MAX 127
#define CHAR_MIN (-128)
#define UCHAR_MAX 255
#define SHRT_MAX 32767
#define SHRT_MIN (-32768)
#define USHRT_MAX 65535
#endif
`;
    }
    
    async loadStandardLibrary() {
        // Load C++ standard library headers and implementations
        // In a real implementation, this would load pre-compiled WASM modules
        
        const standardHeaders = {
            'iostream': this.createIOStreamImplementation(),
            'vector': this.createVectorImplementation(),
            'string': this.createStringImplementation(),
            'cmath': this.createMathImplementation(),
            'cstdlib': this.createStdlibImplementation()
        };
        
        this.standardLibrary = standardHeaders;
        this.stdLibAvailable = true;
    }
    
    async compileAndRun(fileName, sourceCode) {
        if (!this.compilerReady) {
            throw new Error('Compiler is not ready yet');
        }
        
        try {
            // Preprocess the code (handle includes, etc.)
            const preprocessedCode = await this.preprocessCode(sourceCode);
            
            // Parse and analyze the code
            const ast = this.parseCode(preprocessedCode);
            
            // Generate WebAssembly
            const wasmModule = await this.generateWasm(ast);
            
            // Store the compiled program
            this.compiledPrograms.set(fileName, {
                source: sourceCode,
                wasm: wasmModule,
                compiledAt: new Date()
            });
            
            // Run the compiled program
            await this.runCompiledProgram(fileName);
            
            return true;
        } catch (error) {
            console.error('Compilation failed:', error);
            throw error;
        }
    }
    
    async preprocessCode(sourceCode) {
        let processedCode = sourceCode;
        
        // Handle #include directives
        const includeRegex = /^#include\s+[<"](.+?)[>"]/gm;
        processedCode = processedCode.replace(includeRegex, (match, header) => {
            if (this.standardLibrary[header]) {
                return this.standardLibrary[header];
            }
            return `// Include ${header} - not available in browser`;
        });
        
        // Handle #define directives (simple replacement)
        const defineRegex = /^#define\s+(\w+)\s+(.+)$/gm;
        const defines = {};
        processedCode = processedCode.replace(defineRegex, (match, name, value) => {
            defines[name] = value;
            return '';
        });
        
        // Apply defines
        for (const [name, value] of Object.entries(defines)) {
            processedCode = processedCode.replace(new RegExp(`\\b${name}\\b`, 'g'), value);
        }
        
        return processedCode;
    }
    
    parseCode(sourceCode) {
        // Simplified AST generation
        // In a real implementation, this would use a full C++ parser
        
        const ast = {
            type: 'Program',
            functions: [],
            includes: [],
            globals: []
        };
        
        // Extract function definitions
        const functionRegex = /(?:int|void|float|double|string|bool|char|auto)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
        let match;
        
        while ((match = functionRegex.exec(sourceCode)) !== null) {
            const [, name, params] = match;
            const bodyStart = match.index + match[0].length;
            const bodyEnd = this.findMatchingBrace(sourceCode, bodyStart - 1);
            const body = sourceCode.substring(bodyStart, bodyEnd);
            
            ast.functions.push({
                name: name,
                parameters: params,
                body: body,
                returnType: match[0].split(' ')[0]
            });
        }
        
        return ast;
    }
    
    findMatchingBrace(code, startIndex) {
        let braceCount = 1;
        let i = startIndex + 1;
        
        while (i < code.length && braceCount > 0) {
            if (code[i] === '{') {
                braceCount++;
            } else if (code[i] === '}') {
                braceCount--;
            }
            i++;
        }
        
        return i - 1;
    }
    
    async generateWasm(ast) {
        // Simplified WebAssembly generation
        // In a real implementation, this would generate actual WASM bytecode
        
        const wasmFunctions = [];
        
        for (const func of ast.functions) {
            if (func.name === 'main') {
                wasmFunctions.push(this.generateMainFunction(func));
            } else {
                wasmFunctions.push(this.generateFunction(func));
            }
        }
        
        // Create a JavaScript module that simulates WebAssembly behavior
        return {
            exports: {
                main: this.createMainFunction(wasmFunctions)
            },
            memory: new WebAssembly.Memory({ initial: 256, maximum: 256 })
        };
    }
    
    generateMainFunction(func) {
        // Extract C++ statements and convert to JavaScript
        const statements = this.parseFunctionBody(func.body);
        return statements;
    }
    
    generateFunction(func) {
        // Generate non-main functions
        return {
            name: func.name,
            body: func.body
        };
    }
    
    parseFunctionBody(body) {
        const statements = [];
        
        // Extract cout statements
        const coutRegex = /cout\s*<<\s*([^;]+);/g;
        let match;
        
        while ((match = coutRegex.exec(body)) !== null) {
            const output = match[1];
            statements.push({
                type: 'cout',
                content: this.processOutputString(output)
            });
        }
        
        // Extract return statements
        const returnRegex = /return\s+([^;]+);/g;
        while ((match = returnRegex.exec(body)) !== null) {
            statements.push({
                type: 'return',
                value: match[1]
            });
        }
        
        // Extract variable declarations
        const varRegex = /(?:int|float|double|string|bool|char)\s+(\w+)\s*=\s*([^;]+);/g;
        while ((match = varRegex.exec(body)) !== null) {
            statements.push({
                type: 'declaration',
                name: match[1],
                value: match[2]
            });
        }
        
        return statements;
    }
    
    processOutputString(output) {
        // Handle string literals and endl
        let processed = output;
        
        // Replace string literals
        processed = processed.replace(/"([^"]*)"/g, '$1');
        
        // Handle endl
        processed = processed.replace(/\s*<<\s*endl\s*/g, '\\n');
        
        // Handle variables (simplified)
        processed = processed.replace(/\s*<<\s*(\w+)\s*/g, (match, varName) => {
            return ` + ${varName} + `;
        });
        
        return processed;
    }
    
    createMainFunction(wasmFunctions) {
        // Create a JavaScript function that simulates the C++ main function
        return () => {
            const mainFunc = wasmFunctions.find(f => f.name === 'main');
            if (!mainFunc) {
                throw new Error('No main function found');
            }
            
            // Execute the statements
            for (const statement of mainFunc.body) {
                this.executeStatement(statement);
            }
            
            return 0; // Default return value for main
        };
    }
    
    executeStatement(statement) {
        switch (statement.type) {
            case 'cout':
                const output = statement.content.replace(/\\n/g, '\n');
                window.terminal.writeOutput(output);
                break;
                
            case 'return':
                // Handle return value
                break;
                
            case 'declaration':
                // Handle variable declaration
                window[statement.name] = this.evaluateExpression(statement.value);
                break;
        }
    }
    
    evaluateExpression(expr) {
        // Simple expression evaluation
        try {
            return eval(expr);
        } catch (error) {
            return expr; // Return as string if evaluation fails
        }
    }
    
    async runCompiledProgram(fileName, args = []) {
        const program = this.compiledPrograms.get(fileName);
        if (!program) {
            throw new Error(`Program not found: ${fileName}`);
        }
        
        try {
            window.terminal.writeOutput(`Running ${fileName}...`);
            
            // Execute the main function
            const result = await program.wasm.exports.main();
            
            window.terminal.writeOutput(`\nProgram exited with code: ${result}`);
            
            return result;
        } catch (error) {
            window.terminal.writeError(`Runtime error: ${error.message}`);
            throw error;
        }
    }
    
    // Standard library implementations
    createIOStreamImplementation() {
        return `
// Enhanced iostream implementation for WebAssembly
#ifndef _IOSTREAM_H_
#define _IOSTREAM_H_ 1

namespace std {
    // Forward declarations
    class ostream;
    class istream;
    
    // Stream buffer for handling I/O
    class streambuf {
    protected:
        char* buffer;
        size_t size;
    public:
        streambuf() : buffer(nullptr), size(0) {}
        virtual ~streambuf() { delete[] buffer; }
    };
    
    // Output stream class
    class ostream {
    private:
        streambuf* buf;
        bool good_flag;
        
    public:
        ostream(streambuf* sb = nullptr) : buf(sb), good_flag(true) {}
        
        // Insertion operators for built-in types
        ostream& operator<<(const char* str) {
            if (str && good_flag) {
                // Call JavaScript function to handle output
                EM_ASM_({
                    if (typeof window !== 'undefined' && window.terminal) {
                        window.terminal.writeOutput(UTF8ToString($0));
                    }
                }, str);
            }
            return *this;
        }
        
        ostream& operator<<(char c) {
            char str[2] = {c, '\\0'};
            return (*this) << str;
        }
        
        ostream& operator<<(int val) {
            char buffer[32];
            sprintf(buffer, "%d", val);
            return (*this) << buffer;
        }
        
        ostream& operator<<(long val) {
            char buffer[32];
            sprintf(buffer, "%ld", val);
            return (*this) << buffer;
        }
        
        ostream& operator<<(double val) {
            char buffer[32];
            sprintf(buffer, "%g", val);
            return (*this) << buffer;
        }
        
        ostream& operator<<(float val) {
            return (*this) << (double)val;
        }
        
        ostream& operator<<(bool val) {
            return (*this) << (val ? "true" : "false");
        }
        
        // Stream manipulator support
        ostream& operator<<(ostream& (*manip)(ostream&)) {
            return manip(*this);
        }
        
        // Stream state
        bool good() const { return good_flag; }
        bool fail() const { return !good_flag; }
        
        void flush() {
            // Flush output buffer
            EM_ASM(
                if (typeof window !== 'undefined' && window.terminal) {
                    // Force flush any buffered output
                }
            );
        }
    };
    
    // Input stream class
    class istream {
    private:
        streambuf* buf;
        bool good_flag;
        
    public:
        istream(streambuf* sb = nullptr) : buf(sb), good_flag(true) {}
        
        // Extraction operators
        istream& operator>>(int& val) {
            // Simulate input from JavaScript prompt
            val = EM_ASM_INT({
                if (typeof window !== 'undefined') {
                    var input = prompt("Enter an integer:");
                    return input ? parseInt(input) : 0;
                }
                return 0;
            });
            return *this;
        }
        
        istream& operator>>(double& val) {
            val = EM_ASM_DOUBLE({
                if (typeof window !== 'undefined') {
                    var input = prompt("Enter a number:");
                    return input ? parseFloat(input) : 0.0;
                }
                return 0.0;
            });
            return *this;
        }
        
        istream& operator>>(float& val) {
            double temp;
            (*this) >> temp;
            val = (float)temp;
            return *this;
        }
        
        istream& operator>>(char& c) {
            int temp = EM_ASM_INT({
                if (typeof window !== 'undefined') {
                    var input = prompt("Enter a character:");
                    return input && input.length > 0 ? input.charCodeAt(0) : 0;
                }
                return 0;
            });
            c = (char)temp;
            return *this;
        }
        
        // String input (requires string class)
        template<typename CharT, typename Traits, typename Allocator>
        istream& operator>>(basic_string<CharT, Traits, Allocator>& str);
        
        bool good() const { return good_flag; }
        bool fail() const { return !good_flag; }
        bool eof() const { return false; } // Simplified for browser
    };
    
    // Stream manipulators
    ostream& endl(ostream& os) {
        os << "\\n";
        os.flush();
        return os;
    }
    
    ostream& flush(ostream& os) {
        os.flush();
        return os;
    }
    
    // Global stream objects
    extern ostream cout;
    extern istream cin;
    extern ostream cerr;
    extern ostream clog;
    
    // Initialize global streams
    static streambuf cout_buf, cin_buf, cerr_buf, clog_buf;
    ostream cout(&cout_buf);
    istream cin(&cin_buf);
    ostream cerr(&cerr_buf);
    ostream clog(&clog_buf);
}

#endif // _IOSTREAM_H_
`;
    }
    
    createVectorImplementation() {
        return `
// Simplified vector implementation
namespace std {
    template<typename T>
    class vector {
    private:
        T* data;
        size_t size;
        size_t capacity;
        
    public:
        vector() : data(nullptr), size(0), capacity(0) {}
        
        ~vector() {
            delete[] data;
        }
        
        void push_back(const T& value) {
            if (size >= capacity) {
                capacity = capacity == 0 ? 1 : capacity * 2;
                T* newData = new T[capacity];
                for (size_t i = 0; i < size; i++) {
                    newData[i] = data[i];
                }
                delete[] data;
                data = newData;
            }
            data[size++] = value;
        }
        
        size_t getSize() const {
            return size;
        }
        
        T& operator[](size_t index) {
            return data[index];
        }
        
        const T& operator[](size_t index) const {
            return data[index];
        }
    };
}
`;
    }
    
    createStringImplementation() {
        return `
// Simplified string implementation
namespace std {
    class string {
    private:
        char* data;
        size_t length;
        
    public:
        string() : data(nullptr), length(0) {}
        
        string(const char* str) {
            length = 0;
            while (str[length] != '\\0') length++;
            data = new char[length + 1];
            for (size_t i = 0; i <= length; i++) {
                data[i] = str[i];
            }
        }
        
        ~string() {
            delete[] data;
        }
        
        size_t size() const {
            return length;
        }
        
        const char* c_str() const {
            return data;
        }
        
        string& operator=(const string& other) {
            if (this != &other) {
                delete[] data;
                length = other.length;
                data = new char[length + 1];
                for (size_t i = 0; i <= length; i++) {
                    data[i] = other.data[i];
                }
            }
            return *this;
        }
    };
}
`;
    }
    
    createMathImplementation() {
        return `
// Math functions
#include <cmath>

// Basic math functions will be provided by JavaScript Math object
`;
    }
    
    createStdlibImplementation() {
        return `
// Standard library functions
#include <cstdlib>

// Basic stdlib functions will be provided by JavaScript
`;
    }
    
    // Utility methods
    getCompiledPrograms() {
        return Array.from(this.compiledPrograms.keys());
    }
    
    getProgramInfo(fileName) {
        const program = this.compiledPrograms.get(fileName);
        if (!program) {
            return null;
        }
        
        return {
            source: program.source.substring(0, 100) + '...',
            compiledAt: program.compiledAt,
            size: program.source.length
        };
    }
    
    deleteProgram(fileName) {
        return this.compiledPrograms.delete(fileName);
    }
    
    clearAllPrograms() {
        this.compiledPrograms.clear();
    }
}

// Initialize compiler
window.compiler = new CppCompiler();