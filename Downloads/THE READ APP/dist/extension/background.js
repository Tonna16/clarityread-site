// background.js (for Option A) - module service worker
(() => {
  'use strict';

  const safeLog = (...a) => { try { console.log('[ClarityRead bg]', ...a); } catch (e) {} };
  const safeWarn = (...a) => { try { console.warn('[ClarityRead bg]', ...a); } catch (e) {} };

  function safeRuntimeSendMessage(message) {
    try { chrome.runtime.sendMessage(message, () => {}); }
    catch (err) { safeWarn('safeRuntimeSendMessage threw', err); }
  }

  function isWebUrl(u = '') {
    if (!u) return false;
    const s = String(u).toLowerCase();
    return !/^(chrome:\/\/|about:|chrome-extension:\/\/|edge:\/\/|file:\/\/|view-source:|moz-extension:\/\/)/.test(s);
  }

  // minimal utility - request host permission (kept for future)
  function buildOriginPermissionPattern(url) {
    try { const u = new URL(url); return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ''}/*`; }
    catch (e) { return '<all_urls>'; }
  }
  function requestHostPermissionForUrl(url) {
    return new Promise((resolve) => {
      const originPattern = buildOriginPermissionPattern(url);
      try {
        chrome.permissions.request({ origins: [originPattern] }, (granted) => {
          if (chrome.runtime.lastError) return resolve({ ok: false, error: chrome.runtime.lastError.message });
          resolve({ ok: !!granted, pattern: originPattern });
        });
      } catch (e) { resolve({ ok: false, error: String(e) }); }
    });
  }

  // create context menu
  chrome.runtime.onInstalled.addListener(() => {
    try {
      chrome.contextMenus.create({
        id: 'clarityReadSelection',
        title: 'Read with ClarityRead',
        contexts: ['selection']
      }, () => {
        if (chrome.runtime.lastError) safeWarn('contextMenus.create error', chrome.runtime.lastError);
        else safeLog('context menu created');
      });
    } catch (e) { safeWarn('contextMenus.create threw', e); }
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    try {
      if (info.menuItemId === 'clarityReadSelection') {
        if (!tab || !tab.id) return;
        const txt = info.selectionText || '';
        // Option A: just open the app window and post the selection via storage so the UI picks it up
        chrome.storage.local.set({ _clarityread_selected_text: txt }, () => {
          chrome.windows.create({
            url: chrome.runtime.getURL("index.html"),
            type: "popup",
            width: 920,
            height: 720
          }, () => safeLog('popup opened from context menu'));
        });
      }
    } catch (e) { safeWarn('contextMenus.onClicked handler error', e); }
  });

  // Action click: open fixed-size popup window with index.html (centered)
  chrome.action.onClicked.addListener(async () => {
    try {
      const url = chrome.runtime.getURL("index.html");
      await chrome.windows.create({
        url,
        type: "popup",
        width: 920,
        height: 720,
        left: Math.max(0, Math.round((screen.width - 920) / 2)),
        top: Math.max(0, Math.round((screen.height - 720) / 2))
      });
      safeLog('popup window opened ->', url);
    } catch (err) {
      safeWarn('Failed to open popup window:', err);
    }
  });

  // keyboard commands: example handlers (kept light)
  chrome.commands.onCommand.addListener(async (command) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const tab = tabs && tabs[0];
      if (!tab) return;
      if (!isWebUrl(tab.url)) return;
      if (command === 'read-aloud') {
        // open app window (user can paste/select or use saved selection)
        chrome.windows.create({ url: chrome.runtime.getURL("index.html"), type: "popup", width: 920, height: 720 });
      } else if (command === 'stop-reading') {
        // nothing page-level in Option A - UI handles its own stop
        safeLog('stop-reading command received');
      }
    } catch (err) { safeWarn('onCommand error', err); }
  });

  safeLog('background service worker ready (Option A)');
})();
