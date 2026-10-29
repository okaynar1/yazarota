import {
  Story,
  ClassGroup,
  WritingTask,
  AIReview,
  User,
  RubricCriterion,
  PublishedWork,
  MagazineIssue,
  NotificationItem,
  TeacherFeedback,
} from '../types';

const LOCAL_STORAGE_KEY = 'yazarota_stories_cache';
const STUDENT_CODE_KEY = 'yazarota_student_code';
const AUTH_TOKEN_KEY = 'yazarota_auth_token';
const AUTH_USER_KEY = 'yazarota_auth_user';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setAuthSession(token: string, user: User): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (e) {}
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (e) {}
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getOrCreateStudentCode(): string {
  let code = localStorage.getItem(STUDENT_CODE_KEY);
  if (!code) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    code = `OGR-${randomNum}`;
    localStorage.setItem(STUDENT_CODE_KEY, code);
  }
  return code;
}

export function setCustomStudentCode(code: string): void {
  localStorage.setItem(STUDENT_CODE_KEY, code.trim());
}

/**
 * Robust fetch helper that inspects HTTP status and Content-Type before attempting JSON parse.
 * Prevents "Unexpected token 'T', 'The page c'... is not valid JSON" errors caused by HTML or 404/500/504 error pages.
 */
async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  contextDescription: string = 'İşlem'
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const token = getAuthToken();
  const headers = new Headers(options?.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const modifiedOptions: RequestInit = {
    ...options,
    headers,
  };

  let res: Response;
  try {
    res = await fetch(url, modifiedOptions);
  } catch (networkError: any) {
    return {
      ok: false,
      status: 0,
      error: `Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz (${networkError?.message || 'Ağ bağlantı hatası'}).`,
    };
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const isJson = contentType.includes('application/json');

  if (isJson) {
    try {
      const parsedData = (await res.json()) as T;
      return {
        ok: res.ok,
        status: res.status,
        data: parsedData,
        error: !res.ok ? (parsedData as any)?.error || `Sunucu hatası (HTTP ${res.status})` : undefined,
      };
    } catch (parseError: any) {
      console.error(`JSON parse failed for ${url} despite application/json header:`, parseError);
      return {
        ok: false,
        status: res.status,
        error: `${contextDescription} sırasında sunucudan geçersiz veri biçimi alındı (HTTP ${res.status}).`,
      };
    }
  }

  // Non-JSON response (e.g. Vercel 404 HTML, 502/504 Gateway error, or plain text)
  let rawBodyText = '';
  try {
    rawBodyText = (await res.text()).trim();
  } catch (textErr) {}

  let errorMessage: string;
  const lowerBody = rawBodyText.toLowerCase();

  if (res.status === 404 || lowerBody.includes('the page could not be found') || lowerBody.includes('not_found')) {
    errorMessage = `Sunucu servisi bulunamadı (HTTP 404: The page could not be found). Lütfen API rotalarının Vercel üzerinde tanımlı olduğundan emin olunuz.`;
  } else if (res.status === 504 || lowerBody.includes('timeout') || lowerBody.includes('gateway time-out')) {
    errorMessage = `Yapay zekâ yanıtı zaman aşımına uğradı (HTTP 504: Gateway Timeout). Metniniz uzun olabilir, lütfen biraz kısaltarak veya birkaç saniye sonra tekrar deneyiniz.`;
  } else if (res.status === 502 || res.status === 503 || lowerBody.includes('bad gateway') || lowerBody.includes('service unavailable')) {
    errorMessage = `Sunucu servisi geçici olarak meşgul veya erişilemiyor (HTTP ${res.status}). Lütfen birkaç saniye sonra tekrar deneyiniz.`;
  } else if (res.status === 413 || lowerBody.includes('payload too large')) {
    errorMessage = `Gönderilen metin boyutu sunucu sınırını aştı (HTTP 413: Payload Too Large).`;
  } else {
    errorMessage = `${contextDescription} gerçekleştirilemedi (HTTP ${res.status}). Sunucu HTML/metin yanıtı döndürdü.`;
  }

  console.warn(`[safeFetchJson] Non-JSON response from ${url}: status=${res.status}, snippet="${rawBodyText.slice(0, 100)}"`);

  return {
    ok: false,
    status: res.status,
    error: errorMessage,
  };
}

// ================= AUTH METHODS =================

export async function registerStudent(payload: {
  username: string;
  password: string;
  name: string;
  classGrade?: string;
  pseudonym?: string;
}): Promise<{ user: User; token: string }> {
  const result = await safeFetchJson<{ success: boolean; user: User; token: string; error?: string }>(
    '/api/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Öğrenci kaydı yapılırken'
  );

  if (!result.ok || !result.data?.success || !result.data.user) {
    throw new Error(result.error || result.data?.error || 'Kayıt işlemi tamamlanamadı.');
  }

  setAuthSession(result.data.token, result.data.user);
  return { user: result.data.user, token: result.data.token };
}

export async function loginUser(payload: {
  username: string;
  password: string;
}): Promise<{ user: User; token: string }> {
  const result = await safeFetchJson<{ success: boolean; user: User; token: string; error?: string }>(
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Giriş yapılırken'
  );

  if (!result.ok || !result.data?.success || !result.data.user) {
    throw new Error(result.error || result.data?.error || 'Giriş yapılamadı.');
  }

  setAuthSession(result.data.token, result.data.user);
  return { user: result.data.user, token: result.data.token };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const result = await safeFetchJson<{ success: boolean; error?: string; message?: string }>(
    '/api/auth/change-password',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    'Şifre değiştirilirken'
  );

  if (!result.ok || !result.data?.success) {
    throw new Error(result.error || result.data?.error || 'Şifre güncellenemedi.');
  }

  // Update cached user's mustChangePassword flag
  const user = getStoredUser();
  if (user) {
    user.mustChangePassword = false;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }

  return true;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const result = await safeFetchJson<{ success: boolean; authenticated: boolean; user: User | null }>(
      '/api/auth/me',
      undefined,
      'Kullanıcı bilgisi alınırken'
    );
    if (result.ok && result.data?.success && result.data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.data.user));
      return result.data.user;
    }
  } catch (e) {}

  return getStoredUser();
}

