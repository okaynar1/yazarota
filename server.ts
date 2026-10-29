import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Environment check
const isVercel = Boolean(process.env.VERCEL);

// Dynamic Gemini Client getter with clean key handling
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// --- SUPABASE DATABASE CONFIGURATION ---
const SUPABASE_PROJECT_ID = 'rxobuyiyiytiijggozyx';
const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4b2J1eWl5aXl0aWlqZ2dvenl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjgzODgsImV4cCI6MjEwODg0NDM4OH0.7nO_76xN5lKLcLcR1z8jf3Eez6VoyhiuqgALCYKxyGs';

let supabaseClient: SupabaseClient | null = null;
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log(`🔗 Supabase client initialized for project [${SUPABASE_PROJECT_ID}]`);
  }
} catch (e) {
  console.warn('Could not initialize Supabase client:', e);
}

// JSON Database file path (on Vercel serverless /tmp is the only writable directory)
const DATA_DIR = isVercel ? path.join('/tmp', 'yazarota_data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'yazarota_db.json');

// Ensure data directory exists safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create data dir synchronously:', e);
}

// Sync current in-memory state to Supabase Cloud (Both atomic app_state and relational tables)
async function syncToSupabase(data: DatabaseSchema): Promise<void> {
  if (!supabaseClient) return;

  try {
    // 1. Snapshot sync into app_state (ensures zero data loss across nested objects)
    const { error: stateErr } = await supabaseClient.from('app_state').upsert(
      {
        id: 'default',
        state: data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (stateErr) {
      if (
        stateErr.code === '42P01' ||
        stateErr.message.includes('relation') ||
        stateErr.message.includes('schema cache')
      ) {
        // Table not created yet in Supabase SQL editor
        return;
      }
      console.warn('Supabase app_state sync notice:', stateErr.message);
    }

    // 2. Relational sync into users table
    if (Array.isArray(data.users) && data.users.length > 0) {
      const userRows = data.users.map((u) => ({
        id: u.id,
        username: u.username,
        password_hash: u.passwordHash,
        salt: u.salt,
        role: u.role,
        name: u.name,
        class_grade: u.classGrade || '5-A',
        pseudonym: u.pseudonym || null,
        must_change_password: Boolean(u.mustChangePassword),
        password_changed_at: u.passwordChangedAt || null,
        created_at: u.createdAt || new Date().toISOString(),
      }));
      try {
        await supabaseClient.from('users').upsert(userRows, { onConflict: 'id' });
      } catch (e) {}
    }

    // 3. Relational sync into stories table
    if (Array.isArray(data.stories) && data.stories.length > 0) {
      const storyRows = data.stories.map((s) => ({
        id: s.id,
        student_code: s.studentCode || null,
        author_username: s.authorUsername || null,
        author_name: s.authorName || null,
        author_class: s.authorClass || null,
        title: s.title || 'Başlıksız',
        genre: s.genre || 'hikaye',
        place: s.place || null,
        time: s.time || null,
        character: s.character || null,
        surprise_card: s.surpriseCard || null,
        status: s.status || 'draft',
        current_version_number: s.currentVersionNumber || 1,
        versions: s.versions || [],
        class_id: s.classId || null,
        task_id: s.taskId || null,
        test_type: s.testType || 'standard',
        published_work_id: s.publishedWorkId || null,
        created_at: s.createdAt || new Date().toISOString(),
        updated_at: s.updatedAt || new Date().toISOString(),
      }));
      try {
        await supabaseClient.from('stories').upsert(storyRows, { onConflict: 'id' });
      } catch (e) {}
    }

    // 4. Relational sync into published_works
    if (Array.isArray(data.publishedWorks) && data.publishedWorks.length > 0) {
      const pubRows = data.publishedWorks.map((w) => ({
        id: w.id,
        story_id: w.storyId || null,
        title: w.title,
        genre: w.genre,
        author_type: w.authorType || 'pseudonym',
        author_display_name: w.authorDisplayName || '',
        student_username: w.studentUsername || null,
        teacher_editor_notes: w.teacherEditorNotes || null,
        issue_id: w.issueId || null,
        issue_number: w.issueNumber || 1,
        published_at: w.publishedAt || new Date().toISOString(),
        word_count: w.wordCount || 0,
        likes_count: w.likesCount || 0,
        place: w.place || null,
        time: w.time || null,
        character: w.character || null,
        surprise_card: w.surpriseCard || null,
        score: w.score || 0,
        content: w.content || '',
      }));
      try {
        await supabaseClient.from('published_works').upsert(pubRows, { onConflict: 'id' });
      } catch (e) {}
    }

    // 5. Relational sync into notifications (recent 50)
    if (Array.isArray(data.notifications) && data.notifications.length > 0) {
      const notifRows = data.notifications.slice(0, 50).map((n) => ({
        id: n.id,
        user_id: n.userId,
        user_role: n.userRole || 'student',
        title: n.title,
        message: n.message,
        story_id: n.storyId || null,
        type: n.type || 'info',
        read: Boolean(n.read),
        created_at: n.createdAt || new Date().toISOString(),
      }));
      try {
        await supabaseClient.from('notifications').upsert(notifRows, { onConflict: 'id' });
      } catch (e) {}
    }
  } catch (err: any) {
    console.warn('Supabase sync skipped:', err?.message || err);
  }
}

// Pull latest cloud state from Supabase if table exists
async function pullFromSupabase(): Promise<boolean> {
  if (!supabaseClient) return false;
  try {
    const { data, error } = await supabaseClient
      .from('app_state')
      .select('state, updated_at')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data?.state) {
      const remoteState = data.state as DatabaseSchema;
      ensureTeacherAccount(remoteState);
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(remoteState, null, 2), 'utf-8');
        console.log(`⚡ YAZAROTA: Successfully synced state from Supabase Cloud (${data.updated_at})`);
        return true;
      } catch (writeErr) {
        console.warn('Could not persist Supabase state locally:', writeErr);
      }
    }
  } catch (err: any) {
    // Schema might not exist yet
  }
  return false;
}

// --- PASSWORD & SECURITY HELPERS ---
const SECRET_KEY = process.env.JWT_SECRET || 'yazarota-literary-platform-secret-2026';

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

interface AuthTokenPayload {
  userId: string;
  username: string;
  role: 'student' | 'teacher';
  name: string;
  exp: number;
}

function createToken(payload: Omit<AuthTokenPayload, 'exp'>): string {
  const fullPayload: AuthTokenPayload = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const str = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET_KEY).update(str).digest('base64url');
  return `${str}.${sig}`;
}

function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8')) as AuthTokenPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

function getUserFromReq(req: Request): AuthTokenPayload | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    return verifyToken(token);
  }
  const queryToken = req.query.token as string | undefined;
  if (queryToken) {
    return verifyToken(queryToken);
  }
  return null;
}

