import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Type, 
  Palette, 
  Eye, 
  Target,
  Moon,
  Sun,
  Contrast,
  Coffee
} from "lucide-react";

const themeIcons = {
  light: Sun,
  dark: Moon,
  'high-contrast': Contrast,
  sepia: Coffee
};

export default function ReadingSettings({ preferences, updatePreferences }) {
  return (
    <Card className="shadow-lg h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="w-5 h-5 text-blue-500" />
          Reading Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Settings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-blue-500" />
            <label className="text-sm font-medium text-slate-700">Font Family</label>
          </div>
          <Select
            value={preferences?.font_family || "system"}
            onValueChange={(value) => updatePreferences({ font_family: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System Default</SelectItem>
              <SelectItem value="dyslexie">Dyslexie (Dyslexia Friendly)</SelectItem>
              <SelectItem value="opendyslexic">OpenDyslexic</SelectItem>
              <SelectItem value="comic-sans">Comic Sans MS</SelectItem>
              <SelectItem value="arial">Arial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Font Size: {preferences?.font_size || 18}px
          </label>
          <Slider
            value={[preferences?.font_size || 18]}
            onValueChange={([value]) => updatePreferences({ font_size: value })}
            min={12}
            max={32}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Line Height: {preferences?.line_height?.toFixed(1) || "1.6"}
          </label>
          <Slider
            value={[preferences?.line_height || 1.6]}
            onValueChange={([value]) => updatePreferences({ line_height: value })}
            min={1.0}
            max={2.5}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Theme Settings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-blue-500" />
            <label className="text-sm font-medium text-slate-700">Display Theme</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(themeIcons).map(([theme, IconComponent]) => (
              <button
                key={theme}
                onClick={() => updatePreferences({ theme })}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  preferences?.theme === theme
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">
                  {theme.replace('-', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Highlight Color */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Highlight Color
          </label>
          <Input
            type="color"
            value={preferences?.highlight_color || "#3b82f6"}
            onChange={(e) => updatePreferences({ highlight_color: e.target.value })}
            className="w-full h-10"
          />
        </div>

        {/* Auto Scroll */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            <label className="text-sm font-medium text-slate-700">Auto Scroll</label>
          </div>
          <Switch
            checked={preferences?.auto_scroll || true}
            onCheckedChange={(checked) => updatePreferences({ auto_scroll: checked })}
          />
        </div>

        {/* Reading Goals */}
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Reading Goals</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                Daily minutes: {preferences?.reading_goals?.daily_minutes || 30}
              </label>
              <Slider
                value={[preferences?.reading_goals?.daily_minutes || 30]}
                onValueChange={([value]) => updatePreferences({ 
                  reading_goals: { 
                    ...preferences?.reading_goals,
                    daily_minutes: value 
                  }
                })}
                min={10}
                max={120}
                step={5}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                Weekly sessions: {preferences?.reading_goals?.weekly_sessions || 5}
              </label>
              <Slider
                value={[preferences?.reading_goals?.weekly_sessions || 5]}
                onValueChange={([value]) => updatePreferences({ 
                  reading_goals: { 
                    ...preferences?.reading_goals,
                    weekly_sessions: value 
                  }
                })}
                min={1}
                max={14}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
