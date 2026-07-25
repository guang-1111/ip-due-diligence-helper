function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJson(url, timeoutMs = 3000) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    throw new Error(`DevTools 返回 HTTP ${response.status}`);
  }
  return response.json();
}

class CdpClient {
  constructor(webSocketUrl, timeoutMs = 10000) {
    this.webSocketUrl = webSocketUrl;
    this.timeoutMs = timeoutMs;
    this.nextId = 1;
    this.pending = new Map();
    this.ws = null;
  }

  async connect() {
    if (typeof WebSocket !== "function") {
      throw new Error("当前 Node.js 不支持原生 WebSocket，无法接管浏览器。请使用较新的 Node.js 版本。");
    }

    if (this.ws) return;

    this.ws = new WebSocket(this.webSocketUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("DevTools WebSocket 连接超时")), this.timeoutMs);
      this.ws.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.ws.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("DevTools WebSocket 连接失败"));
      }, { once: true });
    });

    this.ws.addEventListener("message", async (event) => {
      let raw = event.data;
      if (raw && typeof raw.text === "function") {
        raw = await raw.text();
      }
      if (Buffer.isBuffer(raw)) {
        raw = raw.toString("utf8");
      }
      const message = JSON.parse(String(raw));
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) {
        pending.reject(new Error(message.error.message || "DevTools 命令失败"));
        return;
      }
      pending.resolve(message.result);
    });
  }

  async send(method, params = {}) {
    await this.connect();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`DevTools 命令超时：${method}`));
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, options = {}) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
      ...options,
    });
    return result && result.result ? result.result.value : null;
  }

  close() {
    if (!this.ws) return;
    try {
      this.ws.close();
    } catch (_error) {
      // ignore close failure
    }
    this.ws = null;
  }
}

function chooseMainPage(targets) {
  const pages = targets.filter((target) => target.type === "page" && target.url && !target.url.startsWith("devtools://"));
  return pages.find((target) => /wcjs\.sbj\.cnipa\.gov\.cn|sbj\.cnipa\.gov\.cn/.test(target.url || "")) || pages[0];
}

async function connectToMainPage(debugPort) {
  const targets = await readJson(`http://127.0.0.1:${debugPort}/json/list`);
  const target = chooseMainPage(targets);
  if (!target || !target.webSocketDebuggerUrl) {
    throw new Error("未发现可接管的浏览器页面。请先运行 npm run trademark:open:fresh，并保持浏览器打开。");
  }
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  return { client, target, targets };
}

module.exports = {
  CdpClient,
  chooseMainPage,
  connectToMainPage,
  readJson,
  sleep,
};