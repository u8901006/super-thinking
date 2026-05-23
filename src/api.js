export const ZHIPU_ENDPOINT = 'https://open.bigmodel.cn/api/coding/paas/v4';
export const GLM_MODEL = 'GLM-5-Turbo';

export class GlmApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'GlmApiError';
    this.status = status;
    this.body = body;
  }
}

export async function callGlm({ apiKey, messages, temperature = 0.2, fetchImpl = globalThis.fetch }) {
  if (!apiKey) {
    throw new GlmApiError('Missing API key');
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new GlmApiError('Messages must be a non-empty array');
  }

  if (typeof fetchImpl !== 'function') {
    throw new GlmApiError('Fetch API is not available in this environment');
  }

  const response = await fetchImpl(ZHIPU_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      messages,
      temperature,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new GlmApiError(`GLM request failed with HTTP ${response.status}`, {
      status: response.status,
      body: responseText,
    });
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    throw new GlmApiError(`GLM response was not JSON: ${error.message}`, {
      status: response.status,
      body: responseText,
    });
  }

  return extractTextFromGlmResponse(data);
}

export function extractTextFromGlmResponse(data) {
  const choice = Array.isArray(data?.choices) ? data.choices[0] : undefined;
  const content = choice?.message?.content ?? choice?.delta?.content ?? data?.output_text ?? data?.output?.text ?? data?.content;

  if (typeof content === 'string' && content.trim()) {
    return content;
  }

  throw new GlmApiError('GLM response did not contain text content', {
    body: JSON.stringify(data),
  });
}
