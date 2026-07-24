import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, TrendingUp, Target, Loader2, AlertCircle } from 'lucide-react';
import { generateStudyPlan } from '@/lib/lectureProcessor';
import { Button } from '@/components/ui/button';

export default function StudyPlanner({ lecture, concepts, examDate }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateStudyPlan(concepts, examDate, lecture.title);
      setPlan(result);
    } catch (e) {
      setError(e.message || 'Failed to generate study plan');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (concepts.length > 0 && examDate && !plan && !loading) {
      generate();
    }
  }, [concepts.length, examDate]);

  if (!examDate) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Calendar className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
        <p className="text-muted-foreground mb-1">No exam date set</p>
        <p className="text-sm text-muted-foreground">Set your exam date in onboarding to get a personalized study plan.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm text-muted-foreground">Generating your adaptive study plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertCircle className="w-8 h-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <Button onClick={generate} variant="outline" className="border-primary/30">Retry</Button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Target className="w-12 h-12 text-primary mb-3" />
        <Button onClick={generate} className="bg-primary glow-primary">Generate Study Plan</Button>
      </div>
    );
  }

  const daysUntil = Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="p-6 h-full overflow-auto max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Current Readiness</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{plan.current_readiness || 0}%</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Projected Readiness</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{plan.projected_readiness || 0}%</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Total Study Time</span>
          </div>
          <p className="text-3xl font-bold text-accent">{plan.total_study_hours || 0}h</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{daysUntil} days until exam</h3>
      </div>

      <div className="space-y-3">
        {(plan.daily_sessions || []).map((session, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-xl p-4 flex items-start gap-4"
          >
            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/15 flex-shrink-0">
              <span className="text-lg font-bold text-primary">{session.day || i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-accent" />
                <span className="text-sm font-medium">{session.duration_minutes} min</span>
                {session.date && <span className="text-xs text-muted-foreground">{session.date}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{session.activity}</p>
              {session.focus_concepts && session.focus_concepts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {session.focus_concepts.map((c, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}