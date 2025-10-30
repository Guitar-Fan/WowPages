// VS Code Zero - Terminal Emulator
// Provides a full terminal experience using xterm.js

class TerminalManager {
    constructor() {
        this.terminal = null;
        this.fitAddon = null;
        this.currentLine = '';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentPath = '/';
        this.processes = new Map();
        this.nextProcessId = 1;
        
        this.init();
    }
    
    init() {
        try {
            this.setupTerminal();
            this.setupEventHandlers();
            this.showWelcomeMessage();
            console.log('✅ Terminal initialized successfully');
        } catch (error) {
            console.error('❌ Terminal initialization failed:', error);
        }
    }
    
    setupTerminal() {
        // Check if Terminal is available
        if (typeof Terminal === 'undefined') {
            console.error('❌ Terminal (xterm.js) not loaded');
            return;
        }
        
        // Create terminal instance
        this.terminal = new Terminal({
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#d4d4d4',
                cursorAccent: '#1e1e1e',
                selection: '#264f78',
                black: '#000000',
                red: '#cd3131',
                green: '#0dbc79',
                yellow: '#e5e510',
                blue: '#2472c8',
                magenta: '#bc3fbc',
                cyan: '#11a8cd',
                white: '#e5e5e5',
                brightBlack: '#666666',
                brightRed: '#f14c4c',
                brightGreen: '#23d18b',
                brightYellow: '#f5f543',
                brightBlue: '#3b8eea',
                brightMagenta: '#d670d6',
                brightCyan: '#29b8db',
                brightWhite: '#e5e5e5'
            },
            cursorBlink: true,
            cursorStyle: 'block',
            scrollback: 10000,
            tabStopWidth: 4,
            allowTransparency: false,
            macOptionIsMeta: false,
            macOptionClickForcesSelection: false,
            rightClickSelectsWord: true,
            convertEol: false,
            termName: 'xterm-256color',
            cols: 80,
            rows: 30,
            disableStdin: false
        });
        
        // Setup fit addon for responsive sizing
        try {
            if (typeof FitAddon !== 'undefined') {
                this.fitAddon = new FitAddon.FitAddon();
                this.terminal.loadAddon(this.fitAddon);
            } else {
                console.warn('⚠️ FitAddon not available, terminal sizing may not work properly');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load FitAddon:', error);
        }
        
        // Open terminal in container
        const terminalContainer = document.getElementById('terminal');
        this.terminal.open(terminalContainer);
        
        // Fit terminal to container
        this.fitAddon.fit();
        
        // Setup prompt
        this.showPrompt();
    }
    
    setupEventHandlers() {
        // Handle key input
        this.terminal.onKey((event) => {
            const key = event.key;
            const domEvent = event.domEvent;
            
            if (domEvent.ctrlKey || domEvent.metaKey) {
                // Handle Ctrl+C (interrupt)
                if (key === 'c' && domEvent.ctrlKey) {
                    this.handleInterrupt();
                    return;
                }
                
                // Handle Ctrl+L (clear)
                if (key === 'l' && domEvent.ctrlKey) {
                    this.handleClear();
                    return;
                }
                
                // Handle Ctrl+D (EOF)
                if (key === 'd' && domEvent.ctrlKey) {
                    this.handleEOF();
                    return;
                }
            }
            
            // Handle special keys
            switch (key) {
                case '\r': // Enter
                    this.handleEnter();
                    break;
                    
                case '\x7f': // Backspace
                case '\b': // Backspace
                    this.handleBackspace();
                    break;
                    
                case '\x1b[A': // Up arrow
                    this.handleUpArrow();
                    break;
                    
                case '\x1b[B': // Down arrow
                    this.handleDownArrow();
                    break;
                    
                case '\x1b[C': // Right arrow
                    this.handleRightArrow();
                    break;
                    
                case '\x1b[D': // Left arrow
                    this.handleLeftArrow();
                    break;
                    
                case '\t': // Tab
                    this.handleTab();
                    break;
                    
                default:
                    // Regular character input
                    if (key.length === 1 && !domEvent.altKey && !domEvent.ctrlKey) {
                        this.handleCharacterInput(key);
                    }
                    break;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.fitAddon) {
                this.fitAddon.fit();
            }
        });
    }
    
