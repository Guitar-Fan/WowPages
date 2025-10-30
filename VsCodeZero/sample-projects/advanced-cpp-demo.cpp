#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <memory>

using namespace std;

// Template class demonstration
template<typename T>
class SmartContainer {
private:
    vector<T> data;
    string name;

public:
    SmartContainer(const string& containerName) : name(containerName) {
        cout << "Created container: " << name << endl;
    }
    
    ~SmartContainer() {
        cout << "Destroyed container: " << name << endl;
    }
    
    void add(const T& item) {
        data.push_back(item);
        cout << "Added item to " << name << " (size: " << data.size() << ")" << endl;
    }
    
    void remove(const T& item) {
        auto it = find(data.begin(), data.end(), item);
        if (it != data.end()) {
            data.erase(it);
            cout << "Removed item from " << name << " (size: " << data.size() << ")" << endl;
        }
    }
    
    void display() const {
        cout << "Container " << name << " contents: ";
        for (const auto& item : data) {
            cout << item << " ";
        }
        cout << endl;
    }
    
    size_t size() const { return data.size(); }
    bool empty() const { return data.empty(); }
    
    // Iterator support
    typename vector<T>::iterator begin() { return data.begin(); }
    typename vector<T>::iterator end() { return data.end(); }
    typename vector<T>::const_iterator begin() const { return data.begin(); }
    typename vector<T>::const_iterator end() const { return data.end(); }
};

// Polymorphism demonstration
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual void display() const = 0;
};

class Rectangle : public Shape {
private:
    double width, height;

public:
    Rectangle(double w, double h) : width(w), height(h) {}
    
    double area() const override {
        return width * height;
    }
    
    void display() const override {
        cout << "Rectangle(" << width << "x" << height << ") - Area: " << area() << endl;
    }
};

class Circle : public Shape {
private:
    double radius;
    static constexpr double PI = 3.14159265359;

public:
    Circle(double r) : radius(r) {}
    
    double area() const override {
        return PI * radius * radius;
    }
    
    void display() const override {
        cout << "Circle(r=" << radius << ") - Area: " << area() << endl;
    }
};

// Function template demonstration
template<typename Container>
void printStats(const Container& container) {
    cout << "Container statistics:" << endl;
    cout << "  Size: " << container.size() << endl;
    cout << "  Empty: " << (container.empty() ? "Yes" : "No") << endl;
}

// Lambda and modern C++ features demonstration
void demonstrateModernCpp() {
    cout << "\n=== Modern C++ Features Demo ===" << endl;
    
    // Lambda expressions
    auto multiply = [](int a, int b) -> int {
        return a * b;
    };
    
    cout << "Lambda result: " << multiply(5, 7) << endl;
    
    // Range-based for loops with vector
    vector<int> numbers = {1, 2, 3, 4, 5};
    cout << "Numbers: ";
    for (const auto& num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    // STL algorithms
    auto evenCount = count_if(numbers.begin(), numbers.end(), 
                             [](int n) { return n % 2 == 0; });
    cout << "Even numbers count: " << evenCount << endl;
    
    // Smart pointers
    auto smartPtr = make_unique<Rectangle>(10.0, 5.0);
    cout << "Smart pointer managed object: ";
    smartPtr->display();
}

int main() {
    cout << "=== Advanced C++ Features Demonstration ===" << endl;
    cout << "Running in VS Code Zero with WebAssembly!" << endl << endl;
    
    try {
        // Template container demonstration
        cout << "=== Template Container Demo ===" << endl;
        SmartContainer<int> intContainer("IntegerBox");
        SmartContainer<string> stringContainer("StringBox");
        
        // Add some data
        intContainer.add(42);
        intContainer.add(17);
        intContainer.add(99);
        
        stringContainer.add("Hello");
        stringContainer.add("World");
        stringContainer.add("C++");
        
        // Display contents
        intContainer.display();
        stringContainer.display();
        
        // Print statistics
        printStats(intContainer);
        printStats(stringContainer);
        
        // Polymorphism demonstration
        cout << "\n=== Polymorphism Demo ===" << endl;
        vector<unique_ptr<Shape>> shapes;
        shapes.push_back(make_unique<Rectangle>(4.0, 6.0));
        shapes.push_back(make_unique<Circle>(3.0));
        shapes.push_back(make_unique<Rectangle>(2.5, 8.0));
        shapes.push_back(make_unique<Circle>(5.5));
        
        double totalArea = 0.0;
        for (const auto& shape : shapes) {
            shape->display();
            totalArea += shape->area();
        }
        
        cout << "Total area of all shapes: " << totalArea << endl;
        
        // Modern C++ features
        demonstrateModernCpp();
        
        cout << "\n=== Program completed successfully! ===" << endl;
        
    } catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }
    
    return 0;
}