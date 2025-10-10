// debug-background.js — minimal test to confirm service worker + onClicked
console.log('[ClarityRead bg TEST] service worker loading');

chrome.runtime.onInstalled?.addListener?.(() => {
  console.log('[ClarityRead bg TEST] installed event');
});

chrome.action.onClicked.addListener(async () => {
  console.log('[ClarityRead bg TEST] action clicked');
  try {
    const url = chrome.runtime.getURL('index.html');
    console.log('[ClarityRead bg TEST] will open', url);
    await chrome.windows.create({ url, type: 'popup', width: 920, height: 720 });
    console.log('[ClarityRead bg TEST] window create success');
  } catch (err) {
    console.error('[ClarityRead bg TEST] open window failed', err);
  }
});

console.log('[ClarityRead bg TEST] ready');