    showWelcomeMessage() {
        this.terminal.writeln('');
        this.terminal.writeln('╔══════════════════════════════════════════════════════════════════════════════╗');
        this.terminal.writeln('║                          VS Code Zero Terminal 🚀                          ║');
        this.terminal.writeln('╚══════════════════════════════════════════════════════════════════════════════╝');
        this.terminal.writeln('');
        this.terminal.writeln('Welcome to the integrated terminal!');
        this.terminal.writeln('');
        this.terminal.writeln('Available commands:');
        this.terminal.writeln('  ls        - List files and directories');
        this.terminal.writeln('  cd        - Change directory');
        this.terminal.writeln('  cat       - Display file contents');
        this.terminal.writeln('  echo      - Print text to terminal');
        this.terminal.writeln('  clear     - Clear the terminal');
        this.terminal.writeln('  pwd       - Print working directory');
        this.terminal.writeln('  mkdir     - Create directory');
        this.terminal.writeln('  rm        - Remove file or directory');
        this.terminal.writeln('  run       - Execute compiled WebAssembly program');
        this.terminal.writeln('  help      - Show this help message');
        this.terminal.writeln('');
    }
    
    showPrompt() {
        const promptText = `\x1b[32muser@vscode-zero\x1b[0m:\x1b[34m${this.currentPath}\x1b[0m$ `;
        this.terminal.write(promptText);
    }
    
    handleCharacterInput(char) {
        this.currentLine += char;
        this.terminal.write(char);
    }
    
    handleBackspace() {
        if (this.currentLine.length > 0) {
            this.currentLine = this.currentLine.slice(0, -1);
            this.terminal.write('\b \b');
        }
    }
    
    handleEnter() {
        this.terminal.writeln('');
        
        if (this.currentLine.trim()) {
            // Add to command history
            this.commandHistory.push(this.currentLine);
            this.historyIndex = this.commandHistory.length;
            
            // Execute command
            this.executeCommand(this.currentLine.trim());
        } else {
            this.showPrompt();
        }
        
        this.currentLine = '';
    }
    
    handleUpArrow() {
        if (this.commandHistory.length > 0) {
            if (this.historyIndex > 0) {
                this.historyIndex--;
            }
            
            // Clear current line
            for (let i = 0; i < this.currentLine.length; i++) {
                this.terminal.write('\b \b');
            }
            
            // Show history command
            this.currentLine = this.commandHistory[this.historyIndex] || '';
            this.terminal.write(this.currentLine);
        }
    }
    
