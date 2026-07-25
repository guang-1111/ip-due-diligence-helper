# 知识产权网络核查助手

知识产权网络核查助手是一个面向中文用户的本地半自动化工具，用来辅助完成知识产权网络核查中的重复性工作。典型场景是：使用者拿到一批权利人名称，例如集团公司、子公司、孙公司、分公司等，需要分别在商标、专利、版权、ICP备案、工信部相关网站中查询，并保存目录页和详情页作为底稿。

第一版 demo 会优先实现商标网核模块；专利、版权、ICP备案、工信部查询会先保留统一框架，后续逐步补齐。

> English summary: A local semi-automated helper for IP due diligence evidence collection. The first runnable module focuses on trademark checks with visible browser control and user-managed login/captcha handling.

## 这个项目解决什么问题

知识产权网核的手工流程很机械，也很容易漏项：

- 把权利人名称复制到公开查询网站；
- 等待结果页加载；
- 保存查询结果目录页；
- 逐项打开详情页并保存；
- 按不同项目要求分类、命名和归档；
- 记录哪些主体查过、哪些页面保存过、哪些情况需要人工处理。

这个项目的目标不是绕过网站限制，也不是替代人工判断，而是把这些重复步骤标准化，让使用者把精力放在核对和判断上。

## 当前状态

本仓库目前处于早期 demo 阶段，已经包含：

- 知识产权网核整体产品规格；
- 商标模块执行规格；
- 示例权利人清单；
- 示例项目配置；
- 一个最小可运行的本地项目初始化 demo；
- 商标模块可见浏览器入口打开能力；
- 商标模块页面状态检测能力；
- 单主体商标网核 demo 命令：登录后可输入一个权利人并保存目录页 PDF；
- Git 忽略规则，避免误提交底稿、浏览器状态、日志和本地输出。

目前已经可以打开商标局官网入口、检测页面状态，并提供一个单主体商标网核 demo。该 demo 仍需要用户自行登录商标查询系统；登录后可尝试完成“权利人输入 -> 查询 -> 目录页 PDF 保存”的最小闭环。批量查询、详情页批量保存和核对报告仍在开发中。

## MVP 目标

第一版 MVP 计划支持：

- 新建或选择本地项目目录；
- 从 CSV/Excel 兼容文件或直接粘贴导入权利人名称；
- 对权利人名称做轻量格式提醒；
- 让用户自定义目录结构和文件命名规则；
- 优先执行商标模块；
- 使用可见浏览器，由用户自行处理登录、验证码和异常提示；
- 保存目录页和详情页 PDF；
- 通过程序生成带日期、URL、页码等信息的 PDF；
- 在保存前做轻量页面就绪检查，减少空白页、半加载页；
- 可选启用 PDF 质量核验；
- 输出 CSV/JSONL 日志，方便复核。

## 不做什么

本项目不会尝试：

- 绕过验证码或反爬机制；
- 自动盗取、保存或提交登录状态；
- 高频批量抓取；
- 替代律师、实习生或项目组的事实判断；
- 默认把底稿上传到云端；
- 自动修改法律报告。

## 仓库结构

```text
.
|-- docs/
|   |-- README.md
|   |-- 00-overview/
|   |-- 01-product/
|   |-- 02-modules/
|   `-- 03-development/
|-- examples/
|   |-- project-config.example.json
|   `-- subjects-template.csv
|-- src/
|   |-- cli.js
|   |-- README.md
|   |-- core/
|   `-- modules/
|-- README.md
|-- LICENSE
`-- .gitignore
```

## 快速开始

环境要求：

- Node.js 22 或更高版本。

运行非交互示例：

```bash
npm run demo:init
```

该命令会在本地生成 `demo-output/` 示例工作区，包括项目配置、示例主体清单、底稿目录和 JSONL 日志。`demo-output/` 已被 `.gitignore` 忽略，不会被提交到 Git。

运行交互式项目初始化 demo：

```bash
npm start
```

当前交互式 demo 可以从粘贴文本或 CSV 文件导入权利人名称，并生成本地项目工作区。


打开商标查询入口：

```bash
npm run trademark:open
```

如果之前打开过旧的商标模块窗口，建议用临时 profile 验证：

```bash
npm run trademark:open:fresh
```

默认会读取 `demo-output/Sample IP Due Diligence Project/config/project-config.json`，并用独立浏览器 profile 打开商标局官网。`npm run trademark:open:fresh` 会每次创建临时 profile，适合排查旧浏览器窗口没有接收新 URL 的问题。使用者需要按真实人工流程进入商标查询系统，并自行处理登录、验证码或网站提示。

只验证启动参数、不实际打开浏览器：

```bash
node src/cli.js --trademark-open --dry-run
```

检测当前浏览器页面是否可以接管：

```bash
npm run trademark:status
```

如果状态是 `official_homepage`，说明仍在商标局官网首页；如果状态是 `manual_required`，通常说明需要登录、验证码或人工确认。

运行单主体商标网核 demo：

```bash
npm run trademark:demo -- --subject "腾讯科技（深圳）有限公司"
```

运行前请保持工具打开的浏览器窗口处于可用状态，并按网站要求自行登录。demo 会尝试进入商标综合查询页、填写权利人名称、提交查询、等待目录页就绪，并保存目录页 PDF。遇到登录、验证码或异常页时会暂停并提示人工处理。

运行语法检查：

```bash
npm run check
```

## 文档

- [文档目录](docs/README.md)
- [当前进度](docs/00-overview/project-status.md)
- [产品规格 v0.1](docs/01-product/product-spec-v0.1.md)
- [商标模块执行规格 v0.1](docs/02-modules/trademark/trademark-module-spec-v0.1.md)
- [开发路线图](docs/03-development/roadmap.md)

## 示例输入

- [权利人清单模板](examples/subjects-template.csv)
- [项目配置示例](examples/project-config.example.json)

## 使用边界

这个工具用于辅助人工法律尽调和网络核查，不用于绕过网站限制。

使用者应当：

- 在需要时自行登录；
- 自行处理验证码；
- 在运行前确认权利人名称；
- 复核生成的 PDF 和日志；
- 遵守网站规则、项目要求和适用法律法规。

## 开发原则

第一阶段开发重点是“商标模块 + 统一执行框架”。实现时优先考虑：

- 使用可见浏览器，而不是隐藏抓取；
- 遇到异常页面时明确暂停；
- 采用保守速度，避免批量保存无效页面；
- 让用户保留目录结构和文件命名的选择权；
- 默认只在本地保存输出。

## 仓库卫生

请不要提交：

- 真实项目材料；
- 生成的 PDF 底稿；
- 登录 cookie 或浏览器 profile；
- 个人绝对路径；
- API key 或账号凭据；
- 项目相关保密数据。

详见 [.gitignore](.gitignore)。