// ================= NOTIFICATIONS =================

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const token = getAuthToken();
  if (!token) return [];

  try {
    const result = await safeFetchJson<{ success: boolean; notifications: NotificationItem[] }>(
      '/api/notifications',
      undefined,
      'Bildirimler alınırken'
    );
    if (result.ok && result.data?.success && Array.isArray(result.data.notifications)) {
      return result.data.notifications;
    }
  } catch (err) {}
  return [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await safeFetchJson(`/api/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await safeFetchJson('/api/notifications/read-all', { method: 'POST' });
}

// ================= STORIES WORKFLOW =================

export async function fetchStories(studentCode?: string): Promise<Story[]> {
  try {
    const user = getStoredUser();
    let url = '/api/stories';
    const params = new URLSearchParams();

    if (studentCode) params.append('studentCode', studentCode);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const result = await safeFetchJson<{ success: boolean; stories: Story[] }>(url, undefined, 'Hikâyeler getirilirken');
    if (result.ok && result.data?.success && Array.isArray(result.data.stories)) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result.data.stories));
      } catch (e) {}
      return result.data.stories;
    }
  } catch (err) {
    console.warn('API error fetching stories, checking localStorage fallback:', err);
  }

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed: Story[] = JSON.parse(cached);
      if (studentCode) {
        return parsed.filter((s) => s.studentCode === studentCode);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading localStorage cache:', e);
  }

  return [];
}

export async function saveStory(story: Story): Promise<Story> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    let list: Story[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex((s) => s.id === story.id);
    if (idx >= 0) {
      list[idx] = story;
    } else {
      list.unshift(story);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  try {
    const result = await safeFetchJson<{ success: boolean; story?: Story }>(
      '/api/stories',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      },
      'Hikâye kaydedilirken'
    );
    if (result.ok && result.data?.success && result.data.story) {
      return result.data.story;
    }
  } catch (err) {
    console.warn('Server save failed, preserved in local cache:', err);
  }

  return story;
}

export async function deleteStory(id: string): Promise<boolean> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const list: Story[] = JSON.parse(cached);
      const filtered = list.filter((s) => s.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {}

  try {
    const result = await safeFetchJson(`/api/stories/${id}`, { method: 'DELETE' }, 'Hikâye silinirken');
    return result.ok;
  } catch (err) {
    console.error('Server delete error:', err);
    return true;
  }
}

// Student submits to teacher
export async function submitStoryToTeacher(id: string): Promise<Story> {
  const result = await safeFetchJson<{ success: boolean; story: Story; message?: string }>(
    `/api/stories/${id}/submit-to-teacher`,
    { method: 'POST' },
    'Hikâye öğretmene gönderilirken'
  );

  if (!result.ok || !result.data?.success || !result.data.story) {
    throw new Error(result.error || 'Yazı öğretmene gönderilemedi.');
  }

  return result.data.story;
}

// Teacher evaluates with 10-criteria rubric
export async function submitTeacherEvaluation(
  storyId: string,
  payload: {
    versionNumber: number;
    decision: 'approved' | 'revision_requested' | 'nominated_for_magazine' | 'published' | 'rejected';
    generalComment: string;
    revisionChecklist: string[];
    rubricScores: Record<string, number>;
    rubricTotal: number;
  }
): Promise<{ story: Story; feedback: TeacherFeedback }> {
  const result = await safeFetchJson<{ success: boolean; story: Story; feedback: TeacherFeedback }>(
    `/api/stories/${storyId}/teacher-evaluate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Öğretmen değerlendirmesi kaydedilirken'
  );

  if (!result.ok || !result.data?.success || !result.data.story) {
    throw new Error(result.error || 'Değerlendirme kaydedilemedi.');
  }

  return { story: result.data.story, feedback: result.data.feedback };
}

