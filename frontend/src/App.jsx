import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from './services/api';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projetos from './pages/Projetos';
import Execucoes from './pages/Execucoes';
import PluginBuilder from './pages/PluginBuilder';
import Layout from './components/Layout';

// Auth Context
export const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

// Protected Route Component
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (token) {
            authAPI.getMe()
                .then(userData => {
                    setUser(userData);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />
                    <Route path="projetos" element={<Projetos />} />
                    <Route path="execucoes" element={<Execucoes />} />
                    <Route path="plugins" element={<PluginBuilder />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthContext.Provider>
    );
}

export default App;
