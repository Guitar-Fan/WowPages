// VS Code Zero - Git Integration
// Provides Git functionality using isomorphic-git library

class GitIntegration {
    constructor() {
        this.fs = null;
        this.dir = '/workspace';
        this.repoInitialized = false;
        this.currentBranch = 'main';
        this.remotes = new Map();
        
        this.init();
    }
    
    async init() {
        try {
            await this.initializeGit();
            await this.setupFileSystem();
            console.log('✅ Git integration initialized successfully');
        } catch (error) {
            console.error('❌ Git initialization failed:', error);
        }
    }
    
    async initializeGit() {
        // Initialize isomorphic-git with the file system
        this.fs = window.fileSystem;
        
        // Set up git configuration
        git.plugins.set('fs', this.fs);
        
        // Initialize default git config
        await this.ensureGitConfig();
        
        // Check if repository exists
        try {
            await git.listFiles({ dir: this.dir });
            this.repoInitialized = true;
            this.currentBranch = await this.getCurrentBranch();
            console.log('📁 Git repository detected');
        } catch (error) {
            console.log('📁 No Git repository found, will initialize on first use');
        }
    }
    
    async setupFileSystem() {
        // Ensure the workspace directory exists
        try {
            await this.fs.createDirectory(this.dir);
        } catch (error) {
            // Directory might already exist
        }
    }
    
    async ensureGitConfig() {
        try {
            // Set default git config if not exists
            await git.setConfig({
                dir: this.dir,
                path: 'user.name',
                value: 'VS Code Zero User'
            });
            
            await git.setConfig({
                dir: this.dir,
                path: 'user.email',
                value: 'user@vscode-zero.local'
            });
        } catch (error) {
            console.warn('Could not set git config:', error);
        }
    }
    
    async initRepository() {
        try {
            await git.init({ dir: this.dir });
            this.repoInitialized = true;
            this.currentBranch = 'main';
            
            // Create initial commit
            await this.createInitialCommit();
            
            console.log('✅ Git repository initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize repository:', error);
            throw error;
        }
    }
    
    async createInitialCommit() {
        try {
            // Create a README file
            const readmeContent = `# VS Code Zero Workspace

This is your local development workspace in VS Code Zero.

## Files

- All files are stored locally in your browser
- Files persist between sessions using IndexedDB or OPFS
- Git operations work completely offline

## Getting Started

1. Create or edit files in the explorer
2. Use Git to track changes
3. Compile and run C++ programs
4. All data stays local to your browser
`;
            
            await this.fs.writeFile(`${this.dir}/README.md`, readmeContent);
            
            // Stage and commit
            await git.add({ dir: this.dir, filepath: 'README.md' });
            
            const sha = await git.commit({
                dir: this.dir,
                message: 'Initial commit',
                author: {
                    name: 'VS Code Zero User',
                    email: 'user@vscode-zero.local'
                }
            });
            
            console.log('✅ Initial commit created:', sha);
        } catch (error) {
            console.error('❌ Failed to create initial commit:', error);
        }
    }
    
