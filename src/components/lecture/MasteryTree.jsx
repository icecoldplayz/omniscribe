import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Circle, Clock } from 'lucide-react';

const MASTERY_META = {
  mastered: { label: 'Mastered', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle2 },
  partial: { label: 'Partial', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock },
  weak: { label: 'Weak', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', icon: AlertCircle },
  unknown: { label: 'Unknown', color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)', icon: Circle },
};

export default function MasteryTree({ concepts }) {
  const tree = useMemo(() => {
    if (!concepts || concepts.length === 0) return { roots: [], stats: {} };

    const conceptMap = new Map(concepts.map(c => [c.name, c]));
    const childrenMap = {};
    const roots = [];

    concepts.forEach(c => {
      const parent = c.parent_concept;
      if (parent && conceptMap.has(parent) && parent !== c.name) {
        if (!childrenMap[parent]) childrenMap[parent] = [];
        childrenMap[parent].push(c);
      } else {
        roots.push(c);
      }
    });

    const stats = {
      total: concepts.length,
      mastered: concepts.filter(c => c.mastery_level === 'mastered').length,
      partial: concepts.filter(c => c.mastery_level === 'partial').length,
      weak: concepts.filter(c => c.mastery_level === 'weak').length,
      unknown: concepts.filter(c => c.mastery_level === 'unknown').length,
    };
    stats.percentage = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

    return { roots, childrenMap, stats };
  }, [concepts]);

  const renderNode = (concept, depth = 0, isLast = true, parentLine = []) => (
    <div key={concept.id} className="relative">
      <div className="flex items-start">
        <div className="flex flex-col items-center" style={{ minHeight: 28 }}>
          {depth > 0 && <div className="w-px h-3" style={{ background: 'rgba(99, 102, 241, 0.2)' }} />}
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 mb-1.5"
        >
          {(() => {
            const meta = MASTERY_META[concept.mastery_level] || MASTERY_META.unknown;
            const Icon = meta.icon;
            return (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{ borderColor: meta.color + '40', background: meta.bg }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: meta.color }} />
                <span className="text-sm font-medium">{concept.name}</span>
                {concept.importance === 'high' && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary font-medium">HIGH</span>
                )}
                <span className="text-[10px] text-muted-foreground" style={{ color: meta.color }}>{meta.label}</span>
              </div>
            );
          })()}
        </motion.div>
      </div>
      {tree.childrenMap[concept.name] && (
        <div className="ml-4 border-l border-primary/15 pl-4">
          {tree.childrenMap[concept.name].map(child => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  if (concepts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No concepts to track yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Overall Mastery</h3>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-bold text-gradient-emerald">{tree.stats.percentage || 0}%</span>
            <span className="text-sm text-muted-foreground mb-1">mastered</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tree.stats.percentage || 0}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-accent"
            />
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(MASTERY_META).map(([key, meta]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
                  <span className="text-sm text-muted-foreground">{meta.label}</span>
                </div>
                <span className="text-sm font-mono font-medium" style={{ color: meta.color }}>
                  {tree.stats[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <h3 className="text-sm text-muted-foreground mb-4 tracking-widest uppercase">Concept Hierarchy</h3>
        <div className="space-y-0.5">
          {tree.roots.map(root => renderNode(root))}
        </div>
      </div>
    </div>
  );
}