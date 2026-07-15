import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  X,
  Shield,
  ShoppingCart,
  Search,
  CheckCircle,
  AlertCircle,
  Crown,
  ChefHat,
  Mail,
  Lock,
  UserCheck
} from 'lucide-react';

const ROLE_CONFIG = {
  admin: {
    label: 'Administrator POS',
    badge: '👑 Admin Executive',
    icon: <Crown size={15} />,
    pill: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
  },
  cashier: {
    label: 'Kasir Cabang',
    badge: '🥐 Kasir Patisserie',
    icon: <ChefHat size={15} />,
    pill: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
  },
};

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const [addForm, setAddForm] = useState({
    email: '', password: '', full_name: '', role_id: '2'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*, roles(id, name)').order('created_at', { ascending: false }),
        supabase.from('roles').select('*')
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      setUsers(profilesRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      showToast('Gagal memuat data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: { data: { full_name: addForm.full_name } }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Gagal membuat user');

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: addForm.email,
          full_name: addForm.full_name,
          role_id: parseInt(addForm.role_id)
        });

      if (profileError) throw profileError;

      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
      }

      showToast(`User ${addForm.email} berhasil ditambahkan!`);
      setAddForm({ email: '', password: '', full_name: '', role_id: '2' });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      showToast('Gagal menambahkan user: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editUser.full_name,
          role_id: parseInt(editUser.role_id)
        })
        .eq('id', editUser.id);

      if (error) throw error;
      showToast('Profil pengguna berhasil diperbarui!');
      setEditUser(null);
      fetchData();
    } catch (err) {
      showToast('Gagal mengupdate user: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteUser.id);

      if (error) throw error;
      showToast('User berhasil dihapus!');
      setDeleteUser(null);
      fetchData();
    } catch (err) {
      showToast('Gagal menghapus user: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
          <div className={`px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
            toast.type === 'error'
              ? 'bg-rose-500 text-white border-rose-400'
              : 'bg-stone-900 text-rose-300 border-rose-500/50'
          }`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-rose-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-rose-500 text-white shadow-sm">
              Hak Akses & Staf
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Manajemen Operator POS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-stone-800 dark:text-stone-100">
            Daftar Pengguna POS
          </h2>
        </div>

        <button
          onClick={() => { setEditUser(null); setShowAddForm(true); }}
          className="bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white px-6 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
        >
          <UserPlus size={18} />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Akun Terdaftar</span>
            <p className="text-2xl font-extrabold font-display text-stone-800 dark:text-stone-100 mt-1">
              {users.length} <span className="text-xs font-normal text-stone-400">Pengguna</span>
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Admin vs Kasir Cabang</span>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm font-bold text-rose-500">
                {users.filter(u => u.roles?.name === 'admin').length} Admin
              </span>
              <span className="text-sm font-bold text-indigo-500">
                {users.filter(u => u.roles?.name === 'cashier').length} Kasir
              </span>
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
            <Shield size={24} />
          </div>
        </div>
      </div>

      {/* Form Add New User MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181620] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-extrabold font-display text-lg text-stone-800 dark:text-stone-100">
                Tambah Pengguna / Kasir Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={addForm.full_name}
                    onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Contoh: Rina Amalia"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Alamat Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="kasir.rina@bakebliss.com"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Kata Sandi (Password)</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Hak Akses (Role)</label>
                  <select
                    value={addForm.role_id}
                    onChange={e => setAddForm(f => ({ ...f, role_id: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-bold"
                  >
                    <option value="2">🥐 Kasir Cabang (Cashier)</option>
                    <option value="1">👑 Admin Executive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50"
                >
                  {saving ? 'Membuat Akun...' : 'Buat Akun Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau email pengguna..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-100/80 dark:bg-[#14131a] border border-stone-200 dark:border-stone-800 outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
          />
        </div>
      </div>

      {/* Users Catalog Grid / List */}
      <div className="bg-white/90 dark:bg-[#1b1a23]/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-stone-600 dark:text-stone-300">Tidak Ada Pengguna Ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {filtered.map(u => {
              const roleName = u.roles?.name || 'cashier';
              const roleInfo = ROLE_CONFIG[roleName] || ROLE_CONFIG.cashier;
              const isCurrent = currentUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-50/70 dark:hover:bg-stone-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-600 text-white flex items-center justify-center font-extrabold font-display text-lg shadow-md shrink-0">
                      {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm text-stone-800 dark:text-stone-100 truncate">
                          {u.full_name || 'Pengguna Tanpa Nama'}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                            (Anda)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 flex items-center gap-1.5 truncate">
                        <Mail size={12} />
                        <span>{u.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`px-3 py-1 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 ${roleInfo.pill}`}>
                      {roleInfo.icon}
                      <span>{roleInfo.badge}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditUser({
                            id: u.id,
                            full_name: u.full_name || '',
                            role_id: String(u.role_id || '2')
                          });
                        }}
                        className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-rose-500 transition-colors"
                        title="Edit Profil/Role"
                      >
                        <Pencil size={15} />
                      </button>
                      {!isCurrent && (
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="p-2 rounded-xl hover:bg-rose-500/15 text-stone-400 hover:text-rose-500 transition-colors"
                          title="Hapus Akun Pengguna"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181620] rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h4 className="font-extrabold font-display text-base text-stone-800 dark:text-stone-100">
                Edit Profil Pengguna
              </h4>
              <button
                onClick={() => setEditUser(null)}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  value={editUser.full_name}
                  onChange={e => setEditUser(u => ({ ...u, full_name: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#131219] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">Hak Akses (Role)</label>
                <select
                  value={editUser.role_id}
                  onChange={e => setEditUser(u => ({ ...u, role_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#131219] border border-stone-200 dark:border-stone-800 outline-none focus:border-rose-500 text-sm font-bold"
                >
                  <option value="2">🥐 Kasir Cabang (Cashier)</option>
                  <option value="1">👑 Admin Executive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-stone-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 text-white font-extrabold text-xs shadow-md"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181620] rounded-3xl p-6 max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div>
              <h4 className="font-extrabold font-display text-base text-stone-800 dark:text-stone-100">Hapus Pengguna Ini?</h4>
              <p className="text-xs text-stone-400 mt-1">Akun {deleteUser.email} akan dihapus dan tidak bisa login lagi.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 font-bold text-xs text-stone-600 dark:text-stone-300"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
