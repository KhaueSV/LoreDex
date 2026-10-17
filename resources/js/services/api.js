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

// ---------------- AUTENTICAÇÃO ----------------
export const login = async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao entrar.');
    setToken(data.token);
    return data.user;
};

export const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: headers(),
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

// ---------------- OBRAS ----------------
// Função para PUXAR os dados (GET)
export const getWorks = async () => {
    const response = await fetch(`${API_URL}/works`, {
        method: 'GET',
        headers: headers(),
    });
    return response.json();
};

// Função para INSERIR novos dados (POST)
export const createWork = async (workData) => {
    const response = await fetch(`${API_URL}/works`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(workData),
    });
    return response.json();
};

// Função para EDITAR uma obra (PUT)
export const updateWork = async (id, workData) => {
    const response = await fetch(`${API_URL}/works/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(workData),
    });
    if (!response.ok) throw new Error('Erro ao atualizar a obra');
    return response.json();
};

// Função para EXCLUIR uma obra (DELETE)
export const deleteWork = async (id) => {
    const response = await fetch(`${API_URL}/works/${id}`, {
        method: 'DELETE',
        headers: headers(),
    });
    if (!response.ok) throw new Error('Erro ao excluir a obra');
};

export const getMe = async () => {
    const res = await fetch(`${API_URL}/me`, { headers: headers() });
    if (!res.ok) throw new Error('Não autenticado');
    return res.json();
};

export const getAdminStats = async () => {
    const res = await fetch(`${API_URL}/admin/stats`, { headers: headers() });
    if (!res.ok) throw new Error('Erro ao carregar estatísticas');
    return res.json();
};

export const getAdminUsers = async () => {
    const res = await fetch(`${API_URL}/admin/users`, { headers: headers() });
    if (!res.ok) throw new Error('Erro ao carregar usuários');
    return res.json();
};

export const setUserRole = async (id, role) => {
    const res = await fetch(`${API_URL}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao alterar papel');
    return data;
};