import React, { useState } from 'react';
import { User } from '../types';
import { registerStudent, registerTeacher, loginUser, changePassword } from '../services/api';
import {
  Lock,
  User as UserIcon,
  KeyRound,
  GraduationCap,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ShieldAlert,
  School,
  Hash,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const StudentRegisterModal: React.FC<AuthModalProps & { onSwitchToLogin: () => void }> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
}) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [classGrade, setClassGrade] = useState('5-A');
  const [pseudonym, setPseudonym] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !name.trim() || !password) {
      setError('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    if (!teacherCode.trim()) {
      setError('Öğretmen kodu alanı zorunludur. Lütfen öğretmeninizden aldığınız kodu giriniz.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler birbiriyle uyuşmuyor.');
      return;
    }

    if (password.length < 4) {
      setError('Şifre en az 4 karakterden oluşmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await registerStudent({
        username: username.trim(),
        name: name.trim(),
        teacherCode: teacherCode.trim().toUpperCase(),
        classGrade: classGrade.trim(),
        pseudonym: pseudonym.trim() || undefined,
        password,
      });
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display">Öğrenci Kaydı</h3>
              <p className="text-teal-100 text-xs">YAZAROTA yazarlık yolculuğuna başla</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mandatory Teacher Code */}
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-1.5">
            <label className="block text-xs font-bold text-teal-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-teal-600" />
                Öğretmen Kodu <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] bg-teal-200/80 text-teal-900 font-semibold px-2 py-0.5 rounded-full">
                Zorunlu Eşleştirme
              </span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: YZR-1001"
              value={teacherCode}
              onChange={(e) => setTeacherCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 rounded-xl border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono tracking-widest uppercase bg-white font-semibold text-teal-900 placeholder:text-slate-400 placeholder:font-normal"
            />
            <p className="text-[11px] text-teal-800 font-serif-literary leading-tight">
              Öğretmeninizden aldığınız kodu giriniz. Yazılarınız, revizyonlarınız ve değerlendirme talepleriniz doğrudan bu öğretmeninize iletilecektir.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ad Soyad <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Ayşe Kaya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kullanıcı Adı <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Örn: aysekaya"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sınıf / Şube
              </label>
              <select
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white cursor-pointer"
              >
                <optgroup label="5. Sınıf">
                  <option value="5-A">5-A</option>
                  <option value="5-B">5-B</option>
                  <option value="5-C">5-C</option>
                </optgroup>
                <optgroup label="6. Sınıf">
                  <option value="6-A">6-A</option>
                  <option value="6-B">6-B</option>
                  <option value="6-C">6-C</option>
                </optgroup>
                <optgroup label="7. Sınıf">
                  <option value="7-A">7-A</option>
                  <option value="7-B">7-B</option>
                  <option value="7-C">7-C</option>
                </optgroup>
                <optgroup label="8. Sınıf">
                  <option value="8-A">8-A</option>
                  <option value="8-B">8-B</option>
                  <option value="8-C">8-C</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yazar Mahlası / Takma Ad <span className="text-slate-400 font-normal">(İsteğe bağlı)</span>
            </label>
            <input
              type="text"
              placeholder="Dergide görünmesini istediğiniz takma ad"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Şifre <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="En az 4 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Şifre Tekrar <span className="text-rose-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-teal-700/20 disabled:opacity-50 mt-2"
          >
            {loading ? 'Kayıt Yapılıyor...' : 'Hesap Oluştur ve Giriş Yap'}
          </button>

          <div className="text-center pt-1 pb-1">
            <span className="text-xs text-slate-500">Zaten bir hesabınız var mı? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline underline-offset-2"
            >
              Giriş Yap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const StudentLoginModal: React.FC<AuthModalProps & { onSwitchToRegister: () => void }> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToRegister,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Kullanıcı adı ve şifre zorunludur.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await loginUser({
        username: username.trim(),
        password,
        role: 'student',
      });
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display">Öğrenci Girişi</h3>
              <p className="text-teal-100 text-xs">Yazılarınıza ve geri bildirimlere erişin</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              required
              placeholder="Kullanıcı adınız (örn: ogrenci1)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Şifreniz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-teal-700/20 disabled:opacity-50"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Henüz hesabınız yok mu? </span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline underline-offset-2"
            >
              Öğrenci Kaydı Aç
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TeacherLoginModal: React.FC<
  AuthModalProps & {
    onNeedPasswordChange?: (user: User) => void;
    onSwitchToRegister?: () => void;
  }
> = ({ isOpen, onClose, onSuccess, onNeedPasswordChange, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Lütfen kullanıcı adı ve şifrenizi giriniz.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await loginUser({
        username: username.trim(),
        password,
        role: 'teacher',
      });

      if (user.role !== 'teacher') {
        setError('Bu giriş alanı yalnızca öğretmenler içindir. Öğrenciler lütfen Öğrenci Girişi alanını kullanınız.');
        setLoading(false);
        return;
      }

      // Check if first-login password change is mandatory (for legacy or flagged users)
      if (user.mustChangePassword && onNeedPasswordChange) {
        onNeedPasswordChange(user);
        onClose();
      } else {
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Öğretmen girişi başarısız. Lütfen şifrenizi kontrol ediniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display">Öğretmen Girişi</h3>
              <p className="text-amber-100 text-xs">YAZAROTA Öğretmen & İnceleme Paneli</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              required
              placeholder="Öğretmen kullanıcı adınız"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Şifreniz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-amber-700/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>

          {onSwitchToRegister && (
            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Henüz öğretmen hesabınız yok mu? </span>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2"
              >
                Öğretmen Kaydı Aç
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export const TeacherRegisterModal: React.FC<
  AuthModalProps & { onSwitchToLogin: () => void }
> = ({ isOpen, onClose, onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !username.trim() || !password) {
      setError('Lütfen Ad Soyad, kullanıcı adı ve şifre alanlarını doldurunuz.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakterden oluşmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle uyuşmuyor.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await registerTeacher({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        school: school.trim() || undefined,
        password,
      });
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Öğretmen kaydı sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display">Öğretmen Kaydı</h3>
              <p className="text-amber-100 text-xs">Kendi öğretmen hesabınızı ve öğrenci kodunuzu oluşturun</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ad Soyad <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Prof. Dr. Kemal Yılmaz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kullanıcı Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: kemal_ogretmen"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Okulu / Kurumu <span className="text-slate-400 font-normal">(İsteğe bağlı)</span>
            </label>
            <input
              type="text"
              placeholder="Örn: Atatürk Ortaokulu"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Şifre <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Şifre Tekrar <span className="text-rose-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            <strong>Bilgi:</strong> Kaydınız tamamlandığında sistem size özel benzersiz bir <strong>Öğretmen Kodu</strong> (örn: YZR-XXXX) üretecektir. Bu kodu öğrencilerinize vererek yalnızca kendi öğrencilerinizin yazılarını değerlendirebilirsiniz.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-amber-700/20 disabled:opacity-50 mt-1 cursor-pointer"
          >
            {loading ? 'Kayıt Yapılıyor...' : 'Öğretmen Hesabı Oluştur ve Giriş Yap'}
          </button>

          <div className="text-center pt-1 pb-1">
            <span className="text-xs text-slate-500">Zaten bir öğretmen hesabınız var mı? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2"
            >
              Giriş Yap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TeacherChangePasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isMandatory?: boolean;
}> = ({ isOpen, onClose, onSuccess, isMandatory = false }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Lütfen mevcut şifrenizi giriniz.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakterden oluşmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler birbiriyle uyuşmuyor.');
      return;
    }

    if (newPassword === '123456' || newPassword === '1234') {
      setError('Lütfen varsayılan ilk şifreden (123456) farklı, güvenli yeni bir şifre belirleyiniz.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Şifre güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
            title={isMandatory ? 'Oturumu Kapat ve İptal Et' : 'Kapat'}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display">Güvenli Şifre Belirleyin</h3>
              <p className="text-amber-100 text-xs">
                {isMandatory ? 'İlk giriş için zorunlu güvenlik adımı' : 'Öğretmen hesabı şifre güncelleme'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isMandatory && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              İlk kez giriş yapmaktasınız. Öğrenci verilerinin gizliliği ve güvenliği için lütfen varsayılan ilk şifrenizi (123456) doğrulayıp en az 6 karakterli yeni şifrenizi belirleyiniz.
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mevcut Şifre</label>
            <input
              type="password"
              required
              placeholder="Mevcut şifreniz (örn: 123456)"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Yeni Güvenli Şifre (En az 6 karakter)</label>
            <input
              type="password"
              required
              placeholder="Yeni şifreniz"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Yeni Şifre Tekrar</label>
            <input
              type="password"
              required
              placeholder="Yeni şifrenizi doğrulayın"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-amber-700/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Güncelleniyor...' : 'Yeni Şifreyi Kaydet ve Devam Et'}
            </button>

            {isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-3 text-slate-500 hover:text-slate-800 text-xs font-medium text-center transition-colors cursor-pointer"
              >
                Vazgeç ve Oturumu Kapat
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
