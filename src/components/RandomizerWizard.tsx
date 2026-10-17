import React, { useState } from 'react';
import {
  Sparkles,
  Shuffle,
  RotateCcw,
  ArrowRight,
  BookOpen,
  MapPin,
  Clock,
  User,
  Zap,
  HelpCircle,
  Check,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import {
  GENRES,
  PLACES_POOL,
  TIMES_POOL,
  CHARACTERS_POOL,
  SURPRISE_CARDS_POOL,
} from '../data/writingData';
import { GenreType, StoryPrompts } from '../types';

interface RandomizerWizardProps {
  initialGenre?: GenreType;
  onStartWriting: (prompts: StoryPrompts) => void;
}

export const RandomizerWizard: React.FC<RandomizerWizardProps> = ({
  initialGenre,
  onStartWriting,
}) => {
  const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const [selectedGenre, setSelectedGenre] = useState<GenreType>(
    initialGenre || getRandomItem(GENRES).id
  );
  const [selectedPlace, setSelectedPlace] = useState<string>(() => getRandomItem(PLACES_POOL));
  const [selectedTime, setSelectedTime] = useState<string>(() => getRandomItem(TIMES_POOL));
  const [selectedCharacter, setSelectedCharacter] = useState<string>(() => getRandomItem(CHARACTERS_POOL));
  const [selectedSurpriseCard, setSelectedSurpriseCard] = useState<string>(() => getRandomItem(SURPRISE_CARDS_POOL));

  // Edit modals or dropdowns for individual card replacement
  const [activePicker, setActivePicker] = useState<'genre' | 'place' | 'time' | 'character' | 'surprise' | null>(null);

  // Shuffle individual elements
  const shuffleGenre = () => setSelectedGenre(getRandomItem(GENRES).id);
  const shufflePlace = () => setSelectedPlace(getRandomItem(PLACES_POOL));
  const shuffleTime = () => setSelectedTime(getRandomItem(TIMES_POOL));
  const shuffleCharacter = () => setSelectedCharacter(getRandomItem(CHARACTERS_POOL));
  const shuffleSurprise = () => setSelectedSurpriseCard(getRandomItem(SURPRISE_CARDS_POOL));

  // Shuffle all together
  const shuffleAll = () => {
    setSelectedGenre(getRandomItem(GENRES).id);
    setSelectedPlace(getRandomItem(PLACES_POOL));
    setSelectedTime(getRandomItem(TIMES_POOL));
    setSelectedCharacter(getRandomItem(CHARACTERS_POOL));
    setSelectedSurpriseCard(getRandomItem(SURPRISE_CARDS_POOL));
  };

  const currentGenreObj = GENRES.find((g) => g.id === selectedGenre) || GENRES[0];

  const handleProceed = () => {
    onStartWriting({
      genre: selectedGenre,
      place: selectedPlace,
      time: selectedTime,
      character: selectedCharacter,
      surpriseCard: selectedSurpriseCard,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Rastgele Hikâye Oluşturucu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Hikâyenin Kurgusal Yapı Taşları
          </h1>
          <p className="text-slate-600 text-sm mt-1 font-serif-literary">
            Kartları tek tek değiştirebilir, tümünü yeniden karıştırabilir veya dilediğin kartı listeden seçebilirsin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={shuffleAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Shuffle className="w-4 h-4 text-teal-600" />
            <span>Tümünü Yeniden Karıştır</span>
          </button>

          <button
            onClick={handleProceed}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Hikâyemi Yazmaya Başla</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 Stages Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Aşama 1: Edebî Tür Kartı */}
        <div className="bg-white rounded-2xl p-6 border-2 border-teal-500/40 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider uppercase text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Aşama 1: Edebî Tür
              </span>
              <button
                onClick={shuffleGenre}
                title="Rastgele Tür Seç"
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-700 border border-slate-200 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            <h3 className="text-xl font-bold font-display text-slate-900 mt-2">
              {currentGenreObj.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-3">
              {currentGenreObj.badge}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-serif-literary bg-slate-50 p-3 rounded-xl border border-slate-100">
              {currentGenreObj.shortDesc}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setActivePicker('genre')}
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Türü Kendim Seç</span>
            </button>
            <span className="text-[11px] text-slate-400">6 Tür Mevcut</span>
          </div>
        </div>

        {/* Aşama 2: Mekân Kartı */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Aşama 2: Mekân
              </span>
              <button
                onClick={shufflePlace}
                title="Yeni Mekân Çek"
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-700 border border-slate-200 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 mt-2">
              <p className="text-sm font-semibold text-slate-900 font-serif-literary leading-relaxed">
                “{selectedPlace}”
              </p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              Bu mekânın kokusu, ışığı ve sesleri hikâyenin atmosferini belirleyecek.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setActivePicker('place')}
              className="text-xs text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Mekânı Listeden Seç</span>
            </button>
            <span className="text-[11px] text-slate-400">{PLACES_POOL.length}+ Havuz</span>
          </div>
        </div>

        {/* Aşama 3: Zaman Kartı */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Aşama 3: Zaman
              </span>
              <button
                onClick={shuffleTime}
                title="Yeni Zaman Çek"
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-700 border border-slate-200 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 mt-2">
              <p className="text-sm font-semibold text-slate-900 font-serif-literary leading-relaxed">
                “{selectedTime}”
              </p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              Olayların geçtiği çağ veya an, karakterin kararlarını doğrudan etkiler.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setActivePicker('time')}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Zamanı Listeden Seç</span>
            </button>
            <span className="text-[11px] text-slate-400">{TIMES_POOL.length}+ Havuz</span>
          </div>
        </div>

        {/* Aşama 4: Karakter Kartı */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider uppercase text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Aşama 4: Karakter
              </span>
              <button
                onClick={shuffleCharacter}
                title="Yeni Karakter Çek"
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-700 border border-slate-200 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-100 mt-2">
              <p className="text-sm font-semibold text-slate-900 font-serif-literary leading-relaxed">
                “{selectedCharacter}”
              </p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              Karakterinin iç dünyasını, arzularını ve zaaflarını keşfetmeye hazır ol.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setActivePicker('character')}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Karakteri Listeden Seç</span>
            </button>
            <span className="text-[11px] text-slate-400">{CHARACTERS_POOL.length}+ Havuz</span>
          </div>
        </div>

        {/* Aşama 5: Sürpriz Kartı (En Özgün ve Önemli Bileşen) */}
        <div className="bg-gradient-to-br from-rose-900 via-slate-900 to-[#0f172a] text-white rounded-2xl p-6 border-2 border-rose-500/50 shadow-lg md:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[11px] font-bold tracking-wider uppercase text-rose-300 bg-rose-950/80 px-2.5 py-0.5 rounded-md border border-rose-700/60 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                Aşama 5: Sürpriz Kartı (Hikâye Katalizörü)
              </span>
              <button
                onClick={shuffleSurprise}
                title="Yeni Sürpriz Kartı Çek"
                className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/70 transition-colors cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-950/40 p-5 rounded-xl border border-rose-500/30 mt-2 relative z-10">
              <p className="text-base sm:text-lg font-bold text-rose-100 font-serif-literary leading-relaxed">
                “{selectedSurpriseCard}”
              </p>
            </div>

            <p className="text-xs text-rose-300/80 mt-3 font-serif-literary leading-relaxed relative z-10">
              <strong className="text-rose-200">Kurgusal Etki:</strong> Bu kart sadece bir süsleme değildir; hikâyenin düğüm noktasını oluşturacak ve karakterini zor bir seçimle ya da beklenmedik bir virajla baş başa bırakacaktır.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-rose-800/60 flex items-center justify-between relative z-10">
            <button
              onClick={() => setActivePicker('surprise')}
              className="text-xs text-rose-300 hover:text-rose-100 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Farklı Bir Sürpriz Kartı Seç</span>
            </button>
            <span className="text-[11px] text-rose-400/80">{SURPRISE_CARDS_POOL.length} Özel Kart</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-cyan-950 rounded-2xl p-6 text-white border border-teal-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold text-base text-teal-200 font-display">
            İpuçların Hazır! Kendi Hikâye Dünyanı İnşa Et.
          </h4>
          <p className="text-xs text-slate-300 font-serif-literary">
            Önce yazmaya odaklan; kusursuzluk peşinde koşma. Yapay zekâ metnini geliştirmende sana yol arkadaşlığı yapacak.
          </p>
        </div>

        <button
          onClick={handleProceed}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Hikâyemi Yazmaya Başla</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Manual Selection Modal / Dropdown Picker */}
      {activePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold font-display text-slate-900 text-base">
                <span>
                  {activePicker === 'genre' && 'Edebî Tür Seçimi'}
                  {activePicker === 'place' && 'Mekân Havuzundan Seç'}
                  {activePicker === 'time' && 'Zaman Havuzundan Seç'}
                  {activePicker === 'character' && 'Karakter Havuzundan Seç'}
                  {activePicker === 'surprise' && 'Sürpriz Kartı Havuzundan Seç'}
                </span>
              </div>
              <button
                onClick={() => setActivePicker(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2 flex-1">
              {activePicker === 'genre' &&
                GENRES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGenre(g.id);
                      setActivePicker(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      selectedGenre === g.id
                        ? 'border-teal-500 bg-teal-50/70 text-teal-950 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{g.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{g.shortDesc}</div>
                    </div>
                    {selectedGenre === g.id && <Check className="w-5 h-5 text-teal-600 shrink-0" />}
                  </button>
                ))}

              {activePicker === 'place' &&
                PLACES_POOL.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPlace(p);
                      setActivePicker(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-sm ${
                      selectedPlace === p
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span>{p}</span>
                    {selectedPlace === p && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                  </button>
                ))}

              {activePicker === 'time' &&
                TIMES_POOL.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedTime(t);
                      setActivePicker(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-sm ${
                      selectedTime === t
                        ? 'border-blue-500 bg-blue-50/70 text-blue-950 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span>{t}</span>
                    {selectedTime === t && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}

              {activePicker === 'character' &&
                CHARACTERS_POOL.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCharacter(c);
                      setActivePicker(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-sm ${
                      selectedCharacter === c
                        ? 'border-purple-500 bg-purple-50/70 text-purple-950 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span>{c}</span>
                    {selectedCharacter === c && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                  </button>
                ))}

              {activePicker === 'surprise' &&
                SURPRISE_CARDS_POOL.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedSurpriseCard(s);
                      setActivePicker(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-sm ${
                      selectedSurpriseCard === s
                        ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span>{s}</span>
                    {selectedSurpriseCard === s && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
                  </button>
                ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActivePicker(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
