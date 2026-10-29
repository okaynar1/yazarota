import React, { useState, useEffect } from 'react';
import {
  Story,
  ClassGroup,
  WritingTask,
  RubricCriterion,
  PublishedWork,
  MagazineIssue,
  TeacherFeedback,
  User,
} from '../types';
import {
  fetchStories,
  fetchTeacherStats,
  TeacherDashboardStats,
  fetchRubricCriteria,
  updateRubricCriteria,
  fetchClasses,
  createClass,
  fetchTasks,
  createTask,
  submitTeacherEvaluation,
  publishStoryToMagazine,
  fetchPublishedWorks,
  fetchMagazineIssues,
  createMagazineIssue,
  changePassword,
} from '../services/api';
import {
  GraduationCap,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  Award,
  Settings,
  BarChart3,
  Download,
  PlusCircle,
  ChevronRight,
  Eye,
  Check,
  RotateCcw,
  Send,
  Lock,
  Layers,
  Heart,
  Calendar,
  X,
  FileSpreadsheet,
  Database,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface TeacherDashboardViewProps {
  currentUser?: User | null;
  onOpenStoryDetail?: (story: Story) => void;
  onRefreshStories?: () => void;
}

type TabType =
  | 'incoming'
  | 'pending'
  | 'revision_requested'
  | 'student_editing'
  | 'resubmitted'
  | 'ready_for_publish'
  | 'magazine_admin'
  | 'classes'
  | 'rubric'
  | 'reports'
  | 'settings';

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  currentUser,
  onOpenStoryDetail,
  onRefreshStories,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [tasks, setTasks] = useState<WritingTask[]>([]);
  const [publishedWorks, setPublishedWorks] = useState<PublishedWork[]>([]);
  const [magazineIssues, setMagazineIssues] = useState<MagazineIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Story Inspection & Grading Modal
  const [inspectingStory, setInspectingStory] = useState<Story | null>(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);

  // Rubric Grading Form State
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [teacherComment, setTeacherComment] = useState('');
  const [checklist, setChecklist] = useState<string[]>(['']);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // Magazine Publish Modal
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pubAuthorType, setPubAuthorType] = useState<'real_name' | 'pseudonym' | 'anonymous'>('pseudonym');
  const [pubDisplayName, setPubDisplayName] = useState('');
  const [pubEditorNotes, setPubEditorNotes] = useState('');
  const [pubSelectedIssueId, setPubSelectedIssueId] = useState('');

  // New Issue Form State
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueTheme, setNewIssueTheme] = useState('');
  const [newIssueEditorNote, setNewIssueEditorNote] = useState('');

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('9. Sınıf');
  const [studentCodeCount, setStudentCodeCount] = useState<number>(5);

  // Password Change State
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');

  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    tablesReady: boolean;
    projectId?: string;
    url?: string;
    message?: string;
  } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const fetchSupabaseStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setSupabaseStatus(data);
    } catch (e) {}
  };

  const handleCopySql = async () => {
    try {
      const res = await fetch('/api/supabase/sql');
      const sqlText = await res.text();
      await navigator.clipboard.writeText(sqlText);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 3000);
    } catch (e) {
      alert('SQL kodu kopyalanamadı.');
    }
  };

  const handleSyncSupabase = async () => {
    setSyncingCloud(true);
    try {
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Tüm veriler başarıyla Supabase bulut veritabanına aktarıldı!');
        await fetchSupabaseStatus();
      } else {
        alert('Senkronizasyon başarısız: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (e: any) {
      alert('Bağlantı hatası: ' + e.message);
    } finally {
      setSyncingCloud(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    fetchSupabaseStatus();
    const [fetchedStories, fetchedStats, fetchedRubric, fetchedClasses, fetchedTasks, fetchedPubs, fetchedIssues] =
      await Promise.all([
        fetchStories(),
        fetchTeacherStats(),
        fetchRubricCriteria(),
        fetchClasses(),
        fetchTasks(),
        fetchPublishedWorks(),
        fetchMagazineIssues(),
      ]);

    setStories(fetchedStories);
    setStats(fetchedStats);
    setRubricCriteria(fetchedRubric);
    setClasses(fetchedClasses);
    setTasks(fetchedTasks);
    setPublishedWorks(fetchedPubs);
    setMagazineIssues(fetchedIssues);
    if (fetchedIssues.length > 0) {
      setPubSelectedIssueId(fetchedIssues[0].id);
    }
    setLoading(false);
  };

  // Open story inspection & initialize rubric grading form
  const handleOpenInspect = (story: Story) => {
    setInspectingStory(story);
    const lastIdx = story.versions.length - 1;
    setSelectedVersionIndex(lastIdx);

    const version = story.versions[lastIdx];
    const prevFeedback = version.teacherFeedback;

    if (prevFeedback) {
      setRubricScores(prevFeedback.rubricScores || {});
      setTeacherComment(prevFeedback.generalComment || '');
      setChecklist(
        prevFeedback.revisionChecklist && prevFeedback.revisionChecklist.length > 0
          ? prevFeedback.revisionChecklist
          : ['']
      );
    } else {
      // Default: 7.5 on all 10 criteria = 75 points
      const defaultScores: Record<string, number> = {};
      rubricCriteria.forEach((crit) => {
        defaultScores[crit.id] = 7.5;
      });
      setRubricScores(defaultScores);
      setTeacherComment('');
      setChecklist(['']);
    }

    setPubDisplayName(story.authorName || story.studentCode);
    setPubEditorNotes('Yayın kurulu ve zümre onayıyla yayımlanmıştır.');
  };

  // Calculate real-time rubric total
  const calculatedTotal = Object.values(rubricScores).reduce((a, b) => a + (Number(b) || 0), 0);

  // Submit teacher evaluation
  const handleGradeSubmit = async (
    decision: 'approved' | 'revision_requested' | 'nominated_for_magazine' | 'published' | 'rejected'
  ) => {
    if (!inspectingStory) return;

    if (decision === 'published') {
      setShowPublishModal(true);
      return;
    }

    setIsSubmittingGrade(true);
    try {
      const activeVersion = inspectingStory.versions[selectedVersionIndex];
      const cleanChecklist = checklist.filter((item) => item.trim().length > 0);

      const { story } = await submitTeacherEvaluation(inspectingStory.id, {
        versionNumber: activeVersion.versionNumber,
        decision,
        generalComment: teacherComment.trim(),
        revisionChecklist: cleanChecklist,
        rubricScores,
        rubricTotal: Math.round(calculatedTotal),
      });

      setInspectingStory(story);
      // Reload stats & stories
      await loadAllData();
      if (onRefreshStories) onRefreshStories();
      alert(`Yazı değerlendirmesi başarıyla kaydedildi (${decision === 'revision_requested' ? 'Düzeltme İstendi' : 'Onaylandı'}).`);
      setInspectingStory(null);
    } catch (err: any) {
      alert(err?.message || 'Değerlendirme kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // Publish to Genç Kalemler Magazine
  const handlePublishSubmit = async () => {
    if (!inspectingStory) return;

    setIsSubmittingGrade(true);
    try {
      await publishStoryToMagazine(inspectingStory.id, {
        authorType: pubAuthorType,
        authorDisplayName: pubDisplayName.trim(),
        teacherEditorNotes: pubEditorNotes.trim(),
        issueId: pubSelectedIssueId,
      });

      setShowPublishModal(false);
      setInspectingStory(null);
      await loadAllData();
      if (onRefreshStories) onRefreshStories();
      alert('Eser başarıyla Genç Kalemler Dergisi’nde yayımlandı!');
    } catch (err: any) {
      alert(err?.message || 'Yayımlama sırasında bir hata oluştu.');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // Create new magazine issue
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;

    try {
      const created = await createMagazineIssue({
        title: newIssueTitle.trim(),
        theme: newIssueTheme.trim(),
        editorNote: newIssueEditorNote.trim(),
      });
      setMagazineIssues([created, ...magazineIssues]);
      setNewIssueTitle('');
      setNewIssueTheme('');
      setNewIssueEditorNote('');
      alert('Yeni dergi sayısı başarıyla oluşturuldu!');
    } catch (err: any) {
      alert(err?.message || 'Yeni sayı oluşturulamadı.');
    }
  };

  // Create new student class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const codes: string[] = [];
    for (let i = 0; i < studentCodeCount; i++) {
      codes.push(`OGR-${Math.floor(1000 + Math.random() * 9000)}`);
    }

    const created = await createClass(newClassName.trim(), newClassGrade, codes);
    if (created) {
      setClasses([...classes, created]);
      setNewClassName('');
      alert('Sınıf grubu ve anonim kodlar oluşturuldu.');
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (newPass.length < 4) {
      setPassErrorMsg('Yeni şifre en az 4 karakter olmalıdır.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassErrorMsg('Şifreler uyuşmuyor.');
      return;
    }

    try {
      await changePassword(oldPass, newPass);
      setPassSuccessMsg('Şifreniz başarıyla güncellendi!');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassErrorMsg(err?.message || 'Şifre güncellenemedi.');
    }
  };

  // Update rubric criteria
  const handleRubricCriterionChange = (critId: string, field: string, value: any) => {
    setRubricCriteria((prev) =>
      prev.map((c) => (c.id === critId ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveRubric = async () => {
    try {
      await updateRubricCriteria(rubricCriteria);
      alert('Değerlendirme rubriği başarıyla kaydedildi.');
    } catch (err: any) {
      alert(err?.message || 'Rubrik güncellenirken hata oluştu.');
    }
  };

  // Categorize stories for the 11 tabs
  const incomingStories = stories.filter((s) => s.status !== 'draft');
  const pendingStories = stories.filter((s) => s.status === 'pending_teacher');
  const revisionRequestedStories = stories.filter((s) => s.status === 'revision_requested');
  const studentEditingStories = stories.filter((s) => s.status === 'revision_requested' && s.versions.length === 1);
  const resubmittedStories = stories.filter((s) => s.status === 'resubmitted');
  const readyForPublishStories = stories.filter((s) => s.status === 'approved' || s.status === 'nominated_for_magazine');

  const navTabs: { id: TabType; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'incoming', label: '1. Gelen Yazılar', count: incomingStories.length, icon: <FileText className="w-4 h-4" /> },
    { id: 'pending', label: '2. Değerlendirme Bekleyenler', count: pendingStories.length, icon: <Clock className="w-4 h-4 text-amber-500" /> },
    { id: 'revision_requested', label: '3. Düzeltme İstenenler', count: revisionRequestedStories.length, icon: <RotateCcw className="w-4 h-4 text-rose-500" /> },
    { id: 'student_editing', label: '4. Öğrenci Düzenlemesi Beklenenler', count: studentEditingStories.length, icon: <AlertCircle className="w-4 h-4 text-orange-500" /> },
    { id: 'resubmitted', label: '5. Yeniden Değerlendirilecekler', count: resubmittedStories.length, icon: <CheckCircle className="w-4 h-4 text-indigo-500" /> },
    { id: 'ready_for_publish', label: '6. Yayına Hazır Yazılar', count: readyForPublishStories.length, icon: <Sparkles className="w-4 h-4 text-teal-500" /> },
    { id: 'magazine_admin', label: '7. Genç Kalemler Dergisi', count: publishedWorks.length, icon: <BookOpen className="w-4 h-4 text-cyan-600" /> },
    { id: 'classes', label: '8. Öğrenci / Sınıf Yönetimi', count: classes.length, icon: <Users className="w-4 h-4" /> },
    { id: 'rubric', label: '9. Değerlendirme Rubriği', count: rubricCriteria.length, icon: <Award className="w-4 h-4" /> },
    { id: 'reports', label: '10. Raporlar & İstatistikler', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: '11. Hesap Ayarları', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl border border-amber-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>YAZAROTA Öğretmen & İnceleme Kurulu Paneli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              Öğretmen Değerlendirme ve Edebiyat Yönetimi
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-serif-literary max-w-2xl">
              Öğrenci yazılarını analitik rubrik ile inceleyin, somut geri bildirimler verin, revizyonları takip edin ve seçkin eserleri Genç Kalemler okul dergisinde yayımlayın.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/export-csv"
              download
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Tüm Verileri İndir (.CSV)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 6 Real Statistics Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">1. Gelen Yazılar</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalSubmitted ?? incomingStories.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Öğrencilerden gelen</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/40">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">2. Bekleyenler</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{stats?.pendingEvaluation ?? pendingStories.length}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">İnceleme sırasındaki</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/30">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">3. Düzeltme İstenen</div>
          <div className="text-2xl font-bold text-rose-800 mt-1">{stats?.revisionRequested ?? revisionRequestedStories.length}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Revizyon talep edilen</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/30">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">4. Yeniden Gelenler</div>
          <div className="text-2xl font-bold text-indigo-800 mt-1">{stats?.resubmitted ?? resubmittedStories.length}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">Düzenlenip iletilen</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-xs bg-teal-50/30">
          <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">5. Yayına Hazır</div>
          <div className="text-2xl font-bold text-teal-800 mt-1">{stats?.approved ?? readyForPublishStories.length}</div>
          <div className="text-[10px] text-teal-600 mt-0.5">Onaylanmış eserler</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cyan-200 shadow-xs bg-cyan-50/30">
          <div className="text-[11px] font-semibold text-cyan-800 uppercase tracking-wider">6. Genç Kalemler</div>
          <div className="text-2xl font-bold text-cyan-900 mt-1">{stats?.publishedInMagazine ?? publishedWorks.length}</div>
          <div className="text-[10px] text-cyan-700 mt-0.5">Dergide yayımlanan</div>
        </div>
      </div>

      {/* 11 Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* TABS 1-6: STORY LISTS */}
      {['incoming', 'pending', 'revision_requested', 'student_editing', 'resubmitted', 'ready_for_publish'].includes(activeTab) && (
        <div className="space-y-4">
          {(() => {
            let list: Story[] = [];
            let emptyMsg = '';

            if (activeTab === 'incoming') {
              list = incomingStories;
              emptyMsg = 'Henüz incelenecek gelen yazı bulunmuyor.';
            } else if (activeTab === 'pending') {
              list = pendingStories;
              emptyMsg = 'Değerlendirme bekleyen yazı kalmadı, tebrikler!';
            } else if (activeTab === 'revision_requested') {
              list = revisionRequestedStories;
              emptyMsg = 'Düzeltme talep edilmiş herhangi bir yazı bulunmuyor.';
            } else if (activeTab === 'student_editing') {
              list = studentEditingStories;
              emptyMsg = 'Öğrencinin üzerinde çalıştığı bekleyen revizyon bulunmuyor.';
            } else if (activeTab === 'resubmitted') {
              list = resubmittedStories;
              emptyMsg = 'Yeniden değerlendirilecek revizyon metni bulunmuyor.';
            } else if (activeTab === 'ready_for_publish') {
              list = readyForPublishStories;
              emptyMsg = 'Onaylanmış veya yayına seçilmiş yeni eser henüz yok.';
            }

            if (list.length === 0) {
              return (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">{emptyMsg}</p>
                </div>
              );
            }

            return (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {list.map((story) => {
                  const latestV = story.versions[story.versions.length - 1];
                  const aiScore = latestV.review?.totalScore;
                  const teacherScore = latestV.teacherFeedback?.rubricTotal;

                  return (
                    <div
                      key={story.id}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-slate-900 text-sm">
                            {story.title || 'Başlıksız Eser'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                            {story.genre}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-medium">
                            {story.authorName || story.authorUsername || story.studentCode}
                          </span>
                          {story.authorClass && (
                            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold text-[10px] border border-teal-200">
                              {story.authorClass}
                            </span>
                          )}
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            Sürüm {story.currentVersionNumber || story.versions.length}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-serif-literary line-clamp-2">
                          “{latestV.content.slice(0, 160)}...”
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                          <span>Kelime: {latestV.wordCount}</span>
                          <span>•</span>
                          <span>
                            Son Güncelleme:{' '}
                            {new Date(story.updatedAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {aiScore && (
                            <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                              AI Puanı: {aiScore}/100
                            </span>
                          )}
                          {teacherScore && (
                            <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Öğretmen Rubriği: {teacherScore}/100
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => handleOpenInspect(story)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Analitik Rubrikle İncele</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 7: GENÇ KALEMLER DERGİ YÖNETİMİ */}
      {activeTab === 'magazine_admin' && (
        <div className="space-y-6">
          {/* Create New Issue Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-teal-600" />
              <span>Yeni Dergi Sayısı Oluştur</span>
            </h3>

            <form onSubmit={handleCreateIssue} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sayı Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Genç Kalemler — Sayı 2: Zamanın Kıyısında"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tema / Odak</label>
                <input
                  type="text"
                  placeholder="Örn: Doğa, Hatıra ve Gelecek Düşleri"
                  value={newIssueTheme}
                  onChange={(e) => setNewIssueTheme(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Editör Notu</label>
                <input
                  type="text"
                  placeholder="Öğrencileri ve okuyucuları selamlayan kısa not"
                  value={newIssueEditorNote}
                  onChange={(e) => setNewIssueEditorNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Yeni Sayıyı Yayımla
                </button>
              </div>
            </form>
          </div>

          {/* Published Works in Magazine */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Genç Kalemler Dergisi’nde Yayında Olan Eserler ({publishedWorks.length})</span>
              <span className="text-xs text-slate-500 font-normal">Tüm sayılar</span>
            </h3>

            {publishedWorks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Henüz dergide yayımlanmış eser bulunmuyor.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publishedWorks.map((work) => (
                  <div key={work.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{work.title}</span>
                      <span className="text-teal-700 font-semibold bg-teal-100 px-2 py-0.5 rounded text-[10px]">
                        Sayı {work.issueNumber || 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-serif-literary line-clamp-2">
                      “{work.content.slice(0, 120)}...”
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Yazar: <strong>{work.authorDisplayName}</strong> ({work.authorType})</span>
                      <span>❤️ {work.likesCount || 0} Beğeni</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: ÖĞRENCİ VE SINIF YÖNETİMİ */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Create New Class */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-600" />
              <span>Yeni Sınıf / Edebiyat Grubu Oluştur</span>
            </h3>

            <form onSubmit={handleCreateClass} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grup Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 10-C Yaratıcı Yazarlık"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kademe</label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="9. Sınıf">9. Sınıf</option>
                  <option value="10. Sınıf">10. Sınıf</option>
                  <option value="11. Sınıf">11. Sınıf</option>
                  <option value="12. Sınıf">12. Sınıf</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Öğrenci Kod Sayısı (Anonim Eşleştirme)
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={studentCodeCount}
                  onChange={(e) => setStudentCodeCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Sınıfı ve Kodları Oluştur
                </button>
              </div>
            </form>
          </div>

          {/* Classes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                    {cls.grade}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 block mb-1">Kayıtlı Öğrenci Kodları:</span>
                  <div className="flex flex-wrap gap-1">
                    {cls.studentCodes.map((code) => (
                      <span key={code} className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: DEĞERLENDİRME RUBRİĞİ (10 ÖLÇÜT DÜZENLEME) */}
      {activeTab === 'rubric' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>10 Ölçütlü Analitik Yazma Rubriği</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Her ölçüt 10 puan olup toplam 100 tam puan üzerinden değerlendirilir. Öğretmenler ölçüt adlarını ve açıklamalarını özelleştirebilir.
              </p>
            </div>
            <button
              onClick={handleSaveRubric}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Rubriği Kaydet
            </button>
          </div>

          <div className="space-y-4">
            {rubricCriteria.map((crit, idx) => (
              <div key={crit.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={crit.name}
                    onChange={(e) => handleRubricCriterionChange(crit.id, 'name', e.target.value)}
                    className="font-bold text-xs text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-teal-500 w-2/3"
                  />
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Maks. {crit.maxScore} Puan
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={crit.description}
                  onChange={(e) => handleRubricCriterionChange(crit.id, 'description', e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: RAPORLAR VE İSTATİSTİKLER */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span>Gelişim ve Değerlendirme Analitiği</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500">Ortalama Revizyon Sayısı</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {(
                    stories.reduce((acc, s) => acc + (s.versions?.length || 1), 0) /
                    Math.max(1, stories.length)
                  ).toFixed(1)}{' '}
                  Sürüm / Hikâye
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                <span className="text-xs text-teal-700">Dergide Yayımlanma Oranı</span>
                <div className="text-xl font-bold text-teal-900 mt-1">
                  %{((publishedWorks.length / Math.max(1, stories.length)) * 100).toFixed(0)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs text-amber-700">Toplam İncelenen Sürüm</span>
                <div className="text-xl font-bold text-amber-900 mt-1">
                  {stories.reduce((acc, s) => acc + (s.versions?.length || 1), 0)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <span className="text-xs text-indigo-700">Aktif Öğrenci Sayısı</span>
                <div className="text-xl font-bold text-indigo-900 mt-1">
                  {new Set(stories.map((s) => s.authorUsername || s.studentCode)).size}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: HESAP AYARLARI & SUPABASE VERİTABANI */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Öğretmen Şifre Güncelleme */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Öğretmen Hesabı Şifresini Değiştir</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-3">
              {passErrorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  {passErrorMsg}
                </div>
              )}
              {passSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
                  {passSuccessMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mevcut Şifre</label>
                <input
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Yeni Şifre Tekrar</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Şifreyi Güncelle
              </button>
            </form>
          </div>

          {/* Supabase Bulut Veritabanı Bilgileri & SQL Aracı */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase Bulut Veritabanı</span>
              </h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  supabaseStatus?.tablesReady
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    supabaseStatus?.tablesReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {supabaseStatus?.tablesReady ? 'Bulut Aktif' : 'SQL Bekleniyor'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-serif-literary">
              YAZAROTA uygulaması, verilerini Supabase bulut veritabanınızla otomatik eşitleyecek şekilde yapılandırılmıştır.
            </p>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Project ID:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {supabaseStatus?.projectId || 'rxobuyiyiytiijggozyx'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Data API:</span>
                <span className="font-mono text-[11px] text-slate-700 truncate max-w-[200px]" title={supabaseStatus?.url}>
                  {supabaseStatus?.url || 'https://rxobuyiyiytiijggozyx.supabase.co'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Durum:</span>
                <span className="font-medium text-slate-700">
                  {supabaseStatus?.message || 'Bağlantı kuruldu.'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleCopySql}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                {sqlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{sqlCopied ? 'SQL Kodu Kopyalandı!' : 'Supabase SQL Kodunu Kopyala'}</span>
              </button>

              <button
                onClick={handleSyncSupabase}
                disabled={syncingCloud}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
                <span>{syncingCloud ? 'Eşitleniyor...' : 'Şimdi Bulutla Eşitle'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 space-y-1">
              <p className="font-semibold text-amber-900">Kurulum Adımı:</p>
              <p>
                1. Yukarıdaki <strong>“Supabase SQL Kodunu Kopyala”</strong> butonuna tıklayınız.
              </p>
              <p>
                2. Supabase kontrol panelinizde sol menüden <strong>SQL Editor</strong> &rarr; <strong>New query</strong> sekmesini açınız.
              </p>
              <p>
                3. Kodu yapıştırıp <strong>Run</strong> butonuna basınız. Tüm tablolarınız ve izinleriniz saniyeler içinde kurulacaktır.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STORY INSPECTION & 10-CRITERIA ANALYTIC RUBRIC MODAL */}
      {inspectingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    {inspectingStory.title || 'Başlıksız Eser'} — İnceleme ve Değerlendirme
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Öğrenci: {inspectingStory.authorName || inspectingStory.studentCode}
                    {inspectingStory.authorClass && ` (${inspectingStory.authorClass})`} • Tür: {inspectingStory.genre}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Sürüm Seçici */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                  {inspectingStory.versions.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVersionIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedVersionIndex === idx
                          ? 'bg-amber-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sürüm {v.versionNumber}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setInspectingStory(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Two-Column Body */}
            <div className="overflow-y-auto flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Story Text & Cards (5 Cols) */}
              <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-200 lg:pr-6">
                {/* Prompt Cards */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-1.5 text-slate-700">
                  <div><strong>Mekân:</strong> {inspectingStory.place}</div>
                  <div><strong>Zaman:</strong> {inspectingStory.time}</div>
                  <div><strong>Karakter:</strong> {inspectingStory.character}</div>
                  <div className="text-teal-700 font-semibold">
                    <strong>Sürpriz Kart:</strong> {inspectingStory.surpriseCard}
                  </div>
                </div>

                {/* Story Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Sürüm {inspectingStory.versions[selectedVersionIndex]?.versionNumber} Metni
                    </span>
                    <span>{inspectingStory.versions[selectedVersionIndex]?.wordCount} Kelime</span>
                  </div>

                  <div className="p-4 bg-amber-50/20 rounded-2xl border border-slate-200 max-h-[380px] overflow-y-auto font-serif-literary text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {inspectingStory.versions[selectedVersionIndex]?.content}
                  </div>
                </div>

                {/* AI Review Summary (if available) */}
                {inspectingStory.versions[selectedVersionIndex]?.review && (
                  <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-900 space-y-1">
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>Yapay Zekâ Ön İncelemesi</span>
                      <span>{inspectingStory.versions[selectedVersionIndex]?.review?.totalScore}/100</span>
                    </div>
                    <p className="text-[11px] italic font-serif-literary line-clamp-3">
                      “{inspectingStory.versions[selectedVersionIndex]?.review?.generalReview}”
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: 10-Criteria Analytic Rubric Scoring (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Rubric Score Banner */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
                      Analitik Rubrik Toplam Puanı
                    </span>
                    <span className="text-2xl font-bold text-amber-950">
                      {Math.round(calculatedTotal)} <span className="text-sm font-normal text-amber-700">/ 100</span>
                    </span>
                  </div>

                  <div className="text-right text-xs">
                    <span className="px-3 py-1 rounded-full font-bold text-white bg-amber-600">
                      {calculatedTotal >= 85 ? 'Çok İyi' : calculatedTotal >= 70 ? 'Yeterli' : 'Geliştirilmeli'}
                    </span>
                  </div>
                </div>

                {/* 10 Criteria Performance Level Selectors */}
                <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                  {rubricCriteria.map((crit) => {
                    const currentVal = rubricScores[crit.id] ?? 7.5;

                    return (
                      <div key={crit.id} className="p-3 rounded-2xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{crit.name}</span>
                          <span className="font-bold text-teal-700 text-[11px]">{currentVal} Puan</span>
                        </div>

                        {/* 4 Performance Level Buttons */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { level: 1, label: 'Geliştirilmeli', score: 2.5 },
                            { level: 2, label: 'Kısmen Yeterli', score: 5.0 },
                            { level: 3, label: 'Yeterli', score: 7.5 },
                            { level: 4, label: 'Çok İyi', score: 10.0 },
                          ].map((lvl) => {
                            const isSelected = currentVal === lvl.score;
                            return (
                              <button
                                key={lvl.level}
                                type="button"
                                onClick={() =>
                                  setRubricScores((prev) => ({ ...prev, [crit.id]: lvl.score }))
                                }
                                className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all text-center ${
                                  isSelected
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {lvl.label}
                                <span className="block opacity-80 text-[9px]">{lvl.score}p</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Teacher Comment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Öğretmen Genel Değerlendirme Notu
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Öğrencinin güçlü yönlerini belirten ve motivasyon sağlayan yapıcı notunuz..."
                    value={teacherComment}
                    onChange={(e) => setTeacherComment(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Revision Checklist (if revision requested) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Öğrenciden İstenen Somut Düzeltme Maddeleri
                    </label>
                    <button
                      type="button"
                      onClick={() => setChecklist([...checklist, ''])}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                    >
                      + Madde Ekle
                    </button>
                  </div>
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-1.5">
                      <input
                        type="text"
                        placeholder={`Düzeltme maddesi ${idx + 1} (örn: 2. paragrafta mekân betimlemesini artır)`}
                        value={item}
                        onChange={(e) => {
                          const next = [...checklist];
                          next[idx] = e.target.value;
                          setChecklist(next);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      {checklist.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-slate-600 text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Decision Action Buttons */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    disabled={isSubmittingGrade}
                    onClick={() => handleGradeSubmit('revision_requested')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Düzeltme İste
                  </button>

                  <button
                    disabled={isSubmittingGrade}
                    onClick={() => handleGradeSubmit('approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Onayla
                  </button>

                  <button
                    disabled={isSubmittingGrade}
                    onClick={() => handleGradeSubmit('nominated_for_magazine')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Genç Kalemler İçin Seç
                  </button>

                  <button
                    disabled={isSubmittingGrade}
                    onClick={() => setShowPublishModal(true)}
                    className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Dergide Yayımla</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAGAZINE PUBLISH MODAL */}
      {showPublishModal && inspectingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <span>Genç Kalemler Yayın Onayı</span>
              </h3>
              <button onClick={() => setShowPublishModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yazar İsmi Tercihi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'real_name', label: 'Gerçek İsim' },
                    { id: 'pseudonym', label: 'Mahlas / Takma Ad' },
                    { id: 'anonymous', label: 'Anonim' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPubAuthorType(t.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                        pubAuthorType === t.id
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {pubAuthorType !== 'anonymous' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dergide Görünecek Yazar Adı
                  </label>
                  <input
                    type="text"
                    value={pubDisplayName}
                    onChange={(e) => setPubDisplayName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yayımlanacak Dergi Sayısı
                </label>
                <select
                  value={pubSelectedIssueId}
                  onChange={(e) => setPubSelectedIssueId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  {magazineIssues.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      Sayı {issue.issueNumber}: {issue.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yayın Kurulu & Öğretmen Notu
                </label>
                <textarea
                  rows={2}
                  value={pubEditorNotes}
                  onChange={(e) => setPubEditorNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handlePublishSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm"
              >
                Son Yayın Onayını Ver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
