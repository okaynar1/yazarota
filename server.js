// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
var isVercel = Boolean(process.env.VERCEL);
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var SUPABASE_PROJECT_ID = "rxobuyiyiytiijggozyx";
var SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4b2J1eWl5aXl0aWlqZ2dvenl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjgzODgsImV4cCI6MjEwODg0NDM4OH0.7nO_76xN5lKLcLcR1z8jf3Eez6VoyhiuqgALCYKxyGs";
var supabaseClient = null;
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log(`\u{1F517} Supabase client initialized for project [${SUPABASE_PROJECT_ID}]`);
  }
} catch (e) {
  console.warn("Could not initialize Supabase client:", e);
}
var DATA_DIR = isVercel ? path.join("/tmp", "yazarota_data") : path.join(__dirname, "data");
var DB_FILE = path.join(DATA_DIR, "yazarota_db.json");
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create data dir synchronously:", e);
}
async function syncToSupabase(data) {
  if (!supabaseClient) return;
  try {
    const { error: stateErr } = await supabaseClient.from("app_state").upsert(
      {
        id: "default",
        state: data,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      { onConflict: "id" }
    );
    if (stateErr) {
      if (stateErr.code === "42P01" || stateErr.message.includes("relation") || stateErr.message.includes("schema cache")) {
        return;
      }
      console.warn("Supabase app_state sync notice:", stateErr.message);
    }
    if (Array.isArray(data.users) && data.users.length > 0) {
      const userRows = data.users.map((u) => ({
        id: u.id,
        username: u.username,
        password_hash: u.passwordHash,
        salt: u.salt,
        role: u.role,
        name: u.name,
        class_grade: u.classGrade || "5-A",
        pseudonym: u.pseudonym || null,
        must_change_password: Boolean(u.mustChangePassword),
        password_changed_at: u.passwordChangedAt || null,
        created_at: u.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      }));
      try {
        await supabaseClient.from("users").upsert(userRows, { onConflict: "id" });
      } catch (e) {
      }
    }
    if (Array.isArray(data.stories) && data.stories.length > 0) {
      const storyRows = data.stories.map((s) => ({
        id: s.id,
        student_code: s.studentCode || null,
        author_username: s.authorUsername || null,
        author_name: s.authorName || null,
        author_class: s.authorClass || null,
        title: s.title || "Ba\u015Fl\u0131ks\u0131z",
        genre: s.genre || "hikaye",
        place: s.place || null,
        time: s.time || null,
        character: s.character || null,
        surprise_card: s.surpriseCard || null,
        status: s.status || "draft",
        current_version_number: s.currentVersionNumber || 1,
        versions: s.versions || [],
        class_id: s.classId || null,
        task_id: s.taskId || null,
        test_type: s.testType || "standard",
        published_work_id: s.publishedWorkId || null,
        created_at: s.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: s.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
      }));
      try {
        await supabaseClient.from("stories").upsert(storyRows, { onConflict: "id" });
      } catch (e) {
      }
    }
    if (Array.isArray(data.publishedWorks) && data.publishedWorks.length > 0) {
      const pubRows = data.publishedWorks.map((w) => ({
        id: w.id,
        story_id: w.storyId || null,
        title: w.title,
        genre: w.genre,
        author_type: w.authorType || "pseudonym",
        author_display_name: w.authorDisplayName || "",
        student_username: w.studentUsername || null,
        teacher_editor_notes: w.teacherEditorNotes || null,
        issue_id: w.issueId || null,
        issue_number: w.issueNumber || 1,
        published_at: w.publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
        word_count: w.wordCount || 0,
        likes_count: w.likesCount || 0,
        place: w.place || null,
        time: w.time || null,
        character: w.character || null,
        surprise_card: w.surpriseCard || null,
        score: w.score || 0,
        content: w.content || ""
      }));
      try {
        await supabaseClient.from("published_works").upsert(pubRows, { onConflict: "id" });
      } catch (e) {
      }
    }
    if (Array.isArray(data.notifications) && data.notifications.length > 0) {
      const notifRows = data.notifications.slice(0, 50).map((n) => ({
        id: n.id,
        user_id: n.userId,
        user_role: n.userRole || "student",
        title: n.title,
        message: n.message,
        story_id: n.storyId || null,
        type: n.type || "info",
        read: Boolean(n.read),
        created_at: n.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      }));
      try {
        await supabaseClient.from("notifications").upsert(notifRows, { onConflict: "id" });
      } catch (e) {
      }
    }
  } catch (err) {
    console.warn("Supabase sync skipped:", err?.message || err);
  }
}
async function pullFromSupabase() {
  if (!supabaseClient) return false;
  try {
    const { data, error } = await supabaseClient.from("app_state").select("state, updated_at").eq("id", "default").maybeSingle();
    if (!error && data?.state) {
      const remoteState = data.state;
      ensureTeacherAccount(remoteState);
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(remoteState, null, 2), "utf-8");
        console.log(`\u26A1 YAZAROTA: Successfully synced state from Supabase Cloud (${data.updated_at})`);
        return true;
      } catch (writeErr) {
        console.warn("Could not persist Supabase state locally:", writeErr);
      }
    }
  } catch (err) {
  }
  return false;
}
var SECRET_KEY = process.env.JWT_SECRET || "yazarota-literary-platform-secret-2026";
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1e4, 64, "sha512").toString("hex");
}
function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}
function createToken(payload) {
  const fullPayload = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
    // 7 days
  };
  const str = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET_KEY).update(str).digest("base64url");
  return `${str}.${sig}`;
}
function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadStr, sig] = parts;
    const expectedSig = crypto.createHmac("sha256", SECRET_KEY).update(payloadStr).digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (err) {
    return null;
  }
}
function getUserFromReq(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    return verifyToken(token);
  }
  const queryToken = req.query.token;
  if (queryToken) {
    return verifyToken(queryToken);
  }
  return null;
}
var DEFAULT_RUBRIC_CRITERIA = [
  {
    id: "crit-1",
    key: "title",
    name: "1. Ba\u015Fl\u0131k ve \u0130\xE7erik Uygunlu\u011Fu",
    description: "Ba\u015Fl\u0131\u011F\u0131n metnin konusu, temas\u0131 ve merak \xF6gesiyle uyumu ve \xE7ekicili\u011Fi.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "Ba\u015Fl\u0131k metinle alakas\u0131z veya \xE7ok kli\u015Fe.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "Metne dair genel bir fikir veriyor fakat merak uyand\u0131rm\u0131yor.", score: 5 },
      { level: 3, label: "Yeterli", description: "Metinle uyumlu, dikkat \xE7ekici ve konuyu yans\u0131t\u0131yor.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "\xD6zg\xFCn, derin anlam katmanlar\u0131 olan ve okuru do\u011Frudan metne \xE7eken m\xFCkemmel ba\u015Fl\u0131k.", score: 10 }
    ]
  },
  {
    id: "crit-2",
    key: "plot",
    name: "2. Olay \xD6rg\xFCs\xFC ve Kurgusal Tutarl\u0131l\u0131k",
    description: "Serim, d\xFC\u011F\xFCm, \xE7\xF6z\xFCm dengesi; \xE7at\u0131\u015Fma, gerilim ve olay ak\u0131\u015F\u0131n\u0131n mant\u0131ksal s\xFCreklili\u011Fi.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "Olay ak\u0131\u015F\u0131 kopuk, mant\u0131k hatalar\u0131 var.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "Temel bir olay var fakat ge\xE7i\u015Fler zay\u0131f veya aceleye getirilmi\u015F.", score: 5 },
      { level: 3, label: "Yeterli", description: "Giri\u015F-geli\u015Fme-sonu\xE7 tutarl\u0131, merak \xF6gesi korunmu\u015F.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "S\xFCr\xFCkleyici, kurgusal doruk noktas\u0131 ustaca i\u015Flenmi\u015F, kusursuz ritim.", score: 10 }
    ]
  },
  {
    id: "crit-3",
    key: "character",
    name: "3. Karakter Derinli\u011Fi ve Psikolojisi",
    description: "Karakterin fiziksel, ruhsal \xF6zellikleri, motivasyonlar\u0131 ve i\xE7 \xE7at\u0131\u015Fmalar\u0131n\u0131n inand\u0131r\u0131c\u0131l\u0131\u011F\u0131.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "Karakter sadece bir isimden ibaret, duygusu yok.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "Temel bir vasf\u0131 belirtilmi\u015F ancak davran\u0131\u015F motivasyonu eksik.", score: 5 },
      { level: 3, label: "Yeterli", description: "Duygu ve d\xFC\u015F\xFCnceleri anla\u015F\u0131l\u0131r, eylemleriyle \xF6rt\xFC\u015F\xFCyor.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "Karakterin i\xE7 d\xFCnyas\u0131, \xE7eli\u015Fkileri ve d\xF6n\xFC\u015F\xFCm\xFC etkileyici bir derinlikle i\u015Flenmi\u015F.", score: 10 }
    ]
  },
  {
    id: "crit-4",
    key: "setting",
    name: "4. Mek\xE2n ve Zaman Betimlemeleri",
    description: "Mek\xE2n\u0131n ve zaman\u0131n duyusal ayr\u0131nt\u0131larla (ses, koku, \u0131\u015F\u0131k, doku) canland\u0131r\u0131lmas\u0131.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "Mek\xE2n veya zaman sadece kuru bir bilgi olarak verilmi\u015F.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "Basit g\xF6rsel betimlemeler var ancak atmosfer eksik.", score: 5 },
      { level: 3, label: "Yeterli", description: "Okur mek\xE2n\u0131 ve zaman\u0131 hissedebiliyor, duyusal detaylar mevcut.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "Mek\xE2n adeta ya\u015Fayan bir karakter gibi; atmosfer kurgunun ruhunu g\xFC\xE7lendiriyor.", score: 10 }
    ]
  },
  {
    id: "crit-5",
    key: "genre",
    name: "5. Edeb\xEE T\xFCr\xFCn \xD6zelliklerine Uygunluk",
    description: "Hik\xE2ye, masal, \u015Fiir, fabl, polisiye, bilim kurgu, an\u0131 veya g\xFCnl\xFC\u011F\xFCn yap\u0131sal kurallar\u0131na sadakat.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "Se\xE7ilen t\xFCr\xFCn temel nitelikleri g\xF6z ard\u0131 edilmi\u015F.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "T\xFCre dair baz\u0131 unsurlar var fakat ba\u015Fka t\xFCrlerle kar\u0131\u015Fm\u0131\u015F.", score: 5 },
      { level: 3, label: "Yeterli", description: "T\xFCre \xF6zg\xFC teknikler ve anlat\u0131m bi\xE7imleri do\u011Fru kullan\u0131lm\u0131\u015F.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "T\xFCr\xFCn t\xFCm geleneksel ve modern olanaklar\u0131 ustal\u0131kla harmanlanm\u0131\u015F.", score: 10 }
    ]
  },
  {
    id: "crit-6",
    key: "language",
    name: "6. Dil, Anlat\u0131m ve S\xF6z Varl\u0131\u011F\u0131 Zenginli\u011Fi",
    description: "Kelime hazinesinin zenginli\u011Fi, ak\u0131c\u0131l\u0131k, \xF6zg\xFCn metaforlar ve mecazlar\u0131n g\xFCc\xFC.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "Tekd\xFCze, s\u0131\u011F ve tekrara d\xFC\u015Fen bir s\xF6z da\u011Farc\u0131\u011F\u0131.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "Anlat\u0131m anla\u015F\u0131l\u0131r fakat kli\u015Fe ifadeler a\u011F\u0131rl\u0131kta.", score: 5 },
      { level: 3, label: "Yeterli", description: "Zengin kelimeler, ak\u0131c\u0131 c\xFCmle yap\u0131lar\u0131 ve edeb\xEE bir lezzet.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "\xD6zg\xFCn imgeler, \u015Fiirsel ve etkileyici bir \xFCslup, zengin s\xF6z varl\u0131\u011F\u0131.", score: 10 }
    ]
  },
  {
    id: "crit-7",
    key: "mechanics",
    name: "7. Yaz\u0131m ve Noktalama Kurallar\u0131na Uygunluk",
    description: "TDK yaz\u0131m kurallar\u0131na, noktalama i\u015Faretlerinin i\u015Flevsel ve do\u011Fru kullan\u0131m\u0131na uyum.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "\xC7ok say\u0131da temel yaz\u0131m ve noktalama hatas\u0131 var.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "Baz\u0131 noktalama eksikleri ve yaz\u0131m hatalar\u0131 mevcut.", score: 5 },
      { level: 3, label: "Yeterli", description: "B\xFCy\xFCk \xF6l\xE7\xFCde hatas\u0131z, noktalama metnin ritmini destekliyor.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "Kusursuz yaz\u0131m, noktalama i\u015Faretleri anlat\u0131m\u0131n temposunu m\xFCkemmel y\xF6netiyor.", score: 10 }
    ]
  },
  {
    id: "crit-8",
    key: "creativity",
    name: "8. \xD6zg\xFCnl\xFCk ve Yarat\u0131c\u0131 \xC7\xF6z\xFCmler",
    description: "Kal\u0131pla\u015Fm\u0131\u015F kli\u015Felerin d\u0131\u015F\u0131na \xE7\u0131kabilme, benzersiz kurgusal bulu\u015Flar ve \xF6zg\xFCn bak\u0131\u015F a\xE7\u0131s\u0131.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "Tamamen bilindik ve \xF6ng\xF6r\xFClebilir kurgu.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "Klasik temalar \xFCzerinde k\xFC\xE7\xFCk yarat\u0131c\u0131 dokunu\u015Flar var.", score: 5 },
      { level: 3, label: "Yeterli", description: "Beklenmedik ayr\u0131nt\u0131lar, \xF6zg\xFCn bir anlat\u0131m perspektifi.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "B\xFCy\xFCleyici \xF6zg\xFCnl\xFCk, s\u0131ra d\u0131\u015F\u0131 bir kurgu zek\xE2s\u0131 ve unutulmaz bir yakla\u015F\u0131m.", score: 10 }
    ]
  },
  {
    id: "crit-9",
    key: "surprise_card",
    name: "9. S\xFCrpriz Kart\u0131n\u0131n Do\u011Fal Entegrasyonu",
    description: "Rastgele gelen s\xFCrpriz kart\u0131n\u0131n hik\xE2yeye yapay durmadan, ana \xE7at\u0131\u015Fmaya hizmet edecek \u015Fekilde kayna\u015Fmas\u0131.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "S\xFCrpriz kart\u0131 kullan\u0131lmam\u0131\u015F veya metne tamamen yama gibi durmu\u015F.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "Metinde yer al\u0131yor fakat kurgusal d\xF6n\xFCm noktas\u0131na katk\u0131s\u0131 zay\u0131f.", score: 5 },
      { level: 3, label: "Yeterli", description: "Olay \xF6rg\xFCs\xFCyle organik ba\u011F kurulmu\u015F, k\u0131r\u0131lma an\u0131 yaratm\u0131\u015F.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "S\xFCrpriz kart\u0131 hik\xE2yenin can damar\u0131na d\xF6n\xFC\u015Fm\xFC\u015F; kurgu bu unsurla zirveye ula\u015Fm\u0131\u015F.", score: 10 }
    ]
  },
  {
    id: "crit-10",
    key: "theme_depth",
    name: "10. Duygu, D\xFC\u015F\xFCnce ve \u0130leti Derinli\u011Fi",
    description: "Metnin okurda b\u0131rakt\u0131\u011F\u0131 felsefi, insani veya duygusal iz; ana fikrin okura hissettirili\u015Fi.",
    maxScore: 10,
    levels: [
      { level: 1, label: "Geli\u015Ftirilmeli", description: "Y\xFCzeysel, okurda herhangi bir iz veya duygu b\u0131rakm\u0131yor.", score: 2.5 },
      { level: 2, label: "K\u0131smen Yeterli", description: "Temel bir mesaj var fakat didaktik veya s\u0131\u011F aktar\u0131lm\u0131\u015F.", score: 5 },
      { level: 3, label: "Yeterli", description: "Okurda empati uyand\u0131r\u0131yor, samimi bir duygu aktar\u0131m\u0131 var.", score: 7.5 },
      { level: 4, label: "\xC7ok \u0130yi", description: "Evrensel insanl\u0131k durumlar\u0131na temas eden derin, etkileyici ve kal\u0131c\u0131 bir duygu iklimi.", score: 10 }
    ]
  }
];
var INITIAL_TEACHER_USERNAME = "ogretmen";
var INITIAL_TEACHER_PASSWORD = process.env.INITIAL_TEACHER_PASSWORD || "123456";
var teacherSalt = generateSalt();
var teacherHashed = hashPassword(INITIAL_TEACHER_PASSWORD, teacherSalt);
var studentSalt = generateSalt();
var studentHashed = hashPassword("1234", studentSalt);
var DEFAULT_DB = {
  users: [
    {
      id: "user-teacher-1",
      username: "ogretmen",
      passwordHash: teacherHashed,
      salt: teacherSalt,
      role: "teacher",
      name: "T\xFCrk Dili ve Edebiyat\u0131 Z\xFCmresi",
      classGrade: "T\xFCm \u015Eubeler",
      mustChangePassword: true,
      // Security requirement: must change on first login
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "user-student-1",
      username: "ogrenci1",
      passwordHash: studentHashed,
      salt: studentSalt,
      role: "student",
      name: "Elif Sena Y\u0131ld\u0131z",
      classGrade: "10-A",
      pseudonym: "Kelimelerin \u0130zi",
      mustChangePassword: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "user-student-2",
      username: "ogrenci2",
      passwordHash: studentHashed,
      salt: studentSalt,
      role: "student",
      name: "Can Berk Demir",
      classGrade: "11-B",
      pseudonym: "Mavi Mart\u0131",
      mustChangePassword: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
  magazineIssues: [
    {
      id: "issue-1",
      issueNumber: 1,
      title: "Gen\xE7 Kalemler \u2014 Say\u0131 1: Peronlar ve D\xFC\u015Fler",
      theme: "Yolculuk, Hat\u0131ra ve Zaman\u0131n K\u0131r\u0131lma Noktalar\u0131",
      editorNote: "Sevgili okurlar, YAZAROTA yazma at\xF6lyelerinde filizlenen ve \xF6\u011Fretmen geri bildirimleriyle olgunla\u015Fan ilk gen\xE7 edeb\xEE \xFCr\xFCnlerimizi gururla sunuyoruz. Her hik\xE2ye, rastgele kartlar\u0131n cesur bir zihinle nas\u0131l sanata d\xF6n\xFC\u015Ft\xFC\u011F\xFCn\xFCn canl\u0131 bir kan\u0131t\u0131d\u0131r.",
      coverColor: "from-teal-800 to-slate-900",
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
      workIds: ["pub-work-1", "pub-work-2"],
      isCurrent: true
    }
  ],
  publishedWorks: [
    {
      id: "pub-work-1",
      storyId: "demo-story-1",
      title: "Perondaki Sar\u0131 Mektup",
      genre: "hikaye",
      authorType: "pseudonym",
      authorDisplayName: "Mavi Mart\u0131",
      studentUsername: "ogrenci2",
      teacherEditorNotes: "Atmosfer kurmadaki olgunluk ve mektup \xFCzerindeki ithaf hik\xE2yeye benzersiz bir derinlik kazand\u0131rm\u0131\u015F. Yay\u0131n kurulu taraf\u0131ndan oy birli\u011Fiyle se\xE7ilmi\u015Ftir.",
      issueId: "issue-1",
      issueNumber: 1,
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3).toISOString(),
      wordCount: 89,
      likesCount: 24,
      place: "Terk edilmi\u015F ve sarma\u015F\u0131klarla kaplanm\u0131\u015F bir tren istasyonu",
      time: "Gece yar\u0131s\u0131 saat tam 03.17\u2019de",
      character: "Emekli edebiyat \xF6\u011Fretmeni Selim Bey",
      surpriseCard: "Balmumu m\xFCh\xFCrl\xFC imzas\u0131z sar\u0131 mektup",
      score: 94,
      content: 'Pasl\u0131 raylar\u0131n aras\u0131na dolan sarma\u015F\u0131klar, gece yar\u0131s\u0131 esen serin g\xFCz r\xFCzgar\u0131yla f\u0131s\u0131ld\u0131yordu. Saat kulesinin k\u0131r\u0131k kadran\u0131 tam 03.17\u2019de donup kalm\u0131\u015Ft\u0131. Emekli edebiyat \xF6\u011Fretmeni Selim Bey, yakas\u0131n\u0131 kald\u0131r\u0131p elindeki titrek feneri eski bekleme salonuna do\u011Frulttu. Otuz y\u0131l \xF6nce bu perondan el sallay\u0131p bir daha haber alamad\u0131\u011F\u0131 en parlak \xF6\u011Frencisi Cemil\u2019in hat\u0131ras\u0131 g\xF6\u011Fs\xFCnde ince bir s\u0131z\u0131yd\u0131. Tam o s\u0131rada, peron bank\u0131n\u0131n \xE7atlak tahtas\u0131na s\u0131k\u0131\u015Ft\u0131r\u0131lm\u0131\u015F, k\u0131rm\u0131z\u0131 balmumuyla m\xFCh\xFCrlenmi\u015F sar\u0131 bir zarf \xE7arpt\u0131 g\xF6z\xFCne. Zarf\u0131n \xFCzerinde silinmeye y\xFCz tutmu\u015F bir m\xFCrekkeple sadece \u015Fu yaz\u0131yordu: "Ge\xE7 kalm\u0131\u015F bir \xF6z\xFCr, hocama..." Zarf\u0131 a\xE7t\u0131\u011F\u0131nda i\xE7inden \xE7\u0131kan sararm\u0131\u015F kurutulmu\u015F akasya yapra\u011F\u0131, ge\xE7mi\u015Fin t\xFCm karanl\u0131\u011F\u0131n\u0131 bir anda ayd\u0131nlatt\u0131.'
    },
    {
      id: "pub-work-2",
      storyId: "demo-story-2",
      title: "Zaman\u0131n K\u0131r\u0131k Aynas\u0131",
      genre: "bilim_kurgu",
      authorType: "real_name",
      authorDisplayName: "Elif Sena Y\u0131ld\u0131z",
      studentUsername: "ogrenci1",
      teacherEditorNotes: "Bilim kurgu t\xFCr\xFCn\xFCn mant\u0131\u011F\u0131n\u0131 felsefi bir haf\u0131za sorgulamas\u0131yla harmanlayan \xE7ok ba\u015Far\u0131l\u0131 bir gen\xE7lik eseri.",
      issueId: "issue-1",
      issueNumber: 1,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
      wordCount: 142,
      likesCount: 38,
      place: "Yerin \xFC\xE7 kat alt\u0131ndaki tozlu ar\u015Fiv odas\u0131",
      time: "G\xFCne\u015F tutulmas\u0131n\u0131n tam ortas\u0131nda",
      character: "Yaln\u0131zca eski kitaplar\u0131 onaran \xE7\u0131rak Kerem",
      surpriseCard: "Cebinde titre\u015Fmeye ba\u015Flayan antika g\xFCm\xFC\u015F pusula",
      score: 96,
      content: 'G\xFCne\u015Fin yerini kapkara bir halkaya b\u0131rakt\u0131\u011F\u0131 o e\u015Fsiz dakikada, ar\u015Fiv odas\u0131n\u0131n rutubetli sessizli\u011Fi bozuldu. Kerem, 19. y\xFCzy\u0131ldan kalma bir cilt kapa\u011F\u0131n\u0131 onar\u0131rken g\xF6\u011F\xFCs cebindeki antika g\xFCm\xFC\u015F pusula birdenbire deli gibi d\xF6nmeye ba\u015Flad\u0131. Pusulan\u0131n ibresi kuzeyi de\u011Fil, masan\u0131n \xFCzerindeki k\u0131r\u0131k pirin\xE7 aynay\u0131 g\xF6steriyordu. Aynaya bakt\u0131\u011F\u0131nda kendi yans\u0131mas\u0131n\u0131 de\u011Fil, tam k\u0131rk y\u0131l sonraki h\xE2lini g\xF6rd\xFC; ya\u015Fl\u0131 Kerem ona bir sayfa numaras\u0131 f\u0131s\u0131ld\u0131yordu: "Sayfa 73... Ger\xE7e\u011Fi orada bulacaks\u0131n." Titreyen elleriyle cildi a\xE7t\u0131; sayfan\u0131n aras\u0131nda kendi el yaz\u0131s\u0131yla yaz\u0131lm\u0131\u015F yar\u0131n\u0131n tarihi duruyordu.'
    }
  ],
  notifications: [
    {
      id: "notif-1",
      userId: "ogrenci2",
      userRole: "student",
      title: "Eseriniz Gen\xE7 Kalemler Dergisi\u2019nde!",
      message: "\u201CPerondaki Sar\u0131 Mektup\u201D adl\u0131 hik\xE2yeniz \xF6\u011Fretmeniniz taraf\u0131ndan incelenip onayland\u0131 ve Say\u0131 1\u2019de yay\u0131mland\u0131.",
      storyId: "demo-story-1",
      type: "magazine",
      read: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3).toISOString()
    },
    {
      id: "notif-2",
      userId: "all_teachers",
      userRole: "teacher",
      title: "Yeni Yaz\u0131 G\xF6nderildi",
      message: "Elif Sena Y\u0131ld\u0131z (10-A), \u201CZaman\u0131n K\u0131r\u0131k Aynas\u0131\u201D ba\u015Fl\u0131kl\u0131 yaz\u0131s\u0131n\u0131 incelemeniz i\xE7in g\xF6nderdi.",
      storyId: "demo-story-2",
      type: "submission",
      read: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString()
    }
  ],
  stories: [
    {
      id: "demo-story-1",
      studentCode: "OGR-4281",
      authorUsername: "ogrenci2",
      authorName: "Can Berk Demir",
      title: "Perondaki Sar\u0131 Mektup",
      genre: "hikaye",
      place: "Terk edilmi\u015F ve sarma\u015F\u0131klarla kaplanm\u0131\u015F bir tren istasyonu",
      time: "Gece yar\u0131s\u0131 saat tam 03.17\u2019de, herkesin derin uykuda oldu\u011Fu bir anda",
      character: "Ge\xE7mi\u015Findeki b\xFCy\xFCk kayb\u0131 hakk\u0131nda asla konu\u015Fmayan emekli bir edebiyat \xF6\u011Fretmeni",
      surpriseCard: "Karakter beklenmedik, imzas\u0131z ve \xFCzerinde eski bir balmumu m\xFCh\xFCr olan bir mektup al\u0131r.",
      status: "published",
      publishedWorkId: "pub-work-1",
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1e3).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3).toISOString(),
      currentVersionNumber: 2,
      classId: "class-9a",
      taskId: "task-1",
      testType: "standard",
      versions: [
        {
          id: "v1-demo",
          versionNumber: 1,
          title: "Perondaki Sar\u0131 Mektup (\u0130lk Taslak)",
          content: "Eski tren istasyonu \xE7ok karanl\u0131kt\u0131. Saat gecenin \xFC\xE7\xFCyd\xFC. Emekli \xF6\u011Fretmen Selim Bey elinde feneriyle y\xFCr\xFCyordu. Y\u0131llar \xF6nce buradan ayr\u0131lan \xF6\u011Frencisini d\xFC\u015F\xFCn\xFCyordu. Duvarda sarma\u015F\u0131klar\u0131n aras\u0131nda bir mektup g\xF6rd\xFC. Mektubun \xFCzerinde m\xFCh\xFCr vard\u0131. Mektubu a\xE7t\u0131 ve okumaya ba\u015Flad\u0131. \u0130\xE7inde \xE7ok \xF6nemli bir itiraf vard\u0131.",
          wordCount: 46,
          characterCount: 304,
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1e3).toISOString(),
          studentNotes: "\u0130lk taslak, olaylar\u0131 genel hatlar\u0131yla kurdum.",
          review: {
            id: "rev-v1",
            evaluatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1e3).toISOString(),
            totalScore: 71,
            criteriaScores: [
              { key: "title", label: "Ba\u015Fl\u0131\u011F\u0131n Metne Uygunlu\u011Fu", score: 8, maxScore: 10, justification: "Ba\u015Fl\u0131k mektup temas\u0131yla \xF6rt\xFC\u015F\xFCyor ancak merak unsuru daha da art\u0131r\u0131labilir." },
              { key: "plot", label: "Olay \xD6rg\xFCs\xFC ve Kurgu", score: 17, maxScore: 25, justification: "Olay ak\u0131\u015F\u0131 var fakat \xE7ok h\u0131zl\u0131 ge\xE7ilmi\u015F; serim ve d\xFC\u011F\xFCm k\u0131s\u0131mlar\u0131 geni\u015Fletilmeli." },
              { key: "character", label: "Karakterlerin \u0130\u015Fleni\u015Fi", score: 11, maxScore: 15, justification: "Selim Bey'in i\xE7 d\xFCnyas\u0131 ve ge\xE7mi\u015F kayb\u0131 biraz daha hissettirilmeli." },
              { key: "setting", label: "Mek\xE2n ve Zaman Kullan\u0131m\u0131", score: 7, maxScore: 10, justification: "Terk edilmi\u015F istasyonun duyusal detaylar\u0131 (r\xFCzgar, sarma\u015F\u0131k kokusu, ray pas\u0131) eklenebilir." },
              { key: "genre", label: "Se\xE7ilen Edeb\xEE T\xFCre Uygunluk", score: 15, maxScore: 20, justification: "Hik\xE2ye bi\xE7imine uygun, durum ve olay dengesi kurulabilir." },
              { key: "language", label: "Dil ve Anlat\u0131m", score: 10, maxScore: 15, justification: "K\u0131sa ve tekd\xFCze c\xFCmleler yerine betimleyici ve zengin ifadeler kullan\u0131labilir." },
              { key: "creativity", label: "\xD6zg\xFCnl\xFCk ve Yarat\u0131c\u0131l\u0131k", score: 3, maxScore: 5, justification: "M\xFCh\xFCrl\xFC mektubun i\xE7eri\u011Fi merak uyand\u0131r\u0131yor." }
            ],
            generalReview: "Sevgili yazar aday\u0131, hik\xE2yenin temel \xE7at\u0131s\u0131 ve gizem duygusu \xE7ok umut vadediyor! Emekli bir \xF6\u011Fretmenin gece yar\u0131s\u0131 terk edilmi\u015F peronda mektupla kar\u015F\u0131la\u015Fmas\u0131 merak uyand\u0131r\u0131c\u0131. Metnini duyularla ve detaylarla zenginle\u015Ftirerek bir \xFCst seviyeye ta\u015F\u0131yabilirsin.",
            strengths: ["Gece yar\u0131s\u0131 03.17 atmosferi ile m\xFCh\xFCrl\xFC mektup merak \xF6gesini ba\u015Far\u0131yla tetikliyor."],
            areasToImprove: ["C\xFCmleler \xE7ok k\u0131sa ve pe\u015F pe\u015Fe s\u0131ralanm\u0131\u015F; betimlemeler geni\u015Fletilmeli."],
            topThreeSuggestions: ["\u0130stasyonun terk edilmi\u015Fli\u011Fini duyusal detaylarla betimle.", "Selim Bey'in i\xE7 h\xFCzn\xFCn\xFC hissettir."],
            genreCompliance: "Hik\xE2ye t\xFCr\xFCn\xFCn olay odakl\u0131 yap\u0131s\u0131na uygun.",
            surpriseCardCompliance: "\u0130mzas\u0131z m\xFCh\xFCrl\xFC mektup s\xFCrpriz kart\u0131 hik\xE2yeye d\xE2hil edilmi\u015F.",
            nextActionStep: "Metne Selim Bey'in hislerini anlatan 2-3 betimleyici c\xFCmle ekle."
          },
          teacherFeedback: {
            id: "tf-1",
            teacherId: "user-teacher-1",
            teacherName: "T\xFCrk Dili ve Edebiyat\u0131 Z\xFCmresi",
            decision: "revision_requested",
            decisionLabel: "D\xFCzeltme \u0130stendi",
            generalComment: "Tebrikler Can Berk, atmosfer ba\u015Flang\u0131c\u0131 g\xFCzel fakat Selim Bey'in duygular\u0131 ve mek\xE2n tasviri derinle\u015Ftirilmeli. \xD6nerilen d\xFCzeltmeleri yap\u0131p yeni s\xFCr\xFCm\xFC g\xF6nder.",
            revisionChecklist: [
              "\u0130stasyonun pasl\u0131 raylar\u0131n\u0131 ve r\xFCzgar\u0131 betimle",
              "Selim Bey'in eski \xF6\u011Frencisine duydu\u011Fu \xF6zlemi hissettir",
              "Mektup \xFCzerindeki yaz\u0131y\u0131 do\u011Frudan t\u0131rnak i\xE7inde ver"
            ],
            rubricScores: {
              "crit-1": 8,
              "crit-2": 7,
              "crit-3": 7,
              "crit-4": 6,
              "crit-5": 8,
              "crit-6": 7,
              "crit-7": 8,
              "crit-8": 7,
              "crit-9": 8,
              "crit-10": 7
            },
            rubricTotal: 73,
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString()
          }
        },
        {
          id: "v2-demo",
          versionNumber: 2,
          title: "Perondaki Sar\u0131 Mektup",
          content: 'Pasl\u0131 raylar\u0131n aras\u0131na dolan sarma\u015F\u0131klar, gece yar\u0131s\u0131 esen serin g\xFCz r\xFCzgar\u0131yla f\u0131s\u0131ld\u0131yordu. Saat kulesinin k\u0131r\u0131k kadran\u0131 tam 03.17\u2019de donup kalm\u0131\u015Ft\u0131. Emekli edebiyat \xF6\u011Fretmeni Selim Bey, yakas\u0131n\u0131 kald\u0131r\u0131p elindeki titrek feneri eski bekleme salonuna do\u011Frulttu. Otuz y\u0131l \xF6nce bu perondan el sallay\u0131p bir daha haber alamad\u0131\u011F\u0131 en parlak \xF6\u011Frencisi Cemil\u2019in hat\u0131ras\u0131 g\xF6\u011Fs\xFCnde ince bir s\u0131z\u0131yd\u0131. Tam o s\u0131rada, peron bank\u0131n\u0131n \xE7atlak tahtas\u0131na s\u0131k\u0131\u015Ft\u0131r\u0131lm\u0131\u015F, k\u0131rm\u0131z\u0131 balmumuyla m\xFCh\xFCrlenmi\u015F sar\u0131 bir zarf \xE7arpt\u0131 g\xF6z\xFCne. Zarf\u0131n \xFCzerinde silinmeye y\xFCz tutmu\u015F bir m\xFCrekkeple sadece \u015Fu yaz\u0131yordu: "Ge\xE7 kalm\u0131\u015F bir \xF6z\xFCr, hocama..." Zarf\u0131 a\xE7t\u0131\u011F\u0131nda i\xE7inden \xE7\u0131kan sararm\u0131\u015F kurutulmu\u015F akasya yapra\u011F\u0131, ge\xE7mi\u015Fin t\xFCm karanl\u0131\u011F\u0131n\u0131 bir anda ayd\u0131nlatt\u0131.',
          wordCount: 89,
          characterCount: 597,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3).toISOString(),
          studentNotes: "\xD6\u011Fretmenimin istedi\u011Fi d\xFCzeltmeleri yapt\u0131m; raylar\u0131n pas\u0131, r\xFCzgar ve Selim Bey'in \xF6\u011Frencisiyle olan ba\u011F\u0131 eklendi.",
          review: {
            id: "rev-v2",
            evaluatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3).toISOString(),
            totalScore: 92,
            criteriaScores: [
              { key: "title", label: "Ba\u015Fl\u0131\u011F\u0131n Metne Uygunlu\u011Fu", score: 10, maxScore: 10, justification: "Ba\u015Fl\u0131k ile sar\u0131 zarf ve mektubun temas\u0131 kusursuz uyu\u015Fuyor." },
              { key: "plot", label: "Olay \xD6rg\xFCs\xFC ve Kurgu", score: 23, maxScore: 25, justification: "Olay \xF6rg\xFCs\xFC merak \xF6gesiyle dengeli ve s\xFCr\xFCkleyici bir ritim kazanm\u0131\u015F." },
              { key: "character", label: "Karakterlerin \u0130\u015Fleni\u015Fi", score: 14, maxScore: 15, justification: "Selim Bey'in \xF6\u011Frencisine duydu\u011Fu \xF6zlem ve i\xE7 s\u0131z\u0131s\u0131 \xE7ok etkileyici verilmi\u015F." },
              { key: "setting", label: "Mek\xE2n ve Zaman Kullan\u0131m\u0131", score: 10, maxScore: 10, justification: "Pasl\u0131 raylar, sarma\u015F\u0131klar\u0131n f\u0131s\u0131lt\u0131s\u0131 ve donmu\u015F saat kulesi harika atmosfer yaratm\u0131\u015F." },
              { key: "genre", label: "Se\xE7ilen Edeb\xEE T\xFCre Uygunluk", score: 18, maxScore: 20, justification: "Hik\xE2ye t\xFCr\xFCn\xFCn durum ve duygu yo\u011Funlu\u011Funu ba\u015Far\u0131yla yans\u0131t\u0131yor." },
              { key: "language", label: "Dil ve Anlat\u0131m", score: 14, maxScore: 15, justification: "Dili zengin, kelime tercihleri \xE7ok yerinde, anlat\u0131m ak\u0131c\u0131." },
              { key: "creativity", label: "\xD6zg\xFCnl\xFCk ve Yarat\u0131c\u0131l\u0131k", score: 3, maxScore: 5, justification: "Mektubun \xFCzerindeki ithaf hik\xE2yeye \xE7ok \xF6zg\xFCn bir duygu derinli\u011Fi katm\u0131\u015F." }
            ],
            generalReview: "Harika bir geli\u015Fim \xF6rne\u011Fi! \u0130lk taslaktaki kuru anlat\u0131m gitmi\u015F, yerine edeb\xEE lezzeti y\xFCksek, atmosferi solunabilen etkileyici bir hik\xE2ye gelmi\u015F.",
            strengths: ["Atmosfer tasviri ve sar\u0131 mektup gizemi m\xFCkemmel kayna\u015Fm\u0131\u015F."],
            areasToImprove: ["Son c\xFCmleden sonraki duygusal yank\u0131 sonraki hik\xE2yelerde daha da zenginle\u015Ftirilebilir."],
            topThreeSuggestions: ["Bir sonraki hik\xE2yede diyalo\u011Fu da devreye sokmay\u0131 dene."],
            genreCompliance: "Hik\xE2ye t\xFCr\xFCn\xFCn serim ve d\xFC\u011F\xFCm a\u015Famalar\u0131 olgun bir dille in\u015Fa edilmi\u015F.",
            surpriseCardCompliance: "S\xFCrpriz kart\u0131 hik\xE2yenin merkezine kusursuz bir k\xF6pr\xFCyle yerle\u015Ftirilmi\u015F.",
            nextActionStep: "Metnin yay\u0131na haz\u0131r h\xE2lini kutla!"
          },
          teacherFeedback: {
            id: "tf-2",
            teacherId: "user-teacher-1",
            teacherName: "T\xFCrk Dili ve Edebiyat\u0131 Z\xFCmresi",
            decision: "published",
            decisionLabel: "Yay\u0131na Haz\u0131r & Gen\xE7 Kalemler \u0130\xE7in Se\xE7ildi",
            generalComment: "Harika bir revizyon! \xD6\u011Frencinin tavsiyeleri bu kadar duyarl\u0131 uygulamas\u0131 bizi \xE7ok mutlu etti. Gen\xE7 Kalemler Dergisi Say\u0131 1 i\xE7in yay\u0131na al\u0131nd\u0131.",
            revisionChecklist: ["T\xFCm d\xFCzeltmeler eksiksiz tamamland\u0131."],
            rubricScores: {
              "crit-1": 10,
              "crit-2": 9,
              "crit-3": 9,
              "crit-4": 10,
              "crit-5": 9,
              "crit-6": 9,
              "crit-7": 10,
              "crit-8": 9,
              "crit-9": 9,
              "crit-10": 9
            },
            rubricTotal: 94,
            submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3).toISOString()
          }
        }
      ]
    },
    {
      id: "demo-story-2",
      studentCode: "OGR-5192",
      authorUsername: "ogrenci1",
      authorName: "Elif Sena Y\u0131ld\u0131z",
      title: "Zaman\u0131n K\u0131r\u0131k Aynas\u0131",
      genre: "bilim_kurgu",
      place: "Yerin \xFC\xE7 kat alt\u0131ndaki tozlu ar\u015Fiv odas\u0131",
      time: "G\xFCne\u015F tutulmas\u0131n\u0131n tam ortas\u0131nda",
      character: "Yaln\u0131zca eski kitaplar\u0131 onaran \xE7\u0131rak Kerem",
      surpriseCard: "Cebinde titre\u015Fmeye ba\u015Flayan antika g\xFCm\xFC\u015F pusula",
      status: "published",
      publishedWorkId: "pub-work-2",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
      currentVersionNumber: 1,
      classId: "class-9a",
      taskId: "task-2",
      testType: "standard",
      versions: [
        {
          id: "v1-demo2",
          versionNumber: 1,
          title: "Zaman\u0131n K\u0131r\u0131k Aynas\u0131",
          content: 'G\xFCne\u015Fin yerini kapkara bir halkaya b\u0131rakt\u0131\u011F\u0131 o e\u015Fsiz dakikada, ar\u015Fiv odas\u0131n\u0131n rutubetli sessizli\u011Fi bozuldu. Kerem, 19. y\xFCzy\u0131ldan kalma bir cilt kapa\u011F\u0131n\u0131 onar\u0131rken g\xF6\u011F\xFCs cebindeki antika g\xFCm\xFC\u015F pusula birdenbire deli gibi d\xF6nmeye ba\u015Flad\u0131. Pusulan\u0131n ibresi kuzeyi de\u011Fil, masan\u0131n \xFCzerindeki k\u0131r\u0131k pirin\xE7 aynay\u0131 g\xF6steriyordu. Aynaya bakt\u0131\u011F\u0131nda kendi yans\u0131mas\u0131n\u0131 de\u011Fil, tam k\u0131rk y\u0131l sonraki h\xE2lini g\xF6rd\xFC; ya\u015Fl\u0131 Kerem ona bir sayfa numaras\u0131 f\u0131s\u0131ld\u0131yordu: "Sayfa 73... Ger\xE7e\u011Fi orada bulacaks\u0131n." Titreyen elleriyle cildi a\xE7t\u0131; sayfan\u0131n aras\u0131nda kendi el yaz\u0131s\u0131yla yaz\u0131lm\u0131\u015F yar\u0131n\u0131n tarihi duruyordu.',
          wordCount: 142,
          characterCount: 890,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3).toISOString(),
          studentNotes: "Bilim kurgu ve zaman paradoksu \xFCzerine ilk denemem.",
          teacherFeedback: {
            id: "tf-3",
            teacherId: "user-teacher-1",
            teacherName: "T\xFCrk Dili ve Edebiyat\u0131 Z\xFCmresi",
            decision: "published",
            decisionLabel: "Yay\u0131na Haz\u0131r & Gen\xE7 Kalemler \u0130\xE7in Se\xE7ildi",
            generalComment: "Tebrikler Elif Sena, ak\u0131c\u0131 ve kurgusu \xE7ok sa\u011Flam bir bilim kurgu anlat\u0131s\u0131. Dergimizde zevkle yay\u0131ml\u0131yoruz.",
            revisionChecklist: ["Yaz\u0131m ve kurgu m\xFCkemmel seviyede."],
            rubricScores: {
              "crit-1": 10,
              "crit-2": 10,
              "crit-3": 9,
              "crit-4": 9,
              "crit-5": 10,
              "crit-6": 9,
              "crit-7": 10,
              "crit-8": 10,
              "crit-9": 9,
              "crit-10": 10
            },
            rubricTotal: 96,
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString()
          }
        }
      ]
    }
  ],
  classes: [
    {
      id: "class-9a",
      name: "9-A Edebiyat Grubu",
      grade: "9. S\u0131n\u0131f",
      studentCodes: ["OGR-4281", "OGR-5192", "OGR-3349", "OGR-8812", "OGR-1904"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "class-10b",
      name: "10-B Yarat\u0131c\u0131 Yazarl\u0131k At\xF6lyesi",
      grade: "10. S\u0131n\u0131f",
      studentCodes: ["OGR-7023", "OGR-6115", "OGR-9441", "OGR-2230"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  tasks: [
    {
      id: "task-1",
      title: "T\xDCB\u0130TAK 2204-A: \xD6n Test \u2014 Mek\xE2n ve Karakter Odakl\u0131 Hik\xE2ye",
      classId: "class-9a",
      description: "Rastgele olu\u015Fturulan mek\xE2n, karakter ve s\xFCrpriz kart\u0131n\u0131 kullanarak 150-500 kelimelik bir hik\xE2ye kurgulay\u0131n\u0131z.",
      targetGenre: "hikaye",
      minWords: 150,
      maxWords: 500,
      requireSurpriseCard: true,
      taskType: "pre_test",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString()
    },
    {
      id: "task-2",
      title: "T\xDCB\u0130TAK 2204-A: Son Test \u2014 S\xFCrpriz D\xF6n\xFC\u015Fl\xFC Edeb\xEE Metin",
      classId: "class-9a",
      description: "YAZAROTA rehberlerinden ve AI geri bildirimlerinden faydalanarak kurgulanacak nihai \xF6l\xE7\xFCm yaz\u0131s\u0131.",
      targetGenre: "all",
      minWords: 200,
      maxWords: 600,
      requireSurpriseCard: true,
      taskType: "post_test",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3).toISOString()
    }
  ],
  researchSettings: {
    rubricMax: 100,
    parentConsentRequired: true,
    anonymousOnly: true,
    activeCohort: "2026-Bahar Lise Ara\u015Ft\u0131rmas\u0131"
  }
};
function ensureTeacherAccount(db) {
  if (!Array.isArray(db.users)) {
    db.users = [];
  }
  let teacher = db.users.find(
    (u) => u.role === "teacher" || u.username.toLowerCase() === INITIAL_TEACHER_USERNAME.toLowerCase()
  );
  if (!teacher) {
    const salt = generateSalt();
    const passwordHash = hashPassword(INITIAL_TEACHER_PASSWORD, salt);
    const newTeacher = {
      id: "user-teacher-1",
      username: INITIAL_TEACHER_USERNAME,
      passwordHash,
      salt,
      role: "teacher",
      name: "T\xFCrk Dili ve Edebiyat\u0131 Z\xFCmresi",
      classGrade: "T\xFCm \u015Eubeler",
      mustChangePassword: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.unshift(newTeacher);
    return true;
  }
  let modified = false;
  if (teacher.role !== "teacher") {
    teacher.role = "teacher";
    modified = true;
  }
  if (!teacher.passwordChangedAt) {
    const currentMatches = hashPassword(INITIAL_TEACHER_PASSWORD, teacher.salt) === teacher.passwordHash;
    if (!currentMatches) {
      const newSalt = generateSalt();
      teacher.salt = newSalt;
      teacher.passwordHash = hashPassword(INITIAL_TEACHER_PASSWORD, newSalt);
      teacher.mustChangePassword = true;
      modified = true;
    } else if (teacher.mustChangePassword === void 0) {
      teacher.mustChangePassword = true;
      modified = true;
    }
  }
  return modified;
}
function readDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const bundledDb = path.join(__dirname, "data", "yazarota_db.json");
      if (isVercel && fs.existsSync(bundledDb)) {
        try {
          const bundledContent = fs.readFileSync(bundledDb, "utf-8");
          const parsedBundled = JSON.parse(bundledContent);
          ensureTeacherAccount(parsedBundled);
          fs.writeFileSync(DB_FILE, JSON.stringify(parsedBundled, null, 2), "utf-8");
          return parsedBundled;
        } catch (seedErr) {
          console.warn("Could not copy bundled DB to /tmp:", seedErr);
        }
      }
      try {
        ensureTeacherAccount(DEFAULT_DB);
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      } catch (writeErr) {
        console.warn("Could not write initial DB to disk:", writeErr);
      }
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
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
    if (ensureTeacherAccount(parsed)) {
      modified = true;
    }
    if (modified) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
      } catch (e) {
      }
    }
    return parsed;
  } catch (err) {
    console.error("Error reading DB, using default:", err);
    return DEFAULT_DB;
  }
}
function writeDb(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Error writing DB to disk (continuing safely in-memory):", err);
  }
  if (supabaseClient) {
    syncToSupabase(data).catch(() => {
    });
  }
}
readDb();
pullFromSupabase().catch(() => {
});
function addNotification(db, userId, userRole, title, message, type, storyId) {
  const notif = {
    id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    userId,
    userRole,
    title,
    message,
    storyId,
    type,
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.notifications.unshift(notif);
  if (db.notifications.length > 200) {
    db.notifications.pop();
  }
}
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({
    success: true,
    service: "YAZAROTA API",
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    supabaseConfigured: Boolean(supabaseClient),
    supabaseProjectId: SUPABASE_PROJECT_ID,
    isVercel,
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get(["/api/supabase/status", "/supabase/status"], async (_req, res) => {
  if (!supabaseClient) {
    return res.json({
      success: false,
      configured: false,
      message: "Supabase istemcisi yap\u0131land\u0131r\u0131lmam\u0131\u015F."
    });
  }
  try {
    const { error } = await supabaseClient.from("app_state").select("id").limit(1);
    const tablesReady = !error;
    res.json({
      success: true,
      configured: true,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      connected: true,
      tablesReady,
      message: tablesReady ? "Supabase veritaban\u0131 aktif ve tablolar kullan\u0131ma haz\u0131r!" : "Supabase ba\u011Flant\u0131s\u0131 kuruldu ancak SQL \u015Femas\u0131n\u0131n \xE7al\u0131\u015Ft\u0131r\u0131lmas\u0131 bekleniyor.",
      errorDetails: error ? error.message : null
    });
  } catch (err) {
    res.json({
      success: false,
      configured: true,
      connected: false,
      tablesReady: false,
      message: "Supabase sunucusuna ba\u011Flan\u0131rken hata olu\u015Ftu.",
      errorDetails: err?.message
    });
  }
});
app.get(["/api/supabase/sql", "/supabase/sql"], (_req, res) => {
  const sqlPath = path.join(__dirname, "supabase_schema.sql");
  if (fs.existsSync(sqlPath)) {
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    res.type("text/plain").send(sqlContent);
  } else {
    res.status(404).json({ success: false, error: "supabase_schema.sql dosyas\u0131 bulunamad\u0131." });
  }
});
app.post(["/api/supabase/sync", "/supabase/sync"], async (_req, res) => {
  const db = readDb();
  if (!supabaseClient) {
    return res.status(503).json({ success: false, error: "Supabase istemcisi aktif de\u011Fil." });
  }
  try {
    await syncToSupabase(db);
    res.json({ success: true, message: "Veriler ba\u015Far\u0131yla Supabase bulutuna senkronize edildi." });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Senkronizasyon hatas\u0131" });
  }
});
app.post(["/api/auth/register", "/auth/register"], (req, res) => {
  const { username, password, name, classGrade, pseudonym } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({
      success: false,
      error: "Kullan\u0131c\u0131 ad\u0131, isim ve \u015Fifre alanlar\u0131 zorunludur."
    });
  }
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return res.status(400).json({
      success: false,
      error: "Kullan\u0131c\u0131 ad\u0131 en az 3 karakterden olu\u015Fmal\u0131d\u0131r."
    });
  }
  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      error: "\u015Eifre en az 4 karakter uzunlu\u011Funda olmal\u0131d\u0131r."
    });
  }
  const db = readDb();
  const existing = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: "Bu kullan\u0131c\u0131 ad\u0131 zaten kullan\u0131lmaktad\u0131r. L\xFCtfen farkl\u0131 bir kullan\u0131c\u0131 ad\u0131 se\xE7iniz."
    });
  }
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const newUser = {
    id: "user-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    username: cleanUsername,
    passwordHash,
    salt,
    role: "student",
    name: name.trim(),
    classGrade: classGrade ? classGrade.trim() : "Genel",
    pseudonym: pseudonym ? pseudonym.trim() : name.trim(),
    mustChangePassword: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.users.push(newUser);
  writeDb(db);
  const token = createToken({
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role,
    name: newUser.name
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
      createdAt: newUser.createdAt
    }
  });
});
app.post(["/api/auth/login", "/auth/login"], (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "L\xFCtfen kullan\u0131c\u0131 ad\u0131 ve \u015Fifrenizi giriniz."
    });
  }
  const cleanUsername = username.trim().toLowerCase();
  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Girdi\u011Finiz kullan\u0131c\u0131 ad\u0131 veya \u015Fifre hatal\u0131."
    });
  }
  const calculatedHash = hashPassword(password, user.salt);
  if (calculatedHash !== user.passwordHash) {
    return res.status(401).json({
      success: false,
      error: "Girdi\u011Finiz kullan\u0131c\u0131 ad\u0131 veya \u015Fifre hatal\u0131."
    });
  }
  const token = createToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name
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
      createdAt: user.createdAt
    }
  });
});
app.post(["/api/auth/change-password", "/auth/change-password"], (req, res) => {
  const authUser = getUserFromReq(req);
  const { currentPassword, newPassword } = req.body;
  if (!authUser) {
    return res.status(401).json({
      success: false,
      error: "\u015Eifre de\u011Fi\u015Ftirmek i\xE7in oturum a\xE7m\u0131\u015F olman\u0131z gerekmektedir."
    });
  }
  if (!currentPassword) {
    return res.status(400).json({
      success: false,
      error: "L\xFCtfen mevcut \u015Fifrenizi giriniz."
    });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Yeni \u015Fifreniz en az 6 karakterden olu\u015Fmal\u0131d\u0131r."
    });
  }
  if (newPassword === "123456" || newPassword === "1234") {
    return res.status(400).json({
      success: false,
      error: "Yeni \u015Fifreniz varsay\u0131lan ilk \u015Fifreyle (123456) ayn\u0131 olamaz. L\xFCtfen farkl\u0131 ve g\xFCvenli bir \u015Fifre belirleyiniz."
    });
  }
  const db = readDb();
  const user = db.users.find((u) => u.id === authUser.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: "Kullan\u0131c\u0131 bulunamad\u0131." });
  }
  const checkHash = hashPassword(currentPassword, user.salt);
  if (checkHash !== user.passwordHash) {
    return res.status(400).json({
      success: false,
      error: "Mevcut \u015Fifrenizi hatal\u0131 girdiniz. L\xFCtfen \u015Fifrenizi kontrol ediniz."
    });
  }
  const newSalt = generateSalt();
  user.salt = newSalt;
  user.passwordHash = hashPassword(newPassword, newSalt);
  user.mustChangePassword = false;
  user.passwordChangedAt = (/* @__PURE__ */ new Date()).toISOString();
  writeDb(db);
  res.json({
    success: true,
    message: "\u015Eifreniz ba\u015Far\u0131yla g\xFCncellendi."
  });
});
function requireActiveTeacher(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "teacher") {
    res.status(403).json({
      success: false,
      error: "Bu i\u015Flem yaln\u0131zca \xF6\u011Fretmen yetkisi gerektirir."
    });
    return null;
  }
  const db = readDb();
  const user = db.users.find((u) => u.id === authUser.userId);
  if (user && user.mustChangePassword) {
    res.status(403).json({
      success: false,
      error: "\u0130lk giri\u015Finizde \u015Fifrenizi de\u011Fi\u015Ftirmeniz zorunludur. L\xFCtfen \xF6nce \u015Fifrenizi g\xFCncelleyiniz."
    });
    return null;
  }
  return authUser;
}
app.get(["/api/auth/me", "/auth/me"], (req, res) => {
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
      createdAt: user.createdAt
    }
  });
});
app.get(["/api/notifications", "/notifications"], (req, res) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  let userNotifs = [];
  if (authUser) {
    if (authUser.role === "teacher") {
      userNotifs = db.notifications.filter((n) => n.userId === "all_teachers" || n.userId === authUser.username);
    } else {
      userNotifs = db.notifications.filter((n) => n.userId === authUser.username || n.userId === authUser.userId);
    }
  } else {
    userNotifs = [];
  }
  res.json({ success: true, notifications: userNotifs });
});
app.post(["/api/notifications/:id/read", "/notifications/:id/read"], (req, res) => {
  const db = readDb();
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    writeDb(db);
  }
  res.json({ success: true });
});
app.post(["/api/notifications/read-all", "/notifications/read-all"], (req, res) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  if (authUser) {
    db.notifications.forEach((n) => {
      if (authUser.role === "teacher" && (n.userId === "all_teachers" || n.userId === authUser.username) || n.userId === authUser.username || n.userId === authUser.userId) {
        n.read = true;
      }
    });
    writeDb(db);
  }
  res.json({ success: true });
});
app.get(["/api/rubric", "/rubric"], (_req, res) => {
  const db = readDb();
  res.json({ success: true, criteria: db.rubricCriteria || DEFAULT_RUBRIC_CRITERIA });
});
app.put(["/api/rubric", "/rubric"], (req, res) => {
  const authUser = requireActiveTeacher(req, res);
  if (!authUser) return;
  const { criteria } = req.body;
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return res.status(400).json({ success: false, error: "Ge\xE7ersiz rubrik verisi." });
  }
  const db = readDb();
  db.rubricCriteria = criteria;
  writeDb(db);
  res.json({ success: true, criteria: db.rubricCriteria });
});
app.get(["/api/stories", "/stories"], (req, res) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  const { studentCode, status, classId } = req.query;
  let result = db.stories;
  if (authUser) {
    if (authUser.role === "student") {
      result = result.filter(
        (s) => s.authorUsername === authUser.username || studentCode && s.studentCode === studentCode
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
      authorClass: s.authorClass || authorUser?.classGrade
    };
  });
  res.json({ success: true, stories: enrichedResult });
});
app.get(["/api/stories/:id", "/stories/:id"], (req, res) => {
  const db = readDb();
  const story = db.stories.find((s) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ success: false, error: "Hik\xE2ye bulunamad\u0131." });
  }
  const authorUser = story.authorUsername ? db.users.find((u) => u.username === story.authorUsername) : null;
  const enrichedStory = {
    ...story,
    authorClass: story.authorClass || authorUser?.classGrade
  };
  res.json({ success: true, story: enrichedStory });
});
app.post(["/api/stories", "/stories"], (req, res) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  const storyData = req.body;
  if (!storyData.id) {
    storyData.id = "story-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  }
  if (authUser && authUser.role === "student") {
    storyData.authorUsername = authUser.username;
    storyData.authorName = authUser.name;
    const authorUser = db.users.find((u) => u.username === authUser.username);
    if (authorUser && authorUser.classGrade) {
      storyData.authorClass = authorUser.classGrade;
    }
  }
  if (!storyData.status) {
    storyData.status = "draft";
  }
  const existingIndex = db.stories.findIndex((s) => s.id === storyData.id);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (!Array.isArray(storyData.versions) || storyData.versions.length === 0) {
    const rawContent = storyData.content || "";
    storyData.versions = [
      {
        id: "ver-1",
        versionNumber: 1,
        title: storyData.title || "Ba\u015Fl\u0131ks\u0131z",
        content: rawContent,
        wordCount: rawContent.trim() ? rawContent.trim().split(/\s+/).length : 0,
        characterCount: rawContent.length,
        createdAt: now
      }
    ];
    storyData.currentVersionNumber = 1;
  }
  if (existingIndex >= 0) {
    const existing = db.stories[existingIndex];
    storyData.updatedAt = now;
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
app.delete(["/api/stories/:id", "/stories/:id"], (req, res) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  const index = db.stories.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Silinecek hik\xE2ye bulunamad\u0131." });
  }
  const story = db.stories[index];
  if (authUser && authUser.role === "student" && story.authorUsername && story.authorUsername !== authUser.username) {
    return res.status(403).json({ success: false, error: "Bu hik\xE2yeyi silme yetkiniz yok." });
  }
  db.stories.splice(index, 1);
  writeDb(db);
  res.json({ success: true, message: "Hik\xE2ye ba\u015Far\u0131yla silindi." });
});
app.post(["/api/stories/:id/submit-to-teacher", "/stories/:id/submit-to-teacher"], (req, res) => {
  const authUser = getUserFromReq(req);
  const db = readDb();
  const story = db.stories.find((s) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ success: false, error: "Hik\xE2ye bulunamad\u0131." });
  }
  const isResubmission = story.status === "revision_requested" || story.versions && story.versions.length > 1;
  story.status = isResubmission ? "resubmitted" : "pending_teacher";
  story.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const studentName = authUser?.name || story.authorName || story.studentCode || "Bir \xF6\u011Frenci";
  addNotification(
    db,
    "all_teachers",
    "teacher",
    isResubmission ? "Yeniden D\xFCzenlenen Yaz\u0131 G\xF6nderildi" : "Yeni De\u011Ferlendirme Talebi",
    `${studentName}, \u201C${story.title || "Ba\u015Fl\u0131ks\u0131z"}\u201D adl\u0131 eserini incelemeniz i\xE7in g\xF6nderdi.`,
    "submission",
    story.id
  );
  writeDb(db);
  res.json({ success: true, story, message: "Yaz\u0131n\u0131z ba\u015Far\u0131yla \xF6\u011Fretmeninize iletildi!" });
});
app.post(["/api/stories/:id/teacher-evaluate", "/stories/:id/teacher-evaluate"], (req, res) => {
  const authUser = requireActiveTeacher(req, res);
  if (!authUser) return;
  const db = readDb();
  const story = db.stories.find((s) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ success: false, error: "Hik\xE2ye bulunamad\u0131." });
  }
  const {
    versionNumber,
    decision,
    // 'approved' | 'revision_requested' | 'nominated_for_magazine' | 'published' | 'rejected'
    generalComment,
    revisionChecklist,
    rubricScores,
    // Record<criterionId, score>
    rubricTotal
  } = req.body;
  const targetVersionNumber = versionNumber || story.currentVersionNumber;
  const version = story.versions.find((v) => v.versionNumber === targetVersionNumber);
  if (!version) {
    return res.status(404).json({ success: false, error: "Hedef s\xFCr\xFCm bulunamad\u0131." });
  }
  const decisionLabels = {
    approved: "Onayland\u0131",
    revision_requested: "D\xFCzeltme \u0130stendi",
    nominated_for_magazine: "Gen\xE7 Kalemler \u0130\xE7in Se\xE7ildi",
    published: "Yay\u0131na Haz\u0131r & Dergide Yay\u0131mland\u0131",
    rejected: "Tekrar Yaz\u0131lmas\u0131 Gerekiyor"
  };
  const teacherFeedback = {
    id: "tf-" + Date.now(),
    teacherId: authUser.userId,
    teacherName: authUser.name,
    decision: decision || "revision_requested",
    decisionLabel: decisionLabels[decision] || "\u0130ncelendi",
    generalComment: generalComment || "",
    revisionChecklist: Array.isArray(revisionChecklist) ? revisionChecklist : [],
    rubricScores: rubricScores || {},
    rubricTotal: Number(rubricTotal) || 0,
    submittedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  version.teacherFeedback = teacherFeedback;
  if (decision === "revision_requested") {
    story.status = "revision_requested";
  } else if (decision === "approved") {
    story.status = "approved";
  } else if (decision === "nominated_for_magazine") {
    story.status = "nominated_for_magazine";
  } else if (decision === "published") {
    story.status = "published";
  }
  story.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const studentTarget = story.authorUsername || story.studentCode;
  if (studentTarget) {
    const notifTitle = decision === "revision_requested" ? "\xD6\u011Fretmeniniz D\xFCzeltme \u0130stedi" : decision === "nominated_for_magazine" ? "Tebrikler! Eseriniz Gen\xE7 Kalemler \u0130\xE7in Se\xE7ildi" : decision === "published" ? "Eseriniz Gen\xE7 Kalemler Dergisi\u2019nde Yay\u0131nda!" : "\xD6\u011Fretmen De\u011Ferlendirmeniz Tamamland\u0131";
    const notifMessage = generalComment ? `\xD6\u011Fretmeninizin notu: "${generalComment.slice(0, 100)}${generalComment.length > 100 ? "..." : ""}"` : `\u201C${story.title || "Yaz\u0131n\u0131z"}\u201D \xF6\u011Fretmeniniz taraf\u0131ndan incelendi (${teacherFeedback.decisionLabel}).`;
    addNotification(
      db,
      studentTarget,
      "student",
      notifTitle,
      notifMessage,
      decision === "revision_requested" ? "revision" : "approved",
      story.id
    );
  }
  writeDb(db);
  res.json({ success: true, story, feedback: teacherFeedback });
});
app.post(["/api/stories/:id/publish-to-magazine", "/stories/:id/publish-to-magazine"], (req, res) => {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "teacher") {
    return res.status(403).json({
      success: false,
      error: "Gen\xE7 Kalemler dergisine yaln\u0131zca \xF6\u011Fretmenler yay\u0131n onay\u0131 verebilir."
    });
  }
  const db = readDb();
  const story = db.stories.find((s) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ success: false, error: "Hik\xE2ye bulunamad\u0131." });
  }
  const { authorType, authorDisplayName, teacherEditorNotes, issueId } = req.body;
  const latestVersion = story.versions[story.versions.length - 1];
  let currentIssue = db.magazineIssues.find((i) => i.id === issueId);
  if (!currentIssue) {
    currentIssue = db.magazineIssues.find((i) => i.isCurrent) || db.magazineIssues[0];
  }
  const pubId = "pub-" + Date.now();
  const publishedWork = {
    id: pubId,
    storyId: story.id,
    title: latestVersion.title || story.title,
    content: latestVersion.content,
    genre: story.genre,
    authorType: authorType || "pseudonym",
    // 'real_name' | 'pseudonym' | 'anonymous'
    authorDisplayName: authorType === "real_name" ? story.authorName || "Gen\xE7 Yazar" : authorType === "anonymous" ? "Anonim Yazar" : authorDisplayName || story.authorName || "Gen\xE7 Kalem",
    studentUsername: story.authorUsername || "",
    teacherEditorNotes: teacherEditorNotes || "Yay\u0131n kurulu onay\u0131yla Gen\xE7 Kalemler dergisine eklenmi\u015Ftir.",
    issueId: currentIssue?.id || "issue-1",
    issueNumber: currentIssue?.issueNumber || 1,
    publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    wordCount: latestVersion.wordCount,
    likesCount: 0,
    place: story.place,
    time: story.time,
    character: story.character,
    surpriseCard: story.surpriseCard,
    score: latestVersion.teacherFeedback?.rubricTotal || latestVersion.review?.totalScore || 90
  };
  db.publishedWorks.unshift(publishedWork);
  if (currentIssue && !currentIssue.workIds.includes(pubId)) {
    currentIssue.workIds.push(pubId);
  }
  story.status = "published";
  story.publishedWorkId = pubId;
  story.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const studentTarget = story.authorUsername || story.studentCode;
  if (studentTarget) {
    addNotification(
      db,
      studentTarget,
      "student",
      "\u{1F389} Eseriniz Gen\xE7 Kalemler Dergisi\u2019nde Yay\u0131mland\u0131!",
      `\u201C${publishedWork.title}\u201D ba\u015Fl\u0131kl\u0131 eseriniz ${currentIssue?.title || "dergide"} yay\u0131mland\u0131. Dijital dergiden okuyup PDF/Word \xE7\u0131kt\u0131s\u0131 alabilirsiniz.`,
      "magazine",
      story.id
    );
  }
  writeDb(db);
  res.json({ success: true, publishedWork, story });
});
app.get(["/api/magazine/works", "/magazine/works"], (req, res) => {
  const db = readDb();
  const { genre, issueId, search } = req.query;
  let works = db.publishedWorks || [];
  if (genre && genre !== "all") {
    works = works.filter((w) => w.genre === genre);
  }
  if (issueId && issueId !== "all") {
    works = works.filter((w) => w.issueId === issueId);
  }
  if (search) {
    const q = String(search).toLowerCase();
    works = works.filter(
      (w) => w.title.toLowerCase().includes(q) || w.content.toLowerCase().includes(q) || w.authorDisplayName.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, works });
});
app.get(["/api/magazine/works/:id", "/magazine/works/:id"], (req, res) => {
  const db = readDb();
  const work = db.publishedWorks?.find((w) => w.id === req.params.id);
  if (!work) {
    return res.status(404).json({ success: false, error: "Yay\u0131mlanm\u0131\u015F eser bulunamad\u0131." });
  }
  res.json({ success: true, work });
});
app.post(["/api/magazine/works/:id/like", "/magazine/works/:id/like"], (req, res) => {
  const db = readDb();
  const work = db.publishedWorks?.find((w) => w.id === req.params.id);
  if (!work) {
    return res.status(404).json({ success: false, error: "Eser bulunamad\u0131." });
  }
  work.likesCount = (work.likesCount || 0) + 1;
  writeDb(db);
  res.json({ success: true, likesCount: work.likesCount });
});
app.get(["/api/magazine/issues", "/magazine/issues"], (_req, res) => {
  const db = readDb();
  res.json({ success: true, issues: db.magazineIssues || [] });
});
app.post(["/api/magazine/issues", "/magazine/issues"], (req, res) => {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "teacher") {
    return res.status(403).json({
      success: false,
      error: "Yeni say\u0131 olu\u015Fturma yetkisi yaln\u0131zca \xF6\u011Fretmenlere aittir."
    });
  }
  const { title, theme, editorNote, coverColor } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: "Say\u0131 ba\u015Fl\u0131\u011F\u0131 zorunludur." });
  }
  const db = readDb();
  const nextNum = (db.magazineIssues?.length || 0) + 1;
  const newIssue = {
    id: "issue-" + Date.now(),
    issueNumber: nextNum,
    title: title.trim(),
    theme: theme ? theme.trim() : "Gen\xE7 Edebiyat Se\xE7kisi",
    editorNote: editorNote ? editorNote.trim() : "\xD6\u011Frencilerimizin yarat\u0131c\u0131 kalemlerinden \xE7\u0131kan se\xE7kin eserler.",
    coverColor: coverColor || "from-teal-800 to-slate-900",
    publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    workIds: [],
    isCurrent: true
  };
  db.magazineIssues.forEach((i) => i.isCurrent = false);
  db.magazineIssues.unshift(newIssue);
  writeDb(db);
  res.json({ success: true, issue: newIssue });
});
app.get(["/api/teacher/dashboard-stats", "/teacher/dashboard-stats"], (req, res) => {
  const authUser = requireActiveTeacher(req, res);
  if (!authUser) return;
  const db = readDb();
  const allStories = db.stories || [];
  const totalSubmitted = allStories.filter((s) => s.status !== "draft").length;
  const pendingEvaluation = allStories.filter((s) => s.status === "pending_teacher").length;
  const revisionRequested = allStories.filter((s) => s.status === "revision_requested").length;
  const resubmitted = allStories.filter((s) => s.status === "resubmitted").length;
  const approved = allStories.filter((s) => s.status === "approved" || s.status === "nominated_for_magazine").length;
  const publishedInMagazine = (db.publishedWorks || []).length;
  res.json({
    success: true,
    stats: {
      totalSubmitted,
      // Gelen Yazılar
      pendingEvaluation,
      // Değerlendirme Bekleyenler
      revisionRequested,
      // Düzeltme İstenenler
      resubmitted,
      // Yeniden Değerlendirilecekler
      approved,
      // Yayına Hazır / Onaylanan
      publishedInMagazine,
      // Genç Kalemler Dergisi'ndeki Yazılar
      totalStudents: (db.users || []).filter((u) => u.role === "student").length,
      totalClasses: (db.classes || []).length
    }
  });
});
app.get(["/api/classes", "/classes"], (_req, res) => {
  const db = readDb();
  res.json({ success: true, classes: db.classes });
});
app.post(["/api/classes", "/classes"], (req, res) => {
  const db = readDb();
  const { name, grade, studentCodes } = req.body;
  if (!name || !grade) {
    return res.status(400).json({ success: false, error: "S\u0131n\u0131f ad\u0131 ve kademe zorunludur." });
  }
  const newClass = {
    id: "class-" + Date.now(),
    name,
    grade,
    studentCodes: studentCodes && Array.isArray(studentCodes) ? studentCodes : [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.classes.push(newClass);
  writeDb(db);
  res.json({ success: true, classGroup: newClass });
});
app.get(["/api/tasks", "/tasks"], (_req, res) => {
  const db = readDb();
  res.json({ success: true, tasks: db.tasks });
});
app.post(["/api/tasks", "/tasks"], (req, res) => {
  const db = readDb();
  const task = req.body;
  if (!task.title) {
    return res.status(400).json({ success: false, error: "G\xF6rev ba\u015Fl\u0131\u011F\u0131 zorunludur." });
  }
  task.id = "task-" + Date.now();
  task.createdAt = (/* @__PURE__ */ new Date()).toISOString();
  db.tasks.unshift(task);
  writeDb(db);
  res.json({ success: true, task });
});
app.post(["/api/human-evaluate", "/human-evaluate"], (req, res) => {
  const db = readDb();
  const { storyId, versionNumber, teacherScore, teacherNotes, teacherName, criteriaScores } = req.body;
  const story = db.stories.find((s) => s.id === storyId);
  if (!story) {
    return res.status(404).json({ success: false, error: "Hik\xE2ye bulunamad\u0131." });
  }
  const version = story.versions.find((v) => v.versionNumber === versionNumber);
  if (!version) {
    return res.status(404).json({ success: false, error: "S\xFCr\xFCm bulunamad\u0131." });
  }
  if (!version.review) {
    version.review = {
      id: "rev-human-" + Date.now(),
      evaluatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalScore: teacherScore || 0,
      criteriaScores: [],
      generalReview: "\xD6\u011Fretmen de\u011Ferlendirmesi eklendi.",
      strengths: [],
      areasToImprove: [],
      topThreeSuggestions: [],
      genreCompliance: "",
      surpriseCardCompliance: "",
      nextActionStep: ""
    };
  }
  version.review.humanEvaluation = {
    teacherScore: Number(teacherScore),
    teacherNotes: teacherNotes || "",
    evaluatedBy: teacherName || "\xD6\u011Fretmen",
    evaluatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    criteriaScores: criteriaScores || {}
  };
  story.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  writeDb(db);
  res.json({ success: true, review: version.review });
});
app.get("/api/export-csv", (_req, res) => {
  const db = readDb();
  const headers = [
    "Hikaye_ID",
    "Yazar_Kullanici_Adi",
    "Ogrenci_Adi",
    "Ogrenci_Kodu",
    "Edebi_Tur",
    "Baslik",
    "Durum",
    "Surum_No",
    "Kelime_Sayisi",
    "AI_Toplam_Puan",
    "Ogretmen_Toplam_Puan",
    "Ogretmen_Karari",
    "Ogretmen_Notu",
    "Tarih"
  ];
  const rows = [headers.join(",")];
  for (const story of db.stories || []) {
    for (const v of story.versions || []) {
      const review = v.review;
      const tf = v.teacherFeedback;
      const sanitize = (val) => {
        if (val === void 0 || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };
      rows.push(
        [
          sanitize(story.id),
          sanitize(story.authorUsername || ""),
          sanitize(story.authorName || ""),
          sanitize(story.studentCode || "ANON"),
          sanitize(story.genre),
          sanitize(v.title || story.title),
          sanitize(story.status),
          sanitize(v.versionNumber),
          sanitize(v.wordCount || 0),
          sanitize(review ? review.totalScore : ""),
          sanitize(tf ? tf.rubricTotal : ""),
          sanitize(tf ? tf.decisionLabel : ""),
          sanitize(tf ? tf.generalComment : ""),
          sanitize(v.createdAt || story.createdAt)
        ].join(",")
      );
    }
  }
  const csvContent = "\uFEFF" + rows.join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="yazarota_ogrenci_yazilari.csv"');
  res.send(csvContent);
});
function cleanAndValidateGeminiOutput(rawText, genre = "hikaye") {
  if (!rawText || !rawText.trim()) {
    throw new Error("Yapay zek\xE2 modeli bo\u015F bir yan\u0131t d\xF6nd\xFCrd\xFC.");
  }
  let text = rawText.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("JSON parse failed on text:", text.substring(0, 150));
    throw new Error("Yapay zek\xE2 yan\u0131t\u0131 ge\xE7erli JSON format\u0131nda ayr\u0131\u015Ft\u0131r\u0131lamad\u0131.");
  }
  let score = Number(parsed.totalScore);
  if (isNaN(score)) score = 75;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const poetryCriteria = [
    { key: "title", label: "\u015Eiir Ba\u015Fl\u0131\u011F\u0131 ve Tematik Uyum", maxScore: 10 },
    { key: "theme_emotion", label: "Duygu ve D\xFC\u015F\xFCncenin Aktar\u0131m\u0131", maxScore: 20 },
    { key: "imagery", label: "\u0130mge Kullan\u0131m\u0131 ve \xC7a\u011Fr\u0131\u015F\u0131m G\xFCc\xFC", maxScore: 20 },
    { key: "diction_rhythm", label: "S\xF6zc\xFCk Se\xE7imi, \u015Eiirsel Anlat\u0131m ve Ritim", maxScore: 20 },
    { key: "genre", label: "\u015Eiir B\xFCt\xFCnl\xFC\u011F\xFC ve Edeb\xEE Duru\u015F", maxScore: 15 },
    { key: "creativity", label: "\xD6zg\xFCnl\xFCk ve Yarat\u0131c\u0131l\u0131k", maxScore: 10 },
    { key: "surprise_card", label: "\u015Eiirsel Unsur / \u0130mge Uyumu", maxScore: 5 }
  ];
  const fableCriteria = [
    { key: "title", label: "Fabl Ba\u015Fl\u0131\u011F\u0131 ve Merak \xD6gesi", maxScore: 10 },
    { key: "character_personification", label: "Karakter Kullan\u0131m\u0131 ve Ki\u015File\u015Ftirme (Te\u015Fhis/\u0130ntak)", maxScore: 20 },
    { key: "plot", label: "Olay \xD6rg\xFCs\xFC ve \xC7at\u0131\u015Fma", maxScore: 20 },
    { key: "moral_theme", label: "Ana D\xFC\u015F\xFCnce ve Dersin Yerle\u015Fimi", maxScore: 20 },
    { key: "genre", label: "Fabl T\xFCr\xFC \xD6zelliklerine Uygunluk", maxScore: 15 },
    { key: "language", label: "Anlat\u0131m\u0131n A\xE7\u0131kl\u0131\u011F\u0131 ve Dil \xD6zeni", maxScore: 10 },
    { key: "creativity", label: "\xD6zg\xFCnl\xFCk ve S\xFCrpriz Kart\u0131 Uyumu", maxScore: 5 }
  ];
  const standardCriteria = [
    { key: "title", label: "Ba\u015Fl\u0131\u011F\u0131n Metne Uygunlu\u011Fu", maxScore: 10 },
    { key: "plot", label: "Olay \xD6rg\xFCs\xFC ve Kurgu", maxScore: 25 },
    { key: "character", label: "Karakterlerin \u0130\u015Fleni\u015Fi", maxScore: 15 },
    { key: "setting", label: "Mek\xE2n ve Zaman Kullan\u0131m\u0131", maxScore: 10 },
    { key: "genre", label: "Se\xE7ilen Edeb\xEE T\xFCre Uygunluk", maxScore: 20 },
    { key: "language", label: "Dil ve Anlat\u0131m", maxScore: 15 },
    { key: "creativity", label: "\xD6zg\xFCnl\xFCk ve Yarat\u0131c\u0131l\u0131k", maxScore: 5 }
  ];
  const targetCriteria = genre === "siir" ? poetryCriteria : genre === "fabl" ? fableCriteria : standardCriteria;
  const criteriaScores = [];
  const modelCriteria = Array.isArray(parsed.criteriaScores) ? parsed.criteriaScores : [];
  for (const std of targetCriteria) {
    const existing = modelCriteria.find((c) => c.key === std.key);
    if (existing) {
      criteriaScores.push({
        key: std.key,
        label: existing.label || std.label,
        score: typeof existing.score === "number" ? Math.max(0, Math.min(std.maxScore, Math.round(existing.score))) : Math.round(std.maxScore * 0.75),
        maxScore: std.maxScore,
        justification: existing.justification || "\xD6l\xE7\xFCt de\u011Ferlendirmesi tamamland\u0131."
      });
    } else {
      criteriaScores.push({
        key: std.key,
        label: std.label,
        score: Math.round(std.maxScore * 0.75),
        maxScore: std.maxScore,
        justification: "\xD6l\xE7\xFCt ba\u015Far\u0131yla incelendi."
      });
    }
  }
  let defaultGeneralReview = "Hik\xE2yeniz zengin kurgusal detaylar ve etkileyici bir anlat\u0131m potansiyeli bar\u0131nd\u0131r\u0131yor.";
  let defaultStrengths = [
    "Kurgudaki atmosfer ve merak \xF6gesi okuru hik\xE2yeye ba\u011Fl\u0131yor.",
    "Karakterin kurgusal ba\u011Flam\u0131 edeb\xEE t\xFCr\xFCn ritmini destekliyor."
  ];
  let defaultAreasToImprove = ["Duyusal betimlemeleri ve mek\xE2n ayr\u0131nt\u0131lar\u0131n\u0131 biraz daha derinle\u015Ftirebilirsiniz."];
  let defaultSuggestions = [
    "Mek\xE2n\u0131n ses ve koku gibi duyusal ayr\u0131nt\u0131lar\u0131n\u0131 metne d\xE2hil edin.",
    "Karakterin i\xE7 \xE7at\u0131\u015Fmas\u0131n\u0131 hissettiren k\u0131sa bir monolog veya diyalog ekleyin.",
    "S\xFCrpriz kart\u0131n\u0131n hik\xE2yedeki k\u0131r\u0131lma an\u0131n\u0131 daha belirgin k\u0131l\u0131n."
  ];
  let defaultGenreCompliance = "Metin, se\xE7ilen edeb\xEE t\xFCr\xFCn temel kurallar\u0131na ve yap\u0131s\u0131na uygun \u015Fekilde kurgulanm\u0131\u015Ft\u0131r.";
  let defaultSurpriseCompliance = "S\xFCrpriz kart\u0131 anlat\u0131n\u0131n gidi\u015Fat\u0131na kurgusal bir heyecan katm\u0131\u015Ft\u0131r.";
  if (genre === "siir") {
    defaultGeneralReview = "\u015Eiiriniz derin bir duygu d\xFCnyas\u0131, ses uyumu ve etkileyici dize kurgusu bar\u0131nd\u0131r\u0131yor.";
    defaultStrengths = [
      "Dizeler aras\u0131ndaki duygu ve d\xFC\u015F\xFCnce aktar\u0131m\u0131 samimi ve \xF6zg\xFCn bir ses yakalam\u0131\u015F.",
      "S\xF6zc\xFCk tercihleri ve imge kullan\u0131m\u0131 \u015Fiirsel atmosferi ba\u015Far\u0131yla destekliyor."
    ];
    defaultAreasToImprove = ["Dizeleri sesli okuyarak dize k\u0131r\u0131l\u0131mlar\u0131 ve i\xE7 ritim dengesini daha da g\xFC\xE7lendirebilirsiniz."];
    defaultSuggestions = [
      "Dizeleri sesli okuyup dilinize tak\u0131lan s\xF6zc\xFCkleri sadele\u015Ftirin veya yerlerini de\u011Fi\u015Ftirin.",
      "Daha taze, al\u0131\u015F\u0131lmam\u0131\u015F somut benzetmeler ve duyusal imgelerle duygu yo\u011Funlu\u011Funu per\xE7inleyin.",
      "Serbest \u015Fiirde i\xE7 ahengi korumak i\xE7in dize sonlar\u0131ndaki ses tekrarlar\u0131ndan (aliterasyon/asonans) yararlan\u0131n."
    ];
    defaultGenreCompliance = "Metin, \u015Fiir sanat\u0131n\u0131n gerektirdi\u011Fi dize esteti\u011Fine, duygu yo\u011Funlu\u011Funa ve serbest \u015Fiir ahengine uygundur.";
    defaultSurpriseCompliance = "Se\xE7ilen \u015Fiirsel imge / s\xFCrpriz unsur dizelerin anlam d\xFCnyas\u0131na estetik bir derinlik katm\u0131\u015Ft\u0131r.";
  } else if (genre === "fabl") {
    defaultGeneralReview = "Fabl\u0131n\u0131z hayvan kahramanlar\u0131n canl\u0131 kar\u015F\u0131la\u015Fmas\u0131, te\u015Fhis/intak ustal\u0131\u011F\u0131 ve ibretli dersiyle son derece ba\u015Far\u0131l\u0131.";
    defaultStrengths = [
      "Hayvan karakterlerin ki\u015File\u015Ftirilmesi (te\u015Fhis) ve diyaloglar\u0131 metne b\xFCy\xFCk bir canl\u0131l\u0131k katm\u0131\u015F.",
      "Karakterler aras\u0131ndaki z\u0131tl\u0131k ve \xE7at\u0131\u015Fma olay ak\u0131\u015F\u0131n\u0131 merak uyand\u0131r\u0131c\u0131 k\u0131lm\u0131\u015F."
    ];
    defaultAreasToImprove = ["Ana fikrin ve ibretli dersin olaylar\u0131n ak\u0131\u015F\u0131 i\xE7inde daha do\u011Fal sezdirilmesine odaklanabilirsiniz."];
    defaultSuggestions = [
      "Karakterlerin kendi t\xFCrlerine \xF6zg\xFC fiziksel vas\u0131flar\u0131n\u0131 (pen\xE7e, gaga, kanat vb.) diyaloglara ve hareketlere yedirin.",
      "Dersi do\u011Frudan s\xF6ylemek yerine olay\u0131n neticesinde okurun kendisinin sezmesini sa\u011Flay\u0131n.",
      "\xC7at\u0131\u015Fma an\u0131nda kurnazl\u0131k ile d\xFCr\xFCstl\xFCk aras\u0131ndaki z\u0131tl\u0131\u011F\u0131 biraz daha vurgulay\u0131n."
    ];
    defaultGenreCompliance = "Metin, fabl t\xFCr\xFCn\xFCn te\u015Fhis/intak \xF6zellikleri ve ibret verici ders yap\u0131s\u0131yla tam bir uyum i\xE7indedir.";
    defaultSurpriseCompliance = "\xC7at\u0131\u015Fma ve ders unsuru fabl\u0131n kurgusal omurgas\u0131n\u0131 ba\u015Far\u0131yla tamamlam\u0131\u015Ft\u0131r.";
  }
  return {
    totalScore: score,
    criteriaScores,
    generalReview: typeof parsed.generalReview === "string" && parsed.generalReview.trim() ? parsed.generalReview : defaultGeneralReview,
    strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : defaultStrengths,
    areasToImprove: Array.isArray(parsed.areasToImprove) && parsed.areasToImprove.length > 0 ? parsed.areasToImprove : defaultAreasToImprove,
    topThreeSuggestions: Array.isArray(parsed.topThreeSuggestions) && parsed.topThreeSuggestions.length > 0 ? parsed.topThreeSuggestions.slice(0, 3) : defaultSuggestions,
    genreCompliance: typeof parsed.genreCompliance === "string" && parsed.genreCompliance.trim() ? parsed.genreCompliance : defaultGenreCompliance,
    surpriseCardCompliance: typeof parsed.surpriseCardCompliance === "string" && parsed.surpriseCardCompliance.trim() ? parsed.surpriseCardCompliance : defaultSurpriseCompliance,
    nextActionStep: typeof parsed.nextActionStep === "string" && parsed.nextActionStep.trim() ? parsed.nextActionStep : "\xD6nerilen d\xFCzeltmeleri dikkate alarak edit\xF6rde yeni bir s\xFCr\xFCm olu\u015Fturun."
  };
}
app.post(["/api/evaluate", "/evaluate"], async (req, res) => {
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
      wordCount
    } = req.body;
    if (!content || typeof content !== "string" || content.trim().length < 15) {
      return res.status(400).json({
        success: false,
        error: "De\u011Ferlendirme i\xE7in l\xFCtfen en az 15 karakter uzunlu\u011Funda bir metin yaz\u0131n\u0131z.",
        code: "TEXT_TOO_SHORT"
      });
    }
    const aiClient = getGeminiClient();
    if (!aiClient) {
      return res.status(503).json({
        success: false,
        error: "Gemini API anahtar\u0131 sunucuda yap\u0131land\u0131r\u0131lmam\u0131\u015F (GEMINI_API_KEY eksik). Vercel paneli \xFCzerinden Environment Variables alan\u0131na ekleyiniz.",
        code: "MISSING_API_KEY"
      });
    }
    let systemPrompt = `Sen lise d\xFCzeyindeki \xF6\u011Frencilerin yarat\u0131c\u0131 yazma becerilerini destekleyen uzman bir T\xFCrk Dili ve Edebiyat\u0131 \xF6\u011Fretmenisin. Ad\u0131n YAZAROTA De\u011Ferlendirme Asistan\u0131.
Amac\u0131n \xF6\u011Frenciyi cesaretlendirmek, g\xFC\xE7l\xFC y\xF6nlerini somut al\u0131nt\u0131larla \xF6vmek ve en fazla 3 yap\u0131c\u0131 geli\u015Fim \xF6nerisi sunmakt\u0131r.
Metni ASLA \xF6\u011Frencinin yerine ba\u015Ftan yazma. Geli\u015Ftirebilece\u011Fi y\xF6nleri \xF6rnekleyerek a\xE7\u0131klayan, lise ya\u015F d\xFCzeyine uygun pedagojik, nazik ve te\u015Fvik edici bir T\xFCrk\xE7e kullan.`;
    if (genre === "siir") {
      systemPrompt += `
BU MET\u0130N B\u0130R \u015E\u0130\u0130RD\u0130R.
\u015Eiir de\u011Ferlendirmesinde \u015Fu \xF6l\xE7\xFCtleri kullan (Toplam 100 Puan):
1. \u015Eiir Ba\u015Fl\u0131\u011F\u0131 ve Tematik Uyum (key: "title", maxScore: 10)
2. Duygu ve D\xFC\u015F\xFCncenin Aktar\u0131m\u0131 (key: "theme_emotion", maxScore: 20)
3. \u0130mge Kullan\u0131m\u0131 ve \xC7a\u011Fr\u0131\u015F\u0131m G\xFCc\xFC (key: "imagery", maxScore: 20)
4. S\xF6zc\xFCk Se\xE7imi, \u015Eiirsel Anlat\u0131m ve Ritim (key: "diction_rhythm", maxScore: 20)
5. \u015Eiir B\xFCt\xFCnl\xFC\u011F\xFC ve Edeb\xEE Duru\u015F (key: "genre", maxScore: 15)
6. \xD6zg\xFCnl\xFCk ve Yarat\u0131c\u0131l\u0131k (key: "creativity", maxScore: 10)
7. \u015Eiirsel Unsur / \u0130mge Uyumu (key: "surprise_card", maxScore: 5)

\xC7OK \xD6NEML\u0130 KURALLAR:
- \xD6l\xE7\xFC ve uyak bulunmas\u0131n\u0131 b\xFCt\xFCn \u015Fiirler i\xE7in ZORUNLU TUTMA. Serbest \u015Fiiri de tamamen ge\xE7erli, ahenkli ve ba\u015Far\u0131l\u0131 kabul et.
- \xD6\u011Frencinin \u015Fiirini onun yerine YEN\u0130DEN YAZMA. Geli\u015Ftirebilece\u011Fi y\xF6nleri dize veya s\xF6zc\xFCk d\xFCzeyinde \xF6rnekleyerek a\xE7\u0131klayan, ya\u015F d\xFCzeyine uygun geri bildirim ver.`;
    } else if (genre === "fabl") {
      systemPrompt += `
BU MET\u0130N B\u0130R FABLDIR.
Fabl de\u011Ferlendirmesinde \u015Fu \xF6l\xE7\xFCtleri kullan (Toplam 100 Puan):
1. Fabl Ba\u015Fl\u0131\u011F\u0131 ve Merak \xD6gesi (key: "title", maxScore: 10)
2. Karakter Kullan\u0131m\u0131 ve Ki\u015File\u015Ftirme - Te\u015Fhis/\u0130ntak (key: "character_personification", maxScore: 20)
3. Olay \xD6rg\xFCs\xFC ve \xC7at\u0131\u015Fma (key: "plot", maxScore: 20)
4. Ana D\xFC\u015F\xFCnce ve Dersin Yerle\u015Fimi (key: "moral_theme", maxScore: 20)
5. Fabl T\xFCr\xFC \xD6zelliklerine Uygunluk (key: "genre", maxScore: 15)
6. Anlat\u0131m\u0131n A\xE7\u0131kl\u0131\u011F\u0131 ve Dil \xD6zeni (key: "language", maxScore: 10)
7. \xD6zg\xFCnl\xFCk ve S\xFCrpriz Kart\u0131 Uyumu (key: "creativity", maxScore: 5)

\xC7OK \xD6NEML\u0130 KURALLAR:
- Fabl t\xFCr\xFCne uygun karakter kullan\u0131m\u0131, ki\u015File\u015Ftirme, olay \xF6rg\xFCs\xFC, anlat\u0131m\u0131n a\xE7\u0131kl\u0131\u011F\u0131, \xF6zg\xFCnl\xFCk ve ana d\xFC\u015F\xFCnce veya dersin metne uygun bi\xE7imde yerle\u015Fmesini dikkate al.
- Her fabl\u0131n sonunda a\xE7\u0131k\xE7a "Bu hik\xE2yeden \xE7\u0131kar\u0131lacak ders \u015Fudur" c\xFCmlesinin bulunmas\u0131n\u0131 ZORUNLU KILMA; mesaj\u0131n olaylar arac\u0131l\u0131\u011F\u0131yla sezdirilmesine de izin ver ve bunu takdir et.
- \xD6\u011Frencinin kendi metnini geli\u015Ftirmesini sa\u011Flayacak yap\u0131c\u0131 geri bildirimler sun. Metni \xF6\u011Frenci yerine yeniden yazma.`;
    } else {
      systemPrompt += `
Rubrik 100 Puan: Ba\u015Fl\u0131k (10), Kurgu (25), Karakter (15), Mek\xE2n/Zaman (10), T\xFCre Uygunluk (20), Dil/Anlat\u0131m (15), Yarat\u0131c\u0131l\u0131k/S\xFCrpriz (5). Toplam = 100.`;
    }
    const userPrompt = `L\xFCtfen a\u015Fa\u011F\u0131daki \xF6\u011Frenci metnini incele ve JSON format\u0131nda de\u011Ferlendirme sun:

Ba\u015Fl\u0131k: "${title || "Ba\u015Fl\u0131ks\u0131z"}"
T\xFCr: ${genre}
Mek\xE2n: ${place || "Belirtilmemi\u015F"}
Zaman: ${time || "Belirtilmemi\u015F"}
Karakter: ${character || "Belirtilmemi\u015F"}
S\xFCrpriz Kart\u0131: ${surpriseCard || "Belirtilmemi\u015F"}
Kelime Say\u0131s\u0131: ${wordCount || content.trim().split(/\s+/).length}
S\xFCr\xFCm: ${versionNumber || 1}

Metin:
"""
${content}
"""`;
    const response = await aiClient.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalScore: { type: Type.INTEGER, description: "Toplam puan (0-100)" },
            criteriaScores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  label: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  maxScore: { type: Type.INTEGER },
                  justification: { type: Type.STRING }
                },
                required: ["key", "label", "score", "maxScore", "justification"]
              }
            },
            generalReview: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } },
            topThreeSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            genreCompliance: { type: Type.STRING },
            surpriseCardCompliance: { type: Type.STRING },
            nextActionStep: { type: Type.STRING }
          },
          required: [
            "totalScore",
            "criteriaScores",
            "generalReview",
            "strengths",
            "areasToImprove",
            "topThreeSuggestions",
            "genreCompliance",
            "surpriseCardCompliance",
            "nextActionStep"
          ]
        }
      }
    });
    const validatedReview = cleanAndValidateGeminiOutput(response.text, genre);
    validatedReview.id = "rev-" + Date.now();
    validatedReview.evaluatedAt = (/* @__PURE__ */ new Date()).toISOString();
    res.json({ success: true, review: validatedReview });
  } catch (error) {
    console.error("Gemini evaluation error:", error?.message || error);
    let statusCode = 500;
    let friendlyError = "De\u011Ferlendirme s\u0131ras\u0131nda bir hata olu\u015Ftu: " + (error?.message || "Bilinmeyen hata");
    const errMsg = String(error?.message || "").toLowerCase();
    if (errMsg.includes("api key") || errMsg.includes("api_key") || errMsg.includes("unauthenticated")) {
      statusCode = 401;
      friendlyError = "Gemini API anahtar\u0131 ge\xE7ersiz veya yetkisiz. L\xFCtfen sunucu ortam de\u011Fi\u015Fkenlerindeki GEMINI_API_KEY de\u011Ferini kontrol ediniz.";
    } else if (errMsg.includes("quota") || errMsg.includes("rate limit") || errMsg.includes("resource_exhausted") || errMsg.includes("429")) {
      statusCode = 429;
      friendlyError = "Gemini API istek kotas\u0131 a\u015F\u0131ld\u0131. L\xFCtfen 1-2 dakika sonra tekrar deneyiniz.";
    } else if (errMsg.includes("timeout") || errMsg.includes("deadline")) {
      statusCode = 504;
      friendlyError = "Yapay zek\xE2 de\u011Ferlendirme iste\u011Fi zaman a\u015F\u0131m\u0131na u\u011Frad\u0131. L\xFCtfen tekrar deneyiniz.";
    } else if (errMsg.includes("overloaded") || errMsg.includes("503")) {
      statusCode = 503;
      friendlyError = "Yapay zek\xE2 servisi \u015Fu anda me\u015Fgul. L\xFCtfen birka\xE7 saniye sonra tekrar deneyiniz.";
    }
    res.status(statusCode).json({
      success: false,
      error: friendlyError,
      code: error?.code || "EVALUATION_ERROR",
      details: "L\xFCtfen birka\xE7 saniye sonra tekrar deneyiniz veya metninizi kontrol ediniz."
    });
  }
});
app.all(["/api/*", "/api"], (_req, res) => {
  res.status(404).json({
    success: false,
    error: "\u0130stenen API u\xE7 noktas\u0131 bulunamad\u0131 (404 Not Found)."
  });
});
app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err?.message || err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: "Sunucu taraf\u0131nda beklenmeyen bir hata olu\u015Ftu.",
      details: err?.message || "Bilinmeyen hata"
    });
  }
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} YAZAROTA Server running on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  app,
  server_default as default
};
