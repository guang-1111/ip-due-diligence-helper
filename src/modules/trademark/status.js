const http = require("node:http");
const { DEFAULT_DEBUG_PORT } = require("./openBrowser");

function readJson(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`DevTools 返回 HTTP ${response.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`DevTools JSON 解析失败：${error.message}`));
        }
      });
    });
    request.on("error", reject);
    request.setTimeout(3000, () => {
      request.destroy(new Error("连接 DevTools 超时"));
    });
  });
}

function classifyTarget(target) {
  const url = target.url || "";
  const title = target.title || "";
  const text = `${title} ${url}`;

  if (/请求被阻断|blocked|intercept|denied/i.test(text)) {
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

  if (/wcjs\.sbj\.cnipa\.gov\.cn|sgtmi|商标.*查询|商标网上/.test(text)) {
    return {
      state: "query_or_related_page",
      canTakeOver: true,
      message: "当前页面像是商标查询相关页面，可以进入下一步接管前验证。",
    };
  }

  if (/sbj\.cnipa\.gov\.cn/.test(url)) {
    return {
      state: "official_homepage",
      canTakeOver: false,
      message: "当前还在商标局官网，请手动进入商标查询系统后再检测。",
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
  return pages.find((target) => /wcjs\.sbj\.cnipa\.gov\.cn|sbj\.cnipa\.gov\.cn/.test(target.url || "")) || pages[0];
}

async function inspectTrademarkPage({ debugPort = DEFAULT_DEBUG_PORT } = {}) {
  const targets = await readJson(`http://127.0.0.1:${debugPort}/json/list`);
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

  const classification = classifyTarget(target);
  return {
    debugPort,
    inspected: {
      title: target.title || "",
      url: target.url || "",
    },
    pages: targets
      .filter((item) => item.type === "page")
      .map((item) => ({ title: item.title || "", url: item.url || "" })),
    ...classification,
  };
}

module.exports = {
  inspectTrademarkPage,
};