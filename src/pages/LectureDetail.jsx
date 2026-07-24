import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Network, Clock, Brain, ListChecks, TrendingUp, AlertTriangle, Loader2, ArrowLeft, Calendar } from 'lucide-react';
import KnowledgeGraph from '@/components/lecture/KnowledgeGraph';
import TimelineReplay from '@/components/lecture/TimelineReplay';
import AITutor from '@/components/lecture/AITutor';
import QuizPanel from '@/components/lecture/QuizPanel';
import MasteryTree from '@/components/lecture/MasteryTree';
import StudyPlanner from '@/components/lecture/StudyPlanner';
import ConfusionAlerts from '@/components/lecture/ConfusionAlerts';
import ConceptDetail from '@/components/lecture/ConceptDetail';

const TABS = [
  { id: 'graph', label: 'Knowledge Graph', icon: Network },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'tutor', label: 'AI Tutor', icon: Brain },
  { id: 'quiz', label: 'Quiz', icon: ListChecks },
  { id: 'mastery', label: 'Mastery', icon: TrendingUp },
  { id: 'confusion', label: 'Confusion', icon: AlertTriangle },
  { id: 'planner', label: 'Study Plan', icon: Calendar },
];

export default function LectureDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const [lecture, setLecture] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [activeTab, setActiveTab] = useState('graph');
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { data: lec, error: lecError } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', id)
        .single();
      if (lecError) throw lecError;
      setLecture(lec);

      if (lec.processing_status === 'ready') {
        const { data: cons, error: consError } = await supabase
          .from('concepts')
          .select('*')
          .eq('lecture_id', id);
        if (consError) throw consError;
        setConcepts(cons || []);
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (lecture && lecture.processing_status !== 'ready') {
        loadData();
      } else {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, lecture?.processing_status]);

  const refreshConcepts = async () => {
    const { data: cons, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('lecture_id', id);
    if (!error) setConcepts(cons || []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <p className="text-muted-foreground">Lecture not found.</p>
        <Link to="/" className="text-primary mt-2">Back to Dashboard</Link>
      </div>
    );
  }

  if (lecture.processing_status !== 'ready') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-bold mb-1">Processing Lecture...</h2>
        <p className="text-sm text-muted-foreground">OmniScribe is extracting concepts, building the knowledge graph, and generating quizzes.</p>
        <p className="text-xs text-muted-foreground mt-2">This usually takes 30-60 seconds.</p>
      </div>
    );
  }

  const userPrefs = {
    learning_level: user?.learning_level,
    learning_style: user?.learning_style,
    interests: user?.interests || [],
  };

  const confusionCount = lecture.confusion_alerts?.length || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border glass-strong">
        <div className="px-6 pt-5 pb-2">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3 h-3" /> Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{lecture.title}</h1>
              {lecture.subject && <p className="text-sm text-muted-foreground mt-0.5">{lecture.subject}</p>}
            </div>
            {confusionCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">{confusionCount} confusion {confusionCount === 1 ? 'alert' : 'alerts'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 flex gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {activeTab === 'graph' && (
            <KnowledgeGraph
              concepts={concepts}
              selectedConcept={selectedConcept}
              onSelectConcept={setSelectedConcept}
            />
          )}
          {activeTab === 'timeline' && <TimelineReplay lecture={lecture} concepts={concepts} />}
          {activeTab === 'tutor' && <AITutor lecture={lecture} userPrefs={userPrefs} />}
          {activeTab === 'quiz' && (
            <QuizPanel lecture={lecture} concepts={concepts} onMasteryUpdate={refreshConcepts} />
          )}
          {activeTab === 'mastery' && <MasteryTree concepts={concepts} />}
          {activeTab === 'confusion' && <ConfusionAlerts lecture={lecture} />}
          {activeTab === 'planner' && (
            <StudyPlanner lecture={lecture} concepts={concepts} examDate={user?.exam_date} />
          )}
        </div>

        {activeTab === 'graph' && selectedConcept && (
          <ConceptDetail concept={selectedConcept} onClose={() => setSelectedConcept(null)} />
        )}
      </div>
    </div>
  );
}
