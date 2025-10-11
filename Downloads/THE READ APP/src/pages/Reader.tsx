// src/pages/Reader.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Save, Volume2, VolumeX, RotateCcw, Settings, Zap, Book } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import Slider from '../components/ui/Slider';
import Switch from '../components/ui/Switch';
import SavedItems from '../components/SavedItems';

interface ReadingSettings {
  dyslexiaFont: boolean;
  fontSize: number;
  lineHeight: number;
  speedReading: boolean;
  chunkSize: number;
  readingSpeed: number;
  highlightWord: boolean;
}

export default function Reader(): JSX.Element {
  const [text, setText] = useState<string>('');
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [settings, setSettings] = useState<ReadingSettings>({
    dyslexiaFont: false,
    fontSize: 16,
    lineHeight: 1.6,
    speedReading: false,
    chunkSize: 3,
    readingSpeed: 300,
    highlightWord: true,
  });

  // refs & timers
  const intervalRef = useRef<number | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const words = useMemo(() => (text.trim() ? text.split(/\s+/).filter(Boolean) : []), [text]);

  // inside Reader component (src/pages/Reader.tsx)
useEffect(() => {
  try {
    if (typeof chrome !== 'undefined' && chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('_clarityread_selected_text', (res: any) => {
        const t = res && res._clarityread_selected_text;
        if (t && typeof t === 'string' && t.trim().length > 0) {
          setText(t);
          // optional: immediately remove so it doesn't persist
          chrome.storage.local.remove('_clarityread_selected_text', () => {});
        }
      });
    }
  } catch (e) {
    // swallow for browsers without chrome in dev
    // console.warn('restore selection error', e);
  }
  // run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopReading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helpers
  function safeClearInterval() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function sendBackgroundMessage(payload: any) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(payload, () => { /* ignore reply */ });
      }
    } catch (e) {
      // ignore in dev or non-extension env
    }
  }

  // Start reading (either speed or TTS)
  function startReading() {
    if (words.length === 0) return;
    setIsReading(true);
    setIsPaused(false);
    startedAtRef.current = Date.now();

    // notify background that a session started
    sendBackgroundMessage({ action: 'readingStarted' });

    if (settings.speedReading) {
      startSpeedReading();
    } else {
      startTextToSpeech();
    }
  }

  function pauseReading() {
    if (!isReading || isPaused) return;
    setIsPaused(true);

    safeClearInterval();

    try {
      if ('speechSynthesis' in window && speechRef.current) {
        window.speechSynthesis.pause();
      }
    } catch (e) {
      console.warn('pauseReading error', e);
    }

    sendBackgroundMessage({ action: 'readingPaused' });
  }

  function resumeReading() {
    if (!isReading || !isPaused) return;
    setIsPaused(false);

    if (settings.speedReading) {
      startSpeedReading();
    } else {
      try {
        if ('speechSynthesis' in window && speechRef.current) {
          window.speechSynthesis.resume();
        } else {
          // If utterance lost, restart TTS from current text (or current word)
          startTextToSpeech(/* resumeFromIndex */);
        }
      } catch (e) {
        console.warn('resumeReading error', e);
      }
    }

    sendBackgroundMessage({ action: 'readingResumed' });
  }

  function stopReading() {
    setIsReading(false);
    setIsPaused(false);
    setCurrentWordIndex(0);
    safeClearInterval();

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      speechRef.current = null;
    } catch (e) {
      console.warn('stopReading error', e);
    }

    // send duration if we have start time
    const startedAt = startedAtRef.current;
    if (startedAt) {
      const durationSec = Math.round((Date.now() - startedAt) / 1000);
      sendBackgroundMessage({ action: 'updateTimeOnly', duration: durationSec });
      startedAtRef.current = null;
    }

    sendBackgroundMessage({ action: 'readingStopped' });
    setIsSpeaking(false);
  }

  // Speed reading interval
  function startSpeedReading() {
    safeClearInterval();
    // compute interval from WPM: interval per word = 60000 / WPM
    const intervalMs = Math.max(20, Math.round(60000 / Math.max(1, settings.readingSpeed)));
    intervalRef.current = window.setInterval(() => {
      setCurrentWordIndex((prev) => {
        const next = prev + Math.max(1, settings.chunkSize);
        if (next >= words.length) {
          // reached end -> stop
          safeClearInterval();
          setTimeout(() => stopReading(), 0);
          return prev;
        }
        return next;
      });
    }, intervalMs) as unknown as number;
  }

  // Text-to-speech
  function startTextToSpeech() {
    if (!('speechSynthesis' in window)) return;
    try {
      // ensure previous cancelled
      window.speechSynthesis.cancel();
      speechRef.current = new SpeechSynthesisUtterance(text);
      const u = speechRef.current;
      u.rate = 1;
      u.pitch = 1;
      u.volume = 1;

      u.onstart = () => {
        setIsSpeaking(true);
      };
      u.onend = () => {
        setIsSpeaking(false);
        // ensure reading state stops
        stopReading();
      };
      u.onerror = (ev) => {
        console.warn('TTS error', ev);
        setIsSpeaking(false);
        stopReading();
      };

      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('startTextToSpeech error', e);
      setIsSpeaking(false);
    }
  }

  // Save/load helpers
  function saveText() {
    if (!text.trim()) return;
    try {
      const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
      const newText = {
        id: Date.now(),
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        text,
        createdAt: new Date().toISOString(),
      };
      savedTexts.unshift(newText);
      localStorage.setItem('savedTexts', JSON.stringify(savedTexts.slice(0, 20)));
    } catch (e) {
      console.warn('saveText error', e);
    }
  }

  function loadText(loadedText: string) {
    setText(loadedText);
    stopReading();
  }

  function getCurrentChunk() {
    if (!settings.speedReading || currentWordIndex >= words.length) return '';
    return words.slice(currentWordIndex, currentWordIndex + settings.chunkSize).join(' ');
  }

  function renderTextWithHighlight() {
    if (!settings.highlightWord || !isReading || settings.speedReading) {
      // show native text with preserved newlines
      return <div dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />;
    }

    return words.map((word, index) => (
      <span
        key={index}
        className={`${
          index === currentWordIndex
            ? 'bg-yellow-200 dark:bg-yellow-600 px-1 rounded transition-all duration-300'
            : ''
        }`}
      >
        {word}{' '}
      </span>
    ));
  }

  // compute progress safely
  const progressPct = words.length ? Math.round((currentWordIndex / Math.max(1, words.length - 1)) * 100) : 0;

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-lg md-elevation-3">
              <Book size={28} />
            </div>
            <div>
              <h1 className="md-headline-4 text-slate-900 dark:text-slate-100">Reader</h1>
              <p className="md-body-1 text-slate-600 dark:text-slate-400">Enhanced reading experience</p>
            </div>
          </div>

          <motion.button
            onClick={() => setShowSettings((s) => !s)}
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 md-standard"
          >
            <Settings size={20} className="text-slate-600 dark:text-slate-400" />
          </motion.button>
        </motion.div>

        <div className="h-[calc(100%-8rem)] md-grid md-grid-12 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-8 col-span-12 h-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-full">
              <Card className="h-full flex flex-col" elevation={3}>
                <div className="p-6 flex-1 flex flex-col min-h-0">
                  {/* Content Area */}
                  <div className="flex-1 min-h-0 mb-6">
                    {settings.speedReading && isReading ? (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex items-center justify-center">
                        <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20" elevation={6}>
                          <motion.div key={currentWordIndex} initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="md-headline-3 font-bold text-slate-900 dark:text-slate-100 mb-4">
                            {getCurrentChunk()}
                          </motion.div>
                          <div className="md-body-2 text-slate-600 dark:text-slate-400">
                            Word {Math.min(currentWordIndex + 1, words.length)} of {words.length} • {settings.readingSpeed} WPM
                          </div>
                        </Card>
                      </motion.div>
                    ) : (
                      <div className="h-full relative">
                        <Textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Paste or type your text here to start reading..."
                          className={`h-full resize-none ${settings.dyslexiaFont ? 'font-mono' : ''}`}
                          style={{
                            fontSize: `${settings.fontSize}px`,
                            lineHeight: settings.lineHeight,
                            minHeight: '100%',
                          }}
                        />

                        {text && !settings.speedReading && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-4 pointer-events-none overflow-hidden rounded-lg" style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight, fontFamily: settings.dyslexiaFont ? 'monospace' : 'inherit' }}>
                            {/* Use visible text for highlights; container has pointer-events-none so it won't block text input */}
                            <div className="p-4 text-slate-900 dark:text-slate-100 bg-transparent">
                              {renderTextWithHighlight()}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <div className="flex flex-wrap gap-3 mb-4">
                      {!isReading ? (
                        <Button onClick={startReading} disabled={!text.trim()} color="primary" size="large" elevation={3}>
                          <Play size={18} />
                          {settings.speedReading ? 'Speed Read' : 'Read Aloud'}
                        </Button>
                      ) : (
                        <>
                          <Button onClick={isPaused ? resumeReading : pauseReading} variant="outlined" size="large">
                            {isPaused ? <Play size={18} /> : <Pause size={18} />}
                            {isPaused ? 'Resume' : 'Pause'}
                          </Button>

                          <Button onClick={stopReading} variant="contained" color="error" size="large">
                            <Square size={18} />
                            Stop
                          </Button>
                        </>
                      )}

                      <Button onClick={saveText} disabled={!text.trim()} variant="outlined" size="large">
                        <Save size={18} />
                        Save
                      </Button>

                      <Button onClick={() => { setCurrentWordIndex(0); }} variant="text" size="large">
                        <RotateCcw size={18} />
                        Reset
                      </Button>
                    </div>

                    {/* Status */}
                    <Card className="p-4 bg-gray-50 dark:bg-gray-800" elevation={1}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isSpeaking ? <Volume2 size={20} className="text-green-600" /> : <VolumeX size={20} className="text-slate-400" />}
                          <span className="md-body-2 text-slate-700 dark:text-slate-300">{isSpeaking ? 'Reading aloud' : 'Silent mode'}</span>
                        </div>

                        {isReading && (
                          <div className="flex items-center gap-2">
                            <span className="md-caption text-slate-500">Progress:</span>
                            <span className="md-body-2 font-medium">{progressPct}%</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 col-span-12 h-full flex flex-col gap-6 overflow-y-auto">
            <AnimatePresence>{showSettings && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                <Card elevation={4}>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-600 text-white rounded-lg"><Settings size={20} /></div>
                      <h3 className="md-headline-6">Settings</h3>
                    </div>

                    <div className="space-y-6">
                      <Switch id="dyslexia-font" checked={settings.dyslexiaFont} onChange={(checked) => setSettings((p) => ({ ...p, dyslexiaFont: checked }))} label="Dyslexia-friendly font" description="Use monospace font" />

                      <Switch id="speed-reading" checked={settings.speedReading} onChange={(checked) => setSettings((p) => ({ ...p, speedReading: checked }))} label="Speed reading mode" description="Display words rapidly" />

                      <Slider label="Font Size" value={settings.fontSize} onChange={(v) => setSettings((p) => ({ ...p, fontSize: v }))} min={12} max={24} step={1} unit="px" />

                      {settings.speedReading && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <Slider label="Speed" value={settings.readingSpeed} onChange={(v) => setSettings((p) => ({ ...p, readingSpeed: v }))} min={100} max={800} step={50} unit="WPM" />
                          <Slider label="Chunk size" value={settings.chunkSize} onChange={(v) => setSettings((p) => ({ ...p, chunkSize: v }))} min={1} max={10} step={1} unit="words" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}</AnimatePresence>

            <SavedItems onLoadText={loadText} />

            <Card elevation={3}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-600 text-white rounded-lg"><Zap size={20} /></div>
                  <h3 className="md-headline-6">Stats</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="md-caption text-slate-600 dark:text-slate-400">Words</div>
                    <div className="md-body-1 font-semibold text-slate-900 dark:text-slate-100">{words.length.toLocaleString()}</div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="md-caption text-slate-600 dark:text-slate-400">Est. Time</div>
                    <div className="md-body-1 font-semibold text-slate-900 dark:text-slate-100">{Math.ceil(words.length / 200)}m</div>
                  </div>
                </div>

                {isReading && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="md-body-2 text-slate-700 dark:text-slate-300">Progress</span>
                      <span className="md-body-2 font-semibold">{progressPct}%</span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <motion.div className="h-2 bg-blue-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} />
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
