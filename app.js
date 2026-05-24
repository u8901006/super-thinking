import { FRAMEWORKS } from './frameworks.js';
import { callGlm } from './src/api.js';
import { buildStageOneMessages, buildStageTwoMessages, parseRecommendation } from './src/prompts.js';

const state = {
  apiKey: '',
  recommendation: null,
  selectedFrameworkId: FRAMEWORKS[0]?.id || '',
  selectionSource: 'manual',
  selectionMode: 'auto',
};

const elements = {
  apiKeyInput: document.getElementById('apiKeyInput'),
  setKeyButton: document.getElementById('setKeyButton'),
  clearKeyButton: document.getElementById('clearKeyButton'),
  keyStatus: document.getElementById('keyStatus'),
  situationInput: document.getElementById('situationInput'),
  autoModeInput: document.getElementById('autoModeInput'),
  manualModeInput: document.getElementById('manualModeInput'),
  analyzeButton: document.getElementById('analyzeButton'),
  generateButton: document.getElementById('generateButton'),
  frameworkList: document.getElementById('frameworkList'),
  selectedFrameworkStatus: document.getElementById('selectedFrameworkStatus'),
  stageOneOutput: document.getElementById('stageOneOutput'),
  adviceOutput: document.getElementById('adviceOutput'),
  errorOutput: document.getElementById('errorOutput'),
};

renderFrameworkList();
renderSelectedFrameworkStatus();

elements.setKeyButton.addEventListener('click', () => {
  const nextKey = elements.apiKeyInput.value.trim();

  if (!nextKey) {
    showError('請先貼上 Zhipu API key。');
    return;
  }

  state.apiKey = nextKey;
  elements.apiKeyInput.value = '';
  elements.keyStatus.textContent = 'API key 已設定在本頁記憶體。重新整理或按清除會移除。';
  clearError();
});

elements.clearKeyButton.addEventListener('click', () => {
  state.apiKey = '';
  elements.apiKeyInput.value = '';
  elements.keyStatus.textContent = '尚未設定 API key。';
});

elements.analyzeButton.addEventListener('click', analyzeFramework);
elements.generateButton.addEventListener('click', generateAdvice);
elements.autoModeInput.addEventListener('change', updateSelectionMode);
elements.manualModeInput.addEventListener('change', updateSelectionMode);

async function analyzeFramework() {
  const situation = getSituation();

  if (state.selectionMode === 'manual') {
    clearError();
    renderManualModeStageOne();
    return;
  }

  if (!validateReady({ situation })) {
    return;
  }

  clearError();
  setBusy(elements.analyzeButton, true, '分析中...');
  setMutedText(elements.stageOneOutput, '正在分析適合的思考框架...');

  try {
    const messages = buildStageOneMessages({ situation, frameworks: FRAMEWORKS });
    const rawText = await callGlm({ apiKey: state.apiKey, messages, temperature: 0.1 });
    const parsed = parseRecommendation(rawText, FRAMEWORKS);

    if (!parsed.ok) {
      state.recommendation = null;
      renderRawStageOneFailure(parsed.rawText, parsed.error);
      return;
    }

    state.recommendation = parsed.recommendation;

    if (!parsed.unknownFramework) {
      state.selectedFrameworkId = parsed.recommendation.recommendedFrameworkId;
      state.selectionSource = 'model';
    }

    renderFrameworkList();
    renderSelectedFrameworkStatus();
    renderRecommendation(parsed);
  } catch (error) {
    showError(formatError(error));
    setMutedText(elements.stageOneOutput, '分析失敗。你仍可以手動選擇框架。');
  } finally {
    setBusy(elements.analyzeButton, false, '第一階段：分析框架');
  }
}

function updateSelectionMode() {
  state.selectionMode = elements.manualModeInput.checked ? 'manual' : 'auto';
}

function renderManualModeStageOne() {
  const selectedFramework = getSelectedFramework();
  clearNode(elements.stageOneOutput);
  elements.stageOneOutput.classList.remove('muted');

  const list = document.createElement('ul');
  list.className = 'result-list';
  appendResultItem(list, '選擇方式', '手動選擇框架');
  appendResultItem(list, '目前框架', selectedFramework ? selectedFramework.name : '尚未選擇框架');
  appendResultItem(list, '下一步', '可直接按「第二階段：產生建議」，或先從下方清單改選框架。');
  elements.stageOneOutput.append(list);
}

async function generateAdvice() {
  const situation = getSituation();
  if (!validateReady({ situation })) {
    return;
  }

  const selectedFramework = getSelectedFramework();
  if (!selectedFramework) {
    showError('請先選擇一個思考框架。');
    return;
  }

  setBusy(elements.generateButton, true, '產生中...');
  clearError();
  setMutedText(elements.adviceOutput, '正在依選定框架產生建議...');

  try {
    const messages = buildStageTwoMessages({
      situation,
      selectedFramework,
      recommendation: state.recommendation,
    });
    const advice = await callGlm({ apiKey: state.apiKey, messages, temperature: 0.3 });
    renderAdvice(advice);
  } catch (error) {
    showError(formatError(error));
    setMutedText(elements.adviceOutput, '產生建議失敗。請檢查 API key、配額或稍後重試。');
  } finally {
    setBusy(elements.generateButton, false, '第二階段：產生建議');
  }
}