// Publish to Genç Kalemler Magazine
export async function publishStoryToMagazine(
  storyId: string,
  payload: {
    authorType: 'real_name' | 'pseudonym' | 'anonymous';
    authorDisplayName?: string;
    teacherEditorNotes?: string;
    issueId?: string;
  }
): Promise<{ publishedWork: PublishedWork; story: Story }> {
  const result = await safeFetchJson<{ success: boolean; publishedWork: PublishedWork; story: Story }>(
    `/api/stories/${storyId}/publish-to-magazine`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Dergide yayımlanırken'
  );

  if (!result.ok || !result.data?.success || !result.data.publishedWork) {
    throw new Error(result.error || 'Eser yayımlanamadı.');
  }

  return { publishedWork: result.data.publishedWork, story: result.data.story };
}

// ================= GENÇ KALEMLER MAGAZINE =================

export async function fetchPublishedWorks(filters?: {
  genre?: string;
  issueId?: string;
  search?: string;
}): Promise<PublishedWork[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.genre) params.append('genre', filters.genre);
    if (filters?.issueId) params.append('issueId', filters.issueId);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const result = await safeFetchJson<{ success: boolean; works: PublishedWork[] }>(
      `/api/magazine/works${query}`,
      undefined,
      'Genç Kalemler eserleri alınırken'
    );

    if (result.ok && result.data?.success && Array.isArray(result.data.works)) {
      return result.data.works;
    }
  } catch (err) {}
  return [];
}

export async function fetchPublishedWorkById(id: string): Promise<PublishedWork | null> {
  const result = await safeFetchJson<{ success: boolean; work: PublishedWork }>(
    `/api/magazine/works/${id}`,
    undefined,
    'Eser detayları alınırken'
  );
  if (result.ok && result.data?.success && result.data.work) {
    return result.data.work;
  }
  return null;
}

export async function likePublishedWork(id: string): Promise<number> {
  const result = await safeFetchJson<{ success: boolean; likesCount: number }>(
    `/api/magazine/works/${id}/like`,
    { method: 'POST' },
    'Beğeni gönderilirken'
  );
  return result.data?.likesCount || 0;
}

export async function fetchMagazineIssues(): Promise<MagazineIssue[]> {
  try {
    const result = await safeFetchJson<{ success: boolean; issues: MagazineIssue[] }>(
      '/api/magazine/issues',
      undefined,
      'Dergi sayıları alınırken'
    );
    if (result.ok && result.data?.success && Array.isArray(result.data.issues)) {
      return result.data.issues;
    }
  } catch (err) {}
  return [];
}

export async function createMagazineIssue(payload: {
  title: string;
  theme: string;
  editorNote: string;
  coverColor?: string;
}): Promise<MagazineIssue> {
  const result = await safeFetchJson<{ success: boolean; issue: MagazineIssue }>(
    '/api/magazine/issues',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Yeni sayı oluşturulurken'
  );

  if (!result.ok || !result.data?.success || !result.data.issue) {
    throw new Error(result.error || 'Yeni sayı oluşturulamadı.');
  }

  return result.data.issue;
}

// ================= RUBRIC =================

export async function fetchRubricCriteria(): Promise<RubricCriterion[]> {
  try {
    const result = await safeFetchJson<{ success: boolean; criteria: RubricCriterion[] }>(
      '/api/rubric',
      undefined,
      'Rubrik ölçütleri alınırken'
    );
    if (result.ok && result.data?.success && Array.isArray(result.data.criteria)) {
      return result.data.criteria;
    }
  } catch (err) {}
  return [];
}

