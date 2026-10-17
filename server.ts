import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// JSON Database file path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'yazarota_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB Schema and Sample Data
interface DatabaseSchema {
  stories: any[];
  classes: any[];
  tasks: any[];
  researchSettings: {
    rubricMax: number;
    parentConsentRequired: boolean;
    anonymousOnly: boolean;
    activeCohort: string;
  };
}

const DEFAULT_DB: DatabaseSchema = {
  stories: [
    {
      id: 'demo-story-1',
      studentCode: 'OGR-4281',
      title: 'Perondaki Sarı Mektup',
      genre: 'hikaye',
      place: 'Terk edilmiş ve sarmaşıklarla kaplanmış bir tren istasyonu',
      time: 'Gece yarısı saat tam 03.17’de, herkesin derin uykuda olduğu bir anda',
      character: 'Geçmişindeki büyük kaybı hakkında asla konuşmayan emekli bir edebiyat öğretmeni',
      surpriseCard: 'Karakter beklenmedik, imzasız ve üzerinde eski bir balmumu mühür olan bir mektup alır.',
      status: 'completed',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      currentVersionNumber: 2,
      classId: 'class-9a',
      taskId: 'task-1',
      testType: 'standard',
      versions: [
        {
          id: 'v1-demo',
          versionNumber: 1,
          title: 'Perondaki Sarı Mektup (İlk Taslak)',
          content: 'Eski tren istasyonu çok karanlıktı. Saat gecenin üçüydü. Emekli öğretmen Selim Bey elinde feneriyle yürüyordu. Yıllar önce buradan ayrılan öğrencisini düşünüyordu. Duvarda sarmaşıkların arasında bir mektup gördü. Mektubun üzerinde mühür vardı. Mektubu açtı ve okumaya başladı. İçinde çok önemli bir itiraf vardı.',
          wordCount: 46,
          characterCount: 304,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          studentNotes: 'İlk taslak, olayları genel hatlarıyla kurdum.',
          review: {
            id: 'rev-v1',
            evaluatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            totalScore: 71,
            criteriaScores: [
              { key: 'title', label: 'Başlığın Metne Uygunluğu', score: 8, maxScore: 10, justification: 'Başlık mektup temasıyla örtüşüyor ancak merak unsuru daha da artırılabilir.' },
              { key: 'plot', label: 'Olay Örgüsü ve Kurgu', score: 17, maxScore: 25, justification: 'Olay akışı var fakat çok hızlı geçilmiş; serim ve düğüm kısımları genişletilmeli.' },
              { key: 'character', label: 'Karakterlerin İşlenişi', score: 11, maxScore: 15, justification: 'Selim Bey\'in iç dünyası ve geçmiş kaybı biraz daha hissettirilmeli.' },
              { key: 'setting', label: 'Mekân ve Zaman Kullanımı', score: 7, maxScore: 10, justification: 'Terk edilmiş istasyonun duyusal detayları (rüzgar, sarmaşık kokusu, ray pası) eklenebilir.' },
              { key: 'genre', label: 'Seçilen Edebî Türe Uygunluk', score: 15, maxScore: 20, justification: 'Hikâye biçimine uygun, durum ve olay dengesi kurulabilir.' },
              { key: 'language', label: 'Dil ve Anlatım', score: 10, maxScore: 15, justification: 'Kısa ve tekdüze cümleler yerine betimleyici ve zengin ifadeler kullanılabilir.' },
              { key: 'creativity', label: 'Özgünlük ve Yaratıcılık', score: 3, maxScore: 5, justification: 'Mühürlü mektubun içeriği merak uyandırıyor.' },
            ],
            generalReview: 'Sevgili yazar adayı, hikâyenin temel çatısı ve gizem duygusu çok umut vadediyor! Emekli bir öğretmenin gece yarısı terk edilmiş peronda mektupla karşılaşması merak uyandırıcı. Metnini duyularla ve detaylarla zenginleştirerek bir üst seviyeye taşıyabilirsin.',
            strengths: [
              'Gece yarısı 03.17 atmosferi ile mühürlü mektup merak ögesini başarıyla tetikliyor.',
              'Selim Bey karakteri edebî bir anlatı için samimi ve merak uyandıran bir figür.',
            ],
            areasToImprove: [
              'Cümleler çok kısa ve peş peşe sıralanmış; virgüllerle ve bağlaçlarla akıcılık sağlanmalı.',
              'Mektubun içeriğindeki itirafın karakterin geçmiş kaybıyla bağlantısı somutlaştırılmalı.',
            ],
            topThreeSuggestions: [
              'İstasyonun terk edilmişliğini rayların pası, gece rüzgarı ve eski tahtaların gıcırtısıyla betimle.',
              'Selim Bey\'in feneri tutarken ellerinin titremesini ve geçmiş kaybının sızısını hissettir.',
              'Mektuptaki cümlenin en azından bir satırını doğrudan tırnak içinde vererek okuyucunun merakını artır.',
            ],
            genreCompliance: 'Hikâye türünün olay odaklı yapısına uygun ancak betimleme ve durum derinliği geliştirilebilir.',
            surpriseCardCompliance: 'İmzasız mühürlü mektup sürpriz kartı hikâyeye dâhil edilmiş, etkisi bir sonraki sürümde derinleştirilebilir.',
            nextActionStep: 'Metne Selim Bey\'in feneri tuttuğu anki hislerini ve istasyonun soğuk rüzgarını anlatan 2-3 betimleyici cümle ekle.',
          },
        },
        {
          id: 'v2-demo',
          versionNumber: 2,
          title: 'Perondaki Sarı Mektup',
          content: 'Paslı rayların arasına dolan sarmaşıklar, gece yarısı esen serin güz rüzgarıyla fısıldıyordu. Saat kulesinin kırık kadranı tam 03.17’de donup kalmıştı. Emekli edebiyat öğretmeni Selim Bey, yakasını kaldırıp elindeki titrek feneri eski bekleme salonuna doğrulttu. Otuz yıl önce bu perondan el sallayıp bir daha haber alamadığı en parlak öğrencisi Cemil’in hatırası göğsünde ince bir sızıydı. Tam o sırada, peron bankının çatlak tahtasına sıkıştırılmış, kırmızı balmumuyla mühürlenmiş sarı bir zarf çarptı gözüne. Zarfın üzerinde silinmeye yüz tutmuş bir mürekkeple sadece şu yazıyordu: "Geç kalmış bir özür, hocama..."',
          wordCount: 89,
          characterCount: 597,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          studentNotes: 'Gelişim önerilerini uyguladım; betimlemeleri artırdım, mekân seslerini ve karakterin iç dünyasını ekledim.',
          review: {
            id: 'rev-v2',
            evaluatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            totalScore: 89,
            criteriaScores: [
              { key: 'title', label: 'Başlığın Metne Uygunluğu', score: 10, maxScore: 10, justification: 'Başlık ile sarı zarf ve mektubun teması kusursuz uyuşuyor.' },
              { key: 'plot', label: 'Olay Örgüsü ve Kurgu', score: 22, maxScore: 25, justification: 'Olay örgüsü merak ögesiyle dengeli ve sürükleyici bir ritim kazanmış.' },
              { key: 'character', label: 'Karakterlerin İşlenişi', score: 14, maxScore: 15, justification: 'Selim Bey\'in öğrencisine duyduğu özlem ve iç sızısı çok etkileyici verilmiş.' },
              { key: 'setting', label: 'Mekân ve Zaman Kullanımı', score: 9, maxScore: 10, justification: 'Paslı raylar, sarmaşıkların fısıltısı ve donmuş saat kulesi harika atmosfer yaratmış.' },
              { key: 'genre', label: 'Seçilen Edebî Türe Uygunluk', score: 18, maxScore: 20, justification: 'Hikâye türünün durum ve duygu yoğunluğunu başarıyla yansıtıyor.' },
              { key: 'language', label: 'Dil ve Anlatım', score: 13, maxScore: 15, justification: 'Dili zengin, kelime tercihleri çok yerinde, anlatım akıcı.' },
              { key: 'creativity', label: 'Özgünlük ve Yaratıcılık', score: 3, maxScore: 5, justification: 'Mektubun üzerindeki ithaf hikâyeye çok özgün bir duygu derinliği katmış.' },
            ],
            generalReview: 'Harika bir gelişim örneği! İlk taslaktaki kuru anlatım gitmiş, yerine edebî lezzeti yüksek, atmosferi solunabilen etkileyici bir hikâye gelmiş. Selim Bey\'in hüznü ve sarı zarfın sırrı okuru içine çekiyor.',
            strengths: [
              '"Paslı rayların arasına dolan sarmaşıklar" ve "göğsünde ince bir sızıydı" gibi ifadeler edebi zenginliği çok yükseltmiş.',
              'Mektup üzerindeki "Geç kalmış bir özür, hocama..." yazısı merak duygusunu doruğa çıkarıyor.',
            ],
            areasToImprove: [
              'Zarfın açıldığı ve içindeki ilk cümlenin okunduğu anı da hikâyeye dâhil ederek bir sonraki sahneye geçilebilir.',
            ],
            topThreeSuggestions: [
              'Mektubu açarken fenerin titremesi ve Selim Bey\'in nefes alışverişiyle gerilimi biraz daha hissettir.',
              'Öğrencinin neden 30 yıl önce gittiğine dair küçük bir ipucu ekle.',
              'Bir sonraki paragrafta mektubun içinden çıkacak sürprizi hazırla.',
            ],
            genreCompliance: 'Hikâye türünün serim ve düğüm aşamaları olgun bir dille inşa edilmiş.',
            surpriseCardCompliance: 'Sürpriz kartı hikâyenin merkezine kusursuz bir kurgusal köprüyle yerleştirilmiş.',
            nextActionStep: 'Selim Bey zarfın balmumunu kırarken duyduğu sesi ve mektubun ilk kelimesini kaleme al.',
          },
        },
      ],
    },
  ],
  classes: [
    {
      id: 'class-9a',
      name: '9-A Edebiyat Grubu',
      grade: '9. Sınıf',
      studentCodes: ['OGR-4281', 'OGR-5192', 'OGR-3349', 'OGR-8812', 'OGR-1904'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'class-10b',
      name: '10-B Yaratıcı Yazarlık Atölyesi',
      grade: '10. Sınıf',
      studentCodes: ['OGR-7023', 'OGR-6115', 'OGR-9441', 'OGR-2230'],
      createdAt: new Date().toISOString(),
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'TÜBİTAK 2204-A: Ön Test — Mekân ve Karakter Odaklı Hikâye',
      classId: 'class-9a',
      description: 'Rastgele oluşturulan mekân, karakter ve sürpriz kartını kullanarak 150-500 kelimelik bir hikâye kurgulayınız.',
      targetGenre: 'hikaye',
      minWords: 150,
      maxWords: 500,
      requireSurpriseCard: true,
      taskType: 'pre_test',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'task-2',
      title: 'TÜBİTAK 2204-A: Son Test — Sürpriz Dönüşlü Edebî Metin',
      classId: 'class-9a',
      description: 'YAZAROTA rehberlerinden ve AI geri bildirimlerinden faydalanarak kurgulanacak nihai ölçüm yazısı.',
      targetGenre: 'all',
      minWords: 200,
      maxWords: 600,
      requireSurpriseCard: true,
      taskType: 'post_test',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  researchSettings: {
    rubricMax: 100,
    parentConsentRequired: true,
    anonymousOnly: true,
    activeCohort: '2026-Bahar Lise Araştırması',
  },
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, using default:', err);
    return DEFAULT_DB;
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Ensure DB is initialized
readDb();

// ================= API ROUTES =================

// 1. Stories CRUD
app.get('/api/stories', (req: Request, res: Response) => {
  const db = readDb();
  const { studentCode, classId, testType } = req.query;
  let result = db.stories;

  if (studentCode) {
    result = result.filter((s) => s.studentCode === studentCode);
  }
  if (classId) {
    result = result.filter((s) => s.classId === classId);
  }
  if (testType) {
    result = result.filter((s) => s.testType === testType);
  }

  res.json({ success: true, stories: result });
});

app.get('/api/stories/:id', (req: Request, res: Response) => {
  const db = readDb();
  const story = db.stories.find((s) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ success: false, error: 'Hikâye bulunamadı.' });
  }
  res.json({ success: true, story });
});

app.post('/api/stories', (req: Request, res: Response) => {
  const db = readDb();
  const storyData = req.body;

  if (!storyData.id) {
    storyData.id = 'story-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  }

  const existingIndex = db.stories.findIndex((s) => s.id === storyData.id);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    storyData.updatedAt = now;
    db.stories[existingIndex] = { ...db.stories[existingIndex], ...storyData };
  } else {
    storyData.createdAt = storyData.createdAt || now;
    storyData.updatedAt = now;
    db.stories.unshift(storyData);
  }

  writeDb(db);
  res.json({ success: true, story: storyData });
});

app.delete('/api/stories/:id', (req: Request, res: Response) => {
  const db = readDb();
  const index = db.stories.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Silinecek hikâye bulunamadı.' });
  }
  db.stories.splice(index, 1);
  writeDb(db);
  res.json({ success: true, message: 'Hikâye başarıyla silindi.' });
});

// 2. Classes & Tasks
app.get('/api/classes', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, classes: db.classes });
});

