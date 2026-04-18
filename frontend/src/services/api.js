import axios from 'axios';

const BASE = 'https://rsims-production.up.railway.app';
const h = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// AUTH
export const loginUser = d =>
  axios.post(`${BASE}/api/auth/login`, d);

// PRODUCTS
export const getProducts   = () => axios.get(`${BASE}/api/products`, h());
export const addProduct    = d  => axios.post(`${BASE}/api/products`, d, h());
export const updateProduct = (id, d) => axios.put(`${BASE}/api/products/${id}`, d, h());
export const deleteProduct = id => axios.delete(`${BASE}/api/products/${id}`, h());

// SUPPLIERS
export const getSuppliers = () => axios.get(`${BASE}/api/suppliers`, h());
export const addSupplier  = d  => axios.post(`${BASE}/api/suppliers`, d, h());

// SALES
export const getSales = () => axios.get(`${BASE}/api/sales`, h());
export const addSale  = d  => axios.post(`${BASE}/api/sales`, d, h());

// PURCHASES
export const getPurchases = () => axios.get(`${BASE}/api/purchases`, h());
export const addPurchase  = d  => axios.post(`${BASE}/api/purchases`, d, h());

// REPORTS
export const getDashboard         = () => axios.get(`${BASE}/api/reports/dashboard`, h());
export const getInventoryReport   = () => axios.get(`${BASE}/api/reports/inventory`, h());
export const getLowStockReport    = () => axios.get(`${BASE}/api/reports/lowstock`, h());
export const getSalesReport       = () => axios.get(`${BASE}/api/reports/sales`, h());
export const getPurchaseReport    = () => axios.get(`${BASE}/api/reports/purchases`, h());

// USERS
export const getUsers   = () => axios.get(`${BASE}/api/users`, h());
export const addUser    = d  => axios.post(`${BASE}/api/users`, d, h());
export const deleteUser = id => axios.delete(`${BASE}/api/users/${id}`, h());