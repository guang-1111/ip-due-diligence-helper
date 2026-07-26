# 文档目录

这里存放知识产权网络核查助手的产品、模块和开发文档。

如果你只是想下载后直接使用，请先看根目录 [README](../README.md) 的“3 分钟跑通商标目录页 Demo”。这里的文档主要用于理解产品设计和后续开发。

## 00-overview：项目总览

- [当前进度](00-overview/project-status.md)：说明项目已经完成什么、停在哪里、下一步做什么。

## 01-product：产品方案

- [MVP 产品规格书 v0.1](01-product/product-spec-v0.1.md)：说明产品定位、用户场景、MVP 范围、总体流程、目录命名、PDF、日志和验收标准。

## 02-modules：模块规格

- [商标网核模块执行规格 v0.1](02-modules/trademark/trademark-module-spec-v0.1.md)：说明商标模块如何连接浏览器、识别页面、按权利人查询、保存目录页和详情页。

后续模块建议按相同结构新增，例如：

```text
02-modules/
  patent/
  copyright/
  icp/
  miit-device/
```

## 03-development：开发计划

- [开发路线图](03-development/roadmap.md)：说明仓库基线、本地 demo、商标模块、PDF 质量控制和五类网核框架的阶段计划。

## 文档维护原则

- 面向使用者的说明放在根目录 `README.md`。
- 产品设计放在 `01-product/`。
- 单个网核模块的执行细节放在 `02-modules/对应模块/`。
- 开发计划、阶段拆分、技术债放在 `03-development/`。
- 真实项目材料、账号信息、浏览器 profile、生成 PDF 不应放进仓库。