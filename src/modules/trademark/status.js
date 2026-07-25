const { DEFAULT_DEBUG_PORT } = require("./openBrowser");

async function readJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) {
    throw new Error(`DevTools 返回 HTTP ${response.status}`);
  }
  return response.json();
}

function normalizeText(value, maxLength = 2000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sendCdpCommand(webSocketUrl, method, params = {}) {
  if (typeof WebSocket !== "function") {
    return Promise.reject(new Error("当前 Node.js 不支持原生 WebSocket，已无法读取页面 DOM。"));
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(webSocketUrl);
    const id = 1;
    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch (_error) {
        // ignore close failure
      }
      reject(new Error("DevTools WebSocket 响应超时"));
    }, 5000);

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ id, method, params }));
    });

    ws.addEventListener("message", async (event) => {
      let raw = event.data;
      if (raw && typeof raw.text === "function") {
        raw = await raw.text();
      }
      if (Buffer.isBuffer(raw)) {
        raw = raw.toString("utf8");
      }
      const message = JSON.parse(String(raw));
      if (message.id !== id) return;
      clearTimeout(timer);
      ws.close();
      if (message.error) {
        reject(new Error(message.error.message || "DevTools 命令失败"));
        return;
      }
      resolve(message.result);
    });

    ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("DevTools WebSocket 连接失败"));
    });
  });
}

async function evaluatePageSnapshot(target) {
  if (!target.webSocketDebuggerUrl) {
    return null;
  }

  const expression = `(() => {
    const visibleText = (document.body && document.body.innerText) || '';
    const inputs = Array.from(document.querySelectorAll('input, textarea, select')).slice(0, 20).map((el) => ({
      tag: el.tagName,
      type: el.getAttribute('type') || '',
      name: el.getAttribute('name') || '',
      id: el.id || '',
      placeholder: el.getAttribute('placeholder') || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      value: el.value || ''
    }));
    const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a')).slice(0, 40).map((el) => ({
      tag: el.tagName,
      text: (el.innerText || el.value || el.getAttribute('title') || '').trim().slice(0, 50),
      href: el.href || ''
    }));
    return {
      readyState: document.readyState,
      title: document.title,
      url: location.href,
      text: visibleText.slice(0, 4000),
      inputs,
      buttons
    };
  })()`;

  const result = await sendCdpCommand(target.webSocketDebuggerUrl, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  return result && result.result && result.result.value ? result.result.value : null;
}

function classifyTarget(target, snapshot) {
  const url = (snapshot && snapshot.url) || target.url || "";
  const title = (snapshot && snapshot.title) || target.title || "";
  const bodyText = (snapshot && snapshot.text) || "";
  const controlsText = snapshot
    ? `${JSON.stringify(snapshot.inputs || [])} ${JSON.stringify(snapshot.buttons || [])}`
    : "";
  const text = `${title} ${url} ${bodyText} ${controlsText}`;

  if (/请求被阻断|无法继续访问|blocked|intercept|denied/i.test(text)) {
    return {
      state: "blocked",
      canTakeOver: false,
      message: "当前页面像是被网站防护阻断，请回到官网入口或重新用 fresh profile 打开。",
    };
  }

  if (/captcha|验证码|验证/.test(text)) {
    return {
      state: "manual_required",
      canTakeOver: false,
      message: "当前页面可能需要验证码或人工验证，请先手动处理。",
    };
  }

  if (/sbj\.cnipa\.gov\.cn\/sbj\/index\.html/.test(url) || (/sbj\.cnipa\.gov\.cn/.test(url) && !/wcjs\.sbj\.cnipa\.gov\.cn/.test(url))) {
    return {
      state: "official_homepage",
      canTakeOver: false,
      message: "当前还在商标局官网，请手动进入商标查询系统后再检测。",
    };
  }

  if (/wcjs\.sbj\.cnipa\.gov\.cn|sgtmi|商标.*查询|商标网上|申请人名称|注册号|国际分类|查询/.test(text)) {
    return {
      state: "query_or_related_page",
      canTakeOver: true,
      message: "当前页面像是商标查询相关页面，可以进入下一步接管前验证。",
    };
  }

  return {
    state: "unknown",
    canTakeOver: false,
    message: "无法确认当前页面是否为商标查询页，请手动检查浏览器。",
  };
}

function chooseMainPage(targets) {
  const pages = targets.filter((target) => target.type === "page" && target.url && !target.url.startsWith("devtools://"));
  const isIpPage = (target) => /wcjs\.sbj\.cnipa\.gov\.cn|sbj\.cnipa\.gov\.cn/.test(target.url || "");
  const isBlocked = (target) => /403|Forbidden|请求被阻断/.test(`${target.title || ""} ${target.url || ""}`);
  return pages.find((target) => isIpPage(target) && !isBlocked(target) && /sgtmi/.test(target.url || ""))
    || pages.find((target) => isIpPage(target) && !isBlocked(target) && /home|list/.test(target.url || ""))
    || pages.find((target) => isIpPage(target) && !isBlocked(target))
    || pages.find((target) => isIpPage(target))
    || pages[0];
}

async function inspectTrademarkPage({ debugPort = DEFAULT_DEBUG_PORT } = {}) {
  let targets = [];
  try {
    targets = await readJson(`http://127.0.0.1:${debugPort}/json/list`);
  } catch (error) {
    return {
      debugPort,
      state: "devtools_unavailable",
      canTakeOver: false,
      message: `无法连接 Chrome 调试端口。请先运行 npm run trademark:open:fresh，并保持浏览器打开。原始错误：${error.message}`,
      pages: [],
    };
  }
  const target = chooseMainPage(targets);
  if (!target) {
    return {
      debugPort,
      state: "no_page",
      canTakeOver: false,
      message: "未发现可检测的 Chrome 页面。请先运行 npm run trademark:open:fresh。",
      pages: [],
    };
  }

  let snapshot = null;
  let snapshotError = "";
  try {
    snapshot = await evaluatePageSnapshot(target);
  } catch (error) {
    snapshotError = error.message;
  }

  const classification = classifyTarget(target, snapshot);
  const inspected = {
    title: (snapshot && snapshot.title) || target.title || "",
    url: (snapshot && snapshot.url) || target.url || "",
    readyState: snapshot ? snapshot.readyState : "unknown",
    textSample: snapshot ? normalizeText(snapshot.text, 500) : "",
    inputCount: snapshot && snapshot.inputs ? snapshot.inputs.length : 0,
    buttonCount: snapshot && snapshot.buttons ? snapshot.buttons.length : 0,
  };

  return {
    debugPort,
    inspected,
    snapshotError,
    pages: targets
      .filter((item) => item.type === "page")
      .map((item) => ({ title: item.title || "", url: item.url || "" })),
    ...classification,
  };
}

module.exports = {
  inspectTrademarkPage,
};