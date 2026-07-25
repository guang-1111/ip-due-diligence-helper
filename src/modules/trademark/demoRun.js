const fs = require("node:fs");
const path = require("node:path");
const { CdpClient, connectToMainPage, readJson, sleep } = require("../../core/browser/cdp");
const { appendJsonLine } = require("../../core/logger");
const { buildOutputPath, sanitizePathSegment } = require("../../core/naming");
const { loadSubjectsFromCsv } = require("../../core/subjects");
const { DEFAULT_DEBUG_PORT, resolveConfigPath } = require("./openBrowser");

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

function loadProject(projectArg) {
  const configPath = resolveConfigPath(projectArg);
  if (!fileExists(configPath)) {
    throw new Error(`未找到项目配置：${configPath}\n请先运行 npm run demo:init，或用 npm start 创建项目。`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const projectRoot = path.resolve(configPath, "..", "..");
  const subjectsPath = path.join(projectRoot, "config", "subjects.csv");
  const subjects = fileExists(subjectsPath) ? loadSubjectsFromCsv(subjectsPath) : [];
  return { config, configPath, projectRoot, subjectsPath, subjects };
}

function chooseSubject(subjectArg, subjects) {
  if (subjectArg) {
    return { id: "001", name: subjectArg };
  }
  if (subjects.length === 0) {
    throw new Error("未找到权利人清单。请传入 --subject \"公司名称\"，或先创建项目主体清单。");
  }
  return subjects[0];
}


function normalizeText(value, maxLength = 600) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function htmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nowStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

async function getSnapshot(client) {
  return client.evaluate(`(() => {
    const visible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
      .filter(visible)
      .map((el) => ({
        tag: el.tagName,
        type: el.getAttribute('type') || '',
        name: el.getAttribute('name') || '',
        id: el.id || '',
        placeholder: el.getAttribute('placeholder') || '',
        value: el.value || '',
        nearbyText: (el.closest('label, .el-form-item, .form-item, .ant-form-item, tr, td, div') || el.parentElement || el).innerText || ''
      }));
    return {
      readyState: document.readyState,
      title: document.title,
      url: location.href,
      text: ((document.body && document.body.innerText) || '').slice(0, 6000),
      inputCount: inputs.length,
      inputs
    };
  })()`);
}

function isAbnormal(snapshot) {
  const text = `${snapshot.title || ""} ${snapshot.url || ""} ${snapshot.text || ""}`;
  return /验证码|滑块|安全验证|请完成验证|统一身份认证|账号|密码|请求被阻断|无法继续访问|403|404|系统异常|服务繁忙/i.test(text);
}

function isComprehensiveQueryReady(snapshot) {
  if (!snapshot) return false;
  const text = `${snapshot.title || ""} ${snapshot.url || ""} ${snapshot.text || ""} ${JSON.stringify(snapshot.inputs || [])}`;
  return snapshot.readyState === "complete" && snapshot.inputCount > 0 && /申请人名称|申请人|商标名称|注册号|国际分类|商标综合查询/.test(text);
}

async function clickByText(client, text, options = {}) {
  const exact = options.exact !== false;
  const maxLength = options.maxLength || 40;
  const expression = `(() => {
    const targetText = ${JSON.stringify(text)};
    const exact = ${JSON.stringify(exact)};
    const maxLength = ${JSON.stringify(maxLength)};
    const visible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const ownText = (el) => Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.nodeValue || '')
      .join('')
      .replace(/\\s+/g, ' ')
      .trim();
    const labelOf = (el) => (ownText(el) || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.textContent || '')
      .replace(/\\s+/g, ' ')
      .trim();
    const elements = Array.from(document.querySelectorAll('a, button, input[type="button"], input[type="submit"], [role="button"], li, div, span, td'));
    const candidates = elements
      .filter((el) => visible(el))
      .map((el) => ({ el, label: labelOf(el) }))
      .filter((item) => item.label && item.label.length <= maxLength && (exact ? item.label === targetText : item.label.includes(targetText)));
    const preferred = candidates.find((item) => ['INPUT', 'BUTTON', 'A'].includes(item.el.tagName)) || candidates[0];
    if (!preferred) return { clicked: false, reason: '未找到可点击文本', text: targetText };
    preferred.el.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = preferred.el.getBoundingClientRect();
    return {
      clicked: true,
      label: preferred.label,
      tag: preferred.el.tagName,
      type: preferred.el.getAttribute('type') || '',
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2)
    };
  })()`;
  const found = await client.evaluate(expression);
  if (!found || !found.clicked) return found;
  await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: found.x, y: found.y, button: "none" });
  await client.send("Input.dispatchMouseEvent", { type: "mousePressed", x: found.x, y: found.y, button: "left", clickCount: 1 });
  await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: found.x, y: found.y, button: "left", clickCount: 1 });
  return found;
}

