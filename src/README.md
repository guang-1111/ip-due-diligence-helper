# 源码目录

当前可运行入口：

```text
src/
  cli.js
  core/
    logger.js
    naming.js
    project.js
    subjects.js
```

已实现：

- 交互式本地项目初始化；
- `npm run demo:init` 非交互示例初始化；
- CSV 和粘贴文本导入权利人；
- 轻量权利人名称格式提醒；
- 用户可配置目录模板和文件名模板；
- 创建项目配置、主体 CSV、输出目录和 JSONL 日志。

下一步计划结构：

```text
src/
  modules/
    trademark/
  core/
    browser/
    pdf/
    validation/
```

下一个实现目标是商标模块的可见浏览器控制和 PDF 保存。