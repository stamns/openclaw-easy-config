const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");
const modelListEl = document.getElementById("modelList");
const addModelBtn = document.getElementById("addModelBtn");

// Provider to Base URL mapping - ONLY MAINTAIN THIS!
const providerBaseUrlMap = {
  "DeepSeek": "https://api.deepseek.com",
  "SiliconFlow": "https://api.siliconflow.cn",
  "ollama": "http://localhost:11434",
  "milocode": "https://api.joyzhi.com",
  "milocode-v1": "https://api.joyzhi.com/v1",
  "duckcodingJP": "https://jp.duckcoding.com",
  "duckcodingJP-v1": "https://jp.duckcoding.com/v1",
  "FastRouter": "https://api-key.info",
  "i7Relay": "https://i7dc.com/api"
};

const modelOptions = [
  "deepseek-chat",
  "deepseek-reasoner",
  "claude-sonnet-4-5-20250929",
  "claude-sonnet-4.5-agent",
  "gpt-5.2",
  "gpt-5-mini",
  "gemini-3-pro-preview"
];

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
customProviderOption.textContent = t("custom");
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
customBaseurlOption.textContent = t("custom");
baseurlSelect.appendChild(customBaseurlOption);

// Handle custom input visibility
const fields = ["baseurl", "provider", "apimode"];
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

function updateModelRemoveState() {
  const removeButtons = modelListEl.querySelectorAll(".remove-model");
  const disableRemove = removeButtons.length <= 1;
  removeButtons.forEach(btn => {
    btn.disabled = disableRemove;
  });
}

function createModelRow(initialValue) {
  const row = document.createElement("div");
  row.className = "model-row";

  const fieldWrapper = document.createElement("div");
  fieldWrapper.className = "field-wrapper";

  const select = document.createElement("select");
  select.className = "model-select";

  modelOptions.forEach(modelId => {
    const option = document.createElement("option");
    option.value = modelId;
    option.textContent = modelId;
    select.appendChild(option);
  });

  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = t("custom");
  select.appendChild(customOption);

  const customInput = document.createElement("input");
  customInput.type = "text";
  customInput.className = "custom-input model-custom";
  customInput.setAttribute("data-i18n-placeholder", "placeholder_model_id");
  customInput.placeholder = t("placeholder_model_id");

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "ghost-btn remove-model";
  removeBtn.setAttribute("data-i18n", "btn_remove_model");
  removeBtn.textContent = t("btn_remove_model");

  select.addEventListener("change", () => {
    if (select.value === "custom") {
      customInput.classList.add("show");
    } else {
      customInput.classList.remove("show");
    }
  });

  removeBtn.addEventListener("click", () => {
    row.remove();
    updateModelRemoveState();
  });

  fieldWrapper.appendChild(select);
  fieldWrapper.appendChild(customInput);
  row.appendChild(fieldWrapper);
  row.appendChild(removeBtn);

  if (initialValue) {
    if (modelOptions.includes(initialValue)) {
      select.value = initialValue;
    } else {
      select.value = "custom";
      customInput.classList.add("show");
      customInput.value = initialValue;
    }
  }

  modelListEl.appendChild(row);
  updateModelRemoveState();
}

function getModelIds() {
  const rows = modelListEl.querySelectorAll(".model-row");
  const modelIds = [];

  rows.forEach(row => {
    const select = row.querySelector(".model-select");
    const customInput = row.querySelector(".model-custom");
    const value = select.value === "custom" ? customInput.value.trim() : select.value;
    if (value) {
      modelIds.push(value);
    }
  });

  return modelIds;
}

addModelBtn.addEventListener("click", () => {
  createModelRow();
});

createModelRow();

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
    copyBtn.textContent = t("copied");
    setTimeout(() => (copyBtn.textContent = t("btn_copy")), 1200);
  } catch {
    copyBtn.textContent = t("status_failed");
    setTimeout(() => (copyBtn.textContent = t("btn_copy")), 1200);
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
    model_id: getModelIds()
  };

  // Validation
  if (!payload.config) {
    outputEl.textContent = t("err_no_config");
    setStatus(t("status_failed"));
    return;
  }
  if (!payload.baseurl) {
    outputEl.textContent = t("err_no_baseurl");
    setStatus(t("status_failed"));
    return;
  }
  if (!payload.apikey) {
    outputEl.textContent = t("err_no_apikey");
    setStatus(t("status_failed"));
    return;
  }
  if (!payload.model_id.length) {
    outputEl.textContent = t("err_no_model");
    setStatus(t("status_failed"));
    return;
  }

  setStatus(t("status_processing"));
  sendBtn.disabled = true;
  outputEl.textContent = "";

  try {
    const result = processConfig(payload);
    outputEl.textContent = JSON.stringify(result, null, 2);
    setStatus(t("status_done"));
  } catch (err) {
    outputEl.textContent = String(err.message || err);
    setStatus(t("status_failed"));
  } finally {
    sendBtn.disabled = false;
  }
});

function processConfig(payload) {
  try {
    const modelIds = payload.model_id;
    const primaryModelId = modelIds[0];

    // Step 1: Build agents object
    const agentModels = {};
    modelIds.forEach(id => {
      agentModels[`${payload.provider}/${id}`] = { alias: id };
    });

    const agents = {
      "defaults": {
        "model": {
          "primary": `${payload.provider}/${primaryModelId}`
        },
        "models": agentModels
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
          "models": modelIds.map(id => ({
            "id": id,
            "name": id
          }))
        }
      }
    };

    // Step 3: Parse user's config
    let userConfig;
    try {
      userConfig = JSON.parse(payload.config);
    } catch (e) {
      throw new Error(t("err_json_parse") + ": " + e.message);
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
