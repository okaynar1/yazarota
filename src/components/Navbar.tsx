import React, { useState } from 'react';
import {
  BookOpen,
  Feather,
  Sparkles,
  BarChart3,
  GraduationCap,
  FileText,
  User,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { getOrCreateStudentCode, setCustomStudentCode } from '../services/api';

export type NavTab = 'home' | 'create' | 'stories' | 'progress' | 'guide' | 'teacher';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  storiesCount: number;
  onNewStoryClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  storiesCount,
  onNewStoryClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentCode, setStudentCodeState] = useState<string>(() => getOrCreateStudentCode());
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [codeDraft, setCodeDraft] = useState('');

  const handleSaveCode = () => {
    if (codeDraft.trim()) {
      setCustomStudentCode(codeDraft.trim());
      setStudentCodeState(codeDraft.trim());
    }
    setIsEditingCode(false);
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'home', label: 'Ana Sayfa', icon: <Compass className="w-4 h-4" /> },
    { id: 'create', label: 'Hikâyemi Oluştur', icon: <Sparkles className="w-4 h-4 text-teal-400" /> },
    { id: 'stories', label: 'Yazılarım', icon: <FileText className="w-4 h-4" />, badge: storiesCount },
    { id: 'progress', label: 'Gelişimim', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'guide', label: 'Edebiyat Rehberi', icon: <BookOpen className="w-4 h-4" /> },
    {
      id: 'teacher',
      label: 'Öğretmen Paneli',
      icon: <GraduationCap className="w-4 h-4 text-amber-300" />,
      badge: '2204-A',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a] text-slate-100 border-b border-slate-800 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Slogan */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                <Feather className="w-5 h-5 text-teal-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display tracking-wider text-xl font-bold bg-gradient-to-r from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent">
                  YAZAROTA
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-teal-950 text-teal-300 px-2 py-0.5 rounded-full border border-teal-700/60">
                  Lise Yazma
                </span>
              </div>
              <p className="text-xs text-slate-400 font-serif-literary italic hidden sm:block">
                “Rastgelelikten Hikâyeye, Denemeden Gelişime”
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge !== 0 && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                        item.id === 'teacher'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : 'bg-teal-500/20 text-teal-200 border border-teal-400/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Student Anonymous Code & Action */}
          <div className="hidden sm:flex items-center gap-3">
            {isEditingCode ? (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <input
                  type="text"
                  placeholder="OGR-1234"
                  value={codeDraft}
                  onChange={(e) => setCodeDraft(e.target.value)}
                  className="bg-transparent text-xs text-teal-300 px-2 py-1 outline-none w-24 uppercase"
                />
                <button
                  onClick={handleSaveCode}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-2 py-1 rounded"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => setIsEditingCode(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setCodeDraft(studentCode);
                  setIsEditingCode(true);
                }}
                title="Öğrenci kodunu düzenle (TÜBİTAK anonim eşleştirme için)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 hover:border-teal-500/50 cursor-pointer transition-colors"
              >
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-mono text-teal-300 font-semibold">{studentCode}</span>
                <span className="text-[10px] text-slate-400 ml-1">(Anonim)</span>
              </div>
            )}

            <button
              onClick={onNewStoryClick}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-semibold px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-teal-950/40 hover:scale-[1.02] transition-transform active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Yeni Hikâye</span>
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onNewStoryClick}
              className="bg-teal-500 text-slate-950 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            >
              Yaz
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label="Menüyü Aç"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0f172a] border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                activeTab === item.id
                  ? 'bg-teal-500/20 text-teal-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge !== 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-teal-300">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Öğrenci Kodu:</span>
            <span className="font-mono text-teal-300 font-semibold">{studentCode}</span>
          </div>
        </div>
      )}
    </header>
  );
};
