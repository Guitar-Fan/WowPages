# Makefile for VS Code Zero C++ Sample Projects
# Supports both native compilation and WebAssembly via Emscripten

# Compiler settings
CXX := g++
EMCXX := emcc
CXXFLAGS := -std=c++17 -Wall -Wextra -O2
EMFLAGS := -std=c++17 -O2 -s WASM=1 -s EXPORTED_FUNCTIONS=['_main'] -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap']

# Source files
SOURCES := $(wildcard *.cpp)
OBJECTS := $(SOURCES:.cpp=.o)
EXECUTABLES := $(SOURCES:.cpp=)
WASM_OUTPUTS := $(SOURCES:.cpp=.js)

# Default target
all: $(EXECUTABLES)

# WebAssembly target
wasm: $(WASM_OUTPUTS)

# Rule for native executables
%: %.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

# Rule for WebAssembly outputs
%.js: %.cpp
	$(EMCXX) $(EMFLAGS) $< -o $@

# Object files (for debugging)
%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Calculator specific target
calculator: calculator.cpp
	$(CXX) $(CXXFLAGS) calculator.cpp -o calculator

# Calculator WebAssembly target
calculator.js: calculator.cpp
	$(EMCXX) $(EMFLAGS) calculator.cpp -o calculator.js

# Clean targets
clean:
	rm -f $(EXECUTABLES) $(OBJECTS) *.js *.wasm *.wast

clean-wasm:
	rm -f *.js *.wasm *.wast

# Install target (for system installation)
install: $(EXECUTABLES)
	mkdir -p /usr/local/bin
	cp $(EXECUTABLES) /usr/local/bin/

# Debug target
debug: CXXFLAGS += -g -DDEBUG
debug: $(EXECUTABLES)

# Help target
help:
	@echo "Available targets:"
	@echo "  all        - Build all native executables"
	@echo "  wasm       - Build all WebAssembly modules"
	@echo "  calculator - Build calculator executable"
	@echo "  clean      - Remove all build artifacts"
	@echo "  clean-wasm - Remove only WebAssembly artifacts"
	@echo "  debug      - Build with debug information"
	@echo "  install    - Install executables to system"
	@echo "  help       - Show this help message"

# Phony targets
.PHONY: all wasm clean clean-wasm install debug help