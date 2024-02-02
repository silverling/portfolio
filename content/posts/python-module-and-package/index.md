---
title: "Python Module and Package"
date: 2024-02-02T21:02:40+08:00
draft: false
categories: "Python"
---

本文介绍 Python 中 Module 和 Package 的区别和关系。

## Python Module

Module 是最小的模块单元，可以是一个 Python 文件（`.py`），也可以是一个其他语言（例如 C 语言）编写编译的模块，也可以是解析器自带的内置模块（例如 `itertools` 模块）

导入 Module 的方式也很直白：

```python
import <module_name>
```

Python 解释器查找 Module 的路径为 `sys.path`，通常包含当前工作目录。

当 Module 被导入时，其中的代码将被执行。如果该模块也可以作为单脚本执行，这部分代码应该用 `if __name__ == "__main__":` 包裹起来，避免在导入模块时被执行。

当 Module 被多次导入时，其代码只执行一次。可以通过 `importlib` 来重新导入 Module。

```python
import importlib
importlib.reload(<module_name>)
```

## Python Package

多个 Module 以层级关系组织在一起，就构成了 Package。一般来说，Package 是一个包含很多 Module 的文件夹。

例如，当 Package 的结构如下时：

```txt
📂pkg
├──📃mod1.py
└──📃mod2.py
```

可以通过以下方式导入 `pkg` 中的 Module：

```python
import pkg.mod1
from pkg import mod2
```

但是，下面这种方式却会报错：

```python
import pkg

# do something with pkg.mod1, eg:
print(pkg.mod1) # AttributeError: module 'pkg' has no attribute 'mod1'
```

这种情况可以借助 Package 文件夹中 `__init__.py` 解决，当 Package 或其中的 Module 被导入时， `__init__.py` 会被执行，因此可以在其中实现 Package 的初始化等操作。

例如，在 `__init__.py` 中写入：

```python
from . import mod1, mod2
```

此时，通过之前 `pkg.mod1` 这种方式调用模块就不会报错了。