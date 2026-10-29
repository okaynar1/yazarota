import React from 'react';
import {
  BarChart3,
  TrendingUp,
  FileText,
  Award,
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Story, GenreType } from '../types';
import { GENRES, RUBRIC_CRITERIA_INFO } from '../data/writingData';

interface ProgressViewProps {
  stories: Story[];
  onStartWriting: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ stories, onStartWriting }) => {
  // If no stories at all, render honest empty state
  if (!stories || stories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-200 shadow-sm">
          <BarChart3 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Gelişim Yolculuğun Başlamak Üzere
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto font-serif-literary">
            “İlk hikâyeni yazdığında gelişim grafiğin burada oluşacak.”
          </p>
        </div>
        <button
          onClick={onStartWriting}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>İlk Hikâyeni Oluştur</span>
        </button>
      </div>
    );
  }

  // Calculate real metrics
  const totalStories = stories.length;
  const completedStories = stories.filter((s) => s.status === 'completed').length;

  let totalWordsWritten = 0;
  stories.forEach((s) => {
    s.versions.forEach((v) => {
      totalWordsWritten += v.wordCount || 0;
    });
  });

  // Most used genre calculation
  const genreCounts: Record<string, number> = {};
  stories.forEach((s) => {
    genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1;
  });

  let topGenreKey: string = stories[0]?.genre || 'hikaye';
  let topGenreCount = 0;
  Object.entries(genreCounts).forEach(([k, count]) => {
    if (count > topGenreCount) {
      topGenreCount = count;
      topGenreKey = k;
    }
  });

  const topGenreObj = GENRES.find((g) => g.id === topGenreKey) || GENRES[0];

  // Real review score progression over time
  interface ScorePoint {
    title: string;
    versionNo: number;
    score: number;
    date: string;
    storyId: string;
  }

  const scorePoints: ScorePoint[] = [];
  stories.forEach((story) => {
    story.versions.forEach((v) => {
      if (v.review && typeof v.review.totalScore === 'number') {
        scorePoints.push({
          title: v.title || story.title,
          versionNo: v.versionNumber,
          score: v.review.totalScore,
          date: v.review.evaluatedAt || v.createdAt,
          storyId: story.id,
        });
      }
    });
  });

  // Sort by date ascending
  scorePoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Criteria average calculations from real data
  const criteriaTotals: Record<string, { total: number; count: number; max: number; label: string }> = {
    title: { total: 0, count: 0, max: 10, label: 'Başlık Uygunluğu' },
    plot: { total: 0, count: 0, max: 25, label: 'Olay Örgüsü' },
    character: { total: 0, count: 0, max: 15, label: 'Karakter İşlenişi' },
    setting: { total: 0, count: 0, max: 10, label: 'Mekân ve Zaman' },
    genre: { total: 0, count: 0, max: 20, label: 'Türe Uygunluk' },
    language: { total: 0, count: 0, max: 15, label: 'Dil ve Anlatım' },
    creativity: { total: 0, count: 0, max: 10, label: 'Yaratıcılık' },
    theme_emotion: { total: 0, count: 0, max: 20, label: 'Duygu ve Düşünce Aktarımı' },
    imagery: { total: 0, count: 0, max: 20, label: 'İmge ve Çağrışım Gücü' },
    diction_rhythm: { total: 0, count: 0, max: 20, label: 'Sözcük Seçimi ve Ritim' },
    character_personification: { total: 0, count: 0, max: 20, label: 'Karakter ve Kişileştirme' },
    moral_theme: { total: 0, count: 0, max: 20, label: 'Ana Düşünce ve Ders' },
    surprise_card: { total: 0, count: 0, max: 10, label: 'Sürpriz Kartı / İmge Uyumu' },
  };

  scorePoints.forEach((sp) => {
    const story = stories.find((s) => s.id === sp.storyId);
    const ver = story?.versions.find((v) => v.versionNumber === sp.versionNo);
    const rev = ver?.review;
    if (rev?.criteriaScores) {
      rev.criteriaScores.forEach((c) => {
        if (!criteriaTotals[c.key]) {
          criteriaTotals[c.key] = {
            total: 0,
            count: 0,
            max: c.maxScore || 10,
            label: c.label || c.key,
          };
        }
        criteriaTotals[c.key].total += c.score;
        criteriaTotals[c.key].count += 1;
      });
    }
  });

  // Identify strengths & areas needing improvement
  const criteriaAnalysis = Object.entries(criteriaTotals)
    .filter(([_, data]) => data.count > 0)
    .map(([key, data]) => {
      const avg = data.total / data.count;
      const percentage = (avg / data.max) * 100;
      return {
        key,
        label: data.label,
        avg: Math.round(avg * 10) / 10,
        max: data.max,
        percentage: Math.round(percentage),
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  const strongCriteria = criteriaAnalysis.slice(0, 2);
  const improveCriteria = criteriaAnalysis.slice(-2).reverse();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>Gelişim Analizi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Yazma Becerisi Gelişim Raporun
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-serif-literary">
            Gerçekleştirdiğin tüm yazma çalışmaları ve Gemini değerlendirmelerinin analitiği.
          </p>
        </div>

        <button
          onClick={onStartWriting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all hover:scale-105 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Yeni Hikâye Ekle</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Toplam Hikâye</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {totalStories}
          </div>
          <div className="text-[11px] text-slate-500">Kayıtlı metin</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Yazılan Kelime</span>
            <BookOpen className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {totalWordsWritten}
          </div>
          <div className="text-[11px] text-slate-500">Tüm sürümler toplamı</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tamamlanan / AI</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {completedStories}
          </div>
          <div className="text-[11px] text-slate-500">Değerlendirilmiş hikâye</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Gözde Edebî Tür</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display truncate">
            {topGenreObj.title}
          </div>
          <div className="text-[11px] text-slate-500">{topGenreCount} kez tercih edildi</div>
        </div>
      </div>

      {/* Score Progression Over Time SVG Graph */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 font-mono">
              Zaman Çizelgesi
            </span>
            <h3 className="text-xl font-bold font-display text-slate-900">
              Değerlendirme Puanlarının Değişimi
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {scorePoints.length > 0 ? `${scorePoints.length} Değerlendirme Kaydı` : 'Henüz değerlendirme yok'}
          </span>
        </div>

        {scorePoints.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 italic bg-slate-50 rounded-2xl border border-slate-100">
            İlk hikâyeni tamamlayıp “Hikâyemi Değerlendir” butonuna bastığında puan ilerlemen burada çizilecek.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Custom Responsive SVG Chart */}
            <div className="w-full h-56 bg-gradient-to-b from-teal-50/40 to-white rounded-2xl border border-slate-100 p-4 relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />

                {/* Score line connecting points */}
                {scorePoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={scorePoints
                      .map((p, i) => {
                        const x =
                          scorePoints.length === 1
                            ? 250
                            : 40 + (i / (scorePoints.length - 1)) * 420;
                        // Score 0-100 mapped to y: 130 to 20
                        const y = 130 - (p.score / 100) * 110;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                )}

                {/* Data Points */}
                {scorePoints.map((p, i) => {
                  const x =
                    scorePoints.length === 1
                      ? 250
                      : 40 + (i / (scorePoints.length - 1)) * 420;
                  const y = 130 - (p.score / 100) * 110;

                  return (
                    <g key={i} className="group cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="#0f172a"
                        stroke="#14b8a6"
                        strokeWidth="3"
                        className="transition-transform group-hover:scale-125"
                      />
                      <text
                        x={x}
                        y={y - 12}
                        textAnchor="middle"
                        className="text-[11px] font-bold fill-slate-800"
                      >
                        {p.score}P
                      </text>
                      <text
                        x={x}
                        y={145}
                        textAnchor="middle"
                        className="text-[9px] fill-slate-400"
                      >
                        Sürüm {p.versionNo}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
              <span>İlk Deneme</span>
              <span>Son Düzenlemeler</span>
            </div>
          </div>
        )}
      </div>

      {/* Criteria Breakdown: Strong Areas & Areas to Improve */}
      {criteriaAnalysis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Areas */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-slate-900 font-display text-base">
                Ölçüt Bazında En Güçlü Olduğun Yönler
              </h4>
            </div>

            <div className="space-y-3">
              {strongCriteria.map((c) => (
                <div key={c.key} className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1.5">
                    <span>{c.label}</span>
                    <span>
                      {c.avg} / {c.max} (%{c.percentage})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-emerald-200/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${c.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Areas to Improve */}
          <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-slate-900 font-display text-base">
                Öncelikli Geliştirilebilecek Alanlar
              </h4>
            </div>

            <div className="space-y-3">
              {improveCriteria.map((c) => (
                <div key={c.key} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950 mb-1.5">
                    <span>{c.label}</span>
                    <span>
                      {c.avg} / {c.max} (%{c.percentage})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-amber-200/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${c.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
