import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SummaryPanel({ 
  summary, 
  isGenerating, 
  onGenerate, 
  hasContent 
}) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!summary && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-slate-600 mb-4">
              Generate an AI-powered summary of your text to quickly understand the key points.
            </p>
            <Button
              onClick={onGenerate}
              disabled={!hasContent}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Summary
            </Button>
          </motion.div>
        )}

        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-slate-600">
              Analyzing your text and generating summary...
            </p>
          </motion.div>
        )}

        {summary && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
            </div>
            <Button
              onClick={onGenerate}
              variant="outline"
              className="w-full"
              disabled={!hasContent}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Regenerate Summary
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
