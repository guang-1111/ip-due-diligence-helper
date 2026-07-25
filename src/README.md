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
  modules/
    trademark/
      openBrowser.js
      status.js
      demoRun.js
```

已实现：

- 交互式本地项目初始化；
- `npm run demo:init` 非交互示例初始化；
- CSV 和粘贴文本导入权利人；
- 轻量权利人名称格式提醒；
- 用户可配置目录模板和文件名模板；
- 创建项目配置、主体 CSV、输出目录和 JSONL 日志；
- `npm run trademark:open` 打开商标模块可见浏览器入口；
- `npm run trademark:open:fresh` 使用临时 profile 打开入口，用于排查旧窗口未接收新 URL 的问题；
- `npm run trademark:status` 检测当前页面是否可以被商标模块接管。
- `npm run trademark:demo -- --subject "公司名称"` 运行单主体商标网核 demo，登录后尝试查询并保存目录页 PDF。

下一步计划结构：

```text
src/
  modules/
    trademark/
      search.js
      readyGate.js
      capture.js
  core/
    browser/
    pdf/
    validation/
```

下一个实现目标是稳定解析商标目录页结果、进入详情页并保存详情页 PDF。