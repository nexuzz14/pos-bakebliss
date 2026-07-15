import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Eye, EyeOff, Sparkles, ChefHat, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, role } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && role) {
      if (role === 'admin' || role === 'manager') {
        navigate('/');
      } else {
        navigate('/cashier');
      }
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#100e14] text-[#f1ece6] p-4 relative overflow-hidden select-none">
      
      {/* Decorative Warm Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-rose-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glass Login Container */}
      <div className="max-w-md w-full relative z-10">
        
        {/* Top Brand Logo & Welcome */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-600 shadow-2xl shadow-rose-500/30 ring-4 ring-white/10 mb-4 animate-float">
            <span className="text-4xl">🥐</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight bg-gradient-to-r from-rose-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
            BakeBliss Patisserie
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-medium tracking-wide">
            Sistem Point of Sale & Manajemen Artisan Bakery
          </p>
        </div>

        {/* Glass Card */}
        <div className="bg-[#181620]/90 backdrop-blur-2xl rounded-3xl border border-rose-500/20 shadow-2xl overflow-hidden p-7 md:p-9 space-y-6">
          
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
            <div>
              <h2 className="text-base font-extrabold font-display text-white">Masuk ke Terminal POS</h2>
              <p className="text-xs text-stone-400">Silahkan login dengan kredensial Anda</p>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldCheck size={20} />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
              <span className="text-rose-400 font-bold">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-2 uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#131219] border border-stone-800 focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 text-white text-sm outline-none transition-all placeholder-stone-600 font-medium"
                  placeholder="admin@bakebliss.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-2 uppercase tracking-wider">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[#131219] border border-stone-800 focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 text-white text-sm outline-none transition-all placeholder-stone-600 font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-rose-500/25 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="animate-pulse flex items-center gap-2">
                  <Sparkles size={16} className="animate-spin" />
                  Memverifikasi Akun...
                </span>
              ) : (
                <>
                  <ChefHat size={18} />
                  <span>Buka Terminal Kasir</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="pt-3 border-t border-stone-800/80 text-center">
            <p className="text-[11px] text-stone-500">
              © 2026 BakeBliss Patisserie POS • Keamanan Terenkripsi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
