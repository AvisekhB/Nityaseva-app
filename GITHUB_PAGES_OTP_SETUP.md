# Nityaseva GitHub Pages + Google Apps Script OTP Setup

This version avoids the browser CORS/preflight problem that occurs when `index.html` is opened directly with `file://`. The frontend submits the OTP request to the Apps Script Web App through a hidden form/iframe and receives the result with `postMessage`.

## 1. Apps Script

Use the `apps-script/Code.gs` in this package. Set the Script Property:

- Property: `SHEET_ID`
- Value: your Google Sheet ID

Deploy as a Web app:

- Execute as: Me
- Who has access: Anyone

Copy the Web App URL ending in `/exec`.

## 2. Configure the frontend

Open `app/config.js` and replace:

```js
OTP_ENDPOINT:'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'
```

with your actual `/exec` URL.

## 3. GitHub

Create a GitHub repository and upload the **contents of the `app` folder** to the repository root:

- `index.html`
- `app.js`
- `config.js`
- `styles.css`

Do not publish `apps-script/Code.gs` as part of the website if you do not want the backend source exposed.

## 4. GitHub Pages

Repository → Settings → Pages → Deploy from branch → `main` → `/ (root)` → Save.

Open the generated HTTPS GitHub Pages URL.

## 5. Test

Enter a test email and click Send OTP. The OTP should arrive from the Google account that owns the Apps Script. Then enter the code.

## Important

This is a pilot authentication flow. Before using real clinical data, add production authentication/session management, Supabase RLS, audit logging, rate limiting, consent/privacy controls, and clinical/privacy review.
