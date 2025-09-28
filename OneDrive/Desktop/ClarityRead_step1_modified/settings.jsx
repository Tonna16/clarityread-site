import React, { useState, useEffect } from "react";
import { UserPreferences, ReadingSession } from "@/entities/all";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Bell, 
  Shield,
  Trash2,
  Download,
  RefreshCw
} from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function Settings() {
  const [preferences, setPreferences] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      let prefs = await UserPreferences.filter({ created_by: userData.email });
      if (prefs.length > 0) {
        setPreferences(prefs[0]);
      } else {
        const newPrefs = await UserPreferences.create({});
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setLoading(false);
  };

  const updatePreferences = async (updates) => {
    if (!preferences) return;
    
    try {
      const updated = await UserPreferences.update(preferences.id, updates);
      setPreferences(updated);
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const handleNotificationChange = (key, value) => {
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    });
  };

  const exportData = async () => {
    const sessions = await ReadingSession.filter({ created_by: user.email });
    const dataToExport = {
      preferences,
      sessions,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clarity-read-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetSettings = async () => {
    if (!preferences) return;
    
    const defaultSettings = UserPreferences.schema().properties;
    const resetData = {
      font_family: defaultSettings.font_family.default,
      font_size: defaultSettings.font_size.default,
      line_height: defaultSettings.line_height.default,
      theme: defaultSettings.theme.default,
      voice_rate: defaultSettings.voice_rate.default,
      voice_pitch: defaultSettings.voice_pitch.default,
      highlight_color: defaultSettings.highlight_color.default,
      auto_scroll: defaultSettings.auto_scroll.default,
      reading_goals: {
        daily_minutes: 30,
        weekly_sessions: 5
      },
      notifications: {
        daily_reminder_enabled: false,
        weekly_summary_enabled: false
      }
    };
    
    await updatePreferences(resetData);
  };

  const deleteAllData = async () => {
    const sessions = await ReadingSession.filter({ created_by: user.email });
    await Promise.all(sessions.map(s => ReadingSession.delete(s.id)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account and reading preferences</p>
        </motion.div>

        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Account Information */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-500" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={user?.full_name || ""} disabled className="bg-slate-50"/>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ""} disabled className="bg-slate-50"/>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-green-500" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Reading Reminders</p>
                    <p className="text-sm text-slate-500">Get reminded to reach your daily reading goal</p>
                  </div>
                  <Switch 
                    checked={preferences?.notifications?.daily_reminder_enabled || false}
                    onCheckedChange={(checked) => handleNotificationChange('daily_reminder_enabled', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Progress Updates</p>
                    <p className="text-sm text-slate-500">Weekly summaries of your reading progress</p>
                  </div>
                  <Switch 
                    checked={preferences?.notifications?.weekly_summary_enabled || false}
                    onCheckedChange={(checked) => handleNotificationChange('weekly_summary_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy & Data */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  Privacy & Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Export Your Data</p>
                    <p className="text-sm text-slate-500">Download all your reading sessions and preferences</p>
                  </div>
                  <Button onClick={exportData} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Reset All Settings</p>
                    <p className="text-sm text-slate-500">Restore all reading preferences to their defaults</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
                        <RefreshCw className="w-4 h-4 mr-2" /> Reset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset all your reading and voice settings to their original defaults. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetSettings} className="bg-red-600 hover:bg-red-700">Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Delete All Reading Data</p>
                    <p className="text-sm text-slate-500">Permanently delete all your saved reading sessions.</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your reading session history, including analytics data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAllData} className="bg-red-600 hover:bg-red-700">Yes, delete everything</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
