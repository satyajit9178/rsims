import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';

const EMPTY = { username: '', password: '', role: 'Staff' };

const ROLE_BADGE = {
  Admin:   'badge-role-admin',
  Manager: 'badge-role-manager',
  Staff:   'badge-role-staff',
};

export default function Users({ currentUser }) {
  const api = useApi();

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [msg, setMsg]         = useState({ t: '', m: '' });

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.getUsers();
      setUsers(r.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.username || !form.password) {
      setMsg({ t: 'err', m: 'Username and password required.' });
      return;
    }
    try {
      await api.addUser(form);
      setMsg({ t: 'ok', m: `✓ User "${form.username}" created as ${form.role}.` });
      setForm(EMPTY);
      load();
      setTimeout(() => { setModal(false); setMsg({ t: '', m: '' }); }, 1200);
    } catch (e) {
      setMsg({ t: 'err', m: e.response?.data?.message || 'Error creating user.' });
    }
  };

  const handleDelete = async (id, username) => {
    if (id === currentUser.id) {
      alert("You can't delete your own account.");
      return;
    }
    if (!window.confirm(`Delete user "${username}"?`)) return;
    try {
      await api.deleteUser(id);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error deleting user.');
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">Admin-only · Manage system access and roles</p>
        </div>
        <button
          className="btn-amber"
          onClick={() => { setModal(true); setMsg({ t: '', m: '' }); setForm(EMPTY); }}
        >
          + Add User
        </button>
      </div>

      {/* Role info cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            role: 'Admin',
            color: 'border-amber/20 bg-amber/5',
            badge: 'badge-role-admin',
            desc:  'Full access. Manage users, products, reports, all data.',
          },
          {
            role: 'Manager',
            color: 'border-info/20 bg-info/5',
            badge: 'badge-role-manager',
            desc:  'Manage products, suppliers, purchases. View all reports.',
          },
          {
            role: 'Staff',
            color: 'border-good/20 bg-good/5',
            badge: 'badge-role-staff',
            desc:  'Record sales only. View product availability.',
          },
        ].map(r => (
          <div key={r.role} className={`rounded-xl border p-4 ${r.color}`}>
            <span className={`${r.badge} mb-2 inline-block`}>{r.role}</span>
            <p className="text-xs text-slate2-dim leading-relaxed mt-1">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center text-slate2-dim py-16 font-mono text-sm">
            Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-slate2-dim py-10 font-mono text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-mono text-xs text-slate2-dim">#{u.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ink-600 border border-ink-500 flex items-center justify-center font-mono font-bold text-xs text-slate2-bright">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{u.username}</span>
                        {u.id === currentUser.id && (
                          <span className="badge-ok text-xs">You</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={ROLE_BADGE[u.role] || 'badge-info'}>
                        {u.role}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate2-dim">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {u.id !== currentUser.id ? (
                        <button
                          className="btn-danger text-xs px-3 py-1"
                          onClick={() => handleDelete(u.id, u.username)}
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-xs text-slate2-dim font-mono">Current user</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {modal && (
        <Modal
          title="Add New User"
          onClose={() => setModal(false)}
          footer={<>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-amber" onClick={handleAdd}>Create User</button>
          </>}
        >
          {msg.m && (
            <p className={`${msg.t === 'ok' ? 'alert-ok' : 'alert-err'} mb-4`}>
              {msg.m}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="field-label">Username *</label>
              <input
                className="field"
                placeholder="e.g. john_manager"
                value={form.username}
                onChange={e => f('username', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Password *</label>
              <input
                type="password"
                className="field"
                placeholder="Set a strong password"
                value={form.password}
                onChange={e => f('password', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Role *</label>
              <select
                className="field"
                value={form.role}
                onChange={e => f('role', e.target.value)}
              >
                <option value="Staff">Staff — Record sales only</option>
                <option value="Manager">Manager — Stock + purchases + reports</option>
                <option value="Admin">Admin — Full access</option>
              </select>
            </div>

            {/* Role preview */}
            <div className={`rounded-lg p-3 text-xs border font-mono
              ${form.role === 'Admin'
                ? 'bg-amber/5 border-amber/20 text-amber'
                : form.role === 'Manager'
                ? 'bg-info/5 border-info/20 text-info'
                : 'bg-good/5 border-good/20 text-good'}`}
            >
              {form.role === 'Admin'   && '⚡ Admin: Full system access including user management.'}
              {form.role === 'Manager' && '▦ Manager: Can manage stock, purchases, and view all reports.'}
              {form.role === 'Staff'   && '↗ Staff: Can only record sales and check product availability.'}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}