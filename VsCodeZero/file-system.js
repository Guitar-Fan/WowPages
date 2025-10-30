// VS Code Zero - File System Management
// Handles OPFS (Origin Private File System) and IndexedDB fallback

class FileSystemManager {
    constructor() {
        this.rootDirectory = null;
        this.db = null;
        this.useOPFS = false;
        this.initialized = false;
    }
    
    async initialize() {
        try {
            // Try to initialize OPFS first
            if ('storage' in navigator && 'getDirectory' in navigator.storage) {
                try {
                    this.rootDirectory = await navigator.storage.getDirectory();
                    this.useOPFS = true;
                    console.log('✅ OPFS initialized successfully');
                } catch (error) {
                    console.warn('⚠️ OPFS initialization failed, falling back to IndexedDB:', error);
                    await this.initializeIndexedDB();
                }
            } else {
                console.warn('⚠️ OPFS not supported, using IndexedDB fallback');
                await this.initializeIndexedDB();
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ File system initialization failed:', error);
            return false;
        }
    }
    
    async initializeIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('VSCodeZeroFS', 1);
            
            request.onerror = (event) => {
                console.error('❌ IndexedDB initialization failed:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ IndexedDB initialized successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('files')) {
                    const fileStore = db.createObjectStore('files', { keyPath: 'path' });
                    fileStore.createIndex('parent', 'parent', { unique: false });
                    fileStore.createIndex('type', 'type', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'path' });
                }
                
                console.log('📁 IndexedDB schema created');
            };
        });
    }
    
    // File operations
    async writeFile(path, content, createParentDirs = true) {
        try {
            if (this.useOPFS) {
                return await this.writeFileOPFS(path, content, createParentDirs);
            } else {
                return await this.writeFileIndexedDB(path, content, createParentDirs);
            }
        } catch (error) {
            console.error(`❌ Error writing file ${path}:`, error);
            throw error;
        }
    }
    
    async readFile(path) {
        try {
            if (this.useOPFS) {
                return await this.readFileOPFS(path);
            } else {
                return await this.readFileIndexedDB(path);
            }
        } catch (error) {
            console.error(`❌ Error reading file ${path}:`, error);
            throw error;
        }
    }
    
    async deleteFile(path) {
        try {
            if (this.useOPFS) {
                return await this.deleteFileOPFS(path);
            } else {
                return await this.deleteFileIndexedDB(path);
            }
        } catch (error) {
            console.error(`❌ Error deleting file ${path}:`, error);
            throw error;
        }
    }
    
    async createDirectory(path) {
        try {
            if (this.useOPFS) {
                return await this.createDirectoryOPFS(path);
            } else {
                return await this.createDirectoryIndexedDB(path);
            }
        } catch (error) {
            console.error(`❌ Error creating directory ${path}:`, error);
            throw error;
        }
    }
    
    async listDirectory(path = '') {
        try {
            if (this.useOPFS) {
                return await this.listDirectoryOPFS(path);
            } else {
                return await this.listDirectoryIndexedDB(path);
            }
        } catch (error) {
            console.error(`❌ Error listing directory ${path}:`, error);
            throw error;
        }
    }
    
    async fileExists(path) {
        try {
            if (this.useOPFS) {
                return await this.fileExistsOPFS(path);
            } else {
                return await this.fileExistsIndexedDB(path);
            }
        } catch (error) {
            console.error(`❌ Error checking file ${path}:`, error);
            return false;
        }
    }
    
    // OPFS implementations
    async writeFileOPFS(path, content, createParentDirs) {
        const pathParts = this.parsePath(path);
        let currentDir = this.rootDirectory;
        
        // Navigate to parent directory
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            try {
                currentDir = await currentDir.getDirectoryHandle(part);
            } catch (error) {
                if (createParentDirs) {
                    currentDir = await currentDir.getDirectoryHandle(part, { create: true });
                } else {
                    throw new Error(`Parent directory does not exist: ${part}`);
                }
            }
        }
        
        // Create/write file
        const fileName = pathParts[pathParts.length - 1];
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        
        if (typeof content === 'string') {
            await writable.write(content);
        } else if (content instanceof ArrayBuffer) {
            await writable.write(content);
        } else {
            await writable.write(new Blob([content]));
        }
        
        await writable.close();
        
        // Update metadata
        await this.updateFileMetadata(path, {
            size: content.length || content.byteLength || 0,
            modified: new Date().toISOString(),
            type: 'file'
        });
        
        console.log(`✅ File written to OPFS: ${path}`);
    }
    
    async readFileOPFS(path) {
        const pathParts = this.parsePath(path);
        let currentDir = this.rootDirectory;
        
        // Navigate to parent directory
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentDir = await currentDir.getDirectoryHandle(pathParts[i]);
        }
        
        // Read file
        const fileName = pathParts[pathParts.length - 1];
        const fileHandle = await currentDir.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        
        return await file.text();
    }
    
    async deleteFileOPFS(path) {
        const pathParts = this.parsePath(path);
        let currentDir = this.rootDirectory;
        
        // Navigate to parent directory
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentDir = await currentDir.getDirectoryHandle(pathParts[i]);
        }
        
        // Delete file
        const fileName = pathParts[pathParts.length - 1];
        await currentDir.removeEntry(fileName);
        
        // Remove metadata
        await this.deleteFileMetadata(path);
        
        console.log(`✅ File deleted from OPFS: ${path}`);
    }
    
    async createDirectoryOPFS(path) {
        const pathParts = this.parsePath(path);
        let currentDir = this.rootDirectory;
        
        for (const part of pathParts) {
            currentDir = await currentDir.getDirectoryHandle(part, { create: true });
        }
        
        // Update metadata
        await this.updateFileMetadata(path, {
            modified: new Date().toISOString(),
            type: 'directory'
        });
        
        console.log(`✅ Directory created in OPFS: ${path}`);
    }
    
    async listDirectoryOPFS(path = '') {
        const pathParts = this.parsePath(path);
        let currentDir = this.rootDirectory;
        
        // Navigate to target directory
        for (const part of pathParts) {
            currentDir = await currentDir.getDirectoryHandle(part);
        }
        
        const entries = [];
        for await (const [name, handle] of currentDir) {
            entries.push({
                name: name,
                type: handle.kind,
                path: path ? `${path}/${name}` : name
            });
        }
        
        return entries;
    }
    
    async fileExistsOPFS(path) {
        try {
            const pathParts = this.parsePath(path);
            let currentDir = this.rootDirectory;
            
            for (let i = 0; i < pathParts.length - 1; i++) {
                currentDir = await currentDir.getDirectoryHandle(pathParts[i]);
            }
            
            const fileName = pathParts[pathParts.length - 1];
            await currentDir.getFileHandle(fileName);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // IndexedDB implementations
    async writeFileIndexedDB(path, content) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            
            const fileRecord = {
                path: path,
                content: content,
                parent: this.getParentPath(path),
                type: 'file',
                size: content.length || 0,
                modified: new Date().toISOString()
            };
            
            const request = store.put(fileRecord);
            
            request.onsuccess = () => {
                console.log(`✅ File written to IndexedDB: ${path}`);
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async readFileIndexedDB(path) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(path);
            
            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.content);
                } else {
                    reject(new Error(`File not found: ${path}`));
                }
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async deleteFileIndexedDB(path) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.delete(path);
            
            request.onsuccess = () => {
                console.log(`✅ File deleted from IndexedDB: ${path}`);
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async createDirectoryIndexedDB(path) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            
            const dirRecord = {
                path: path,
                content: null,
                parent: this.getParentPath(path),
                type: 'directory',
                modified: new Date().toISOString()
            };
            
            const request = store.put(dirRecord);
            
            request.onsuccess = () => {
                console.log(`✅ Directory created in IndexedDB: ${path}`);
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async listDirectoryIndexedDB(path = '') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const parentIndex = store.index('parent');
            
            const request = parentIndex.getAll(path);
            
            request.onsuccess = () => {
                const entries = request.result.map(record => ({
                    name: this.getFileName(record.path),
                    type: record.type,
                    path: record.path
                }));
                resolve(entries);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async fileExistsIndexedDB(path) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(path);
            
            request.onsuccess = () => {
                resolve(!!request.result);
            };
            
            request.onerror = () => {
                resolve(false);
            };
        });
    }
    
    // Metadata management
    async updateFileMetadata(path, metadata) {
        if (this.useOPFS) {
            // Store metadata in a separate file in OPFS
            const metadataPath = `.metadata/${path}.json`;
            await this.writeFile(metadataPath, JSON.stringify(metadata), true);
        } else {
            // Update metadata in IndexedDB
            const transaction = this.db.transaction(['metadata'], 'readwrite');
            const store = transaction.objectStore('metadata');
            store.put({ path: path, ...metadata });
        }
    }
    
    async deleteFileMetadata(path) {
        if (this.useOPFS) {
            const metadataPath = `.metadata/${path}.json`;
            try {
                await this.deleteFile(metadataPath);
            } catch (error) {
                // Ignore errors when deleting non-existent metadata
            }
        } else {
            const transaction = this.db.transaction(['metadata'], 'readwrite');
            const store = transaction.objectStore('metadata');
            store.delete(path);
        }
    }
    
    // Utility functions
    parsePath(path) {
        return path.split('/').filter(part => part.length > 0);
    }
    
    getParentPath(path) {
        const parts = path.split('/');
        parts.pop();
        return parts.join('/');
    }
    
    getFileName(path) {
        return path.split('/').pop() || path;
    }
    
    // Storage information
    async getStorageInfo() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    usageDetails: estimate.usageDetails || {},
                    percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
                };
            }
        } catch (error) {
            console.warn('Could not get storage info:', error);
        }
        
        return null;
    }
    
    // Export/import functionality
    async exportFileSystem() {
        const files = {};
        
        if (this.useOPFS) {
            await this.exportDirectoryOPFS('', files);
        } else {
            await this.exportDirectoryIndexedDB('', files);
        }
        
        return JSON.stringify(files, null, 2);
    }
    
    async exportDirectoryOPFS(path, files) {
        const entries = await this.listDirectoryOPFS(path);
        
        for (const entry of entries) {
            if (entry.type === 'file') {
                const content = await this.readFileOPFS(entry.path);
                files[entry.path] = content;
            } else if (entry.type === 'directory') {
                await this.exportDirectoryOPFS(entry.path, files);
            }
        }
    }
    
    async exportDirectoryIndexedDB(path, files) {
        const entries = await this.listDirectoryIndexedDB(path);
        
        for (const entry of entries) {
            if (entry.type === 'file') {
                const content = await this.readFileIndexedDB(entry.path);
                files[entry.path] = content;
            } else if (entry.type === 'directory') {
                await this.exportDirectoryIndexedDB(entry.path, files);
            }
        }
    }
    
    async importFileSystem(exportedData) {
        try {
            const files = JSON.parse(exportedData);
            
            for (const [path, content] of Object.entries(files)) {
                await this.writeFile(path, content);
            }
            
            console.log('✅ File system imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import file system:', error);
            return false;
        }
    }
}

// Initialize file system manager
window.fileSystem = new FileSystemManager();