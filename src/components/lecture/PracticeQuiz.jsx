import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PracticeQuiz({ quiz, onRetry }) {
  // quiz = { title, questions: [{ question, options, correct_answer_index, explanation, difficulty }] }
  const [answers, setAnswers] = useState({}); // { [questionIndex]: selectedOptionIndex }
  const [submitted, setSubmitted] = useState(false);

  if (!quiz || !quiz.questions?.length) {
    return (
      <div className="glass rounded-xl p-4 text-sm text-muted-foreground">
        Couldn't generate practice questions from this lecture. Try rephrasing your request.
      </div>
    );
  }

  const total = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  const selectAnswer = (qIndex, optIndex) => {
    if (submitted) return; // locked once graded
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  const score = submitted
    ? quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_answer_index ? 1 : 0), 0)
    : 0;

  return (
    <div className="glass-strong rounded-2xl p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{quiz.title || 'Practice Quiz'}</h3>
        {!submitted && (
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{total} answered
          </span>
        )}
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground">Your score</p>
            <p className="text-2xl font-bold text-primary">{score}/{total}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> New set
          </Button>
        </motion.div>
      )}

      <div className="space-y-6">
        {quiz.questions.map((q, qi) => {
          const selected = answers[qi];
          const isCorrect = submitted && selected === q.correct_answer_index;
          const isWrong = submitted && selected !== undefined && selected !== q.correct_answer_index;

          return (
            <div key={qi} className="space-y-2.5">
              <p className="font-medium text-sm">
                <span className="text-muted-foreground">{qi + 1}.</span> {q.question}
              </p>
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const isSelected = selected === oi;
                  const isCorrectOption = submitted && oi === q.correct_answer_index;

                  let stateClasses = 'border-white/10 hover:border-white/20';
                  if (submitted) {
                    if (isCorrectOption) stateClasses = 'border-emerald-400/50 bg-emerald-400/10';
                    else if (isSelected && !isCorrectOption) stateClasses = 'border-red-400/50 bg-red-400/10';
                  } else if (isSelected) {
                    stateClasses = 'border-primary/60 bg-primary/10';
                  }

                  return (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={submitted}
                      className={`text-left text-sm rounded-lg border px-3 py-2 transition-colors flex items-center justify-between gap-2 ${stateClasses} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span>{opt}</span>
                      {submitted && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {submitted && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {submitted && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3 leading-relaxed"
                  >
                    {q.explanation}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full bg-primary glow-primary"
        >
          {allAnswered ? 'Submit answers' : `Answer all ${total} questions to submit`}
        </Button>
      )}
    </div>
  );
}