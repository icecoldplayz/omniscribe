import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Plus, BookOpen, Brain, AlertTriangle, ChevronRight, Loader2, Sparkles, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LectureUploader from '@/components/lecture/LectureUploader';
 
export default function Home() {
  const { user } = useOutletContext();
  const { isGuest } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // lecture pending delete confirmation
  const [deletingId, setDeletingId] = useState(null);
 
  useEffect(() => {
    loadLectures();
  }, []);
 
  const loadLectures = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLectures(data || []);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };
 
  // Guests get a real Supabase session, so nothing technically stops a
  // write — but we don't want guest lectures actually persisting. Rather
  // than letting them create one and quietly losing it, we intercept the
  // "New Lecture" action here and point them at sign-up instead.
  const handleNewLectureClick = () => {
    if (isGuest) {
      setShowGuestPrompt(true);
    } else {
      setShowUploader(true);
    }
  };
 
  const handleDelete = async (lecture) => {
    setDeletingId(lecture.id);
    try {
      // Concepts and quiz_questions reference lecture_id — delete those first
      // to avoid foreign-key violations, then delete the lecture itself.
      await supabase.from('concepts').delete().eq('lecture_id', lecture.id);
      await supabase.from('quiz_questions').delete().eq('lecture_id', lecture.id);
      const { error } = await supabase.from('lectures').delete().eq('id', lecture.id);
      if (error) throw error;
      setLectures(prev => prev.filter(l => l.id !== lecture.id));
    } catch (e) {
      console.error('Failed to delete lecture:', e);
      alert('Could not delete this lecture. Please try again.');
    }
    setDeletingId(null);
    setDeleteTarget(null);
  };
 
  return (
    <div className="min-h-full">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="text-sm text-accent font-medium">Welcome back, {(user?.full_name || 'student').split(' ')[0]}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Your <span className="text-gradient">Learning Universe</span>
          </h1>
          <p className="text-muted-foreground">Upload a lecture and let OmniScribe build your personalized knowledge graph, tutor, and study plan.</p>
        </motion.div>
 
        {isGuest && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
          >
            <UserRound className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200/90 flex-1">
              You're browsing as a guest. Lectures won't be saved this session —{' '}
              <Link to="/register" className="underline font-medium hover:text-amber-100">
                create a free account
              </Link>{' '}
              to keep your progress.
            </p>
          </motion.div>
        )}
 
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-8 grid-bg relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Start a New Session</h2>
              <p className="text-sm text-muted-foreground">Upload audio or paste a transcript — the AI handles the rest.</p>
            </div>
            <Button onClick={handleNewLectureClick} className="bg-primary glow-primary text-base px-6 py-5">
              <Plus className="w-5 h-5 mr-1.5" />
              New Lecture
            </Button>
          </div>
        </motion.div>
 
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Your Lectures
          </h2>
        </div>
 
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : lectures.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No lectures yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Upload your first lecture to get started.</p>
            <Button onClick={handleNewLectureClick} className="bg-primary glow-primary">
              <Plus className="w-4 h-4 mr-1.5" /> Create Lecture
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lectures.map((lec, i) => (
              <motion.div
                key={lec.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative group"
              >
                <Link to={`/lecture/${lec.id}`} className="block glass rounded-xl p-5 hover:glass-strong hover:glow-sm-primary transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      {lec.processing_status === 'ready' ? (
                        <BookOpen className="w-5 h-5 text-primary" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-accent animate-spin" />
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold mb-1 line-clamp-1 pr-6">{lec.title}</h3>
                  {lec.subject && <p className="text-xs text-muted-foreground mb-2">{lec.subject}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {lec.processing_status === 'ready' ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Brain className="w-3 h-3" /> Ready
                        </span>
                        {lec.confusion_alerts?.length > 0 && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <AlertTriangle className="w-3 h-3" /> {lec.confusion_alerts.length}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-accent">
                        <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                      </span>
                    )}
                  </div>
                </Link>
 
                {/* Delete button — sits on top of the card, stops the click from
                    triggering the Link navigation underneath it */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget(lec);
                  }}
                  className="absolute top-5 right-5 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  aria-label="Delete lecture"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
 
      {showUploader && !isGuest && (
        <LectureUploader user={user} onClose={() => { setShowUploader(false); loadLectures(); }} />
      )}
 
      {/* Guest sign-up prompt — shown instead of the uploader when a guest tries to create a lecture */}
      <AnimatePresence>
        {showGuestPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGuestPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 max-w-sm w-full text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                <UserRound className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create a free account</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Guest sessions don't save lectures, so nothing you upload here will stick around. Create a free account to build your knowledge graph and keep your study plan.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setShowGuestPrompt(false)}>
                  Maybe later
                </Button>
                <Link to="/register">
                  <Button className="bg-primary glow-primary">Create account</Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => !deletingId && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Delete lecture?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete "<span className="text-foreground">{deleteTarget.title}</span>" along with its concepts, quiz questions, and study data. This can't be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={!!deletingId}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={!!deletingId}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}