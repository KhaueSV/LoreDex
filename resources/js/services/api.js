// resources/js/services/api.js

const API_URL = '/api';

// ---------------- TOKEN ----------------

export const getToken = () => localStorage.getItem('token');

export const setToken = (t) => {
    localStorage.setItem('token', t);
};

export const clearToken = () => {
    localStorage.removeItem('token');
};

// ---------------- E-MAIL ----------------

export const getSavedEmail = () => {
    return localStorage.getItem('savedEmail') || '';
};

export const saveEmail = (email) => {
    localStorage.setItem('savedEmail', email);
};

export const clearSavedEmail = () => {
    localStorage.removeItem('savedEmail');
};

// ---------------- HEADERS ----------------

const headers = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(getToken()
        ? { Authorization: `Bearer ${getToken()}` }
        : {}),
});

// ---------------- AUTENTICAÇÃO ----------------

export const login = async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
            email,
            password,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Erro ao entrar.');
    }

    // Salva o token
    setToken(data.token);

    // Salva somente o e-mail
    saveEmail(email);

    return data.user;
};

export const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
            name,
            email,
            password,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Erro ao cadastrar.');
    }

    // Salva o token
    setToken(data.token);

    // Salva somente o e-mail
    saveEmail(email);

    return data.user;
};

export const logout = async () => {
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: headers(),
        });
    } finally {
        // Remove somente o token.
        // O e-mail continua salvo para facilitar o próximo login.
        clearToken();
    }
};

// ---------------- OBRAS ----------------

// PUXAR os dados (GET)
export const getWorks = async () => {
    const response = await fetch(`${API_URL}/works`, {
        method: 'GET',
        headers: headers(),
    });

    if (!response.ok) {
        throw new Error('Erro ao carregar as obras.');
    }

    return response.json();
};

// INSERIR novos dados (POST)
export const createWork = async (workData) => {
    const response = await fetch(`${API_URL}/works`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(workData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Erro ao adicionar a obra.');
    }

    return data;
};

// EDITAR uma obra (PUT)
export const updateWork = async (id, workData) => {
    const response = await fetch(`${API_URL}/works/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(workData),
    });

    if (!response.ok) {
        throw new Error('Erro ao atualizar a obra.');
    }

    return response.json();
};

// EXCLUIR uma obra (DELETE)
export const deleteWork = async (id) => {
    const response = await fetch(`${API_URL}/works/${id}`, {
        method: 'DELETE',
        headers: headers(),
    });

    if (!response.ok) {
        throw new Error('Erro ao excluir a obra.');
    }
};

const collectionResponse = async (response, fallbackMessage) => {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || fallbackMessage);
    }

    return data;
};

export const getCollections = async () => {
    const response = await fetch(`${API_URL}/collections`, {
        method: 'GET',
        headers: headers(),
    });

    return collectionResponse(response, 'Erro ao carregar as coleções.');
};

export const createCollection = async (collectionData) => {
    const response = await fetch(`${API_URL}/collections`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(collectionData),
    });

    return collectionResponse(response, 'Erro ao criar a coleção.');
};

export const updateCollection = async (collectionId, collectionData) => {
    const response = await fetch(`${API_URL}/collections/${collectionId}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(collectionData),
    });

    return collectionResponse(response, 'Erro ao atualizar a coleção.');
};

export const deleteCollection = async (collectionId) => {
    const response = await fetch(`${API_URL}/collections/${collectionId}`, {
        method: 'DELETE',
        headers: headers(),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao excluir a coleção.');
    }
};

export const addWorkToCollection = async (collectionId, workId) => {
    const response = await fetch(`${API_URL}/collections/${collectionId}/works`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ work_id: workId }),
    });

    return collectionResponse(response, 'Erro ao adicionar a obra à coleção.');
};

export const removeWorkFromCollection = async (collectionId, workId) => {
    const response = await fetch(`${API_URL}/collections/${collectionId}/works/${workId}`, {
        method: 'DELETE',
        headers: headers(),
    });

    return collectionResponse(response, 'Erro ao remover a obra da coleção.');
};