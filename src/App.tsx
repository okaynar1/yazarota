import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { RandomizerWizard } from './components/RandomizerWizard';
import { StoryEditor } from './components/StoryEditor';
import { EvaluationView } from './components/EvaluationView';
import { VersionCompareModal } from './components/VersionCompareModal';
import { MyStoriesView } from './components/MyStoriesView';
import { ProgressView } from './components/ProgressView';
import { LiteratureGuideView } from './components/LiteratureGuideView';
import { GencKalemlerView } from './components/GencKalemlerView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import {
  StudentRegisterModal,
  StudentLoginModal,
  TeacherLoginModal,
  TeacherChangePasswordModal,
} from './components/AuthModals';
import { NotificationDrawer } from './components/NotificationDrawer';
import {
  Story,
  GenreType,
  StoryPrompts,
  AIReview,
  StoryVersion,
  User,
  NotificationItem,
} from './types';
import {
  fetchStories,
  saveStory,
  deleteStory,
  getOrCreateStudentCode,
  fetchCurrentUser,
  clearAuthSession,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './services/api';
import { Database, CheckCircle, X, KeyRound } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Authentication & Current User
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Auth Modals
  const [isStudentLoginOpen, setIsStudentLoginOpen] = useState(false);
  const [isStudentRegisterOpen, setIsStudentRegisterOpen] = useState(false);
  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);
  const [isTeacherPassChangeOpen, setIsTeacherPassChangeOpen] = useState(false);
  const [isMandatoryPassChange, setIsMandatoryPassChange] = useState(false);

  // Active Story & Evaluation Sessions
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [currentReview, setCurrentReview] = useState<AIReview | null>(null);
  const [comparingStory, setComparingStory] = useState<Story | null>(null);
  const [preSelectedGenre, setPreSelectedGenre] = useState<GenreType | undefined>(undefined);

  // Architecture status information modal
  const [showArchModal, setShowArchModal] = useState<boolean>(false);

  // Load user, stories, and notifications on mount
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    const [user, fetchedStories, notifs] = await Promise.all([
      fetchCurrentUser(),
      fetchStories(),
      fetchNotifications(),
    ]);

    setCurrentUser(user);
    setStories(fetchedStories);
    setNotifications(notifs);

    // If teacher has mandatory password change pending, open change password modal
    if (user && user.role === 'teacher' && user.mustChangePassword) {
      setIsMandatoryPassChange(true);
      setIsTeacherPassChangeOpen(true);
    }

    setLoading(false);
  };

  const reloadStories = async () => {
    const data = await fetchStories();
    setStories(data);
  };

  const reloadNotifications = async () => {
    const notifs = await fetchNotifications();
    setNotifications(notifs);
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setNotifications([]);
    setActiveTab('home');
  };

  // Trigger starting a new story
  const handleStartNewStory = (preGenre?: GenreType) => {
    setPreSelectedGenre(preGenre);
    setCurrentStory(null);
    setCurrentReview(null);
    setActiveTab('create');
  };

  // Prompt wizard finished, begin writing
  const handleStartWriting = (prompts: StoryPrompts) => {
    const studentCode = getOrCreateStudentCode();
    const newStoryId = 'story-' + Date.now();
    const now = new Date().toISOString();

    const initialVersion: StoryVersion = {
      id: 'v1-' + Date.now(),
      versionNumber: 1,
      title: '',
      content: '',
      wordCount: 0,
      characterCount: 0,
      createdAt: now,
      studentNotes: 'İlk taslak.',
    };

    const newStory: Story = {
      id: newStoryId,
      studentCode: studentCode,
      authorUsername: currentUser?.username,
      authorName: currentUser?.name,
      title: '',
      genre: prompts.genre,
      place: prompts.place,
      time: prompts.time,
      character: prompts.character,
      surpriseCard: prompts.surpriseCard,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      currentVersionNumber: 1,
      versions: [initialVersion],
    };

    setCurrentStory(newStory);
    setCurrentReview(null);
  };

  // Save story update
  const handleSaveStory = async (updatedStory: Story) => {
    const saved = await saveStory(updatedStory);
    setCurrentStory(saved);
    setStories((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  // Evaluation completed
  const handleEvaluationComplete = (review: AIReview, story: Story) => {
    setCurrentReview(review);
    setCurrentStory(story);
  };

  // Apply suggestions and create Version 2, 3...
  const handleApplySuggestionsAndCreateNewVersion = async (story: Story) => {
    const latestVersion = story.versions[story.versions.length - 1];
    const newVersionNumber = story.versions.length + 1;
    const now = new Date().toISOString();

    const newVersion: StoryVersion = {
      id: `v${newVersionNumber}-${Date.now()}`,
      versionNumber: newVersionNumber,
      title: latestVersion.title || story.title,
      content: latestVersion.content, // Copy previous content for easy revision!
      wordCount: latestVersion.wordCount,
      characterCount: latestVersion.characterCount,
      createdAt: now,
      studentNotes: `Sürüm ${newVersionNumber}: Yapay zekâ önerileri uygulanıyor.`,
    };

    const updatedStory: Story = {
      ...story,
      currentVersionNumber: newVersionNumber,
      updatedAt: now,
      versions: [...story.versions, newVersion],
    };

    await handleSaveStory(updatedStory);
    setCurrentReview(null);
    setCurrentStory(updatedStory);
  };

  // Delete story
  const handleDeleteStory = async (id: string) => {
    await deleteStory(id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    if (currentStory?.id === id) {
      setCurrentStory(null);
      setCurrentReview(null);
    }
  };

  // Open existing story from Yazılarım
  const handleOpenStory = (story: Story) => {
    setCurrentStory(story);
    const latestVersion = story.versions[story.versions.length - 1];
    if (latestVersion.review) {
      setCurrentReview(latestVersion.review);
    } else {
      setCurrentReview(null);
    }
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-800 font-sans">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'teacher' && currentUser?.role === 'teacher' && currentUser.mustChangePassword) {
            setIsMandatoryPassChange(true);
            setIsTeacherPassChangeOpen(true);
            return;
          }
          setActiveTab(tab);
          if (tab !== 'create') {
            setCurrentReview(null);
          }
        }}
        storiesCount={stories.length}
        currentUser={currentUser}
        notifications={notifications}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenStudentLogin={() => setIsStudentLoginOpen(true)}
        onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* TAB 1: Home View */}
        {activeTab === 'home' && (
          <HomeView
            onStartNewStory={handleStartNewStory}
            onNavigateTab={(tab) => {
              if (tab === 'progress') setActiveTab('stories');
              else setActiveTab(tab as NavTab);
            }}
            savedStoriesCount={stories.length}
          />
        )}

        {/* TAB 2: Story Creation Flow */}
        {activeTab === 'create' && (
          <div>
            {currentReview && currentStory ? (
              <EvaluationView
                review={currentReview}
                story={currentStory}
                onApplySuggestionsAndCreateNewVersion={handleApplySuggestionsAndCreateNewVersion}
                onBackToEditor={() => setCurrentReview(null)}
                onCompareVersions={(story) => setComparingStory(story)}
              />
            ) : currentStory ? (
              <StoryEditor
                currentStory={currentStory}
                onSaveStory={handleSaveStory}
                onEvaluationComplete={handleEvaluationComplete}
                onCompareVersions={(story) => setComparingStory(story)}
                onBackToPromptWizard={() => setCurrentStory(null)}
              />
            ) : (
              <RandomizerWizard
                initialGenre={preSelectedGenre}
                onStartWriting={handleStartWriting}
              />
            )}
          </div>
        )}

        {/* TAB 3: My Stories */}
        {activeTab === 'stories' && (
          <MyStoriesView
            stories={stories}
            onOpenStory={handleOpenStory}
            onDeleteStory={handleDeleteStory}
            onStartNewStory={() => handleStartNewStory()}
            onCompareVersions={(story) => setComparingStory(story)}
          />
        )}

        {/* TAB 4: Genç Kalemler Digital Magazine */}
        {activeTab === 'magazine' && (
          <GencKalemlerView onStartWritingWithGenre={(genre) => handleStartNewStory(genre)} />
        )}

        {/* TAB 5: Literature Guide */}
        {activeTab === 'guide' && (
          <LiteratureGuideView
            onStartWritingWithGenre={(genre) => handleStartNewStory(genre)}
          />
        )}

        {/* TAB 6: Teacher Panel (11 Sections & 10-Criteria Rubric) */}
        {activeTab === 'teacher' && (
          currentUser?.role === 'teacher' && !currentUser.mustChangePassword ? (
            <TeacherDashboardView
              currentUser={currentUser}
              onOpenStoryDetail={handleOpenStory}
              onRefreshStories={reloadStories}
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">
                Güvenlik Doğrulaması Gerekli
              </h3>
              <p className="text-xs text-slate-600 font-serif-literary leading-relaxed">
                Öğretmen paneline ve öğrenci yazılarına erişebilmek için lütfen önce ilk şifrenizi güncelleyiniz.
              </p>
              <button
                onClick={() => {
                  setIsMandatoryPassChange(true);
                  setIsTeacherPassChangeOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Şifremi Şimdi Güncelle
              </button>
            </div>
          )
        )}
      </main>

      {/* Side-by-Side Version Comparison Modal */}
      {comparingStory && (
        <VersionCompareModal
          story={comparingStory}
          onClose={() => setComparingStory(null)}
          onSelectVersionToEdit={(versionNumber) => {
            if (currentStory && currentStory.id === comparingStory.id) {
              setCurrentStory({
                ...currentStory,
                currentVersionNumber: versionNumber,
              });
            }
          }}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={async (id) => {
          await markNotificationRead(id);
          reloadNotifications();
        }}
        onMarkAllRead={async () => {
          await markAllNotificationsRead();
          reloadNotifications();
        }}
        onSelectStory={(storyId) => {
          const target = stories.find((s) => s.id === storyId);
          if (target) {
            handleOpenStory(target);
          }
        }}
      />

      {/* Authentication Modals */}
      <StudentLoginModal
        isOpen={isStudentLoginOpen}
        onClose={() => setIsStudentLoginOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          reloadStories();
          reloadNotifications();
        }}
        onSwitchToRegister={() => {
          setIsStudentLoginOpen(false);
          setIsStudentRegisterOpen(true);
        }}
      />

      <StudentRegisterModal
        isOpen={isStudentRegisterOpen}
        onClose={() => setIsStudentRegisterOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          reloadStories();
          reloadNotifications();
        }}
        onSwitchToLogin={() => {
          setIsStudentRegisterOpen(false);
          setIsStudentLoginOpen(true);
        }}
      />

      <TeacherLoginModal
        isOpen={isTeacherLoginOpen}
        onClose={() => setIsTeacherLoginOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('teacher');
          reloadStories();
          reloadNotifications();
        }}
        onNeedPasswordChange={(user) => {
          setCurrentUser(user);
          setIsMandatoryPassChange(true);
          setIsTeacherPassChangeOpen(true);
        }}
      />

      <TeacherChangePasswordModal
        isOpen={isTeacherPassChangeOpen}
        isMandatory={isMandatoryPassChange}
        onClose={() => {
          if (isMandatoryPassChange) {
            handleLogout();
          }
          setIsTeacherPassChangeOpen(false);
          setIsMandatoryPassChange(false);
        }}
        onSuccess={() => {
          setIsTeacherPassChangeOpen(false);
          setIsMandatoryPassChange(false);
          if (currentUser) {
            setCurrentUser({ ...currentUser, mustChangePassword: false });
          }
          setActiveTab('teacher');
          reloadStories();
          reloadNotifications();
        }}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-800">YAZAROTA</span>
            <span>—</span>
            <span className="font-serif-literary italic">
              “Rastgelelikten Hikâyeye, Denemeden Gelişime”
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-teal-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
              <span>Güvenli Kimlik & Kalıcı Veritabanı Aktif</span>
            </div>

            <button
              onClick={() => setShowArchModal(true)}
              className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors underline"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sistem Mimarisi</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Architecture Info Modal */}
      {showArchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                <h4 className="font-bold font-display text-slate-900 text-base">
                  YAZAROTA Mimari ve Dağıtım Yapılandırması
                </h4>
              </div>
              <button
                onClick={() => setShowArchModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 font-serif-literary leading-relaxed">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900">
                <strong className="block mb-1 font-sans text-teal-950 font-bold">
                  ✓ Güvenli Veri ve Sürüm Yönetimi:
                </strong>
                Öğrenci şifreleri PBKDF2 ile tuzlanarak (salt) güvenli saklanır. Öğrenci yazılarının hiçbir geçmiş sürümü silinmez; tüm düzeltmeler yeni sürüm olarak kütüğe eklenir.
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                <strong className="block mb-1 font-sans text-slate-900 font-bold">
                  Vercel ve Serverless Yapılandırması:
                </strong>
                Vercel üzerinde dosya yazımı için <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">/tmp</code> dizini otomatik olarak kullanılır. <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">GEMINI_API_KEY</code> ortam değişkeni Vercel paneline eklenerek yapay zekâ değerlendirmesi çalıştırılır.
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <strong className="block mb-1 font-sans text-amber-950 font-bold">
                  İlk Öğretmen Şifresi Güvenliği:
                </strong>
                Varsayılan öğretmen hesabı (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">ogretmen / 1234</code>) ilk girişte zorunlu şifre değişikliğine tabi tutulur.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowArchModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
