// resources/js/services/api.js

const API_URL = '/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (t) => localStorage.setItem('token', t);
export const clearToken = () => localStorage.removeItem('token');

const headers = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

export const login = async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao entrar.');
    setToken(data.token);
    return data.user;
};

export const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao cadastrar.');
    setToken(data.token);
    return data.user;
};

export const logout = async () => {
    await fetch(`${API_URL}/logout`, { method: 'POST', headers: headers() });
    clearToken();
};

export const getWorks = async () => {
    const res = await fetch(`${API_URL}/works`, { headers: headers() });
    return res.json();
};

export const createWork = async (workData) => {
    const res = await fetch(`${API_URL}/works`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify(workData),
    });
    return res.json();
};