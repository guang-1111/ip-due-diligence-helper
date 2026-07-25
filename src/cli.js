#!/usr/bin/env node
const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const fs = require("node:fs");
const path = require("node:path");
const { createProjectWorkspace } = require("./core/project");
const { loadSubjectsFromCsv, parseSubjectsFromText, summarizeSubjectWarnings } = require("./core/subjects");
const { previewOutputPaths } = require("./core/naming");
const { openTrademarkBrowser } = require("./modules/trademark/openBrowser");
const { inspectTrademarkPage } = require("./modules/trademark/status");
const { runTrademarkDemo } = require("./modules/trademark/demoRun");

const DEFAULT_DIRECTORY_TEMPLATE = "{projectName}/{rightType}/{subjectName}";
const DEFAULT_FILE_TEMPLATES = {
  catalog: "{subjectName}_{rightType}_catalog.pdf",
  noResult: "{subjectName}_{rightType}_no_result.pdf",
  detail: "{rightNo}_detail.pdf",
  error: "{subjectName}_{rightType}_error_{timestamp}.pdf",
};

function printHelp() {
  console.log(`知识产权网络核查助手

用法：
  npm start
  npm run demo:init
  npm run trademark:open
  npm run trademark:open:fresh
  npm run trademark:status
  npm run trademark:demo -- --subject "示例科技股份有限公司" --details 0
  node src/cli.js --trademark-open --project <项目目录或 project-config.json>
  node src/cli.js --trademark-open --fresh-profile
  node src/cli.js --trademark-open --dry-run

当前 demo 已支持创建本地项目工作区、打开商标模块浏览器、检测页面状态，并提供单主体商标网核演示命令。
`);
}

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function askWithDefault(rl, question, defaultValue) {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue;
}

async function askYesNo(rl, question, defaultValue = true) {
  const hint = defaultValue ? "Y/n" : "y/N";
  const answer = (await rl.question(`${question} [${hint}]: `)).trim().toLowerCase();
  if (!answer) return defaultValue;
  return ["y", "yes"].includes(answer);
}

async function readPastedSubjects(rl) {
  console.log("请逐行粘贴权利人/公司名称。输入空行结束。");
  const lines = [];
  while (true) {
    const line = await rl.question("> ");
    if (!line.trim()) break;
    lines.push(line);
  }
  return parseSubjectsFromText(lines.join("\n"));
}

async function loadSubjects(rl) {
  while (true) {
    const mode = (await askWithDefault(rl, "从 CSV 文件导入，还是直接粘贴？", "paste")).toLowerCase();
    if (["paste", "p", "粘贴"].includes(mode)) {
      return readPastedSubjects(rl);
    }
    if (["csv", "file", "f", "文件"].includes(mode)) {
      const csvPath = await askWithDefault(rl, "CSV 路径", "examples/subjects-template.csv");
      return loadSubjectsFromCsv(path.resolve(csvPath));
    }
    console.log("请输入 paste 或 csv。");
  }
}

function createSampleProject() {
  const configPath = path.resolve("examples/project-config.example.json");
  const subjectsPath = path.resolve("examples/subjects-template.csv");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const subjects = loadSubjectsFromCsv(subjectsPath);
  const sampleConfig = {
    ...config,
    projectName: "Sample IP Due Diligence Project",
    checkDate: new Date().toISOString().slice(0, 10),
    outputRoot: path.resolve("demo-output"),
  };
  const result = createProjectWorkspace({ config: sampleConfig, subjects });
  console.log("示例项目工作区已创建：");
  console.log(`  根目录：${result.projectRoot}`);
  console.log(`  配置：${result.configPath}`);
  console.log(`  主体清单：${result.subjectsPath}`);
  console.log(`  运行日志：${result.runLogPath}`);
}

