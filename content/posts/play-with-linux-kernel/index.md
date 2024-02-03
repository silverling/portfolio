---
title: "试玩 Linux Kernel"
date: 2024-02-03T21:44:13+08:00
draft: false
categories: "Linux"
---

基于 Busybox 和 QEMU，我们可以搭建一个非常小的玩具 Linux 系统，可以借此来体验开发编译 Linux 内核的乐趣。

## 准备工作

由于最近对 Incus System Container 很感兴趣，于是就使用 Incus 创建一个 Debian 12 的容器来进行本次体验。

```bash
incus launch mirrors:debian/12 debian12
incus exec debian12 -- bash
```

进入容器后，安装一些在编译过程中会用的的工具与库。

```bash
apt install wget gcc gdb bzip2 bc xz-utils flex bison
apt install libncurses-dev libssl-dev libelf-dev
apt install cpio qemu-system-x86
```

接着，创建工作目录 `kernel-dev` 并下载 Kernel 和 Busybox 的源码：

```bash
mkdir kernel-dev
cd kernel-dev
wget https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.7.3.tar.xz
wget https://www.busybox.net/downloads/busybox-1.36.1.tar.bz2
tar xf linux-6.7.3.tar.xz
tar xf busybox-1.36.1.tar.bz2
```

## 编译 Kernel

在 Kernel 源码目录下，直接 `make defconfig` 生成默认配置文件 `.config`，编辑其内容，修改 `CONFIG_LOCALVERSION` 来自定义内核版本标识。最后，`make -j $(nproc)` 使用所有 CPU 核心来编译内核镜像。

```bash
cd linux-6.7.3
make defconfig

# Edit .config, eg: CONFIG_LOCALVERSION="-Silver"

make -j $(nproc)
```

## 编译 Busybox

在 Busybox 源码目录下，通过 `make menuconfig` 将 `Settings -> Build static binary (no shared libs)` 选项启用，然后 `make -j $(nproc)` 编译。

```bash
cd busybox-1.36.1
make menuconfig
make -j $(nproc)
```

## 构建 Initramfs

创建 `run` 目录来作为我们测试 kernel 的工作目录，在该目录下，继续创建 `initramfs` 目录，并将编译好的 Kernel 和 Busybox 复制进来，创建 `init` 脚本作为系统的母进程（PID 为 1）。

```bash
mkdir -p run/initramfs/bin
cp linux-6.7.3/arch/x86_64/boot/bzImage run/
cp busybox-1.36.1/busybox run/initramfs/bin
```

`init` 脚本内容如下，主要负责在内核加载完成后，挂载 `/proc` 目录，打印一行 “Hello World”，然后返回一个 shell 提供交互。

```bash
#!/bin/busybox sh

/bin/busybox mkdir -p /proc && /bin/busybox mount -t proc none /proc
/bin/busybox echo -e "\nHello World!\n"

/bin/busybox sh
```

另外，需要 `chmod +x ./init` 使 `init` 脚本具有可执行权限。

接下来，创建一个 `Makefile` 脚本，来生成 initramfs 镜像和后续启动 QEMU 虚拟机。

```makefile
.PHONY: initramfs

initramfs:
	cd ./initramfs && find . -print0 | cpio -ov --null --format=newc | gzip -9 > ../initramfs.img

run:
	qemu-system-x86_64 \
			-kernel bzImage \
			-initrd initramfs.img \
			-m 1G \
			-nographic \
			-append "earlyprintk=serial,ttyS0 console=ttyS0"
```

然后 `make initramfs` 来构建 `initramfs.img` 磁盘镜像。

此时，`run` 目录的文件结构如下：

```txt
📂run
├──📃Makefile
├──📃bzImage
├──📂initramfs
│   ├──📂bin
│   │   └── 📃busybox
│   └──📃init
└──📃initramfs.img
```


## 运行系统

终于！此时，只需 `make run` 就可启动 QEMU 虚拟机，屏幕上会滚动显示一些内核输出，并输出 “Hello World”，然后弹出 shell 等待输入。

可以执行下面的命令，来查看我们之前在 `.config` 中配置的自定义内核版本标识。

```bash
busybox uname -r
```

最后，通过下面的命令来关闭系统，退出虚拟机。

```bash
busybox poweroff -f
```

结束！

参见：[【内核】快速上手 玩耍kernel - 哔哩哔哩](https://www.bilibili.com/video/BV1nG411B7c1/)