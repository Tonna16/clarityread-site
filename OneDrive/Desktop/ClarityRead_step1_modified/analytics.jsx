import React, { useState, useEffect } from "react";
import { ReadingSession, UserPreferences } from "@/entities/all";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Target,
  Calendar,
  Zap,
  BookMarked
} from "lucide-react";
import { format, subDays } from "date-fns";

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Analytics() {
  const [sessions, setSessions] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateStats = (sessionData) => {
      const totalSessions = sessionData.length;
      const totalWords = sessionData.reduce((sum, s) => sum + (s.word_count || 0), 0);
      const totalMinutes = sessionData.reduce((sum, s) => sum + (s.reading_time_minutes || 0), 0);
      const avgWPM = sessionData.length > 0 
        ? Math.round(sessionData.reduce((sum, s) => sum + (s.reading_speed_wpm || 0), 0) / sessionData.length)
        : 0;

      // Last 7 days data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        const dayData = sessionData.filter(s => 
          format(new Date(s.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        return {
          date: format(date, 'MMM dd'),
          sessions: dayData.length,
          minutes: dayData.reduce((sum, s) => sum + (s.reading_time_minutes || 0), 0),
          words: dayData.reduce((sum, s) => sum + (s.word_count || 0), 0)
        };
      }).reverse();

      // Voice usage stats
      const voiceUsage = {};
      sessionData.forEach(s => {
        const voice = s.voice_used || 'Default';
        voiceUsage[voice] = (voiceUsage[voice] || 0) + 1;
      });

      const voiceData = Object.entries(voiceUsage).map(([name, value]) => ({ name, value }));

      setStats({
        totalSessions,
        totalWords,
        totalMinutes,
        avgWPM,
        last7Days,
        voiceData
      });
    };
    
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const user = await User.me();
        const sessionData = await ReadingSession.filter({ created_by: user.email }, '-created_date');
        const prefData = await UserPreferences.filter({ created_by: user.email });
        
        setSessions(sessionData);
        setPreferences(prefData[0] || null);
        calculateStats(sessionData);
      } catch (error) {
        console.error("Error loading analytics:", error);
      }
      setLoading(false);
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)] text-center p-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <BookMarked className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Reading Data Yet</h2>
        <p className="text-slate-600 max-w-md mb-6">
          It looks like you haven't completed any reading sessions. Head over to the reader to get started and see your progress here!
        </p>
        <Link to={createPageUrl("Reader")}>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg">
            Start Reading Now
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Reading Analytics</h1>
          <p className="text-slate-600">Track your reading progress and insights</p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <BookOpen className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Reading sessions completed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Words Read</CardTitle>
                <Zap className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalWords?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total words processed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                <Clock className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(stats.totalMinutes || 0)}m</div>
                <p className="text-xs text-muted-foreground">
                  Minutes of reading
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Speed</CardTitle>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgWPM} WPM</div>
                <p className="text-xs text-muted-foreground">
                  Words per minute
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Charts */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Reading Activity Chart */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Last 7 Days Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.last7Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="minutes" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Minutes"
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Voice Usage Chart */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Voice Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.voiceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.voiceData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Recent Sessions */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-500" />
                Recent Reading Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.slice(0, 5).map((session, index) => (
                  <motion.div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div>
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-slate-600">
                        {session.word_count} words • {Math.round(session.reading_time_minutes || 0)} minutes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{session.reading_speed_wpm} WPM</p>
                      <p className="text-sm text-slate-600">
                        {format(new Date(session.created_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
