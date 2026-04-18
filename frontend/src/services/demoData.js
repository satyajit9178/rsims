// Mutable module-level state — resets on page refresh automatically
let nextId = { product: 10, sale: 16, purchase: 11, supplier: 4, user: 4 };

export const state = {
  suppliers: [
    { id: 1, supplier_name: 'Gupta Distributors',   contact_person: 'Ramesh Kumar',  phone: '9876543210', email: 'abc@dist.com',    address: 'Mumbai' },
    { id: 2, supplier_name: 'Fresh Foods Co.',     contact_person: 'Priya Sharma',  phone: '9123456780', email: 'fresh@foods.com', address: 'Delhi' },
    { id: 3, supplier_name: 'QuickMart Supply',    contact_person: 'Arjun Singh',   phone: '9988776655', email: 'qm@supply.com',   address: 'Pune' },
  ],

  products: [
    { id:1,  sku:'BISC-001', product_name:'Parle-G Biscuit 80g',    category:'Biscuits',     cost_price:8,   selling_price:10,  current_stock:95,  reorder_level:20, supplier_id:1, supplier_name:'Gupta Distributors',  expiry_date:'2026-12-01' },
    { id:2,  sku:'RICE-001', product_name:'Basmati Rice 1kg',        category:'Grains',       cost_price:55,  selling_price:70,  current_stock:8,   reorder_level:10, supplier_id:2, supplier_name:'Fresh Foods Co.',    expiry_date:'2027-06-01' },
    { id:3,  sku:'OIL-001',  product_name:'Sunflower Oil 1L',        category:'Cooking Oil',  cost_price:90,  selling_price:115, current_stock:40,  reorder_level:15, supplier_id:1, supplier_name:'Gupta Distributors',  expiry_date:'2026-08-15' },
    { id:4,  sku:'SOAP-001', product_name:'Lux Soap 100g',           category:'Personal Care',cost_price:22,  selling_price:30,  current_stock:5,   reorder_level:10, supplier_id:3, supplier_name:'QuickMart Supply',  expiry_date:'2028-01-01' },
    { id:5,  sku:'MILK-001', product_name:'Amul Full Cream Milk 1L', category:'Dairy',        cost_price:58,  selling_price:68,  current_stock:30,  reorder_level:20, supplier_id:2, supplier_name:'Fresh Foods Co.',    expiry_date:'2025-12-15' },
    { id:6,  sku:'NOOD-001', product_name:'Maggi Noodles 70g',       category:'Instant Food', cost_price:12,  selling_price:15,  current_stock:120, reorder_level:30, supplier_id:1, supplier_name:'Gupta Distributors',  expiry_date:'2026-05-20' },
    { id:7,  sku:'CHOC-001', product_name:'Dairy Milk 40g',          category:'Chocolate',    cost_price:18,  selling_price:25,  current_stock:7,   reorder_level:15, supplier_id:3, supplier_name:'QuickMart Supply',  expiry_date:'2026-03-10' },
    { id:8,  sku:'SALT-001', product_name:'Tata Salt 1kg',           category:'Condiments',   cost_price:18,  selling_price:24,  current_stock:60,  reorder_level:20, supplier_id:2, supplier_name:'Fresh Foods Co.',    expiry_date:'2028-09-01' },
    { id:9,  sku:'TEA-001',  product_name:'Tata Tea Premium 250g',   category:'Beverages',    cost_price:70,  selling_price:90,  current_stock:45,  reorder_level:15, supplier_id:1, supplier_name:'Gupta Distributors',  expiry_date:'2027-02-28' },
  ],

  sales: [
    { id:1,  product_id:1, product_name:'Parle-G Biscuit 80g',    quantity:5,  total_price:50,  sold_by:'staff',   sale_date: new Date(Date.now()-1*86400000).toISOString() },
    { id:2,  product_id:6, product_name:'Maggi Noodles 70g',       quantity:10, total_price:150, sold_by:'staff',   sale_date: new Date(Date.now()-1*86400000).toISOString() },
    { id:3,  product_id:5, product_name:'Amul Full Cream Milk 1L', quantity:3,  total_price:204, sold_by:'staff',   sale_date: new Date(Date.now()-2*86400000).toISOString() },
    { id:4,  product_id:3, product_name:'Sunflower Oil 1L',        quantity:2,  total_price:230, sold_by:'manager', sale_date: new Date(Date.now()-2*86400000).toISOString() },
    { id:5,  product_id:8, product_name:'Tata Salt 1kg',           quantity:4,  total_price:96,  sold_by:'staff',   sale_date: new Date(Date.now()-3*86400000).toISOString() },
    { id:6,  product_id:9, product_name:'Tata Tea Premium 250g',   quantity:2,  total_price:180, sold_by:'staff',   sale_date: new Date(Date.now()-3*86400000).toISOString() },
    { id:7,  product_id:1, product_name:'Parle-G Biscuit 80g',    quantity:8,  total_price:80,  sold_by:'staff',   sale_date: new Date(Date.now()-4*86400000).toISOString() },
    { id:8,  product_id:7, product_name:'Dairy Milk 40g',          quantity:3,  total_price:75,  sold_by:'manager', sale_date: new Date(Date.now()-4*86400000).toISOString() },
    { id:9,  product_id:2, product_name:'Basmati Rice 1kg',        quantity:2,  total_price:140, sold_by:'staff',   sale_date: new Date(Date.now()-5*86400000).toISOString() },
    { id:10, product_id:6, product_name:'Maggi Noodles 70g',       quantity:6,  total_price:90,  sold_by:'staff',   sale_date: new Date(Date.now()-5*86400000).toISOString() },
    { id:11, product_id:3, product_name:'Sunflower Oil 1L',        quantity:1,  total_price:115, sold_by:'staff',   sale_date: new Date(Date.now()-6*86400000).toISOString() },
    { id:12, product_id:4, product_name:'Lux Soap 100g',           quantity:2,  total_price:60,  sold_by:'manager', sale_date: new Date(Date.now()-6*86400000).toISOString() },
  ],

  purchases: [
    { id:1,  product_id:1, product_name:'Parle-G Biscuit 80g',    supplier_id:1, supplier_name:'Gupta Distributors', quantity:100, cost_at_purchase:8,  purchase_date: new Date(Date.now()-7*86400000).toISOString() },
    { id:2,  product_id:6, product_name:'Maggi Noodles 70g',       supplier_id:1, supplier_name:'Gupta Distributors', quantity:150, cost_at_purchase:12, purchase_date: new Date(Date.now()-7*86400000).toISOString() },
    { id:3,  product_id:5, product_name:'Amul Full Cream Milk 1L', supplier_id:2, supplier_name:'Fresh Foods Co.',  quantity:50,  cost_at_purchase:58, purchase_date: new Date(Date.now()-8*86400000).toISOString() },
    { id:4,  product_id:3, product_name:'Sunflower Oil 1L',        supplier_id:1, supplier_name:'Gupta Distributors', quantity:50,  cost_at_purchase:90, purchase_date: new Date(Date.now()-8*86400000).toISOString() },
    { id:5,  product_id:8, product_name:'Tata Salt 1kg',           supplier_id:2, supplier_name:'Fresh Foods Co.',  quantity:80,  cost_at_purchase:18, purchase_date: new Date(Date.now()-10*86400000).toISOString() },
    { id:6,  product_id:9, product_name:'Tata Tea Premium 250g',   supplier_id:1, supplier_name:'Gupta Distributors', quantity:60,  cost_at_purchase:70, purchase_date: new Date(Date.now()-10*86400000).toISOString() },
    { id:7,  product_id:7, product_name:'Dairy Milk 40g',          supplier_id:3, supplier_name:'QuickMart Supply', quantity:30,  cost_at_purchase:18, purchase_date: new Date(Date.now()-12*86400000).toISOString() },
    { id:8,  product_id:2, product_name:'Basmati Rice 1kg',        supplier_id:2, supplier_name:'Fresh Foods Co.',  quantity:20,  cost_at_purchase:55, purchase_date: new Date(Date.now()-12*86400000).toISOString() },
  ],

  users: [
    { id:1, username:'admin',   role:'Admin',   created_at: new Date().toISOString() },
    { id:2, username:'manager', role:'Manager', created_at: new Date().toISOString() },
    { id:3, username:'staff',   role:'Staff',   created_at: new Date().toISOString() },
  ],
};

export function getNextId(type) {
  return nextId[type]++;
}