app.post('/api/classes', (req: Request, res: Response) => {
  const db = readDb();
  const { name, grade, studentCodes } = req.body;
  if (!name || !grade) {
    return res.status(400).json({ success: false, error: 'Sınıf adı ve kademe zorunludur.' });
  }
  const newClass = {
    id: 'class-' + Date.now(),
    name,
    grade,
    studentCodes: studentCodes && Array.isArray(studentCodes) ? studentCodes : [],
    createdAt: new Date().toISOString(),
  };
  db.classes.push(newClass);
  writeDb(db);
  res.json({ success: true, classGroup: newClass });
});

app.get('/api/tasks', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, tasks: db.tasks });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const db = readDb();
  const task = req.body;
  if (!task.title) {
    return res.status(400).json({ success: false, error: 'Görev başlığı zorunludur.' });
  }
  task.id = 'task-' + Date.now();
  task.createdAt = new Date().toISOString();
  db.tasks.unshift(task);
  writeDb(db);
  res.json({ success: true, task });
});

// 3. Teacher Human Evaluation (For Research & Double Scoring)
app.post('/api/human-evaluate', (req: Request, res: Response) => {
  const db = readDb();
  const { storyId, versionNumber, teacherScore, teacherNotes, teacherName, criteriaScores } = req.body;

  const story = db.stories.find((s) => s.id === storyId);
  if (!story) {
    return res.status(404).json({ success: false, error: 'Hikâye bulunamadı.' });
  }

  const version = story.versions.find((v: any) => v.versionNumber === versionNumber);
  if (!version) {
    return res.status(404).json({ success: false, error: 'Sürüm bulunamadı.' });
  }

  if (!version.review) {
    version.review = {
      id: 'rev-human-' + Date.now(),
      evaluatedAt: new Date().toISOString(),
      totalScore: teacherScore || 0,
      criteriaScores: [],
      generalReview: 'Öğretmen değerlendirmesi eklendi.',
      strengths: [],
      areasToImprove: [],
      topThreeSuggestions: [],
      genreCompliance: '',
      surpriseCardCompliance: '',
      nextActionStep: '',
    };
  }

  version.review.humanEvaluation = {
    teacherScore: Number(teacherScore),
    teacherNotes: teacherNotes || '',
    evaluatedBy: teacherName || 'Öğretmen',
    evaluatedAt: new Date().toISOString(),
    criteriaScores: criteriaScores || {},
  };

  story.updatedAt = new Date().toISOString();
  writeDb(db);

  res.json({ success: true, review: version.review });
});

