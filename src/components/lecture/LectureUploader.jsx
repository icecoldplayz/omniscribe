import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, Mic, Type, X, CheckCircle2, Brain, Network } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uploadAndTranscribe, processLecture } from '@/lib/lectureProcessor';

// Two separate step lists: audio uploads go through 4 stages, but pasted
// transcripts skip the upload/transcribe stages entirely since there's no
// audio involved. Previously a single fixed STEPS array was always
// rendered in full, so text-mode uploads showed "Uploading audio" and
// "Transcribing lecture" sitting there dimmed even though neither ever ran.
const AUDIO_STEPS = [
  { id: 'upload', label: 'Uploading audio', icon: Upload },
  { id: 'transcribe', label: 'Transcribing lecture', icon: Mic },
  { id: 'analyze', label: 'Extracting concepts & knowledge graph', icon: Brain },
  { id: 'build', label: 'Building quizzes & timeline', icon: Network },
];

const TEXT_STEPS = [
  { id: 'analyze', label: 'Extracting concepts & knowledge graph', icon: Brain },
  { id: 'build', label: 'Building quizzes & timeline', icon: Network },
];

export default function LectureUploader({ user, onClose }) {
  const [mode, setMode] = useState('text');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const steps = mode === 'audio' ? AUDIO_STEPS : TEXT_STEPS;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleProcess = async () => {
    if (!title.trim()) { setError('Please enter a lecture title'); return; }
    if (mode === 'text' && !text.trim()) { setError('Please paste the lecture transcript'); return; }
    if (mode === 'audio' && !file) { setError('Please upload an audio file'); return; }

    setError('');
    setProcessing(true);

    try {
      const { data: lecture, error: createError } = await supabase
        .from('lectures')
        .insert({
          title: title.trim(),
          subject: subject.trim(),
          processing_status: 'pending',
          user_id: user?.id,
        })
        .select()
        .single();
      if (createError) throw createError;

      let transcript = '';
      let audioUrl = '';
      let segments = null;

      if (mode === 'audio') {
        setCurrentStep(0); // Uploading audio
        const result = await uploadAndTranscribe(file);
        transcript = result.transcript;
        audioUrl = result.audio_url;
        segments = result.segments;
        setCurrentStep(1); // Transcribing lecture
        setCurrentStep(2); // Extracting concepts & knowledge graph
      } else {
        transcript = text.trim();
        setCurrentStep(0); // Extracting concepts & knowledge graph (first step in TEXT_STEPS)
      }

// Pass whether this lecture has real audio/timing behind it, and the raw
// Whisper segments, so the extraction step can ground timestamps in real
// data instead of guessing.
      const data = await processLecture(lecture.id, transcript, title.trim(), subject.trim(), audioUrl, mode === 'audio', segments);
      setCurrentStep(steps.length - 1); // Building quizzes & timeline (final step)

      setTimeout(() => {
        navigate(`/lecture/${lecture.id}`);
      }, 1200);
    } catch (e) {
      setError(e.message || 'Failed to process lecture. Please try again.');
      setProcessing(false);
      setCurrentStep(-1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !processing) onClose?.(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">New Lecture</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Upload audio or paste a transcript to begin</p>
          </div>
          {!processing && (
            <button onClick={() => onClose?.()} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {!processing && currentStep < 0 && (
            <>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setMode('text')}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    mode === 'text' ? 'border-primary bg-primary/10 glow-sm-primary' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Type className="w-5 h-5" />
                  <span className="text-sm font-medium">Paste Transcript</span>
                </button>
                <button
                  onClick={() => setMode('audio')}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    mode === 'audio' ? 'border-primary bg-primary/10 glow-sm-primary' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  <span className="text-sm font-medium">Upload Audio</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Lecture Title</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Introduction to Photosynthesis" className="bg-secondary/50 mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="subject">Subject (optional)</Label>
                  <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Biology, Physics, Computer Science" className="bg-secondary/50 mt-1.5" />
                </div>

                {mode === 'text' && (
                  <div>
                    <Label htmlFor="text">Lecture Transcript</Label>
                    <Textarea
                      id="text"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Paste the full lecture transcript here..."
                      className="bg-secondary/50 mt-1.5 min-h-[200px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">The AI will extract concepts, build a knowledge graph, generate quizzes, and detect confusion points — all from this text.</p>
                  </div>
                )}

                {mode === 'audio' && (
                  <div>
                    <Label>Audio File</Label>
                    <label className="flex flex-col items-center justify-center gap-2 p-8 mt-1.5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-all">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {file ? file.name : 'Click to upload audio (mp3, wav, m4a)'}
                      </span>
                      <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button onClick={handleProcess} className="w-full bg-primary glow-primary hover:glow-primary text-base py-6">
                  <Brain className="w-5 h-5 mr-2" />
                  Process Lecture
                </Button>
              </div>
            </>
          )}

          {processing && (
            <div className="py-8">
              <div className="space-y-3">
                {steps.map((step, i) => {
                  const isDone = i < currentStep;
                  const isActive = i === currentStep;
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isActive ? 'border-primary/40 bg-primary/5' : isDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border opacity-40'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isDone ? 'bg-emerald-500/20' : isActive ? 'bg-primary/20' : 'bg-secondary'
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : isActive ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDone ? 'text-emerald-400' : isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-muted-foreground mt-0.5"
                          >
                            Analyzing lecture content with AI...
                          </motion.p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
