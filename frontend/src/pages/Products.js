import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';

const EMPTY = { sku:'', product_name:'', category:'', cost_price:'', selling_price:'', current_stock:'', reorder_level:'10', supplier_id:'', expiry_date:'' };

export default function Products({ user }) {
  const api = useApi();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [msg, setMsg]           = useState({ t:'', m:'' });

  const load = async () => {
    setLoading(true);
    const [p, s] = await Promise.all([api.getProducts(), api.getSuppliers()]);
    setProducts(p.data); setSuppliers(s.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setMsg({ t:'', m:'' }); setModal(true); };
  const openEdit = p => {
    setEditing(p);
    setForm({ sku: p.sku||'', product_name: p.product_name||'', category: p.category||'', cost_price: p.cost_price||'', selling_price: p.selling_price||'', current_stock: p.current_stock||'', reorder_level: p.reorder_level||'10', supplier_id: p.supplier_id||'', expiry_date: p.expiry_date ? p.expiry_date.slice(0,10) : '' });
    setMsg({ t:'', m:'' }); setModal(true);
  };

  const save = async () => {
    if (!form.product_name || !form.selling_price) { setMsg({ t:'err', m:'Product name and selling price required.' }); return; }
    try {
      editing ? await api.updateProduct(editing.id, form) : await api.addProduct(form);
      setMsg({ t:'ok', m: editing ? 'Product updated.' : 'Product added.' });
      load(); setTimeout(() => { setModal(false); setMsg({ t:'', m:'' }); }, 900);
    } catch (e) { setMsg({ t:'err', m: e.response?.data?.message || 'Error saving.' }); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await api.deleteProduct(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Cannot delete.'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const filtered = products.filter(p =>
    [p.product_name, p.category, p.sku].some(x => x?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">{products.length} products in inventory</p>
        </div>
        <div className="flex gap-3">
          <input
            className="field w-52"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {user.role !== 'Staff' && (
            <button className="btn-amber" onClick={openAdd}>+ Add Product</button>
          )}
        </div>
      </div>

      <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center text-slate2-dim font-mono text-sm py-16">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th><th>Product Name</th><th>Category</th>
                  <th>Stock</th><th>Sell Price</th><th>Supplier</th>
                  <th>Expiry</th><th>Status</th>
                  {user.role !== 'Staff' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan="9" className="text-center text-slate2-dim py-10 font-mono text-sm">No products found.</td></tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-slate2-dim">{p.sku || '—'}</td>
                    <td className="font-semibold text-white">{p.product_name}</td>
                    <td className="text-slate2-dim text-sm">{p.category || '—'}</td>
                    <td>
                      <span className={p.current_stock <= p.reorder_level ? 'badge-low' : 'badge-ok'}>
                        {p.current_stock}
                      </span>
                    </td>
                    <td className="font-mono text-amber">₹{Number(p.selling_price).toFixed(2)}</td>
                    <td className="text-slate2-dim text-sm">{p.supplier_name || '—'}</td>
                    <td className="font-mono text-xs text-slate2-dim">{p.expiry_date ? p.expiry_date.slice(0,10) : '—'}</td>
                    <td>
                      <span className={p.current_stock <= p.reorder_level ? 'badge-low' : 'badge-ok'}>
                        {p.current_stock <= p.reorder_level ? 'LOW' : 'OK'}
                      </span>
                    </td>
                    {user.role !== 'Staff' && (
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-ghost text-xs px-3 py-1" onClick={() => openEdit(p)}>Edit</button>
                          {user.role === 'Admin' && (
                            <button className="btn-danger text-xs px-3 py-1" onClick={() => del(p.id, p.product_name)}>Del</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={editing ? 'Edit Product' : 'Add New Product'}
          onClose={() => setModal(false)}
          footer={<>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-amber" onClick={save}>{editing ? 'Save Changes' : 'Add Product'}</button>
          </>}
        >
          {msg.m && <p className={`${msg.t === 'ok' ? 'alert-ok' : 'alert-err'} mb-4`}>{msg.m}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">SKU</label><input className="field" placeholder="BRCODE-001" value={form.sku} onChange={e => f('sku', e.target.value)} /></div>
            <div><label className="field-label">Product Name *</label><input className="field" placeholder="Parle-G 80g" value={form.product_name} onChange={e => f('product_name', e.target.value)} /></div>
            <div><label className="field-label">Category</label><input className="field" placeholder="Biscuits" value={form.category} onChange={e => f('category', e.target.value)} /></div>
            <div>
              <label className="field-label">Supplier</label>
              <select className="field" value={form.supplier_id} onChange={e => f('supplier_id', e.target.value)}>
                <option value="">— None —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
              </select>
            </div>
            <div><label className="field-label">Cost Price ₹</label><input type="number" className="field" placeholder="0.00" value={form.cost_price} onChange={e => f('cost_price', e.target.value)} /></div>
            <div><label className="field-label">Selling Price ₹ *</label><input type="number" className="field" placeholder="0.00" value={form.selling_price} onChange={e => f('selling_price', e.target.value)} /></div>
            <div><label className="field-label">Current Stock</label><input type="number" className="field" placeholder="0" value={form.current_stock} onChange={e => f('current_stock', e.target.value)} /></div>
            <div><label className="field-label">Reorder Level</label><input type="number" className="field" placeholder="10" value={form.reorder_level} onChange={e => f('reorder_level', e.target.value)} /></div>
            <div className="col-span-2"><label className="field-label">Expiry Date</label><input type="date" className="field" value={form.expiry_date} onChange={e => f('expiry_date', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
