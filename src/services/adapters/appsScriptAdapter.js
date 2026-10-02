const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

export const appsScriptAdapter = {
  async post(action, payload) {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Avoid CORS preflight triggers
      body: JSON.stringify({ action, payload })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  }
};