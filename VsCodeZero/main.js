// VS Code Zero - Main Application Logic
class VSCodeZero {
    constructor() {
        this.editor = null;
        this.currentFile = 'welcome.md';
        this.openTabs = new Set(['welcome.md']);
        this.fileContents = new Map();
        this.isTerminalVisible = false;
        this.currentView = 'explorer';
        
        this.init();
    }
    
    async init() {
        try {
            await this.initializeMonaco();
            await this.initializeFileSystem();
            await this.initializeTerminal();
            await this.loadSampleFiles();
            this.setupEventListeners();
            this.hideLoadingScreen();
            
            console.log('VS Code Zero initialized successfully');
        } catch (error) {
            console.error('Failed to initialize VS Code Zero:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    async initializeTerminal() {
        // Initialize file system for terminal first
        if (!window.fileSystem) {
            window.fileSystem = new FileSystemManager();
            await window.fileSystem.initialize();
        }
        
        // Initialize terminal
        if (typeof TerminalManager !== 'undefined') {
            window.terminal = new TerminalManager();
            console.log('✅ Terminal initialized successfully');
        } else {
            console.warn('⚠️ Terminal not available - TerminalManager not loaded');
        }
        
        // Initialize compiler
        if (typeof CppCompiler !== 'undefined') {
            window.compiler = new CppCompiler();
            console.log('✅ Compiler initialized successfully');
        } else {
            console.warn('⚠️ Compiler not available - CppCompiler not loaded');
        }
        
        // Initialize git integration
        if (typeof GitIntegration !== 'undefined') {
            window.git = new GitIntegration();
            console.log('✅ Git integration initialized successfully');
        } else {
            console.warn('⚠️ Git integration not available - GitIntegration not loaded');
        }
    }
    
    async initializeMonaco() {
        return new Promise((resolve, reject) => {
            require.config({
                paths: {
                    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs'
                }
            });
            
            require(['vs/editor/editor.main'], () => {
                // Configure Monaco environment for offline workers
                self.MonacoEnvironment = {
                    getWorkerUrl: function (moduleId, label) {
                        switch (label) {
                            case 'json':
                                return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/json/json.worker.js';
                            case 'css':
                                return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/css/css.worker.js';
                            case 'html':
                                return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/html/html.worker.js';
                            case 'typescript':
                            case 'javascript':
                                return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/typescript/ts.worker.js';
                            default:
                                return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/editor/editor.worker.js';
                        }
                    }
                };
                
                this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                    value: this.getWelcomeContent(),
                    language: 'markdown',
                    theme: 'vs-dark',
                    fontSize: 14,
                    fontFamily: 'Consolas, "Courier New", monospace',
                    minimap: { enabled: true },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    tabSize: 4,
                    insertSpaces: true,
                    renderWhitespace: 'selection',
                    bracketPairColorization: { enabled: true },
                    guides: {
                        bracketPairs: true,
                        indentation: true
                    }
                });
                
                // Setup editor event listeners
                this.editor.onDidChangeModelContent(() => {
                    this.onContentChanged();
                });
                
                this.editor.onDidChangeCursorPosition((e) => {
                    this.updateCursorPosition(e.position);
                });
                
                // Add keyboard shortcuts
                this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                    this.saveCurrentFile();
                });
                
                this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
                    this.toggleTerminal();
                });
                
                this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
                    this.showCommandPalette();
                });
                
                // Initialize enhanced C++ language support
                this.setupCppLanguageFeatures();
                
                resolve();
            });
        });
    }
    
    async initializeFileSystem() {
        // Initialize OPFS (Origin Private File System)
        if ('storage' in navigator && 'getDirectory' in navigator.storage) {
            try {
                this.rootDirectory = await navigator.storage.getDirectory();
                console.log('OPFS initialized successfully');
            } catch (error) {
                console.warn('OPFS not available, using fallback:', error);
                this.initializeIndexedDB();
            }
        } else {
            console.warn('OPFS not supported, using IndexedDB fallback');
            this.initializeIndexedDB();
        }
    }
    
    initializeIndexedDB() {
        // Fallback to IndexedDB for file storage
        const request = indexedDB.open('VSCodeZero', 1);
        
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
        };
        
        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('IndexedDB initialized successfully');
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { keyPath: 'path' });
            }
        };
    }
    
    async loadSampleFiles() {
        // Load welcome content
        this.fileContents.set('welcome.md', this.getWelcomeContent());
        
        // Load sample C++ program
        const cppContent = `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "Hello from VS Code Zero!" << endl;
    cout << "This C++ code compiles and runs in your browser!" << endl;
    
    vector<string> features = {
        "Offline C++ compilation",
        "WebAssembly execution", 
        "Integrated terminal",
        "File system management",
        "Git integration"
    };
    
    cout << "\\nFeatures:" << endl;
    for (const auto& feature : features) {
        cout << "• " << feature << endl;
    }
    
    return 0;
}`;
        
        this.fileContents.set('sample.cpp', cppContent);
        
        // Save to persistent storage
        await this.saveFileToStorage('welcome.md', this.getWelcomeContent());
        await this.saveFileToStorage('sample.cpp', cppContent);
    }
    
    getWelcomeContent() {
        return `# Welcome to VS Code Zero 🚀

A complete offline Progressive Web App that brings VS Code's core features to your browser using WebAssembly and modern web APIs.

## Features

✅ **Full Monaco Editor** - Syntax highlighting, IntelliSense, multi-cursor
✅ **C++ Development** - Compile and run C++ code locally using WebAssembly
✅ **Integrated Terminal** - xterm.js powered terminal emulation
✅ **File System** - OPFS and IndexedDB for persistent storage
✅ **Git Integration** - Complete Git workflow using isomorphic-git
✅ **Offline PWA** - Works completely offline after first load
✅ **Extensions System** - Load custom web extensions

## Getting Started

1. **Open Files**: Click on files in the explorer or use Ctrl+P
2. **Edit Code**: Full VS Code editing experience with IntelliSense
3. **Compile C++**: Open a .cpp file and use Ctrl+Shift+B to build
4. **Run Programs**: Execute compiled WebAssembly in the terminal
5. **Git Operations**: Use the source control panel for Git workflows

## Keyboard Shortcuts

- \`Ctrl+S\` - Save current file
- \`Ctrl+\` - Toggle terminal
- \`Ctrl+P\` - Command palette
- \`Ctrl+Shift+B\` - Build task
- \`Ctrl+Shift+P\` - Show all commands

## Technical Stack

- **Monaco Editor** - VS Code's editor component
- **WebAssembly** - C++ compilation and execution
- **OPFS** - Origin Private File System for storage
- **Service Workers** - Offline functionality
- **xterm.js** - Terminal emulation
- **isomorphic-git** - Git implementation in JavaScript

---

*VS Code Zero runs entirely in your browser with no server dependencies.*`;
    }
    
    setupEventListeners() {
        // Activity bar navigation
        document.querySelectorAll('.activity-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
        
        // File explorer
        document.getElementById('fileExplorer').addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                const filePath = fileItem.dataset.file;
                this.openFile(filePath);
            }
        });
        
        // Context menu
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.file-explorer')) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            }
        });
        
        // Hide context menu on click
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveCurrentFile();
                        break;
                    case '`':
                        e.preventDefault();
                        this.toggleTerminal();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.showCommandPalette();
                        break;
                    case 'b':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.buildCurrentFile();
                        }
                        break;
                }
            }
        });
        
        // Tab management
        document.getElementById('editorTabs').addEventListener('click', (e) => {
            const tab = e.target.closest('.editor-tab');
            if (tab) {
                const filePath = tab.dataset.file;
                if (e.target.classList.contains('close-btn')) {
                    this.closeTab(filePath);
                } else {
                    this.switchToTab(filePath);
                }
            }
        });
        
        // Service worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    showError(message) {
        // Create and show error notification
        console.error(message);
        // In a real implementation, this would show a toast notification
    }
    
    setupCppLanguageFeatures() {
        // Register enhanced C++ completion provider
        monaco.languages.registerCompletionItemProvider('cpp', {
            provideCompletionItems: async (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                
                const suggestions = [];
                
                // Standard library completions
                const stdLib = [
                    { label: 'cout', insertText: 'cout', detail: 'Standard output stream', kind: monaco.languages.CompletionItemKind.Variable },
                    { label: 'cin', insertText: 'cin', detail: 'Standard input stream', kind: monaco.languages.CompletionItemKind.Variable },
                    { label: 'endl', insertText: 'endl', detail: 'End line manipulator', kind: monaco.languages.CompletionItemKind.Function },
                    { label: 'vector', insertText: 'vector<${1:type}>$0', detail: 'Dynamic array container', kind: monaco.languages.CompletionItemKind.Class, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                    { label: 'string', insertText: 'string', detail: 'String class', kind: monaco.languages.CompletionItemKind.Class },
                    { label: 'map', insertText: 'map<${1:key}, ${2:value}>$0', detail: 'Associative container', kind: monaco.languages.CompletionItemKind.Class, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                    { label: 'set', insertText: 'set<${1:type}>$0', detail: 'Set container', kind: monaco.languages.CompletionItemKind.Class, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                ];
                
                // C++ keywords and constructs
                const keywords = [
                    { label: 'class', insertText: 'class ${1:ClassName} {\\n\\tpublic:\\n\\t\\t$0\\n};', detail: 'Class definition', kind: monaco.languages.CompletionItemKind.Snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                    { label: 'struct', insertText: 'struct ${1:StructName} {\\n\\t$0\\n};', detail: 'Struct definition', kind: monaco.languages.CompletionItemKind.Snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                    { label: 'namespace', insertText: 'namespace ${1:name} {\\n\\t$0\\n}', detail: 'Namespace definition', kind: monaco.languages.CompletionItemKind.Snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                    { label: 'template', insertText: 'template<${1:typename T}>\\n$0', detail: 'Template declaration', kind: monaco.languages.CompletionItemKind.Snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                    { label: 'for', insertText: 'for (${1:int i = 0}; ${2:i < n}; ${3:++i}) {\\n\\t$0\\n}', detail: 'For loop', kind: monaco.languages.CompletionItemKind.Snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                    { label: 'while', insertText: 'while (${1:condition}) {\\n\\t$0\\n}', detail: 'While loop', kind: monaco.languages.CompletionItemKind.Snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                    { label: 'if', insertText: 'if (${1:condition}) {\\n\\t$0\\n}', detail: 'If statement', kind: monaco.languages.CompletionItemKind.Snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                ];
                
                // Include suggestions
                const includes = [
                    { label: '#include <iostream>', insertText: '#include <iostream>', detail: 'Input/output stream', kind: monaco.languages.CompletionItemKind.Module },
                    { label: '#include <vector>', insertText: '#include <vector>', detail: 'Vector container', kind: monaco.languages.CompletionItemKind.Module },
                    { label: '#include <string>', insertText: '#include <string>', detail: 'String class', kind: monaco.languages.CompletionItemKind.Module },
                    { label: '#include <algorithm>', insertText: '#include <algorithm>', detail: 'Algorithms library', kind: monaco.languages.CompletionItemKind.Module },
                    { label: '#include <map>', insertText: '#include <map>', detail: 'Map container', kind: monaco.languages.CompletionItemKind.Module },
                    { label: '#include <set>', insertText: '#include <set>', detail: 'Set container', kind: monaco.languages.CompletionItemKind.Module }
                ];
                
                // Filter suggestions based on current context
                const lineText = model.getLineContent(position.lineNumber);
                
                if (lineText.startsWith('#include')) {
                    return { suggestions: includes.map(item => ({ ...item, range })) };
                }
                
                // Add all suggestions
                suggestions.push(...stdLib.map(item => ({ ...item, range })));
                suggestions.push(...keywords.map(item => ({ ...item, range })));
                
                // Use compiler module for advanced completions if available
                if (window.compiler && window.compiler.clangModule) {
                    try {
                        const advancedSuggestions = await window.compiler.clangModule.complete(
                            model.getValue(),
                            { line: position.lineNumber, column: position.column, word: word.word }
                        );
                        suggestions.push(...advancedSuggestions.map(item => ({ ...item, range })));
                    } catch (error) {
                        console.log('Advanced completions not available:', error);
                    }
                }
                
                return { suggestions };
            }
        });
        
        // Register hover provider for C++
        monaco.languages.registerHoverProvider('cpp', {
            provideHover: async (model, position) => {
                const word = model.getWordAtPosition(position);
                if (!word) return null;
                
                // Basic hover information
                const hoverInfo = {
                    'cout': 'std::ostream cout - Standard output stream object',
                    'cin': 'std::istream cin - Standard input stream object',
                    'endl': 'std::endl - Inserts a newline character and flushes the stream',
                    'vector': 'std::vector - Dynamic array container',
                    'string': 'std::string - String class for handling text',
                    'map': 'std::map - Associative container that contains key-value pairs',
                    'set': 'std::set - Associative container that contains a sorted set of unique objects'
                };
                
                const info = hoverInfo[word.word];
                if (info) {
                    return {
                        range: new monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                        contents: [
                            { value: `**${word.word}**` },
                            { value: info }
                        ]
                    };
                }
                
                return null;
            }
        });
        
        // Register diagnostic provider for C++
        monaco.languages.registerCodeActionProvider('cpp', {
            provideCodeActions: async (model, range, context) => {
                const actions = [];
                
                for (const marker of context.markers) {
                    if (marker.message.includes("'cout' was not declared")) {
                        actions.push({
                            title: 'Add #include <iostream>',
                            kind: 'quickfix',
                            edit: {
                                edits: [{
                                    resource: model.uri,
                                    edit: {
                                        range: new monaco.Range(1, 1, 1, 1),
                                        text: '#include <iostream>\\n'
                                    }
                                }]
                            }
                        });
                    }
                }
                
                return { actions, dispose: () => {} };
            }
        });
        
        // Setup real-time error checking
        this.setupCppErrorChecking();
    }
    
    setupCppErrorChecking() {
        let timeoutId;
        
        this.editor.onDidChangeModelContent(() => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                await this.checkCppErrors();
            }, 1000); // Check errors 1 second after user stops typing
        });
    }
    
    async checkCppErrors() {
        const model = this.editor.getModel();
        if (!model || model.getLanguageId() !== 'cpp') return;
        
        const sourceCode = model.getValue();
        const markers = [];
        
        try {
            // Use compiler module for error checking if available
            if (window.compiler && window.compiler.clangModule) {
                const parseResult = await window.compiler.clangModule.parse(sourceCode);
                
                for (const diagnostic of parseResult.diagnostics) {
                    markers.push({
                        severity: diagnostic.severity === 'error' ? 
                            monaco.MarkerSeverity.Error : 
                            monaco.MarkerSeverity.Warning,
                        message: diagnostic.message,
                        startLineNumber: diagnostic.line,
                        startColumn: 1,
                        endLineNumber: diagnostic.line,
                        endColumn: 1000
                    });
                }
            } else {
                // Fallback to basic error checking
                const basicErrors = this.performBasicCppErrorCheck(sourceCode);
                markers.push(...basicErrors);
            }
            
            monaco.editor.setModelMarkers(model, 'cpp', markers);
        } catch (error) {
            console.log('Error checking failed:', error);
        }
    }
    
    performBasicCppErrorCheck(sourceCode) {
        const markers = [];
        const lines = sourceCode.split('\\n');
        
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const trimmed = line.trim();
            
            // Check for cout without iostream
            if (trimmed.includes('cout') && !sourceCode.includes('#include <iostream>')) {
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "'cout' was not declared in this scope. Did you mean to include <iostream>?",
                    startLineNumber: lineNumber,
                    startColumn: line.indexOf('cout') + 1,
                    endLineNumber: lineNumber,
                    endColumn: line.indexOf('cout') + 5
                });
            }
            
            // Check for vector without vector header
            if (trimmed.includes('vector') && !sourceCode.includes('#include <vector>')) {
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: "'vector' was not declared in this scope. Did you mean to include <vector>?",
                    startLineNumber: lineNumber,
                    startColumn: line.indexOf('vector') + 1,
                    endLineNumber: lineNumber,
                    endColumn: line.indexOf('vector') + 7
                });
            }
            
            // Check for missing semicolons (basic check)
            if (trimmed.length > 0 && 
                !trimmed.endsWith(';') && 
                !trimmed.endsWith('{') && 
                !trimmed.endsWith('}') &&
                !trimmed.startsWith('#') &&
                !trimmed.startsWith('//') &&
                !trimmed.includes('if ') &&
                !trimmed.includes('while ') &&
                !trimmed.includes('for ') &&
                !trimmed.includes('class ') &&
                !trimmed.includes('struct ')) {
                
                markers.push({
                    severity: monaco.MarkerSeverity.Warning,
                    message: "Statement may be missing a semicolon",
                    startLineNumber: lineNumber,
                    startColumn: line.length,
                    endLineNumber: lineNumber,
                    endColumn: line.length + 1
                });
            }
        });
        
        return markers;
    }
    
    switchView(view) {
        // Update activity bar
        document.querySelectorAll('.activity-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        this.currentView = view;
        
        switch (view) {
            case 'explorer':
                this.showExplorer();
                break;
            case 'search':
                this.showSearch();
                break;
            case 'git':
                this.showGit();
                break;
            case 'terminal':
                this.toggleTerminal();
                break;
        }
    }
    
    showExplorer() {
        document.getElementById('sidebarTitle').textContent = 'Explorer';
        // Could implement different sidebar content based on view
    }
    
    showSearch() {
        document.getElementById('sidebarTitle').textContent = 'Search';
        // Could implement search interface
    }
    
    showGit() {
        document.getElementById('sidebarTitle').textContent = 'Source Control';
        // Could implement Git interface
    }
    
    async openFile(filePath) {
        try {
            let content = this.fileContents.get(filePath);
            
            if (!content) {
                // Try to load from storage
                content = await this.loadFileFromStorage(filePath);
                if (content) {
                    this.fileContents.set(filePath, content);
                } else {
                    // Create new file
                    content = `// ${filePath}\n\n`;
                    this.fileContents.set(filePath, content);
                }
            }
            
            // Update editor content
            this.editor.setValue(content);
            
            // Update language mode
            const language = this.getLanguageFromPath(filePath);
            monaco.editor.setModelLanguage(this.editor.getModel(), language);
            
            // Update UI
            this.currentFile = filePath;
            this.addTab(filePath);
            this.updateStatusBar();
            
            // Update file explorer selection
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('selected');
            });
            document.querySelector(`[data-file="${filePath}"]`)?.classList.add('selected');
            
        } catch (error) {
            console.error('Error opening file:', error);
            this.showError(`Failed to open ${filePath}`);
        }
    }
    
    addTab(filePath) {
        if (this.openTabs.has(filePath)) {
            this.switchToTab(filePath);
            return;
        }
        
        this.openTabs.add(filePath);
        
        const tabsContainer = document.getElementById('editorTabs');
        const tab = document.createElement('div');
        tab.className = 'editor-tab';
        tab.dataset.file = filePath;
        tab.innerHTML = `
            ${this.getFileName(filePath)}
            <span class="close-btn" onclick="event.stopPropagation(); vscode.closeTab('${filePath}')">×</span>
        `;
        
        tabsContainer.appendChild(tab);
        this.switchToTab(filePath);
    }
    
    switchToTab(filePath) {
        // Update tab appearance
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.editor-tab[data-file="${filePath}"]`)?.classList.add('active');
        
        // Load file content
        if (this.fileContents.has(filePath)) {
            this.currentFile = filePath;
            this.editor.setValue(this.fileContents.get(filePath));
            
            const language = this.getLanguageFromPath(filePath);
            monaco.editor.setModelLanguage(this.editor.getModel(), language);
            
            this.updateStatusBar();
        }
    }
    
    closeTab(filePath) {
        this.openTabs.delete(filePath);
        
        const tab = document.querySelector(`.editor-tab[data-file="${filePath}"]`);
        if (tab) {
            tab.remove();
        }
        
        // Switch to another tab or show welcome screen
        if (this.openTabs.size > 0) {
            const nextTab = this.openTabs.values().next().value;
            this.switchToTab(nextTab);
        } else {
            this.openFile('welcome.md');
        }
    }
    
    getLanguageFromPath(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'cpp': 'cpp',
            'c': 'c',
            'h': 'cpp',
            'hpp': 'cpp',
            'py': 'python',
            'java': 'java',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml'
        };
        return languageMap[ext] || 'plaintext';
    }
    
    getFileName(filePath) {
        return filePath.split('/').pop() || filePath;
    }
    
    updateStatusBar() {
        document.getElementById('currentFile').textContent = this.currentFile;
        document.getElementById('languageMode').textContent = 
            this.getLanguageFromPath(this.currentFile).toUpperCase();
    }
    
    updateCursorPosition(position) {
        document.getElementById('cursorPosition').textContent = 
            `Ln ${position.lineNumber}, Col ${position.column}`;
    }
    
    onContentChanged() {
        if (this.currentFile) {
            const content = this.editor.getValue();
            this.fileContents.set(this.currentFile, content);
            
            // Auto-save after 1 second of no changes
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.saveCurrentFile();
            }, 1000);
        }
    }
    
    async saveCurrentFile() {
        if (this.currentFile) {
            const content = this.editor.getValue();
            this.fileContents.set(this.currentFile, content);
            await this.saveFileToStorage(this.currentFile, content);
            
            // Visual feedback
            const statusBar = document.querySelector('.status-bar');
            const originalBg = statusBar.style.background;
            statusBar.style.background = '#4CAF50';
            setTimeout(() => {
                statusBar.style.background = originalBg;
            }, 200);
        }
    }
    
    async saveFileToStorage(filePath, content) {
        try {
            if (this.rootDirectory) {
                // Use OPFS
                const fileHandle = await this.rootDirectory.getFileHandle(filePath, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
            } else if (this.db) {
                // Use IndexedDB
                const transaction = this.db.transaction(['files'], 'readwrite');
                const store = transaction.objectStore('files');
                await store.put({ path: filePath, content: content });
            }
        } catch (error) {
            console.error('Error saving file:', error);
        }
    }
    
    async loadFileFromStorage(filePath) {
        try {
            if (this.rootDirectory) {
                // Use OPFS
                try {
                    const fileHandle = await this.rootDirectory.getFileHandle(filePath);
                    const file = await fileHandle.getFile();
                    return await file.text();
                } catch (e) {
                    return null;
                }
            } else if (this.db) {
                // Use IndexedDB
                return new Promise((resolve) => {
                    const transaction = this.db.transaction(['files'], 'readonly');
                    const store = transaction.objectStore('files');
                    const request = store.get(filePath);
                    request.onsuccess = () => {
                        resolve(request.result ? request.result.content : null);
                    };
                    request.onerror = () => resolve(null);
                });
            }
        } catch (error) {
            console.error('Error loading file:', error);
            return null;
        }
    }
    
    toggleTerminal() {
        const terminalContainer = document.getElementById('terminalContainer');
        
        if (!terminalContainer) {
            console.error('❌ Terminal container not found in DOM');
            return;
        }
        
        this.isTerminalVisible = !this.isTerminalVisible;
        
        if (this.isTerminalVisible) {
            terminalContainer.classList.add('visible');
            console.log('📺 Terminal made visible');
            
            if (window.terminal) {
                try {
                    window.terminal.focus();
                    console.log('🎯 Terminal focused');
                } catch (error) {
                    console.error('❌ Failed to focus terminal:', error);
                }
            } else {
                console.warn('⚠️ Terminal object not available - initializing now...');
                this.initializeTerminalIfNeeded();
            }
        } else {
            terminalContainer.classList.remove('visible');
            console.log('📺 Terminal hidden');
        }
    }
    
    initializeTerminalIfNeeded() {
        if (typeof TerminalManager !== 'undefined' && !window.terminal) {
            try {
                window.terminal = new TerminalManager();
                console.log('✅ Terminal initialized on demand');
            } catch (error) {
                console.error('❌ Failed to initialize terminal on demand:', error);
            }
        }
    }
    
    showCommandPalette() {
        // Simple command palette implementation
        const command = prompt('Enter command:');
        if (command) {
            this.executeCommand(command);
        }
    }
    
    executeCommand(command) {
        switch (command.toLowerCase()) {
            case 'build':
            case 'compile':
                this.buildCurrentFile();
                break;
            case 'terminal':
                this.toggleTerminal();
                break;
            case 'save':
                this.saveCurrentFile();
                break;
            default:
                console.log('Unknown command:', command);
        }
    }
    
    async buildCurrentFile() {
        if (this.currentFile.endsWith('.cpp')) {
            try {
                await window.compiler.compileAndRun(this.currentFile, this.editor.getValue());
                this.toggleTerminal(); // Show terminal with output
            } catch (error) {
                console.error('Build failed:', error);
                this.showError('Build failed: ' + error.message);
            }
        } else {
            this.showError('Build is only supported for C++ files');
        }
    }
    
    showContextMenu(x, y) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.classList.add('visible');
    }
    
    hideContextMenu() {
        document.getElementById('contextMenu').classList.remove('visible');
    }
    
    newFile() {
        const fileName = prompt('Enter file name:');
        if (fileName) {
            this.openFile(fileName);
        }
    }
    
    newFolder() {
        const folderName = prompt('Enter folder name:');
        if (folderName) {
            // Could implement folder creation
            console.log('New folder:', folderName);
        }
    }
    
    refreshExplorer() {
        // Could implement file explorer refresh
        console.log('Refreshing explorer...');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing VS Code Zero...');
    window.vscode = new VSCodeZero();
    
    // Initialize other components that depend on main app
    await initializeAllSystems();
});

// Initialize all subsystems
async function initializeAllSystems() {
    try {
        // File system needs to be available globally
        if (!window.fileSystem && typeof FileSystemManager !== 'undefined') {
            window.fileSystem = new FileSystemManager();
            await window.fileSystem.initialize();
        }
        
        console.log('✅ All systems initialized successfully');
    } catch (error) {
        console.error('❌ System initialization failed:', error);
    }
}

// Global functions for HTML onclick handlers
function closeTab(filePath) {
    window.vscode.closeTab(filePath);
}

function toggleTerminal() {
    window.vscode.toggleTerminal();
}

function newFile() {
    window.vscode.newFile();
}

function newFolder() {
    window.vscode.newFolder();
}

function refreshExplorer() {
    window.vscode.refreshExplorer();
}