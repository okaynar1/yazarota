import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Calendar,
  Clock,
  Layers,
  Award,
  Trash2,
  Edit3,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  GitCompare,
  Cloud,
  X,
} from 'lucide-react';
import { Story, GenreType } from '../types';
import { GENRES } from '../data/writingData';
import { WordCloudView } from './WordCloudView';

interface MyStoriesViewProps {
  stories: Story[];
  onOpenStory: (story: Story) => void;
  onDeleteStory: (id: string) => Promise<void>;
  onStartNewStory: () => void;
  onCompareVersions: (story: Story) => void;
}

export const MyStoriesView: React.FC<MyStoriesViewProps> = ({
  stories,
  onOpenStory,
  onDeleteStory,
  onStartNewStory,
  onCompareVersions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordCloudStory, setWordCloudStory] = useState<Story | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_teacher':
        return { label: 'Öğretmende', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'revision_requested':
        return { label: 'Düzeltme İstendi', cls: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
      case 'resubmitted':
        return { label: 'Yeniden Gönderildi', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'approved':
        return { label: 'Onaylandı', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'nominated_for_magazine':
        return { label: 'Dergi İçin Seçildi', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'published':
        return { label: 'Genç Kalemler’de', cls: 'bg-teal-50 text-teal-800 border-teal-200 font-bold' };
      case 'completed':
        return { label: 'Değerlendirildi', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Taslak', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Filtered stories
  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.versions.some((v) => v.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre = selectedGenreFilter === 'all' || story.genre === selectedGenreFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      story.status === statusFilter ||
      (statusFilter === 'draft' && (!story.status || story.status === 'draft'));

    return matchesSearch && matchesGenre && matchesStatus;
  });

  const confirmDelete = async () => {
    if (!storyToDelete) return;
    setIsDeleting(true);
    await onDeleteStory(storyToDelete.id);
    setIsDeleting(false);
    setStoryToDelete(null);
  };

  const getGenreTitle = (id: GenreType) => {
    const found = GENRES.find((g) => g.id === id);
    return found ? found.title : id;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Yazarlık Günlüğün</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Yazılarım ve Sürümlerim
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-serif-literary">
            Daha önce başladığın taslaklara geri dönebilir, değerlendirme raporlarını inceleyebilir veya yeni sürümler oluşturabilirsin.
          </p>
        </div>

        <button
          onClick={onStartNewStory}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Yeni Hikâye Başlat</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Başlık veya metin içinde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-teal-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Genre Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedGenreFilter}
            onChange={(e) => setSelectedGenreFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none w-full sm:w-auto"
          >
            <option value="all">Tüm Edebî Türler</option>
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none w-full sm:w-auto"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="draft">Taslaklar</option>
            <option value="pending_teacher">Öğretmende Bekleyenler</option>
            <option value="revision_requested">Düzeltme İstenenler</option>
            <option value="resubmitted">Yeniden Gönderilenler</option>
            <option value="approved">Onaylananlar</option>
            <option value="published">Dergide Yayımlananlar</option>
          </select>
        </div>
      </div>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold font-display text-slate-900">
            {stories.length === 0 ? 'Henüz Bir Hikâye Yazmadın' : 'Aramana Uygun Hikâye Bulunamadı'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto font-serif-literary">
            {stories.length === 0
              ? 'Rastgele kurgu çarkını çevir ve hayal gücünü harekete geçirecek ilk hikâyeni bugün oluştur.'
              : 'Filtreleri temizleyerek veya farklı bir arama yaparak diğer yazılarına ulaşabilirsin.'}
          </p>
          {stories.length === 0 && (
            <button
              onClick={onStartNewStory}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>İlk Hikâyeni Oluştur</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const latestVersion = story.versions[story.versions.length - 1];
            const latestReview = latestVersion?.review;
            const badge = getStatusBadge(story.status);

            return (
              <div
                key={story.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {getGenreTitle(story.genre)}
                    </span>

                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded-md border ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onOpenStory(story)}
                    className="text-lg font-bold font-display text-slate-900 group-hover:text-teal-700 transition-colors cursor-pointer line-clamp-1 mb-2"
                  >
                    {story.title || 'Başlıksız Hikâye'}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-600 font-serif-literary line-clamp-3 mb-4 leading-relaxed">
                    {latestVersion?.content || 'İçerik henüz eklenmedi.'}
                  </p>

                  {/* Surprise Card Teaser */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-serif-literary line-clamp-2 mb-4">
                    <strong className="text-rose-700">Sürpriz Kartı:</strong> {story.surpriseCard}
                  </div>
                </div>

                <div>
                  {/* Metadata Stats */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>{latestVersion?.wordCount || 0} kelime</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>{story.versions.length} sürüm</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(story.updatedAt).toLocaleDateString('tr-TR')}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {latestReview ? (
                          <strong className="text-teal-800">{latestReview.totalScore} Puan</strong>
                        ) : (
                          'Puanlanmadı'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setStoryToDelete(story)}
                        title="Hikâyeyi Sil"
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {story.versions.length > 1 && (
                        <button
                          onClick={() => onCompareVersions(story)}
                          title="Sürümleri Karşılaştır"
                          className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                        >
                          <GitCompare className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setWordCloudStory(story)}
                        title="Kelime Bulutu & Sözcük Analizi"
                        className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                      >
                        <Cloud className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => onOpenStory(story)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold transition-all group-hover:bg-teal-700"
                    >
                      <span>Aç & Düzenle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {storyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold font-display text-slate-900">
                Hikâyeyi Silmek İstiyor musunuz?
              </h4>
            </div>

            <p className="text-xs text-slate-600 font-serif-literary leading-relaxed">
              “<strong>{storyToDelete.title || 'Başlıksız Hikâye'}</strong>” ve buna ait tüm sürümler ({storyToDelete.versions.length} sürüm) kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setStoryToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Word Cloud Inspection Modal */}
      {wordCloudStory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#faf8f5] w-full max-w-5xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto my-8 relative">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900 font-display">
                  “{wordCloudStory.title || 'Başlıksız Eser'}” — Kelime Bulutu ve Sözcük Analizi
                </h3>
              </div>
              <button
                onClick={() => setWordCloudStory(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <WordCloudView story={wordCloudStory} />
          </div>
        </div>
      )}
    </div>
  );
};