function validateReady({ situation }) {
  if (!state.apiKey) {
    showError('請先輸入並使用 Zhipu API key。');
    return false;
  }

  if (!situation) {
    showError('請先輸入目前情境。');
    return false;
  }

  return true;
}

function getSituation() {
  return elements.situationInput.value.trim();
}

function getSelectedFramework() {
  return FRAMEWORKS.find((framework) => framework.id === state.selectedFrameworkId);
}

function renderFrameworkList() {
  clearNode(elements.frameworkList);

  for (const framework of FRAMEWORKS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'framework-option';
    button.setAttribute('role', 'listitem');
    button.setAttribute('aria-pressed', String(framework.id === state.selectedFrameworkId));

    const title = document.createElement('span');
    title.className = 'framework-title';
    title.textContent = framework.name;

    const description = document.createElement('span');
    description.className = 'framework-description';
    description.textContent = framework.description;

    button.append(title, description);
    button.addEventListener('click', () => {
      state.selectedFrameworkId = framework.id;
      state.selectionSource = 'manual';
      renderFrameworkList();
      renderSelectedFrameworkStatus();
    });

    elements.frameworkList.append(button);
  }
}

function renderSelectedFrameworkStatus() {
  const selectedFramework = getSelectedFramework();
  const sourceLabel = state.selectionSource === 'model' ? '模型推薦' : '手動選擇';
  elements.selectedFrameworkStatus.textContent = selectedFramework
    ? `目前框架：${selectedFramework.name}（${sourceLabel}）`
    : '尚未選擇框架。';
}

function renderRecommendation(parsed) {
  clearNode(elements.stageOneOutput);
  elements.stageOneOutput.classList.remove('muted');

  const recommendation = parsed.recommendation;
  const selectedFramework = FRAMEWORKS.find((framework) => framework.id === recommendation.recommendedFrameworkId);
  const list = document.createElement('ul');
  list.className = 'result-list';

  appendResultItem(list, '推薦框架', selectedFramework ? selectedFramework.name : recommendation.recommendedFrameworkId);
  appendResultItem(list, '信心', recommendation.confidence);
  appendResultItem(list, '理由', recommendation.reason || '模型未提供理由。');

  if (recommendation.alternatives.length > 0) {
    appendResultItem(
      list,
      '替代框架',
      recommendation.alternatives.map((item) => `${item.frameworkId}: ${item.reason}`).join('\n'),
    );
  }

  if (recommendation.clarifyingQuestions.length > 0) {
    appendResultItem(list, '釐清問題', recommendation.clarifyingQuestions.join('\n'));
  }

  if (parsed.unknownFramework) {
    appendResultItem(list, '需要手動確認', '模型推薦了目錄外的框架，請手動選擇可用框架。');
  }

  elements.stageOneOutput.append(list);
}

function renderRawStageOneFailure(rawText, error) {
  clearNode(elements.stageOneOutput);
  elements.stageOneOutput.classList.remove('muted');

  const message = document.createElement('p');
  message.textContent = `模型沒有回傳有效 JSON：${error}`;

  const raw = document.createElement('pre');
  raw.textContent = rawText;

  elements.stageOneOutput.append(message, raw);
}

function renderAdvice(advice) {
  clearNode(elements.adviceOutput);
  elements.adviceOutput.classList.remove('muted');

  const pre = document.createElement('pre');
  pre.textContent = advice;
  elements.adviceOutput.append(pre);
}

function appendResultItem(list, label, value) {
  const item = document.createElement('li');
  const strong = document.createElement('strong');
  strong.textContent = `${label}: `;
  const span = document.createElement('span');
  span.textContent = value;
  item.append(strong, span);
  list.append(item);
}

function setMutedText(node, text) {
  clearNode(node);
  node.classList.add('muted');
  node.textContent = text;
}

function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function showError(message) {
  elements.errorOutput.textContent = message;
}

function clearError() {
  elements.errorOutput.textContent = '';
}

function setBusy(button, isBusy, label) {
  button.disabled = isBusy;
  button.textContent = label;
}

function formatError(error) {
  if (error?.status === 401 || error?.status === 403) {
    return 'Zhipu API 驗證失敗。請檢查 API key 是否有效，或帳號是否有 GLM-5-Turbo / coding plan 權限。';
  }

  if (error?.status === 429) {
    return 'Zhipu API 回傳 rate limit 或 quota 限制。請稍後重試或檢查用量。';
  }

  if (error?.status) {
    return `Zhipu API 回傳 HTTP ${error.status}。${error.body || ''}`.trim();
  }

  return error?.message || '發生未知錯誤。';
}
