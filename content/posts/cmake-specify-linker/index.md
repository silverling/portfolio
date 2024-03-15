---
title: "Cmake Specify Linker"
date: 2024-03-15T14:48:29+08:00
draft: false
categories: "CMake"
---

目前主流的 Linker（链接器）有 [`ld`](https://ftp.gnu.org/old-gnu/Manuals/ld-2.9.1/html_mono/ld.html), [`gold`](https://www.gnu.org/software/binutils/), [`lld`](https://lld.llvm.org/), [`mold`](https://github.com/rui314/mold)，不同的 Linker 在链接速度和资源占用方面存在差异。例如，相比 `ld` 和 `gold`，`lld` 有着更快的链接速度和更少的内存占用，`mold` 则在链接速度上遥遥领先。

本文主要介绍在 CMake 中如何指定使用特定的 Linker。

主流的 Compiler Driver（如 GCC、Clang）均支持通过 `-fuse-ld=<linker>` 选项指定 Linker。

## `add_link_options`

通过 `add_link_options` 选项为当前文件夹和之后的所有 targets 指定链接选项，例如：

```
add_link_options("-fuse-ld=lld")
```

也可以通过 `target_link_options` 为某个 target 单独指定。

## `CMAKE_<LANG>_FLAGS`

也可以通过 `CMAKE_CXX_FLAGS` 指定链接选项，以 C++ 程序为例：

```
set(CMAKE_CXX_FLAGS "-fuse-ld=lld")
```

需要注意的是，CMake 生成的编译步骤是将编译过程和链接过程分开的。在编译阶段，`-fuse-ld` 选项不会被使用，因此，Clang 编译器会警告 `argument unused during compilation: '-fuse-ld=lld'`，如果同时指定 `-Werror` 选项，该警告则被视为错误。

可以增加 `-Wno-unused-command-line-argument` 选项抑制上述警告，但仍然推荐使用本文的第一种方式。

