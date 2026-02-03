/**
 * API Service - HTTP client for DevFlow backend
 */
import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (email, senha) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', senha);

        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    register: async (email, nome, senha) => {
        const response = await api.post('/auth/register', { email, nome, senha });
        return response.data;
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

// Projetos API
export const projetosAPI = {
    list: async () => {
        const response = await api.get('/projetos/');
        return response.data;
    },

    get: async (id) => {
        const response = await api.get(`/projetos/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/projetos/', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/projetos/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        await api.delete(`/projetos/${id}`);
    },

    // Iniciar execução
    startExecution: async (projetoId, params = {}) => {
        const response = await api.post(`/projetos/${projetoId}/execucoes`, {
            parametros_entrada: params,
        });
        return response.data;
    },
};

// Execuções API
export const execucoesAPI = {
    list: async () => {
        const response = await api.get('/execucoes/');
        return response.data;
    },

    get: async (id) => {
        const response = await api.get(`/execucoes/${id}`);
        return response.data;
    },

    getLogs: async (id) => {
        const response = await api.get(`/execucoes/${id}/logs`);
        return response.data;
    },

    cancel: async (id) => {
        const response = await api.post(`/execucoes/${id}/cancelar`);
        return response.data;
    },
};

export default api;