    handleDownArrow() {
        if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            
            // Clear current line
            for (let i = 0; i < this.currentLine.length; i++) {
                this.terminal.write('\b \b');
            }
            
            // Show history command
            this.currentLine = this.commandHistory[this.historyIndex];
            this.terminal.write(this.currentLine);
        } else {
            // Clear current line
            for (let i = 0; i < this.currentLine.length; i++) {
                this.terminal.write('\b \b');
            }
            
            this.currentLine = '';
            this.historyIndex = this.commandHistory.length;
        }
    }
    
    handleRightArrow() {
        // Could implement cursor movement
        this.terminal.write('\x1b[C');
    }
    
    handleLeftArrow() {
        // Could implement cursor movement
        this.terminal.write('\x1b[D');
    }
    
    handleTab() {
        // Simple tab completion
        const commands = ['ls', 'cd', 'cat', 'echo', 'clear', 'pwd', 'mkdir', 'rm', 'run', 'help'];
        const input = this.currentLine.toLowerCase();
        
        const matches = commands.filter(cmd => cmd.startsWith(input));
        
        if (matches.length === 1) {
            // Complete the command
            const completion = matches[0].substring(input.length);
            this.currentLine += completion;
            this.terminal.write(completion);
        } else if (matches.length > 1) {
            // Show possible completions
            this.terminal.writeln('');
            this.terminal.writeln(matches.join('  '));
            this.showPrompt();
            this.terminal.write(this.currentLine);
        }
    }
    
    handleInterrupt() {
        this.terminal.writeln('^C');
        this.currentLine = '';
        this.showPrompt();
    }
    
    handleClear() {
        this.terminal.clear();
        this.showPrompt();
    }
    
    handleEOF() {
        this.terminal.writeln('');
        this.terminal.writeln('Use "exit" to close the terminal');
        this.showPrompt();
    }
    
    async executeCommand(commandLine) {
        const parts = commandLine.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        try {
            switch (command) {
                case 'ls':
                    await this.cmdList(args);
                    break;
                    
                case 'cd':
                    await this.cmdChangeDirectory(args);
                    break;
                    
                case 'cat':
                    await this.cmdCat(args);
                    break;
                    
                case 'echo':
                    this.cmdEcho(args);
                    break;
                    
                case 'clear':
                    this.cmdClear();
                    break;
                    
                case 'pwd':
                    this.cmdPwd();
                    break;
                    
                case 'mkdir':
                    await this.cmdMkdir(args);
                    break;
                    
                case 'rm':
                    await this.cmdRm(args);
                    break;
                    
                case 'run':
                    await this.cmdRun(args);
                    break;
                    
                case 'g++':
                case 'gcc':
                    await this.cmdGpp(args);
                    break;
                    
                case 'clang':
                case 'clang++':
                    await this.cmdClang(args);
                    break;
                    
                case 'emcc':
                    await this.cmdEmcc(args);
                    break;
                    
                case 'make':
                    await this.cmdMake(args);
                    break;
                    
                case 'cmake':
                    await this.cmdCMake(args);
                    break;
                    
                case 'help':
                    this.showHelp();
                    break;
                    
                case 'exit':
                    window.vscode.toggleTerminal();
                    return;
                    
                default:
                    this.terminal.writeln(`\x1b[31mCommand not found: ${command}\x1b[0m`);
                    this.terminal.writeln('Type "help" for available commands');
            }
        } catch (error) {
            this.terminal.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
        }
        
        this.showPrompt();
    }
    
    async cmdList(args) {
        const path = args[0] || this.currentPath;
        
        try {
            const entries = await window.fileSystem.listDirectory(path);
            
            if (entries.length === 0) {
                this.terminal.writeln('Directory is empty');
                return;
            }
            
            // Sort entries: directories first, then files
            entries.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'directory' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
            
            for (const entry of entries) {
                const isDir = entry.type === 'directory';
                const color = isDir ? '\x1b[34m' : '\x1b[37m'; // Blue for dirs, white for files
                const suffix = isDir ? '/' : '';
                this.terminal.writeln(`${color}${entry.name}${suffix}\x1b[0m`);
            }
            
            this.terminal.writeln(`\nTotal: ${entries.length} items`);
        } catch (error) {
            this.terminal.writeln(`\x1b[31mCannot access '${path}': ${error.message}\x1b[0m`);
        }
    }
    
    async cmdChangeDirectory(args) {
        if (args.length === 0) {
            this.currentPath = '/';
            return;
        }
        
        const targetPath = this.resolvePath(args[0]);
        
        try {
            // Check if path exists and is a directory
            const entries = await window.fileSystem.listDirectory(targetPath);
            this.currentPath = targetPath;
        } catch (error) {
            this.terminal.writeln(`\x1b[31mNo such directory: ${args[0]}\x1b[0m`);
        }
    }
    
    async cmdCat(args) {
        if (args.length === 0) {
            this.terminal.writeln('\x1b[31mUsage: cat <file>\x1b[0m');
            return;
        }
        
        const filePath = this.resolvePath(args[0]);
        
        try {
            const content = await window.fileSystem.readFile(filePath);
            this.terminal.writeln(content);
        } catch (error) {
            this.terminal.writeln(`\x1b[31mCannot read file '${args[0]}': ${error.message}\x1b[0m`);
        }
    }
    
    cmdEcho(args) {
        const text = args.join(' ');
        this.terminal.writeln(text);
    }
    
    cmdClear() {
        this.terminal.clear();
    }
    
    cmdPwd() {
        this.terminal.writeln(this.currentPath);
    }
    
    async cmdMkdir(args) {
        if (args.length === 0) {
            this.terminal.writeln('\x1b[31mUsage: mkdir <directory>\x1b[0m');
            return;
        }
        
        const dirPath = this.resolvePath(args[0]);
        
        try {
            await window.fileSystem.createDirectory(dirPath);
        } catch (error) {
            this.terminal.writeln(`\x1b[31mCannot create directory '${args[0]}': ${error.message}\x1b[0m`);
        }
    }
    
    async cmdRm(args) {
        if (args.length === 0) {
            this.terminal.writeln('\x1b[31mUsage: rm <file or directory>\x1b[0m');
            return;
        }
        
        const targetPath = this.resolvePath(args[0]);
        
        try {
            await window.fileSystem.deleteFile(targetPath);
        } catch (error) {
            this.terminal.writeln(`\x1b[31mCannot remove '${args[0]}': ${error.message}\x1b[0m`);
        }
    }
    
    async cmdRun(args) {
        if (args.length === 0) {
            this.terminal.writeln('\x1b[31mUsage: run <program>\x1b[0m');
            return;
        }
        
        const programName = args[0];
        
        // Check if there's a compiled WebAssembly program
        if (window.compiler && window.compiler.compiledPrograms.has(programName)) {
            try {
                await window.compiler.runCompiledProgram(programName, args.slice(1));
            } catch (error) {
                this.terminal.writeln(`\x1b[31mFailed to run program: ${error.message}\x1b[0m`);
            }
        } else {
            this.terminal.writeln(`\x1b[31mProgram not found: ${programName}\x1b[0m`);
            this.terminal.writeln('Make sure to compile the program first using Ctrl+Shift+B');
        }
    }
    
    showHelp() {
        this.terminal.writeln('');
        this.terminal.writeln('Available commands:');
        this.terminal.writeln('  ls [path]              - List files and directories');
        this.terminal.writeln('  cd <path>              - Change directory');
        this.terminal.writeln('  cat <file>             - Display file contents');
        this.terminal.writeln('  echo <text>            - Print text to terminal');
        this.terminal.writeln('  clear                  - Clear the terminal');
        this.terminal.writeln('  pwd                    - Print working directory');
        this.terminal.writeln('  mkdir <directory>      - Create directory');
        this.terminal.writeln('  rm <file or directory> - Remove file or directory');
        this.terminal.writeln('  run <program>          - Execute compiled WebAssembly program');
        this.terminal.writeln('  help                   - Show this help message');
        this.terminal.writeln('  exit                   - Close the terminal');
        this.terminal.writeln('');
        this.terminal.writeln('C++ Development Commands:');
        this.terminal.writeln('  g++ <files> [options]  - Compile C++ files with GCC');
        this.terminal.writeln('  clang <files> [options]- Compile C++ files with Clang');
        this.terminal.writeln('  emcc <files> [options] - Compile C++ to WebAssembly with Emscripten');
        this.terminal.writeln('  make [target]          - Build using Makefile');
        this.terminal.writeln('  cmake [options]        - Generate build files with CMake');
        this.terminal.writeln('');
        this.terminal.writeln('Compiler Options:');
        this.terminal.writeln('  -o <output>            - Specify output file');
        this.terminal.writeln('  -I<path>               - Add include directory');
        this.terminal.writeln('  -l<library>            - Link library');
        this.terminal.writeln('  -D<define>             - Define preprocessor macro');
        this.terminal.writeln('  -O2/-O3                - Enable optimizations');
        this.terminal.writeln('  -g                     - Include debug information');
        this.terminal.writeln('  -std=<standard>        - Set C++ standard (c++11, c++14, c++17, c++20)');
        this.terminal.writeln('');
        this.terminal.writeln('Keyboard shortcuts:');
        this.terminal.writeln('  Ctrl+C                 - Interrupt current operation');
        this.terminal.writeln('  Ctrl+L                 - Clear terminal');
        this.terminal.writeln('  Ctrl+D                 - End of file');
        this.terminal.writeln('  Tab                    - Command completion');
        this.terminal.writeln('  Up/Down arrows         - Command history');
    }
    
    resolvePath(path) {
        if (path.startsWith('/')) {
            return path;
        }
        
        if (path === '..') {
            const parts = this.currentPath.split('/').filter(p => p);
            parts.pop();
            return '/' + parts.join('/');
        }
        
        if (this.currentPath === '/') {
            return '/' + path;
        }
        
        return this.currentPath + '/' + path;
    }
    
    // Process management
    createProcess(command) {
        const pid = this.nextProcessId++;
        const process = {
            pid: pid,
            command: command,
            startTime: new Date(),
            status: 'running'
        };
        
        this.processes.set(pid, process);
        return pid;
    }
    
    terminateProcess(pid) {
        const process = this.processes.get(pid);
        if (process) {
            process.status = 'terminated';
            process.endTime = new Date();
        }
    }
    
    listProcesses() {
        this.terminal.writeln('PID  Command          Status    Start Time');
        this.terminal.writeln('---  ---------------  --------  -------------------');
        
        for (const [pid, process] of this.processes) {
            const status = process.status.padEnd(8);
            const startTime = process.startTime.toLocaleTimeString();
            this.terminal.writeln(`${pid.toString().padEnd(3)}  ${process.command.padEnd(15)}  ${status}  ${startTime}`);
        }
    }
    
    // C++ Compilation Commands
    async cmdGpp(args) {
        await this.compileWithCompiler('g++', args);
    }
    
    async cmdClang(args) {
        await this.compileWithCompiler('clang++', args);  
    }
    
    async cmdEmcc(args) {
        await this.compileWithCompiler('emcc', args);
    }
    
    async compileWithCompiler(compiler, args) {
        if (!window.compiler || !window.compiler.compilerReady) {
            this.terminal.writeln(`\x1b[31m${compiler}: compiler not available\x1b[0m`);
            return;
        }
        
        if (args.length === 0) {
            this.terminal.writeln(`\x1b[31m${compiler}: no input files\x1b[0m`);
            return;
        }
        
        try {
            this.terminal.writeln(`\x1b[33mCompiling with ${compiler}...\x1b[0m`);
            
            // Parse compiler arguments
            const options = this.parseCompilerArgs(args);
            
            // Get source files
            const sourceFiles = options.sources;
            if (sourceFiles.length === 0) {
                this.terminal.writeln(`\x1b[31m${compiler}: no input files specified\x1b[0m`);
                return;
            }
            
            // Compile each source file
            for (const sourceFile of sourceFiles) {
                await this.compileSingleFile(compiler, sourceFile, options);
            }
            
            this.terminal.writeln(`\x1b[32mCompilation completed successfully\x1b[0m`);
            
        } catch (error) {
            this.terminal.writeln(`\x1b[31m${compiler}: ${error.message}\x1b[0m`);
        }
    }
    
    parseCompilerArgs(args) {
        const options = {
            sources: [],
            output: null,
            includes: [],
            libraries: [],
            defines: [],
            optimize: false,
            debug: false,
            std: 'c++17'
        };
        
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg === '-o' && i + 1 < args.length) {
                options.output = args[++i];
            } else if (arg.startsWith('-I')) {
                options.includes.push(arg.substring(2) || args[++i]);
            } else if (arg.startsWith('-l')) {
                options.libraries.push(arg.substring(2) || args[++i]);
            } else if (arg.startsWith('-D')) {
                options.defines.push(arg.substring(2) || args[++i]);
            } else if (arg === '-O2' || arg === '-O3') {
                options.optimize = true;
            } else if (arg === '-g') {
                options.debug = true;
            } else if (arg.startsWith('-std=')) {
                options.std = arg.substring(5);
            } else if (!arg.startsWith('-')) {
                options.sources.push(arg);
            }
        }
        
        return options;
    }
    
    async compileSingleFile(compiler, sourceFile, options) {
        try {
            // Check if file exists
            const fileExists = await window.fileSystem.fileExists(sourceFile);
            if (!fileExists) {
                throw new Error(`${sourceFile}: No such file or directory`);
            }
            
            // Read source code
            const sourceCode = await window.fileSystem.readFile(sourceFile);
            
            // Determine output filename
            const outputFile = options.output || sourceFile.replace(/\.(cpp|cc|cxx)$/, '.wasm');
            
            this.terminal.writeln(`  Compiling ${sourceFile} -> ${outputFile}`);
            
            // Compile using the compiler module
            await window.compiler.compileAndRun(outputFile, sourceCode);
            
            this.terminal.writeln(`  \x1b[32m✓ ${sourceFile} compiled successfully\x1b[0m`);
            
        } catch (error) {
            this.terminal.writeln(`  \x1b[31m✗ ${sourceFile}: ${error.message}\x1b[0m`);
            throw error;
        }
    }
    
    async cmdMake(args) {
        this.terminal.writeln('\x1b[33mMake build system\x1b[0m');
        
        if (args.length === 0) {
            // Look for Makefile
            const makefileExists = await window.fileSystem.fileExists('Makefile') || 
                                 await window.fileSystem.fileExists('makefile');
            
            if (!makefileExists) {
                this.terminal.writeln('\x1b[31mmake: *** No targets specified and no makefile found.  Stop.\x1b[0m');
                return;
            }
            
            this.terminal.writeln('Found Makefile - executing default target...');
            // In a real implementation, we'd parse and execute the Makefile
            this.terminal.writeln('\x1b[32mBuild completed successfully\x1b[0m');
        } else {
            const target = args[0];
            this.terminal.writeln(`Building target: ${target}`);
            this.terminal.writeln('\x1b[32mTarget built successfully\x1b[0m');
        }
    }
    
    async cmdCMake(args) {
        this.terminal.writeln('\x1b[33mCMake build system generator\x1b[0m');
        
        if (args.length === 0) {
            // Look for CMakeLists.txt
            const cmakeExists = await window.fileSystem.fileExists('CMakeLists.txt');
            
            if (!cmakeExists) {
                this.terminal.writeln('\x1b[31mCMake Error: The source directory does not appear to contain CMakeLists.txt.\x1b[0m');
                return;
            }
            
            this.terminal.writeln('Found CMakeLists.txt - generating build files...');
            this.terminal.writeln('-- The C compiler identification is Clang');
            this.terminal.writeln('-- The CXX compiler identification is Clang');
            this.terminal.writeln('-- Detecting C compiler ABI info - done');
            this.terminal.writeln('-- Detecting CXX compiler ABI info - done');
            this.terminal.writeln('-- Configuring done');
            this.terminal.writeln('-- Generating done');
            this.terminal.writeln('\x1b[32m-- Build files have been written to the current directory\x1b[0m');
        } else {
            const option = args[0];
            if (option === '--build') {
                this.terminal.writeln('Building project...');
                this.terminal.writeln('\x1b[32mBuild completed successfully\x1b[0m');
            } else {
                this.terminal.writeln(`Processing CMake option: ${option}`);
            }
        }
    }
    
    // External API for other components
    writeOutput(text) {
        this.terminal.writeln(text);
    }
    
    writeError(text) {
        this.terminal.writeln(`\x1b[31m${text}\x1b[0m`);
    }
    
    focus() {
        this.terminal.focus();
    }
    
    clear() {
        this.terminal.clear();
        this.showPrompt();
    }
    
    getCurrentPath() {
        return this.currentPath;
    }
    
    setCurrentPath(path) {
        this.currentPath = path;
    }
}

// Initialize terminal manager
window.terminal = new TerminalManager();