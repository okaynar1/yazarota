import React, { useState, useEffect } from 'react';
import { PublishedWork, MagazineIssue, GenreType } from '../types';
import { fetchPublishedWorks, fetchMagazineIssues, likePublishedWork } from '../services/api';
import { exportStoryToDocx, printPublishedWork } from '../utils/exportUtils';
import {
  BookOpen,
  Feather,
  Heart,
  Download,
  Printer,
  Search,
  Sparkles,
  Calendar,
  User,
  Quote,
  Compass,
  FileText,
  X,
  Share2,
  Award,
  Layers,
} from 'lucide-react';

interface GencKalemlerViewProps {
  onStartWritingWithGenre?: (genre: GenreType) => void;
}

export const GencKalemlerView: React.FC<GencKalemlerViewProps> = ({ onStartWritingWithGenre }) => {
  const [works, setWorks] = useState<PublishedWork[]>([]);
  const [issues, setIssues] = useState<MagazineIssue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Active reading modal
  const [activeReadingWork, setActiveReadingWork] = useState<PublishedWork | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fetchedWorks, fetchedIssues] = await Promise.all([
      fetchPublishedWorks(),
      fetchMagazineIssues(),
    ]);
    setWorks(fetchedWorks);
    setIssues(fetchedIssues);
    setLoading(false);
  };

  const handleLike = async (workId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (likedMap[workId]) return;

    setLikedMap((prev) => ({ ...prev, [workId]: true }));
    const newCount = await likePublishedWork(workId);
    setWorks((prev) =>
      prev.map((w) => (w.id === workId ? { ...w, likesCount: newCount } : w))
    );
    if (activeReadingWork && activeReadingWork.id === workId) {
      setActiveReadingWork((prev) => (prev ? { ...prev, likesCount: newCount } : null));
    }
  };

  const filteredWorks = works.filter((work) => {
    if (selectedIssueId !== 'all' && work.issueId !== selectedIssueId) return false;
    if (selectedGenre !== 'all' && work.genre !== selectedGenre) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = work.title.toLowerCase().includes(q);
      const matchAuthor = work.authorDisplayName.toLowerCase().includes(q);
      const matchContent = work.content.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchContent) return false;
    }
    return true;
  });

  const activeIssue = issues.find((i) => i.id === selectedIssueId) || issues[0];

  const genreLabels: Record<string, string> = {
    hikaye: 'Hikâye (Öykü)',
    masal: 'Masal',
    bilim_kurgu: 'Bilim Kurgu',
    polisiye: 'Polisiye',
    ani: 'Anı',
    gunluk: 'Günlük',
    siir: 'Şiir',
    fabl: 'Fabl',
  };

  const genreColors: Record<string, string> = {
    hikaye: 'bg-teal-50 text-teal-700 border-teal-200',
    masal: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bilim_kurgu: 'bg-sky-50 text-sky-700 border-sky-200',
    polisiye: 'bg-slate-100 text-slate-800 border-slate-300',
    ani: 'bg-amber-50 text-amber-800 border-amber-200',
    gunluk: 'bg-rose-50 text-rose-700 border-rose-200',
    siir: 'bg-violet-50 text-violet-700 border-violet-200',
    fabl: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Magazine Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border border-teal-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold tracking-wider uppercase">
            <Feather className="w-3.5 h-3.5 text-teal-400" />
            <span>YAZAROTA Dijital Edebiyat Seçkisi</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white">
            Genç Kalemler Dergisi
          </h1>

          <p className="text-slate-300 text-sm sm:text-base font-serif-literary leading-relaxed">
            Lise öğrencilerimizin rastgele kurgu unsurlarıyla kaleme aldığı, yapay zekâ ve edebiyat öğretmenlerinin rehberliğinde olgunlaşan seçkin edebî eserler.
          </p>

          {/* Current Issue Bar */}
          {activeIssue && (
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-teal-200">
              <span className="font-semibold bg-teal-900/80 px-3 py-1 rounded-lg border border-teal-700/60">
                {activeIssue.title}
              </span>
              <span>•</span>
              <span>Tema: {activeIssue.theme}</span>
              <span>•</span>
              <span>{works.length} Yayımlanmış Eser</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor's Note Banner */}
      {activeIssue && activeIssue.editorNote && (
        <div className="bg-amber-50/70 border-l-4 border-amber-500 p-5 rounded-2xl shadow-sm text-amber-950 text-sm flex items-start gap-4">
          <Quote className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 opacity-70" />
          <div className="space-y-1">
            <div className="font-semibold text-xs tracking-wider uppercase text-amber-900">
              Yayın Kurulu & Editör Notu ({activeIssue.title})
            </div>
            <p className="font-serif-literary italic leading-relaxed text-slate-800">
              “{activeIssue.editorNote}”
            </p>
          </div>
        </div>
      )}

      {/* Issues & Genre Filters */}
      <div className="space-y-4">
        {/* Issue Selector Tabs */}
        {issues.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedIssueId('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedIssueId === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tüm Sayılar
            </button>
            {issues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedIssueId === issue.id
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Sayı {issue.issueNumber}: {issue.title.replace('Genç Kalemler — ', '')}
              </button>
            ))}
          </div>
        )}

        {/* Filter Bar: Genre + Search */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Genre buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Tüm Türler' },
              { id: 'hikaye', label: 'Hikâye' },
              { id: 'masal', label: 'Masal' },
              { id: 'siir', label: 'Şiir' },
              { id: 'fabl', label: 'Fabl' },
              { id: 'bilim_kurgu', label: 'Bilim Kurgu' },
              { id: 'polisiye', label: 'Polisiye' },
              { id: 'ani', label: 'Anı' },
              { id: 'gunluk', label: 'Günlük' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedGenre(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedGenre === cat.id
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Başlık, yazar veya metin ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Story Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Genç Kalemler dergisi hazırlanıyor...</p>
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Henüz Bu Kriterde Eser Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Arama filtrenizi temizleyebilir veya kendi hikâyenizi yazıp öğretmeninize göndererek dergide yer alabilirsiniz!
          </p>
          {onStartWritingWithGenre && (
            <button
              onClick={() => onStartWritingWithGenre('hikaye')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>İlk Hikâyeni Yaz</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorks.map((work) => {
            const isLiked = likedMap[work.id];
            const genreStyle = genreColors[work.genre] || 'bg-slate-50 text-slate-700 border-slate-200';

            return (
              <div
                key={work.id}
                onClick={() => setActiveReadingWork(work)}
                className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-400/60 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="p-6 space-y-4">
                  {/* Card Header: Genre Badge & Score */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2.5 py-1 rounded-full font-semibold border ${genreStyle}`}>
                      {genreLabels[work.genre] || work.genre}
                    </span>
                    {work.score && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Award className="w-3 h-3 text-amber-500" />
                        {work.score} Puan
                      </span>
                    )}
                  </div>

                  {/* Title & Excerpt */}
                  <div>
                    <h3 className="text-lg font-bold font-serif-literary text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                      {work.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 font-serif-literary leading-relaxed line-clamp-3 italic">
                      “{work.content.slice(0, 180)}...”
                    </p>
                  </div>

                  {/* Prompt Tags */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]" title={work.place}>
                      📍 {work.place}
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]" title={work.character}>
                      👤 {work.character}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-slate-50/80 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
                      {work.authorDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">{work.authorDisplayName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleLike(work.id, e)}
                      className={`flex items-center gap-1 p-1 rounded-md transition-colors ${
                        isLiked ? 'text-rose-600' : 'text-slate-400 hover:text-rose-500'
                      }`}
                      title="Beğen"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span className="text-[11px] font-semibold">{work.likesCount || 0}</span>
                    </button>
                    <span className="text-teal-600 font-semibold text-[11px] group-hover:translate-x-0.5 transition-transform">
                      Oku →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* READING MODAL / FULL READER VIEW */}
      {activeReadingWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs text-teal-300">
                <Feather className="w-4 h-4 text-teal-400" />
                <span className="font-semibold tracking-wide">Genç Kalemler • Sayı {activeReadingWork.issueNumber || 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printPublishedWork(activeReadingWork)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Yazdır veya PDF olarak kaydet"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yazdır / PDF</span>
                </button>
                <button
                  onClick={() => exportStoryToDocx(activeReadingWork)}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Microsoft Word (.doc) olarak indir"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Word İndir</span>
                </button>
                <button
                  onClick={() => setActiveReadingWork(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Reader Canvas */}
            <div className="overflow-y-auto p-6 sm:p-10 space-y-6">
              {/* Header Info */}
              <div className="text-center space-y-3 pb-6 border-b border-slate-100">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
                  <span>{genreLabels[activeReadingWork.genre] || activeReadingWork.genre}</span>
                  {activeReadingWork.score && (
                    <span>• Rubrik: {activeReadingWork.score}/100</span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-4xl font-bold font-serif-literary text-slate-900 leading-tight">
                  {activeReadingWork.title}
                </h2>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    {activeReadingWork.authorDisplayName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(activeReadingWork.publishedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{activeReadingWork.wordCount} Kelime</span>
                </div>
              </div>

              {/* Randomizer Cards Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-700">
                <div>
                  <span className="block font-bold text-slate-400 uppercase text-[9px]">Mekân</span>
                  <span className="font-medium text-slate-800 line-clamp-2">{activeReadingWork.place || 'Serbest'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-400 uppercase text-[9px]">Zaman</span>
                  <span className="font-medium text-slate-800 line-clamp-2">{activeReadingWork.time || 'Serbest'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-400 uppercase text-[9px]">Karakter</span>
                  <span className="font-medium text-slate-800 line-clamp-2">{activeReadingWork.character || 'Serbest'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-400 uppercase text-[9px]">Sürpriz Kart</span>
                  <span className="font-medium text-teal-700 line-clamp-2">{activeReadingWork.surpriseCard || 'Serbest'}</span>
                </div>
              </div>

              {/* Story Text */}
              <div className="prose prose-slate max-w-none text-slate-800 font-serif-literary text-base sm:text-lg leading-relaxed space-y-4 pt-2">
                {activeReadingWork.content.split(/\n\n+/).map((para, idx) => (
                  <p key={idx} className="indent-6 sm:indent-8 text-justify">
                    {para}
                  </p>
                ))}
              </div>

              {/* Teacher Editorial Note */}
              {activeReadingWork.teacherEditorNotes && (
                <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 text-xs text-teal-950 flex items-start gap-3 mt-6">
                  <Award className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-teal-800 block mb-0.5">
                      Öğretmen & Yayın Kurulu Değerlendirmesi
                    </span>
                    <p className="italic font-serif-literary leading-relaxed">
                      "{activeReadingWork.teacherEditorNotes}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleLike(activeReadingWork.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  likedMap[activeReadingWork.id]
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Heart className={`w-4 h-4 ${likedMap[activeReadingWork.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{likedMap[activeReadingWork.id] ? 'Beğenildi' : 'Beğen'} ({activeReadingWork.likesCount || 0})</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => printPublishedWork(activeReadingWork)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır / PDF</span>
                </button>
                <button
                  onClick={() => exportStoryToDocx(activeReadingWork)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Word (.doc) İndir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
