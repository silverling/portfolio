---
title: "CMake and Python"
date: 2024-01-31T13:11:23+08:00
draft: false
categories: "CMake"
---

在 CMake 中指定 Conda 环境或 venv 环境的两种方法。以下方式均可以通过修改 `CMakeLists.txt` 来实现，也可以在命令行执行 `cmake` 时添加 `-D` 参数实现。

## FindPython3

在 CMake 中指定具体 Python 环境，可以在 `find_package(Python3)` 前指定：

```cmake
set(Python3_ROOT_DIR "YOUR_PYTHON_PATH")
```

当 CMake 版本低于 3.15 时，需要额外指定：

```cmake
set(Python3_FIND_STRATEGY LOCATION)
```

详见：

- [FindPython3 — CMake 3.28.2 Documentation](https://cmake.org/cmake/help/latest/module/FindPython3.html)
- [CMP0094 — CMake 3.28.2 Documentation](https://cmake.org/cmake/help/latest/policy/CMP0094.html)

完整的示例：

```cmake
# cmake_policy(SET CMP0094 NEW)

set(Python3_ROOT_DIR "E:/Development/Micromamba/envs/sci")

find_package(Python3 COMPONENTS Interpreter Development)

message(STATUS "Python3_FOUND: ${Python3_FOUND}")
if (Python3_FOUND)
    message(STATUS "Python3_INCLUDE_DIRS: ${Python3_INCLUDE_DIRS}")
    message(STATUS "Python3_LIBRARIES: ${Python3_LIBRARIES}")
    message(STATUS "Python3_VERSION: ${Python3_VERSION}")
    message(STATUS "Python3_EXECUTABLE: ${Python3_EXECUTABLE}")
endif ()
```

参见：[FindPython ignores Python3_ROOT_DIR in favor of a newer interpreter (#21186) · 议题 · CMake / CMake · GitLab (kitware.com)](https://gitlab.kitware.com/cmake/cmake/-/issues/21186#note_1156024)

## FindPythonInterp & FindPythonLibs

*这种方式已在 3.12 版本被弃用，推荐使用新方式*

使用这种方式时，只需在 `find_package(PythonInterp)` 前指定 `PYTHON_EXECUTABLE`，`find_package(PythonLibs)` 同理，可以指定 `PYTHON_LIBRARY` （Python 库的路径）和 `PYTHON_INCLUDE_DIR` （Python 头文件的路径）。例如：

```cmake
# cmake_policy(SET CMP0148 OLD)

set(PYTHON_EXECUTABLE "E:/Development/Micromamba/envs/sci/python.exe")
set(PYTHON_LIBRARY "E:/Development/Micromamba/envs/sci/libs/python310.lib")
set(PYTHON_INCLUDE_DIR "E:/Development/Micromamba/envs/sci/include")

find_package(PythonInterp)
find_package(PythonLibs)

message(STATUS "Python found: ${PYTHONINTERP_FOUND}")
message(STATUS "Python version: ${PYTHON_VERSION_STRING}")
message(STATUS "Python Library found: ${PYTHONLIBS_FOUND}")
message(STATUS "Python Library version: ${PYTHONLIBS_VERSION_STRING}")
```

详见： 

- [FindPythonInterp — CMake 3.28.2 Documentation](https://cmake.org/cmake/help/latest/module/FindPythonInterp.html)
- [FindPythonLibs — CMake 3.28.2 Documentation](https://cmake.org/cmake/help/latest/module/FindPythonLibs.html)