// ===== 應用程式狀態 =====
const state = {
    words: [],
    currentIndex: 0,
    isFlipped: false,
    gasWebhookUrl: '', // 將在初始化時設置
};

// ===== DOM 元素 =====
const elements = {
    // 導航
    navBtns: document.querySelectorAll('.nav-btn'),
    learningPage: document.getElementById('learning-page'),
    managementPage: document.getElementById('management-page'),

    // 卡片
    flashcard: document.getElementById('flashcard'),
    cardWord: document.getElementById('card-word'),
    cardTranslation: document.getElementById('card-translation'),
    cardPos: document.getElementById('card-pos'),
    cardRoot: document.getElementById('card-root'),
    cardExample: document.getElementById('card-example'),

    // 控制按鈕
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    currentIndex: document.getElementById('current-index'),
    totalCount: document.getElementById('total-count'),

    // 表單
    wordForm: document.getElementById('word-form'),
    wordInput: document.getElementById('word-input'),
    translationInput: document.getElementById('translation-input'),
    posInput: document.getElementById('pos-input'),
    rootInput: document.getElementById('root-input'),
    exampleInput: document.getElementById('example-input'),
    autoFillBtn: document.getElementById('auto-fill-btn'),
    formStatus: document.getElementById('form-status'),
    wordsList: document.getElementById('words-list'),
    wordsCount: document.getElementById('words-count'),
};

// ===== 初始化 =====
function init() {
    // 從 localStorage 加載數據
    loadWordsFromStorage();

    // 綁定事件
    bindEvents();

    // 更新頁面顯示
    updateCardDisplay();
    updateWordsList();

    // 提示設置 GAS URL
    console.log('💡 請在 app.js 中設置 state.gasWebhookUrl 為您的 Google Apps Script 網頁應用 URL');
}

// ===== 事件綁定 =====
function bindEvents() {
    // 導航
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navigateTo(e.target.dataset.page);
        });
    });

    // 卡片翻頁
    elements.flashcard.addEventListener('click', flipCard);

    // 卡片導航
    elements.prevBtn.addEventListener('click', previousCard);
    elements.nextBtn.addEventListener('click', nextCard);

    // 表單
    elements.wordForm.addEventListener('submit', handleFormSubmit);
    elements.autoFillBtn.addEventListener('click', handleAutoFill);
}

// ===== 導航功能 =====
function navigateTo(page) {
    // 更新按鈕狀態
    elements.navBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // 顯示目標頁面
    if (page === 'learning') {
        elements.learningPage.classList.add('active');
        state.isFlipped = false;
        elements.flashcard.classList.remove('flipped');
    } else if (page === 'management') {
        elements.managementPage.classList.add('active');
        updateWordsList();
    }
}

// ===== 卡片翻頁 =====
function flipCard() {
    state.isFlipped = !state.isFlipped;
    elements.flashcard.classList.toggle('flipped');
}

// ===== 卡片導航 =====
function previousCard() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        state.isFlipped = false;
        elements.flashcard.classList.remove('flipped');
        updateCardDisplay();
    }
}

function nextCard() {
    if (state.currentIndex < state.words.length - 1) {
        state.currentIndex++;
        state.isFlipped = false;
        elements.flashcard.classList.remove('flipped');
        updateCardDisplay();
    }
}

// ===== 更新卡片顯示 =====
function updateCardDisplay() {
    if (state.words.length === 0) {
        elements.cardWord.textContent = '尚無單字';
        elements.cardTranslation.textContent = '請到管理頁面新增單字';
        elements.cardPos.textContent = '-';
        elements.cardRoot.textContent = '-';
        elements.cardExample.textContent = '-';
        elements.prevBtn.disabled = true;
        elements.nextBtn.disabled = true;
        return;
    }

    const word = state.words[state.currentIndex];
    elements.cardWord.textContent = word.word;
    elements.cardTranslation.textContent = word.translation || '-';
    elements.cardPos.textContent = word.pos || '-';
    elements.cardRoot.textContent = word.root || '-';
    elements.cardExample.textContent = word.example || '-';

    // 更新計數器
    elements.currentIndex.textContent = state.currentIndex + 1;
    elements.totalCount.textContent = state.words.length;

    // 更新按鈕狀態
    elements.prevBtn.disabled = state.currentIndex === 0;
    elements.nextBtn.disabled = state.currentIndex === state.words.length - 1;
}