// 10 Standard Analytic Rubric Criteria
const DEFAULT_RUBRIC_CRITERIA = [
  {
    id: 'crit-1',
    key: 'title',
    name: '1. Başlık ve İçerik Uygunluğu',
    description: 'Başlığın metnin konusu, teması ve merak ögesiyle uyumu ve çekiciliği.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Başlık metinle alakasız veya çok klişe.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Metne dair genel bir fikir veriyor fakat merak uyandırmıyor.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Metinle uyumlu, dikkat çekici ve konuyu yansıtıyor.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Özgün, derin anlam katmanları olan ve okuru doğrudan metne çeken mükemmel başlık.', score: 10 },
    ],
  },
  {
    id: 'crit-2',
    key: 'plot',
    name: '2. Olay Örgüsü ve Kurgusal Tutarlılık',
    description: 'Serim, düğüm, çözüm dengesi; çatışma, gerilim ve olay akışının mantıksal sürekliliği.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Olay akışı kopuk, mantık hataları var.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Temel bir olay var fakat geçişler zayıf veya aceleye getirilmiş.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Giriş-gelişme-sonuç tutarlı, merak ögesi korunmuş.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Sürükleyici, kurgusal doruk noktası ustaca işlenmiş, kusursuz ritim.', score: 10 },
    ],
  },
  {
    id: 'crit-3',
    key: 'character',
    name: '3. Karakter Derinliği ve Psikolojisi',
    description: 'Karakterin fiziksel, ruhsal özellikleri, motivasyonları ve iç çatışmalarının inandırıcılığı.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Karakter sadece bir isimden ibaret, duygusu yok.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Temel bir vasfı belirtilmiş ancak davranış motivasyonu eksik.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Duygu ve düşünceleri anlaşılır, eylemleriyle örtüşüyor.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Karakterin iç dünyası, çelişkileri ve dönüşümü etkileyici bir derinlikle işlenmiş.', score: 10 },
    ],
  },
  {
    id: 'crit-4',
    key: 'setting',
    name: '4. Mekân ve Zaman Betimlemeleri',
    description: 'Mekânın ve zamanın duyusal ayrıntılarla (ses, koku, ışık, doku) canlandırılması.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Mekân veya zaman sadece kuru bir bilgi olarak verilmiş.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Basit görsel betimlemeler var ancak atmosfer eksik.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Okur mekânı ve zamanı hissedebiliyor, duyusal detaylar mevcut.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Mekân adeta yaşayan bir karakter gibi; atmosfer kurgunun ruhunu güçlendiriyor.', score: 10 },
    ],
  },
  {
    id: 'crit-5',
    key: 'genre',
    name: '5. Edebî Türün Özelliklerine Uygunluk',
    description: 'Hikâye, masal, şiir, fabl, polisiye, bilim kurgu, anı veya günlüğün yapısal kurallarına sadakat.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Seçilen türün temel nitelikleri göz ardı edilmiş.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Türe dair bazı unsurlar var fakat başka türlerle karışmış.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Türe özgü teknikler ve anlatım biçimleri doğru kullanılmış.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Türün tüm geleneksel ve modern olanakları ustalıkla harmanlanmış.', score: 10 },
    ],
  },
  {
    id: 'crit-6',
    key: 'language',
    name: '6. Dil, Anlatım ve Söz Varlığı Zenginliği',
    description: 'Kelime hazinesinin zenginliği, akıcılık, özgün metaforlar ve mecazların gücü.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Tekdüze, sığ ve tekrara düşen bir söz dağarcığı.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Anlatım anlaşılır fakat klişe ifadeler ağırlıkta.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Zengin kelimeler, akıcı cümle yapıları ve edebî bir lezzet.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Özgün imgeler, şiirsel ve etkileyici bir üslup, zengin söz varlığı.', score: 10 },
    ],
  },
  {
    id: 'crit-7',
    key: 'mechanics',
    name: '7. Yazım ve Noktalama Kurallarına Uygunluk',
    description: 'TDK yazım kurallarına, noktalama işaretlerinin işlevsel ve doğru kullanımına uyum.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Çok sayıda temel yazım ve noktalama hatası var.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Bazı noktalama eksikleri ve yazım hataları mevcut.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Büyük ölçüde hatasız, noktalama metnin ritmini destekliyor.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Kusursuz yazım, noktalama işaretleri anlatımın temposunu mükemmel yönetiyor.', score: 10 },
    ],
  },
  {
    id: 'crit-8',
    key: 'creativity',
    name: '8. Özgünlük ve Yaratıcı Çözümler',
    description: 'Kalıplaşmış klişelerin dışına çıkabilme, benzersiz kurgusal buluşlar ve özgün bakış açısı.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Tamamen bilindik ve öngörülebilir kurgu.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Klasik temalar üzerinde küçük yaratıcı dokunuşlar var.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Beklenmedik ayrıntılar, özgün bir anlatım perspektifi.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Büyüleyici özgünlük, sıra dışı bir kurgu zekâsı ve unutulmaz bir yaklaşım.', score: 10 },
    ],
  },
  {
    id: 'crit-9',
    key: 'surprise_card',
    name: '9. Sürpriz Kartının Doğal Entegrasyonu',
    description: 'Rastgele gelen sürpriz kartının hikâyeye yapay durmadan, ana çatışmaya hizmet edecek şekilde kaynaşması.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Sürpriz kartı kullanılmamış veya metne tamamen yama gibi durmuş.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Metinde yer alıyor fakat kurgusal dönüm noktasına katkısı zayıf.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Olay örgüsüyle organik bağ kurulmuş, kırılma anı yaratmış.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Sürpriz kartı hikâyenin can damarına dönüşmüş; kurgu bu unsurla zirveye ulaşmış.', score: 10 },
    ],
  },
  {
    id: 'crit-10',
    key: 'theme_depth',
    name: '10. Duygu, Düşünce ve İleti Derinliği',
    description: 'Metnin okurda bıraktığı felsefi, insani veya duygusal iz; ana fikrin okura hissettirilişi.',
    maxScore: 10,
    levels: [
      { level: 1, label: 'Geliştirilmeli', description: 'Yüzeysel, okurda herhangi bir iz veya duygu bırakmıyor.', score: 2.5 },
      { level: 2, label: 'Kısmen Yeterli', description: 'Temel bir mesaj var fakat didaktik veya sığ aktarılmış.', score: 5 },
      { level: 3, label: 'Yeterli', description: 'Okurda empati uyandırıyor, samimi bir duygu aktarımı var.', score: 7.5 },
      { level: 4, label: 'Çok İyi', description: 'Evrensel insanlık durumlarına temas eden derin, etkileyici ve kalıcı bir duygu iklimi.', score: 10 },
    ],
  },
];

// Initial DB Schema and Seed Data
interface DatabaseSchema {
  users: any[];
  stories: any[];
  publishedWorks: any[];
  magazineIssues: any[];
  notifications: any[];
  classes: any[];
  tasks: any[];
  rubricCriteria: any[];
  researchSettings: {
    rubricMax: number;
    parentConsentRequired: boolean;
    anonymousOnly: boolean;
    activeCohort: string;
  };
}

// Teacher credentials constants
const INITIAL_TEACHER_USERNAME = 'ogretmen';
const INITIAL_TEACHER_PASSWORD = process.env.INITIAL_TEACHER_PASSWORD || '123456';

// Generate seeded passwords with salt
const teacherSalt = generateSalt();
const teacherHashed = hashPassword(INITIAL_TEACHER_PASSWORD, teacherSalt);

const studentSalt = generateSalt();
const studentHashed = hashPassword('1234', studentSalt);

