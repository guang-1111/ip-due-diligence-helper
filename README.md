# 知识产权网络核查助手

一个面向中文知识产权网络核查场景的本地半自动化示范项目。

它的目标很朴素：给一批权利人名称，例如集团公司、子公司、孙公司、分公司等，辅助使用者在公开网站完成查询、页面就绪检查、PDF 保存、命名归档和日志记录，减少重复劳动。

当前版本主要演示：以“腾讯科技（深圳）有限公司”为示例权利人，打开商标查询系统、检测页面状态，并在人工处理登录/验证码后保存商标查询目录页 PDF。专利、版权、ICP备案、工信部等模块已经预留统一框架，后续逐步补齐。

## 适合谁用

- 律师、实习生、法务、投融资项目组成员；
- 需要批量核查公司名下知识产权并保存底稿的人；
- 希望保留人工登录、验证码处理和人工复核，但减少机械复制、查询、截图、命名的人。

## 当前能做什么

这是一个早期示范项目，不是已经完整交付的知识产权网核软件。目前最稳定的是商标模块的目录页保存：

- 创建一个本地示例项目工作区；
- 打开可见 Chrome/Edge 浏览器；
- 检测当前页面是否可以被程序接管；
- 以 `腾讯科技（深圳）有限公司` 为示例，对单个权利人执行商标综合查询；
- 等待目录页加载完成；
- 保存带日期、网址、页码等页眉页脚信息的 PDF；
- 记录 CSV/JSONL 日志，方便复核；
- 遇到登录、验证码、统一身份认证、异常页时暂停，交给人工处理。

详情页保存已经接入实验开关，但受国家知识产权局商标查询系统登录/跳转策略影响，暂时不建议作为现场演示主流程。

## 不做什么

本项目不会尝试：

- 绕过验证码、登录、反爬或网站安全策略；
- 自动保存或上传账号凭据；
- 高频批量抓取公开网站；
- 替代人工法律判断；
- 默认上传任何项目底稿到云端。

使用前请确认你有权访问相关网站，并遵守网站规则、项目要求和适用法律法规。

## 安装前准备

你需要：

- Windows 电脑；
- Chrome 或 Microsoft Edge；
- Node.js 22 或更高版本；
- PowerShell。

检查 Node.js 是否安装：

```powershell
node -v
npm -v
```

如果提示找不到 `node` 或版本低于 22，请先安装 Node.js：

```text
https://nodejs.org/
```

## 下载项目

方式一：在 GitHub 页面下载 ZIP

1. 打开本仓库页面。
2. 点击绿色 `Code` 按钮。
3. 点击 `Download ZIP`。
4. 解压到一个你方便找到的位置，例如桌面。GitHub 下载的 ZIP 解压后，文件夹名可能是 `ip-due-diligence-helper-main`。

方式二：用 Git 下载

```powershell
cd Desktop
git clone https://github.com/guang-1111/ip-due-diligence-helper.git
cd ip-due-diligence-helper
```

如果你打不开 GitHub，可以让项目维护者直接发送 `ip-due-diligence-helper-demo.zip`。

## 3 分钟跑通商标目录页 Demo

这一段是给第一次接触命令行的小白用户看的。当前 demo 只演示一个主体：`腾讯科技（深圳）有限公司`。跑通后，你会得到一个商标查询目录页 PDF 和一条保存记录。

### 第 0 步：打开 PowerShell

PowerShell 是 Windows 自带的命令行工具，可以理解成“输入命令让电脑执行操作”的窗口。

打开方式：

1. 按键盘上的 `Win` 键，或点击左下角开始菜单。
2. 输入 `PowerShell`。
3. 点击 `Windows PowerShell` 打开。
4. 打开后会看到类似这样的提示符：

```powershell
PS C:\Users\你的用户名>
```

后面的命令都复制到这个窗口里运行。每复制一行命令，按一次回车。

### 第 1 步：进入项目目录

先确认项目文件夹放在哪里。如果你是用 GitHub 的 `Download ZIP` 下载并解压，文件夹名通常是 `ip-due-diligence-helper-main`；如果你是用 `git clone` 下载，文件夹名通常是 `ip-due-diligence-helper`。

如果项目在桌面，并且文件夹名是 `ip-due-diligence-helper`，输入：

```powershell
cd C:\Users\你的用户名\Desktop\ip-due-diligence-helper
```

如果你是 `Download ZIP` 解压，文件夹名可能多一个 `-main`，则输入：

