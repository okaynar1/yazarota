import React from 'react';
import {
  Sparkles,
  BookOpen,
  Compass,
  Search,
  Scroll,
  Feather,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { GENRES } from '../data/writingData';
import { GenreType } from '../types';

interface HomeViewProps {
  onStartNewStory: (preSelectedGenre?: GenreType) => void;
  onNavigateTab: (tab: any) => void;
  savedStoriesCount: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartNewStory,
  onNavigateTab,
  savedStoriesCount,
}) => {
  const getGenreIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-6 h-6" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6" />;
      case 'Compass':
        return <Compass className="w-6 h-6" />;
      case 'Search':
        return <Search className="w-6 h-6" />;
      case 'Scroll':
        return <Scroll className="w-6 h-6" />;
      case 'Feather':
        return <Feather className="w-6 h-6" />;
      default:
        return <BookOpen className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>YAZAROTA — Lise Yaratıcı Yazarlık Platformu</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-tight text-slate-100">
            Bugün nasıl bir{' '}
            <span className="bg-gradient-to-r from-teal-300 via-cyan-200 to-amber-200 bg-clip-text text-transparent">
              hikâye
            </span>{' '}
            yazacaksın?
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-serif-literary leading-relaxed">
            Bir tür seç, rastgele gelen ipuçlarını keşfet ve kendi hikâyeni oluştur. Her yeni deneme seni daha güçlü bir yazara dönüştürür.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onStartNewStory()}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-base shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>Yeni Hikâye Oluştur</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigateTab('guide')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>Edebiyat Rehberini Keşfet</span>
            </button>

            {savedStoriesCount > 0 && (
              <button
                onClick={() => onNavigateTab('stories')}
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                <span>Yazılarıma Git ({savedStoriesCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Floating Mini Feature Badges */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>20+ Mekân & 20+ Karakter</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>25 Özgün Sürpriz Kartı</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Gemini 3.8 Flash Rubriği</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>TÜBİTAK 2204-A Modu</span>
          </div>
        </div>
      </section>

      {/* Literary Genres Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 font-mono">
              Edebî Türler
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 mt-1">
              Hangi türün dünyasına adım atmak istersin?
            </h2>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl font-serif-literary">
              Her türün kendine has kuralları, anlatım ritmi ve lezzeti vardır. Bir tür seçerek rastgele hikâye çarkını hemen çevirebilirsin.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('guide')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 shrink-0"
          >
            <span>Tüm Tür Rehberlerini İncele</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GENRES.map((genre) => (
            <div
              key={genre.id}
              className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-teal-500/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${genre.colorClass}`}
                  >
                    {getGenreIcon(genre.iconName)}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {genre.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 font-display mb-2 group-hover:text-teal-700 transition-colors">
                  {genre.title}
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {genre.shortDesc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onStartNewStory(genre.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold tracking-wide transition-all group-hover:bg-teal-700"
                >
                  <span>Bu Türle Hikâye Başlat</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why YAZAROTA? / Pedagogical Philosophy */}
      <section className="bg-gradient-to-r from-amber-50/70 via-teal-50/50 to-cyan-50/70 rounded-3xl p-8 sm:p-12 border border-amber-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 font-mono">
              Yazma Korkusunu Yenmenin Formülü
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Kusursuzluk Değil, Gelişim Odaklı Yazma
            </h2>
            <p className="text-slate-700 text-base font-serif-literary max-w-2xl mx-auto italic">
              “Boş bir sayfaya bakıp ne yazacağını bilememek, en usta yazarların dahi yaşadığı bir durumdur. YAZAROTA sana kıvılcım verir; hikâyeyi ateşlemek ise senin hayal gücüne aittir.”
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-teal-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-slate-900 font-display">Rastgele İpuçları</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Mekân, zaman, karakter ve beklenmedik bir sürpriz kartı kurguna yön verir. Zihnini zorlayan bağlantılar yaratıcılığını tetikler.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-amber-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-slate-900 font-display">Yapay Zekâ Rubrik Rehberi</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Yazın 7 edebî ölçüt üzerinden incelenir. Yapay zekâ metnini baştan yazmaz; kendi ifadelerini nasıl geliştirebileceğini somut örneklerle gösterir.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-cyan-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-slate-900 font-display">Sürümler Arası Dönüşüm</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                İlk taslağın hiçbir zaman kaybolmaz. Yeni sürümler yazarak kelime, kurgu ve anlatımındaki somut gelişimi adım adım gözlemlersin.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
