---
title: "CMake 执行进程 execute_process"
date: 2024-02-29T18:58:54+08:00
draft: false
categories: "CMake"
---

在 CMake 中 `execute_process` 函数可以执行系统命令。例如：

```diff
execute_process(
	COMMAND echo Hello
)
```

COMMAND 接受的参数是一个 [list](https://cmake.org/cmake/help/latest/manual/cmake-language.7.html#lists)，所以不要用双引号包裹。

`execute_process` 也支持运行多条命令，例如：

```diff
execute_process(
	COMMAND echo Hello
	COMMAND echo World
	COMMAND echo Wow
)
```

仔细观察 CMake 的输出，会发现只输出了 `Wow` ，这是因为多个 COMMAND 之间是通过管道连接的。前一个 COMMAND 的输出会作为给下一个 COMMAND 的输入。例如下面的代码：

```diff
execute_process(
	COMMAND echo Hello World
	COMMAND tee out1.txt
	COMMAND tee out2.txt
)
```

运行上面的 CMake 的脚本代码，我们能在命令行输出中看到 `Hello World` ，同时，在生成的 `out1.txt` 和 `out2.txt` 文件中也能看到同样的内容。

不过，`execute_process` 的 COMMAND 不支持类似于 `&&` 、`||` 、`>` 等 Shell 运算符。因为 COMMAND 参数会以 `argv` 的形式传递给 exec 系统调用，来直接执行程序，并不是在 Shell 中运行程序。

其他的 `execute_process` 详细用法参见：[execute_process — CMake Documentation](https://cmake.org/cmake/help/latest/command/execute_process.html)