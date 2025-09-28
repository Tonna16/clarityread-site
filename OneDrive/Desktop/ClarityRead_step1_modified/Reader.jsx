import React, { useState, useEffect, useRef } from "react";
import { UserPreferences, ReadingSession } from "@/entities/all";
import { User } from "@/entities/User";
import { InvokeLLM } from "@/integrations/Core";
import TextEditor from "../components/reader/TextEditor";
import VoiceControls from "../components/reader/VoiceControls";
import ReadingSettings from "../components/reader/ReadingSettings";
import SummaryPanel from "../components/reader/SummaryPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Sparkles, Play, Pause, Square, Volume2 } from "lucide-react";

export default function Reader() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [preferences, setPreferences] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [summary, setSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  
  const utteranceRef = useRef(null);
  const wordsRef = useRef([]);
  const user = useRef(null);

  useEffect(() => {
    initializeApp();
    loadVoices();
  }, []);

  const initializeApp = async () => {
    try {
      user.current = await User.me();
      const userPrefs = await UserPreferences.filter({ created_by: user.current.email });
      if (userPrefs.length > 0) {
        setPreferences(userPrefs[0]);
      } else {
        const defaultPrefs = await UserPreferences.create({});
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error("Error initializing:", error);
    }
  };

  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    setAvailableVoices(voices);
  };

  useEffect(() => {
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const updatePreferences = async (newPrefs) => {
    if (!preferences) return;
    const updated = await UserPreferences.update(preferences.id, newPrefs);
    setPreferences(updated);
  };

  const startReading = () => {
    if (!content.trim()) return;
    
    setIsReading(true);
    setIsPaused(false);
    setSessionStartTime(Date.now());
    
    const words = content.split(/\s+/);
    wordsRef.current = words;
    
    const utterance = new SpeechSynthesisUtterance(content);
    utteranceRef.current = utterance;
    
    if (preferences?.voice_name) {
      const voice = availableVoices.find(v => v.name === preferences.voice_name);
      if (voice) utterance.voice = voice;
    }
    
    utterance.rate = preferences?.voice_rate || 1.0;
    utterance.pitch = preferences?.voice_pitch || 1.0;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const wordIndex = Math.floor(event.charIndex / 5); // Approximate
        setCurrentWordIndex(wordIndex);
        setReadingProgress((wordIndex / words.length) * 100);
      }
    };
    
    utterance.onend = () => {
      setIsReading(false);
      setCurrentWordIndex(0);
      saveReadingSession();
    };
    
    speechSynthesis.speak(utterance);
  };

  const pauseReading = () => {
    speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeReading = () => {
    speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopReading = () => {
    speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    setCurrentWordIndex(0);
    setReadingProgress(0);
    if (sessionStartTime) {
      saveReadingSession();
    }
  };

  const saveReadingSession = async () => {
    if (!sessionStartTime || !content || !user.current) return;
    
    const readingTime = (Date.now() - sessionStartTime) / 1000 / 60; // minutes
    const wordCount = content.split(/\s+/).length;
    const wpm = Math.round(wordCount / readingTime);
    
    await ReadingSession.create({
      title: title || "Untitled Reading",
      content: content,
      word_count: wordCount,
      reading_time_minutes: readingTime,
      completion_percentage: readingProgress,
      reading_speed_wpm: wpm,
      voice_used: preferences?.voice_name || "default",
      settings_used: preferences
    });
  };

  const generateSummary = async () => {
    if (!content.trim()) return;
    
    setIsGeneratingSummary(true);
    try {
      const result = await InvokeLLM({
        prompt: `Please provide a concise, helpful summary of the following text. Focus on the main points and key takeaways:\n\n${content}`,
      });
      setSummary(result);
    } catch (error) {
      console.error("Error generating summary:", error);
    }
    setIsGeneratingSummary(false);
  };

  if (!preferences) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Reading Assistant</h1>
                <p className="text-slate-600">Paste your text and start reading with enhanced features</p>
              </div>
              
              {/* Reading Controls */}
              <div className="flex items-center gap-3">
                {!isReading ? (
                  <Button
                    onClick={startReading}
                    disabled={!content.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Reading
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {isPaused ? (
                      <Button
                        onClick={resumeReading}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={pauseReading}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={stopReading}
                      variant="outline"
                      className="border-red-300 hover:bg-red-50"
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Voice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="mt-6">
                <TextEditor
                  content={content}
                  setContent={setContent}
                  title={title}
                  setTitle={setTitle}
                  preferences={preferences}
                  currentWordIndex={currentWordIndex}
                  isReading={isReading}
                  readingProgress={readingProgress}
                />
              </TabsContent>

              <TabsContent value="summary" className="mt-6">
                <SummaryPanel
                  summary={summary}
                  isGenerating={isGeneratingSummary}
                  onGenerate={generateSummary}
                  hasContent={!!content.trim()}
                />
              </TabsContent>

              <TabsContent value="voice" className="mt-6">
                <VoiceControls
                  preferences={preferences}
                  updatePreferences={updatePreferences}
                  availableVoices={availableVoices}
                  isReading={isReading}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Settings Sidebar */}
          <div className="lg:w-80">
            <ReadingSettings
              preferences={preferences}
              updatePreferences={updatePreferences}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
