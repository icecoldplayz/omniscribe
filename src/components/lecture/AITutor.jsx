import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Brain, Zap, Target, Sparkles, BookOpen, Gamepad2, Trophy, Dumbbell, Eye, FlaskConical, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { askTutor, generatePracticeQuiz } from '@/lib/lectureProcessor';
import PracticeQuiz from './PracticeQuiz';

const LEARNING_STYLES = [
  { id: 'default', label: 'Default', icon: Sparkles },
  { id: 'middle_school', label: 'Middle School', icon: BookOpen },
  { id: 'high_school', label: 'High School', icon: BookOpen },
  { id: 'college', label: 'College', icon: FlaskConical },
  { id: 'engineer', label: 'Engineer', icon: Zap },
  { id: 'visual', label: 'Visual', icon: Eye },
  { id: 'story', label: 'Story', icon: Sparkles },
  { id: 'sports', label: 'Sports', icon: Dumbbell },
  { id: 'video_game', label: 'Game', icon: Gamepad2 },
];

// Loose keyword match for "give me practice questions" style requests.
// Good enough to start; tighten later if it over/under-triggers.
const isPracticeRequest = (text) => {
  const t = text.toLowerCase();
  return /practice|quiz me|quiz on|give me.*question|test me|questions to practice/.test(t);
};

export default function AITutor({ lecture, userPrefs }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState(userPrefs?.learning_style || 'default');
  const [challengeMode, setChallengeMode] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const runPracticeQuiz = async (requestText) => {
    const quiz = await generatePracticeQuiz(lecture.transcript, requestText, 10);
    setMessages(prev => [...prev, { role: 'assistant', type: 'quiz', quiz }]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    // Practice-quiz requests skip askTutor entirely and render a quiz widget instead.
    if (isPracticeRequest(currentInput)) {
      try {
        await runPracticeQuiz(currentInput);
      } catch (e) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I couldn't generate practice questions just now. Please try again.",
        }]);
      }
      setLoading(false);
      return;
    }

    try {
      const result = await askTutor(
        lecture.transcript,
        currentInput,
        messages,
        style,
        userPrefs?.learning_level,
        userPrefs?.interests || [],
        challengeMode
      );

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.answer,
        confidence_level: result.confidence_level,
        confidence_reason: result.confidence_reason,
        learning_style: style,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error processing your question. Please try again.',
      }]);
    }
    setLoading(false);
  };

  const handleRetryQuiz = async (messageIndex, originalTopic) => {
    setLoading(true);
    try {
      const quiz = await generatePracticeQuiz(lecture.transcript, originalTopic, 10);
      setMessages(prev => {
        const next = [...prev];
        next[messageIndex] = { role: 'assistant', type: 'quiz', quiz };
        return next;
      });
    } catch (e) {
      // leave the old quiz in place if regeneration fails
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-border">
        {LEARNING_STYLES.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                style === s.id
                  ? 'bg-primary text-primary-foreground glow-sm-primary'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="w-3 h-3" />
              {s.label}
            </button>
          );
        })}
        <button
          onClick={() => setChallengeMode(!challengeMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ml-auto ${
            challengeMode
              ? 'bg-accent text-accent-foreground glow-sm-accent'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Swords className="w-3 h-3" />
          Challenge Mode
        </button>
      </div>

      {challengeMode && (
        <div className="px-4 py-2 bg-accent/5 border-b border-accent/20">
          <p className="text-xs text-accent flex items-center gap-1.5">
            <Swords className="w-3 h-3" />
            Socratic mode active — the tutor will guide you to answers instead of giving them directly.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 animate-float">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Your AI Tutor</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ask anything about this lecture. I answer only from the lecture material — no hallucinations.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-md">
              {['Explain the main concepts', 'What are the key takeaways?', 'Give me an analogy for the hardest concept', 'Give me practice questions'].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.type === 'quiz') {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start w-full"
              >
                <div className="max-w-[95%] w-full">
                  <PracticeQuiz
                    quiz={msg.quiz}
                    onRetry={() => handleRetryQuiz(i, msg.quiz.title)}
                  />
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-primary/15 border border-primary/30'
                  : 'glass'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">OmniScribe</span>
                    {msg.learning_style && msg.learning_style !== 'default' && (
                      <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                        {LEARNING_STYLES.find(s => s.id === msg.learning_style)?.label}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.confidence_level != null && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Your Understanding</span>
                      <span className="text-xs font-mono font-bold text-accent">{msg.confidence_level}%</span>
                    </div>
                    <Progress value={msg.confidence_level} className="h-1.5 bg-secondary" />
                    {msg.confidence_reason && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                        <span className="text-accent mt-0.5">↳</span>
                        {msg.confidence_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl p-4">
              <div className="flex gap-1.5">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about this lecture, or say 'give me practice questions'..."
            className="resize-none bg-secondary/50 border-border min-h-[44px] max-h-32"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-primary glow-primary hover:bg-primary/90 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}