function runTrademarkOpen() {
  const projectArg = getArgValue("--project");
  const dryRun = process.argv.includes("--dry-run");
  const freshProfile = process.argv.includes("--fresh-profile");
  const result = openTrademarkBrowser({ projectArg, dryRun, freshProfile });

  console.log(dryRun ? "商标模块浏览器 dry-run 完成：" : "商标模块浏览器已打开：");
  console.log(`  项目目录：${result.projectRoot}`);
  console.log(`  浏览器：${result.browser}`);
  console.log(`  入口网址：${result.entryUrl}`);
  console.log(`  浏览器 profile：${result.profileDir}`);
  console.log(`  是否临时 profile：${result.freshProfile ? "是" : "否"}`);
  console.log(`  运行日志：${result.runLogPath}`);
  if (dryRun) {
    console.log(`  启动命令：${result.commandPreview}`);
  } else {
    console.log("\n请在打开的浏览器中按真实人工流程进入商标查询系统，并处理登录、验证码或网站提示。下一步将接入查询和 PDF 保存。");
  }
}

async function runTrademarkStatus() {
  const result = await inspectTrademarkPage({});
  console.log("商标模块页面状态检测：");
  console.log(`  DevTools 端口：${result.debugPort}`);
  console.log(`  状态：${result.state}`);
  console.log(`  是否可接管：${result.canTakeOver ? "是" : "否"}`);
  if (result.inspected) {
    console.log(`  当前标题：${result.inspected.title}`);
    console.log(`  当前网址：${result.inspected.url}`);
    console.log(`  页面加载状态：${result.inspected.readyState}`);
    console.log(`  输入控件数：${result.inspected.inputCount}`);
    console.log(`  按钮/链接数：${result.inspected.buttonCount}`);
    if (result.inspected.textSample) {
      console.log(`  页面文字摘要：${result.inspected.textSample}`);
    }
  }
  if (result.snapshotError) {
    console.log(`  DOM 读取提示：${result.snapshotError}`);
  }
  console.log(`  提示：${result.message}`);
  if (result.pages && result.pages.length > 1) {
    console.log("\n  已发现页面：");
    result.pages.forEach((page, index) => {
      console.log(`  ${index + 1}. ${page.title} - ${page.url}`);
    });
  }
}
async function runTrademarkDemoCommand() {
  const projectArg = getArgValue("--project");
  const subjectArg = getArgValue("--subject");
  const queryArg = getArgValue("--query");
  const detailLimitArg = getArgValue("--details");
  const detailLimit = detailLimitArg === undefined ? 0 : Number(detailLimitArg);
  const result = await runTrademarkDemo({ projectArg, subjectArg, queryArg, detailLimit });

  console.log("商标网核单主体 demo：");
  console.log(`  权利人：${result.subject ? result.subject.name : subjectArg || "未识别"}`);
  if (result.queryName) {
    console.log(`  实际检索词：${result.queryName}`);
  }
  console.log(`  结果：${result.ok ? "成功" : "暂停/失败"}`);
  if (result.preparation) {
    console.log(`  查询页准备：${result.preparation.state} - ${result.preparation.message}`);
  }
  if (result.fillResult) {
    console.log(`  输入权利人：${result.fillResult.filled ? "成功" : "失败"}`);
    if (result.fillResult.valueAfterFill) {
      console.log(`  输入框内容：${result.fillResult.valueAfterFill}`);
    }
    if (result.fillResult.nearbyText) {
      console.log(`  输入框线索：${result.fillResult.nearbyText}`);
    }
  }
  if (result.submitResult) {
    console.log(`  提交方式：${result.submitResult.method}`);
    if (result.submitResult.clickResult) {
      const click = result.submitResult.clickResult;
      console.log(`  点击元素：${click.tag || "未知"}${click.type ? "/" + click.type : ""} ${click.label || ""} (${click.x || "?"}, ${click.y || "?"})`);
    }
  }
  if (result.catalog) {
    console.log(`  目录页状态：${result.catalog.ready ? "就绪" : "未就绪"}`);
    console.log(`  目录页提示：${result.catalog.message}`);
    if (result.catalog.snapshot) {
      console.log(`  当前网址：${result.catalog.snapshot.url}`);
      console.log(`  页面摘要：${result.catalog.snapshot.textSample}`);
    }
  }
  if (result.saved) {
    console.log(`  PDF：${result.saved.outputPath}`);
    console.log(`  文件大小：${result.saved.bytes} bytes`);
  }
  if (result.detailResults) {
    const savedDetails = result.detailResults.filter((item) => item.ok).length;
    console.log(`  详情页：成功 ${savedDetails}/${result.detailResults.length}`);
    result.detailResults.forEach((item, index) => {
      const label = item.detail ? `${item.detail.regNum}/${item.detail.intCls}` : `第${index + 1}条`;
      console.log(`    ${index + 1}. ${label} - ${item.ok ? "成功" : "失败"}${item.step ? "（" + item.step + "）" : ""}`);
      if (item.saved) {
        console.log(`       PDF：${item.saved.outputPath}`);
      }
    });
  }
  if (result.captureRecordsPath) {
    console.log(`  记录：${result.captureRecordsPath}`);
  }
  if (!result.ok) {
    console.log(`  停在步骤：${result.step}`);
    console.log("  请在浏览器中处理页面后重试，或先手动进入商标综合查询页。");
  }
}
async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  if (process.argv.includes("--init-sample")) {
    createSampleProject();
    return;
  }

  if (process.argv.includes("--trademark-open")) {
    runTrademarkOpen();
    return;
  }

  if (process.argv.includes("--trademark-status")) {
    await runTrademarkStatus();
    return;
  }


  if (process.argv.includes("--trademark-demo")) {
    await runTrademarkDemoCommand();
    return;
  }

  const rl = readline.createInterface({ input, output });
  try {
    console.log("知识产权网络核查助手 - 本地项目初始化 demo\n");

    const projectName = await askWithDefault(rl, "项目名称", "Example IP Due Diligence Project");
    const outputRoot = await askWithDefault(rl, "输出根目录", path.resolve("demo-output"));

    const subjects = await loadSubjects(rl);
    if (subjects.length === 0) {
      console.log("没有导入任何权利人，已停止。");
      return;
    }

    console.log(`\n已导入 ${subjects.length} 个权利人：`);
    subjects.forEach((subject, index) => {
      console.log(`  ${index + 1}. ${subject.name}`);
    });

    const warnings = summarizeSubjectWarnings(subjects);
    if (warnings.length > 0) {
      console.log("\n名称格式提醒：");
      warnings.forEach((warning) => console.log(`  - ${warning}`));
      console.log("这些只是轻量提醒。请以项目资料中的法定名称为准。");
    }

    const directoryTemplate = await askWithDefault(rl, "目录模板", DEFAULT_DIRECTORY_TEMPLATE);
    const catalogTemplate = await askWithDefault(rl, "目录页 PDF 文件名模板", DEFAULT_FILE_TEMPLATES.catalog);
    const detailTemplate = await askWithDefault(rl, "详情页 PDF 文件名模板", DEFAULT_FILE_TEMPLATES.detail);

    const config = {
      projectName,
      checkDate: new Date().toISOString().slice(0, 10),
      outputRoot: path.resolve(outputRoot),
      enabledModules: ["trademark"],
      directoryTemplate,
      fileNameTemplates: {
        ...DEFAULT_FILE_TEMPLATES,
        catalog: catalogTemplate,
        detail: detailTemplate,
      },
      trademark: {
        enabled: true,
        entryUrl: "https://sbj.cnipa.gov.cn/sbj/index.html",
        status: "browser_open_ready",
      },
    };

    console.log("\n输出路径预览：");
    previewOutputPaths(config, subjects.slice(0, 3)).forEach((preview) => {
      console.log(`  - ${preview}`);
    });

    const shouldCreate = await askYesNo(rl, "现在创建这个项目工作区吗？", true);
    if (!shouldCreate) {
      console.log("已取消，未写入文件。");
      return;
    }

    const result = createProjectWorkspace({ config, subjects });
    console.log("\n项目工作区已创建：");
    console.log(`  根目录：${result.projectRoot}`);
    console.log(`  配置：${result.configPath}`);
    console.log(`  主体清单：${result.subjectsPath}`);
    console.log(`  运行日志：${result.runLogPath}`);
    console.log("\n下一步可运行：npm run trademark:open");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("\n执行失败：");
  console.error(error.message);
  process.exitCode = 1;
});