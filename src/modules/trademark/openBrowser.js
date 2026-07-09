const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { appendJsonLine } = require("../../core/logger");

const DEFAULT_ENTRY_URL = "https://sbj.cnipa.gov.cn/sbj/index.html";

const BROWSER_CANDIDATES = [
  {
    name: "Google Chrome",
    path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  },
  {
    name: "Google Chrome (x86)",
    path: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  },
  {
    name: "Microsoft Edge",
    path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  },
  {
    name: "Microsoft Edge",
    path: "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (_error) {
    return false;
  }
}

function findBrowserExecutable() {
  const found = BROWSER_CANDIDATES.find((candidate) => fileExists(candidate.path));
  if (!found) {
    throw new Error("未找到 Chrome 或 Edge。请先安装 Chrome/Edge，或后续在配置中指定浏览器路径。");
  }
  return found;
}

function resolveConfigPath(projectArg) {
  if (!projectArg) {
    return path.resolve("demo-output", "Sample IP Due Diligence Project", "config", "project-config.json");
  }

  const resolved = path.resolve(projectArg);
  if (fileExists(resolved) && resolved.toLowerCase().endsWith(".json")) {
    return resolved;
  }

  return path.join(resolved, "config", "project-config.json");
}

function loadProjectConfig(projectArg) {
  const configPath = resolveConfigPath(projectArg);
  if (!fileExists(configPath)) {
    throw new Error(`未找到项目配置：${configPath}\n请先运行 npm run demo:init，或用 npm start 创建项目。`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const projectRoot = path.resolve(configPath, "..", "..");
  return { config, configPath, projectRoot };
}

function getTrademarkEntryUrl(config) {
  return (config.trademark && config.trademark.entryUrl) || DEFAULT_ENTRY_URL;
}

function buildBrowserArgs({ entryUrl, profileDir }) {
  return [
    `--user-data-dir=${profileDir}`,
    "--new-window",
    "--no-first-run",
    "--disable-default-apps",
    "--disable-blink-features=AutomationControlled",
    entryUrl,
  ];
}

function openTrademarkBrowser({ projectArg, dryRun = false }) {
  const { config, configPath, projectRoot } = loadProjectConfig(projectArg);
  const browser = findBrowserExecutable();
  const entryUrl = getTrademarkEntryUrl(config);
  const profileDir = path.join(projectRoot, "browser-profiles", "trademark");
  const logsDir = path.join(projectRoot, "logs");
  const runLogPath = path.join(logsDir, "run.jsonl");

  ensureDir(profileDir);
  ensureDir(logsDir);

  const args = buildBrowserArgs({ entryUrl, profileDir });
  const event = {
    event: dryRun ? "trademark_browser_dry_run" : "trademark_browser_opened",
    at: new Date().toISOString(),
    module: "trademark",
    browser: browser.name,
    browserPath: browser.path,
    entryUrl,
    profileDir,
    configPath,
  };

  appendJsonLine(runLogPath, event);

  if (!dryRun) {
    const child = spawn(browser.path, args, {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  }

  return {
    ...event,
    projectRoot,
    commandPreview: `"${browser.path}" ${args.map((arg) => `"${arg}"`).join(" ")}`,
    runLogPath,
  };
}

module.exports = {
  openTrademarkBrowser,
  resolveConfigPath,
};