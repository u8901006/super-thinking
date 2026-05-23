# 思考框架建議器

這是一個可部署到 GitHub Pages 的純靜態網頁。使用者輸入目前情境後，網頁會使用 Zhipu GLM-5-Turbo 進行兩階段分析：先推薦適合的 thinking framework skill，再依選定框架產生建議。

## 功能

- 輸入目前情境、目標、限制與不確定性。
- 第一階段由 GLM-5-Turbo 推薦思考框架。
- 可手動覆蓋模型推薦的框架。
- 第二階段依選定框架輸出繁體中文建議。
- API key 只保存在頁面記憶體，不寫入瀏覽器儲存空間。

## 使用方式

1. 開啟 `index.html` 或部署後的 GitHub Pages 網址。
2. 貼上 Zhipu API key，按下「使用 key」。欄位會清空，key 只留在本頁記憶體。
3. 輸入目前情境。
4. 按「第一階段：分析框架」。
5. 接受模型推薦，或在「手動選擇框架」改選。
6. 按「第二階段：產生建議」。

## GitHub Pages 部署

此專案不需要 npm install、打包或 GitHub Actions。

1. 將 `index.html`、`styles.css`、`app.js`、`frameworks.js`、`src/`、`README.md` 放在 repository root。
2. 在 GitHub repository settings 啟用 Pages。
3. Source 選擇部署 root 或依 repository 設定選擇對應分支。

如果未來新增 GitHub Actions workflow，請用完整 commit SHA 釘住 action 版本，不要使用 `@v4` 這類 mutable tag。

## 最小權限宣告

- 不需要 GitHub repository 寫入權限。
- 不需要 OAuth 登入。
- 不使用 cookies。
- 不使用資料庫。
- 此靜態網頁本身不把 API key 或使用者輸入存到雲端儲存空間。
- 使用者瀏覽器會把 API key 與分析 payload 送到 `https://open.bigmodel.cn/api/coding/paas/v4` 進行處理，payload 包含使用者情境、選定框架與 prompt 資料。

## 安全限制

這是純 GitHub Pages 前端，因此 API key 會出現在使用者自己的瀏覽器記憶體與 network request 中，使用者情境與選定框架 prompt 資料也會送到 Zhipu endpoint 進行模型分析。這不是此 app 的雲端儲存，也不是 repository 明碼，但無法防止使用者本機 devtools、惡意瀏覽器擴充套件或受感染裝置讀取。

Zhipu provider 端的資料保留、紀錄與使用方式由 Zhipu 的服務條款、隱私政策與帳號設定規範，不由這個靜態 app 控制。

建議使用有額度限制、用途限制或可隨時撤銷的 Zhipu API key。

## 本機測試

需要 Node.js 18 或更新版本。

```powershell
npm test
```

測試會檢查：

- framework catalog 至少包含 `super-thinking` 與 `thinking-fast-and-slow`。
- prompt 把使用者情境視為 untrusted content。
- API client 不把 API key 放進 JSON body。
- runtime 程式不使用 localStorage、sessionStorage、cookie 或 IndexedDB。
- model output 不以 raw HTML 方式插入頁面。
- `index.html` 宣告 Content Security Policy。
