import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

const MASTERY_COLORS = {
  mastered: { fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' },
  partial: { fill: 'rgba(245, 158, 11, 0.2)', stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)' },
  weak: { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.4)' },
  unknown: { fill: 'rgba(99, 102, 241, 0.15)', stroke: '#6366F1', glow: 'rgba(99, 102, 241, 0.3)' },
};

const NODE_W = 140;
const NODE_H = 50;
const GAP_X = 40;
const GAP_Y = 80;

export default function KnowledgeGraph({ concepts, onSelectConcept, selectedConcept }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  const { nodes, edges, width, height } = useMemo(() => {
    if (!concepts || concepts.length === 0) {
      return { nodes: [], edges: [], width: 800, height: 400 };
    }

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

    const positions = {};
    let leafIndex = 0;

    function assign(concept, depth) {
      const children = childrenMap[concept.name] || [];
      if (children.length === 0) {
        positions[concept.name] = { x: leafIndex * (NODE_W + GAP_X), y: depth * (NODE_H + GAP_Y) };
        leafIndex++;
      } else {
        children.forEach(child => assign(child, depth + 1));
        const childXs = children.map(c => positions[c.name].x);
        positions[concept.name] = {
          x: (Math.min(...childXs) + Math.max(...childXs)) / 2,
          y: depth * (NODE_H + GAP_Y)
        };
      }
    }

    roots.forEach(root => assign(root, 0));

    const positionedNodes = concepts.map(c => ({
      ...c,
      x: positions[c.name]?.x ?? 0,
      y: positions[c.name]?.y ?? 0
    }));

    const edgeList = [];
    concepts.forEach(c => {
      if (c.parent_concept && positions[c.name] && positions[c.parent_concept]) {
        const p = positions[c.parent_concept];
        const n = positions[c.name];
        edgeList.push({
          x1: p.x + NODE_W / 2,
          y1: p.y + NODE_H,
          x2: n.x + NODE_W / 2,
          y2: n.y,
        });
      }
    });

    const maxX = Math.max(...positionedNodes.map(n => n.x), 0) + NODE_W + 100;
    const maxY = Math.max(...positionedNodes.map(n => n.y), 0) + NODE_H + 100;

    return { nodes: positionedNodes, edges: edgeList, width: maxX, height: maxY };
  }, [concepts]);

  const handleMouseDown = (e) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
    });
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  if (concepts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No concepts extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden grid-bg">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
        <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))} className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors">
          <Move className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute top-4 left-4 z-10 flex gap-3 text-xs">
        {Object.entries(MASTERY_COLORS).map(([level, colors]) => (
          <div key={level} className="flex items-center gap-1.5 glass px-2 py-1 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.stroke }} />
            <span className="text-muted-foreground capitalize">{level}</span>
          </div>
        ))}
      </div>

      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width,
            height,
          }}
        >
          <svg width={width} height={height} className="absolute top-0 left-0">
            {edges.map((edge, i) => {
              const midY = (edge.y1 + edge.y2) / 2;
              return (
                <path
                  key={i}
                  d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
                  fill="none"
                  stroke="rgba(99, 102, 241, 0.25)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {nodes.map(node => {
            const colors = MASTERY_COLORS[node.mastery_level] || MASTERY_COLORS.unknown;
            const isSelected = selectedConcept?.name === node.name;
            return (
              <motion.div
                key={node.id || node.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute"
                style={{ left: node.x, top: node.y, width: NODE_W }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectConcept(node);
                }}
              >
                <div
                  className={`relative rounded-xl border-2 px-3 py-2 cursor-pointer transition-all ${
                    isSelected ? 'scale-105' : 'hover:scale-105'
                  }`}
                  style={{
                    background: colors.fill,
                    borderColor: colors.stroke,
                    boxShadow: isSelected ? `0 0 20px ${colors.glow}` : `0 0 8px ${colors.glow}`,
                    minHeight: NODE_H,
                  }}
                >
                  {node.confusion_risk && (
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse"
                      style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}
                    />
                  )}
                  <p className="text-xs font-medium text-center text-foreground leading-tight">{node.name}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}