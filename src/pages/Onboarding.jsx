import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Brain, ChevronRight, BookOpen, Eye, Sparkles, Dumbbell, Gamepad2, Zap, FlaskConical, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LEVELS = [
  { id: 'middle_school', label: 'Middle School', icon: BookOpen },
  { id: 'high_school', label: 'High School', icon: BookOpen },
  { id: 'college', label: 'College', icon: FlaskConical },
  { id: 'engineer', label: 'Engineer', icon: Zap },
];

const STYLES = [
  { id: 'default', label: 'Clear & Concise', icon: Sparkles },
  { id: 'visual', label: 'Visual Learner', icon: Eye },
  { id: 'story', label: 'Story-based', icon: Sparkles },
  { id: 'sports', label: 'Sports Analogy', icon: Dumbbell },
  { id: 'video_game', label: 'Video Game', icon: Gamepad2 },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState('');
  const [style, setStyle] = useState('default');
  const [interests, setInterests] = useState('');
  const [examDate, setExamDate] = useState('');
  const [saving, setSaving] = useState(false);

  const steps = [
    { title: 'What\'s your level?', subtitle: 'We\'ll adapt explanations to match your understanding.' },
    { title: 'How do you learn best?', subtitle: 'The AI tutor will use this style by default.' },
    { title: 'What are your interests?', subtitle: 'Used to create personalized analogies and metaphors.' },
    { title: 'Got an exam coming up?', subtitle: 'We\'ll build an adaptive study plan around it.' },
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      setSaving(true);
      try {
        // Custom profile fields live in user_metadata on Supabase (there's
        // no separate "updateMe" call). AuthContext flattens this back
        // onto the `user` object it exposes, so the rest of the app
        // (e.g. user?.learning_level) keeps working unchanged.
        const { error } = await supabase.auth.updateUser({
          data: {
            learning_level: level,
            learning_style: style,
            interests: interests.split(',').map(s => s.trim()).filter(Boolean),
            exam_date: examDate || null,
            onboarding_complete: true,
          },
        });
        if (error) throw error;
        window.location.href = '/';
      } catch (e) {
        setSaving(false);
      }
    }
  };

  const canProceed = step === 0 ? !!level : step === 1 ? !!style : step === 2 ? true : true;

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 glow-primary">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">OmniScribe AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Let's personalize your learning experience</p>
        </motion.div>

        <div className="flex gap-1.5 mb-6 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${i <= step ? 'bg-primary w-12' : 'bg-secondary w-6'}`}
            />
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold mb-1">{steps[step].title}</h2>
              <p className="text-sm text-muted-foreground mb-6">{steps[step].subtitle}</p>

              {step === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {LEVELS.map(lvl => {
                    const Icon = lvl.icon;
                    return (
                      <button
                        key={lvl.id}
                        onClick={() => setLevel(lvl.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          level === lvl.id
                            ? 'border-primary bg-primary/10 glow-sm-primary'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{lvl.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-2">
                  {STYLES.map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          style === s.id
                            ? 'border-primary bg-primary/10 glow-sm-primary'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium flex-1 text-left">{s.label}</span>
                        {style === s.id && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && (
                <div>
                  <Label htmlFor="interests">Your interests & hobbies</Label>
                  <Input
                    id="interests"
                    value={interests}
                    onChange={e => setInterests(e.target.value)}
                    placeholder="e.g. soccer, video games, music, cooking, space..."
                    className="bg-secondary/50 mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    The AI tutor will use these to create memorable analogies. Separate with commas.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div>
                  <Label htmlFor="exam">Exam date (optional)</Label>
                  <Input
                    id="exam"
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="bg-secondary/50 mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    We'll generate an adaptive study plan targeting your weak concepts.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <Button
            onClick={handleNext}
            disabled={!canProceed || saving}
            className="w-full mt-6 bg-primary glow-primary"
          >
            {saving ? 'Saving...' : step === steps.length - 1 ? 'Get Started' : 'Continue'}
            {!saving && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>

        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
