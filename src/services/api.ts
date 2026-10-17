import { Story, ClassGroup, WritingTask, AIReview, StoryPrompts } from '../types';

const LOCAL_STORAGE_KEY = 'yazarota_stories_cache';
const STUDENT_CODE_KEY = 'yazarota_student_code';

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

export async function fetchStories(studentCode?: string): Promise<Story[]> {
  try {
    const url = studentCode ? `/api/stories?studentCode=${encodeURIComponent(studentCode)}` : '/api/stories';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Sunucu yanıt vermedi');
    const data = await res.json();
    if (data.success && Array.isArray(data.stories)) {
      // update local cache
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.stories));
      } catch (e) {
        // ignore quota error
      }
      return data.stories;
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
  // Update local cache immediately
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

  // Save to server
  try {
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(story),
    });
    if (!res.ok) throw new Error('Sunucuya kaydedilemedi');
    const data = await res.json();
    if (data.success && data.story) {
      return data.story;
    }
  } catch (err) {
    console.warn('Server save failed, preserved in local cache:', err);
  }

  return story;
}

export async function deleteStory(id: string): Promise<boolean> {
  // Local cache
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const list: Story[] = JSON.parse(cached);
      const filtered = list.filter((s) => s.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {}

  // Server
  try {
    const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('Server delete error:', err);
    return true;
  }
}

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
  const res = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Yapay zekâ değerlendirmesi alınamadı. Lütfen tekrar deneyiniz.');
  }

  return data.review;
}

export async function fetchClasses(): Promise<ClassGroup[]> {
  try {
    const res = await fetch('/api/classes');
    const data = await res.json();
    if (data.success) return data.classes;
  } catch (err) {
    console.warn('fetchClasses error:', err);
  }
  return [];
}

export async function createClass(name: string, grade: string, studentCodes: string[]): Promise<ClassGroup | null> {
  try {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, grade, studentCodes }),
    });
    const data = await res.json();
    if (data.success) return data.classGroup;
  } catch (err) {
    console.error('createClass error:', err);
  }
  return null;
}

export async function fetchTasks(): Promise<WritingTask[]> {
  try {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    if (data.success) return data.tasks;
  } catch (err) {
    console.warn('fetchTasks error:', err);
  }
  return [];
}

export async function createTask(task: Partial<WritingTask>): Promise<WritingTask | null> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    const data = await res.json();
    if (data.success) return data.task;
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
    const res = await fetch('/api/human-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) return data.review;
  } catch (err) {
    console.error('submitHumanEvaluation error:', err);
  }
  return null;
}