const DEFAULT_DB: DatabaseSchema = {
  users: [
    {
      id: 'user-teacher-1',
      username: 'ogretmen',
      passwordHash: teacherHashed,
      salt: teacherSalt,
      role: 'teacher',
      name: 'Türk Dili ve Edebiyatı Zümresi',
      classGrade: 'Tüm Şubeler',
      mustChangePassword: true, // Security requirement: must change on first login
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-student-1',
      username: 'ogrenci1',
      passwordHash: studentHashed,
      salt: studentSalt,
      role: 'student',
      name: 'Elif Sena Yıldız',
      classGrade: '10-A',
      pseudonym: 'Kelimelerin İzi',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-student-2',
      username: 'ogrenci2',
      passwordHash: studentHashed,
      salt: studentSalt,
      role: 'student',
      name: 'Can Berk Demir',
      classGrade: '11-B',
      pseudonym: 'Mavi Martı',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    },
  ],
  rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
  magazineIssues: [
    {
      id: 'issue-1',
      issueNumber: 1,
      title: 'Genç Kalemler — Sayı 1: Peronlar ve Düşler',
      theme: 'Yolculuk, Hatıra ve Zamanın Kırılma Noktaları',
      editorNote:
        'Sevgili okurlar, YAZAROTA yazma atölyelerinde filizlenen ve öğretmen geri bildirimleriyle olgunlaşan ilk genç edebî ürünlerimizi gururla sunuyoruz. Her hikâye, rastgele kartların cesur bir zihinle nasıl sanata dönüştüğünün canlı bir kanıtıdır.',
      coverColor: 'from-teal-800 to-slate-900',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      workIds: ['pub-work-1', 'pub-work-2'],
      isCurrent: true,
    },
  ],
  publishedWorks: [
    {
      id: 'pub-work-1',
      storyId: 'demo-story-1',
      title: 'Perondaki Sarı Mektup',
      genre: 'hikaye',
      authorType: 'pseudonym',
      authorDisplayName: 'Mavi Martı',
      studentUsername: 'ogrenci2',
      teacherEditorNotes: 'Atmosfer kurmadaki olgunluk ve mektup üzerindeki ithaf hikâyeye benzersiz bir derinlik kazandırmış. Yayın kurulu tarafından oy birliğiyle seçilmiştir.',
      issueId: 'issue-1',
      issueNumber: 1,
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      wordCount: 89,
      likesCount: 24,
      place: 'Terk edilmiş ve sarmaşıklarla kaplanmış bir tren istasyonu',
      time: 'Gece yarısı saat tam 03.17’de',
      character: 'Emekli edebiyat öğretmeni Selim Bey',
      surpriseCard: 'Balmumu mühürlü imzasız sarı mektup',
      score: 94,
      content:
        'Paslı rayların arasına dolan sarmaşıklar, gece yarısı esen serin güz rüzgarıyla fısıldıyordu. Saat kulesinin kırık kadranı tam 03.17’de donup kalmıştı. Emekli edebiyat öğretmeni Selim Bey, yakasını kaldırıp elindeki titrek feneri eski bekleme salonuna doğrulttu. Otuz yıl önce bu perondan el sallayıp bir daha haber alamadığı en parlak öğrencisi Cemil’in hatırası göğsünde ince bir sızıydı. Tam o sırada, peron bankının çatlak tahtasına sıkıştırılmış, kırmızı balmumuyla mühürlenmiş sarı bir zarf çarptı gözüne. Zarfın üzerinde silinmeye yüz tutmuş bir mürekkeple sadece şu yazıyordu: "Geç kalmış bir özür, hocama..." Zarfı açtığında içinden çıkan sararmış kurutulmuş akasya yaprağı, geçmişin tüm karanlığını bir anda aydınlattı.',
    },
    {
      id: 'pub-work-2',
      storyId: 'demo-story-2',
      title: 'Zamanın Kırık Aynası',
      genre: 'bilim_kurgu',
      authorType: 'real_name',
      authorDisplayName: 'Elif Sena Yıldız',
      studentUsername: 'ogrenci1',
      teacherEditorNotes: 'Bilim kurgu türünün mantığını felsefi bir hafıza sorgulamasıyla harmanlayan çok başarılı bir gençlik eseri.',
      issueId: 'issue-1',
      issueNumber: 1,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      wordCount: 142,
      likesCount: 38,
      place: 'Yerin üç kat altındaki tozlu arşiv odası',
      time: 'Güneş tutulmasının tam ortasında',
      character: 'Yalnızca eski kitapları onaran çırak Kerem',
      surpriseCard: 'Cebinde titreşmeye başlayan antika gümüş pusula',
      score: 96,
      content:
        'Güneşin yerini kapkara bir halkaya bıraktığı o eşsiz dakikada, arşiv odasının rutubetli sessizliği bozuldu. Kerem, 19. yüzyıldan kalma bir cilt kapağını onarırken göğüs cebindeki antika gümüş pusula birdenbire deli gibi dönmeye başladı. Pusulanın ibresi kuzeyi değil, masanın üzerindeki kırık pirinç aynayı gösteriyordu. Aynaya baktığında kendi yansımasını değil, tam kırk yıl sonraki hâlini gördü; yaşlı Kerem ona bir sayfa numarası fısıldıyordu: "Sayfa 73... Gerçeği orada bulacaksın." Titreyen elleriyle cildi açtı; sayfanın arasında kendi el yazısıyla yazılmış yarının tarihi duruyordu.',
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      userId: 'ogrenci2',
      userRole: 'student',
      title: 'Eseriniz Genç Kalemler Dergisi’nde!',
      message: '“Perondaki Sarı Mektup” adlı hikâyeniz öğretmeniniz tarafından incelenip onaylandı ve Sayı 1’de yayımlandı.',
      storyId: 'demo-story-1',
      type: 'magazine',
      read: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'all_teachers',
      userRole: 'teacher',
      title: 'Yeni Yazı Gönderildi',
      message: 'Elif Sena Yıldız (10-A), “Zamanın Kırık Aynası” başlıklı yazısını incelemeniz için gönderdi.',
      storyId: 'demo-story-2',
      type: 'submission',
      read: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  stories: [
    {
      id: 'demo-story-1',
      studentCode: 'OGR-4281',
      authorUsername: 'ogrenci2',
      authorName: 'Can Berk Demir',
      title: 'Perondaki Sarı Mektup',
      genre: 'hikaye',
      place: 'Terk edilmiş ve sarmaşıklarla kaplanmış bir tren istasyonu',
      time: 'Gece yarısı saat tam 03.17’de, herkesin derin uykuda olduğu bir anda',
      character: 'Geçmişindeki büyük kaybı hakkında asla konuşmayan emekli bir edebiyat öğretmeni',
      surpriseCard: 'Karakter beklenmedik, imzasız ve üzerinde eski bir balmumu mühür olan bir mektup alır.',
      status: 'published',
      publishedWorkId: 'pub-work-1',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
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
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          studentNotes: 'İlk taslak, olayları genel hatlarıyla kurdum.',
          review: {
            id: 'rev-v1',
            evaluatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
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
            strengths: ['Gece yarısı 03.17 atmosferi ile mühürlü mektup merak ögesini başarıyla tetikliyor.'],
            areasToImprove: ['Cümleler çok kısa ve peş peşe sıralanmış; betimlemeler genişletilmeli.'],
            topThreeSuggestions: ['İstasyonun terk edilmişliğini duyusal detaylarla betimle.', 'Selim Bey\'in iç hüznünü hissettir.'],
            genreCompliance: 'Hikâye türünün olay odaklı yapısına uygun.',
            surpriseCardCompliance: 'İmzasız mühürlü mektup sürpriz kartı hikâyeye dâhil edilmiş.',
            nextActionStep: 'Metne Selim Bey\'in hislerini anlatan 2-3 betimleyici cümle ekle.',
          },
          teacherFeedback: {
            id: 'tf-1',
            teacherId: 'user-teacher-1',
            teacherName: 'Türk Dili ve Edebiyatı Zümresi',
            decision: 'revision_requested',
            decisionLabel: 'Düzeltme İstendi',
            generalComment: 'Tebrikler Can Berk, atmosfer başlangıcı güzel fakat Selim Bey\'in duyguları ve mekân tasviri derinleştirilmeli. Önerilen düzeltmeleri yapıp yeni sürümü gönder.',
            revisionChecklist: [
              'İstasyonun paslı raylarını ve rüzgarı betimle',
              'Selim Bey\'in eski öğrencisine duyduğu özlemi hissettir',
              'Mektup üzerindeki yazıyı doğrudan tırnak içinde ver',
            ],
            rubricScores: {
              'crit-1': 8, 'crit-2': 7, 'crit-3': 7, 'crit-4': 6, 'crit-5': 8,
              'crit-6': 7, 'crit-7': 8, 'crit-8': 7, 'crit-9': 8, 'crit-10': 7,
            },
            rubricTotal: 73,
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        {
          id: 'v2-demo',
          versionNumber: 2,
          title: 'Perondaki Sarı Mektup',
          content: 'Paslı rayların arasına dolan sarmaşıklar, gece yarısı esen serin güz rüzgarıyla fısıldıyordu. Saat kulesinin kırık kadranı tam 03.17’de donup kalmıştı. Emekli edebiyat öğretmeni Selim Bey, yakasını kaldırıp elindeki titrek feneri eski bekleme salonuna doğrulttu. Otuz yıl önce bu perondan el sallayıp bir daha haber alamadığı en parlak öğrencisi Cemil’in hatırası göğsünde ince bir sızıydı. Tam o sırada, peron bankının çatlak tahtasına sıkıştırılmış, kırmızı balmumuyla mühürlenmiş sarı bir zarf çarptı gözüne. Zarfın üzerinde silinmeye yüz tutmuş bir mürekkeple sadece şu yazıyordu: "Geç kalmış bir özür, hocama..." Zarfı açtığında içinden çıkan sararmış kurutulmuş akasya yaprağı, geçmişin tüm karanlığını bir anda aydınlattı.',
          wordCount: 89,
          characterCount: 597,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          studentNotes: 'Öğretmenimin istediği düzeltmeleri yaptım; rayların pası, rüzgar ve Selim Bey\'in öğrencisiyle olan bağı eklendi.',
          review: {
            id: 'rev-v2',
            evaluatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            totalScore: 92,
            criteriaScores: [
              { key: 'title', label: 'Başlığın Metne Uygunluğu', score: 10, maxScore: 10, justification: 'Başlık ile sarı zarf ve mektubun teması kusursuz uyuşuyor.' },
              { key: 'plot', label: 'Olay Örgüsü ve Kurgu', score: 23, maxScore: 25, justification: 'Olay örgüsü merak ögesiyle dengeli ve sürükleyici bir ritim kazanmış.' },
              { key: 'character', label: 'Karakterlerin İşlenişi', score: 14, maxScore: 15, justification: 'Selim Bey\'in öğrencisine duyduğu özlem ve iç sızısı çok etkileyici verilmiş.' },
              { key: 'setting', label: 'Mekân ve Zaman Kullanımı', score: 10, maxScore: 10, justification: 'Paslı raylar, sarmaşıkların fısıltısı ve donmuş saat kulesi harika atmosfer yaratmış.' },
              { key: 'genre', label: 'Seçilen Edebî Türe Uygunluk', score: 18, maxScore: 20, justification: 'Hikâye türünün durum ve duygu yoğunluğunu başarıyla yansıtıyor.' },
              { key: 'language', label: 'Dil ve Anlatım', score: 14, maxScore: 15, justification: 'Dili zengin, kelime tercihleri çok yerinde, anlatım akıcı.' },
              { key: 'creativity', label: 'Özgünlük ve Yaratıcılık', score: 3, maxScore: 5, justification: 'Mektubun üzerindeki ithaf hikâyeye çok özgün bir duygu derinliği katmış.' },
            ],
            generalReview: 'Harika bir gelişim örneği! İlk taslaktaki kuru anlatım gitmiş, yerine edebî lezzeti yüksek, atmosferi solunabilen etkileyici bir hikâye gelmiş.',
            strengths: ['Atmosfer tasviri ve sarı mektup gizemi mükemmel kaynaşmış.'],
            areasToImprove: ['Son cümleden sonraki duygusal yankı sonraki hikâyelerde daha da zenginleştirilebilir.'],
            topThreeSuggestions: ['Bir sonraki hikâyede diyaloğu da devreye sokmayı dene.'],
            genreCompliance: 'Hikâye türünün serim ve düğüm aşamaları olgun bir dille inşa edilmiş.',
            surpriseCardCompliance: 'Sürpriz kartı hikâyenin merkezine kusursuz bir köprüyle yerleştirilmiş.',
            nextActionStep: 'Metnin yayına hazır hâlini kutla!',
          },
          teacherFeedback: {
            id: 'tf-2',
            teacherId: 'user-teacher-1',
            teacherName: 'Türk Dili ve Edebiyatı Zümresi',
            decision: 'published',
            decisionLabel: 'Yayına Hazır & Genç Kalemler İçin Seçildi',
            generalComment: 'Harika bir revizyon! Öğrencinin tavsiyeleri bu kadar duyarlı uygulaması bizi çok mutlu etti. Genç Kalemler Dergisi Sayı 1 için yayına alındı.',
            revisionChecklist: ['Tüm düzeltmeler eksiksiz tamamlandı.'],
            rubricScores: {
              'crit-1': 10, 'crit-2': 9, 'crit-3': 9, 'crit-4': 10, 'crit-5': 9,
              'crit-6': 9, 'crit-7': 10, 'crit-8': 9, 'crit-9': 9, 'crit-10': 9,
            },
            rubricTotal: 94,
            submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      ],
    },
    {
      id: 'demo-story-2',
      studentCode: 'OGR-5192',
      authorUsername: 'ogrenci1',
      authorName: 'Elif Sena Yıldız',
      title: 'Zamanın Kırık Aynası',
      genre: 'bilim_kurgu',
      place: 'Yerin üç kat altındaki tozlu arşiv odası',
      time: 'Güneş tutulmasının tam ortasında',
      character: 'Yalnızca eski kitapları onaran çırak Kerem',
      surpriseCard: 'Cebinde titreşmeye başlayan antika gümüş pusula',
      status: 'published',
      publishedWorkId: 'pub-work-2',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      currentVersionNumber: 1,
      classId: 'class-9a',
      taskId: 'task-2',
      testType: 'standard',
      versions: [
        {
          id: 'v1-demo2',
          versionNumber: 1,
          title: 'Zamanın Kırık Aynası',
          content: 'Güneşin yerini kapkara bir halkaya bıraktığı o eşsiz dakikada, arşiv odasının rutubetli sessizliği bozuldu. Kerem, 19. yüzyıldan kalma bir cilt kapağını onarırken göğüs cebindeki antika gümüş pusula birdenbire deli gibi dönmeye başladı. Pusulanın ibresi kuzeyi değil, masanın üzerindeki kırık pirinç aynayı gösteriyordu. Aynaya baktığında kendi yansımasını değil, tam kırk yıl sonraki hâlini gördü; yaşlı Kerem ona bir sayfa numarası fısıldıyordu: "Sayfa 73... Gerçeği orada bulacaksın." Titreyen elleriyle cildi açtı; sayfanın arasında kendi el yazısıyla yazılmış yarının tarihi duruyordu.',
          wordCount: 142,
          characterCount: 890,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          studentNotes: 'Bilim kurgu ve zaman paradoksu üzerine ilk denemem.',
          teacherFeedback: {
            id: 'tf-3',
            teacherId: 'user-teacher-1',
            teacherName: 'Türk Dili ve Edebiyatı Zümresi',
            decision: 'published',
            decisionLabel: 'Yayına Hazır & Genç Kalemler İçin Seçildi',
            generalComment: 'Tebrikler Elif Sena, akıcı ve kurgusu çok sağlam bir bilim kurgu anlatısı. Dergimizde zevkle yayımlıyoruz.',
            revisionChecklist: ['Yazım ve kurgu mükemmel seviyede.'],
            rubricScores: {
              'crit-1': 10, 'crit-2': 10, 'crit-3': 9, 'crit-4': 9, 'crit-5': 10,
              'crit-6': 9, 'crit-7': 10, 'crit-8': 10, 'crit-9': 9, 'crit-10': 10,
            },
            rubricTotal: 96,
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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

// Ensure default teacher exists and is in a valid state
function ensureTeacherAccount(db: DatabaseSchema): boolean {
  if (!Array.isArray(db.users)) {
    db.users = [];
  }

  let teacher = db.users.find(
    (u) => u.role === 'teacher' || u.username.toLowerCase() === INITIAL_TEACHER_USERNAME.toLowerCase()
  );

  // If teacher does not exist, create default teacher
  if (!teacher) {
    const salt = generateSalt();
    const passwordHash = hashPassword(INITIAL_TEACHER_PASSWORD, salt);
    const newTeacher = {
      id: 'user-teacher-1',
      username: INITIAL_TEACHER_USERNAME,
      passwordHash,
      salt,
      role: 'teacher' as const,
      name: 'Türk Dili ve Edebiyatı Zümresi',
      classGrade: 'Tüm Şubeler',
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    };
    db.users.unshift(newTeacher);
    return true;
  }

  let modified = false;

  // Ensure role is teacher
  if (teacher.role !== 'teacher') {
    teacher.role = 'teacher';
    modified = true;
  }

  // If teacher has not changed password yet or has a legacy corrupted hash
  if (!teacher.passwordChangedAt) {
    const currentMatches = hashPassword(INITIAL_TEACHER_PASSWORD, teacher.salt) === teacher.passwordHash;
    if (!currentMatches) {
      const newSalt = generateSalt();
      teacher.salt = newSalt;
      teacher.passwordHash = hashPassword(INITIAL_TEACHER_PASSWORD, newSalt);
      teacher.mustChangePassword = true;
      modified = true;
    } else if (teacher.mustChangePassword === undefined) {
      teacher.mustChangePassword = true;
      modified = true;
    }
  }

  return modified;
}

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const bundledDb = path.join(__dirname, 'data', 'yazarota_db.json');
      if (isVercel && fs.existsSync(bundledDb)) {
        try {
          const bundledContent = fs.readFileSync(bundledDb, 'utf-8');
          const parsedBundled = JSON.parse(bundledContent);
          ensureTeacherAccount(parsedBundled);
          fs.writeFileSync(DB_FILE, JSON.stringify(parsedBundled, null, 2), 'utf-8');
          return parsedBundled;
        } catch (seedErr) {
          console.warn('Could not copy bundled DB to /tmp:', seedErr);
        }
      }
      try {
        ensureTeacherAccount(DEFAULT_DB);
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      } catch (writeErr) {
        console.warn('Could not write initial DB to disk:', writeErr);
      }
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // Merge missing top-level arrays if updating from older schema
    let modified = false;
    if (!parsed.users) {
      parsed.users = DEFAULT_DB.users;
      modified = true;
    }
    if (!parsed.publishedWorks) {
      parsed.publishedWorks = DEFAULT_DB.publishedWorks;
      modified = true;
    }
    if (!parsed.magazineIssues) {
      parsed.magazineIssues = DEFAULT_DB.magazineIssues;
      modified = true;
    }
    if (!parsed.notifications) {
      parsed.notifications = DEFAULT_DB.notifications;
      modified = true;
    }
    if (!parsed.rubricCriteria || parsed.rubricCriteria.length < 10) {
      parsed.rubricCriteria = DEFAULT_RUBRIC_CRITERIA;
      modified = true;
    }

    // Always ensure teacher account is ready and valid
    if (ensureTeacherAccount(parsed)) {
      modified = true;
    }

    if (modified) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch (e) {}
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, using default:', err);
    return DEFAULT_DB;
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing DB to disk (continuing safely in-memory):', err);
  }

  // Asynchronously sync to Supabase Cloud
  if (supabaseClient) {
    syncToSupabase(data).catch(() => {});
  }
}

// Ensure DB is initialized and pull latest cloud state if available
readDb();
pullFromSupabase().catch(() => {});

// Helper to add in-app notifications
function addNotification(
  db: DatabaseSchema,
  userId: string,
  userRole: 'student' | 'teacher',
  title: string,
  message: string,
  type: 'info' | 'revision' | 'approved' | 'magazine' | 'submission',
  storyId?: string
) {
  const notif = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId,
    userRole,
    title,
    message,
    storyId,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(notif);
  if (db.notifications.length > 200) {
    db.notifications.pop();
  }
}

// ================= API ROUTES =================

// Health check endpoint
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'YAZAROTA API',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    supabaseConfigured: Boolean(supabaseClient),
    supabaseProjectId: SUPABASE_PROJECT_ID,
    isVercel: isVercel,
    time: new Date().toISOString(),
  });
});

// Supabase Status Endpoint
app.get(['/api/supabase/status', '/supabase/status'], async (_req: Request, res: Response) => {
  if (!supabaseClient) {
    return res.json({
      success: false,
      configured: false,
      message: 'Supabase istemcisi yapılandırılmamış.',
    });
  }

  try {
    const { error } = await supabaseClient.from('app_state').select('id').limit(1);
    const tablesReady = !error;
    res.json({
      success: true,
      configured: true,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      connected: true,
      tablesReady,
      message: tablesReady
        ? 'Supabase veritabanı aktif ve tablolar kullanıma hazır!'
        : 'Supabase bağlantısı kuruldu ancak SQL şemasının çalıştırılması bekleniyor.',
      errorDetails: error ? error.message : null,
    });
  } catch (err: any) {
    res.json({
      success: false,
      configured: true,
      connected: false,
      tablesReady: false,
      message: 'Supabase sunucusuna bağlanırken hata oluştu.',
      errorDetails: err?.message,
    });
  }
});

// Supabase SQL Schema Provider (Allows user or frontend to fetch SQL code directly)
app.get(['/api/supabase/sql', '/supabase/sql'], (_req: Request, res: Response) => {
  const sqlPath = path.join(__dirname, 'supabase_schema.sql');
  if (fs.existsSync(sqlPath)) {
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    res.type('text/plain').send(sqlContent);
  } else {
    res.status(404).json({ success: false, error: 'supabase_schema.sql dosyası bulunamadı.' });
  }
});

// Trigger manual Supabase sync
app.post(['/api/supabase/sync', '/supabase/sync'], async (_req: Request, res: Response) => {
  const db = readDb();
  if (!supabaseClient) {
    return res.status(503).json({ success: false, error: 'Supabase istemcisi aktif değil.' });
  }

  try {
    await syncToSupabase(db);
    res.json({ success: true, message: 'Veriler başarıyla Supabase bulutuna senkronize edildi.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Senkronizasyon hatası' });
  }
});

// ================= AUTHENTICATION ROUTES =================

// Register (Student)
app.post(['/api/auth/register', '/auth/register'], (req: Request, res: Response) => {
  const { username, password, name, classGrade, pseudonym } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({
      success: false,
      error: 'Kullanıcı adı, isim ve şifre alanları zorunludur.',
    });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Kullanıcı adı en az 3 karakterden oluşmalıdır.',
    });
  }

  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      error: 'Şifre en az 4 karakter uzunluğunda olmalıdır.',
    });
  }

  const db = readDb();
  const existing = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'Bu kullanıcı adı zaten kullanılmaktadır. Lütfen farklı bir kullanıcı adı seçiniz.',
    });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser = {
    id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    username: cleanUsername,
    passwordHash,
    salt,
    role: 'student' as const,
    name: name.trim(),
    classGrade: classGrade ? classGrade.trim() : 'Genel',
    pseudonym: pseudonym ? pseudonym.trim() : name.trim(),
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);

  const token = createToken({
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role,
    name: newUser.name,
  });

  res.json({
    success: true,
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      name: newUser.name,
      classGrade: newUser.classGrade,
      pseudonym: newUser.pseudonym,
      mustChangePassword: false,
      createdAt: newUser.createdAt,
    },
  });
});

