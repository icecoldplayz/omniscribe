import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, Lightbulb, Trophy, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const DIFFICULTY_COLORS = {
  easy: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  medium: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  hard: 'border-red-500/30 text-red-400 bg-red-500/10',
};

export default function QuizPanel({ lecture, concepts, onMasteryUpdate }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    setLoading(true);
    const { data: qs, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('lecture_id', lecture.id);
    if (!error) setQuestions(qs);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredCount(0);
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, [lecture.id]);

  const handleAnswer = async (index) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    const q = questions[currentIndex];
    const isCorrect = index === q.correct_answer_index;
    if (isCorrect) setScore(s => s + 1);
    setAnsweredCount(c => c + 1);

    if (q.targeted_concept) {
      const concept = concepts.find(c => c.name === q.targeted_concept);
      if (concept) {
        let newMastery = concept.mastery_level;
        if (isCorrect) {
          if (concept.mastery_level === 'unknown' || concept.mastery_level === 'weak') newMastery = 'partial';
          else if (concept.mastery_level === 'partial') newMastery = 'mastered';
        } else {
          if (concept.mastery_level === 'mastered') newMastery = 'partial';
          else newMastery = 'weak';
        }
        if (newMastery !== concept.mastery_level) {
          await supabase
            .from('concepts')
            .update({ mastery_level: newMastery })
            .eq('id', concept.id);
          onMasteryUpdate?.();
        }
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No quiz questions available for this lecture.</p>
      </div>
    );
  }

  const q = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isComplete = isLastQuestion && showExplanation;

  return (
    <div className="max-w-2xl mx-auto p-6 h-full overflow-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-amber-400">{score}/{answeredCount}</span>
          </div>
        </div>
        <Progress value={(currentIndex + (showExplanation ? 1 : 0)) / questions.length * 100} className="h-1.5" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <div className="flex items-center gap-2 mb-4">
            {q.difficulty && (
              <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.medium}`}>
                {q.difficulty}
              </span>
            )}
            {q.targeted_concept && (
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                {q.targeted_concept}
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-medium mb-6 leading-relaxed">{q.question}</h3>

          <div className="space-y-3">
            {q.options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === q.correct_answer_index;
              const showResult = showExplanation;

              let className = 'border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50';
              if (showResult && isCorrect) {
                className = 'border-emerald-500 bg-emerald-500/10';
              } else if (showResult && isSelected && !isCorrect) {
                className = 'border-red-500 bg-red-500/10';
              } else if (isSelected) {
                className = 'border-primary bg-primary/10';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showExplanation}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${className} ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="text-sm">{option}</span>
                  {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <div className="mt-4 glass rounded-xl p-4 border-l-2 border-accent">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${selectedAnswer === q.correct_answer_index ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedAnswer === q.correct_answer_index ? 'Correct!' : 'Not quite — here\'s why:'}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                </div>

                {!isComplete && (
                  <Button onClick={handleNext} className="w-full mt-4 bg-primary glow-primary">
                    Next Question <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}

                {isComplete && (
                  <div className="text-center mt-6 py-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-8 h-8 text-amber-400" />
                    </div>
                    <p className="text-3xl font-bold text-gradient mb-1">{score}/{questions.length}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {score === questions.length ? 'Perfect score!' : score >= questions.length / 2 ? 'Good job!' : 'Keep practicing!'}
                    </p>
                    <Button onClick={loadQuestions} variant="outline" className="border-primary/30 hover:bg-primary/10">
                      <RefreshCw className="w-4 h-4 mr-1.5" /> Retry Quiz
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}