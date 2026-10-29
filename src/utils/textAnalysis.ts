/**
 * Turkish Text Analysis & Word Cloud Utilities for YAZAROTA
 * Pure TypeScript implementation, no external API calls or heavyweight NLP packages.
 */

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
  relativeSize: number; // 0.0 to 1.0 for styling
}

export interface WordContextSnippet {
  before: string;
  match: string;
  after: string;
  fullSentence: string;
}

export interface VersionWordDiff {
  word: string;
  v1Count: number;
  vLatestCount: number;
  diff: number;
  status: 'new' | 'increased' | 'decreased' | 'unchanged' | 'removed';
}

export interface WordCloudAnalysis {
  totalWords: number;
  uniqueWords: number;
  meaningfulWordsCount: number;
  wordFrequencies: WordFrequency[];
  top10: WordFrequency[];
  isShortOrEmpty: boolean;
  message?: string;
}

// Common Turkish stop words (pronouns, conjunctions, prepositions, particles, auxiliary forms)
export const TURKISH_STOP_WORDS = new Set<string>([
  // Conjunctions & connectors
  've', 'veya', 'ya', 'ile', 'ama', 'fakat', 'ancak', 'lakin', 'oysa', 'halbuki',
  'çünkü', 'zira', 'madem', 'eğer', 'şayet', 'yoksa', 'ise', 'bile', 'dahi', 'hem',
  'ne', 'gerek', 'yahut', 'ki', 'de', 'da',

  // Prepositions & postpositions
  'için', 'gibi', 'kadar', 'göre', 'karşı', 'doğru', 'dair', 'rağmen', 'karşın',
  'dolayı', 'ötürü', 'beri', 'yana', 'itibaren', 'üzere',

  // Pronouns & determiners
  'bir', 'bu', 'şu', 'o', 'bunlar', 'şunlar', 'onlar', 'biri', 'biriyle', 'hepsi',
  'kimi', 'bazı', 'tüm', 'bütün', 'her', 'hiçbir', 'şey', 'şeyler', 'kendi',
  'kendisi', 'kendileri', 'ben', 'sen', 'biz', 'siz', 'benim', 'senin', 'onun',
  'bizim', 'sizin', 'onların', 'bana', 'sana', 'ona', 'bize', 'size', 'onlara',
  'beni', 'seni', 'onu', 'bizi', 'sizi', 'onları', 'bende', 'sende', 'onda',
  'bizde', 'sizde', 'onlarda', 'benden', 'senden', 'ondan', 'bizden', 'sizden', 'onlardan',

  // Question particles & adverbs
  'mi', 'mı', 'mu', 'mü', 'misin', 'mısın', 'musun', 'müsün', 'miyiz', 'mıyız',
  'nasıl', 'neden', 'niçin', 'niye', 'ne zaman', 'nerede', 'nereye', 'nereden',
  'kim', 'hangi', 'kaç',

  // Frequency / degree adverbs & fillers
  'daha', 'en', 'çok', 'pek', 'az', 'fazla', 'biraz', 'oldukça', 'gayet',
  'böyle', 'şöyle', 'öyle', 'sonra', 'önce', 'şimdi', 'artık', 'hep', 'hiç',
  'asla', 'zaten', 'yani', 'acaba', 'belki', 'keşke', 'lütfen', 'ayrıca',
  'birlikte', 'tek', 'bazen', 'sık', 'ara', 'sıra',

  // Copula & very common auxiliary forms
  'olmak', 'oldu', 'olan', 'olarak', 'olduğu', 'olursa', 'olur', 'idi', 'imiş',
  'dir', 'dır', 'dur', 'dür', 'tir', 'tır', 'tur', 'tür',
  'değil', 'var', 'yok', 'etti', 'etmek', 'eden', 'ederek', 'yaptı', 'yapmak',
  'dedi', 'demek', 'diye', 'biriydi', 'biriydi'
]);

/**
 * Clean and tokenize Turkish text
 */
