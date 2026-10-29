import React, { useState } from 'react';
import { User } from '../types';
import { registerStudent, loginUser, changePassword } from '../services/api';
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
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
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
              <h3 className="text-xl font-bold font-display">Öğrenci Kaydı</h3>
              <p className="text-teal-100 text-xs">YAZAROTA yazarlık yolculuğuna başla</p>
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

          <div className="text-center pt-2">
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
  AuthModalProps & { onNeedPasswordChange: (user: User) => void }
> = ({ isOpen, onClose, onSuccess, onNeedPasswordChange }) => {
  const [username, setUsername] = useState('ogretmen');
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
      });

      if (user.role !== 'teacher') {
        setError('Bu hesap öğretmen yetkisine sahip değil.');
        setLoading(false);
        return;
      }

      // Check if first-login password change is mandatory
      if (user.mustChangePassword) {
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

        {/* Security Notice for First Login */}
        <div className="bg-amber-50 border-b border-amber-200 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Varsayılan Giriş:</span> Kullanıcı adı: <code>ogretmen</code>, İlk şifre: <code>123456</code>.
            İlk girişte güvenlik gereği şifre değişikliği zorunludur.
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Öğretmen Kullanıcı Adı</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Örn: 123456"
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
            {loading ? 'Giriş Yapılıyor...' : 'Öğretmen Olarak Giriş Yap'}
          </button>
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
