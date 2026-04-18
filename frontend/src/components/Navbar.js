const NAV = [
  { id: 'dashboard', label: 'Dashboard',  icon: '▦' },
  { id: 'products',  label: 'Products',   icon: '⬙' },
  { id: 'sales',     label: 'Sales',      icon: '↗' },
  { id: 'purchases', label: 'Purchases',  icon: '↙' },
  { id: 'reports',   label: 'Reports',    icon: '≡' },
  { id: 'users',     label: 'Users',      icon: '◎', adminOnly: true },
];

const ROLE_STYLE = {
  Admin:   'badge-role-admin',
  Manager: 'badge-role-manager',
  Staff:   'badge-role-staff',
};

export default function Navbar({ user, page, onNav, onLogout }) {
  return (
    <nav className="sticky top-0 z-40 bg-ink-800 border-b border-ink-600">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between h-14">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-amber rounded-md flex items-center justify-center">
            <span className="font-mono font-bold text-ink-900 text-xs">RS</span>
          </div>
          <span className="font-display font-bold text-white tracking-widest text-sm uppercase">
            RSIMS
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV
            .filter(n => !n.adminOnly || user.role === 'Admin')
            .map(n => (
              <button
                key={n.id}
                onClick={() => onNav(n.id)}
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold
                  transition-all duration-150 font-body tracking-wide
                  ${page === n.id
                    ? 'bg-amber text-ink-900'
                    : 'text-slate2-dim hover:text-white hover:bg-ink-700'}
                `}
              >
                <span className="text-sm">{n.icon}</span>
                {n.label}
              </button>
            ))}
        </div>

        {/* User area */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={ROLE_STYLE[user.role]}>{user.role}</span>
            <span className="text-slate2-dim text-xs font-mono">{user.username}</span>
          </div>
          <button
            onClick={onLogout}
            className="btn-danger text-xs px-3 py-1.5"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
}