// 4. CSV Export for TÜBİTAK 2204-A Research Analysis
app.get('/api/export-csv', (_req: Request, res: Response) => {
  const db = readDb();
  const headers = [
    'Hikaye_ID',
    'Ogrenci_Kodu',
    'Sinif_ID',
    'Test_Turu',
    'Edebi_Tur',
    'Baslik',
    'Surum_No',
    'Kelime_Sayisi',
    'AI_Toplam_Puan',
    'AI_Baslik_Puan',
    'AI_Kurgu_Puan',
    'AI_Karakter_Puan',
    'AI_MekanZaman_Puan',
    'AI_Tur_Puan',
    'AI_Dil_Puan',
    'AI_Yaraticilik_Puan',
    'Ogretmen_Puan',
    'Ogretmen_Notu',
    'Olusturulma_Tarihi',
  ];

  const rows: string[] = [headers.join(',')];

  for (const story of db.stories) {
    for (const v of story.versions || []) {
      const review = v.review;
      const getCrit = (k: string) => {
        const item = review?.criteriaScores?.find((c: any) => c.key === k);
        return item ? item.score : '';
      };

      const human = review?.humanEvaluation;

      const sanitize = (val: any) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      rows.push(
        [
          sanitize(story.id),
          sanitize(story.studentCode || 'ANON'),
          sanitize(story.classId || 'Genel'),
          sanitize(story.testType || 'standard'),
          sanitize(story.genre),
          sanitize(v.title || story.title),
          sanitize(v.versionNumber),
          sanitize(v.wordCount || 0),
          sanitize(review ? review.totalScore : ''),
          sanitize(getCrit('title')),
          sanitize(getCrit('plot')),
          sanitize(getCrit('character')),
          sanitize(getCrit('setting')),
          sanitize(getCrit('genre')),
          sanitize(getCrit('language')),
          sanitize(getCrit('creativity')),
          sanitize(human ? human.teacherScore : ''),
          sanitize(human ? human.teacherNotes : ''),
          sanitize(v.createdAt || story.createdAt),
        ].join(',')
      );
    }
  }

  const csvContent = '\uFEFF' + rows.join('\r\n'); // Add UTF-8 BOM for Turkish character support in Excel
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="yazarota_arastirma_verileri.csv"');
  res.send(csvContent);
});

