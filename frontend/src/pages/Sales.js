import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';

export default function Sales() {
  const api = useApi();
  const [sales, setSales]       = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ product_id: '', quantity: '' });
  const [msg, setMsg]           = useState({ t: '', m: '' });
  const [preview, setPreview]   = useState(null);

  const load = async () => {
    setLoading(true);
    const [s, p] = await Promise.all([api.getSales(), api.getProducts()]);
    setSales(s.data); setProducts(p.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const p = products.find(x => x.id === Number(form.product_id));
    if (p && form.quantity > 0) {
      setPreview({ name: p.product_name, available: p.current_stock, total: (p.selling_price * form.quantity).toFixed(2), enough: p.current_stock >= Number(form.quantity) });
    } else setPreview(null);
  }, [form.product_id, form.quantity, products]);

  const handleSale = async () => {
    if (!form.product_id || !form.quantity) { setMsg({ t:'err', m:'Select product and quantity.' }); return; }
    try {
      const res = await api.addSale({ product_id: Number(form.product_id), quantity: Number(form.quantity) });
      const d = res.data;
      setMsg({ t: d.alert ? 'warn' : 'ok', m: `✓ Sale recorded. ₹${d.total_price} | Remaining: ${d.remaining_stock}${d.alert ? ' | ' + d.alert : ''}` });
      setForm({ product_id: '', quantity: '' });
      load();
      setTimeout(() => { setModal(false); setMsg({ t:'', m:'' }); }, 1800);
    } catch (e) { setMsg({ t:'err', m: e.response?.data?.message || 'Error.' }); }
  };

  const totalRevenue = sales.reduce((s, x) => s + Number(x.total_price), 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-sub">{sales.length} transactions · ₹{totalRevenue.toFixed(2)} total revenue</p>
        </div>
        <button className="btn-success" onClick={() => { setModal(true); setMsg({ t:'', m:'' }); }}>+ Record Sale</button>
      </div>

      <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
        {loading ? <div className="text-center text-slate2-dim py-16 font-mono text-sm">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Product</th><th>Qty</th><th>Total</th><th>Sold By</th><th>Date</th></tr>
              </thead>
              <tbody>
                {sales.length === 0 && <tr><td colSpan="6" className="text-center text-slate2-dim py-10 font-mono text-sm">No sales yet.</td></tr>}
                {sales.map(s => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs text-slate2-dim">#{s.id}</td>
                    <td className="font-semibold text-white">{s.product_name}</td>
                    <td><span className="badge-ok">{s.quantity}</span></td>
                    <td className="font-mono text-good font-semibold">₹{Number(s.total_price).toFixed(2)}</td>
                    <td className="text-slate2-dim text-sm">{s.sold_by}</td>
                    <td className="text-slate2-dim text-xs font-mono">{new Date(s.sale_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title="Record New Sale"
          onClose={() => setModal(false)}
          footer={<>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-success" onClick={handleSale} disabled={preview && !preview.enough}>Confirm Sale</button>
          </>}
        >
          {msg.m && <p className={`${msg.t==='ok'?'alert-ok':msg.t==='warn'?'alert-warn':'alert-err'} mb-4`}>{msg.m}</p>}
          <div className="space-y-4">
            <div>
              <label className="field-label">Select Product *</label>
              <select className="field" value={form.product_id} onChange={e => setForm(p=>({...p, product_id: e.target.value}))}>
                <option value="">— Choose product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.product_name} (Stock: {p.current_stock})</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Quantity *</label>
              <input type="number" min="1" className="field" placeholder="Enter quantity" value={form.quantity} onChange={e => setForm(p=>({...p, quantity: e.target.value}))} />
            </div>

            {preview && (
              <div className={`rounded-xl p-4 border text-sm ${preview.enough ? 'bg-good/5 border-good/20' : 'bg-bad/5 border-bad/20'}`}>
                <p className="font-semibold text-white mb-2">{preview.name}</p>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-slate2-dim">Available</span>
                    <div className={preview.enough ? 'text-good font-bold' : 'text-bad font-bold'}>{preview.available} units</div>
                  </div>
                  <div>
                    <span className="text-slate2-dim">Total Price</span>
                    <div className="text-amber font-bold">₹{preview.total}</div>
                  </div>
                </div>
                {!preview.enough && <p className="text-bad font-semibold mt-2 text-xs">⚠ Insufficient stock</p>}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
