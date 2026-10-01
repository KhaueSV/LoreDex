// resources/js/services/api.js

// URL da sua API do Laravel
const API_URL = 'http://127.0.0.1:8000/api';

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

// Função para PUXAR os dados (GET)
export const getWorks = async () => {
    const response = await fetch(`${API_URL}/works`, {
        method: 'GET',
        headers: defaultHeaders,
        credentials: 'include'
    });
    return response.json();
};

// Função para INSERIR novos dados (POST)
export const createWork = async (workData) => {
    const response = await fetch(`${API_URL}/works`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(workData),
        credentials: 'include'
    });
    return response.json();
};

// Função para EDITAR uma obra (PUT)
export const updateWork = async (id, workData) => {
    const response = await fetch(`${API_URL}/works/${id}`, {
        method: 'PUT',
        headers: defaultHeaders,
        body: JSON.stringify(workData),
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Erro ao atualizar a obra');
    return response.json();
};

// Função para EXCLUIR uma obra (DELETE)
export const deleteWork = async (id) => {
    const response = await fetch(`${API_URL}/works/${id}`, {
        method: 'DELETE',
        headers: defaultHeaders,
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Erro ao excluir a obra');
};