import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  FileText,
  BookOpen,
  Feather,
  User as UserIcon,
  GraduationCap,
  LogOut,
  Bell,
  Menu,
  X,
  KeyRound,
} from 'lucide-react';
import { User, NotificationItem } from '../types';

export type NavTab = 'home' | 'create' | 'stories' | 'magazine' | 'guide' | 'teacher';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  storiesCount: number;
  currentUser: User | null;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenStudentLogin: () => void;
  onOpenTeacherLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  storiesCount,
  currentUser,
  notifications,
  onOpenNotifications,
  onOpenStudentLogin,
  onOpenTeacherLogin,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a] text-slate-100 border-b border-slate-800 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* SOL TARAF: YAZAROTA logosu ve adı (Lise Yazma etiketi kaldırıldı) */}
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
              <span className="font-display tracking-wider text-xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent">
                YAZAROTA
              </span>
              <p className="text-xs text-slate-400 font-serif-literary italic hidden sm:block">
                “Rastgelelikten Hikâyeye, Denemeden Gelişime”
              </p>
            </div>
          </div>

          {/* SAĞ TARAF: Ana Sayfa, Hikâye Oluştur, Yazılarım, Genç Kalemler, Edebiyat Rehberi, Öğrenci Girişi, Öğretmen Girişi */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Ana Sayfa</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Hikâye Oluştur</span>
            </button>

            <button
              onClick={() => setActiveTab('stories')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'stories'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Yazılarım</span>
              {storiesCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  {storiesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('magazine')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'magazine'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-cyan-300" />
              <span>Genç Kalemler</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'guide'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Edebiyat Rehberi</span>
            </button>

            {/* If Teacher Logged In, show Teacher Panel Link */}
            {isTeacher && (
              <button
                onClick={() => setActiveTab('teacher')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'teacher'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Öğretmen Paneli</span>
              </button>
            )}

            {/* Notification Bell */}
            {currentUser && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                title="Bildirimler"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            )}

            {/* User Login Buttons / User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800 ml-1">
              {!currentUser ? (
                <>
                  <button
                    onClick={onOpenStudentLogin}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 transition-all"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Öğrenci Girişi</span>
                  </button>

                  <button
                    onClick={onOpenTeacherLogin}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Öğretmen Girişi</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                    {isTeacher ? (
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-teal-400" />
                    )}
                    <span className="font-semibold text-slate-200">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({isTeacher ? 'Öğretmen' : currentUser.classGrade || 'Öğrenci'})
                    </span>
                  </div>

                  <button
                    onClick={onLogout}
                    title="Çıkış Yap"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobil Menü Butonları */}
          <div className="flex lg:hidden items-center gap-2">
            {currentUser && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg text-slate-300"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            )}

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

      {/* Mobil Açılır Menü */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0f172a] border-b border-slate-800 px-4 pt-2 pb-5 space-y-2">
          <button
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'home' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('create');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'create' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Hikâye Oluştur</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('stories');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'stories' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span>Yazılarım</span>
            </div>
            {storiesCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 font-bold">
                {storiesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('magazine');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'magazine' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-300" />
            <span>Genç Kalemler</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('guide');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'guide' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Edebiyat Rehberi</span>
          </button>

          {isTeacher && (
            <button
              onClick={() => {
                setActiveTab('teacher');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'teacher' ? 'bg-amber-500/20 text-amber-300' : 'text-amber-400'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Öğretmen Paneli</span>
            </button>
          )}

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {!currentUser ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenStudentLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40"
                >
                  Öğrenci Girişi
                </button>
                <button
                  onClick={() => {
                    onOpenTeacherLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                >
                  Öğretmen Girişi
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                <span>
                  Oturum: <strong>{currentUser.name}</strong> ({isTeacher ? 'Öğretmen' : 'Öğrenci'})
                </span>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-rose-400 font-semibold"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