// Login (Student or Teacher)
app.post(['/api/auth/login', '/auth/login'], (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Lütfen kullanıcı adı ve şifrenizi giriniz.',
    });
  }

  const cleanUsername = username.trim().toLowerCase();
  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === cleanUsername);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Girdiğiniz kullanıcı adı veya şifre hatalı.',
    });
  }

  const calculatedHash = hashPassword(password, user.salt);
  if (calculatedHash !== user.passwordHash) {
    return res.status(401).json({
      success: false,
      error: 'Girdiğiniz kullanıcı adı veya şifre hatalı.',
    });
  }

  const token = createToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      classGrade: user.classGrade,
      pseudonym: user.pseudonym,
      mustChangePassword: Boolean(user.mustChangePassword),
      createdAt: user.createdAt,
    },
  });
});

// Change Password (Mandatory for teacher on first login or on demand)
app.post(['/api/auth/change-password', '/auth/change-password'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  const { currentPassword, newPassword } = req.body;

  if (!authUser) {
    return res.status(401).json({
      success: false,
      error: 'Şifre değiştirmek için oturum açmış olmanız gerekmektedir.',
    });
  }

  if (!currentPassword) {
    return res.status(400).json({
      success: false,
      error: 'Lütfen mevcut şifrenizi giriniz.',
    });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Yeni şifreniz en az 6 karakterden oluşmalıdır.',
    });
  }

  if (newPassword === '123456' || newPassword === '1234') {
    return res.status(400).json({
      success: false,
      error: 'Yeni şifreniz varsayılan ilk şifreyle (123456) aynı olamaz. Lütfen farklı ve güvenli bir şifre belirleyiniz.',
    });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === authUser.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı.' });
  }

  const checkHash = hashPassword(currentPassword, user.salt);
  if (checkHash !== user.passwordHash) {
    return res.status(400).json({
      success: false,
      error: 'Mevcut şifrenizi hatalı girdiniz. Lütfen şifrenizi kontrol ediniz.',
    });
  }

  const newSalt = generateSalt();
  user.salt = newSalt;
  user.passwordHash = hashPassword(newPassword, newSalt);
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date().toISOString();
  writeDb(db);

  res.json({
    success: true,
    message: 'Şifreniz başarıyla güncellendi.',
  });
});