// 5. Gemini AI Evaluation Endpoint
app.post('/api/evaluate', async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      genre,
      place,
      time,
      character,
      surpriseCard,
      versionNumber,
      wordCount,
    } = req.body;

    if (!content || content.trim().length < 15) {
      return res.status(400).json({
        success: false,
        error: 'Değerlendirme için lütfen en az birkaç cümlelik bir metin yazınız.',
      });
    }

    const genreDescriptions: Record<string, string> = {
      hikaye: 'Klasik/çağdaş hikâye (öykü): Durum veya olay örgüsü, karakter gelişimi, mekân-zaman uyumu.',
      masal: 'Masal: Olağanüstü unsurlar, masalsı anlatım, tekerleme veya hayalî öğeler, adalet/erdem teması.',
      bilim_kurgu: 'Bilim kurgu: Gelecek/teknoloji vizyonu, bilimsel olasılıklar, kurgunun mantığı.',
      polisiye: 'Polisiye: Gizem, ipuçları, merak ögesi, şüphe ve mantık örgüsü.',
      ani: 'Anı: Gerçekçi/yaşanmışlık hissi, samimi ben anlatımı, geçmişin izleri.',
      gunluk: 'Günlük: Tarihli iç döküş, birinci kişi anlatımı, anın duygu ve düşünceleri.',
    };

    const genreNote = genreDescriptions[genre] || 'Edebî kurgu metni';

    const systemPrompt = `Sen lise düzeyindeki öğrencilerin yazma becerilerini destekleyen, yapıcı, teşvik edici ve uzman bir Türk Dili ve Edebiyatı öğretmenisin. Adın YAZAROTA Değerlendirme Asistanı.
Amacın öğrenciyi yargılamak veya metnini küçümsemek kesinlikle DEĞİLDİR; aksine onda yazma şevki uyandırmak, güçlü yönlerini fark ettirmek ve somut, uygulanabilir önerilerle sonraki sürümde metnini geliştirmesine rehberlik etmektir.
Metni asla kendin baştan yazma. Öğrencinin kendi metninden alıntılar yaparak ve seçilen edebî türe dikkat ederek geri bildirim ver.

YAZAROTA 100 Puanlık Değerlendirme Rubriği Ölçütleri:
1. Başlığın metne uygunluğu (10 Puan)
2. Olay örgüsü ve kurgu (25 Puan)
3. Karakterlerin işlenişi (15 Puan)
4. Mekân ve zaman kullanımı (10 Puan)
5. Seçilen edebî türe uygunluk (20 Puan) [Tür: ${genre} - ${genreNote}]
6. Dil ve anlatım (15 Puan)
7. Özgünlük ve yaratıcılık (5 Puan) [Sürpriz kartının entegrasyonu dâhil]
Toplam: 100 Puan.

Puanların toplamı tam olarak kriter puanlarının toplamına eşit olmalıdır.
Geri bildirimlerinde Türkçe dil kurallarına özen göster; motive edici, nazik ve pedagojik bir üslup kullan.
Öğrencinin metninden doğrudan en az iki örnek/alıntı göstererek güçlü yönleri belirt.
Geliştirilecek yönlerde de metnin belirli kısımlarına atıfta bulun.
En fazla 3 öncelikli gelişim önerisi sırala.
Sonraki adım olarak öğrencinin hemen uygulayabileceği tek bir somut alıştırma öner.`;

    const userPrompt = `Aşağıdaki öğrenci metnini incele ve JSON formatında değerlendirme sun:

Başlık: "${title || 'Başlıksız'}"
Seçilen Edebî Tür: ${genre}
Belirlenen Mekân: ${place || 'Belirtilmemiş'}
Belirlenen Zaman: ${time || 'Belirtilmemiş'}
Belirlenen Karakter: ${character || 'Belirtilmemiş'}
Sürpriz Kartı: ${surpriseCard || 'Belirtilmemiş'}
Metin Uzunluğu: ${wordCount || content.trim().split(/\s+/).length} kelime
Metin Sürümü: ${versionNumber || 1}

Öğrencinin Yazdığı Metin:
"""
${content}
"""

Lütfen bu metni değerlendirip belirtilen JSON şemasına uygun yanıt ver.`;

    // Call Gemini API with structured output
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalScore: {
              type: Type.INTEGER,
              description: 'Toplam rubrik puanı (0 - 100 arası)',
            },
            criteriaScores: {
              type: Type.ARRAY,
              description: '7 ölçüt için puanlar ve gerekçeleri',
              items: {
                type: Type.OBJECT,
                properties: {
                  key: {
                    type: Type.STRING,
                    description: 'Kriter anahtarı: title, plot, character, setting, genre, language, creativity',
                  },
                  label: {
                    type: Type.STRING,
                    description: 'Ölçüt adı',
                  },
                  score: {
                    type: Type.INTEGER,
                    description: 'Alınan puan',
                  },
                  maxScore: {
                    type: Type.INTEGER,
                    description: 'Maksimum puan',
                  },
                  justification: {
                    type: Type.STRING,
                    description: 'Bu puanın öğrenciye yönelik nazik ve yapıcı gerekçesi',
                  },
                },
                required: ['key', 'label', 'score', 'maxScore', 'justification'],
              },
            },
            generalReview: {
              type: Type.STRING,
              description: 'Hikâyenin güçlü yönlerini açıklayan motive edici, destekleyici ve özetleyici genel yorum',
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Metinden alıntılar ve örneklerle öğrencinin en başarılı olduğu en az 2 yön',
            },
            areasToImprove: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Metindeki belirli bölümlere yönelik somut geliştirme önerileri',
            },
            topThreeSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Bir sonraki düzenlemede uygulanabilecek en fazla 3 öncelikli somut öneri',
            },
            genreCompliance: {
              type: Type.STRING,
              description: 'Metnin seçilen edebî türün özelliklerini ne ölçüde taşıdığına dair analiz',
            },
            surpriseCardCompliance: {
              type: Type.STRING,
              description: 'Sürpriz kartının hikâyeye nasıl dâhil edildiği ve olay örgüsüne etkisi',
            },
            nextActionStep: {
              type: Type.STRING,
              description: 'Öğrencinin yazısını geliştirmek için yapabileceği tek bir somut eylem/alıştırma',
            },
          },
          required: [
            'totalScore',
            'criteriaScores',
            'generalReview',
            'strengths',
            'areasToImprove',
            'topThreeSuggestions',
            'genreCompliance',
            'surpriseCardCompliance',
            'nextActionStep',
          ],
        },
      },
    });

    const responseText = response.text || '{}';
    const parsedReview = JSON.parse(responseText);

    parsedReview.id = 'rev-' + Date.now();
    parsedReview.evaluatedAt = new Date().toISOString();

    res.json({ success: true, review: parsedReview });
  } catch (error: any) {
    console.error('Gemini evaluation error:', error);
    res.status(500).json({
      success: false,
      error: 'Değerlendirme sırasında bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata'),
      details: 'Lütfen birkaç saniye sonra tekrar deneyiniz veya metninizi kontrol ediniz.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 YAZAROTA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