    async getStatus() {
        if (!this.repoInitialized) {
            await this.initRepository();
        }
        
        try {
            const status = await git.statusMatrix({ dir: this.dir });
            const fileStatus = [];
            
            for (const [filepath, headStatus, workdirStatus, stageStatus] of status) {
                let statusText = '';
                
                if (headStatus === 0 && workdirStatus === 2 && stageStatus === 0) {
                    statusText = 'untracked';
                } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 0) {
                    statusText = 'modified';
                } else if (headStatus === 1 && workdirStatus === 1 && stageStatus === 2) {
                    statusText = 'staged';
                } else if (headStatus === 0 && workdirStatus === 2 && stageStatus === 2) {
                    statusText = 'added';
                } else if (headStatus === 1 && workdirStatus === 0 && stageStatus === 0) {
                    statusText = 'deleted';
                } else {
                    statusText = 'unknown';
                }
                
                fileStatus.push({
                    path: filepath,
                    status: statusText,
                    head: headStatus,
                    workdir: workdirStatus,
                    stage: stageStatus
                });
            }
            
            return fileStatus;
        } catch (error) {
            console.error('❌ Failed to get status:', error);
            throw error;
        }
    }
    
    async stageFile(filepath) {
        if (!this.repoInitialized) {
            throw new Error('Repository not initialized');
        }
        
        try {
            await git.add({ dir: this.dir, filepath: filepath });
            console.log(`✅ Staged file: ${filepath}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to stage ${filepath}:`, error);
            throw error;
        }
    }
    
    async unstageFile(filepath) {
        if (!this.repoInitialized) {
            throw new Error('Repository not initialized');
        }
        
        try {
            await git.remove({ dir: this.dir, filepath: filepath });
            console.log(`✅ Unstaged file: ${filepath}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to unstage ${filepath}:`, error);
            throw error;
        }
    }
    
    async commitChanges(message, files = []) {
        if (!this.repoInitialized) {
            throw new Error('Repository not initialized');
        }
        
        try {
            // Stage specified files or all changes
            if (files.length > 0) {
                for (const file of files) {
                    await git.add({ dir: this.dir, filepath: file });
                }
            } else {
                // Stage all changes
                const status = await this.getStatus();
                for (const file of status) {
                    if (file.status === 'modified' || file.status === 'added') {
                        await git.add({ dir: this.dir, filepath: file.path });
                    }
                }
            }
            
            // Create commit
            const sha = await git.commit({
                dir: this.dir,
                message: message,
                author: {
                    name: 'VS Code Zero User',
                    email: 'user@vscode-zero.local'
                }
            });
            
            console.log(`✅ Commit created: ${sha}`);
            return sha;
        } catch (error) {
            console.error('❌ Failed to create commit:', error);
            throw error;
        }
    }
    
    async getCommitHistory(maxCount = 10) {
        if (!this.repoInitialized) {
            return [];
        }
        
        try {
            const commits = await git.log({
                dir: this.dir,
                depth: maxCount
            });
            
            return commits.map(commit => ({
                oid: commit.oid,
                message: commit.commit.message,
                author: commit.commit.author.name,
                email: commit.commit.author.email,
                date: new Date(commit.commit.author.timestamp * 1000),
                parents: commit.commit.parent
            }));
        } catch (error) {
            console.error('❌ Failed to get commit history:', error);
            throw error;
        }
    }
    
    async getCurrentBranch() {
        if (!this.repoInitialized) {
            return 'main';
        }
        
        try {
            const branches = await git.listBranches({ dir: this.dir });
            const current = await git.currentBranch({ dir: this.dir });
            return current || 'main';
        } catch (error) {
            console.warn('Could not get current branch:', error);
            return 'main';
        }
    }
    
    async listBranches() {
        if (!this.repoInitialized) {
            return ['main'];
        }
        
        try {
            const branches = await git.listBranches({ dir: this.dir });
            return branches;
        } catch (error) {
            console.error('❌ Failed to list branches:', error);
            return ['main'];
        }
    }
    
    async createBranch(branchName) {
        if (!this.repoInitialized) {
            await this.initRepository();
        }
        
        try {
            await git.branch({ dir: this.dir, ref: branchName });
            console.log(`✅ Branch created: ${branchName}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to create branch ${branchName}:`, error);
            throw error;
        }
    }
    
    async checkoutBranch(branchName) {
        if (!this.repoInitialized) {
            throw new Error('Repository not initialized');
        }
        
        try {
            await git.checkout({ dir: this.dir, ref: branchName });
            this.currentBranch = branchName;
            console.log(`✅ Switched to branch: ${branchName}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to checkout branch ${branchName}:`, error);
            throw error;
        }
    }
    
    async deleteBranch(branchName) {
        if (!this.repoInitialized) {
            throw new Error('Repository not initialized');
        }
        
        try {
            await git.deleteBranch({ dir: this.dir, ref: branchName });
            console.log(`✅ Branch deleted: ${branchName}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete branch ${branchName}:`, error);
            throw error;
        }
    }
    
    async getFileDiff(filepath) {
        if (!this.repoInitialized) {
            throw new Error('Repository not initialized');
        }
        
        try {
            const diff = await git.diff({
                dir: this.dir,
                filepath: filepath
            });
            
            return diff;
        } catch (error) {
            console.error(`❌ Failed to get diff for ${filepath}:`, error);
            throw error;
        }
    }
    
    async discardChanges(filepath) {
        if (!this.repoInitialized) {
            throw new Error('Repository not initialized');
        }
        
        try {
            await git.checkout({
                dir: this.dir,
                filepath: filepath
            });
            
            console.log(`✅ Discarded changes in ${filepath}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to discard changes in ${filepath}:`, error);
            throw error;
        }
    }
    
    async addRemote(name, url) {
        if (!this.repoInitialized) {
            throw new Error('Repository not initialized');
        }
        
        try {
            await git.addRemote({
                dir: this.dir,
                remote: name,
                url: url
            });
            
            this.remotes.set(name, url);
            console.log(`✅ Added remote: ${name} -> ${url}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to add remote ${name}:`, error);
            throw error;
        }
    }
    
    async removeRemote(name) {
        if (!this.repoInitialized) {
            throw new Error('Repository not initialized');
        }
        
        try {
            await git.deleteRemote({
                dir: this.dir,
                remote: name
            });
            
            this.remotes.delete(name);
            console.log(`✅ Removed remote: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to remove remote ${name}:`, error);
            throw error;
        }
    }
    
    async listRemotes() {
        if (!this.repoInitialized) {
            return [];
        }
        
        try {
            const remotes = await git.listRemotes({ dir: this.dir });
            return remotes.map(remote => ({
                name: remote.remote,
                url: remote.url
            }));
        } catch (error) {
            console.error('❌ Failed to list remotes:', error);
            return [];
        }
    }
    
    async cloneRepository(url, directory = null) {
        try {
            const cloneDir = directory || this.dir;
            
            await git.clone({
                dir: cloneDir,
                url: url,
                singleBranch: true,
                depth: 1
            });
            
            this.repoInitialized = true;
            this.currentBranch = await this.getCurrentBranch();
            
            console.log(`✅ Repository cloned from ${url}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to clone repository:`, error);
            throw error;
        }
    }
    
    // Utility methods
    formatFileStatus(file) {
        const statusMap = {
            'untracked': '??',
            'modified': ' M',
            'staged': 'M ',
            'added': 'A ',
            'deleted': ' D',
            'unknown': '??'
        };
        
        return {
            status: statusMap[file.status] || '??',
            path: file.path,
            statusText: file.status
        };
    }
    
    isRepositoryInitialized() {
        return this.repoInitialized;
    }
    
    getCurrentBranchName() {
        return this.currentBranch;
    }
    
    // File system helpers
    getFullPath(relativePath) {
        return `${this.dir}/${relativePath}`;
    }
    
    async ensureDirectoryExists(path) {
        try {
            await this.fs.createDirectory(path);
        } catch (error) {
            // Directory might already exist
        }
    }
    
    // UI Integration helpers
    async refreshGitUI() {
        if (window.vscode && window.vscode.updateGitStatus) {
            try {
                const status = await this.getStatus();
                window.vscode.updateGitStatus(status);
            } catch (error) {
                console.error('Failed to refresh Git UI:', error);
            }
        }
    }
    
    async updateStatusBar() {
        const statusBar = document.getElementById('gitBranch');
        if (statusBar) {
            statusBar.textContent = this.currentBranch;
        }
    }
}

// Initialize Git integration
window.gitIntegration = new GitIntegration();