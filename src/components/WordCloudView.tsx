import React, { useState, useMemo } from 'react';
import {
  Cloud,
  Layers,
  Sparkles,
  Info,
  BookOpen,
  Filter,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  Quote,
  Eye,
  GitCompare,
  X,
  FileText,
} from 'lucide-react';
import { Story, GenreType } from '../types';
import {
  analyzeTextForWordCloud,
  extractWordContextSnippets,
  compareVersionsWordFrequency,
  WordFrequency,
  VersionWordDiff,
} from '../utils/textAnalysis';

interface WordCloudViewProps {
  story: Story;
  initialVersionNumber?: number;
  onSelectVersion?: (versionNumber: number) => void;
}

// Harmonious color palette for word cloud tags
const WORD_COLOR_PALETTES = [
  'text-teal-700 bg-teal-50/80 hover:bg-teal-100/90 border-teal-200/80',
  'text-cyan-800 bg-cyan-50/80 hover:bg-cyan-100/90 border-cyan-200/80',
  'text-amber-800 bg-amber-50/80 hover:bg-amber-100/90 border-amber-200/80',
  'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border-indigo-200/80',
  'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-200/80',
  'text-sky-700 bg-sky-50/80 hover:bg-sky-100/90 border-sky-200/80',
  'text-rose-700 bg-rose-50/80 hover:bg-rose-100/90 border-rose-200/80',
  'text-purple-700 bg-purple-50/80 hover:bg-purple-100/90 border-purple-200/80',
  'text-orange-700 bg-orange-50/80 hover:bg-orange-100/90 border-orange-200/80',
  'text-slate-800 bg-slate-100/90 hover:bg-slate-200 border-slate-200',
];

