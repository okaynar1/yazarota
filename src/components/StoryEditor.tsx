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
  Send,
  GraduationCap,
  ListChecks,
  Cloud,
  X,
} from 'lucide-react';
import { Story, StoryVersion, AIReview, StoryPrompts } from '../types';
import { GENRES } from '../data/writingData';
import { evaluateStoryWithGemini, saveStory, submitStoryToTeacher } from '../services/api';
import { WordCloudView } from './WordCloudView';

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
    currentStory.currentVersionNumber || currentStory.versions.length || 1
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

  const [isSubmittingToTeacher, setIsSubmittingToTeacher] = useState<boolean>(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);
  const [isWordCloudOpen, setIsWordCloudOpen] = useState<boolean>(false);

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

  // Submit to Teacher workflow
  const handleSubmitToTeacher = async () => {
    if (wordCount < 20) {
      alert('Öğretmeninize göndermeden önce lütfen metninizi biraz daha geliştiriniz (en az 20 kelime).');
      return;
    }

    setIsSubmittingToTeacher(true);
    setSubmitSuccessMessage(null);
    try {
      await performSave(true);
      const updated = await submitStoryToTeacher(currentStory.id);
      await onSaveStory(updated);
      setSubmitSuccessMessage('Tebrikler! Yazınız başarıyla öğretmeninize iletildi.');
      setTimeout(() => setSubmitSuccessMessage(null), 6000);
    } catch (err: any) {
      alert(err?.message || 'Öğretmene gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmittingToTeacher(false);
    }
  };

  // Create a new version for revision (preserves history!)
  const handleStartNewVersionForRevision = async () => {
    const latestVersion = currentStory.versions[currentStory.versions.length - 1];
    const newVersionNum = currentStory.versions.length + 1;
    const now = new Date().toISOString();

    const newVer: StoryVersion = {
      id: `v${newVersionNum}-${Date.now()}`,
      versionNumber: newVersionNum,
      title: latestVersion.title || currentStory.title,
      content: latestVersion.content, // prefill with previous version
      wordCount: latestVersion.wordCount,
      characterCount: latestVersion.characterCount,
      createdAt: now,
      studentNotes: `Sürüm ${newVersionNum}: Öğretmen düzeltme önerileri uygulanıyor.`,
    };

    const updatedStory: Story = {
      ...currentStory,
      currentVersionNumber: newVersionNum,
      updatedAt: now,
      versions: [...currentStory.versions, newVer],
    };

    await onSaveStory(updatedStory);
    setActiveVersionNumber(newVersionNum);
    alert(`Sürüm ${newVersionNum} oluşturuldu. Önceki sürümünüz korundu, düzeltmelerinizi bu yeni sürümde yapabilirsiniz.`);
  };

  const genreObj = GENRES.find((g) => g.id === currentStory.genre) || GENRES[0];
  const progressPercent = Math.min(100, Math.round((wordCount / minWordLimit) * 100));

  // Find if teacher requested revision on any version
  const teacherFeedback = activeVersion?.teacherFeedback || currentStory.versions.find((v) => v.teacherFeedback)?.teacherFeedback;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Teacher Revision Request Banner (if applicable) */}
      {currentStory.status === 'revision_requested' && teacherFeedback && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 shadow-md space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <GraduationCap className="w-5 h-5 text-amber-600" />
              <span>Öğretmeninizden Düzeltme Talebi Var (Rubrik Puanı: {teacherFeedback.rubricTotal}/100)</span>
            </div>
            <button
              onClick={handleStartNewVersionForRevision}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Yeni Sürümde Düzeltmeye Başla (Sürüm {currentStory.versions.length + 1})</span>
            </button>
          </div>

          {teacherFeedback.generalComment && (
            <p className="text-xs text-amber-950 font-serif-literary italic leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200">
              “{teacherFeedback.generalComment}”
            </p>
          )}

          {teacherFeedback.revisionChecklist && teacherFeedback.revisionChecklist.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Öğretmeninizin İncelemenizi İstediği Maddeler:
              </span>
              <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                {teacherFeedback.revisionChecklist.map((item, idx) => (
                  <li key={idx} className="font-medium">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Submission Success Toast */}
      {submitSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{submitSuccessMessage}</span>
        </div>
      )}

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
            {currentStory.status && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                Durum: {
                  currentStory.status === 'pending_teacher'
                    ? 'Öğretmen İncelemesinde'
                    : currentStory.status === 'revision_requested'
                    ? 'Düzeltme İstendi'
                    : currentStory.status === 'resubmitted'
                    ? 'Yeniden Gönderildi'
                    : currentStory.status === 'approved'
                    ? 'Öğretmen Onayladı'
                    : currentStory.status === 'published'
                    ? 'Genç Kalemler Dergisi’nde Yayında'
                    : 'Taslak'
                }
              </span>
            )}
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
                <MapPin className="w-3 h-3" />
                {currentStory.genre === 'siir' ? 'Mekân / Doğa:' : 'Mekân:'}
              </span>
              <p className="text-slate-700 font-serif-literary line-clamp-3">{currentStory.place}</p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100/80">
              <span className="font-bold text-blue-800 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" />
                {currentStory.genre === 'siir' ? 'Zaman / An:' : 'Zaman:'}
              </span>
              <p className="text-slate-700 font-serif-literary line-clamp-3">{currentStory.time}</p>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100/80">
              <span className="font-bold text-purple-800 flex items-center gap-1 mb-1">
                <User className="w-3 h-3" />
                {currentStory.genre === 'siir'
                  ? 'Tema / Şiirsel Özne:'
                  : currentStory.genre === 'fabl'
                  ? 'Karakter (Hayvan / Varlık):'
                  : 'Karakter:'}
              </span>
              <p className="text-slate-700 font-serif-literary line-clamp-3">{currentStory.character}</p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 sm:col-span-2 lg:col-span-1">
              <span className="font-bold text-rose-800 flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-rose-600" />
                {currentStory.genre === 'siir'
                  ? 'Şiirsel İmge & Sürpriz:'
                  : currentStory.genre === 'fabl'
                  ? 'Çatışma / Ders İpucu:'
                  : 'Sürpriz Kartı:'}
              </span>
              <p className="text-slate-800 font-serif-literary line-clamp-3 font-medium">
                {currentStory.surpriseCard}
              </p>
            </div>
          </div>
        )}
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
                type="button"
                onClick={() => onCompareVersions(currentStory)}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Sürümleri Karşılaştır</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsWordCloudOpen(true)}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-teal-600" />
              <span>Kelime Bulutu</span>
            </button>
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
            placeholder={
              currentStory.genre === 'siir'
                ? 'Şiirine İlham Veren Bir Başlık Koy...'
                : currentStory.genre === 'fabl'
                ? 'Fablına Bir Başlık Koy (Örn: Tilki ile Leylek)...'
                : 'Hikâyene Etkileyici Bir Başlık Koy...'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl sm:text-3xl font-bold font-display text-slate-900 placeholder:text-slate-300 outline-none border-b border-slate-100 pb-3"
          />
        </div>

        {/* Text Area Canvas */}
        <div className="px-6 sm:px-10 py-6 flex-1">
          <textarea
            placeholder={
              currentStory.genre === 'siir'
                ? 'Dizelerin burada hayat buluyor... Seçtiğin tema, imge ve duyguyla serbest veya ölçülü dizelerini kaleme al...'
                : currentStory.genre === 'fabl'
                ? 'Fablın burada başlıyor... Kahraman hayvanlarının karşılaşması, kurnazlık veya erdem çatışmasıyla olayları anlatmaya koyul...'
                : 'Hikâyen burada başlıyor... Seçtiğin mekânın kokusuyla, zamanın akışıyla veya karakterinin ilk hareketiyle yazmaya koyul...'
            }
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

          {/* Action Buttons: AI Evaluation + Send to Teacher */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBackToPromptWizard}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              İpuçlarına Dön
            </button>

            {/* AI Evaluation */}
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                isEvaluating
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-teal-600/30 active:scale-[0.98]'
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
                  <span>Yapay Zekâ ile Değerlendir</span>
                </>
              )}
            </button>

            {/* Submit to Teacher Button */}
            <button
              onClick={handleSubmitToTeacher}
              disabled={isSubmittingToTeacher}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-md shadow-amber-700/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingToTeacher ? 'Gönderiliyor...' : 'Öğretmene Gönder'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Evaluation Error Banner if any */}
      {evaluationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold font-sans block">Değerlendirme Uyarısı:</span>
              <p className="font-serif-literary text-rose-800">{evaluationError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors"
            >
              Tekrar Dene
            </button>
            <button
              onClick={() => setEvaluationError(null)}
              className="p-1 rounded-md text-rose-400 hover:text-rose-700 transition-colors"
              title="Kapat"
            >
              ✕
            </button>
          </div>
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

      {/* Kelime Bulutu Modal */}
      {isWordCloudOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#faf8f5] w-full max-w-5xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto my-8 relative">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900 font-display">
                  Yazı Detayları: Kelime Bulutu ve Sözcük Haritası
                </h3>
              </div>
              <button
                onClick={() => setIsWordCloudOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <WordCloudView
              story={{
                ...currentStory,
                versions: currentStory.versions.map((v) =>
                  v.versionNumber === activeVersionNumber
                    ? { ...v, content, title }
                    : v
                ),
              }}
              initialVersionNumber={activeVersionNumber}
            />
          </div>
        </div>
      )}
    </div>
  );
};
