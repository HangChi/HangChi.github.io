---
title: 'MinerU部署与使用'
description: '仓库地址：[https://github.com/opendatalab/MinerU](https://github.com/openda'
pubDate: 2025-04-12
tags: ['部署教程']
---
### 介绍
仓库地址：[https://github.com/opendatalab/MinerU](https://github.com/opendatalab/MinerU)

PDF-Extract-Kit PDF模型解析工具链代码：[https://github.com/opendatalab/PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit)

MinerU是一款将PDF转化为机器可读格式的工具（如markdown、json），可以很方便地抽取为任意格式。MinerU 不仅能将混合了图片、公式、表格、脚注等在内的复杂多模态 PDF 文档精准转化为清晰、易于分析的 Markdown 格式；同时支持从包含广告等各种干扰信息或者复杂格式的网页、电子书中快速解析、抽取正式内容，有效提高AI语料准备效率，助力各行业利用大模型、RAG等技术，结合学术文献、财务报告、法律文件、电子书籍等专业文档，打造垂直领域的新知识引擎。

### 主要功能
+ 删除页眉、页脚、脚注、页码等元素，确保语义连贯
+ 输出符合人类阅读顺序的文本，适用于单栏、多栏及复杂排版
+ 保留原文档的结构，包括标题、段落、列表等
+ 提取图像、图片描述、表格、表格标题及脚注
+ 自动识别并转换文档中的公式为LaTeX格式
+ 自动识别并转换文档中的表格为HTML格式
+ 自动检测扫描版PDF和乱码PDF，并启用OCR功能
+ OCR支持84种语言的检测与识别
+ 支持多种输出格式，如多模态与NLP的Markdown、按阅读顺序排序的JSON、含有丰富信息的中间格式等
+ 支持多种可视化结果，包括layout可视化、span可视化等，便于高效确认输出效果与质检
+ 支持纯CPU环境运行，并支持 GPU(CUDA)/NPU(CANN)/MPS 加速
+ 兼容Windows、Linux和Mac平台

### 软硬件环境支持说明
![](/tutorials/assets/1742620562512-17a3abd6-5b49-4fb4-8959-b5aec9f7077f.png)

### 使用
文档：[https://mineru.readthedocs.io/en/latest/index.html](https://mineru.readthedocs.io/en/latest/index.html)

#### 在线体验
官网：[https://mineru.net/](https://mineru.net/)

在线体验地址：[https://mineru.net/OpenSourceTools/Extractor](https://mineru.net/OpenSourceTools/Extractor)

#### 使用 CPU 快速体验
##### 安装magic-pdf
```bash
# 创建虚拟环境
conda create -n mineru python=3.10

# 激活虚拟环境
conda activate mineru

# 安装magic-pdf
pip install -U "magic-pdf[full]" --extra-index-url https://wheels.myhloli.com -i https://mirrors.aliyun.com/pypi/simple
```

##### 下载模型权重文件
方法一、从 Hugging Face 下载模型

使用python脚本 从Hugging Face下载模型文件：

```bash
pip install huggingface_hub

wget https://gcore.jsdelivr.net/gh/opendatalab/MinerU@master/scripts/download_models_hf.py -O download_models_hf.py

python download_models_hf.py
```

python脚本会自动下载模型文件并配置好配置文件中的模型目录

方法二、从ModelScope下载模型

使用python脚本 从ModelScope下载模型文件：

```bash
pip install modelscope

wget https://gcore.jsdelivr.net/gh/opendatalab/MinerU@master/scripts/download_models.py -O download_models.py

python download_models.py
```

python脚本会自动下载模型文件并配置好配置文件中的模型目录

配置文件可以在用户目录中找到，文件名为`magic-pdf.json`

**注：****可以重复执行此前的模型下载python脚本，将会自动将模型目录更新到最新版本。**

##### 修改配置文件以进行额外配置
完成**下载模型权重文件**步骤后，脚本会自动生成用户目录下的magic-pdf.json文件，并自动配置默认模型路径。 可在【用户目录】下找到magic-pdf.json文件。

> 1. windows的用户目录为 "C:\Users\用户名", linux用户目录为 "/home/用户名", macOS用户目录为 "/Users/用户名"
> 2. 如json内没有如下项目，请手动添加需要的项目，并删除注释内容（标准json不支持注释）
>

```bash
{
    // other config
    "layout-config": {
        "model": "doclayout_yolo" // 使用layoutlmv3请修改为“layoutlmv3"
    },
    "formula-config": {
        "mfd_model": "yolo_v8_mfd",
        "mfr_model": "unimernet_small",
        "enable": true  // 公式识别功能默认是开启的，如果需要关闭请修改此处的值为"false"
    },
    "table-config": {
        "model": "rapid_table",  // 默认使用"rapid_table",可以切换为"tablemaster"和"struct_eqtable"
        "sub_model": "slanet_plus",  // 当model为"rapid_table"时，可以自选sub_model，可选项为"slanet_plus"和"unitable"
        "enable": true, // 表格识别功能默认是开启的，如果需要关闭请修改此处的值为"false"
        "max_time": 400
    }
}
```

#### 使用 GPU (Windows)
##### 前置条件：
1. 安装cuda和cuDNN
2. 安装anaconda

参考：[https://www.yuque.com/aidabao/studynotes/cie653xx2phk0m8a?singleDoc#](https://www.yuque.com/aidabao/studynotes/cie653xx2phk0m8a?singleDoc#) 《环境配置》

##### 创建环境
```bash
conda create -n MinerU python=3.10

conda activate MinerU
```

##### 安装应用
```bash
pip install -U magic-pdf[full] --extra-index-url https://wheels.myhloli.com -i https://mirrors.aliyun.com/pypi/simple
```

##### 验证 magic-pdf的版本是否正确
```bash
magic-pdf --version  # 需要大于0.7.0
```

##### 下载模型
同上

##### 配置文件
同上

##### 运行
从仓库中下载样本文件，并测试

```bash
wget https://github.com/opendatalab/MinerU/blob/master/demo/small_ocr.pdf -O small_ocr.pdf
 
 magic-pdf -p small_ocr.pdf -o ./output
```

##### 测试 CUDA 加速
###### **覆盖安装支持cuda的torch和torchvision**
```bash
pip install --force-reinstall torch==2.3.1 torchvision==0.18.1 "numpy<2.0.0" --index-url https://download.pytorch.org/whl/cu118
```

###### **修改【用户目录】中配置文件magic-pdf.json中"device-mode"的值**
```bash
{
  "device-mode":"cuda"
}
```

###### **运行以下命令测试cuda加速效果**
```bash
magic-pdf -p small_ocr.pdf -o ./output
```

> CUDA加速是否生效可以根据log中输出的各个阶段cost耗时来简单判断，通常情况下，`layout detection cost` 和 `mfr time` 应提速10倍以上。
>

##### 为ocr开启cuda加速
1. **下载paddlepaddle-gpu, 安装完成后会自动开启ocr加速**

```bash
pip install paddlepaddle-gpu==2.6.1
```

2. **运行以下命令测试ocr加速效果**

```bash
magic-pdf -p small_ocr.pdf -o ./output
```

#### 使用 GPU (Linux)
##### 检测是否已安装 nvidia 驱动
```bash
nvidia-smi
```

> `CUDA Version` 显示的版本号应 >= 12.1，如显示的版本号小于12.1，需要升级驱动
>

##### 安装驱动
如没有驱动，则通过如下命令：

```bash
sudo apt-get update

sudo apt-get install nvidia-driver-545
```

安装专有驱动，安装完成后，重启电脑

```bash
reboot
```

##### 安装 Miniconda/Anaconda
参考：[https://www.yuque.com/aidabao/studynotes/cie653xx2phk0m8a?singleDoc#](https://www.yuque.com/aidabao/studynotes/cie653xx2phk0m8a?singleDoc#) 《环境配置》

##### 创建环境
```bash
conda create -n MinerU python=3.10

conda activate MinerU
```

##### 安装应用
```bash
pip install -U magic-pdf[full] --extra-index-url https://wheels.myhloli.com -i https://mirrors.aliyun.com/pypi/simple
```

检查magic-pdf的版本是否正确：

```bash
magic-pdf --version  # 需要大于0.7.0
```

##### 下载模型
同上

##### 配置文件
同上

##### 运行
从仓库中下载样本文件，并测试

```bash
wget https://gcore.jsdelivr.net/gh/opendatalab/MinerU@master/demo/small_ocr.pdf

magic-pdf -p small_ocr.pdf -o ./output
```

##### 测试 CUDA 加速
1. **修改【用户目录】中配置文件magic-pdf.json中"device-mode"的值**

```bash
{
  "device-mode":"cuda"
}
```

2. **运行以下命令测试cuda加速效果**

```bash
magic-pdf -p small_ocr.pdf -o ./output
```

> CUDA加速是否生效可以根据log中输出的各个阶段cost耗时来简单判断，通常情况下，`layout detection cost` 和 `mfr time` 应提速10倍以上。
>

##### 为ocr开启cuda加速
1. **下载paddlepaddle-gpu, 安装完成后会自动开启ocr加速**

```bash
python -m pip install paddlepaddle-gpu==3.0.0rc1 -i https://www.paddlepaddle.org.cn/packages/stable/cu118/
```

2. **运行以下命令测试ocr加速效果**

```bash
magic-pdf -p small_ocr.pdf -o ./output
```

#### 使用 GPU (Docker)
Docker 需设备gpu显存大于等于8GB，默认开启所有加速功能

运行本docker前可以通过以下命令检测自己的设备是否支持在docker上使用CUDA加速

```bash
docker run --rm --gpus=all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

#### 使用 API
##### 本地文件示例
```python
import os

from magic_pdf.data.data_reader_writer import FileBasedDataWriter, FileBasedDataReader
from magic_pdf.data.dataset import PymuDocDataset
from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
from magic_pdf.config.enums import SupportedPdfParseMethod

# args
pdf_file_name = "abc.pdf"  # replace with the real pdf path
name_without_suff = pdf_file_name.split(".")[0]

# prepare env
local_image_dir, local_md_dir = "output/images", "output"
image_dir = str(os.path.basename(local_image_dir))

os.makedirs(local_image_dir, exist_ok=True)

image_writer, md_writer = FileBasedDataWriter(local_image_dir), FileBasedDataWriter(
    local_md_dir
)

# read bytes
reader1 = FileBasedDataReader("")
pdf_bytes = reader1.read(pdf_file_name)  # read the pdf content

# proc
## Create Dataset Instance
ds = PymuDocDataset(pdf_bytes)

## inference
if ds.classify() == SupportedPdfParseMethod.OCR:
    infer_result = ds.apply(doc_analyze, ocr=True)

    ## pipeline
    pipe_result = infer_result.pipe_ocr_mode(image_writer)

else:
    infer_result = ds.apply(doc_analyze, ocr=False)

    ## pipeline
    pipe_result = infer_result.pipe_txt_mode(image_writer)

### draw model result on each page
infer_result.draw_model(os.path.join(local_md_dir, f"{name_without_suff}_model.pdf"))

### get model inference result
model_inference_result = infer_result.get_infer_res()

### draw layout result on each page
pipe_result.draw_layout(os.path.join(local_md_dir, f"{name_without_suff}_layout.pdf"))

### draw spans result on each page
pipe_result.draw_span(os.path.join(local_md_dir, f"{name_without_suff}_spans.pdf"))

### get markdown content
md_content = pipe_result.get_markdown(image_dir)

### dump markdown
pipe_result.dump_md(md_writer, f"{name_without_suff}.md", image_dir)

### get content list content
content_list_content = pipe_result.get_content_list(image_dir)

### dump content list
pipe_result.dump_content_list(md_writer, f"{name_without_suff}_content_list.json", image_dir)

### get middle json
middle_json_content = pipe_result.get_middle_json()

### dump middle json
pipe_result.dump_middle_json(md_writer, f'{name_without_suff}_middle.json')
```

##### S3 文件示例
```python
import os

from magic_pdf.data.data_reader_writer import S3DataReader, S3DataWriter
from magic_pdf.data.dataset import PymuDocDataset
from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
from magic_pdf.config.enums import SupportedPdfParseMethod

bucket_name = "{Your S3 Bucket Name}"  # replace with real bucket name
ak = "{Your S3 access key}"  # replace with real s3 access key
sk = "{Your S3 secret key}"  # replace with real s3 secret key
endpoint_url = "{Your S3 endpoint_url}"  # replace with real s3 endpoint_url

reader = S3DataReader('unittest/tmp/', bucket_name, ak, sk, endpoint_url)  # replace `unittest/tmp` with the real s3 prefix
writer = S3DataWriter('unittest/tmp', bucket_name, ak, sk, endpoint_url)
image_writer = S3DataWriter('unittest/tmp/images', bucket_name, ak, sk, endpoint_url)
md_writer = S3DataWriter('unittest/tmp', bucket_name, ak, sk, endpoint_url)

local_image_dir, local_md_dir = "output/images", "output"
image_dir = str(os.path.basename(local_image_dir))

# args
pdf_file_name = (
    f"s3://{bucket_name}/unittest/tmp/bug5-11.pdf"  # replace with the real s3 path
)

# prepare env
local_dir = "output"
name_without_suff = os.path.basename(pdf_file_name).split(".")[0]

# read bytes
pdf_bytes = reader.read(pdf_file_name)  # read the pdf content

# proc
## Create Dataset Instance
ds = PymuDocDataset(pdf_bytes)

## inference
if ds.classify() == SupportedPdfParseMethod.OCR:
    infer_result = ds.apply(doc_analyze, ocr=True)

    ## pipeline
    pipe_result = infer_result.pipe_ocr_mode(image_writer)

else:
    infer_result = ds.apply(doc_analyze, ocr=False)

    ## pipeline
    pipe_result = infer_result.pipe_txt_mode(image_writer)

### draw model result on each page
infer_result.draw_model(os.path.join(local_md_dir, f"{name_without_suff}_model.pdf"))

### get model inference result
model_inference_result = infer_result.get_infer_res()

### draw layout result on each page
pipe_result.draw_layout(os.path.join(local_md_dir, f"{name_without_suff}_layout.pdf"))

### draw spans result on each page
pipe_result.draw_span(os.path.join(local_md_dir, f"{name_without_suff}_spans.pdf"))

### dump markdown
pipe_result.dump_md(md_writer, f"{name_without_suff}.md", image_dir)

### dump content list
pipe_result.dump_content_list(md_writer, f"{name_without_suff}_content_list.json", image_dir)

### get markdown content
md_content = pipe_result.get_markdown(image_dir)

### get content list content
content_list_content = pipe_result.get_content_list(image_dir)

### get middle json
middle_json_content = pipe_result.get_middle_json()

### dump middle json
pipe_result.dump_middle_json(md_writer, f'{name_without_suff}_middle.json')
```

##### MS-Office
```python
import os

from magic_pdf.data.data_reader_writer import FileBasedDataWriter, FileBasedDataReader
from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
from magic_pdf.data.read_api import read_local_office

# prepare env
local_image_dir, local_md_dir = "output/images", "output"
image_dir = str(os.path.basename(local_image_dir))

os.makedirs(local_image_dir, exist_ok=True)

image_writer, md_writer = FileBasedDataWriter(local_image_dir), FileBasedDataWriter(
    local_md_dir
)

# proc
## Create Dataset Instance
input_file = "some_ppt.ppt"     # replace with real ms-office file

input_file_name = input_file.split(".")[0]
ds = read_local_office(input_file)[0]

ds.apply(doc_analyze, ocr=True).pipe_txt_mode(image_writer).dump_md(
    md_writer, f"{input_file_name}.md", image_dir
)
```

> 此代码片段可用于作 **ppt**、**pptx**、**doc**、**docx** 文件
>

##### 单个图像
```python
import os

from magic_pdf.data.data_reader_writer import FileBasedDataWriter
from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
from magic_pdf.data.read_api import read_local_images

# prepare env
local_image_dir, local_md_dir = "output/images", "output"
image_dir = str(os.path.basename(local_image_dir))

os.makedirs(local_image_dir, exist_ok=True)

image_writer, md_writer = FileBasedDataWriter(local_image_dir), FileBasedDataWriter(
    local_md_dir
)

# proc
## Create Dataset Instance
input_file = "some_image.jpg"       # replace with real image file

input_file_name = input_file.split(".")[0]
ds = read_local_images(input_file)[0]

ds.apply(doc_analyze, ocr=True).pipe_ocr_mode(image_writer).dump_md(
    md_writer, f"{input_file_name}.md", image_dir
)
```

##### 包含图像的目录(多个图像文件)
```python
import os

from magic_pdf.data.data_reader_writer import FileBasedDataWriter
from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
from magic_pdf.data.read_api import read_local_images

# prepare env
local_image_dir, local_md_dir = "output/images", "output"
image_dir = str(os.path.basename(local_image_dir))

os.makedirs(local_image_dir, exist_ok=True)

image_writer, md_writer = FileBasedDataWriter(local_image_dir), FileBasedDataWriter(
    local_md_dir
)

# proc
## Create Dataset Instance
input_directory = "some_image_dir/"       # replace with real directory that contains images


dss = read_local_images(input_directory, suffixes=['.png', '.jpg'])

count = 0
for ds in dss:
    ds.apply(doc_analyze, ocr=True).pipe_ocr_mode(image_writer).dump_md(
        md_writer, f"{count}.md", image_dir
    )
    count += 1
```

