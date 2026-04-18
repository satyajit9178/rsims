import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

function StatCard({ label, value, color, sub, icon }) {
  return (
    <div className="stat-card fade-up">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`font-mono text-xs px-2 py-0.5 rounded-full border ${color}`}>{sub}</span>
      </div>
      <div className={`font-mono font-bold text-3xl mb-1 ${color.includes('amber') ? 'text-amber' : color.includes('good') ? 'text-good' : color.includes('bad') ? 'text-bad' : 'text-info'}`}>
        {value}
      </div>
      <div className="text-xs font-mono text-slate2-dim uppercase tracking-widest">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const api = useApi();
  const [stats, setStats]     = useState(null);
  const [low, setLow]         = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getLowStockReport()])
      .then(([d, l]) => { setStats(d.data); setLow(l.data.items || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate2-dim font-mono text-sm">
      Loading dashboard...
    </div>
  );

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Live inventory overview</p>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="⬙" label="Total Products"
          value={stats?.total_products ?? 0}
          color="border-amber/20 text-amber bg-amber/5"
          sub="In system"
        />
        <StatCard
          icon="⚠" label="Low Stock Alerts"
          value={stats?.low_stock_alerts ?? 0}
          color={stats?.low_stock_alerts > 0 ? "border-bad/20 text-bad bg-bad/5" : "border-good/20 text-good bg-good/5"}
          sub={stats?.low_stock_alerts > 0 ? "Needs reorder" : "All good"}
        />
        <StatCard
          icon="↗" label="Today's Revenue"
          value={`₹${Number(stats?.todays_sales?.revenue || 0).toFixed(0)}`}
          color="border-good/20 text-good bg-good/5"
          sub={`${stats?.todays_sales?.transactions ?? 0} sales`}
        />
        <StatCard
          icon="▤" label="Inventory Value"
          value={`₹${Number(stats?.inventory_value || 0).toFixed(0)}`}
          color="border-info/20 text-info bg-info/5"
          sub="At sell price"
        />
      </div>

      {/* Low stock table */}
      {low.length > 0 ? (
        <div className="bg-ink-800 border border-bad/25 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-bad/20 bg-bad/5">
            <span className="text-bad text-lg">⚠</span>
            <span className="font-display font-bold text-bad text-sm uppercase tracking-wider">
              Low Stock Alert — {low.length} item{low.length > 1 ? 's' : ''} need reorder
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th>
                  <th>Stock</th><th>Reorder At</th>
                  <th>Supplier</th><th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {low.map(item => (
                  <tr key={item.id}>
                    <td className="font-semibold text-white">{item.product_name}</td>
                    <td className="text-slate2-dim">{item.category || '—'}</td>
                    <td><span className="badge-low">{item.current_stock}</span></td>
                    <td className="text-slate2-dim font-mono">{item.reorder_level}</td>
                    <td>{item.supplier_name || '—'}</td>
                    <td className="text-slate2-dim font-mono text-xs">{item.supplier_phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-ink-800 border border-good/25 rounded-2xl px-6 py-10 text-center">
          <div className="text-good text-3xl mb-2">✓</div>
          <p className="text-good font-semibold font-mono text-sm">All stock levels are healthy</p>
          <p className="text-slate2-dim text-xs mt-1">No reorder required at this time</p>
        </div>
      )}
    </div>
  );
}
