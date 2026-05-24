import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeFiles = ['app.js', 'src/api.js', 'src/prompts.js'];

test('index declares a restrictive content security policy', async () => {
  const html = await readFile('index.html', 'utf8');

  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'self'/);
  assert.match(html, /connect-src https:\/\/open\.bigmodel\.cn/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /frame-ancestors 'none'/);
});

test('runtime files do not persist secrets or user inputs in browser storage', async () => {
  for (const filePath of runtimeFiles) {
    const source = await readFile(filePath, 'utf8');

    assert.doesNotMatch(source, /localStorage/);
    assert.doesNotMatch(source, /sessionStorage/);
    assert.doesNotMatch(source, /document\.cookie/);
    assert.doesNotMatch(source, /indexedDB/i);
  }
});

test('app rendering does not assign model output as raw html', async () => {
  const source = await readFile('app.js', 'utf8');

  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /textContent/);
});

test('homepage footer includes clinic, newsletter, and support links', async () => {
  const html = await readFile('index.html', 'utf8');

  assert.match(html, /https:\/\/www\.leepsyclinic\.com\//);
  assert.match(html, /https:\/\/blog\.leepsyclinic\.com\//);
  assert.match(html, /https:\/\/buymeacoffee\.com\/CYlee/);
});

test('stage one exposes automatic and manual framework selection modes', async () => {
  const html = await readFile('index.html', 'utf8');

  assert.match(html, /id="autoModeInput"/);
  assert.match(html, /id="manualModeInput"/);
  assert.match(html, /自動選擇框架/);
  assert.match(html, /手動選擇框架/);
});

test('manual framework selection mode does not call the model during stage one', async () => {
  const source = await readFile('app.js', 'utf8');

  assert.match(source, /selectionMode:\s*'auto'/);
  assert.match(source, /state\.selectionMode === 'manual'/);
  assert.match(source, /renderManualModeStageOne/);
});

test('manual stage one mode does not require an api key before rendering guidance', async () => {
  const source = await readFile('app.js', 'utf8');
  const manualModeIndex = source.indexOf("state.selectionMode === 'manual'");
  const validateReadyIndex = source.indexOf('validateReady({ situation })');

  assert.ok(manualModeIndex >= 0, 'manual mode branch should exist');
  assert.ok(validateReadyIndex >= 0, 'validation call should exist');
  assert.ok(manualModeIndex < validateReadyIndex, 'manual mode should run before API key validation');
});