```powershell
cd C:\Users\你的用户名\Desktop\ip-due-diligence-helper-main
```

注意把 `你的用户名` 换成你电脑上的用户名。例如本项目作者电脑上的路径是：

```powershell
cd ip-due-diligence-helper
```

进入成功后，PowerShell 左侧提示符应该变成类似：

```powershell
PS C:\Users\你的用户名\Desktop\ip-due-diligence-helper>
```

如果运行 `npm run ...` 时提示找不到 `package.json`，基本就是还没有进入项目目录，请回到这一步重新 `cd`。

### 第 2 步：创建示例项目工作区

在项目目录里输入：

```powershell
npm run demo:init
```

这一步会创建本地演示工作区，生成配置文件、示例主体清单和日志目录。成功后会看到类似：

```text
示例项目工作区已创建：
  根目录：...\demo-output\Sample IP Due Diligence Project
  配置：...\config\project-config.json
  主体清单：...\config\subjects.csv
```

### 第 3 步：打开商标查询浏览器

继续输入：

```powershell
npm run trademark:open
```

程序会尝试打开 Chrome 或 Edge，并进入国家知识产权局商标局官网入口。

如果 PowerShell 显示“商标模块浏览器已打开”，但你没有看到浏览器窗口，可以先看看浏览器是不是被打开到后台或任务栏里。仍然看不到时，运行：

```powershell
npm run trademark:status
```

如果状态是 `devtools_unavailable`，说明程序没有连上浏览器调试端口。可以重新开一个临时浏览器窗口：

```powershell
npm run trademark:open:fresh
```

### 第 4 步：在浏览器里手动进入商标综合查询页

浏览器打开后，请像人工查询一样操作：

1. 在商标局官网点击“商标网上查询”或进入商标查询系统。
2. 如网站要求登录、统一身份认证、验证码或确认提示，请人工处理。
3. 进入“商标综合查询”页面。

这个项目不会绕过登录、验证码或网站安全策略。看到这些页面时，先在浏览器里处理，再回到 PowerShell。

### 第 5 步：确认当前页面是否可以接管

回到 PowerShell，输入：

```powershell
npm run trademark:status
```

如果看到类似下面的信息，说明可以继续：

```text
状态：query_or_related_page
是否可接管：是
当前标题：商标综合检索
```

如果看到 `是否可接管：否`，请按状态处理：

| 看到的状态 | 说明 | 你应该怎么做 |
| --- | --- | --- |
| `official_homepage` | 还停在商标局官网首页 | 回到浏览器，手动点击“商标网上查询”，进入商标查询系统 |
| `manual_required` | 需要登录、验证码、统一身份认证或人工确认 | 回到浏览器，按页面要求处理；处理完再运行 `npm run trademark:status` |
| `devtools_unavailable` | 程序没有连上浏览器 | 重新运行 `npm run trademark:open`；还不行就运行 `npm run trademark:open:fresh` |
| `blocked` | 网站请求被阻断 | 稍后重试、换网络，或运行 `npm run trademark:open:fresh` 后重新进入 |
| `unknown` | 程序无法判断当前页面 | 手动确认浏览器是否在商标综合查询页；不确定就回到官网重新进入 |

只有看到 `是否可接管：是` 后，再运行下一步。

### 第 6 步：运行腾讯科技示范查询并保存目录页 PDF

输入：

```powershell
npm run trademark:demo -- --subject "腾讯科技（深圳）有限公司" --details 0
```

这个命令会尝试：填写申请人名称、提交查询、等待目录页加载、保存目录页 PDF。

成功后会输出 PDF 路径，例如：

```text
PDF：C:\...\demo-output\Sample IP Due Diligence Project\trademark\腾讯科技（深圳）有限公司\腾讯科技（深圳）有限公司_trademark_catalog.pdf
记录：C:\...\demo-output\Sample IP Due Diligence Project\logs\capture_records.csv
```

如果结果是“暂停/失败”，通常不是程序崩溃，而是页面还没进到正确位置、网站要求人工处理，或网络加载过慢。按提示处理后，可以重新运行本步骤。
## 常用命令

初始化示例项目：

```powershell
npm run demo:init
```

打开商标查询浏览器，使用固定 profile：

```powershell
npm run trademark:open
```

打开一个全新的临时 profile，用于排查旧浏览器状态污染：

```powershell
npm run trademark:open:fresh
```

检测当前页面状态：

```powershell
npm run trademark:status
```

运行稳定目录页 demo：

