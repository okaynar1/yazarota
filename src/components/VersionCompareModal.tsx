import React, { useState } from 'react';
import { GitCompare, TrendingUp, FileText, ArrowRight, X, Layers, CheckCircle } from 'lucide-react';
import { Story, StoryVersion } from '../types';

interface VersionCompareModalProps {
  story: Story;
  onClose: () => void;
  onSelectVersionToEdit: (versionNumber: number) => void;
}

export const VersionCompareModal: React.FC<VersionCompareModalProps> = ({
  story,
  onClose,
  onSelectVersionToEdit,
}) => {
  const versions = story.versions || [];
  const [versionAIndex, setVersionAIndex] = useState<number>(0);
  const [versionBIndex, setVersionBIndex] = useState<number>(
    versions.length > 1 ? versions.length - 1 : 0
  );

  const verA = versions[versionAIndex];
  const verB = versions[versionBIndex];

  if (!verA || !verB) return null;

  const wordDelta = (verB.wordCount || 0) - (verA.wordCount || 0);
  const scoreA = verA.review?.totalScore ?? null;
  const scoreB = verB.review?.totalScore ?? null;
  const scoreDelta = scoreA !== null && scoreB !== null ? scoreB - scoreA : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:px-8 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900">
                Sürümler Arası Gelişim ve Karşılaştırma
              </h3>
              <p className="text-xs text-slate-500 font-serif-literary">
                “{story.title}” — İlk taslaktan son sürüme kadar yaşanan dönüşüm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Selectors & Quick Delta Stats */}
        <div className="p-5 sm:px-8 border-b border-slate-100 bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Karşılaştır:</span>
            <select
              value={versionAIndex}
              onChange={(e) => setVersionAIndex(parseInt(e.target.value, 10))}
              className="bg-white border border-slate-300 text-xs font-semibold text-slate-800 rounded-lg px-2.5 py-1.5 outline-none"
            >
              {versions.map((v, i) => (
                <option key={v.id} value={i}>
                  Sürüm {v.versionNumber} ({v.wordCount} kelime)
                </option>
              ))}
            </select>

            <span className="text-slate-400">ile</span>

            <select
              value={versionBIndex}
              onChange={(e) => setVersionBIndex(parseInt(e.target.value, 10))}
              className="bg-white border border-slate-300 text-xs font-semibold text-slate-800 rounded-lg px-2.5 py-1.5 outline-none"
            >
              {versions.map((v, i) => (
                <option key={v.id} value={i}>
                  Sürüm {v.versionNumber} ({v.wordCount} kelime)
                </option>
              ))}
            </select>
          </div>

          {/* Word Count Difference */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <FileText className="w-4 h-4 text-teal-600 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-500">Kelime Sayısı Farkı: </span>
              <strong
                className={`font-bold ${
                  wordDelta > 0 ? 'text-emerald-600' : wordDelta < 0 ? 'text-amber-600' : 'text-slate-700'
                }`}
              >
                {wordDelta > 0 ? `+${wordDelta}` : wordDelta} kelime
              </strong>
            </div>
          </div>

          {/* AI Score Difference */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <TrendingUp className="w-4 h-4 text-cyan-600 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-500">Puan Değişimi: </span>
              {scoreDelta !== null ? (
                <strong
                  className={`font-bold ${
                    scoreDelta > 0 ? 'text-emerald-600' : scoreDelta < 0 ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} Puan ({scoreA} → {scoreB})
                </strong>
              ) : (
                <span className="text-slate-400 italic">Değerlendirme bekleniyor</span>
              )}
            </div>
          </div>
        </div>

        {/* Side-by-side Text Content Comparison */}
        <div className="flex-1 overflow-y-auto p-5 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Version A Box */}
          <div className="space-y-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-teal-800 uppercase bg-teal-100/80 px-2.5 py-0.5 rounded-md">
                  Sürüm {verA.versionNumber} (Önceki)
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(verA.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>

              <h4 className="font-bold text-base font-display text-slate-900 mt-3 mb-2">
                {verA.title || 'Başlıksız'}
              </h4>

              <p className="text-xs sm:text-sm text-slate-700 font-serif-literary leading-relaxed whitespace-pre-wrap">
                {verA.content}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200/80 mt-4 text-xs space-y-1">
              {verA.studentNotes && (
                <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                  <strong>Öğrenci Notu:</strong> {verA.studentNotes}
                </p>
              )}
              {verA.review && (
                <p className="text-teal-800 font-semibold">
                  Değerlendirme Puanı: {verA.review.totalScore}/100
                </p>
              )}
            </div>
          </div>

          {/* Version B Box */}
          <div className="space-y-3 bg-teal-50/40 p-5 rounded-2xl border border-teal-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-teal-200/80">
                <span className="text-xs font-bold text-teal-900 uppercase bg-teal-200/80 px-2.5 py-0.5 rounded-md">
                  Sürüm {verB.versionNumber} (Sonraki)
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(verB.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>

              <h4 className="font-bold text-base font-display text-slate-900 mt-3 mb-2">
                {verB.title || 'Başlıksız'}
              </h4>

              <p className="text-xs sm:text-sm text-slate-800 font-serif-literary leading-relaxed whitespace-pre-wrap">
                {verB.content}
              </p>
            </div>

            <div className="pt-4 border-t border-teal-200/80 mt-4 text-xs space-y-2">
              {verB.studentNotes && (
                <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-teal-200">
                  <strong>Öğrenci Notu:</strong> {verB.studentNotes}
                </p>
              )}
              {verB.review && (
                <p className="text-teal-900 font-bold">
                  Değerlendirme Puanı: {verB.review.totalScore}/100
                </p>
              )}

              <button
                onClick={() => {
                  onSelectVersionToEdit(verB.versionNumber);
                  onClose();
                }}
                className="w-full py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-sm transition-colors text-center"
              >
                Bu Sürümü Düzenlemeye Devam Et
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 px-8">
          <p className="font-serif-literary italic">
            * Puan artışı garanti edilmez; amaç salt puan değil, yazının kurgusal ve anlatımsal olgunlaşmasıdır.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
