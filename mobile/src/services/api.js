import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Puxa o IP automaticamente de onde o Metro Bundler está rodando
const getBaseUrl = () => {
    // Tenta diferentes caminhos para o IP do Metro
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.hostUri || '';

    if (!hostUri) {
        console.log('Aviso: hostUri não encontrado, usando localhost');
        return 'http://localhost:8000';
    }

    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000`;
};

export const BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // Timeout de 10 segundos
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const login = async (email, password) => {
    // FastAPI's OAuth2PasswordRequestForm expects x-www-form-urlencoded
    const details = {
        'username': email,
        'password': password,
    };

    const formBody = Object.keys(details)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key]))
        .join('&');

    const response = await api.post('/auth/login', formBody, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });
    return response.data;
};

export const getExecucoes = async () => {
    const response = await api.get('/execucoes');
    return response.data;
};

export const getExecucaoLogs = async (id) => {
    const response = await api.get(`/execucoes/${id}/logs`);
    return response.data;
};

// Projetos
export const getProjetos = async () => {
    const response = await api.get('/projetos');
    return response.data;
};

export const createProjeto = async (projeto) => {
    const response = await api.post('/projetos', projeto);
    return response.data;
};

export const updateProjeto = async (id, projeto) => {
    const response = await api.put(`/projetos/${id}`, projeto);
    return response.data;
};

export const deleteProjeto = async (id) => {
    const response = await api.delete(`/projetos/${id}`);
    return response.data;
};

export const startExecucao = async (projetoId, config) => {
    const response = await api.post(`/projetos/${projetoId}/executar`, config);
    return response.data;
};

export default api;
