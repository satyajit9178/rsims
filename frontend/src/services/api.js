import axios from 'axios';

const BASE = 'http://localhost:5000/api';
const h = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export const loginUser       = d  => axios.post(`${BASE}/auth/login`, d);

export const getProducts     = () => axios.get(`${BASE}/products`, h());
export const addProduct      = d  => axios.post(`${BASE}/products`, d, h());
export const updateProduct   = (id,d) => axios.put(`${BASE}/products/${id}`, d, h());
export const deleteProduct   = id => axios.delete(`${BASE}/products/${id}`, h());

export const getSuppliers    = () => axios.get(`${BASE}/suppliers`, h());
export const addSupplier     = d  => axios.post(`${BASE}/suppliers`, d, h());

export const getSales        = () => axios.get(`${BASE}/sales`, h());
export const addSale         = d  => axios.post(`${BASE}/sales`, d, h());

export const getPurchases    = () => axios.get(`${BASE}/purchases`, h());
export const addPurchase     = d  => axios.post(`${BASE}/purchases`, d, h());

export const getDashboard    = () => axios.get(`${BASE}/reports/dashboard`, h());
export const getInventoryReport = () => axios.get(`${BASE}/reports/inventory`, h());
export const getLowStockReport  = () => axios.get(`${BASE}/reports/lowstock`, h());
export const getSalesReport     = () => axios.get(`${BASE}/reports/sales`, h());
export const getPurchaseReport  = () => axios.get(`${BASE}/reports/purchases`, h());

export const getUsers        = () => axios.get(`${BASE}/users`, h());
export const addUser         = d  => axios.post(`${BASE}/users`, d, h());
export const deleteUser      = id => axios.delete(`${BASE}/users/${id}`, h());
