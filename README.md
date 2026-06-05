# Locato - 輕量化網頁經緯度定位工具 (Web LatLng Locator)

**Locato** 是一個專為高頻率、高效率收集地理座標而設計的單一頁面網頁應用程式 (Single Page Web Utility)。採用現代「科技極簡風」設計，具備流暢的操作手感、歷史紀錄暫存與離線匯出功能，無任何後端資料庫依賴，隱私安全且加載極速。

👉 **線上展示網址**：`https://<your-username>.github.io/locato/` (部署後可填入你的網址)

---

## ✨ 核心特色

### 🗺️ 地圖與定位整合
*   **精準點擊選點**：點擊地圖任意位置，定位標籤 (Marker) 立即平滑移動，並即時更新座標數值。
*   **拖曳微調**：支援以滑鼠或手指直接拖曳地圖上的 Marker，進行公尺級的精準定位。
*   **雙圖層切換**：整合 **OpenStreetMap (標準地圖)** 與 **Esri World Imagery (高解析度衛星影像)**，無須填寫 API Key 即可自由切換，方便辨識建物細節。

### 📋 高頻複製優化
*   **一鍵複製 緯度, 經度**：提供最醒目的主按鈕「📋 複製 緯度, 經度」，格式標準（如：`25.033960, 121.564470`）。
*   **點擊即複製**：直接點擊面板上的「緯度」或「經度」數值文字，也能單獨觸發自動複製。
*   **小數點精度調整**：提供 4 至 8 位數小數點精度下拉選單，自動儲存偏好並四捨五入。
*   **防呆與即時回饋**：複製成功時會顯示 1.5 秒自動消失的綠色成功提示框。

### 🔍 地址搜尋與逆查
*   **Nominatim 搜尋**：頂部整合免金鑰的行政區逆查 API，支援輸入中文地址或地標，搜尋後自動平移並聚焦（Pan & Zoom）。
*   **即時地址逆查**：地圖點擊選點時，系統會自動逆查該點的實體中文地址或周邊地標描述。

### 🕒 暫存歷史紀錄區
*   **自動儲存**：每次執行複製動作時，座標、地址與時間會自動寫入歷史清單中。
*   **本機暫存**：使用 `LocalStorage` 儲存，關閉網頁、重新整理或重開機資料皆不會遺失（上限 50 筆）。
*   **自訂標記名稱**：清單中的紀錄點擊即可直接進行「名稱編輯 (Rename)」，方便標記特定點。
*   **快速定位回呼**：點擊歷史紀錄中的座標，地圖會立刻平移回該歷史座標點。
*   **一鍵匯出 CSV**：支援一鍵將所有暫存紀錄匯出為相容 Excel (UTF-8 BOM) 的 CSV 試算表。

### 🎨 現代化 UI/UX 設計
*   **科技極簡設計**：深色與淺色雙主題自適應（支援手動切換），搭配毛玻璃質感 (Glassmorphism) 懸浮面板。
*   **手機版體驗優化**：
    *   **可收合底部抽屜**：手機版下方的座標資訊板可一鍵「摺疊/收合」至僅剩 56px 標題列，釋放地圖視野；新定位時會自動彈開。
    *   **無障礙防誤觸**：手機版搜尋框高度提升至 `40px`，並設定 `16px` 字體防止 iOS 瀏覽器自動畫面放大。

---

## 🚀 快速開始 (本機運行)

本專案為純前端靜態頁面（HTML5 / CSS3 / Vanilla JS），沒有任何第三方 npm 建置流程。

由於瀏覽器安全性限制，部分瀏覽器禁止在 `file://` 協定（直接雙擊 HTML 檔案）下執行外部 API 的 `fetch` 請求（例如地址逆查與搜尋），**強烈建議透過本機 HTTP 伺服器開啟**：

### 方式 A：使用 Python (macOS/Linux 內建)
在專案目錄下開啟終端機執行：
```bash
python3 -m http.server 8000
```
接著在瀏覽器打開：[http://localhost:8000](http://localhost:8000)

### 方式 B：使用 Node.js (npx)
在專案目錄下開啟終端機執行：
```bash
npx serve
```
接著在瀏覽器打開：[http://localhost:3000](http://localhost:3000)

---

## 🌐 線上部署

### 1. GitHub Pages (推薦)
1. 在 GitHub 上建立一個空的公開儲存庫 (Public Repository)。
2. 將本機程式碼推送到 GitHub：
   ```bash
   git remote add origin https://github.com/<你的帳號>/<專案名稱>.git
   git branch -M main
   git push -u origin main
   ```
3. 前往 GitHub 儲存庫的 **Settings > Pages**。
4. 在 **Build and deployment** 下方的 **Branch** 選擇 `main`，並點擊 **Save**。
5. 等待 1 分鐘後即可經由產生的網址存取。

### 2. Firebase Hosting
本專案已附帶 `firebase.json` 設定檔，可直接部署：
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 📊 使用狀況追蹤 (Google Analytics)

本專案已整合 GA4 事件點擊追蹤。若想追蹤訪客的使用狀況，請開啟 `index.html`，並將以下兩處的 `G-XXXXXXXXXX` 替換為你的 **Google Analytics 測量 ID**：

*   **第 18 行**：`<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>`
*   **第 23 行**：`gtag('config', 'G-XXXXXXXXXX');`

設定後，使用者的「複製座標」、「圖層切換」、「地址搜尋」等動作皆會以自訂事件形式回傳至你的 GA4 後台。

---

## 📄 授權條款

本專案採用 [MIT License](LICENSE) 進行授權。