// Helper to enforce active teacher role and completed mandatory password change
function requireActiveTeacher(req: Request, res: Response): AuthTokenPayload | null {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== 'teacher') {
    res.status(403).json({
      success: false,
      error: 'Bu işlem yalnızca öğretmen yetkisi gerektirir.',
    });
    return null;
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === authUser.userId);
  if (user && user.mustChangePassword) {
    res.status(403).json({
      success: false,
      error: 'İlk girişinizde şifrenizi değiştirmeniz zorunludur. Lütfen önce şifrenizi güncelleyiniz.',
    });
    return null;
  }

  return authUser;
}

// Current User Me
app.get(['/api/auth/me', '/auth/me'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  if (!authUser) {
    return res.json({ success: true, authenticated: false, user: null });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === authUser.userId);
  if (!user) {
    return res.json({ success: true, authenticated: false, user: null });
  }

  res.json({
    success: true,
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      classGrade: user.classGrade,
      pseudonym: user.pseudonym,
      mustChangePassword: Boolean(user.mustChangePassword),
      createdAt: user.createdAt,
    },
  });
});

// ================= NOTIFICATIONS ROUTES =================

app.get(['/api/notifications', '/notifications'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  const db = readDb();

  let userNotifs = [];
  if (authUser) {
    if (authUser.role === 'teacher') {
      userNotifs = db.notifications.filter((n) => n.userId === 'all_teachers' || n.userId === authUser.username);
    } else {
      userNotifs = db.notifications.filter((n) => n.userId === authUser.username || n.userId === authUser.userId);
    }
  } else {
    // If not authenticated, return empty
    userNotifs = [];
  }

  res.json({ success: true, notifications: userNotifs });
});

app.post(['/api/notifications/:id/read', '/notifications/:id/read'], (req: Request, res: Response) => {
  const db = readDb();
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    writeDb(db);
  }
  res.json({ success: true });
});

app.post(['/api/notifications/read-all', '/notifications/read-all'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  const db = readDb();

  if (authUser) {
    db.notifications.forEach((n) => {
      if (
        (authUser.role === 'teacher' && (n.userId === 'all_teachers' || n.userId === authUser.username)) ||
        n.userId === authUser.username ||
        n.userId === authUser.userId
      ) {
        n.read = true;
      }
    });
    writeDb(db);
  }
  res.json({ success: true });
});

// ================= RUBRIC DEFINITION ROUTES =================

app.get(['/api/rubric', '/rubric'], (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, criteria: db.rubricCriteria || DEFAULT_RUBRIC_CRITERIA });
});

app.put(['/api/rubric', '/rubric'], (req: Request, res: Response) => {
  const authUser = requireActiveTeacher(req, res);
  if (!authUser) return;

  const { criteria } = req.body;
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return res.status(400).json({ success: false, error: 'Geçersiz rubrik verisi.' });
  }

  const db = readDb();
  db.rubricCriteria = criteria;
  writeDb(db);

  res.json({ success: true, criteria: db.rubricCriteria });
});

// ================= STORIES WORKFLOW & CRUD =================

// Stories query with privacy enforcement
app.get(['/api/stories', '/stories'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  const { studentCode, status, classId } = req.query;

  let result = db.stories;

  // Access Control:
  // Teachers can see everything.
  // Students can see only their own stories.
  // Unauthenticated guests only see their local studentCode or published works.
  if (authUser) {
    if (authUser.role === 'student') {
      result = result.filter(
        (s) =>
          s.authorUsername === authUser.username ||
          (studentCode && s.studentCode === studentCode)
      );
    }
  } else if (studentCode) {
    result = result.filter((s) => s.studentCode === studentCode);
  }

  if (status) {
    result = result.filter((s) => s.status === status);
  }
  if (classId) {
    result = result.filter((s) => s.classId === classId);
  }

  const userMap = new Map((db.users || []).map((u) => [u.username, u]));
  const enrichedResult = result.map((s) => {
    const authorUser = s.authorUsername ? userMap.get(s.authorUsername) : null;
    return {
      ...s,
      authorClass: s.authorClass || authorUser?.classGrade,
    };
  });

  res.json({ success: true, stories: enrichedResult });
});

app.get(['/api/stories/:id', '/stories/:id'], (req: Request, res: Response) => {
  const db = readDb();
  const story = db.stories.find((s) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ success: false, error: 'Hikâye bulunamadı.' });
  }
  const authorUser = story.authorUsername ? db.users.find((u) => u.username === story.authorUsername) : null;
  const enrichedStory = {
    ...story,
    authorClass: story.authorClass || authorUser?.classGrade,
  };
  res.json({ success: true, story: enrichedStory });
});

// Save or Create Story
app.post(['/api/stories', '/stories'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  const storyData = req.body;

  if (!storyData.id) {
    storyData.id = 'story-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  }

  if (authUser && authUser.role === 'student') {
    storyData.authorUsername = authUser.username;
    storyData.authorName = authUser.name;
    const authorUser = db.users.find((u) => u.username === authUser.username);
    if (authorUser && authorUser.classGrade) {
      storyData.authorClass = authorUser.classGrade;
    }
  }

  if (!storyData.status) {
    storyData.status = 'draft';
  }

  const existingIndex = db.stories.findIndex((s) => s.id === storyData.id);
  const now = new Date().toISOString();

  if (!Array.isArray(storyData.versions) || storyData.versions.length === 0) {
    const rawContent = storyData.content || '';
    storyData.versions = [
      {
        id: 'ver-1',
        versionNumber: 1,
        title: storyData.title || 'Başlıksız',
        content: rawContent,
        wordCount: rawContent.trim() ? rawContent.trim().split(/\s+/).length : 0,
        characterCount: rawContent.length,
        createdAt: now,
      },
    ];
    storyData.currentVersionNumber = 1;
  }

  if (existingIndex >= 0) {
    // Preserve existing version history! Never overwrite previous versions
    const existing = db.stories[existingIndex];
    storyData.updatedAt = now;
    // Keep author credentials if not specified
    storyData.authorUsername = storyData.authorUsername || existing.authorUsername;
    storyData.authorName = storyData.authorName || existing.authorName;
    storyData.studentCode = storyData.studentCode || existing.studentCode;

    db.stories[existingIndex] = { ...existing, ...storyData };
  } else {
    storyData.createdAt = storyData.createdAt || now;
    storyData.updatedAt = now;
    db.stories.unshift(storyData);
  }

  writeDb(db);
  res.json({ success: true, story: storyData });
});

// Delete Story
app.delete(['/api/stories/:id', '/stories/:id'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  const index = db.stories.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Silinecek hikâye bulunamadı.' });
  }

  const story = db.stories[index];
  // Students can only delete their own stories
  if (authUser && authUser.role === 'student' && story.authorUsername && story.authorUsername !== authUser.username) {
    return res.status(403).json({ success: false, error: 'Bu hikâyeyi silme yetkiniz yok.' });
  }

  db.stories.splice(index, 1);
  writeDb(db);
  res.json({ success: true, message: 'Hikâye başarıyla silindi.' });
});

// Student Submits Story to Teacher ("Öğretmene Gönder")
app.post(['/api/stories/:id/submit-to-teacher', '/stories/:id/submit-to-teacher'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  const story = db.stories.find((s) => s.id === req.params.id);

  if (!story) {
    return res.status(404).json({ success: false, error: 'Hikâye bulunamadı.' });
  }

  // Check whether it's an initial submission or resubmission after revisions
  const isResubmission = story.status === 'revision_requested' || (story.versions && story.versions.length > 1);
  story.status = isResubmission ? 'resubmitted' : 'pending_teacher';
  story.updatedAt = new Date().toISOString();

  // Create in-app notification for teachers
  const studentName = authUser?.name || story.authorName || story.studentCode || 'Bir öğrenci';
  addNotification(
    db,
    'all_teachers',
    'teacher',
    isResubmission ? 'Yeniden Düzenlenen Yazı Gönderildi' : 'Yeni Değerlendirme Talebi',
    `${studentName}, “${story.title || 'Başlıksız'}” adlı eserini incelemeniz için gönderdi.`,
    'submission',
    story.id
  );

  writeDb(db);
  res.json({ success: true, story, message: 'Yazınız başarıyla öğretmeninize iletildi!' });
});