// ===== 表單提交 =====
async function handleFormSubmit(e) {
    e.preventDefault();

    // 驗證必填項
    if (!elements.wordInput.value || !elements.translationInput.value) {
        showStatus('請填寫英文單字和中文翻譯', 'error');
        return;
    }

    const newWord = {
        word: elements.wordInput.value.trim(),
        translation: elements.translationInput.value.trim(),
        pos: elements.posInput.value.trim(),
        root: elements.rootInput.value.trim(),
        example: elements.exampleInput.value.trim(),
        id: Date.now(), // 簡單的 ID
    };

    // 檢查重複
    if (state.words.some(w => w.word.toLowerCase() === newWord.word.toLowerCase())) {
        showStatus('此單字已存在', 'error');
        return;
    }

    // 禁用表單
    setFormDisabled(true);
    showStatus('正在儲存單字...', 'loading');

    try {
        // 如果設置了 GAS URL，發送到後端
        if (state.gasWebhookUrl) {
            await sendToGAS(newWord);
        }

        // 保存到本地
        state.words.push(newWord);
        saveWordsToStorage();

        // 重置表單
        elements.wordForm.reset();
        showStatus('✅ 單字已成功儲存！', 'success');

        // 更新顯示
        updateCardDisplay();
        updateWordsList();
    } catch (error) {
        console.error('保存失敗:', error);
        showStatus('❌ 保存失敗，但數據已本地保存', 'error');
        state.words.push(newWord);
        saveWordsToStorage();
        elements.wordForm.reset();
    } finally {
        setFormDisabled(false);
    }
}

// ===== 自動填入功能 =====
async function handleAutoFill(e) {
    e.preventDefault();

    const word = elements.wordInput.value.trim();
    if (!word) {
        showStatus('請先輸入英文單字', 'error');
        return;
    }

    const btn = elements.autoFillBtn;
    btn.disabled = true;
    btn.classList.add('loading');
    btn.textContent = '⏳ 查詢中...';

    try {
        // 使用 Free Dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

        if (!response.ok) {
            throw new Error('查詢失敗');
        }

        const data = await response.json();
        const entry = data[0];

        // 提取詞性
        let pos = '';
        if (entry.meanings && entry.meanings.length > 0) {
            pos = entry.meanings[0].partOfSpeech || '';
        }

        // 提取例句
        let example = '';
        if (entry.meanings && entry.meanings.length > 0) {
            const firstMeaning = entry.meanings[0];
            if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                example = firstMeaning.definitions[0].example || '';
            }
        }

        // 填充表單
        elements.posInput.value = pos;
        elements.exampleInput.value = example;

        // 提示用戶填寫其他字段
        showStatus('✅ 已自動填入詞性和例句，請填寫中文翻譯和字根分析', 'success');
        elements.translationInput.focus();
    } catch (error) {
        console.error('API 查詢失敗:', error);
        showStatus('❌ 自動填入失敗，請手動填寫', 'error');
    } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.textContent = '🤖 自動填入';
    }
}

// ===== 發送到 Google Apps Script =====
async function sendToGAS(wordData) {
    if (!state.gasWebhookUrl) {
        console.log('未設置 GAS URL，跳過後端同步');
        return;
    }

    const response = await fetch(state.gasWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            word: wordData.word,
            translation: wordData.translation,
            pos: wordData.pos,
            root: wordData.root,
            example: wordData.example,
            timestamp: new Date().toLocaleString(),
        }),
    });

    console.log('已發送到 GAS:', wordData);
}

// ===== 單字列表管理 =====
function updateWordsList() {
    elements.wordsCount.textContent = state.words.length;

    if (state.words.length === 0) {
        elements.wordsList.innerHTML = '<p style="text-align: center; color: #999;">尚無單字，開始新增吧！</p>';
        return;
    }

    elements.wordsList.innerHTML = state.words
        .sort((a, b) => b.id - a.id) // 最新的排在前面
        .map(word => `
            <div class="word-card">
                <div class="word-card-title">${escapeHtml(word.word)}</div>
                <div class="word-card-info">
                    <strong>翻譯:</strong> ${escapeHtml(word.translation || '-')}
                </div>
                ${word.pos ? `<div class="word-card-info"><strong>詞性:</strong> ${escapeHtml(word.pos)}</div>` : ''}
                ${word.root ? `<div class="word-card-info"><strong>字根:</strong> ${escapeHtml(word.root)}</div>` : ''}
                ${word.example ? `<div class="word-card-info"><strong>例句:</strong> ${escapeHtml(word.example)}</div>` : ''}
                <button class="word-card-delete" onclick="deleteWord(${word.id})">🗑️ 刪除</button>
            </div>
        `)
        .join('');
}

function deleteWord(id) {
    if (confirm('確定要刪除此單字嗎？')) {
        state.words = state.words.filter(w => w.id !== id);
        saveWordsToStorage();
        updateWordsList();
        updateCardDisplay();
        showStatus('✅ 已刪除單字', 'success');
    }
}

// ===== 本地儲存 =====
function saveWordsToStorage() {
    localStorage.setItem('flashcard_words', JSON.stringify(state.words));
}

function loadWordsFromStorage() {
    const saved = localStorage.getItem('flashcard_words');
    if (saved) {
        state.words = JSON.parse(saved);
    }
}

// ===== 工具函數 =====
function showStatus(message, type) {
    elements.formStatus.textContent = message;
    elements.formStatus.className = `form-status show ${type}`;

    // 3 秒後自動隱藏
    setTimeout(() => {
        elements.formStatus.classList.remove('show');
    }, 3000);
}

function setFormDisabled(disabled) {
    const inputs = elements.wordForm.querySelectorAll('input, textarea, button');
    inputs.forEach(input => {
        input.disabled = disabled;
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== 頁面加載時初始化 =====
document.addEventListener('DOMContentLoaded', init);
