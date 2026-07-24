import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Menu, X, LogOut, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Sidebar({ open, onClose, user }) {
  const [lectures, setLectures] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    loadLectures();
  }, []);

  const loadLectures = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setLectures(data);
    } catch (e) { /* ignore */ }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} />
      )}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 glass-strong border-r border-border flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
              <img src="/icon-192.png" alt="OmniScribe" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient leading-none">OmniScribe</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase">AI Lecture Tutor</p>
            </div>
          </Link>
        </div>

        <div className="p-4">
          <Link to="/">
            <Button variant="outline" className="w-full justify-start gap-2 border-border hover:border-primary/50 hover:bg-primary/10">
              <BookOpen className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium px-2 mb-2">Recent Lectures</p>
        </div>

        <div className="flex-1 overflow-auto px-2 space-y-1">
          {lectures.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">No lectures yet</p>
          )}
          {lectures.map(lec => (
            <Link
              key={lec.id}
              to={`/lecture/${lec.id}`}
              className={`block px-3 py-2.5 rounded-lg text-sm transition-all ${
                location.pathname === `/lecture/${lec.id}`
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                {lec.processing_status === 'processing' || lec.processing_status === 'pending' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent flex-shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                )}
                <span className="truncate">{lec.title}</span>
              </div>
              {lec.subject && <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">{lec.subject}</p>}
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center text-xs font-bold text-white">
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}