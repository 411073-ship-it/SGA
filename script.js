const flipCard = document.getElementById('flipCard');
const wordForm = document.getElementById('wordForm');
const autoFillButton = document.getElementById('autoFillButton');
const wordList = document.getElementById('wordList');
const statusMessage = document.getElementById('statusMessage');
const viewButtons = document.querySelectorAll('.tab-button');

const englishWord = document.getElementById('englishWord');
const translation = document.getElementById('translation');
const partOfSpeech = document.getElementById('partOfSpeech');
const exampleSentence = document.getElementById('exampleSentence');
const rootAnalysis = document.getElementById('rootAnalysis');

const cardWord = document.getElementById('cardWord');
const cardTranslation = document.getElementById('cardTranslation');
const cardBackContent = document.getElementById('cardBackContent');
const cardFrontNote = document.getElementById('cardFrontNote');
const currentInfo = document.getElementById('currentInfo');
const prevWord = document.getElementById('prevWord');
const nextWord = document.getElementById('nextWord');

const apiConfig = {
  endpoint: '',
};

const vocabulary = [];
let activeIndex = 0;

function updateCardDisplay() {
  if (vocabulary.length === 0) {
    cardWord.textContent = 'example';
    cardTranslation.textContent = '範例';
    cardBackContent.textContent = '詞性、例句與字根分析將顯示在此。';
    currentInfo.textContent = '尚無儲存單字';
    return;
  }

  const item = vocabulary[activeIndex];
  cardWord.textContent = item.word;
  cardTranslation.textContent = item.translation;
  cardBackContent.textContent = `詞性：${item.partOfSpeech}\n例句：${item.exampleSentence}\n字根分析：${item.rootAnalysis}`;
  currentInfo.textContent = `第 ${activeIndex + 1} / ${vocabulary.length} 個單字`;
}

function toggleFlip() {
  flipCard.classList.toggle('is-flipped');
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#ff9fa8' : '#a8d8ff';
}

function populateFields(data) {
  translation.value = data.translation || '';
  partOfSpeech.value = data.partOfSpeech || '';
  exampleSentence.value = data.exampleSentence || '';
  rootAnalysis.value = data.rootAnalysis || '';
}

async function autoFill() {
  const word = englishWord.value.trim();

  if (!word) {
    setStatus('請先輸入英文單字，再執行自動填入。', true);
    return;
  }

  setStatus('自動填入中，請稍候…');

  if (apiConfig.endpoint) {
    try {
      const response = await fetch(apiConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });

      if (!response.ok) {
        throw new Error(`API 回應 ${response.status}`);
      }

      const data = await response.json();
      populateFields(data);
      setStatus('已完成自動填入。');
      return;
    } catch (error) {
      console.error('Auto-fill API error', error);
      setStatus('API 呼叫失敗，使用模擬資料填入。', true);
    }
  }

  const mockData = {
    translation: `${word} 的中文意思`,
    partOfSpeech: '名詞',
    exampleSentence: `This is an example sentence using ${word}.`,
    rootAnalysis: `分析 ${word} 的字根結構與來源。`,
  };

  populateFields(mockData);
  setStatus('已使用示範資料自動填入。若要使用真實 API，請在 script.js 中設定 apiConfig.endpoint。');
}

function renderWordList() {
  wordList.innerHTML = '';

  if (vocabulary.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = '目前尚未新增單字';
    wordList.appendChild(empty);
    return;
  }

  vocabulary.forEach((item, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'word-item';
    listItem.innerHTML = `
      <div class="formula-item-title">${item.word}</div>
      <div class="formula-item-meta">
        <div><strong>翻譯：</strong>${item.translation}</div>
        <div><strong>詞性：</strong>${item.partOfSpeech}</div>
      </div>
    `;
    listItem.addEventListener('click', () => {
      activeIndex = index;
      updateCardDisplay();
      flipCard.classList.remove('is-flipped');
    });
    wordList.appendChild(listItem);
  });
}

function addWord(event) {
  event.preventDefault();

  const item = {
    word: englishWord.value.trim() || '未命名單字',
    translation: translation.value.trim() || '未填寫翻譯',
    partOfSpeech: partOfSpeech.value.trim() || '未填寫詞性',
    exampleSentence: exampleSentence.value.trim() || '未填寫例句',
    rootAnalysis: rootAnalysis.value.trim() || '未填寫字根分析',
  };

  vocabulary.unshift(item);
  activeIndex = 0;
  renderWordList();
  updateCardDisplay();
  setStatus('已新增單字。');
  wordForm.reset();
}

function switchView(event) {
  const target = event.currentTarget.dataset.target;
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === target);
  });
  viewButtons.forEach((button) => {
    const isActive = button.dataset.target === target;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive);
  });
}

flipCard.addEventListener('click', toggleFlip);
flipCard.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleFlip();
  }
});

wordForm.addEventListener('submit', addWord);
autoFillButton.addEventListener('click', autoFill);
viewButtons.forEach((button) => button.addEventListener('click', switchView));

renderWordList();
updateCardDisplay();
