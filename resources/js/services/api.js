// resources/js/services/api.js

// URL da sua API do Laravel
const API_URL = 'http://127.0.0.1:8000/api';

// Função para PUXAR os dados (GET)
export const getWorks = async () => {
    const response = await fetch(`${API_URL}/works`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include' 
    });
    return response.json();
};

// Função para INSERIR novos dados (POST)
export const createWork = async (workData) => {
    const response = await fetch(`${API_URL}/works`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(workData),
        credentials: 'include'
    });
    return response.json();
};  