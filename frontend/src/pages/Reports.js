import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useDemo } from '../context/DemoContext';

const TABS = [
  { id: 'inventory', label: 'Inventory',  icon: '⬙' },
  { id: 'lowstock',  label: 'Low Stock',  icon: '⚠' },
  { id: 'sales',     label: 'Sales',      icon: '↗' },
  { id: 'purchases', label: 'Purchases',  icon: '↙' },
];

const PDF_TYPES = [
  { value: 'sales',     label: 'Sales Report'     },
  { value: 'purchases', label: 'Purchase Report'  },
  { value: 'inventory', label: 'Inventory Report' },
];

function NumCard({ label, value, color }) {
  return (
    <div className={`bg-ink-800 border rounded-xl p-5 ${color}`}>
      <div className="font-mono font-bold text-2xl mb-1">{value}</div>
      <div className="text-xs font-mono text-slate2-dim uppercase tracking-widest">{label}</div>
    </div>
  );
}

export default function Reports({ user }) {
  const api            = useApi();
  const { isDemo }     = useDemo();

  const [tab, setTab]         = useState('inventory');
  const [data, setData]       = useState({});
  const [loading, setLoading] = useState(false);

  // PDF filter state
  const [pdfType,    setPdfType]    = useState('sales');
  const [pdfLimit,   setPdfLimit]   = useState('20');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMsg,     setPdfMsg]     = useState({ t: '', m: '' });

  const canDownloadPdf = user?.role === 'Admin' || user?.role === 'Manager';

  const loadTab = useCallback(async (t) => {
    if (data[t]) return;
    setLoading(true);
    try {
      let r;
      if (t === 'inventory') r = await api.getInventoryReport();
      if (t === 'lowstock')  r = await api.getLowStockReport();
      if (t === 'sales')     r = await api.getSalesReport();
      if (t === 'purchases') r = await api.getPurchaseReport();
      setData(p => ({ ...p, [t]: r.data }));
    } catch {}
    setLoading(false);
  }, [data, api]);

  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  // Switch tab → clear cache so fresh data loads
  const handleTabChange = (t) => {
    setData({});
    setTab(t);
  };

  // ── PDF Download (real mode only) ──
  const handlePdfDownload = async () => {
    setPdfLoading(true);
    setPdfMsg({ t: '', m: '' });
    try {
      const token = localStorage.getItem('token');
      let url = `https://rsims-production.up.railway.app/reports/pdf?type=${pdfType}&limit=${pdfLimit}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate)   url += `&toDate=${toDate}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const e = await res.json();
        setPdfMsg({ t: 'err', m: e.message || 'Failed to generate PDF.' });
        setPdfLoading(false);
        return;
      }

      const blob    = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setPdfMsg({ t: 'ok', m: '✓ PDF opened in new tab.' });
    } catch {
      setPdfMsg({ t: 'err', m: 'Error connecting to server.' });
    }
    setPdfLoading(false);
  };

  const d = data[tab];

  return (
    <div>
      <h1 className="page-title">Reports</h1>
      <p className="page-sub">Analytics, stock summaries and PDF exports</p>

      {/* ── PDF Panel ── */}
      {canDownloadPdf && (
        isDemo ? (
          /* Demo mode — PDF disabled */
          <div className="bg-ink-800 border border-amber/20 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber text-lg">⬇</span>
              <span className="font-display font-bold text-white text-sm uppercase tracking-wider">
                Export PDF Report
              </span>
              <span className="badge-warn ml-2">Demo Mode</span>
            </div>
            <p className="text-sm text-slate2-dim font-mono">
              PDF export connects to the live backend and is disabled in demo mode.
              <span className="text-amber ml-1">Deploy the project to enable this feature.</span>
            </p>
          </div>
        ) : (
          /* Real mode — full PDF panel */
          <div className="bg-ink-800 border border-amber/25 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-amber text-lg">⬇</span>
              <span className="font-display font-bold text-white text-sm uppercase tracking-wider">
                Export PDF Report
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="field-label">Report Type</label>
                <select className="field" value={pdfType} onChange={e => setPdfType(e.target.value)}>
                  {PDF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Last N Records</label>
                <select className="field" value={pdfLimit} onChange={e => setPdfLimit(e.target.value)}>
                  <option value="10">Last 10</option>
                  <option value="20">Last 20</option>
                  <option value="50">Last 50</option>
                  <option value="100">Last 100</option>
                </select>
              </div>
              <div>
                <label className="field-label">From Date (optional)</label>
                <input type="date" className="field" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div>
                <label className="field-label">To Date (optional)</label>
                <input type="date" className="field" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="btn-amber flex items-center gap-2"
                onClick={handlePdfDownload}
                disabled={pdfLoading}
              >
                {pdfLoading ? 'Generating...' : '⬇ Download PDF'}
              </button>
              {pdfMsg.m && (
                <span className={`text-sm font-mono ${pdfMsg.t === 'ok' ? 'text-good' : 'text-bad'}`}>
                  {pdfMsg.m}
                </span>
              )}
            </div>
          </div>
        )
      )}

      {/* Staff blocked message */}
      {!canDownloadPdf && (
        <div className="bg-ink-800 border border-bad/20 rounded-2xl px-5 py-3 mb-6 text-sm text-bad font-mono">
          ✗ PDF export is restricted to Admin and Manager roles only.
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-ink-600 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold font-body transition-all border-b-2 -mb-px
              ${tab === t.id
                ? 'border-amber text-amber'
                : 'border-transparent text-slate2-dim hover:text-white'}`}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center text-slate2-dim font-mono text-sm py-16">
          Loading report...
        </div>
      )}

      {/* ── Inventory Tab ── */}
      {!loading && tab === 'inventory' && d && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-sm text-slate2-dim">Total products:</span>
            <span className="badge-info">{d.total_products}</span>
          </div>
          <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th><th>Product</th><th>Category</th>
                    <th>Stock</th><th>Reorder</th><th>Price</th>
                    <th>Supplier</th><th>Expiry</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.products?.map(p => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-slate2-dim">{p.sku || '—'}</td>
                      <td className="font-semibold text-white">{p.product_name}</td>
                      <td className="text-slate2-dim text-sm">{p.category || '—'}</td>
                      <td>
                        <span className={p.stock_status === 'LOW STOCK' ? 'badge-low' : 'badge-ok'}>
                          {p.current_stock}
                        </span>
                      </td>
                      <td className="font-mono text-sm text-slate2-dim">{p.reorder_level}</td>
                      <td className="font-mono text-amber">₹{Number(p.selling_price).toFixed(2)}</td>
                      <td className="text-slate2-dim text-sm">{p.supplier_name || '—'}</td>
                      <td className="font-mono text-xs text-slate2-dim">
                        {p.expiry_date ? p.expiry_date.slice(0, 10) : '—'}
                      </td>
                      <td>
                        <span className={p.stock_status === 'LOW STOCK' ? 'badge-low' : 'badge-ok'}>
                          {p.stock_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Low Stock Tab ── */}
      {!loading && tab === 'lowstock' && d && (
        <div>
          <div className={`rounded-xl px-5 py-3 mb-4 text-sm font-semibold font-mono
            ${d.total_low_stock_items > 0 ? 'alert-warn' : 'alert-ok'}`}>
            {d.total_low_stock_items > 0
              ? `⚠ ${d.total_low_stock_items} item(s) need reordering`
              : '✓ All stock levels are healthy'}
          </div>
          <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th><th>Category</th>
                    <th>Current Stock</th><th>Reorder Level</th>
                    <th>Supplier</th><th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items?.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-good py-10 font-mono text-sm">
                        No low stock items.
                      </td>
                    </tr>
                  )}
                  {d.items?.map(p => (
                    <tr key={p.id}>
                      <td className="font-semibold text-white">{p.product_name}</td>
                      <td className="text-slate2-dim text-sm">{p.category || '—'}</td>
                      <td><span className="badge-low">{p.current_stock}</span></td>
                      <td className="font-mono text-sm">{p.reorder_level}</td>
                      <td>{p.supplier_name || '—'}</td>
                      <td className="font-mono text-xs text-slate2-dim">{p.supplier_phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Sales Tab ── */}
      {!loading && tab === 'sales' && d && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <NumCard
              label="Transactions"
              value={d.summary?.total_transactions ?? 0}
              color="border-info/20 text-info"
            />
            <NumCard
              label="Items Sold"
              value={d.summary?.total_items_sold ?? 0}
              color="border-good/20 text-good"
            />
            <NumCard
              label="Revenue"
              value={`₹${Number(d.summary?.total_revenue || 0).toFixed(2)}`}
              color="border-amber/20 text-amber"
            />
          </div>

          <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-ink-600 font-display font-bold text-sm text-white">
              Sales by Product
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Product</th><th>Total Sold</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {d.sales_by_product?.map((p, i) => (
                    <tr key={i}>
                      <td className="font-semibold text-white">{p.product_name}</td>
                      <td><span className="badge-ok">{p.total_sold}</span></td>
                      <td className="font-mono text-good font-semibold">
                        ₹{Number(p.total_revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-ink-600 font-display font-bold text-sm text-white">
              Recent Sales
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>By</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {d.recent_sales?.map(s => (
                    <tr key={s.id}>
                      <td className="font-mono text-xs text-slate2-dim">#{s.id}</td>
                      <td className="font-semibold text-white">{s.product_name}</td>
                      <td>{s.quantity}</td>
                      <td className="font-mono text-good">₹{Number(s.total_price).toFixed(2)}</td>
                      <td className="text-slate2-dim text-sm">{s.sold_by}</td>
                      <td className="font-mono text-xs text-slate2-dim">
                        {new Date(s.sale_date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Purchases Tab ── */}
      {!loading && tab === 'purchases' && d && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <NumCard
              label="Transactions"
              value={d.summary?.total_transactions ?? 0}
              color="border-info/20 text-info"
            />
            <NumCard
              label="Items Purchased"
              value={d.summary?.total_items_purchased ?? 0}
              color="border-amber/20 text-amber"
            />
            <NumCard
              label="Total Spent"
              value={`₹${Number(d.summary?.total_spent || 0).toFixed(2)}`}
              color="border-bad/20 text-bad"
            />
          </div>

          <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Product</th><th>Supplier</th>
                    <th>Qty</th><th>Cost/Unit</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent_purchases?.map(p => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-slate2-dim">#{p.id}</td>
                      <td className="font-semibold text-white">{p.product_name}</td>
                      <td className="text-slate2-dim text-sm">{p.supplier_name}</td>
                      <td><span className="badge-warn">+{p.quantity}</span></td>
                      <td className="font-mono text-warn">
                        ₹{Number(p.cost_at_purchase).toFixed(2)}
                      </td>
                      <td className="font-mono text-xs text-slate2-dim">
                        {new Date(p.purchase_date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}