async function ensureComprehensiveQueryPage(client, timeoutMs = 15000) {
  let snapshot = await getSnapshot(client);
  if (isAbnormal(snapshot)) {
    return { ready: false, state: "manual_required", snapshot, message: "当前页面疑似验证码、登录页或错误页，请人工处理后重试。" };
  }
  if (isComprehensiveQueryReady(snapshot)) {
    return { ready: true, state: "ready", clicked: false, snapshot, message: "当前已在商标综合查询页。" };
  }

  if (/sbj\.cnipa\.gov\.cn/.test(snapshot.url || "") && !/wcjs\.sbj\.cnipa\.gov\.cn/.test(snapshot.url || "")) {
    await client.send("Page.navigate", { url: "https://wcjs.sbj.cnipa.gov.cn/home" });
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      await sleep(1000);
      snapshot = await getSnapshot(client);
      if (/wcjs\.sbj\.cnipa\.gov\.cn/.test(snapshot.url || "") || /商标综合查询|商标近似查询|商标状态查询/.test(snapshot.text || "")) {
        break;
      }
    }
  }

  if (isComprehensiveQueryReady(snapshot)) {
    return { ready: true, state: "ready", clicked: true, snapshot, message: "已进入商标综合查询页。" };
  }

  if (/wcjs\.sbj\.cnipa\.gov\.cn/.test(snapshot.url || "")) {
    await client.send("Page.navigate", { url: "https://wcjs.sbj.cnipa.gov.cn/sgtmi" });
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      await sleep(800);
      snapshot = await getSnapshot(client);
      if (isAbnormal(snapshot)) {
        return { ready: false, state: "manual_required", clicked: true, snapshot, message: "跳转综合查询页后出现验证码、登录页或错误页，请人工处理。" };
      }
      if (isComprehensiveQueryReady(snapshot)) {
        return { ready: true, state: "ready", clicked: true, snapshot, message: "已直接回到商标综合查询页。" };
      }
    }
  }

  const clickResult = await clickByText(client, "商标综合查询", { exact: true, maxLength: 20 });
  if (!clickResult || !clickResult.clicked) {
    return { ready: false, state: "entry_not_found", clicked: false, snapshot, message: "未找到“商标综合查询”入口，请手动点击到该页面后重试。" };
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await sleep(800);
    snapshot = await getSnapshot(client);
    if (isAbnormal(snapshot)) {
      return { ready: false, state: "manual_required", clicked: true, clickResult, snapshot, message: "点击后出现验证码、登录页或错误页，请人工处理。" };
    }
    if (isComprehensiveQueryReady(snapshot)) {
      return { ready: true, state: "ready", clicked: true, clickResult, snapshot, message: "已进入商标综合查询页。" };
    }
  }

  return { ready: false, state: "not_ready", clicked: true, clickResult, snapshot, message: "已点击“商标综合查询”，但仍未检测到查询表单。请手动确认页面。" };
}

