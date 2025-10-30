cmake_minimum_required(VERSION 3.10)
project(VSCodeZeroSamples)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set Emscripten-specific settings for WebAssembly compilation
if(EMSCRIPTEN)
    set(CMAKE_EXECUTABLE_SUFFIX ".js")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s USE_SDL=2 -s WASM=1")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s EXPORTED_FUNCTIONS=['_main']")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap']")
endif()

# Add executable for calculator
add_executable(calculator calculator.cpp)

# Add executable for any additional C++ files
file(GLOB CPP_SOURCES "*.cpp")
foreach(CPP_SOURCE ${CPP_SOURCES})
    get_filename_component(EXECUTABLE_NAME ${CPP_SOURCE} NAME_WE)
    if(NOT EXECUTABLE_NAME STREQUAL "calculator")
        add_executable(${EXECUTABLE_NAME} ${CPP_SOURCE})
    endif()
endforeach()

# Set output directory
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# Add custom target for WebAssembly build
if(EMSCRIPTEN)
    add_custom_target(wasm ALL
        COMMAND ${CMAKE_COMMAND} --build . --target calculator
        COMMENT "Building WebAssembly modules"
    )
endif()