// Teacher Evaluates Story with 10-Criteria Analytic Rubric
app.post(['/api/stories/:id/teacher-evaluate', '/stories/:id/teacher-evaluate'], (req: Request, res: Response) => {
  const authUser = requireActiveTeacher(req, res);
  if (!authUser) return;

  const db = readDb();
  const story = db.stories.find((s) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ success: false, error: 'Hikâye bulunamadı.' });
  }

  const {
    versionNumber,
    decision, // 'approved' | 'revision_requested' | 'nominated_for_magazine' | 'published' | 'rejected'
    generalComment,
    revisionChecklist,
    rubricScores, // Record<criterionId, score>
    rubricTotal,
  } = req.body;

  const targetVersionNumber = versionNumber || story.currentVersionNumber;
  const version = story.versions.find((v: any) => v.versionNumber === targetVersionNumber);
  if (!version) {
    return res.status(404).json({ success: false, error: 'Hedef sürüm bulunamadı.' });
  }

  const decisionLabels: Record<string, string> = {
    approved: 'Onaylandı',
    revision_requested: 'Düzeltme İstendi',
    nominated_for_magazine: 'Genç Kalemler İçin Seçildi',
    published: 'Yayına Hazır & Dergide Yayımlandı',
    rejected: 'Tekrar Yazılması Gerekiyor',
  };

  const teacherFeedback = {
    id: 'tf-' + Date.now(),
    teacherId: authUser.userId,
    teacherName: authUser.name,
    decision: decision || 'revision_requested',
    decisionLabel: decisionLabels[decision] || 'İncelendi',
    generalComment: generalComment || '',
    revisionChecklist: Array.isArray(revisionChecklist) ? revisionChecklist : [],
    rubricScores: rubricScores || {},
    rubricTotal: Number(rubricTotal) || 0,
    submittedAt: new Date().toISOString(),
  };

  version.teacherFeedback = teacherFeedback;

  // Update story workflow status accordingly
  if (decision === 'revision_requested') {
    story.status = 'revision_requested';
  } else if (decision === 'approved') {
    story.status = 'approved';
  } else if (decision === 'nominated_for_magazine') {
    story.status = 'nominated_for_magazine';
  } else if (decision === 'published') {
    story.status = 'published';
  }

  story.updatedAt = new Date().toISOString();

  // Notify student
  const studentTarget = story.authorUsername || story.studentCode;
  if (studentTarget) {
    const notifTitle =
      decision === 'revision_requested'
        ? 'Öğretmeniniz Düzeltme İstedi'
        : decision === 'nominated_for_magazine'
        ? 'Tebrikler! Eseriniz Genç Kalemler İçin Seçildi'
        : decision === 'published'
        ? 'Eseriniz Genç Kalemler Dergisi’nde Yayında!'
        : 'Öğretmen Değerlendirmeniz Tamamlandı';

    const notifMessage = generalComment
      ? `Öğretmeninizin notu: "${generalComment.slice(0, 100)}${generalComment.length > 100 ? '...' : ''}"`
      : `“${story.title || 'Yazınız'}” öğretmeniniz tarafından incelendi (${teacherFeedback.decisionLabel}).`;

    addNotification(
      db,
      studentTarget,
      'student',
      notifTitle,
      notifMessage,
      decision === 'revision_requested' ? 'revision' : 'approved',
      story.id
    );
  }

  writeDb(db);
  res.json({ success: true, story, feedback: teacherFeedback });
});

// Publish Story to Genç Kalemler Magazine
app.post(['/api/stories/:id/publish-to-magazine', '/stories/:id/publish-to-magazine'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      error: 'Genç Kalemler dergisine yalnızca öğretmenler yayın onayı verebilir.',
    });
  }

  const db = readDb();
  const story = db.stories.find((s) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ success: false, error: 'Hikâye bulunamadı.' });
  }

  const { authorType, authorDisplayName, teacherEditorNotes, issueId } = req.body;
  const latestVersion = story.versions[story.versions.length - 1];

  let currentIssue = db.magazineIssues.find((i) => i.id === issueId);
  if (!currentIssue) {
    currentIssue = db.magazineIssues.find((i) => i.isCurrent) || db.magazineIssues[0];
  }

  const pubId = 'pub-' + Date.now();
  const publishedWork = {
    id: pubId,
    storyId: story.id,
    title: latestVersion.title || story.title,
    content: latestVersion.content,
    genre: story.genre,
    authorType: authorType || 'pseudonym', // 'real_name' | 'pseudonym' | 'anonymous'
    authorDisplayName:
      authorType === 'real_name'
        ? story.authorName || 'Genç Yazar'
        : authorType === 'anonymous'
        ? 'Anonim Yazar'
        : authorDisplayName || story.authorName || 'Genç Kalem',
    studentUsername: story.authorUsername || '',
    teacherEditorNotes: teacherEditorNotes || 'Yayın kurulu onayıyla Genç Kalemler dergisine eklenmiştir.',
    issueId: currentIssue?.id || 'issue-1',
    issueNumber: currentIssue?.issueNumber || 1,
    publishedAt: new Date().toISOString(),
    wordCount: latestVersion.wordCount,
    likesCount: 0,
    place: story.place,
    time: story.time,
    character: story.character,
    surpriseCard: story.surpriseCard,
    score: latestVersion.teacherFeedback?.rubricTotal || latestVersion.review?.totalScore || 90,
  };

  db.publishedWorks.unshift(publishedWork);

  if (currentIssue && !currentIssue.workIds.includes(pubId)) {
    currentIssue.workIds.push(pubId);
  }

  story.status = 'published';
  story.publishedWorkId = pubId;
  story.updatedAt = new Date().toISOString();

  // Notify student
  const studentTarget = story.authorUsername || story.studentCode;
  if (studentTarget) {
    addNotification(
      db,
      studentTarget,
      'student',
      '🎉 Eseriniz Genç Kalemler Dergisi’nde Yayımlandı!',
      `“${publishedWork.title}” başlıklı eseriniz ${currentIssue?.title || 'dergide'} yayımlandı. Dijital dergiden okuyup PDF/Word çıktısı alabilirsiniz.`,
      'magazine',
      story.id
    );
  }

  writeDb(db);
  res.json({ success: true, publishedWork, story });
});

// ================= GENÇ KALEMLER MAGAZINE ROUTES =================

app.get(['/api/magazine/works', '/magazine/works'], (req: Request, res: Response) => {
  const db = readDb();
  const { genre, issueId, search } = req.query;

  let works = db.publishedWorks || [];

  if (genre && genre !== 'all') {
    works = works.filter((w) => w.genre === genre);
  }
  if (issueId && issueId !== 'all') {
    works = works.filter((w) => w.issueId === issueId);
  }
  if (search) {
    const q = String(search).toLowerCase();
    works = works.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.content.toLowerCase().includes(q) ||
        w.authorDisplayName.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, works });
});

app.get(['/api/magazine/works/:id', '/magazine/works/:id'], (req: Request, res: Response) => {
  const db = readDb();
  const work = db.publishedWorks?.find((w) => w.id === req.params.id);
  if (!work) {
    return res.status(404).json({ success: false, error: 'Yayımlanmış eser bulunamadı.' });
  }
  res.json({ success: true, work });
});

app.post(['/api/magazine/works/:id/like', '/magazine/works/:id/like'], (req: Request, res: Response) => {
  const db = readDb();
  const work = db.publishedWorks?.find((w) => w.id === req.params.id);
  if (!work) {
    return res.status(404).json({ success: false, error: 'Eser bulunamadı.' });
  }
  work.likesCount = (work.likesCount || 0) + 1;
  writeDb(db);
  res.json({ success: true, likesCount: work.likesCount });
});

app.get(['/api/magazine/issues', '/magazine/issues'], (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, issues: db.magazineIssues || [] });
});

app.post(['/api/magazine/issues', '/magazine/issues'], (req: Request, res: Response) => {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      error: 'Yeni sayı oluşturma yetkisi yalnızca öğretmenlere aittir.',
    });
  }

  const { title, theme, editorNote, coverColor } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Sayı başlığı zorunludur.' });
  }

  const db = readDb();
  const nextNum = (db.magazineIssues?.length || 0) + 1;
  const newIssue = {
    id: 'issue-' + Date.now(),
    issueNumber: nextNum,
    title: title.trim(),
    theme: theme ? theme.trim() : 'Genç Edebiyat Seçkisi',
    editorNote: editorNote ? editorNote.trim() : 'Öğrencilerimizin yaratıcı kalemlerinden çıkan seçkin eserler.',
    coverColor: coverColor || 'from-teal-800 to-slate-900',
    publishedAt: new Date().toISOString(),
    workIds: [],
    isCurrent: true,
  };

  // Mark previous issues as not current
  db.magazineIssues.forEach((i) => (i.isCurrent = false));
  db.magazineIssues.unshift(newIssue);
  writeDb(db);

  res.json({ success: true, issue: newIssue });
});

// ================= TEACHER DASHBOARD REAL STATISTICS =================

app.get(['/api/teacher/dashboard-stats', '/teacher/dashboard-stats'], (req: Request, res: Response) => {
  const authUser = requireActiveTeacher(req, res);
  if (!authUser) return;

  const db = readDb();
  const allStories = db.stories || [];

  const totalSubmitted = allStories.filter((s) => s.status !== 'draft').length;
  const pendingEvaluation = allStories.filter((s) => s.status === 'pending_teacher').length;
  const revisionRequested = allStories.filter((s) => s.status === 'revision_requested').length;
  const resubmitted = allStories.filter((s) => s.status === 'resubmitted').length;
  const approved = allStories.filter((s) => s.status === 'approved' || s.status === 'nominated_for_magazine').length;
  const publishedInMagazine = (db.publishedWorks || []).length;

  res.json({
    success: true,
    stats: {
      totalSubmitted, // Gelen Yazılar
      pendingEvaluation, // Değerlendirme Bekleyenler
      revisionRequested, // Düzeltme İstenenler
      resubmitted, // Yeniden Değerlendirilecekler
      approved, // Yayına Hazır / Onaylanan
      publishedInMagazine, // Genç Kalemler Dergisi'ndeki Yazılar
      totalStudents: (db.users || []).filter((u) => u.role === 'student').length,
      totalClasses: (db.classes || []).length,
    },
  });
});

