const buttons = document.querySelectorAll('.button');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    button.blur();
  });
});

// 若需要，可在此加入更多互動效果，例如滑動動畫、表單驗證或主題切換。
