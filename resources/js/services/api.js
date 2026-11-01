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

export const getChapters = async (workId) => {
    const token = getToken();
    const response = await fetch(`/api/works/${workId}/chapters`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao carregar capítulos');
    }
    return await response.json();
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
    const erro = await response.text();
    console.error('Erro ao carregar obras:', response.status, erro);
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
        const err = new Error(data.message || 'Erro ao adicionar a obra.');
        err.status = response.status;
        throw err;
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

// ATUALIZAR total de capítulos de uma obra (PATCH)
export const updateWorkChaptersCount = async (id, totalChapters) => {
    const response = await fetch(`${API_URL}/works/${id}/chapters-count`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ total_chapters: totalChapters }),
    });

    if (!response.ok) {
        throw new Error('Erro ao atualizar capítulos da obra.');
    }

    return response.json();
};

// SINCRONIZAR metadados de uma obra ou de todas (gêneros, capítulos, tradução)
export const syncWorkMetadata = async (id = null) => {
    const url = id ? `${API_URL}/works/${id}/sync` : `${API_URL}/works/sync-all`;
    const response = await fetch(url, {
        method: 'POST',
        headers: headers(),
    });

    if (!response.ok) {
        throw new Error('Erro ao sincronizar metadados.');
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

// Buscar todos os comentários de uma obra
export const getWorkReviews = async (workId) => {
    const token = getToken();
    const response = await fetch(`/api/works/${workId}/reviews`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) throw new Error('Erro ao carregar comentários.');
    return await response.json();
};

// Publicar comentário / avaliação
export const createWorkReview = async (workId, payload) => {
    const token = getToken();
    const response = await fetch(`/api/works/${workId}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload), 
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao publicar comentário.');
    }
    return await response.json();
};

// Editar comentário
export const updateWorkReview = async (workId, reviewId, payload) => {
    const response = await fetch(
        `${API_URL}/works/${workId}/reviews/${reviewId}`,
        {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify(payload),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erro ao editar comentário.');
    }

    return data;
};

// Deletar comentário
export const deleteWorkReview = async (workId, reviewId) => {
    const token = getToken();
    const response = await fetch(`/api/works/${workId}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) throw new Error('Erro ao excluir comentário.');
    return await response.json();
};


// ---------------- USUÁRIO LOGADO E ADMIN ----------------

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
