import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';

export default function Purchases({ user }) {
  const api = useApi();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts]   = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState('');   // 'purchase' | 'supplier' | ''
  const [form, setForm]           = useState({ product_id:'', supplier_id:'', quantity:'', cost_at_purchase:'' });
  const [supForm, setSupForm]     = useState({ supplier_name:'', contact_person:'', phone:'', email:'', address:'' });
  const [msg, setMsg]             = useState({ t:'', m:'' });

  const load = async () => {
    setLoading(true);
    const [pu, pr, s] = await Promise.all([api.getPurchases(),api.getProducts(), api.getSuppliers()]);
    setPurchases(pu.data); setProducts(pr.data); setSuppliers(s.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handlePurchase = async () => {
    if (!form.product_id || !form.supplier_id || !form.quantity) { setMsg({ t:'err', m:'Product, supplier and quantity required.' }); return; }
    try {
      const r = await api.addPurchase({ product_id: Number(form.product_id), supplier_id: Number(form.supplier_id), quantity: Number(form.quantity), cost_at_purchase: Number(form.cost_at_purchase)||0 });
      setMsg({ t:'ok', m:`✓ Purchase recorded. New stock: ${r.data.new_stock_level}` });
      setForm({ product_id:'', supplier_id:'', quantity:'', cost_at_purchase:'' });
      load(); setTimeout(() => { setModal(''); setMsg({ t:'', m:'' }); }, 1200);
    } catch (e) { setMsg({ t:'err', m: e.response?.data?.message || 'Error.' }); }
  };

  const handleSupplier = async () => {
    if (!supForm.supplier_name) { setMsg({ t:'err', m:'Supplier name required.' }); return; }
    try {
      await api.addSupplier(supForm);
      setMsg({ t:'ok', m:'✓ Supplier added.' });
      setSupForm({ supplier_name:'', contact_person:'', phone:'', email:'', address:'' });
      load(); setTimeout(() => { setModal(''); setMsg({ t:'', m:'' }); }, 1000);
    } catch (e) { setMsg({ t:'err', m: e.response?.data?.message || 'Error.' }); }
  };

  const openModal = (type) => { setModal(type); setMsg({ t:'', m:'' }); };
  const f  = (k,v) => setForm(p => ({ ...p, [k]: v }));
  const sf = (k,v) => setSupForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-sub">{purchases.length} purchase records · {suppliers.length} suppliers</p>
        </div>
        {user.role !== 'Staff' && (
          <div className="flex gap-3">
            <button className="btn-ghost" onClick={() => openModal('supplier')}>+ Add Supplier</button>
            <button className="btn-amber" onClick={() => openModal('purchase')}>+ Record Purchase</button>
          </div>
        )}
      </div>

      <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
        {loading ? <div className="text-center text-slate2-dim py-16 font-mono text-sm">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Product</th><th>Supplier</th><th>Qty Added</th><th>Cost/Unit</th><th>Total</th><th>Date</th></tr>
              </thead>
              <tbody>
                {purchases.length === 0 && <tr><td colSpan="7" className="text-center text-slate2-dim py-10 font-mono text-sm">No purchases yet.</td></tr>}
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-slate2-dim">#{p.id}</td>
                    <td className="font-semibold text-white">{p.product_name}</td>
                    <td className="text-slate2-dim text-sm">{p.supplier_name}</td>
                    <td><span className="badge-info">+{p.quantity}</span></td>
                    <td className="font-mono text-sm">₹{Number(p.cost_at_purchase).toFixed(2)}</td>
                    <td className="font-mono text-warn font-semibold">₹{(p.cost_at_purchase * p.quantity).toFixed(2)}</td>
                    <td className="text-slate2-dim text-xs font-mono">{new Date(p.purchase_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {modal === 'purchase' && (
        <Modal title="Record New Purchase" onClose={() => setModal('')}
          footer={<><button className="btn-ghost" onClick={() => setModal('')}>Cancel</button><button className="btn-amber" onClick={handlePurchase}>Confirm Purchase</button></>}
        >
          {msg.m && <p className={`${msg.t==='ok'?'alert-ok':'alert-err'} mb-4`}>{msg.m}</p>}
          <div className="space-y-4">
            <div>
              <label className="field-label">Product *</label>
              <select className="field" value={form.product_id} onChange={e => f('product_id', e.target.value)}>
                <option value="">— Select product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.product_name} (Current: {p.current_stock})</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Supplier *</label>
              <select className="field" value={form.supplier_id} onChange={e => f('supplier_id', e.target.value)}>
                <option value="">— Select supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="field-label">Quantity *</label><input type="number" className="field" placeholder="0" value={form.quantity} onChange={e => f('quantity', e.target.value)} /></div>
              <div><label className="field-label">Cost per Unit ₹</label><input type="number" className="field" placeholder="0.00" value={form.cost_at_purchase} onChange={e => f('cost_at_purchase', e.target.value)} /></div>
            </div>
            {form.quantity && form.cost_at_purchase && (
              <div className="bg-warn/5 border border-warn/20 rounded-lg p-3 font-mono text-sm text-warn">
                Total cost: <strong>₹{(form.quantity * form.cost_at_purchase).toFixed(2)}</strong>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Supplier Modal */}
      {modal === 'supplier' && (
        <Modal title="Add New Supplier" onClose={() => setModal('')}
          footer={<><button className="btn-ghost" onClick={() => setModal('')}>Cancel</button><button className="btn-amber" onClick={handleSupplier}>Add Supplier</button></>}
        >
          {msg.m && <p className={`${msg.t==='ok'?'alert-ok':'alert-err'} mb-4`}>{msg.m}</p>}
          <div className="space-y-4">
            <div><label className="field-label">Supplier Name *</label><input className="field" placeholder="ABC Distributors" value={supForm.supplier_name} onChange={e => sf('supplier_name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="field-label">Contact Person</label><input className="field" placeholder="Name" value={supForm.contact_person} onChange={e => sf('contact_person', e.target.value)} /></div>
              <div><label className="field-label">Phone</label><input className="field" placeholder="Phone" value={supForm.phone} onChange={e => sf('phone', e.target.value)} /></div>
            </div>
            <div><label className="field-label">Email</label><input className="field" placeholder="email@example.com" value={supForm.email} onChange={e => sf('email', e.target.value)} /></div>
            <div><label className="field-label">Address</label><input className="field" placeholder="Full address" value={supForm.address} onChange={e => sf('address', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
