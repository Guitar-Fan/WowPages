// Simple Todo App in JavaScript
// Demonstrates VS Code Zero's JavaScript editing capabilities

class TodoApp {
    constructor() {
        this.todos = [];
        this.nextId = 1;
        this.loadTodos();
    }
    
    addTodo(text) {
        const todo = {
            id: this.nextId++,
            text: text,
            completed: false,
            createdAt: new Date()
        };
        
        this.todos.push(todo);
        this.saveTodos();
        return todo;
    }
    
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
        }
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
    }
    
    getTodos() {
        return this.todos;
    }
    
    getCompletedCount() {
        return this.todos.filter(t => t.completed).length;
    }
    
    getPendingCount() {
        return this.todos.filter(t => !t.completed).length;
    }
    
    saveTodos() {
        localStorage.setItem('vscode-zero-todos', JSON.stringify(this.todos));
    }
    
    loadTodos() {
        const saved = localStorage.getItem('vscode-zero-todos');
        if (saved) {
            this.todos = JSON.parse(saved);
            if (this.todos.length > 0) {
                this.nextId = Math.max(...this.todos.map(t => t.id)) + 1;
            }
        }
    }
}

// Initialize the app
const todoApp = new TodoApp();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoApp;
}