import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  CheckCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  MapPin,
  User,
  Zap,
  AlertCircle,
  GitCompare,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';
import { Story, StoryVersion, AIReview, StoryPrompts } from '../types';
import { GENRES } from '../data/writingData';
import { evaluateStoryWithGemini, saveStory } from '../services/api';

interface StoryEditorProps {
  currentStory: Story;
  onSaveStory: (updatedStory: Story) => Promise<void>;
  onEvaluationComplete: (review: AIReview, story: Story) => void;
  onCompareVersions: (story: Story) => void;
  onBackToPromptWizard: () => void;
  minWordLimit?: number;
  maxWordLimit?: number;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
  currentStory,
  onSaveStory,
  onEvaluationComplete,
  onCompareVersions,
  onBackToPromptWizard,
  minWordLimit = 150,
  maxWordLimit = 500,
}) => {
  const [activeVersionNumber, setActiveVersionNumber] = useState<number>(
    currentStory.currentVersionNumber || 1
  );

  const activeVersion =
    currentStory.versions.find((v) => v.versionNumber === activeVersionNumber) ||
    currentStory.versions[currentStory.versions.length - 1];

  const [title, setTitle] = useState(activeVersion?.title || currentStory.title || '');
  const [content, setContent] = useState(activeVersion?.content || '');
  const [studentNotes, setStudentNotes] = useState(activeVersion?.studentNotes || '');

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Az önce');
  const [isPromptsExpanded, setIsPromptsExpanded] = useState<boolean>(true);

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Sync state when activeVersionNumber changes
  useEffect(() => {
    const v = currentStory.versions.find((item) => item.versionNumber === activeVersionNumber);
    if (v) {
      setTitle(v.title || currentStory.title);
      setContent(v.content);
      setStudentNotes(v.studentNotes || '');
    }
  }, [activeVersionNumber, currentStory]);

  // Real-time word and character count
  const calculateWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const wordCount = calculateWordCount(content);
  const characterCount = content.length;

  // Auto-save logic
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  const studentNotesRef = useRef(studentNotes);
  contentRef.current = content;
  titleRef.current = title;
  studentNotesRef.current = studentNotes;

  const performSave = async (isManual = false) => {
    setSaveStatus('saving');
    try {
      const updatedVersions = currentStory.versions.map((v) => {
        if (v.versionNumber === activeVersionNumber) {
          return {
            ...v,
            title: titleRef.current,
            content: contentRef.current,
            wordCount: calculateWordCount(contentRef.current),
            characterCount: contentRef.current.length,
            studentNotes: studentNotesRef.current,
          };
        }
        return v;
      });

      const updatedStory: Story = {
        ...currentStory,
        title: titleRef.current || currentStory.title || 'Başlıksız Hikâye',
        updatedAt: new Date().toISOString(),
        versions: updatedVersions,
      };

      await onSaveStory(updatedStory);
      setSaveStatus('saved');
      setLastSavedTime(
        new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('unsaved');
    }
  };

  // Debounced auto-save timer
  useEffect(() => {
    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      performSave();
    }, 2500);

    return () => clearTimeout(timer);
  }, [content, title, studentNotes]);

  // Trigger Gemini AI evaluation
  const handleEvaluate = async () => {
    if (wordCount < 15) {
      setEvaluationError('Değerlendirme alabilmek için lütfen en az 15 kelimelik bir metin yazınız.');
      return;
    }

    setEvaluationError(null);
    setIsEvaluating(true);

    try {
      // First save the latest content
      await performSave(true);

      const review = await evaluateStoryWithGemini({
        title: title.trim() || currentStory.title || 'Başlıksız',
        content: content.trim(),
        genre: currentStory.genre,
        place: currentStory.place,
        time: currentStory.time,
        character: currentStory.character,
        surpriseCard: currentStory.surpriseCard,
        versionNumber: activeVersionNumber,
        wordCount: wordCount,
      });

      // Update story with the review attached to this version
      const updatedVersions = currentStory.versions.map((v) => {
        if (v.versionNumber === activeVersionNumber) {
          return {
            ...v,
            review: review,
          };
        }
        return v;
      });

      const finalStory: Story = {
        ...currentStory,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        versions: updatedVersions,
      };

      await onSaveStory(finalStory);
      onEvaluationComplete(review, finalStory);
    } catch (error: any) {
      console.error('Gemini evaluation failed:', error);
      setEvaluationError(
        error.message || 'Yapay zekâ değerlendirmesi alınırken bir hata oluştu. Lütfen tekrar deneyiniz.'
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const genreObj = GENRES.find((g) => g.id === currentStory.genre) || GENRES[0];

  // Word count progress ratio
  const progressPercent = Math.min(100, Math.round((wordCount / minWordLimit) * 100));

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Banner / Prompts Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div
          onClick={() => setIsPromptsExpanded(!isPromptsExpanded)}
          className="p-4 bg-slate-50 hover:bg-slate-100/70 border-b border-slate-200/70 flex items-center justify-between cursor-pointer select-none transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {genreObj.title}
            </span>
            <span className="text-xs text-slate-600 hidden sm:inline">
              Seçilen Kurgu İpuçları
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              {isPromptsExpanded ? 'İpuçlarını Gizle' : 'İpuçlarını Göster'}
            </span>
            {isPromptsExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {isPromptsExpanded && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white text-xs">
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100/80">
              <span className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" /> Mekân:
              </span>
              <p className="text-slate-700 font-serif-literary line-clamp-3">{currentStory.place}</p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100/80">
              <span className="font-bold text-blue-800 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Zaman:
              </span>
              <p className="text-slate-700 font-serif-literary line-clamp-3">{currentStory.time}</p>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100/80">
              <span className="font-bold text-purple-800 flex items-center gap-1 mb-1">
                <User className="w-3 h-3" /> Karakter:
              </span>
              <p className="text-slate-700 font-serif-literary line-clamp-3">{currentStory.character}</p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 sm:col-span-2 lg:col-span-1">
              <span className="font-bold text-rose-800 flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-rose-600" /> Sürpriz Kartı:
              </span>
              <p className="text-slate-800 font-serif-literary line-clamp-3 font-medium">
                {currentStory.surpriseCard}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Encouraging Student Reminder Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border border-teal-200/80 flex items-center gap-3 text-xs sm:text-sm text-teal-950 font-serif-literary shadow-sm">
        <Sparkles className="w-5 h-5 text-teal-600 shrink-0" />
        <p>
          <strong>Hatırlatma:</strong> “Bu hikâye senin hayal gücünle şekillenecek. Kusursuz yazmak zorunda değilsin. Önce yaz, sonra birlikte geliştirelim.”
        </p>
      </div>

      {/* Editor Main Canvas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden flex flex-col">
        {/* Editor Sub-header with Versions & Auto-save */}
        <div className="p-4 sm:px-6 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          {/* Version Selector Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Sürüm:
            </span>
            <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
              {currentStory.versions.map((ver) => (
                <button
                  key={ver.id}
                  onClick={() => setActiveVersionNumber(ver.versionNumber)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeVersionNumber === ver.versionNumber
                      ? 'bg-white text-teal-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sürüm {ver.versionNumber}
                  {ver.review && (
                    <span className="ml-1 text-[10px] text-teal-600 font-bold">
                      ({ver.review.totalScore}P)
                    </span>
                  )}
                </button>
              ))}
            </div>

            {currentStory.versions.length > 1 && (
              <button
                onClick={() => onCompareVersions(currentStory)}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Sürümleri Karşılaştır</span>
              </button>
            )}
          </div>

          {/* Auto-save Status & Manual Save */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kaydedildi ({lastSavedTime})</span>
                </>
              )}
              {saveStatus === 'saving' && (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Düzenleniyor</span>
                </>
              )}
            </span>

            <button
              onClick={() => performSave(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Taslak Kaydet</span>
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="px-6 sm:px-10 pt-6">
          <input
            type="text"
            placeholder="Hikâyene Etkileyici Bir Başlık Koy..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl sm:text-3xl font-bold font-display text-slate-900 placeholder:text-slate-300 outline-none border-b border-slate-100 pb-3"
          />
        </div>

        {/* Text Area Canvas */}
        <div className="px-6 sm:px-10 py-6 flex-1">
          <textarea
            placeholder="Hikâyen burada başlıyor... Seçtiğin mekânın kokusuyla, zamanın akışıyla veya karakterinin ilk hareketiyle yazmaya koyul..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className="w-full resize-y text-base sm:text-lg text-slate-800 placeholder:text-slate-300 outline-none font-serif-literary leading-relaxed min-h-[360px]"
          />
        </div>

        {/* Live Counters & Progress Bar Footer */}
        <div className="p-4 sm:px-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-900 text-sm">{wordCount}</span> kelime
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">{characterCount}</span> karakter
            </div>
            <div className="flex items-center gap-2">
              <span>Hedef: {minWordLimit} - {maxWordLimit} kelime</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    wordCount >= minWordLimit && wordCount <= maxWordLimit
                      ? 'bg-emerald-500'
                      : wordCount > maxWordLimit
                      ? 'bg-amber-500'
                      : 'bg-teal-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPromptWizard}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              İpuçlarına Dön
            </button>

            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                isEvaluating
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-teal-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isEvaluating ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Gemini İnceliyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Hikâyemi Değerlendir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Evaluation Error Banner if any */}
      {evaluationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{evaluationError}</span>
          </div>
          <button
            onClick={() => setEvaluationError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Existing Review Badge if this version already has one */}
      {activeVersion?.review && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-700" />
              <span className="font-bold text-sm text-teal-950 font-display">
                Bu Sürümün Değerlendirmesi Mevcut ({activeVersion.review.totalScore}/100 Puan)
              </span>
            </div>
            <p className="text-xs text-slate-600 font-serif-literary">
              Gemini değerlendirme kartını ve 7 ölçüt analizini tekrar inceleyebilirsiniz.
            </p>
          </div>

          <button
            onClick={() => onEvaluationComplete(activeVersion.review!, currentStory)}
            className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shrink-0 shadow-sm transition-colors"
          >
            Değerlendirme Raporunu Aç
          </button>
        </div>
      )}
    </div>
  );
};
