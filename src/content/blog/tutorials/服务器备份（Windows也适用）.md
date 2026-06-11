---
title: '服务器备份（Windows也适用）'
description: 'FreeFileSync + freeSSHd + Windows任务计划程序'
pubDate: 2025-04-13
tags: ['部署教程']
---
## 一、方案
FreeFileSync + freeSSHd + Windows任务计划程序

[FreeFileSync](https://freefilesync.org/)：设置文件备份方案（双向同步、镜像同步、更新同步、自定义同步），适用于本地的文件同步之外，还支持 Google Driver、SFTP 和 FTP 三种远程方式进行文件的同步与备份。

双向同步：识别左右两个目录中文件的异同，同步后双方文件及结构保持相同。

镜像同步：无论右侧的目标目录如何改变，最后同步都会依据左侧的源目录为准，即【全量备份】。

更新同步：即只同步新的文件或是已经变动的文件，相较于全量备份而言属于【增量备份】。

自定义同步：用户自定义规则进行文件同步。

[freeSSHd](https://freesshd.informer.com/download/)：Windows需要安装SFTP软件来搭建服务进行文件传输。

Windows任务计划程序：配置Windows任务计划程序来实现定时备份。

## 二、配置
FreeFileSync、freeSSHd安装过程全部下一步/是 即可。

### freeSSHd
1. 安装完成后打开，最好以管理员身份运行，需要配置的信息如下：

![](/tutorials/assets/image-20240807171618394.png)

2. 配置Users，点击add后弹出对话框，设置用户名，选择密码验证方式，设置密码，勾选SFTP，确定。

![](/tutorials/assets/image-20240807171714518.png)

![](/tutorials/assets/image-20240807171748938.png)

3. SSH配置：Listen address选择本机IP地址，避免端口被占用，建议手动设置一个未被占用的端口，点击应用。

![](/tutorials/assets/image-20240807172058265.png)

4. Authentication配置：默认/Required即可：

![](/tutorials/assets/image-20240807172247393.png)

5. SFTP配置：设置的是远端SFTP的目录，选择一个目录即可（目录必须可以找到需要备份的文件），默认值是系统用户下目录：

![](/tutorials/assets/image-20240807172440465.png)

6. 以上操作完成后，回到Server status，可以看到 SSH server is running，如果还是没有启动，手动点击启动(如果失败，尝试以管理员方式运行、检查端口号是否被占用)。

![](/tutorials/assets/image-20240807172635495.png)

7. 测试：在cmd中输入命令：sftp -P 2222 sftp@192.168.x.x。出现下面的情况即为成功：![](/tutorials/assets/image-20240807173600044.png)

### FreeFileSync
1. 安装完成后打开软件，点击“浏览”选择需要备份的文件夹和备份后的目标文件夹，可以通过+/-来添加/删除多个目录。

![](/tutorials/assets/image-20240807220005814.png)

2. 如果需要备份远程服务器的文件，点击“浏览”旁边的云朵按钮配置相关内容，有Google云盘、SFTP、FTP三种方式，通常使用SFTP方式（Windows需要按照freeSSHd进行配置），选择密码方式进行连接，连接后可以浏览服务器上的目录，选择需要备份的目录和目标目录即可。

![](/tutorials/assets/image-20240807220407002.png)

3. 点击“设置”按钮设置备份策略，分别设置“比较”“过滤器”“同步”。

![](/tutorials/assets/image-20240807221123537.png)

4. 比较和过滤器正常情况下默认即可，也可以根据实际情况自行更改，同步方式在第一部分已经介绍，建议第一次备份使用双向备份方式，之后使用更新备份方式。

![](/tutorials/assets/image-20240807221455460.png)

5. 点击比较，可以清楚的看到两个目录文件的差异，以及需要进行的操作，点击同步即可对两个目录进行同步

![](/tutorials/assets/image-20240807221826311.png)

6. 完成以上设置后，选择“另存为批处理作业”，比如保存为auto_backup.ffs_batch文件

![](/tutorials/assets/image-20240807222117154.png)

### Windows任务计划程序
1. 打开系统的“任务计划程序”（建议直接使用搜索），创建一个新文件夹，例如Backup

![](/tutorials/assets/image-20240807222442576.png)

2. 点击“创建基本任务”，按照提示进行相关操作

![](/tutorials/assets/image-20240807222714433.png)

3. 操作选择“启动程序”，程序或脚本选择FreeFileSync安装目录，添加参数批处理作业保存目录（上一节最后一步）。

![](/tutorials/assets/image-20240807223056563.png)

4. 设置完成后可以手动运行一下查看效果