async function fillApplicantName(client, queryName) {
  const target = await client.evaluate(`(() => {
    const visible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return !el.disabled && !el.readOnly && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea')).filter(visible);
    const preferred = document.body.innerText.includes('申请人名称（中文）') && inputs.length >= 4 ? inputs[3] : inputs[0];
    if (!preferred) return { found: false, reason: '未找到可输入文本框', inputCount: inputs.length };
    const rect = preferred.getBoundingClientRect();
    return {
      found: true,
      inputCount: inputs.length,
      selectedIndex: inputs.indexOf(preferred),
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
      placeholder: preferred.placeholder || '',
      id: preferred.id || '',
      name: preferred.name || ''
    };
  })()`);

  if (!target || !target.found) {
    return { filled: false, ...(target || {}) };
  }

  await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: target.x, y: target.y, button: "none" });
  await client.send("Input.dispatchMouseEvent", { type: "mousePressed", x: target.x, y: target.y, button: "left", clickCount: 1 });
  await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: target.x, y: target.y, button: "left", clickCount: 1 });
  await sleep(150);
  await client.send("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: 17, key: "Control", code: "ControlLeft", modifiers: 2 });
  await client.send("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: 65, key: "a", code: "KeyA", modifiers: 2 });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 65, key: "a", code: "KeyA", modifiers: 2 });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 17, key: "Control", code: "ControlLeft" });
  await client.send("Input.insertText", { text: queryName });
  await sleep(250);

  const verification = await client.evaluate(`(() => {
    const visible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return !el.disabled && !el.readOnly && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea')).filter(visible);
    const selected = inputs[${JSON.stringify(target.selectedIndex)}];
    return { valueAfterFill: selected ? selected.value : '', inputCount: inputs.length };
  })()`);

  return {
    filled: Boolean(verification && verification.valueAfterFill === queryName),
    ...target,
    ...(verification || {}),
  };
}
async function submitQuery(client) {
  const byText = await clickByText(client, "查询", { exact: true, maxLength: 10 });
  if (byText && byText.clicked) return { submitted: true, method: "button", clickResult: byText };
  await client.send("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: 13, key: "Enter", code: "Enter" });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 13, key: "Enter", code: "Enter" });
  return { submitted: true, method: "enter", clickResult: byText };
}

async function connectToResultPage(debugPort, timeoutMs = 15000) {
  const startedAt = Date.now();
  let latestTargets = [];
  while (Date.now() - startedAt < timeoutMs) {
    latestTargets = await readJson(`http://127.0.0.1:${debugPort}/json/list`);
    const resultTarget = latestTargets.find((target) => {
      const text = `${target.title || ""} ${target.url || ""}`;
      return target.type === "page" && target.webSocketDebuggerUrl && /wcjs\.sbj\.cnipa\.gov\.cn\/list/.test(target.url || "") && !/403|Forbidden|请求被阻断/.test(text);
    });
    if (resultTarget) {
      const resultClient = new CdpClient(resultTarget.webSocketDebuggerUrl);
      await resultClient.connect();
      return { client: resultClient, target: resultTarget, targets: latestTargets };
    }
    await sleep(800);
  }
  return { client: null, target: null, targets: latestTargets };
}

function isCatalogReady(snapshot, queryName, subjectName) {
  if (!snapshot) return false;
  const text = `${snapshot.title || ""} ${snapshot.url || ""} ${snapshot.text || ""}`;
  if (isAbnormal(snapshot)) return false;
  if (/加载中|正在加载|查询中|请稍候/.test(text)) return false;
  if (/暂无数据|无结果|未查询到|没有符合条件|查询结果为空/.test(text)) return true;
  const onResultPage = /\/list(?:\?|$)|\/tmi/.test(snapshot.url || "") || /商标检索结果/.test(snapshot.title || "");
  const hasResultStructure = /序号\s+申请\/注册号|申请\/注册号\s+国际分类|商标\s+申请人名称/.test(text);
  const hasQueryName = (queryName && text.includes(queryName)) || (subjectName && text.includes(subjectName));
  return Boolean(onResultPage && hasResultStructure && hasQueryName);
}

async function waitForCatalog(client, queryName, subjectName, timeoutMs = 20000) {
  const startedAt = Date.now();
  let previousLength = -1;
  let latest = null;
  while (Date.now() - startedAt < timeoutMs) {
    await sleep(1000);
    latest = await getSnapshot(client);
    const length = String(latest.text || "").length;
    const stable = previousLength >= 0 && Math.abs(length - previousLength) < Math.max(80, previousLength * 0.2);
    if (isCatalogReady(latest, queryName, subjectName) && (stable || Date.now() - startedAt > 5000)) {
      return { ready: true, snapshot: latest, message: "目录页已通过轻量就绪检查。" };
    }
    previousLength = length;
  }
  return { ready: false, snapshot: latest, message: "等待目录页超时，未保存 PDF。请确认页面是否卡住、需要验证码或网络过慢。" };
}

function buildCatalogPath(config, projectRoot, subject) {
  const configForPath = {
    ...config,
    outputRoot: config.outputRoot || projectRoot,
    directoryTemplate: config.directoryTemplate || "{projectName}/{rightType}/{subjectName}",
    fileNameTemplates: {
      catalog: "{subjectName}_{rightType}_catalog.pdf",
      detail: "{rightNo}_detail.pdf",
      error: "{subjectName}_{rightType}_error_{timestamp}.pdf",
      ...(config.fileNameTemplates || {}),
    },
  };
  const outputPath = buildOutputPath(configForPath, subject, "catalog", {
    rightType: "trademark",
    timestamp: nowStamp(),
  });
  return outputPath;
}

async function savePdf(client, outputPath, checkDate) {
  ensureDir(path.dirname(outputPath));
  const snapshot = await getSnapshot(client);
  const footer = `<div style="font-size:8px;color:#666;width:100%;padding:0 24px;display:flex;justify-content:space-between;"><span>核查日期：${htmlEscape(checkDate || new Date().toISOString().slice(0, 10))}</span><span>网址：${htmlEscape(snapshot.url || "")}</span><span>第 <span class="pageNumber"></span> 页 / 共 <span class="totalPages"></span> 页</span></div>`;
  const result = await client.send("Page.printToPDF", {
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: footer,
    marginTop: 0.35,
    marginBottom: 0.55,
    marginLeft: 0.35,
    marginRight: 0.35,
    preferCSSPageSize: false,
  });
  fs.writeFileSync(outputPath, Buffer.from(result.data, "base64"));
  return { outputPath, bytes: fs.statSync(outputPath).size, snapshot };
}

async function runTrademarkDemo({ projectArg, subjectArg, queryArg, debugPort = DEFAULT_DEBUG_PORT } = {}) {
  const project = loadProject(projectArg);
  const subject = chooseSubject(subjectArg, project.subjects);
  const queryName = queryArg || subject.name;
  const logsDir = path.join(project.projectRoot, "logs");
  ensureDir(logsDir);
  const runLogPath = path.join(logsDir, "run.jsonl");
  const captureRecordsPath = path.join(logsDir, "capture_records.csv");

  let connection;
  try {
    connection = await connectToMainPage(debugPort);
  } catch (error) {
    appendJsonLine(runLogPath, { event: "trademark_demo_paused", at: new Date().toISOString(), subject: subject.name, queryName, step: "connect_browser", message: error.message });
    return {
      ok: false,
      step: "connect_browser",
      subject,
      message: `无法连接浏览器：${error.message}`,
    };
  }
  const { client } = connection;
  let resultClient = null;
  try {
    const preparation = await ensureComprehensiveQueryPage(client);
    if (!preparation.ready) {
      appendJsonLine(runLogPath, { event: "trademark_demo_paused", at: new Date().toISOString(), subject: subject.name, queryName, step: "prepare_query_page", state: preparation.state, message: preparation.message });
      return { ok: false, step: "prepare_query_page", subject, queryName, preparation };
    }

    const fillResult = await fillApplicantName(client, queryName);
    if (!fillResult || !fillResult.filled) {
      appendJsonLine(runLogPath, { event: "trademark_demo_paused", at: new Date().toISOString(), subject: subject.name, queryName, step: "fill_subject", fillResult });
      return { ok: false, step: "fill_subject", subject, queryName, preparation, fillResult };
    }

    const submitResult = await submitQuery(client);
    const resultConnection = await connectToResultPage(debugPort);
    resultClient = resultConnection.client;
    const catalogClient = resultClient || client;
    const catalog = await waitForCatalog(catalogClient, queryName, subject.name);
    if (!catalog.ready) {
      appendJsonLine(runLogPath, { event: "trademark_demo_paused", at: new Date().toISOString(), subject: subject.name, queryName, step: "wait_catalog", message: catalog.message, snapshot: catalog.snapshot ? { title: catalog.snapshot.title, url: catalog.snapshot.url, textSample: normalizeText(catalog.snapshot.text) } : null });
      return { ok: false, step: "wait_catalog", subject, queryName, preparation, fillResult, submitResult, catalog };
    }

    const pdfPath = buildCatalogPath(project.config, project.projectRoot, subject);
    const saved = await savePdf(catalogClient, pdfPath, project.config.checkDate);
    const record = {
      record_id: `trademark-catalog-${Date.now()}`,
      subject_index: subject.id,
      subject_name: subject.name,
      module: "trademark",
      website_name: "国家商标局商标查询",
      page_type: "catalog",
      query_time: new Date().toISOString(),
      save_time: new Date().toISOString(),
      page_url: saved.snapshot.url,
      file_path: saved.outputPath,
      status: "success",
      note: `MVP demo saved catalog PDF; queryName=${queryName}`,
    };

    if (!fileExists(captureRecordsPath)) {
      fs.writeFileSync(captureRecordsPath, `${Object.keys(record).join(",")}\n`, "utf8");
    }
    fs.appendFileSync(captureRecordsPath, `${Object.values(record).map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")}\n`, "utf8");
    appendJsonLine(runLogPath, { event: "trademark_demo_catalog_saved", at: new Date().toISOString(), subject: subject.name, queryName, filePath: saved.outputPath, bytes: saved.bytes, url: saved.snapshot.url });

    return {
      ok: true,
      subject,
      queryName,
      preparation,
      fillResult,
      submitResult,
      catalog: { ...catalog, snapshot: { title: catalog.snapshot.title, url: catalog.snapshot.url, textSample: normalizeText(catalog.snapshot.text) } },
      saved: { outputPath: saved.outputPath, bytes: saved.bytes, url: saved.snapshot.url },
      captureRecordsPath,
      runLogPath,
    };
  } finally {
    if (resultClient) resultClient.close();
    client.close();
  }
}

module.exports = {
  runTrademarkDemo,
};