```powershell
npm run trademark:demo -- --subject "权利人完整名称" --details 0
```

尝试保存前 N 条详情页，实验功能：

```powershell
npm run trademark:demo -- --subject "权利人完整名称" --details 1
```

运行语法检查：

```powershell
npm run check
```

## 页面状态怎么看

`npm run trademark:status` 会告诉你当前浏览器能不能被接管。

常见状态：

| 状态 | 含义 | 怎么处理 |
| --- | --- | --- |
| `query_or_related_page` | 已在商标查询相关页面 | 可以继续运行 demo |
| `official_homepage` | 还在商标局官网首页 | 手动进入商标网上查询/商标综合查询 |
| `manual_required` | 需要登录、验证码或人工确认 | 在浏览器里处理后重新运行 status |
| `blocked` | 页面被网站防护阻断 | 换网络、稍后重试，或用 fresh profile |
| `devtools_unavailable` | 程序连不上浏览器调试端口 | 重新运行 `npm run trademark:open` |

## 输出在哪里

默认输出到：

```text
demo-output/Sample IP Due Diligence Project/
```

典型结构：

```text
demo-output/
`-- Sample IP Due Diligence Project/
    |-- config/
    |   |-- project-config.json
    |   `-- subjects.csv
    |-- logs/
    |   |-- run.jsonl
    |   `-- capture_records.csv
    |-- browser-profiles/
    `-- trademark/
        `-- 权利人名称/
            `-- 权利人名称_trademark_catalog.pdf
```

`demo-output/` 已经被 `.gitignore` 忽略，不会提交到 GitHub。

## 如何准备自己的权利人清单

可以参考：

- `examples/subjects-template.csv`
- `examples/subjects-template.zh-CN.csv`

CSV 字段：

| 字段 | 说明 |
| --- | --- |
| `subject_index` | 序号 |
| `subject_name` | 权利人名称，建议使用完整公司登记名称 |
| `subject_level` | 主体层级，例如集团公司、子公司、孙公司、分公司 |
| `note` | 备注 |

当前商标 demo 命令主要使用 `--subject` 指定单个权利人。批量读取清单会在后续版本补齐。

## 配置目录和命名规则

示例配置在：

```text
examples/project-config.example.json
```

核心字段：

```json
{
  "directoryTemplate": "{projectName}/{rightType}/{subjectName}",
  "fileNameTemplates": {
    "catalog": "{subjectName}_{rightType}_catalog.pdf",
    "detail": "{rightNo}_detail.pdf"
  }
}
```

后续版本会提供更友好的交互式设置，让使用者在运行前选择目录结构和文件命名规则。

## 故障排查

PowerShell 提示找不到 `package.json`：

```text
npm error enoent Could not read package.json
```

说明你不在项目目录里。先进入项目目录：

```powershell
cd C:\Users\你的用户名\Desktop\ip-due-diligence-helper
# 如果你是 Download ZIP 解压，目录可能是：
# cd C:\Users\你的用户名\Desktop\ip-due-diligence-helper-main
```

页面提示统一身份认证、验证码或登录：

```text
状态：manual_required
```

这是正常的网站要求。请在浏览器里人工处理，然后重新运行：

```powershell
npm run trademark:status
```

旧窗口状态混乱、打开了很多标签页：

```powershell
npm run trademark:open:fresh
```

如果 fresh profile 触发登录，但固定 profile 曾经登录过，可以改用：

```powershell
npm run trademark:open
```

GitHub 打不开：

- 先确认网络能否访问 `https://github.com/`；
- 可以换网络或稍后重试；
- 项目维护者也可以直接发送 zip 包。

## 项目文档

- [文档目录](docs/README.md)
- [当前进度](docs/00-overview/project-status.md)
- [产品规格 v0.1](docs/01-product/product-spec-v0.1.md)
- [商标模块执行规格 v0.1](docs/02-modules/trademark/trademark-module-spec-v0.1.md)
- [开发路线图](docs/03-development/roadmap.md)

## 仓库结构

```text
.
|-- docs/
|   |-- 00-overview/
|   |-- 01-product/
|   |-- 02-modules/
|   `-- 03-development/
|-- examples/
|   |-- project-config.example.json
|   |-- subjects-template.csv
|   `-- subjects-template.zh-CN.csv
|-- src/
|   |-- cli.js
|   |-- core/
|   `-- modules/
|-- README.md
|-- package.json
|-- LICENSE
`-- .gitignore
```

## License

MIT
