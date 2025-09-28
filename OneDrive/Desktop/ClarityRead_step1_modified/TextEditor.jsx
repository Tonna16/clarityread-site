import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { FileText, TrendingUp } from "lucide-react";

const fontFamilies = {
  system: "'Inter', system-ui, -apple-system, sans-serif",
  dyslexie: "'Dyslexie', Arial, sans-serif",
  opendyslexic: "'OpenDyslexic', Arial, sans-serif",
  'comic-sans': "'Comic Sans MS', cursive",
  arial: "Arial, sans-serif"
};

const themes = {
  light: {
    bg: "bg-white",
    text: "text-slate-800",
    border: "border-slate-200"
  },
  dark: {
    bg: "bg-slate-800",
    text: "text-white",
    border: "border-slate-600"
  },
  'high-contrast': {
    bg: "bg-black",
    text: "text-yellow-300",
    border: "border-yellow-300"
  },
  sepia: {
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200"
  }
};

export default function TextEditor({
  content,
  setContent,
  title,
  setTitle,
  preferences,
  currentWordIndex,
  isReading,
  readingProgress
}) {
  const theme = themes[preferences?.theme || 'light'];
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 WPM average

  const getHighlightedText = () => {
    if (!isReading || !content) return content;
    
    const words = content.split(/\s+/);
    return words.map((word, index) => {
      if (index === currentWordIndex) {
        return `<span style="background-color: ${preferences?.highlight_color || '#3b82f6'}; color: white; padding: 2px 4px; border-radius: 4px;">${word}</span>`;
      }
      return word;
    }).join(' ');
  };

  return (
    <Card className={`${theme.bg} ${theme.border} border-2 shadow-lg`}>
      <CardHeader className="space-y-4">
        <Input
          placeholder="Enter a title for your reading material..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`text-xl font-semibold ${theme.bg} ${theme.text} ${theme.border} border-2`}
          style={{
            fontFamily: fontFamilies[preferences?.font_family || 'system']
          }}
        />
        
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{wordCount} words</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>~{estimatedReadingTime} min read</span>
            </div>
          </div>
        </div>

        {isReading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Reading Progress</span>
              <span>{Math.round(readingProgress)}%</span>
            </div>
            <Progress value={readingProgress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isReading ? (
          <div
            className={`min-h-96 p-6 rounded-lg ${theme.bg} ${theme.text} leading-relaxed`}
            style={{
              fontFamily: fontFamilies[preferences?.font_family || 'system'],
              fontSize: `${preferences?.font_size || 18}px`,
              lineHeight: preferences?.line_height || 1.6
            }}
            dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
          />
        ) : (
          <Textarea
            placeholder="Paste your text here to start reading with enhanced features..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`min-h-96 resize-none ${theme.bg} ${theme.text} ${theme.border} border-2 focus:ring-2 focus:ring-blue-500`}
            style={{
              fontFamily: fontFamilies[preferences?.font_family || 'system'],
              fontSize: `${preferences?.font_size || 18}px`,
              lineHeight: preferences?.line_height || 1.6
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