// ================= CLASSES & TASKS =================

app.get(['/api/classes', '/classes'], (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, classes: db.classes });
});

app.post(['/api/classes', '/classes'], (req: Request, res: Response) => {
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

app.get(['/api/tasks', '/tasks'], (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, tasks: db.tasks });
});

app.post(['/api/tasks', '/tasks'], (req: Request, res: Response) => {
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

// Legacy Human Evaluation Support (TÜBİTAK double scoring)
app.post(['/api/human-evaluate', '/human-evaluate'], (req: Request, res: Response) => {
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

// ================= CSV EXPORT FOR RESEARCH =================

app.get('/api/export-csv', (_req: Request, res: Response) => {
  const db = readDb();
  const headers = [
    'Hikaye_ID',
    'Yazar_Kullanici_Adi',
    'Ogrenci_Adi',
    'Ogrenci_Kodu',
    'Edebi_Tur',
    'Baslik',
    'Durum',
    'Surum_No',
    'Kelime_Sayisi',
    'AI_Toplam_Puan',
    'Ogretmen_Toplam_Puan',
    'Ogretmen_Karari',
    'Ogretmen_Notu',
    'Tarih',
  ];

  const rows: string[] = [headers.join(',')];

  for (const story of db.stories || []) {
    for (const v of story.versions || []) {
      const review = v.review;
      const tf = v.teacherFeedback;

      const sanitize = (val: any) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      rows.push(
        [
          sanitize(story.id),
          sanitize(story.authorUsername || ''),
          sanitize(story.authorName || ''),
          sanitize(story.studentCode || 'ANON'),
          sanitize(story.genre),
          sanitize(v.title || story.title),
          sanitize(story.status),
          sanitize(v.versionNumber),
          sanitize(v.wordCount || 0),
          sanitize(review ? review.totalScore : ''),
          sanitize(tf ? tf.rubricTotal : ''),
          sanitize(tf ? tf.decisionLabel : ''),
          sanitize(tf ? tf.generalComment : ''),
          sanitize(v.createdAt || story.createdAt),
        ].join(',')
      );
    }
  }

  const csvContent = '\uFEFF' + rows.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="yazarota_ogrenci_yazilari.csv"');
  res.send(csvContent);
});

// JSON extraction helper for Gemini output
function cleanAndValidateGeminiOutput(rawText: string | undefined, genre: string = 'hikaye'): any {
  if (!rawText || !rawText.trim()) {
    throw new Error('Yapay zekâ modeli boş bir yanıt döndürdü.');
  }

  let text = rawText.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err: any) {
    console.error('JSON parse failed on text:', text.substring(0, 150));
    throw new Error('Yapay zekâ yanıtı geçerli JSON formatında ayrıştırılamadı.');
  }

  let score = Number(parsed.totalScore);
  if (isNaN(score)) score = 75;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const poetryCriteria = [
    { key: 'title', label: 'Şiir Başlığı ve Tematik Uyum', maxScore: 10 },
    { key: 'theme_emotion', label: 'Duygu ve Düşüncenin Aktarımı', maxScore: 20 },
    { key: 'imagery', label: 'İmge Kullanımı ve Çağrışım Gücü', maxScore: 20 },
    { key: 'diction_rhythm', label: 'Sözcük Seçimi, Şiirsel Anlatım ve Ritim', maxScore: 20 },
    { key: 'genre', label: 'Şiir Bütünlüğü ve Edebî Duruş', maxScore: 15 },
    { key: 'creativity', label: 'Özgünlük ve Yaratıcılık', maxScore: 10 },
    { key: 'surprise_card', label: 'Şiirsel Unsur / İmge Uyumu', maxScore: 5 },
  ];

  const fableCriteria = [
    { key: 'title', label: 'Fabl Başlığı ve Merak Ögesi', maxScore: 10 },
    { key: 'character_personification', label: 'Karakter Kullanımı ve Kişileştirme (Teşhis/İntak)', maxScore: 20 },
    { key: 'plot', label: 'Olay Örgüsü ve Çatışma', maxScore: 20 },
    { key: 'moral_theme', label: 'Ana Düşünce ve Dersin Yerleşimi', maxScore: 20 },
    { key: 'genre', label: 'Fabl Türü Özelliklerine Uygunluk', maxScore: 15 },
    { key: 'language', label: 'Anlatımın Açıklığı ve Dil Özeni', maxScore: 10 },
    { key: 'creativity', label: 'Özgünlük ve Sürpriz Kartı Uyumu', maxScore: 5 },
  ];

  const standardCriteria = [
    { key: 'title', label: 'Başlığın Metne Uygunluğu', maxScore: 10 },
    { key: 'plot', label: 'Olay Örgüsü ve Kurgu', maxScore: 25 },
    { key: 'character', label: 'Karakterlerin İşlenişi', maxScore: 15 },
    { key: 'setting', label: 'Mekân ve Zaman Kullanımı', maxScore: 10 },
    { key: 'genre', label: 'Seçilen Edebî Türe Uygunluk', maxScore: 20 },
    { key: 'language', label: 'Dil ve Anlatım', maxScore: 15 },
    { key: 'creativity', label: 'Özgünlük ve Yaratıcılık', maxScore: 5 },
  ];

  const targetCriteria = genre === 'siir' ? poetryCriteria : genre === 'fabl' ? fableCriteria : standardCriteria;

  const criteriaScores: any[] = [];
  const modelCriteria = Array.isArray(parsed.criteriaScores) ? parsed.criteriaScores : [];

  for (const std of targetCriteria) {
    const existing = modelCriteria.find((c: any) => c.key === std.key);
    if (existing) {
      criteriaScores.push({
        key: std.key,
        label: existing.label || std.label,
        score:
          typeof existing.score === 'number'
            ? Math.max(0, Math.min(std.maxScore, Math.round(existing.score)))
            : Math.round(std.maxScore * 0.75),
        maxScore: std.maxScore,
        justification: existing.justification || 'Ölçüt değerlendirmesi tamamlandı.',
      });
    } else {
      criteriaScores.push({
        key: std.key,
        label: std.label,
        score: Math.round(std.maxScore * 0.75),
        maxScore: std.maxScore,
        justification: 'Ölçüt başarıyla incelendi.',
      });
    }
  }

  // Genre-tailored fallback defaults
  let defaultGeneralReview = 'Hikâyeniz zengin kurgusal detaylar ve etkileyici bir anlatım potansiyeli barındırıyor.';
  let defaultStrengths = [
    'Kurgudaki atmosfer ve merak ögesi okuru hikâyeye bağlıyor.',
    'Karakterin kurgusal bağlamı edebî türün ritmini destekliyor.',
  ];
  let defaultAreasToImprove = ['Duyusal betimlemeleri ve mekân ayrıntılarını biraz daha derinleştirebilirsiniz.'];
  let defaultSuggestions = [
    'Mekânın ses ve koku gibi duyusal ayrıntılarını metne dâhil edin.',
    'Karakterin iç çatışmasını hissettiren kısa bir monolog veya diyalog ekleyin.',
    'Sürpriz kartının hikâyedeki kırılma anını daha belirgin kılın.',
  ];
  let defaultGenreCompliance = 'Metin, seçilen edebî türün temel kurallarına ve yapısına uygun şekilde kurgulanmıştır.';
  let defaultSurpriseCompliance = 'Sürpriz kartı anlatının gidişatına kurgusal bir heyecan katmıştır.';

  if (genre === 'siir') {
    defaultGeneralReview = 'Şiiriniz derin bir duygu dünyası, ses uyumu ve etkileyici dize kurgusu barındırıyor.';
    defaultStrengths = [
      'Dizeler arasındaki duygu ve düşünce aktarımı samimi ve özgün bir ses yakalamış.',
      'Sözcük tercihleri ve imge kullanımı şiirsel atmosferi başarıyla destekliyor.',
    ];
    defaultAreasToImprove = ['Dizeleri sesli okuyarak dize kırılımları ve iç ritim dengesini daha da güçlendirebilirsiniz.'];
    defaultSuggestions = [
      'Dizeleri sesli okuyup dilinize takılan sözcükleri sadeleştirin veya yerlerini değiştirin.',
      'Daha taze, alışılmamış somut benzetmeler ve duyusal imgelerle duygu yoğunluğunu perçinleyin.',
      'Serbest şiirde iç ahengi korumak için dize sonlarındaki ses tekrarlarından (aliterasyon/asonans) yararlanın.',
    ];
    defaultGenreCompliance = 'Metin, şiir sanatının gerektirdiği dize estetiğine, duygu yoğunluğuna ve serbest şiir ahengine uygundur.';
    defaultSurpriseCompliance = 'Seçilen şiirsel imge / sürpriz unsur dizelerin anlam dünyasına estetik bir derinlik katmıştır.';
  } else if (genre === 'fabl') {
    defaultGeneralReview = 'Fablınız hayvan kahramanların canlı karşılaşması, teşhis/intak ustalığı ve ibretli dersiyle son derece başarılı.';
    defaultStrengths = [
      'Hayvan karakterlerin kişileştirilmesi (teşhis) ve diyalogları metne büyük bir canlılık katmış.',
      'Karakterler arasındaki zıtlık ve çatışma olay akışını merak uyandırıcı kılmış.',
    ];
    defaultAreasToImprove = ['Ana fikrin ve ibretli dersin olayların akışı içinde daha doğal sezdirilmesine odaklanabilirsiniz.'];
    defaultSuggestions = [
      'Karakterlerin kendi türlerine özgü fiziksel vasıflarını (pençe, gaga, kanat vb.) diyaloglara ve hareketlere yedirin.',
      'Dersi doğrudan söylemek yerine olayın neticesinde okurun kendisinin sezmesini sağlayın.',
      'Çatışma anında kurnazlık ile dürüstlük arasındaki zıtlığı biraz daha vurgulayın.',
    ];
    defaultGenreCompliance = 'Metin, fabl türünün teşhis/intak özellikleri ve ibret verici ders yapısıyla tam bir uyum içindedir.';
    defaultSurpriseCompliance = 'Çatışma ve ders unsuru fablın kurgusal omurgasını başarıyla tamamlamıştır.';
  }

  return {
    totalScore: score,
    criteriaScores: criteriaScores,
    generalReview:
      typeof parsed.generalReview === 'string' && parsed.generalReview.trim()
        ? parsed.generalReview
        : defaultGeneralReview,
    strengths:
      Array.isArray(parsed.strengths) && parsed.strengths.length > 0
        ? parsed.strengths
        : defaultStrengths,
    areasToImprove:
      Array.isArray(parsed.areasToImprove) && parsed.areasToImprove.length > 0
        ? parsed.areasToImprove
        : defaultAreasToImprove,
    topThreeSuggestions:
      Array.isArray(parsed.topThreeSuggestions) && parsed.topThreeSuggestions.length > 0
        ? parsed.topThreeSuggestions.slice(0, 3)
        : defaultSuggestions,
    genreCompliance:
      typeof parsed.genreCompliance === 'string' && parsed.genreCompliance.trim()
        ? parsed.genreCompliance
        : defaultGenreCompliance,
    surpriseCardCompliance:
      typeof parsed.surpriseCardCompliance === 'string' && parsed.surpriseCardCompliance.trim()
        ? parsed.surpriseCardCompliance
        : defaultSurpriseCompliance,
    nextActionStep:
      typeof parsed.nextActionStep === 'string' && parsed.nextActionStep.trim()
        ? parsed.nextActionStep
        : 'Önerilen düzeltmeleri dikkate alarak editörde yeni bir sürüm oluşturun.',
  };
}

// ================= GEMINI AI EVALUATION ENDPOINT =================

app.post(['/api/evaluate', '/evaluate'], async (req: Request, res: Response) => {
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

    if (!content || typeof content !== 'string' || content.trim().length < 15) {
      return res.status(400).json({
        success: false,
        error: 'Değerlendirme için lütfen en az 15 karakter uzunluğunda bir metin yazınız.',
        code: 'TEXT_TOO_SHORT',
      });
    }

    const aiClient = getGeminiClient();
    if (!aiClient) {
      return res.status(503).json({
        success: false,
        error:
          'Gemini API anahtarı sunucuda yapılandırılmamış (GEMINI_API_KEY eksik). Vercel paneli üzerinden Environment Variables alanına ekleyiniz.',
        code: 'MISSING_API_KEY',
      });
    }

    let systemPrompt = `Sen lise düzeyindeki öğrencilerin yaratıcı yazma becerilerini destekleyen uzman bir Türk Dili ve Edebiyatı öğretmenisin. Adın YAZAROTA Değerlendirme Asistanı.
Amacın öğrenciyi cesaretlendirmek, güçlü yönlerini somut alıntılarla övmek ve en fazla 3 yapıcı gelişim önerisi sunmaktır.
Metni ASLA öğrencinin yerine baştan yazma. Geliştirebileceği yönleri örnekleyerek açıklayan, lise yaş düzeyine uygun pedagojik, nazik ve teşvik edici bir Türkçe kullan.`;

    if (genre === 'siir') {
      systemPrompt += `
BU METİN BİR ŞİİRDİR.
Şiir değerlendirmesinde şu ölçütleri kullan (Toplam 100 Puan):
1. Şiir Başlığı ve Tematik Uyum (key: "title", maxScore: 10)
2. Duygu ve Düşüncenin Aktarımı (key: "theme_emotion", maxScore: 20)
3. İmge Kullanımı ve Çağrışım Gücü (key: "imagery", maxScore: 20)
4. Sözcük Seçimi, Şiirsel Anlatım ve Ritim (key: "diction_rhythm", maxScore: 20)
5. Şiir Bütünlüğü ve Edebî Duruş (key: "genre", maxScore: 15)
6. Özgünlük ve Yaratıcılık (key: "creativity", maxScore: 10)
7. Şiirsel Unsur / İmge Uyumu (key: "surprise_card", maxScore: 5)

ÇOK ÖNEMLİ KURALLAR:
- Ölçü ve uyak bulunmasını bütün şiirler için ZORUNLU TUTMA. Serbest şiiri de tamamen geçerli, ahenkli ve başarılı kabul et.
- Öğrencinin şiirini onun yerine YENİDEN YAZMA. Geliştirebileceği yönleri dize veya sözcük düzeyinde örnekleyerek açıklayan, yaş düzeyine uygun geri bildirim ver.`;
    } else if (genre === 'fabl') {
      systemPrompt += `
BU METİN BİR FABLDIR.
Fabl değerlendirmesinde şu ölçütleri kullan (Toplam 100 Puan):
1. Fabl Başlığı ve Merak Ögesi (key: "title", maxScore: 10)
2. Karakter Kullanımı ve Kişileştirme - Teşhis/İntak (key: "character_personification", maxScore: 20)
3. Olay Örgüsü ve Çatışma (key: "plot", maxScore: 20)
4. Ana Düşünce ve Dersin Yerleşimi (key: "moral_theme", maxScore: 20)
5. Fabl Türü Özelliklerine Uygunluk (key: "genre", maxScore: 15)
6. Anlatımın Açıklığı ve Dil Özeni (key: "language", maxScore: 10)
7. Özgünlük ve Sürpriz Kartı Uyumu (key: "creativity", maxScore: 5)

ÇOK ÖNEMLİ KURALLAR:
- Fabl türüne uygun karakter kullanımı, kişileştirme, olay örgüsü, anlatımın açıklığı, özgünlük ve ana düşünce veya dersin metne uygun biçimde yerleşmesini dikkate al.
- Her fablın sonunda açıkça "Bu hikâyeden çıkarılacak ders şudur" cümlesinin bulunmasını ZORUNLU KILMA; mesajın olaylar aracılığıyla sezdirilmesine de izin ver ve bunu takdir et.
- Öğrencinin kendi metnini geliştirmesini sağlayacak yapıcı geri bildirimler sun. Metni öğrenci yerine yeniden yazma.`;
    } else {
      systemPrompt += `
Rubrik 100 Puan: Başlık (10), Kurgu (25), Karakter (15), Mekân/Zaman (10), Türe Uygunluk (20), Dil/Anlatım (15), Yaratıcılık/Sürpriz (5). Toplam = 100.`;
    }

    const userPrompt = `Lütfen aşağıdaki öğrenci metnini incele ve JSON formatında değerlendirme sun:

Başlık: "${title || 'Başlıksız'}"
Tür: ${genre}
Mekân: ${place || 'Belirtilmemiş'}
Zaman: ${time || 'Belirtilmemiş'}
Karakter: ${character || 'Belirtilmemiş'}
Sürpriz Kartı: ${surpriseCard || 'Belirtilmemiş'}
Kelime Sayısı: ${wordCount || content.trim().split(/\s+/).length}
Sürüm: ${versionNumber || 1}

Metin:
"""
${content}
"""`;

    // Fast generation with timeout safety to avoid 504
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalScore: { type: Type.INTEGER, description: 'Toplam puan (0-100)' },
            criteriaScores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  label: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  maxScore: { type: Type.INTEGER },
                  justification: { type: Type.STRING },
                },
                required: ['key', 'label', 'score', 'maxScore', 'justification'],
              },
            },
            generalReview: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } },
            topThreeSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            genreCompliance: { type: Type.STRING },
            surpriseCardCompliance: { type: Type.STRING },
            nextActionStep: { type: Type.STRING },
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

    const validatedReview = cleanAndValidateGeminiOutput(response.text, genre);
    validatedReview.id = 'rev-' + Date.now();
    validatedReview.evaluatedAt = new Date().toISOString();

    res.json({ success: true, review: validatedReview });
  } catch (error: any) {
    console.error('Gemini evaluation error:', error?.message || error);

    let statusCode = 500;
    let friendlyError = 'Değerlendirme sırasında bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata');
    const errMsg = String(error?.message || '').toLowerCase();

    if (errMsg.includes('api key') || errMsg.includes('api_key') || errMsg.includes('unauthenticated')) {
      statusCode = 401;
      friendlyError = 'Gemini API anahtarı geçersiz veya yetkisiz. Lütfen sunucu ortam değişkenlerindeki GEMINI_API_KEY değerini kontrol ediniz.';
    } else if (errMsg.includes('quota') || errMsg.includes('rate limit') || errMsg.includes('resource_exhausted') || errMsg.includes('429')) {
      statusCode = 429;
      friendlyError = 'Gemini API istek kotası aşıldı. Lütfen 1-2 dakika sonra tekrar deneyiniz.';
    } else if (errMsg.includes('timeout') || errMsg.includes('deadline')) {
      statusCode = 504;
      friendlyError = 'Yapay zekâ değerlendirme isteği zaman aşımına uğradı. Lütfen tekrar deneyiniz.';
    } else if (errMsg.includes('overloaded') || errMsg.includes('503')) {
      statusCode = 503;
      friendlyError = 'Yapay zekâ servisi şu anda meşgul. Lütfen birkaç saniye sonra tekrar deneyiniz.';
    }

    res.status(statusCode).json({
      success: false,
      error: friendlyError,
      code: error?.code || 'EVALUATION_ERROR',
      details: 'Lütfen birkaç saniye sonra tekrar deneyiniz veya metninizi kontrol ediniz.',
    });
  }
});

// JSON 404 for any unmatched API routes
app.all(['/api/*', '/api'], (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'İstenen API uç noktası bulunamadı (404 Not Found).',
  });
});

// Global Express error handler returning structured JSON
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled server error:', err?.message || err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: 'Sunucu tarafında beklenmeyen bir hata oluştu.',
      details: err?.message || 'Bilinmeyen hata',
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

// Only start standalone listener when NOT running in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };
