---
title: "Incus 初见"
date: 2024-02-06T22:03:23+08:00
draft: false
categories: "Linux"
---

目前，虚拟化容器技术的应用，大致可以分为三类：虚拟机、系统容器和应用容器。

他们之间的区别主要是，虚拟机运行的是一个完整的操作系统，包括内核和用户空间工具等等，而容器是通过 Linux Namespaces 和 Cgroups 等技术运行的一套隔离环境，容器和宿主机共享同一个操作系统内核。应用容器主要针对特定任务，容器的创建和销毁一般根据任务调度而定，当任务结束时，容器也会停止运行。系统容器则更像是轻量虚拟机，容器的运行和结束与特定任务无关，由用户自行决定开启和结束。更详细的区别对比参见：[About containers and VMs - Incus documentation](https://linuxcontainers.org/incus/docs/main/explanation/containers_and_vms/)

我们熟知的 Docker 就是应用容器的典型代表。而本文的 Incus 则支持虚拟机和系统容器。

## 快速开始

按照官网文档说明 [How to install Incus - Incus documentation](https://linuxcontainers.org/incus/docs/main/installing/) 安装并初始化 Incus。

`incus remote list` 展示了 Incus 的 Image 下载源，例如：

```bash
➜ incus remote list
+-----------------+-----------------------------------------+---------------+-------------+--------+--------+--------+
|      NAME       |                   URL                   |   PROTOCOL    |  AUTH TYPE  | PUBLIC | STATIC | GLOBAL |
+-----------------+-----------------------------------------+---------------+-------------+--------+--------+--------+
| images          | https://images.linuxcontainers.org      | simplestreams | none        | YES    | NO     | NO     |
+-----------------+-----------------------------------------+---------------+-------------+--------+--------+--------+
| local (current) | unix://                                 | incus         | file access | NO     | YES    | NO     |
+-----------------+-----------------------------------------+---------------+-------------+--------+--------+--------+
| mirror          | https://mirrors.bfsu.edu.cn/lxc-images/ | simplestreams | none        | YES    | NO     | NO     |
+-----------------+-----------------------------------------+---------------+-------------+--------+--------+--------+
```

对于国内大陆用户，可以考虑添加国内 Image 源：

```bash
incus remote add mirror https://mirrors.bfsu.edu.cn/lxc-images/ --protocol=simplestreams --public
```

更多的国内源，参见：[LXC Images 软件仓库镜像使用帮助 - MirrorZ Help](https://help.mirrorz.org/lxc-images/)

通过 `incus image list mirror:debian` 列出 mirror 源中名称包含 debian 的 Image.

通过指定 Image 和 Instance 名称，我们就可以创建一个系统容器：

```bash
incus create <image> <instance> # create an instance based on image
# or
incus launch <image> <instance> # create and start an instance
```

例如 `incus launch mirror:debian/12 debian12` 即可创建并启动一个名为 `debian12` 的 Debian 12 (Bookworm) 容器。

接着，`incus exec debian12 -- bash`  即可进入容器交互。

## 挂载目录

Incus 的目录挂载是通过添加 Device 的方式，通过添加一个 `disk` 类型的 Device，就可以将宿主机上的目录挂载到容器内。而且，这种方式是**可热插拔的**！这就意味着，在已经创建容器后，我们依然可以随时挂载或卸载目录，是不是和 Docker 的 Volume Mapping 很不一样呢！这简直太酷了！

例如，通过下面的命令，我们创建了一个名叫 `data` 的 `disk` 类型的 Device， 可以将宿主机上的 `/src` 目录挂载到容器 `debian12` 上的 `/data` 目录。

```bash
incus config device add debian12 data disk source=/src path=/data
```

通过 `incus config device remove debian12 data` 即可将其移除。

## 端口映射

同样地，Device 还有很多种类型和用法，其中就包括 `proxy` 类型。这种类型的 Device 可以实现宿主机和容器间的网络转发。

例如，通过下面的命令，创建一个名为 `ssh` 的 Device（名字随便起啦），将发往宿主机的 `127.0.0.1:2201` 的 TCP 流量转发到容器 `debian12` 内的 `127.0.0.1:22` 端口的。这样，便可以通过 SSH 访问容器来进行开发。

```bash
incus config device add debian12 ssh proxy listen=tcp:127.0.0.1:2201 connect=tcp:127.0.0.1:22
```

## NVIDIA 显卡支持（WSL2）

由于我的 Incus 环境位于 WSL2 中，所以这里只实践测试了 WSL2 上的 Incus 容器的 NVIDIA 显卡支持，其他 Linux 环境请参见：[Type: gpu - Incus documentation](https://linuxcontainers.org/incus/docs/main/reference/devices_gpu/) 以及 [Instance options - Incus documentation](https://linuxcontainers.org/incus/docs/main/reference/instance_options/#nvidia-and-cuda-configuration)

一般来说，在 Windows 上安装最新的 NVIDIA 显卡驱动，并将 WSL2 的内核更新到最新版，就完成了 WSL2 的 NVIDIA 显卡配置，此时，在 WSL2 中执行 `nvidia-smi` 即可看到显卡信息。

为容器启用 NVIDIA 显卡支持，需要安装 NVIDIA Container Toolkit，安装方式参见：[Installing the NVIDIA Container Toolkit — NVIDIA Container Toolkit 1.14.4 documentation](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)

- 对于配置了 ArchLinuxCN 的 ArchLinux：`pacman -S nvidia-container-toolkit`
- 对于配置了 AUR 的 ArchLinux：`paru -S aur/nvidia-container-toolkit`

WSL2 在启动时，会自动只读挂载 `/usr/lib/wsl/lib` 目录和 `/usr/lib/wsl/drivers` 目录，前者包含一些 NVIDIA 的运行时库和 CUDA 库，源目录位于 `C:\Windows\System32\lxss\lib` 。后者包含各种设备的驱动文件，源目录位于 `C:\Windows\System32\DriverStore\FileRepository` ，当然，NVIDIA 显卡驱动也在其中。

为了让 Incus 创建的容器拥有 NVIDIA 显卡支持，我们模仿 WSL2 配置 NVIDIA 环境的方式，只需将宿主机上的 `/usr/lib/wsl` 目录也挂载到容器中，并配置容器内的链接库查找路径，最后为容器启用 `nvidia.runtime` 选项即可。

示例代码如下：

```bash
incus create <image> <instance>
incus config device add <instance> libwsl disk source=/usr/lib/wsl path=/usr/lib/wsl recursive=true
incus config set <instance> nvidia.runtime="true"
incus file push /etc/ld.so.conf.d/ld.wsl.conf <instance>/etc/ld.so.conf.d/ld.wsl.conf
incus start <instance>
incus exec <instance> -- nvidia-smi
```

方便起见，我们可以将这套配置保存为一个 [Profile](https://linuxcontainers.org/incus/docs/main/profiles/) 来供日后使用。创建一个名为 `nv` 的 Profile：

```bash
incus profile create nv
incus profile edit nv
```

并填入以下内容：

```yaml
config:
  nvidia.driver.capabilities: all
  nvidia.runtime: "true"
description: NVIDIA Support
devices:
  eth0:
    name: eth0
    network: incusbr0
    type: nic
  ldconfig:
    path: /etc/ld.so.conf.d/ld.wsl.conf
    readonly: "true"
    required: "true"
    source: /etc/ld.so.conf.d/ld.wsl.conf
    type: disk
  libwsl:
    path: /usr/lib/wsl
    recursive: "true"
    required: "true"
    source: /usr/lib/wsl
    type: disk
  root:
    path: /
    pool: default
    type: disk
name: nv
used_by: []
```

这样的话，以后创建需要 NVIDAI 显卡支持的容器时，只需指定这个 Profile 即可：

```bash
incus launch <image> <instance> -p nv
```