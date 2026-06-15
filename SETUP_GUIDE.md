# 英文背單字軟體 - 完整設置指南

## 📋 目錄
1. [前端應用](#前端應用)
2. [Google Apps Script 後端設置](#google-apps-script-後端設置)
3. [整合步驟](#整合步驟)
4. [功能說明](#功能說明)
5. [常見問題](#常見問題)

---

## 前端應用

### 檔案結構
```
.
├── index.html      # 主應用程式（學習頁 + 管理頁）
├── styles.css      # 樣式表
├── app.js         # 應用邏輯
└── SETUP_GUIDE.md # 此文件
```

### 功能特性

#### 1️⃣ 學習頁面
- 顯示一張卡片，正面為英文單字
- 點擊卡片翻頁，背面顯示：
  - 中文翻譯
  - 詞性
  - 字根分析
  - 例句
- 上一個/下一個按鈕導航
- 顯示當前進度（如 5/20）

#### 2️⃣ 管理頁面
- 新增單字表單，包含欄位：
  - 英文單字 *（必填）
  - 中文翻譯 *（必填）
  - 詞性
  - 字根分析
  - 例句
- **🤖 自動填入按鈕**：
  - 調用 Free Dictionary API
  - 自動填入詞性和例句
  - 節省手動輸入時間
- 儲存單字（本地 + 後端）
- 查看已新增單字列表
- 刪除單字功能

### 本地運行

#### 方法 1：直接打開 HTML 文件
```bash
# 克隆或下載此項目
# 用瀏覽器打開 index.html
```

#### 方法 2：使用本地伺服器（推薦）
```bash
# 使用 Python 3
python -m http.server 8000

# 或使用 Node.js http-server
npx http-server

# 訪問 http://localhost:8000
```

---

## Google Apps Script 後端設置

### 步驟 1：建立 Google Sheet

1. 訪問 [Google Sheets](https://sheets.google.com/)
2. 建立新試算表
3. 重命名為 "English Vocabulary"
4. 建立欄位標題（第一行）：
   - A1: `英文單字`
   - B1: `中文翻譯`
   - C1: `詞性`
   - D1: `字根分析`
   - E1: `例句`
   - F1: `新增時間`

**範例 Google Sheet：**
```
英文單字 | 中文翻譯 | 詞性     | 字根分析        | 例句                          | 新增時間
---------|---------|---------|-----------------|-------------------------------|------------------
apple    | 蘋果   | noun    | -               | An apple a day...            | 2024-01-15 10:30
beautiful| 美麗的 | adjective| be + autiful    | A beautiful day.              | 2024-01-15 10:35
```

### 步驟 2：建立 Google Apps Script

1. 在 Google Sheet 中，點擊 **擴充功能 > Apps Script**
2. 複製下面的程式碼到編輯器中：

```javascript
// ===== Google Apps Script 程式碼 =====

// 設置 Google Sheet ID 和工作表名稱
const SHEET_ID = '你的SHEET_ID'; // 從 URL 複製
const SHEET_NAME = 'Sheet1';

/**
 * 處理 POST 請求
 */
function doPost(e) {
  try {
    // 解析請求數據
    const data = JSON.parse(e.postData.contents);
    
    // 取得 Google Sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // 新增一行數據
    sheet.appendRow([
      data.word || '',
      data.translation || '',
      data.pos || '',
      data.root || '',
      data.example || '',
      data.timestamp || new Date().toLocaleString()
    ]);
    
    // 返回成功響應
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: '單字已成功保存到 Google Sheet'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // 返回錯誤響應
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 取得所有單字（可選）
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // 轉換為 JSON 格式
    const headers = values[0];
    const data = values.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 步驟 3：獲取 Sheet ID

1. 打開您的 Google Sheet
2. 從 URL 複製 Sheet ID：
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit#gid=0
                                          ^^^^^^^^
   ```
3. 將 `SHEET_ID` 替換為實際的 ID

### 步驟 4：部署 Apps Script

1. 在 Apps Script 編輯器中，點擊 **部署 > 新增部署**
2. 選擇類型：**網頁應用**
3. 執行身份：選擇您的帳號
4. 誰有權限存取：**任何人**
5. 點擊 **部署**
6. 複製產生的 **部署 URL**（看起來像：`https://script.google.com/macros/d/...`）

---

## 整合步驟

### 連接前端與後端

1. 打開 `app.js` 文件
2. 找到第 4 行，設置 GAS 網址：
   ```javascript
   state.gasWebhookUrl = 'https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercontent'; // 替換為您的 GAS URL
   ```

### 完整示例

**app.js 第 4 行：**
```javascript
const state = {
    words: [],
    currentIndex: 0,
    isFlipped: false,
    gasWebhookUrl: 'https://script.google.com/macros/d/AKfycbyXxxx/usercontent', // ← 替換這裡
};
```

### 測試連接

1. 打開應用程式
2. 切換到 **管理單字** 頁面
3. 填寫表單並點擊 **儲存單字**
4. 檢查 Google Sheet 是否出現新數據
5. 打開瀏覽器控制台（F12），查看是否有錯誤訊息

---

## 功能說明

### 🤖 自動填入功能

#### 工作原理
1. 用戶在 "英文單字" 欄位輸入單字
2. 點擊 **🤖 自動填入** 按鈕
3. 應用調用 Free Dictionary API
4. API 返回單字的詞性和例句
5. 這些信息自動填入表單
6. 用戶只需填寫 "中文翻譯" 和其他可選欄位

#### API 源
- **API 名稱**：Free Dictionary API
- **URL**：`https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- **優點**：完全免費，無需 API 密鑰，不受速率限制影響
- **缺點**：僅支持英文單字，不提供中文翻譯

#### 使用示例
```
輸入："apple"
API 返回：
  - 詞性：noun
  - 例句："An apple a day keeps the doctor away."
```

### 💾 數據儲存

#### 本地儲存（LocalStorage）
- 即使未設置 GAS URL，單字也會保存在本地
- 瀏覽器關閉後數據不丟失
- 清除瀏覽器數據會刪除本地數據

#### 後端儲存（Google Sheet）
- 當設置 GAS URL 時，提交單字會同時保存到 Google Sheet
- 提供集中管理和備份功能
- 可以在 Google Sheet 中進行額外的數據分析

### 🎴 卡片翻頁
- 點擊卡片翻頁
- 前面：英文單字（大字體）
- 背面：翻譯、詞性、字根、例句
- 3D 翻轉效果

---

## 常見問題

### Q1：我沒有 Google 帳號，可以使用此應用嗎？
**A：** 可以！應用可以完全離線使用。單字將只保存在本地瀏覽器中。如果您想使用 Google Sheet 備份功能，才需要 Google 帳號。

### Q2：自動填入功能為什麼無法工作？
**A：** 請檢查：
1. 確認單字拼寫正確
2. 檢查網路連接
3. 單字必須是英文（API 不支持中文）
4. 某些不常見的單字可能不在 API 數據庫中

### Q3：如何備份我的單字？
**A：** 有三種方法：
1. **Google Sheet**：設置 GAS URL，單字自動備份到 Google Sheet
2. **瀏覽器導出**：在控制台輸入 `console.log(JSON.stringify(state.words))` 複製數據
3. **本地備份**：定期導出 LocalStorage 數據

### Q4：我可以在多台設備上使用嗎？
**A：** 
- 如果使用 Google Sheet 同步，是可以的
- 無 GAS URL 時，數據只存儲在當前設備
- 建議設置 GAS 以實現跨設備同步

### Q5：如何添加新的詞性選項？
**A：** 編輯 `app.js` 中的 `handleAutoFill()` 函數，根據 API 返回的結構自定義提取邏輯。

### Q6：部署 GAS 後，應用仍無法連接？
**A：** 請檢查：
1. GAS URL 是否正確複製
2. 部署的 **執行身份** 是否正確
3. 誰有權限存取 **是否設置為 "任何人"**
4. Google Sheet ID 是否正確設置

### Q7：如何修改表單欄位？
**A：** 編輯 `index.html` 中的表單部分，並在 `app.js` 中相應地修改提交邏輯。

---

## 進階配置

### 自定義 API 源

如果您想使用其他詞典 API，編輯 `app.js` 中的 `handleAutoFill()` 函數：

```javascript
async function handleAutoFill(e) {
  // ... 現有程式碼 ...
  
  // 替換此 URL 為您選擇的 API
  const response = await fetch(`YOUR_API_ENDPOINT/${word}`);
  
  // ... 根據新 API 的響應格式修改解析邏輯
}
```

### 推薦的 API
1. **Oxford Dictionary API** - 功能豐富但需要 API 密鑰
2. **Merriam-Webster API** - 高質量定義和例句
3. **Collins Dictionary API** - 多語言支持

---

## 📱 支持平台

- ✅ 桌面瀏覽器（Chrome、Firefox、Safari、Edge）
- ✅ 手機瀏覽器（iOS Safari、Android Chrome）
- ✅ 平板電腦
- ✅ 離線使用（本地儲存功能）

---

## 🔒 隱私與安全

- ✅ 所有數據首先保存在本地瀏覽器中
- ✅ 發送到 Google Sheet 的數據是完全由您控制的
- ✅ 應用不會收集或發送個人信息
- ✅ Free Dictionary API 是公開的，無需驗證

---

## 📞 支持

如遇問題，請檢查：
1. 瀏覽器控制台錯誤訊息（F12）
2. Google Apps Script 執行日誌
3. 本指南的常見問題部分
4. 確認所有 URL 和 ID 都已正確設置

---

## 📄 授權

此項目使用 MIT 授權。您可以自由使用、修改和分發。

---

**祝您學習順利！📚✨**
