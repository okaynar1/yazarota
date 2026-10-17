import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  PlusCircle,
  FileSpreadsheet,
  Download,
  CheckCircle,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  TrendingUp,
  FileText,
  Lock,
  Search,
} from 'lucide-react';
import { Story, ClassGroup, WritingTask, GenreType } from '../types';
import { GENRES, RUBRIC_CRITERIA_INFO } from '../data/writingData';
import {
  fetchClasses,
  createClass,
  fetchTasks,
  createTask,
  submitHumanEvaluation,
} from '../services/api';

interface TeacherResearchViewProps {
  stories: Story[];
  onOpenStoryDetail: (story: Story) => void;
}

export const TeacherResearchView: React.FC<TeacherResearchViewProps> = ({
  stories,
  onOpenStoryDetail,
}) => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [tasks, setTasks] = useState<WritingTask[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'tasks' | 'research' | 'grading'>('overview');

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('9. Sınıf');
  const [studentCodeCount, setStudentCodeCount] = useState<number>(5);

  // New Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskGenre, setTaskGenre] = useState<GenreType | 'all'>('all');
  const [taskMinWords, setTaskMinWords] = useState(150);
  const [taskMaxWords, setTaskMaxWords] = useState(500);
  const [taskRequireSurprise, setTaskRequireSurprise] = useState(true);
  const [taskType, setTaskType] = useState<'standard' | 'pre_test' | 'post_test'>('standard');
  const [taskClassId, setTaskClassId] = useState<string>('');

  // Human Grading Modal State
  const [gradingStory, setGradingStory] = useState<Story | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(85);
  const [gradingNotes, setGradingNotes] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('Edebiyat Öğretmeni');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const cls = await fetchClasses();
    setClasses(cls);
    if (cls.length > 0 && !taskClassId) {
      setTaskClassId(cls[0].id);
    }
    const tsk = await fetchTasks();
    setTasks(tsk);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    // Generate anonymous codes
    const codes: string[] = [];
    for (let i = 0; i < studentCodeCount; i++) {
      const code = `OGR-${Math.floor(1000 + Math.random() * 9000)}`;
      codes.push(code);
    }

    const created = await createClass(newClassName.trim(), newClassGrade, codes);
    if (created) {
      setClasses([...classes, created]);
      setNewClassName('');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const created = await createTask({
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      classId: taskClassId || (classes[0]?.id || 'genel'),
      targetGenre: taskGenre,
      minWords: taskMinWords,
      maxWords: taskMaxWords,
      requireSurpriseCard: taskRequireSurprise,
      taskType: taskType,
    });

    if (created) {
      setTasks([created, ...tasks]);
      setTaskTitle('');
      setTaskDesc('');
    }
  };

  const handleSaveTeacherEvaluation = async () => {
    if (!gradingStory) return;
    setIsSubmittingGrade(true);
    const latestVersion = gradingStory.versions[gradingStory.versions.length - 1];

    await submitHumanEvaluation({
      storyId: gradingStory.id,
      versionNumber: latestVersion.versionNumber,
      teacherScore: gradingScore,
      teacherNotes: gradingNotes,
      teacherName: teacherName,
    });

    setIsSubmittingGrade(false);
    setGradingStory(null);
  };

  // Pre-test & Post-test statistics calculation for TÜBİTAK 2204-A
  const preTestStories = stories.filter((s) => s.testType === 'pre_test');
  const postTestStories = stories.filter((s) => s.testType === 'post_test');

  const calcMeanScore = (list: Story[]) => {
    const scores = list
      .map((s) => s.versions[s.versions.length - 1]?.review?.totalScore)
      .filter((sc): sc is number => typeof sc === 'number');
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round((sum / scores.length) * 10) / 10;
  };

  const preTestMean = calcMeanScore(preTestStories);
  const postTestMean = calcMeanScore(postTestStories);
  const deltaMean = Math.round((postTestMean - preTestMean) * 10) / 10;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Teacher Panel Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            <span>TÜBİTAK 2204-A Lise Öğrencileri Araştırma Projeleri Modülü</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
            Öğretmen ve Araştırmacı Paneli
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-serif-literary max-w-2xl">
            Sınıfları yönetin, ön/son test yazma yönergeleri atayın, yapay zekâ ve öğretmen rubrik puanlarını karşılaştırarak bilimsel verileri CSV olarak indirin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="/api/export-csv"
            download="yazarota_arastirma_verileri.csv"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Verileri CSV Dışa Aktar</span>
          </a>
        </div>
      </div>

      {/* Ethical & Legal Consent Banner (Required for TUBITAK 2204-A) */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs font-serif-literary shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-sans font-bold block mb-0.5">
            Araştırma Etiği ve Veli/Okul İzni Hatırlatması:
          </strong>
          TÜBİTAK 2204-A ve bilimsel araştırma süreçlerinde öğrenci adı, soyadı veya kişisel verileri toplanmaz; sistem otomatik olarak <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">OGR-XXXX</code> formatında anonim kodlar kullanır. Araştırma uygulamasından önce ilgili okul müdürlüğü ve veli aydınlatılmış onam formlarının alınmış olması gerekmektedir.
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Genel Bakış
        </button>
        <button
          onClick={() => setActiveTab('research')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'research'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          2204-A Ön/Son Test Analizi
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'classes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sınıflar & Anonim Kodlar ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tasks'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Yazma Görevleri ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'grading'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Öğretmen Rubrik Değerlendirmesi
        </button>
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Toplam Öğrenci Metni</span>
              <div className="text-3xl font-extrabold text-slate-900 font-display mt-1">
                {stories.length}
              </div>
              <div className="text-[11px] text-teal-600 mt-1">Sistemde kayıtlı</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Aktif Çalışma Grubu</span>
              <div className="text-3xl font-extrabold text-slate-900 font-display mt-1">
                {classes.length}
              </div>
              <div className="text-[11px] text-teal-600 mt-1">Sınıf / Kulüp</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Ön / Son Test Görevi</span>
              <div className="text-3xl font-extrabold text-slate-900 font-display mt-1">
                {tasks.filter((t) => t.taskType !== 'standard').length}
              </div>
              <div className="text-[11px] text-amber-600 mt-1">TÜBİTAK eşleştirmeli</div>
            </div>
          </div>

          {/* Student Writings Overview Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold font-display text-slate-900 text-base">
                Son Öğrenci Yazıları ve Süreç Takibi
              </h3>
              <span className="text-xs text-slate-500">{stories.length} Kayıt</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3 pl-5">Anonim Kod</th>
                    <th className="p-3">Başlık</th>
                    <th className="p-3">Tür</th>
                    <th className="p-3">Sürüm</th>
                    <th className="p-3">Kelime</th>
                    <th className="p-3">AI Puanı</th>
                    <th className="p-3">Öğretmen Puanı</th>
                    <th className="p-3 pr-5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stories.map((story) => {
                    const latestVer = story.versions[story.versions.length - 1];
                    const aiScore = latestVer?.review?.totalScore;
                    const teacherScore = latestVer?.review?.humanEvaluation?.teacherScore;

                    return (
                      <tr key={story.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-5 font-mono font-bold text-teal-800">
                          {story.studentCode || 'OGR-GENEL'}
                        </td>
                        <td className="p-3 font-semibold text-slate-900 max-w-[200px] truncate">
                          {story.title || 'Başlıksız'}
                        </td>
                        <td className="p-3 capitalize">{story.genre}</td>
                        <td className="p-3">Sürüm {latestVer?.versionNumber || 1}</td>
                        <td className="p-3">{latestVer?.wordCount || 0} kelime</td>
                        <td className="p-3">
                          {aiScore !== undefined ? (
                            <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {aiScore} P
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {teacherScore !== undefined ? (
                            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {teacherScore} P
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setGradingStory(story);
                                setActiveTab('grading');
                              }}
                              className="text-teal-700 hover:underline font-semibold"
                            >
                              + Puanla
                            </button>
                          )}
                        </td>
                        <td className="p-3 pr-5 text-right">
                          <button
                            onClick={() => onOpenStoryDetail(story)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                          >
                            İncele
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Research Mode 2204-A */}
      {activeTab === 'research' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 font-mono">
                  TÜBİTAK 2204-A Bilimsel Değerlendirme
                </span>
                <h3 className="text-xl font-bold font-display text-slate-900 mt-1">
                  Ön Test vs Son Test Karşılaştırmalı Analiz
                </h3>
                <p className="text-xs text-slate-600 font-serif-literary mt-1">
                  Aynı yazma rubriği ile yapılan başlangıç ve sonuç ölçümleri.
                </p>
              </div>

              <a
                href="/api/export-csv"
                download="yazarota_arastirma_verileri.csv"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SPSS / Excel Uyumlu CSV</span>
              </a>
            </div>

            {/* Pre/Post Comparative Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-semibold text-slate-500">Ön Test Ortalama Puanı</span>
                <div className="text-3xl font-extrabold text-slate-900 font-display">
                  {preTestMean > 0 ? `${preTestMean} P` : 'Veri Yok'}
                </div>
                <div className="text-[11px] text-slate-400">N = {preTestStories.length} öğrenci metni</div>
              </div>

              <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                <span className="text-xs font-semibold text-teal-800">Son Test Ortalama Puanı</span>
                <div className="text-3xl font-extrabold text-teal-900 font-display">
                  {postTestMean > 0 ? `${postTestMean} P` : 'Veri Yok'}
                </div>
                <div className="text-[11px] text-teal-700">N = {postTestStories.length} öğrenci metni</div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-xs font-semibold text-emerald-800">Ortalama Değişim (Δ)</span>
                <div className="text-3xl font-extrabold text-emerald-700 font-display">
                  {preTestMean > 0 && postTestMean > 0
                    ? `${deltaMean > 0 ? `+${deltaMean}` : deltaMean} P`
                    : 'Hesaplanamadı'}
                </div>
                <div className="text-[11px] text-emerald-600">Öğrenme etkisi farkı</div>
              </div>
            </div>

            {/* Scientific Caveat / Note */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1 font-serif-literary">
              <p>
                <strong>Bilimsel Sınırlılıklar ve Metodolojik Not:</strong> Ön test ve son test sonuçlarını karşılaştırırken örneklem büyüklüğü (N={preTestStories.length + postTestStories.length}), çalışma süresi ve kontrol grubu etkileri dikkate alınmalıdır. Yapay zekâ değerlendirmeleri insan (öğretmen) rubrik değerlendirmesi ile çapraz doğrulanmalıdır.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Classes & Groups */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Class Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-teal-600" />
              <span>Yeni Sınıf / Çalışma Grubu</span>
            </h3>

            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Grup Adı:</label>
                <input
                  type="text"
                  placeholder="Örn: 9-A Yaratıcı Yazarlık"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kademe:</label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="Hazırlık">Hazırlık Sınıfı</option>
                  <option value="9. Sınıf">9. Sınıf</option>
                  <option value="10. Sınıf">10. Sınıf</option>
                  <option value="11. Sınıf">11. Sınıf</option>
                  <option value="12. Sınıf">12. Sınıf</option>
                  <option value="Yazarlık Kulübü">Yazarlık Kulübü</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Oluşturulacak Anonim Öğrenci Kodu Adedi:
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={studentCodeCount}
                  onChange={(e) => setStudentCodeCount(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition-colors"
              >
                Grup ve Kodları Oluştur
              </button>
            </form>
          </div>

          {/* Classes List */}
          <div className="lg:col-span-2 space-y-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base font-display text-slate-900">{cls.name}</h4>
                    <span className="text-xs text-slate-500">{cls.grade}</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {cls.studentCodes.length} Öğrenci Kodu
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                    Öğrencilere Dağıtılacak Anonim Erişim Kodları:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cls.studentCodes.map((code) => (
                      <span
                        key={code}
                        className="font-mono text-xs font-semibold bg-slate-100 hover:bg-teal-50 px-2 py-0.5 rounded border border-slate-200 text-slate-700 select-all cursor-pointer"
                        title="Tıklayarak kopyalayabilirsiniz"
                      >
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

      {/* TAB 4: Writing Tasks */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Task Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-teal-600" />
              <span>Yeni Yazma Görevi Ata</span>
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Görev Başlığı:</label>
                <input
                  type="text"
                  placeholder="Örn: 2204-A Ön Test Hikâyesi"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Görev Türü:</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="standard">Standart Atölye Görevi</option>
                  <option value="pre_test">TÜBİTAK 2204-A: Ön Test (Pre-Test)</option>
                  <option value="post_test">TÜBİTAK 2204-A: Son Test (Post-Test)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hedef Edebî Tür:</label>
                <select
                  value={taskGenre}
                  onChange={(e) => setTaskGenre(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="all">Tüm Türler Serbest</option>
                  {GENRES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min. Kelime:</label>
                  <input
                    type="number"
                    value={taskMinWords}
                    onChange={(e) => setTaskMinWords(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Maks. Kelime:</label>
                  <input
                    type="number"
                    value={taskMaxWords}
                    onChange={(e) => setTaskMaxWords(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requireSurprise"
                  checked={taskRequireSurprise}
                  onChange={(e) => setTaskRequireSurprise(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <label htmlFor="requireSurprise" className="text-slate-700 select-none">
                  Sürpriz Kartı Kullanımı Zorunlu
                </label>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Açıklama / Yönerge:</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="Öğrencilere yönelik yazma talimatı..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-serif-literary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition-colors"
              >
                Görevi Kaydet ve Yayınla
              </button>
            </form>
          </div>

          {/* Task List */}
          <div className="lg:col-span-2 space-y-4">
            {tasks.map((tsk) => (
              <div
                key={tsk.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        tsk.taskType === 'pre_test'
                          ? 'bg-amber-100 text-amber-800'
                          : tsk.taskType === 'post_test'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {tsk.taskType === 'pre_test'
                        ? 'Ön Test'
                        : tsk.taskType === 'post_test'
                        ? 'Son Test'
                        : 'Standart'}
                    </span>
                    <h4 className="font-bold text-base font-display text-slate-900">{tsk.title}</h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    {tsk.minWords} - {tsk.maxWords} kelime
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-serif-literary leading-relaxed">
                  {tsk.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                  <span>Tür: {tsk.targetGenre === 'all' ? 'Tüm Türler' : tsk.targetGenre}</span>
                  <span>Sürpriz Kartı: {tsk.requireSurpriseCard ? 'Zorunlu' : 'İsteğe Bağlı'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Teacher Rubric Grading */}
      {activeTab === 'grading' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 font-mono">
              Bağımsız Değerlendirici Rubriği
            </span>
            <h3 className="text-xl font-bold font-display text-slate-900 mt-1">
              Öğretmen / İnsan Değerlendirmesi
            </h3>
            <p className="text-xs text-slate-600 font-serif-literary mt-1">
              Yapay zekâ değerlendirmesine ek olarak araştırmacının veya öğretmenin aynı 100 puanlık rubrik üzerinden metni bağımsız puanlaması.
            </p>
          </div>

          {/* Select Story to Grade */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Puanlanacak Öğrenci Metnini Seçiniz:
              </label>
              <select
                value={gradingStory?.id || ''}
                onChange={(e) => {
                  const found = stories.find((s) => s.id === e.target.value);
                  setGradingStory(found || null);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="">-- Metin Seçiniz --</option>
                {stories.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.studentCode || 'ANON'}] {s.title || 'Başlıksız'} ({s.genre})
                  </option>
                ))}
              </select>
            </div>

            {gradingStory && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="pb-3 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 font-display text-base">
                    {gradingStory.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 font-serif-literary whitespace-pre-wrap max-h-48 overflow-y-auto p-3 bg-white rounded-xl border border-slate-200">
                    {gradingStory.versions[gradingStory.versions.length - 1]?.content}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Öğretmen Toplam Puanı (0 - 100):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={gradingScore}
                      onChange={(e) => setGradingScore(parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 outline-none font-bold text-sm text-teal-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Değerlendirici Adı:</label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Öğretmen Niteliksel Geri Bildirimi / Araştırmacı Notu:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Metnin güçlü ve geliştirilebilir yönlerine dair öğretmen yorumu..."
                    value={gradingNotes}
                    onChange={(e) => setGradingNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none font-serif-literary"
                  />
                </div>

                <button
                  onClick={handleSaveTeacherEvaluation}
                  disabled={isSubmittingGrade}
                  className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  {isSubmittingGrade ? 'Kaydediliyor...' : 'Öğretmen Değerlendirmesini Kaydet'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
