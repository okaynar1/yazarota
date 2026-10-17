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
import { TeacherResearchView } from './components/TeacherResearchView';
import { Story, GenreType, StoryPrompts, AIReview, StoryVersion } from './types';
import { fetchStories, saveStory, deleteStory, getOrCreateStudentCode } from './services/api';
import { Database, Info, Sparkles, X, CheckCircle, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Story & Evaluation Sessions
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [currentReview, setCurrentReview] = useState<AIReview | null>(null);
  const [comparingStory, setComparingStory] = useState<Story | null>(null);
  const [preSelectedGenre, setPreSelectedGenre] = useState<GenreType | undefined>(undefined);

  // Firebase status information modal
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);

  // Load stories on mount
  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    const data = await fetchStories();
    setStories(data);
    setLoading(false);
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
          setActiveTab(tab);
          if (tab !== 'create') {
            setCurrentReview(null);
          }
        }}
        storiesCount={stories.length}
        onNewStoryClick={() => handleStartNewStory()}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* TAB 1: Home View */}
        {activeTab === 'home' && (
          <HomeView
            onStartNewStory={handleStartNewStory}
            onNavigateTab={setActiveTab}
            savedStoriesCount={stories.length}
          />
        )}

        {/* TAB 2: Story Creation Flow */}
        {activeTab === 'create' && (
          <div>
            {currentReview && currentStory ? (
              /* If evaluation report is open */
              <EvaluationView
                review={currentReview}
                story={currentStory}
                onApplySuggestionsAndCreateNewVersion={handleApplySuggestionsAndCreateNewVersion}
                onBackToEditor={() => setCurrentReview(null)}
                onCompareVersions={(story) => setComparingStory(story)}
              />
            ) : currentStory ? (
              /* Writing Canvas */
              <StoryEditor
                currentStory={currentStory}
                onSaveStory={handleSaveStory}
                onEvaluationComplete={handleEvaluationComplete}
                onCompareVersions={(story) => setComparingStory(story)}
                onBackToPromptWizard={() => setCurrentStory(null)}
              />
            ) : (
              /* Randomizer Prompts Wizard */
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

        {/* TAB 4: Progress Analytics */}
        {activeTab === 'progress' && (
          <ProgressView stories={stories} onStartWriting={() => handleStartNewStory()} />
        )}

        {/* TAB 5: Literature Guide */}
        {activeTab === 'guide' && (
          <LiteratureGuideView
            onStartWritingWithGenre={(genre) => handleStartNewStory(genre)}
          />
        )}

        {/* TAB 6: Teacher & Research Panel */}
        {activeTab === 'teacher' && (
          <TeacherResearchView
            stories={stories}
            onOpenStoryDetail={handleOpenStory}
          />
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

      {/* Persistent Storage & Firebase Architecture Status Footer */}
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
              <span>Kalıcı JSON & Yerel Depolama Aktif</span>
            </div>

            <button
              onClick={() => setShowFirebaseModal(true)}
              className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors underline"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Veri & Firebase Durumu</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Firebase & Data Architecture Info Modal */}
      {showFirebaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                <h4 className="font-bold font-display text-slate-900 text-base">
                  Veri Depolama ve Firebase Entegrasyon Durumu
                </h4>
              </div>
              <button
                onClick={() => setShowFirebaseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 font-serif-literary leading-relaxed">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900">
                <strong className="block mb-1 font-sans text-teal-950 font-bold">
                  ✓ Mevcut Çalışan Kalıcı Altyapı:
                </strong>
                YAZAROTA şu anda hem sunucu tarafındaki güvenli dosya veritabanında (<code className="font-mono bg-teal-100 px-1 py-0.5 rounded">data/yazarota_db.json</code>) hem de istemci tarafında senkronize depolamayla çalışmaktadır. Yazılarınız, sürümleriniz ve değerlendirmeleriniz sayfa yenilense dahi korunur.
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                <strong className="block mb-1 font-sans text-slate-900 font-bold">
                  Firebase Firestore & Authentication Hakkında:
                </strong>
                Uygulama Firebase entegrasyonuna hazır mimaride kurgulanmıştır. Ortamda Firebase Firestore ve Auth'u tek tıkla provision etmek için talep ettiğinizde, sistem arayüz üzerinden onay isteyerek Firebase projenizi canlıya bağlayabilir.
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <strong className="block mb-1 font-sans text-amber-950 font-bold">
                  Gemini API Güvenliği:
                </strong>
                Gemini API anahtarı istemciye/tarayıcıya asla sızdırılmaz. Tüm değerlendirmeler Express sunucusu (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">server.ts</code>) üzerinden güvenli proxy ile yürütülür.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFirebaseModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