export const WordCloudView: React.FC<WordCloudViewProps> = ({
  story,
  initialVersionNumber,
  onSelectVersion,
}) => {
  // Active version for single cloud inspection
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(
    initialVersionNumber || story.currentVersionNumber || story.versions[story.versions.length - 1].versionNumber
  );

  // Stop words filtering toggle
  const [filterStopWords, setFilterStopWords] = useState<boolean>(true);

  // Currently inspected word for context snippets
  const [inspectedWord, setInspectedWord] = useState<string | null>(null);

  // Main active view: 'cloud' or 'compare'
  const [activeSection, setActiveSection] = useState<'cloud' | 'compare'>('cloud');

  // Filter for comparison diffs
  const [diffFilter, setDiffFilter] = useState<'all' | 'new' | 'increased' | 'decreased'>('all');

  // Active version object
  const activeVersion = useMemo(() => {
    return (
      story.versions.find((v) => v.versionNumber === selectedVersionNum) ||
      story.versions[story.versions.length - 1]
    );
  }, [story.versions, selectedVersionNum]);

  // Word cloud analysis for active version
  const analysis = useMemo(() => {
    return analyzeTextForWordCloud(activeVersion?.content || '', filterStopWords);
  }, [activeVersion?.content, filterStopWords]);

  // First draft vs latest draft comparison analysis
  const hasMultipleVersions = story.versions.length > 1;
  const v1 = story.versions[0];
  const vLatest = story.versions[story.versions.length - 1];

  const comparison = useMemo(() => {
    if (!hasMultipleVersions) return null;
    return compareVersionsWordFrequency(v1.content, vLatest.content, filterStopWords);
  }, [hasMultipleVersions, v1.content, vLatest.content, filterStopWords]);

  // Filtered diffs
  const filteredDiffs = useMemo(() => {
    if (!comparison) return [];
    if (diffFilter === 'all') return comparison.diffs;
    if (diffFilter === 'new') return comparison.diffs.filter((d) => d.status === 'new');
    if (diffFilter === 'increased') return comparison.diffs.filter((d) => d.status === 'increased');
    if (diffFilter === 'decreased') return comparison.diffs.filter((d) => d.status === 'decreased');
    return comparison.diffs;
  }, [comparison, diffFilter]);

  // Snippets for inspected word
  const contextSnippets = useMemo(() => {
    if (!inspectedWord || !activeVersion?.content) return [];
    return extractWordContextSnippets(activeVersion.content, inspectedWord);
  }, [inspectedWord, activeVersion?.content]);

  // Genre specific guidance tips
  const getGenreGuidance = (genre: GenreType) => {
    switch (genre) {
      case 'siir':
        return {
          title: 'Şiirde Sözcük Kullanımı ve Ahenk',
          description:
            'Şiirde kelime tekrarları ritim, ahenk veya duygu pekiştirme (tekrir sanatı) amacıyla bilinçli kullanılır. Buluttaki baskın sözcüklerin imge dünyanızı ve tema derinliğinizi nasıl yansıttığını inceleyebilirsiniz. Ölçü ve uyak olmasa bile kelimelerin tınısı şiirinizi büyülü kılar.',
          tips: [
            'Duygu ve imge taşıyan kelimeler öne çıkıyor mu?',
            'Bilinçli tekrarlar ritmi destekliyor mu, yoksa gereksiz kelime tekrarı mı var?',
            'Somut ve soyut kavramlar arasında şiirsel bir denge var mı?',
          ],
        };
      case 'fabl':
        return {
          title: 'Fablda Karakter ve Mesaj Sözcükleri',
          description:
            'Fabl türünde karakterleri temsil eden hayvan veya nesne adları ile erdem, kurnazlık, adalet, hırs gibi kavramlar sıklıkla öne çıkar. Karakterlerin eylemlerini niteleyen sözcüklere dikkat edebilirsiniz.',
          tips: [
            'Karakter adları ve hayvan nitelikleri belirgin mi?',
            'Öğüt ve ana düşünceyle ilişkili kavramlar metinde yer bulmuş mu?',
            'Diyalog fiilleri ile hareket bildiren eylemler canlı mı?',
          ],
        };
      case 'hikaye':
      default:
        return {
          title: 'Öykü ve Anlatıda Kelime Dengesi',
          description:
            'Öyküde mekân tasviri, zaman akışı ve karakter psikolojisini kuran sözcükler dengeli dağılmalıdır. Aynı sıfat veya fiili aşırı tekrar etmek yerine eş anlamlılarla zenginleştirmeyi düşünebilirsiniz.',
          tips: [
            'Mekân ve atmosfer kuran kelimeler metne yayılmış mı?',
            'Karakterin iç dünyasını veya hislerini anlatan sözcükler var mı?',
            'Olay örgüsündeki kritik anlar yeterince güçlü fiillerle aktarılmış mı?',
          ],
        };
    }
  };

  const genreGuidance = getGenreGuidance(story.genre);

  return (
    <div className="space-y-6">
      {/* Sub-navigation & Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <Cloud className="w-3.5 h-3.5 text-teal-600" />
            <span>YAZAROTA Kelime Bulutu & Metin Analizi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
            “{activeVersion?.title || story.title || 'Başlıksız Eser'}” — Sözcük Haritası
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerçek metniniz taranarak dinamik olarak hesaplanmıştır • {activeVersion?.wordCount || 0} toplam sözcük
          </p>
        </div>

        {/* View Switcher: Single Cloud vs Compare */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSection('cloud')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'cloud'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-teal-600" />
              <span>Kelime Bulutu</span>
            </button>

            <button
              onClick={() => setActiveSection('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'compare'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Taslakları Karşılaştır ({story.versions.length} Sürüm)</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: Single Version Word Cloud */}
      {activeSection === 'cloud' && (
        <div className="space-y-6">
          {/* Controls: Version selection & Stop words toggle */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* Version picker if multiple */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                İncelenen Sürüm:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {story.versions.map((ver) => (
                  <button
                    key={ver.id}
                    onClick={() => {
                      setSelectedVersionNum(ver.versionNumber);
                      setInspectedWord(null);
                      if (onSelectVersion) onSelectVersion(ver.versionNumber);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      selectedVersionNum === ver.versionNumber
                        ? 'bg-white text-teal-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sürüm {ver.versionNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Stop Words Filter Toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={filterStopWords}
                  onChange={(e) => setFilterStopWords(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span>Bağlaç ve Edatları Filtrele (Önerilen)</span>
              </label>
              <span
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title="“ve”, “bir”, “ile”, “ama”, “için” gibi anlam taşımayan gramer kelimelerini filtreleyerek ana temayı öne çıkarır."
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Empty / Short Text Alert */}
          {analysis.isShortOrEmpty ? (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-amber-900 font-display">
                Kelime Bulutu İçin Yeterli Metin Yok
              </h3>
              <p className="text-xs text-amber-800 max-w-lg mx-auto font-serif-literary leading-relaxed">
                {analysis.message}
              </p>
            </div>
          ) : (
            <>
              {/* Dynamic Word Cloud Canvas */}
              <div className="bg-gradient-to-b from-white to-slate-50/60 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Kelime Bulutu ({analysis.uniqueWords} Farklı Anlamlı Sözcük)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Ayrıntısını ve metindeki cümlelerini görmek için bir kelimeye tıklayınız
                  </span>
                </div>

                {/* Cloud tags flex layout with balanced spacing */}
                <div className="min-h-[220px] flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-4 select-none">
                  {analysis.wordFrequencies.map((item, idx) => {
                    const paletteClass = WORD_COLOR_PALETTES[idx % WORD_COLOR_PALETTES.length];
                    const isSelected = inspectedWord === item.word;

                    // Calculate proportional font size between 14px and 38px
                    const fontSizePx = Math.round(13 + item.relativeSize * 24);

                    return (
                      <button
                        key={item.word}
                        onClick={() => setInspectedWord(isSelected ? null : item.word)}
                        style={{ fontSize: `${fontSizePx}px` }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-teal-600 ring-offset-2 bg-teal-700 text-white border-teal-800 font-extrabold shadow-md scale-105'
                            : `${paletteClass} font-semibold hover:scale-105 shadow-xs`
                        }`}
                        title={`“${item.word}”: ${item.count} kez (%${item.percentage})`}
                      >
                        <span>{item.word}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected
                              ? 'bg-teal-800 text-teal-100'
                              : 'bg-black/5 text-slate-600'
                          }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inspected Word Detail Modal / Card if a word is clicked */}
              {inspectedWord && (
                <div className="bg-white rounded-3xl p-6 border-2 border-teal-500/40 shadow-lg animate-fade-in space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                        {analysis.wordFrequencies.find((w) => w.word === inspectedWord)?.count || 1}×
                      </div>
                      <div>
                        <h4 className="font-extrabold text-lg text-slate-900 font-display">
                          “{inspectedWord}”
                        </h4>
                        <span className="text-xs text-slate-500">
                          Metindeki sıklığı:{' '}
                          <strong className="text-teal-700">
                            {analysis.wordFrequencies.find((w) => w.word === inspectedWord)?.count} kez
                          </strong>{' '}
                          (Tüm kelimelerin %
                          {analysis.wordFrequencies.find((w) => w.word === inspectedWord)?.percentage}’i)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setInspectedWord(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Kapat"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Context sentences list */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                      Metin İçindeki Kullanımları ve Bağlamı:
                    </span>
                    {contextSnippets.length > 0 ? (
                      <div className="space-y-2">
                        {contextSnippets.map((snip, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-serif-literary leading-relaxed flex items-start gap-2"
                          >
                            <Quote className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <div>
                              <span>{snip.before}</span>
                              <mark className="bg-teal-200 text-teal-950 font-bold px-1 rounded mx-0.5">
                                {snip.match}
                              </mark>
                              <span>{snip.after}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Kelimenin geçtiği cümleler ayrıştırılamadı.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Top 10 Most Frequent Words & Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top 10 List */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700 font-mono">
                        Sözcük Sıklığı Tablosu
                      </span>
                      <h3 className="text-base font-bold font-display text-slate-900">
                        En Sık Kullanılan 10 Kelime
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      Toplam {analysis.meaningfulWordsCount} Anlamlı Kullanım
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {analysis.top10.map((wf, idx) => (
                      <div
                        key={wf.word}
                        onClick={() => setInspectedWord(wf.word)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                          inspectedWord === wf.word
                            ? 'bg-teal-50 border-teal-300'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              idx < 3
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-800 font-mono truncate">
                            {wf.word}
                          </span>
                        </div>

                        {/* Progress Bar & Count */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-24 sm:w-36 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${Math.min(100, wf.relativeSize * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 font-mono min-w-[50px] text-right">
                            {wf.count} kez
                          </span>
                          <span className="text-[11px] text-slate-500 min-w-[40px] text-right">
                            %{wf.percentage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pedagogical Disclaimer & Guidance */}
                <div className="space-y-4">
                  {/* Pedagogical Note */}
                  <div className="bg-amber-50/70 rounded-3xl p-6 border border-amber-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Info className="w-4 h-4 shrink-0" />
                      <h4 className="font-bold text-xs uppercase tracking-wider font-mono">
                        Edebî Başarı ve Sıklık Notu
                      </h4>
                    </div>
                    <p className="text-xs text-amber-900 font-serif-literary leading-relaxed">
                      <strong>Unutmayın:</strong> Kelime sıklığı veya çokluğu tek başına bir edebî başarı veya anlatım kalitesi ölçütü değildir.
                    </p>
                    <p className="text-xs text-amber-800/90 font-serif-literary leading-relaxed">
                      Bazen tek bir vurucu kelime, paragraflarca tekrardan daha derin anlamlar yaratabilir. Kelime bulutu; hangi temaları öne çıkardığınızı, bilinçsiz tekrarlar yapıp yapmadığınızı ve sözcük hazinenizi keşfetmeniz için tasarlanmış rehber bir aynadır.
                    </p>
                  </div>

                  {/* Genre Specific Insights */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-teal-800">
                      <BookOpen className="w-4 h-4 shrink-0 text-teal-600" />
                      <h4 className="font-bold text-xs uppercase tracking-wider font-mono">
                        {genreGuidance.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 font-serif-literary leading-relaxed">
                      {genreGuidance.description}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {genreGuidance.tips.map((tip, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-1.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                      * Bu ipuçları kesin kurallar değil, türün olanaklarını hatırlatan ihtiyatlı önerilerdir.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 2: First Draft (V1) vs Latest Draft (VLatest) Comparison */}
      {activeSection === 'compare' && (
        <div className="space-y-6">
          {!hasMultipleVersions ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
                <GitCompare className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">
                Karşılaştırma İçin Henüz Tek Bir Sürüm Bulunuyor
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto font-serif-literary leading-relaxed">
                Yazınızı revize edip yeni bir sürüm oluşturduğunuzda (örneğin editörde yeni sürüm açtığınızda veya öğretmen/yapay zekâ geri bildirimlerini uyguladığınızda), ilk taslağınız ile son taslağınız arasındaki sözcük değişimleri burada ayrıntılı olarak karşılaştırılacaktır.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
                  Şu anki Sürüm: Sürüm 1 ({story.versions[0]?.wordCount || 0} kelime)
                </span>
              </div>
            </div>
          ) : (
            comparison && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* First Draft Words */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                      İlk Taslak (Sürüm 1)
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 font-display">
                      {comparison.v1TotalWords}{' '}
                      <span className="text-xs text-slate-500 font-normal">kelime</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {comparison.v1UniqueWords} farklı anlamlı sözcük
                    </span>
                  </div>

                  {/* Latest Draft Words */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 font-mono">
                      Son Taslak (Sürüm {vLatest.versionNumber})
                    </span>
                    <div className="text-2xl font-extrabold text-teal-900 font-display">
                      {comparison.vLatestTotalWords}{' '}
                      <span className="text-xs text-teal-600 font-normal">kelime</span>
                    </div>
                    <span className="text-[11px] text-teal-700 block">
                      {comparison.vLatestUniqueWords} farklı anlamlı sözcük
                    </span>
                  </div>

                  {/* Newly Introduced Words */}
                  <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
                      Yeni Eklenen Kelimeler
                    </span>
                    <div className="text-2xl font-extrabold text-emerald-900 font-display flex items-center gap-1.5">
                      <PlusCircle className="w-5 h-5 text-emerald-600" />
                      +{comparison.newWordsCount}
                    </div>
                    <span className="text-[11px] text-emerald-700 block">
                      İlk taslakta olmayıp sonradan eklenen
                    </span>
                  </div>

                  {/* Vocabulary Enrichment Rate */}
                  <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-200 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 font-mono">
                      Kelime Zenginleşme Oranı
                    </span>
                    <div className="text-2xl font-extrabold text-indigo-900 font-display flex items-center gap-1.5">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      %{comparison.enrichedRatio > 0 ? `+${comparison.enrichedRatio}` : comparison.enrichedRatio}
                    </div>
                    <span className="text-[11px] text-indigo-700 block">
                      Farklı sözcük çeşitliliği değişimi
                    </span>
                  </div>
                </div>

                {/* Diff Table & Filter Tabs */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 font-mono">
                        Sürüm Karşılaştırma Dökümü
                      </span>
                      <h3 className="text-lg font-bold font-display text-slate-900">
                        İlk Taslak (V1) ile Son Taslak (V{vLatest.versionNumber}) Arasındaki Sözcük Değişimleri
                      </h3>
                    </div>

                    {/* Diff status filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <button
                        onClick={() => setDiffFilter('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          diffFilter === 'all'
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Tümü ({comparison.diffs.length})
                      </button>
                      <button
                        onClick={() => setDiffFilter('new')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          diffFilter === 'new'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        Yeni Eklenenler ({comparison.diffs.filter((d) => d.status === 'new').length})
                      </button>
                      <button
                        onClick={() => setDiffFilter('increased')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          diffFilter === 'increased'
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                        }`}
                      >
                        Kullanımı Artanlar ({comparison.diffs.filter((d) => d.status === 'increased').length})
                      </button>
                      <button
                        onClick={() => setDiffFilter('decreased')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          diffFilter === 'decreased'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        Kullanımı Azalanlar ({comparison.diffs.filter((d) => d.status === 'decreased').length})
                      </button>
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                          <th className="py-3 px-3">Kelime</th>
                          <th className="py-3 px-3 text-center">İlk Taslak (V1)</th>
                          <th className="py-3 px-3 text-center">Son Taslak (V{vLatest.versionNumber})</th>
                          <th className="py-3 px-3 text-center">Fark</th>
                          <th className="py-3 px-3 text-right">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium">
                        {filteredDiffs.slice(0, 50).map((diff) => (
                          <tr
                            key={diff.word}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {diff.word}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                              {diff.v1Count} kez
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-900">
                              {diff.vLatestCount} kez
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {diff.diff > 0 ? (
                                <span className="text-emerald-600 font-bold">+{diff.diff}</span>
                              ) : diff.diff < 0 ? (
                                <span className="text-amber-600 font-bold">{diff.diff}</span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {diff.status === 'new' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <PlusCircle className="w-3 h-3" />
                                  Yeni Sözcük
                                </span>
                              )}
                              {diff.status === 'increased' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                  <TrendingUp className="w-3 h-3" />
                                  Kullanımı Arttı
                                </span>
                              )}
                              {diff.status === 'decreased' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <MinusCircle className="w-3 h-3" />
                                  Kullanımı Azaldı
                                </span>
                              )}
                              {diff.status === 'removed' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  Çıkarıldı
                                </span>
                              )}
                              {diff.status === 'unchanged' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] text-slate-500 bg-slate-100">
                                  Aynı Kaldı
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredDiffs.length > 50 && (
                    <p className="text-[11px] text-slate-400 text-center italic pt-2">
                      * İlk 50 sözcük gösterilmektedir. Toplam {filteredDiffs.length} kelime incelendi.
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
