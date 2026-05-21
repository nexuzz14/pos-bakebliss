import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, UserPlus, Pencil, Trash2, X, Shield,
  ShoppingCart, ChevronDown, Search, CheckCircle, AlertCircle
} from 'lucide-react';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: <Shield size={14} />,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
  },
  cashier: {
    label: 'Kasir',
    icon: <ShoppingCart size={14} />,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
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

  // Add user (via Supabase Admin API — createUser membutuhkan service_role di backend)
  // Di sisi client kita pakai signUp + set metadata, lalu update profile
  const handleAddUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Simpan session saat ini agar tidak ter-logout saat createUser
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      // Sign up user baru (auto-confirm diaktifkan di Supabase → Authentication → Settings)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: { data: { full_name: addForm.full_name } }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Gagal membuat user');

      // Upsert profile dengan role & nama
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: addForm.email,
          full_name: addForm.full_name,
          role_id: parseInt(addForm.role_id)
        });

      if (profileError) throw profileError;

      // Pulihkan session admin yang sedang aktif
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
      showToast('Gagal tambah user: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role_id: parseInt(editUser.role_id),
          full_name: editUser.full_name
        })
        .eq('id', editUser.id);

      if (error) throw error;
      showToast('Data user berhasil diupdate!');
      setEditUser(null);
      fetchData();
    } catch (err) {
      showToast('Gagal update: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      // Hapus profile saja (hard delete auth user butuh service_role key)
      // Auth user tetap ada tapi tidak bisa login karena profile tidak ada
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteUser.id);

      if (error) throw error;
      showToast(`User ${deleteUser.email} berhasil dihapus dari sistem.`);
      setDeleteUser(null);
      fetchData();
    } catch (err) {
      showToast('Gagal hapus: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };


  const getRoleName = (user) => user.roles?.name || 'cashier';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-green-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">👥 Kelola User</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tambah, edit role, dan hapus pengguna</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditUser(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Tambah User</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total User</p>
          <p className="text-2xl font-bold mt-1">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Admin</p>
          <p className="text-2xl font-bold mt-1 text-purple-600">
            {users.filter(u => u.roles?.name === 'admin').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Kasir</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {users.filter(u => u.roles?.name === 'cashier').length}
          </p>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Tambah User Baru</h3>
            <button onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
                <input type="text" value={addForm.full_name}
                  onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="cth: Siti Rahayu"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" value={addForm.email} required
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@bakebliss.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input type="password" value={addForm.password} required minLength={6}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 karakter"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <div className="relative">
                  <select value={addForm.role_id}
                    onChange={e => setAddForm(f => ({ ...f, role_id: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10">
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name === 'admin' ? '🛡 Admin' : '🛒 Kasir'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors">
                {saving ? 'Menyimpan...' : 'Tambah User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Role Form */}
      {editUser && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Edit User</h3>
            <button onClick={() => setEditUser(null)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
                <input type="text" value={editUser.full_name || ''}
                  onChange={e => setEditUser(u => ({ ...u, full_name: e.target.value }))}
                  placeholder="Nama lengkap"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="text" value={editUser.email || ''} disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Ganti Role</label>
                <div className="flex gap-3">
                  {roles.map(r => (
                    <button key={r.id} type="button"
                      onClick={() => setEditUser(u => ({ ...u, role_id: r.id }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-colors ${
                        editUser.role_id === r.id
                          ? r.name === 'admin'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}>
                      {r.name === 'admin' ? <Shield size={16} /> : <ShoppingCart size={16} />}
                      {r.name === 'admin' ? 'Admin' : 'Kasir'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} placeholder="Cari berdasarkan nama atau email..."
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* User List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500">{search ? 'User tidak ditemukan' : 'Belum ada user'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(u => {
              const roleName = getRoleName(u);
              const roleConf = ROLE_CONFIG[roleName] || ROLE_CONFIG.cashier;
              const isMe = u.id === currentUser?.id;

              return (
                <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(u.full_name || u.email || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">
                        {u.full_name || '—'}
                      </span>
                      {isMe && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          Kamu
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleConf.color}`}>
                        {roleConf.icon}
                        {roleConf.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditUser({ ...u, role_id: u.role_id })}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => setDeleteUser(u)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-red-500 dark:text-red-400 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-1">Hapus User?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{deleteUser.email}</span>
            </p>
            <p className="text-red-500 text-sm mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                Batal
              </button>
              <button onClick={handleDeleteUser} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50">
                {saving ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