export async function updateRubricCriteria(criteria: RubricCriterion[]): Promise<RubricCriterion[]> {
  const result = await safeFetchJson<{ success: boolean; criteria: RubricCriterion[] }>(
    '/api/rubric',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ criteria }),
    },
    'Rubrik güncellenirken'
  );

  if (!result.ok || !result.data?.success || !result.data.criteria) {
    throw new Error(result.error || 'Rubrik güncellenemedi.');
  }

  return result.data.criteria;
}

// ================= TEACHER DASHBOARD STATS =================

export interface TeacherDashboardStats {
  totalSubmitted: number;
  pendingEvaluation: number;
  revisionRequested: number;
  resubmitted: number;
  approved: number;
  publishedInMagazine: number;
  totalStudents: number;
  totalClasses: number;
}

export async function fetchTeacherStats(): Promise<TeacherDashboardStats | null> {
  try {
    const result = await safeFetchJson<{ success: boolean; stats: TeacherDashboardStats }>(
      '/api/teacher/dashboard-stats',
      undefined,
      'Öğretmen paneli istatistikleri alınırken'
    );
    if (result.ok && result.data?.success && result.data.stats) {
      return result.data.stats;
    }
  } catch (err) {}
  return null;
}

// ================= AI EVALUATION =================

export interface EvaluatePayload {
  title: string;
  content: string;
  genre: string;
  place: string;
  time: string;
  character: string;
  surpriseCard: string;
  versionNumber: number;
  wordCount: number;
}

export async function evaluateStoryWithGemini(payload: EvaluatePayload): Promise<AIReview> {
  const result = await safeFetchJson<{ success: boolean; review?: AIReview; error?: string; code?: string }>(
    '/api/evaluate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Yazı değerlendirmesi'
  );

  if (!result.ok || !result.data?.success || !result.data.review) {
    const errorMsg =
      result.error ||
      result.data?.error ||
      'Yapay zekâ değerlendirmesi alınamadı. Lütfen internet bağlantınızı ve sunucu durumunu kontrol ediniz.';
    throw new Error(errorMsg);
  }

  return result.data.review;
}

// ================= CLASSES & TASKS =================

export async function fetchClasses(): Promise<ClassGroup[]> {
  try {
    const result = await safeFetchJson<{ success: boolean; classes: ClassGroup[] }>(
      '/api/classes',
      undefined,
      'Sınıflar yüklenirken'
    );
    if (result.ok && result.data?.success && Array.isArray(result.data.classes)) {
      return result.data.classes;
    }
  } catch (err) {
    console.warn('fetchClasses error:', err);
  }
  return [];
}

export async function createClass(name: string, grade: string, studentCodes: string[]): Promise<ClassGroup | null> {
  try {
    const result = await safeFetchJson<{ success: boolean; classGroup?: ClassGroup }>(
      '/api/classes',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade, studentCodes }),
      },
      'Sınıf oluşturulurken'
    );
    if (result.ok && result.data?.success && result.data.classGroup) {
      return result.data.classGroup;
    }
  } catch (err) {
    console.error('createClass error:', err);
  }
  return null;
}

export async function fetchTasks(): Promise<WritingTask[]> {
  try {
    const result = await safeFetchJson<{ success: boolean; tasks: WritingTask[] }>(
      '/api/tasks',
      undefined,
      'Görevler yüklenirken'
    );
    if (result.ok && result.data?.success && Array.isArray(result.data.tasks)) {
      return result.data.tasks;
    }
  } catch (err) {
    console.warn('fetchTasks error:', err);
  }
  return [];
}

export async function createTask(task: Partial<WritingTask>): Promise<WritingTask | null> {
  try {
    const result = await safeFetchJson<{ success: boolean; task?: WritingTask }>(
      '/api/tasks',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      },
      'Görev oluşturulurken'
    );
    if (result.ok && result.data?.success && result.data.task) {
      return result.data.task;
    }
  } catch (err) {
    console.error('createTask error:', err);
  }
  return null;
}

export async function submitHumanEvaluation(payload: {
  storyId: string;
  versionNumber: number;
  teacherScore: number;
  teacherNotes: string;
  teacherName: string;
  criteriaScores?: Record<string, number>;
}): Promise<AIReview | null> {
  try {
    const result = await safeFetchJson<{ success: boolean; review?: AIReview }>(
      '/api/human-evaluate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      'Öğretmen değerlendirmesi kaydedilirken'
    );
    if (result.ok && result.data?.success && result.data.review) {
      return result.data.review;
    }
  } catch (err) {
    console.error('submitHumanEvaluation error:', err);
  }
  return null;
}

