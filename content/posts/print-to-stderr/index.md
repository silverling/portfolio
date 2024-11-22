---
title: "Shell 脚本输出标准错误信息"
date: 2024-11-22T15:13:04+08:00
draft: false
categories: "Dev"
---

在 Shell 脚本中，可以利用重定向符 `>` 改变程序的输出位置。
例如，`>&2` 可以将字符输出到标准错误（stderr）中，其中的 `&2` 表示文件描述符为`2` 的文件，即标准错误。

```bash
printf 'Error message' >&2
```

在 POSIX 标准中，文件描述符 `0` 代表标准输入， `1` 代表标准输出， `2` 代表标准错误。
标准输入通常为键盘输入，标准输出和标准错误通常为屏幕显示。

我们编写一段 Shell 脚本 `demo.sh` ，如下：

```bash
printf 'Error message' >&2
printf 'Normal message'
```

如果我们只想要将脚本的错误信息保存到文件 `output.log`，则可以

```bash
bash demo.sh 2>output.log
```

如果无论是错误信息，还是正常信息，我们均想保存在文件 `output.log`，则可以

```bash
bash demo.sh >output.log 2>&1
```

注意，重定向符存在先后关系影响，如果是 `bash demo.sh 2>&1 >output.log` 则无法实现。因为 `2>&1` 的意思是将标准输出重定向到**当前**标准输出指向的文件，而在 `>output.log` 之前，标准输出指向的依然是屏幕输出，这一点要千万注意。

参见：[What method should I use to write error messages to 'stderr' using 'printf' in a bash script? - Stack Overflow](https://stackoverflow.com/questions/10963653/what-method-should-i-use-to-write-error-messages-to-stderr-using-printf-in-a)
