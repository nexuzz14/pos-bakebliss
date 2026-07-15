import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Key,
  Store,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export function AccountSettingsModal({ isOpen, onClose }) {
  const { user, profile, role, updateProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile'); // profile | security | store
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || 'Pengguna BakeBliss');
  const [storeName, setStoreName] = useState(() => localStorage.getItem('bakebliss_store_name') || 'BakeBliss Patisserie Pusat');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      if (updateProfile) {
        await updateProfile({ full_name: fullName });
      }
      localStorage.setItem('bakebliss_store_name', storeName);
      setMsg({ type: 'success', text: 'Profil dan pengaturan berhasil disimpan!' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Gagal memperbarui profil: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok!' });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setMsg({ type: 'success', text: 'Kata sandi berhasil diperbarui!' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Gagal mengubah kata sandi: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181620] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-indigo-500/15 border-b border-stone-100 dark:border-stone-800 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white font-extrabold font-display text-2xl flex items-center justify-center shadow-lg">
                {(fullName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold font-display text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>{fullName}</span>
                  <Sparkles size={16} className="text-rose-500" />
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  {user?.email || 'email@bakebliss.com'}
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-bold mt-1.5">
                  <Shield size={12} />
                  <span className="uppercase">{role || 'Cashier'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-5 border-t border-stone-200/60 dark:border-stone-800/80 pt-4">
            <button
              onClick={() => { setActiveTab('profile'); setMsg(null); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'profile'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-stone-100 dark:bg-[#14131a] text-stone-600 dark:text-stone-300 hover:bg-rose-500/15'
              }`}
            >
              👤 Profil Saya
            </button>
            <button
              onClick={() => { setActiveTab('security'); setMsg(null); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'security'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-stone-100 dark:bg-[#14131a] text-stone-600 dark:text-stone-300 hover:bg-rose-500/15'
              }`}
            >
              🔒 Keamanan
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4">
          {msg && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
                msg.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{msg.text}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                  Alamat Email (Akun)
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-100 dark:bg-[#121117] border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-sm font-medium cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  *Email utama digunakan untuk kredensial login POS.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                  Nama Cabang / Terminal Toko
                </label>
                <div className="relative">
                  <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-rose-500 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    minLength={6}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru..."
                    minLength={6}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <span>Perbarui Kata Sandi</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
