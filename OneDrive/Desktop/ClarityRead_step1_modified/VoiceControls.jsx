import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, Gauge, Music } from "lucide-react";

export default function VoiceControls({
  preferences,
  updatePreferences,
  availableVoices,
  isReading
}) {
  const testVoice = () => {
    const utterance = new SpeechSynthesisUtterance("This is how your selected voice sounds.");
    
    if (preferences?.voice_name) {
      const voice = availableVoices.find(v => v.name === preferences.voice_name);
      if (voice) utterance.voice = voice;
    }
    
    utterance.rate = preferences?.voice_rate || 1.0;
    utterance.pitch = preferences?.voice_pitch || 1.0;
    
    speechSynthesis.speak(utterance);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Volume2 className="w-5 h-5 text-blue-500" />
          Voice Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Voice Selection
          </label>
          <Select
            value={preferences?.voice_name || ""}
            onValueChange={(value) => updatePreferences({ voice_name: value })}
            disabled={isReading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a voice" />
            </SelectTrigger>
            <SelectContent>
              {availableVoices.map((voice) => (
                <SelectItem key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-blue-500" />
            <label className="text-sm font-medium text-slate-700">
              Speaking Rate: {preferences?.voice_rate?.toFixed(1) || "1.0"}x
            </label>
          </div>
          <Slider
            value={[preferences?.voice_rate || 1.0]}
            onValueChange={([value]) => updatePreferences({ voice_rate: value })}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
            disabled={isReading}
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Slow (0.5x)</span>
            <span>Fast (2.0x)</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-4 h-4 text-blue-500" />
            <label className="text-sm font-medium text-slate-700">
              Voice Pitch: {preferences?.voice_pitch?.toFixed(1) || "1.0"}
            </label>
          </div>
          <Slider
            value={[preferences?.voice_pitch || 1.0]}
            onValueChange={([value]) => updatePreferences({ voice_pitch: value })}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
            disabled={isReading}
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Low (0.5)</span>
            <span>High (2.0)</span>
          </div>
        </div>

        <Button
          onClick={testVoice}
          variant="outline"
          className="w-full"
          disabled={isReading}
        >
          <Volume2 className="w-4 h-4 mr-2" />
          Test Voice
        </Button>
      </CardContent>
    </Card>
  );
}
