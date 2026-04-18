import { state, getNextId } from './demoData';

const ok  = (data) => Promise.resolve({ data });
const err = (msg)  => Promise.reject({ response: { data: { message: msg } } });

// ─── PRODUCTS ────────────────────────────────────────────────────
export const getProducts = () => ok([...state.products]);

export const addProduct = (d) => {
  const p = { ...d, id: getNextId('product'), current_stock: Number(d.current_stock)||0, selling_price: Number(d.selling_price), cost_price: Number(d.cost_price)||0, reorder_level: Number(d.reorder_level)||10, supplier_name: state.suppliers.find(s=>s.id===Number(d.supplier_id))?.supplier_name||'' };
  state.products.push(p);
  return ok({ message: 'Product added successfully', productId: p.id });
};

export const updateProduct = (id, d) => {
  const i = state.products.findIndex(p => p.id === Number(id));
  if (i === -1) return err('Product not found.');
  state.products[i] = { ...state.products[i], ...d, id: Number(id), selling_price: Number(d.selling_price), cost_price: Number(d.cost_price)||0, reorder_level: Number(d.reorder_level)||10, supplier_name: state.suppliers.find(s=>s.id===Number(d.supplier_id))?.supplier_name || state.products[i].supplier_name };
  return ok({ message: 'Product updated successfully' });
};

export const deleteProduct = (id) => {
  const i = state.products.findIndex(p => p.id === Number(id));
  if (i === -1) return err('Product not found.');
  state.products.splice(i, 1);
  return ok({ message: 'Product deleted successfully' });
};

// ─── SUPPLIERS ───────────────────────────────────────────────────
export const getSuppliers = () => ok([...state.suppliers]);

export const addSupplier = (d) => {
  const s = { ...d, id: getNextId('supplier') };
  state.suppliers.push(s);
  return ok({ message: 'Supplier added successfully', supplierId: s.id });
};

// ─── SALES ───────────────────────────────────────────────────────
export const getSales = () =>
  ok([...state.sales].sort((a,b) => new Date(b.sale_date) - new Date(a.sale_date)));

export const addSale = ({ product_id, quantity }) => {
  const p = state.products.find(x => x.id === Number(product_id));
  if (!p)               return err('Product not found.');
  if (p.current_stock < quantity) return err(`Insufficient stock. Available: ${p.current_stock}, Requested: ${quantity}`);

  const total_price = p.selling_price * quantity;
  p.current_stock  -= quantity;

  const sale = { id: getNextId('sale'), product_id: p.id, product_name: p.product_name, quantity, total_price, sold_by: 'demo_admin', sale_date: new Date().toISOString() };
  state.sales.unshift(sale);

  const newStock = p.current_stock;
  const alert    = newStock <= p.reorder_level ? `⚠️ Low stock: ${p.product_name} has only ${newStock} units left.` : null;

  return ok({ message:'Sale recorded successfully', saleId: sale.id, product: p.product_name, quantity_sold: quantity, total_price, remaining_stock: newStock, alert });
};

// ─── PURCHASES ───────────────────────────────────────────────────
export const getPurchases = () =>
  ok([...state.purchases].sort((a,b) => new Date(b.purchase_date) - new Date(a.purchase_date)));

export const addPurchase = ({ product_id, supplier_id, quantity, cost_at_purchase }) => {
  const p = state.products.find(x => x.id === Number(product_id));
  const s = state.suppliers.find(x => x.id === Number(supplier_id));
  if (!p) return err('Product not found.');
  if (!s) return err('Supplier not found.');

  p.current_stock += Number(quantity);

  const purchase = { id: getNextId('purchase'), product_id: p.id, product_name: p.product_name, supplier_id: s.id, supplier_name: s.supplier_name, quantity: Number(quantity), cost_at_purchase: Number(cost_at_purchase)||0, purchase_date: new Date().toISOString() };
  state.purchases.unshift(purchase);

  return ok({ message:'Purchase recorded successfully', purchaseId: purchase.id, product: p.product_name, quantity_added: quantity, new_stock_level: p.current_stock });
};

// ─── REPORTS ─────────────────────────────────────────────────────
export const getDashboard = () => {
  const today     = new Date().toDateString();
  const todaySales = state.sales.filter(s => new Date(s.sale_date).toDateString() === today);
  const revenue    = todaySales.reduce((sum, s) => sum + Number(s.total_price), 0);
  const lowStock   = state.products.filter(p => p.current_stock <= p.reorder_level).length;
  const invValue   = state.products.reduce((sum, p) => sum + (p.current_stock * p.selling_price), 0);
  return ok({ total_products: state.products.length, low_stock_alerts: lowStock, todays_sales: { revenue, transactions: todaySales.length }, inventory_value: invValue });
};

export const getInventoryReport = () => {
  const products = state.products.map(p => ({ ...p, stock_status: p.current_stock <= p.reorder_level ? 'LOW STOCK' : 'OK' }))
    .sort((a,b) => a.current_stock - b.current_stock);
  return ok({ total_products: products.length, products });
};

export const getLowStockReport = () => {
  const items = state.products
    .filter(p => p.current_stock <= p.reorder_level)
    .map(p => ({ ...p, supplier_phone: state.suppliers.find(s=>s.id===p.supplier_id)?.phone||'' }))
    .sort((a,b) => a.current_stock - b.current_stock);
  return ok({ total_low_stock_items: items.length, items });
};

export const getSalesReport = () => {
  const total_transactions = state.sales.length;
  const total_items_sold   = state.sales.reduce((s,x) => s + Number(x.quantity), 0);
  const total_revenue      = state.sales.reduce((s,x) => s + Number(x.total_price), 0);

  const byProduct = {};
  state.sales.forEach(s => {
    if (!byProduct[s.product_name]) byProduct[s.product_name] = { product_name: s.product_name, total_sold: 0, total_revenue: 0 };
    byProduct[s.product_name].total_sold    += Number(s.quantity);
    byProduct[s.product_name].total_revenue += Number(s.total_price);
  });

  const recent_sales = [...state.sales].sort((a,b) => new Date(b.sale_date)-new Date(a.sale_date)).slice(0,10);

  return ok({ summary: { total_transactions, total_items_sold, total_revenue }, sales_by_product: Object.values(byProduct).sort((a,b)=>b.total_sold-a.total_sold), recent_sales });
};

export const getPurchaseReport = () => {
  const total_transactions     = state.purchases.length;
  const total_items_purchased  = state.purchases.reduce((s,x) => s + Number(x.quantity), 0);
  const total_spent            = state.purchases.reduce((s,x) => s + (Number(x.quantity)*Number(x.cost_at_purchase)), 0);
  const recent_purchases       = [...state.purchases].sort((a,b)=>new Date(b.purchase_date)-new Date(a.purchase_date)).slice(0,10);
  return ok({ summary: { total_transactions, total_items_purchased, total_spent }, recent_purchases });
};

// ─── USERS ───────────────────────────────────────────────────────
export const getUsers = () => ok([...state.users]);

export const addUser = ({ username, password, role }) => {
  if (state.users.find(u => u.username === username)) return err('Username already exists.');
  const u = { id: getNextId('user'), username, role, created_at: new Date().toISOString() };
  state.users.push(u);
  return ok({ message: 'User created successfully.', userId: u.id });
};

export const deleteUser = (id) => {
  const i = state.users.findIndex(u => u.id === Number(id));
  if (i === -1) return err('User not found.');
  state.users.splice(i, 1);
  return ok({ message: 'User deleted.' });
};