export function extractTurkishWords(text: string): string[] {
  if (!text) return [];

  // Match sequences of Turkish alphabetic characters
  const matches = text.match(/[abcçdefgğhıijklmnoöprsştuüvyzABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+/g);
  if (!matches) return [];

  return matches
    .map((w) => w.toLocaleLowerCase('tr-TR').trim())
    .filter((w) => w.length > 1); // Ignore single letters (like stray 'o', 'a', etc.)
}

/**
 * Analyze text frequencies and build word cloud metrics
 */
export function analyzeTextForWordCloud(
  text: string,
  filterStopWords: boolean = true
): WordCloudAnalysis {
  if (!text || text.trim().length === 0) {
    return {
      totalWords: 0,
      uniqueWords: 0,
      meaningfulWordsCount: 0,
      wordFrequencies: [],
      top10: [],
      isShortOrEmpty: true,
      message: 'Henüz analiz edilecek bir metin yazılmadı. Metninizi yazıp kaydettiğinizde kelime bulutu otomatik olarak burada şekillenecektir.',
    };
  }

  const allWords = extractTurkishWords(text);
  const totalWords = allWords.length;

  if (totalWords < 5) {
    return {
      totalWords,
      uniqueWords: new Set(allWords).size,
      meaningfulWordsCount: 0,
      wordFrequencies: [],
      top10: [],
      isShortOrEmpty: true,
      message: 'Metniniz henüz çok kısa (5 kelimeden az). Anlamlı bir kelime bulutu ve sözcük frekans analizi için lütfen yazınızı biraz daha genişletiniz.',
    };
  }

  // Count frequencies
  const freqMap = new Map<string, number>();

  for (const word of allWords) {
    if (filterStopWords && TURKISH_STOP_WORDS.has(word)) {
      continue;
    }
    freqMap.set(word, (freqMap.get(word) || 0) + 1);
  }

  if (freqMap.size === 0) {
    return {
      totalWords,
      uniqueWords: new Set(allWords).size,
      meaningfulWordsCount: 0,
      wordFrequencies: [],
      top10: [],
      isShortOrEmpty: true,
      message: 'Metninizde bağlaç ve edatlar dışındaki anlamlı sözcük sayısı henüz yeterli değil. Yazınıza olay, duygu, mekân veya karakteri anlatan yeni kelimeler ekleyebilirsiniz.',
    };
  }

  // Sort by count descending, then alphabetically
  const sortedEntries = Array.from(freqMap.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], 'tr-TR');
  });

  const maxCount = sortedEntries[0][1];
  const minCount = sortedEntries[sortedEntries.length - 1][1];
  const countSpread = maxCount - minCount || 1;

  const wordFrequencies: WordFrequency[] = sortedEntries.map(([word, count]) => {
    return {
      word,
      count,
      percentage: Number(((count / totalWords) * 100).toFixed(1)),
      // Normalized between 0.15 (smallest) and 1.0 (largest)
      relativeSize: 0.15 + ((count - minCount) / countSpread) * 0.85,
    };
  });

  const meaningfulWordsCount = sortedEntries.reduce((sum, item) => sum + item[1], 0);

  return {
    totalWords,
    uniqueWords: freqMap.size,
    meaningfulWordsCount,
    wordFrequencies,
    top10: wordFrequencies.slice(0, 10),
    isShortOrEmpty: false,
  };
}

/**
 * Extract context snippets (sentences or small windows) where a specific word appears
 */
