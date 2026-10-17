import React from 'react';
import {
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Compass,
  Zap,
  RotateCcw,
  BookOpen,
  Info,
  GitCompare,
  Edit,
} from 'lucide-react';
import { AIReview, Story, StoryVersion } from '../types';

interface EvaluationViewProps {
  review: AIReview;
  story: Story;
  onApplySuggestionsAndCreateNewVersion: (currentStory: Story) => void;
  onBackToEditor: () => void;
  onCompareVersions: (story: Story) => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  review,
  story,
  onApplySuggestionsAndCreateNewVersion,
  onBackToEditor,
  onCompareVersions,
}) => {
  const currentVersion =
    story.versions.find((v) => v.review?.id === review.id) ||
    story.versions[story.versions.length - 1];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-teal-600 bg-teal-50 border-teal-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Gemini 3.8 Flash Edebî Değerlendirme Raporu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            “{currentVersion?.title || story.title}” — Sürüm {currentVersion?.versionNumber || 1}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Değerlendirme Tarihi: {new Date(review.evaluatedAt).toLocaleString('tr-TR')} • {currentVersion?.wordCount || 0} kelime
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onBackToEditor}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Editöre Dön
          </button>

          {story.versions.length > 1 && (
            <button
              onClick={() => onCompareVersions(story)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Sürümleri Karşılaştır</span>
            </button>
          )}

          <button
            onClick={() => onApplySuggestionsAndCreateNewVersion(story)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Önerilerimi Uygula (Yeni Sürüm Yaz)</span>
          </button>
        </div>
      </div>

      {/* 1. Genel Değerlendirme & Toplam Puan Hero */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
              1. Genel Değerlendirme
            </span>
            <p className="text-base sm:text-lg font-serif-literary text-slate-100 leading-relaxed italic">
              “{review.generalReview}”
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-slate-900/80 rounded-2xl border border-teal-500/30 text-center shadow-lg">
            <span className="text-xs text-slate-400 font-medium">Toplam Başarı Puanı</span>
            <div className="text-4xl sm:text-5xl font-extrabold text-teal-300 font-display mt-1">
              {review.totalScore}
              <span className="text-lg text-slate-400 font-normal">/100</span>
            </div>
            <span className="text-[11px] text-teal-400/80 mt-1 font-medium">YAZAROTA Rubriği</span>
          </div>
        </div>

        {/* Disclaimer / Pedagogical Guidance */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p>
            <strong>Önemli Hatırlatma:</strong> Bu puanlar kesin ve tarafsız bir ölçüm olmayıp, yapay zekâ destekli bir gelişim geri bildirimidir. Amaç puan toplamak değil, yazma becerilerini ve edebî farkındalığını adım adım zenginleştirmektir.
          </p>
        </div>
      </div>

      {/* 2. Puan Kartı (7 Ölçüt) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 font-mono">
              2. Puan Kartı
            </span>
            <h3 className="text-xl font-bold font-display text-slate-900">
              Rubrik Ölçütleri ve Gerekçeleri
            </h3>
          </div>
          <span className="text-xs text-slate-500">7 Ayrı Ölçüt</span>
        </div>

        <div className="space-y-4">
          {review.criteriaScores.map((crit, idx) => (
            <div
              key={crit.key || idx}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-teal-300 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-sm text-slate-800 font-display">
                  {crit.label}
                </span>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full border ${getScoreColor(
                    Math.round((crit.score / crit.maxScore) * 100)
                  )}`}
                >
                  {crit.score} / {crit.maxScore} Puan
                </span>
              </div>
              <p className="text-xs text-slate-600 font-serif-literary leading-relaxed">
                {crit.justification}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3 & 4. Başarılı Olduğun Yönler & Geliştirebileceğin Yönler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Başarılı Yönler */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                3. Başarılı Olduğun Yönler
              </span>
              <h4 className="font-bold text-slate-900 font-display text-base">Güçlü Kalem Darbeleri</h4>
            </div>
          </div>

          <div className="space-y-3">
            {review.strengths.map((str, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-700 font-serif-literary leading-relaxed"
              >
                {str}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Geliştirilebilecek Yönler */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 font-mono">
                4. Geliştirebileceğin Yönler
              </span>
              <h4 className="font-bold text-slate-900 font-display text-base">Zenginleştirme Fırsatları</h4>
            </div>
          </div>

          <div className="space-y-3">
            {review.areasToImprove.map((area, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-slate-700 font-serif-literary leading-relaxed"
              >
                {area}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Üç Gelişim Önerisi */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 font-mono">
              5. Üç Öncelikli Gelişim Önerisi
            </span>
            <h4 className="font-bold text-slate-900 font-display text-lg">
              Bir Sonraki Sürümde Uygulayabileceğin 3 Adım
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {review.topThreeSuggestions.slice(0, 3).map((sug, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex flex-col justify-between space-y-3"
            >
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <p className="text-xs text-slate-800 font-serif-literary leading-relaxed font-medium">
                {sug}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 6 & 7. Tür Kontrolü & Sürpriz Kartı Kontrolü */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 6. Tür Kontrolü */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <h4 className="font-bold text-slate-900 font-display text-sm">
              6. Tür Kontrolü ({story.genre.toUpperCase()})
            </h4>
          </div>
          <p className="text-xs text-slate-700 font-serif-literary leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {review.genreCompliance}
          </p>
        </div>

        {/* 7. Sürpriz Kartı Kontrolü */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-600" />
            <h4 className="font-bold text-slate-900 font-display text-sm">
              7. Sürpriz Kartı Entegrasyonu
            </h4>
          </div>
          <p className="text-xs text-slate-700 font-serif-literary leading-relaxed bg-rose-50/40 p-4 rounded-2xl border border-rose-100">
            {review.surpriseCardCompliance}
          </p>
        </div>
      </div>

      {/* 8. Sonraki Adım & Eylem Çağrısı */}
      <div className="bg-gradient-to-r from-teal-800 via-cyan-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-teal-700/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 font-mono">
            8. Sonraki Somut Adım
          </span>
          <h4 className="text-lg font-bold font-display text-slate-100">
            {review.nextActionStep}
          </h4>
          <p className="text-xs text-slate-300 font-serif-literary">
            Önceki taslağın güvende kalır. Yeni bir sürüm açarak bu öneriyi metnine hemen aktarabilirsin.
          </p>
        </div>

        <button
          onClick={() => onApplySuggestionsAndCreateNewVersion(story)}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Önerilerimi Uygula</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
