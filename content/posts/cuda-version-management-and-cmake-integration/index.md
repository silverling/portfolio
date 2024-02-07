---
title: "CUDA 版本管理与 CMake 集成"
date: 2024-02-07T17:36:19+08:00
draft: false
categories: "CMake"
---

## CUDA 版本管理

管理多个 CUDA 版本的方式有很多，其中我认为较为方便的方式当属 Conda。Conda 是一个通用的环境管理工具，支持 Python 环境和 C++ 环境等多种语言环境。

而本文选用的是 Micromamba。首先，Mamba 是 Conda 的一种替代选择，相比于 Conda，Mamba 使用了更快的依赖解析器，以及默认使用 `conda-forge` channel，使得 Mamba 创建环境和安装软件包的速度**非常快**。Micromamba 则更进一步，去除了 Conda 的默认 base 环境，使得环境管理更加简洁轻量。

### 安装 Micromamba

在 Linux 系统上，如果你所使用的包管理器有提供，则直接安装即可。除此之外，也可通过下面的命令快速安装，安装过程会交互地询问进行初始配置。

```bash
"${SHELL}" <(curl -L micro.mamba.pm/install.sh)
```

更多安装 Micromamba 的方式参见：[Micromamba Installation — documentation](https://mamba.readthedocs.io/en/latest/installation/micromamba-installation.html) 

Micromamba 管理的环境位置可通过环境变量 `MAMBA_ROOT_PREFIX` 设置。如不设置，默认位于 `~/micromamba` 目录。我习惯将其设置为 `$HOME/.conda` ，在 Shell 配置文件中填入一下内容，并激活或重启 Shell。

```bash
export MAMBA_ROOT_PREFIX="$HOME/.conda"
```

**下文均假定已设置 `MAMBA_ROOT_PREFIX` 该环境变量。**

Micromamba 的命令行接口以及配置文件与 Conda 基本一致。

修改 `~/.condarc` ，填入以下配置。其中，主要配置了默认 Channel 和一些常用的镜像源。可以根据需要，自行更改。

```yaml
auto_activate_base: false
show_channel_urls: true
changeps1: false
channel_priority: strict
channels:
  - conda-forge
default_channels:
  - https://mirrors.bfsu.edu.cn/anaconda/pkgs/main
custom_channels:
  conda-forge: https://mirrors.bfsu.edu.cn/anaconda/cloud
  pytorch: https://mirrors.bfsu.edu.cn/anaconda/cloud
  nvidia: https://mirrors.sustech.edu.cn/anaconda-extra/cloud
  Paddle: https://mirrors.bfsu.edu.cn/anaconda/cloud/
```

### 安装 CUDA

NVIDIA 在其 Channel 有提供各种开发工具，其中就包括 CUDA 工具包。通过 Label 的方式指定 Channel，即可下载特定版本的 CUDA。可用的 Label 参见：[cuda-toolkit Labels](https://anaconda.org/nvidia/cuda-toolkit/labels)

例如，通过下面的命令，创建一个名为 `cuda120` 的环境，在 `nvidia/label/cuda-12.0.0` Channel 下载安装 `cuda-toolkit` 包。

```bash
micromamba create -n cuda120 -c "nvidia/label/cuda-12.0.0" cuda-toolkit
```

这样我们就完成了 CUDA 的安装。

### CUDA 版本切换

通过 `micromamba activate` 激活环境，执行 `nvcc -V` 即可看到安装好的 CUDA 信息。

但是，`micromamba activate` 只是帮我们添加了 `PATH` 环境变量，并未修改 `LD_LIBRARY_PATH` 等其他环境变量，可能会导致开发过程出现问题。因此，我们换用手动配置的方式。

手动配置主要更改 `PATH` 、`LD_LIBRARY_PATH` 、`CUDA_HOME` 、`CUDA_PATH` 这几个环境变量。

Micromamba 管理的环境位于 `$MAMBA_ROOT_PREFIX/envs` 目录，例如我们上面创建的 `cuda120` 环境，就位于 `$MAMBA_ROOT_PREFIX/envs/cuda120` 目录。因此，我们可以创建一个 `env.sh` 并如下配置：

```bash
export CUDA_PATH="$MAMBA_ROOT_PREFIX/envs/cuda120"

export CUDA_HOME="$CUDA_PATH"
export PATH="$CUDA_PATH/bin:$PATH"
export PATH="$CUDA_PATH/nsight_compute:$PATH"
export PATH="$CUDA_PATH/nsight_compute/bin:$PATH"
export LD_LIBRARY_PATH="$CUDA_PATH/lib:$LD_LIBRARY_PATH"
export LD_LIBRARY_PATH="$CUDA_PATH/lib64:$LD_LIBRARY_PATH"
export LD_LIBRARY_PATH="$CUDA_PATH/nvvm/lib64:$LD_LIBRARY_PATH"
export LD_LIBRARY_PATH="$CUDA_PATH/extras/CUPTI/lib64:$LD_LIBRARY_PATH"
```

在用到该环境时，通过 `source env.sh` 即可设置这些环境变量，完成配置。

除了这样，为了方便切换，我们可以将其写成一个函数，添加到 Shell 配置中（`.bashrc` 、 `.zshrc` 等等）。

```bash
usecuda() {

	if [ -z $1 ]; then
		echo "Usage: usecuda <env>"
		return
	fi

	# check whether MAMBA_ROOT_PREFIX is set
	if [ -z "$MAMBA_ROOT_PREFIX" ]; then
		echo "Environment variable MAMBA_ROOT_PREFIX not set"
		echo "Please set MAMBA_ROOT_PREFIX to the root of the mamba environment"
		return
	fi
	
	# check whether new env exists
	local env=$1
	local new_env=$(readlink -f "$MAMBA_ROOT_PREFIX/envs/$env")
	if [ ! -d $new_env ]; then 
		echo "Environment $new_env not found"
		return
	fi

	# detect and remove old env
	if [ ';' != "$(which nvcc);" ]; then
		local old_env=$(dirname $(dirname $(which nvcc)))
		export PATH=$(echo $PATH | tr ':' '\n' | grep -v -E "^$old_env/" | tr '\n' ':' | sed 's;:$;;')
		export LD_LIBRARY_PATH=$(echo $LD_LIBRARY_PATH | tr ':' '\n' | grep -v -E "^$old_env/" | tr '\n' ':' | sed 's;:$;;')
	fi

	# set new env
	echo "Use CUDA environment at $new_env"
	export CUDA_PATH="$new_env"

	export CUDA_HOME="$CUDA_PATH"
	export PATH="$CUDA_PATH/bin:$PATH"
	export PATH="$CUDA_PATH/nsight_compute:$PATH"
	export PATH="$CUDA_PATH/nsight_compute/bin:$PATH"
	export LD_LIBRARY_PATH="$CUDA_PATH/lib:$LD_LIBRARY_PATH"
	export LD_LIBRARY_PATH="$CUDA_PATH/lib64:$LD_LIBRARY_PATH"
	export LD_LIBRARY_PATH="$CUDA_PATH/nvvm/lib64:$LD_LIBRARY_PATH"
	export LD_LIBRARY_PATH="$CUDA_PATH/extras/CUPTI/lib64:$LD_LIBRARY_PATH"

	echo "Done"
}
```

这样，以后只需 `usecuda <env>` 便可使用该环境的 CUDA。

## CMake 编译 CUDA 程序

通过上面的方法，在调用 CMake 前，选择并激活需要的 CUDA 环境即可。

CMake 添加 CUDA 支持主要有三种方式：
- 在 `project()` 里添加 `CUDA` 语言
- 通过 `enable_language` 启用 `CUDA` 语言支持
- 通过 FindCUDA 模块编译 CUDA 程序

下面是一段用来测试的 CUDA 的 Hello World 代码。

```cpp
#include <stdio.h>

__global__ void helloCUDA()
{
    printf("Hello, CUDA!\n");
}

int main()
{
    // Print current CUDA version
    printf("CUDA version: %d.%d\n", CUDART_VERSION / 1000, (CUDART_VERSION % 100) / 10);

    // Launch kernel with 1 block and 1 thread
    helloCUDA<<<10, 1>>>();
    
    // Wait for GPU to finish before exiting
    cudaDeviceSynchronize();

    return 0;
}
```

### `project(XXX CUDA)`

这种方式只需声明该项目支持 CUDA 即可，CMake 会自动寻找合适的 CUDA 编译器，与编译 C/C++ 程序没有显著区别。

```cmake
cmake_minimum_required(VERSION 3.10)

set(CMAKE_CUDA_FLAGS "${CMAKE_CUDA_FLAGS} -allow-unsupported-compiler")
project(cuda_hello_world C CXX CUDA)

set(CMAKE_CUDA_ARCHITECTURES 86)

message(STATUS "CMAKE_CUDA_COMPILER: ${CMAKE_CUDA_COMPILER}")
message(STATUS "CMAKE_CUDA_COMPILER_VERSION: ${CMAKE_CUDA_COMPILER_VERSION}")

# Add CUDA executable
add_executable(cuda_hello_world main.cu)
```

### `enable_language(CUDA)`

这种方式只需添加一行 `enable_language(CUDA)`，与 `project(XXX CUDA)` 唯一不同的是，这种方式不会额外引入 `project` 函数产生的一些变量。

```cmake
cmake_minimum_required(VERSION 3.10)
project(cuda_hello_world C CXX)

# Add CUDA C++ compiler flags before enabling CUDA
set(CMAKE_CUDA_FLAGS "${CMAKE_CUDA_FLAGS} -allow-unsupported-compiler")

enable_language(CUDA)
set(CMAKE_CUDA_ARCHITECTURES 86)

message(STATUS "CMAKE_CUDA_COMPILER: ${CMAKE_CUDA_COMPILER}")
message(STATUS "CMAKE_CUDA_COMPILER_VERSION: ${CMAKE_CUDA_COMPILER_VERSION}")

# Add CUDA executable
add_executable(cuda_hello_world main.cu)
```

参见：[enable_language — CMake 3.28.3 Documentation](https://cmake.org/cmake/help/latest/command/enable_language.html#command:enable_language)

### FindCUDA

*这种方式已在 3.10 版本被弃用，推荐使用新方式*

这种方法提供了[一系列函数和宏](https://cmake.org/cmake/help/latest/module/FindCUDA.html#commands)，例如 `cuda_add_executable` 可以添加一个 CUDA 可执行程序 Target，示例代码如下：

```cmake
cmake_minimum_required(VERSION 3.10)
project(cuda_hello_world C CXX)

find_package(CUDA REQUIRED)

message(STATUS "CUDA_VERSION: ${CUDA_VERSION}")
message(STATUS "CUDA_TOOLKIT_ROOT_DIR: ${CUDA_TOOLKIT_ROOT_DIR}")

# Add CUDA C++ compiler flags
set(CUDA_NVCC_FLAGS "${CUDA_NVCC_FLAGS} -allow-unsupported-compiler")

# Add CUDA executable
cuda_add_executable(cuda_hello_world main.cu)
```

参见：[FindCUDA — CMake 3.28.3 Documentation](https://cmake.org/cmake/help/latest/module/FindCUDA.html)

### FindCUDAToolkit

该模块主要用途是查找 CUDA 相关的库，如 nvcc、cuBLAS 等等，并不直接用来编译 CUDA 程序。

参见：[FindCUDAToolkit — CMake 3.28.3 Documentation](https://cmake.org/cmake/help/latest/module/FindCUDAToolkit.html)