export function extractWordContextSnippets(
  fullText: string,
  targetWord: string,
  maxSnippets: number = 8
): WordContextSnippet[] {
  if (!fullText || !targetWord) return [];

  const normalizedTarget = targetWord.toLocaleLowerCase('tr-TR');
  const sentences = fullText.split(/(?<=[.!?\n])\s+/);
  const snippets: WordContextSnippet[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // Check if target word exists as a discrete word token in this sentence
    // Using Turkish-safe boundary matching
    const wordsInSentence = extractTurkishWords(trimmed);
    const hasWord = wordsInSentence.some((w) => w === normalizedTarget);

    if (hasWord) {
      // Find position of the word in sentence
      const regex = new RegExp(`(^|[^a-zA-ZçÇğĞıİöÖşŞüÜ])(${targetWord})([^a-zA-ZçÇğĞıİöÖşŞüÜ]|$)`, 'iu');
      const match = trimmed.match(regex);

      if (match && match.index !== undefined) {
        const matchStartIndex = match.index + match[1].length;
        const matchedText = match[2];
        const matchEndIndex = matchStartIndex + matchedText.length;

        const before = trimmed.substring(Math.max(0, matchStartIndex - 50), matchStartIndex);
        const after = trimmed.substring(matchEndIndex, Math.min(trimmed.length, matchEndIndex + 50));

        snippets.push({
          before: matchStartIndex > 50 ? '...' + before : before,
          match: matchedText,
          after: matchEndIndex + 50 < trimmed.length ? after + '...' : after,
          fullSentence: trimmed,
        });
      } else {
        snippets.push({
          before: '',
          match: targetWord,
          after: '',
          fullSentence: trimmed,
        });
      }

      if (snippets.length >= maxSnippets) break;
    }
  }

  return snippets;
}

/**
 * Compare first draft (Version 1) vs latest draft word frequencies
 */
export function compareVersionsWordFrequency(
  v1Text: string,
  vLatestText: string,
  filterStopWords: boolean = true
): {
  diffs: VersionWordDiff[];
  v1TotalWords: number;
  vLatestTotalWords: number;
  v1UniqueWords: number;
  vLatestUniqueWords: number;
  newWordsCount: number;
  enrichedRatio: number;
} {
  const v1Analysis = analyzeTextForWordCloud(v1Text, filterStopWords);
  const vLatestAnalysis = analyzeTextForWordCloud(vLatestText, filterStopWords);

  const v1Map = new Map<string, number>();
  v1Analysis.wordFrequencies.forEach((wf) => v1Map.set(wf.word, wf.count));

  const vLatestMap = new Map<string, number>();
  vLatestAnalysis.wordFrequencies.forEach((wf) => vLatestMap.set(wf.word, wf.count));

  // Union of all unique words
  const allUniqueWords = new Set<string>([...v1Map.keys(), ...vLatestMap.keys()]);
  const diffs: VersionWordDiff[] = [];

  let newWordsCount = 0;

  allUniqueWords.forEach((word) => {
    const v1Count = v1Map.get(word) || 0;
    const vLatestCount = vLatestMap.get(word) || 0;
    const diff = vLatestCount - v1Count;

    let status: VersionWordDiff['status'] = 'unchanged';
    if (v1Count === 0 && vLatestCount > 0) {
      status = 'new';
      newWordsCount++;
    } else if (vLatestCount === 0 && v1Count > 0) {
      status = 'removed';
    } else if (diff > 0) {
      status = 'increased';
    } else if (diff < 0) {
      status = 'decreased';
    }

    diffs.push({
      word,
      v1Count,
      vLatestCount,
      diff,
      status,
    });
  });

  // Sort diffs: highlight new and most changed words first, then by latest count
  diffs.sort((a, b) => {
    if (a.status === 'new' && b.status !== 'new') return -1;
    if (b.status === 'new' && a.status !== 'new') return 1;
    const absDiffB = Math.abs(b.diff);
    const absDiffA = Math.abs(a.diff);
    if (absDiffB !== absDiffA) return absDiffB - absDiffA;
    return b.vLatestCount - a.vLatestCount;
  });

  const enrichedRatio =
    v1Analysis.uniqueWords > 0
      ? Number((((vLatestAnalysis.uniqueWords - v1Analysis.uniqueWords) / v1Analysis.uniqueWords) * 100).toFixed(1))
      : 0;

  return {
    diffs,
    v1TotalWords: v1Analysis.totalWords,
    vLatestTotalWords: vLatestAnalysis.totalWords,
    v1UniqueWords: v1Analysis.uniqueWords,
    vLatestUniqueWords: vLatestAnalysis.uniqueWords,
    newWordsCount,
    enrichedRatio,
  };
}
