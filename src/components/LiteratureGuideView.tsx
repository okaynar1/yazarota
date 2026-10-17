import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  FileText,
  Compass,
  CheckCircle,
  Bookmark,
} from 'lucide-react';
import { LITERATURE_GUIDES, GENRES } from '../data/writingData';
import { GenreType } from '../types';

interface LiteratureGuideViewProps {
  onStartWritingWithGenre: (genre: GenreType) => void;
}

export const LiteratureGuideView: React.FC<LiteratureGuideViewProps> = ({
  onStartWritingWithGenre,
}) => {
  const [selectedGenreId, setSelectedGenreId] = useState<GenreType>('hikaye');

  const currentGuide =
    LITERATURE_GUIDES.find((g) => g.id === selectedGenreId) || LITERATURE_GUIDES[0];
  const currentGenreMeta = GENRES.find((g) => g.id === selectedGenreId) || GENRES[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span>Edebiyat Atölyesi Rehberi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Edebî Türler ve Yazma Kılavuzları
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-serif-literary">
            Her türün anlatım yapısını, dikkat edilecek tuzaklarını, yönlendirici sorularını ve özgün örneklerini keşfet.
          </p>
        </div>

        <button
          onClick={() => onStartWritingWithGenre(selectedGenreId)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all hover:scale-105 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Bu Türde Hikâye Başlat</span>
        </button>
      </div>

      {/* Genre Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {GENRES.map((g) => {
          const isSelected = selectedGenreId === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setSelectedGenreId(g.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{g.title}</span>
            </button>
          );
        })}
      </div>

      {/* Guide Main Details Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-10">
        {/* Title & Definition Banner */}
        <div className="space-y-4 pb-6 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              {currentGenreMeta.badge}
            </span>
            <span className="text-xs text-slate-500">
              MEB & Edebiyat Müfredatına Uyumlu
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            {currentGuide.title}
          </h2>
          <p className="text-teal-700 font-serif-literary text-base italic font-medium">
            “{currentGuide.subtitle}”
          </p>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm font-serif-literary text-slate-800 leading-relaxed">
            <strong className="text-slate-900 font-sans block mb-1">Türün Tanımı:</strong>
            {currentGuide.definition}
          </div>
        </div>

        {/* 2-Columns: Key Features & Narrative Structure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Key Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-teal-800">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-bold font-display text-slate-900">
                Temel Ayırt Edici Özellikler
              </h3>
            </div>

            <ul className="space-y-2.5">
              {currentGuide.keyFeatures.map((feat, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-serif-literary leading-relaxed bg-teal-50/30 p-3 rounded-xl border border-teal-100/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Narrative Structure */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-800">
              <Compass className="w-5 h-5 text-cyan-600" />
              <h3 className="text-lg font-bold font-display text-slate-900">
                Olay Örgüsü ve Anlatım Yapısı
              </h3>
            </div>

            <ul className="space-y-2.5">
              {currentGuide.structure.map((struct, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-serif-literary leading-relaxed bg-cyan-50/30 p-3 rounded-xl border border-cyan-100/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 mt-2 shrink-0"></span>
                  <span>{struct}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Original Sample Excerpt */}
        <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-50/60 rounded-3xl p-6 sm:p-8 border border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
                Örnek Edebî Paragraf (Model Metin)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-md">
              Özgün Eser
            </span>
          </div>

          <h4 className="text-base font-bold font-display text-slate-900">
            “{currentGuide.sampleTitle}”
          </h4>

          <p className="text-xs sm:text-sm text-slate-800 font-serif-literary leading-relaxed italic border-l-2 border-amber-500 pl-4 py-1">
            {currentGuide.sampleExcerpt}
          </p>
        </div>

        {/* Guiding Questions & Watch Out Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Guiding Questions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-800">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold font-display text-slate-900">
                Yazarken Kendine Sorabileceğin Sorular
              </h3>
            </div>

            <div className="space-y-2.5">
              {currentGuide.guidingQuestions.map((q, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs sm:text-sm text-slate-800 font-serif-literary"
                >
                  ❓ {q}
                </div>
              ))}
            </div>
          </div>

          {/* Watch Out Tips / Pitfalls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="text-lg font-bold font-display text-slate-900">
                Dikkat Edilmesi Gereken Noktalar
              </h3>
            </div>

            <div className="space-y-2.5">
              {currentGuide.watchOutTips.map((tip, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs sm:text-sm text-slate-800 font-serif-literary"
                >
                  ⚠️ {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA for this Genre */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-serif-literary">
            Öğrendiklerini hemen tatbik et; ipuçlarını çek ve hikâyeni yazmaya başla.
          </div>

          <button
            onClick={() => onStartWritingWithGenre(selectedGenreId)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <span>{currentGenreMeta.title} Türüyle Hikâye Oluştur</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
