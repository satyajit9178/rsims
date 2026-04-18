import { useState } from 'react';
import { loginUser } from '../services/api';

export default function Login({ onLogin, onDemoLogin }) {
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!form.username || !form.password) { setError('Both fields required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await loginUser(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch { setError('Invalid credentials.'); }
    setLoading(false);
  };

  const onKey = e => e.key === 'Enter' && handle();

  return (
    <div className="min-h-screen flex bg-ink-900">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[520px] bg-ink-800 border-r border-ink-600 p-12 relative overflow-hidden">
        {/* Grid texture */}
        <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />

        {/* Amber corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber/5 rounded-bl-[80px]" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber/5 rounded-tr-[60px]" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-amber rounded-lg flex items-center justify-center">
              <span className="font-mono font-bold text-ink-900 text-sm">RS</span>
            </div>
            <span className="font-display font-bold text-white tracking-widest text-sm uppercase">RSIMS</span>
          </div>

          <h1 className="font-display font-extrabold text-5xl text-white leading-tight mb-4">
            Inventory<br/>
            <span className="text-amber">Controlled.</span>
          </h1>
          <p className="text-slate2-dim text-base leading-relaxed max-w-xs">
            Retail stock management built for speed, accuracy, and total visibility.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative space-y-4">
          {[
            ['▦', 'Real-time stock tracking'],
            ['⚡', 'Automated low-stock alerts'],
            ['↗', 'Sales & purchase logging'],
            ['◎', 'Role-based access control'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3">
              <span className="w-8 h-8 bg-amber/10 border border-amber/20 rounded-lg flex items-center justify-center text-amber text-sm">{icon}</span>
              <span className="text-slate2-bright text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom tag */}
        <div className="relative">
          <span className="font-mono text-xs text-ink-500 uppercase tracking-widest">
            v1.0 — Retail Edition
          </span>
        </div>
      </div>

      

      <div className='flex-1 flex flex-col justify-center items-center'>
        {/* ── Right form ── */}
          <div className="w-full max-w-md flex flex-col items-center px-6">
        <div className="w-full max-w-sm fade-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-amber rounded-md flex items-center justify-center">
              <span className="font-mono font-bold text-ink-900 text-xs">RS</span>
            </div>
            <span className="font-display font-bold text-white tracking-widest text-sm">RSIMS</span>
          </div>

          <h2 className="font-display font-bold text-3xl text-white mb-1">Welcome back</h2>
          <p className="text-slate2-dim text-sm mb-8">Sign in to your account to continue.</p>

          {error && <p className="alert-err mb-5">{error}</p>}

          <div className="space-y-4 mb-6">
            <div>
              <label className="field-label">Username</label>
              <input
                className="field"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                onKeyDown={onKey}
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                className="field"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                onKeyDown={onKey}
              />
            </div>
          </div>

          <button
            className="btn-amber w-full py-3 text-base"
            onClick={handle}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          <p className="text-center text-xs text-ink-500 mt-8 font-mono">
            RSIMS · Retail Store IMS
          </p>
        </div>
      </div>

          {/* ── Try Demo ── */}
        <div className="w-full max-w-sm fade-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ink-600" />
            <span className="text-xs font-mono text-slate2-dim uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-ink-600" />
          </div>

          <div className="relative group">
            <button
              className="w-full py-3 rounded-lg border-2 border-dashed border-amber/40 text-amber font-semibold text-sm hover:border-amber hover:bg-amber/5 transition-all duration-200"
              onClick={onDemoLogin}
            >
              ⚡ Try Demo — No signup required
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-ink-700 border border-ink-500 rounded-lg text-xs font-mono text-slate2-bright whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Full access sandbox · Resets on refresh
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink-700" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { role: 'Admin',   desc: 'Full access' },
              { role: 'Manager', desc: 'Stock + reports' },
              { role: 'Staff',   desc: 'Sales only' },
            ].map(r => (
              <div key={r.role} className="bg-ink-700 border border-ink-500 rounded-lg p-2 text-center">
                <div className="text-xs font-mono font-bold text-amber">{r.role}</div>
                <div className="text-xs text-slate2-dim mt-0.5">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
