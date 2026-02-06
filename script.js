const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");

// Provider to Base URL mapping - ONLY MAINTAIN THIS!
const providerBaseUrlMap = {
  "milocode": "https://api.joyzhi.com",
  "ollama": "http://localhost:11434",
  "duckcodingJP": "https://jp.duckcoding.com",
  "FastRouter": "https://api-key.info",
  "i7Relay": "https://i7dc.com/api"
};

// Dynamically populate provider select
const providerSelect = document.getElementById("provider");
Object.keys(providerBaseUrlMap).forEach(provider => {
  const option = document.createElement("option");
  option.value = provider;
  option.textContent = provider;
  providerSelect.appendChild(option);
});
const customProviderOption = document.createElement("option");
customProviderOption.value = "custom";
customProviderOption.textContent = "自定义";
providerSelect.appendChild(customProviderOption);

// Dynamically populate baseurl select
const baseurlSelect = document.getElementById("baseurl");
const uniqueUrls = [...new Set(Object.values(providerBaseUrlMap))];
uniqueUrls.forEach(url => {
  const option = document.createElement("option");
  option.value = url;
  option.textContent = url;
  baseurlSelect.appendChild(option);
});
const customBaseurlOption = document.createElement("option");
customBaseurlOption.value = "custom";
customBaseurlOption.textContent = "自定义";
baseurlSelect.appendChild(customBaseurlOption);

// Handle custom input visibility
const fields = ["baseurl", "provider", "apimode", "model_id"];
fields.forEach(field => {
  const select = document.getElementById(field);
  const customInput = document.getElementById(`${field}_custom`);
  
  select.addEventListener("change", () => {
    if (select.value === "custom") {
      customInput.classList.add("show");
    } else {
      customInput.classList.remove("show");
    }
  });
});

// Bind provider to baseurl
const baseurlCustom = document.getElementById("baseurl_custom");

providerSelect.addEventListener("change", () => {
  const provider = providerSelect.value;
  
  if (provider === "custom") {
    // Don't change baseurl when provider is custom
    return;
  }
  
  if (providerBaseUrlMap[provider]) {
    baseurlSelect.value = providerBaseUrlMap[provider];
    baseurlCustom.classList.remove("show");
  }
});

function setStatus(text) { statusEl.textContent = text; }

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(outputEl.textContent || "");
    copyBtn.textContent = "已复制";
    setTimeout(() => (copyBtn.textContent = "复制"), 1200);
  } catch {
    copyBtn.textContent = "失败";
    setTimeout(() => (copyBtn.textContent = "复制"), 1200);
  }
});

sendBtn.addEventListener("click", async () => {
  const getValue = (field) => {
    const select = document.getElementById(field);
    if (select.value === "custom") {
      return document.getElementById(`${field}_custom`).value.trim();
    }
    return select.value;
  };

  const payload = {
    config: document.getElementById("config").value.trim(),
    baseurl: getValue("baseurl"),
    apikey: document.getElementById("apikey").value.trim(),
    apimode: getValue("apimode"),
    provider: getValue("provider"),
    model_id: getValue("model_id")
  };

  // Validation
  if (!payload.config) {
    outputEl.textContent = "错误: 请输入 Config JSON";
    setStatus("失败");
    return;
  }
  if (!payload.baseurl) {
    outputEl.textContent = "错误: 请选择或输入 Base URL";
    setStatus("失败");
    return;
  }
  if (!payload.apikey) {
    outputEl.textContent = "错误: 请输入 API Key";
    setStatus("失败");
    return;
  }

  setStatus("处理中...");
  sendBtn.disabled = true;
  outputEl.textContent = "";

  try {
    const result = processConfig(payload);
    outputEl.textContent = JSON.stringify(result, null, 2);
    setStatus("完成");
  } catch (err) {
    outputEl.textContent = "错误: " + String(err.message || err);
    setStatus("失败");
  } finally {
    sendBtn.disabled = false;
  }
});

function processConfig(payload) {
  try {
    // Step 1: Build agents object
    const agents = {
      "defaults": {
        "model": {
          "primary": `${payload.provider}/${payload.model_id}`
        }
      }
    };

    // Step 2: Build models object
    const models = {
      "mode": "merge",
      "providers": {
        [payload.provider]: {
          "baseUrl": payload.baseurl,
          "apiKey": payload.apikey,
          "api": payload.apimode,
          "models": [
            {
              "id": payload.model_id,
              "name": payload.model_id
            }
          ]
        }
      }
    };

    // Step 3: Parse user's config
    let userConfig;
    try {
      userConfig = JSON.parse(payload.config);
    } catch (e) {
      throw new Error("配置 JSON 格式错误: " + e.message);
    }

    // Step 4: Merge everything (replace logic)
    const result = {
      ...userConfig,
      models: models,
      agents: agents
    };

    // Remove auth field if exists
    delete result.auth;

    return result;
  } catch (error) {
    throw error;
  }
}
