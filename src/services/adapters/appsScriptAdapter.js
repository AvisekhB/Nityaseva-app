const APPS_SCRIPT_URL = import.meta.env?.VITE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxVwxL5uSJUysUWfS2P857mN4xjCuHiuI9ZIOzPcwhfcsZt4gptGy5dzeHSatzRFtUVbA/exec";

export const appsScriptAdapter = {
  async post(action, payload) {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Prevents CORS preflight issues
      body: JSON.stringify({ action, payload })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Apps Script execution failed');
    return result.data;
  },

  async get(action, params = {}) {
    const queryParams = new URLSearchParams({ action, ...params }).toString();
    const response = await fetch(`${APPS_SCRIPT_URL}?${queryParams}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Apps Script GET failed');
    return result.data;
  }
};
