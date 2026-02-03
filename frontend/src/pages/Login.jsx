import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../App';

function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [nome, setNome] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let token;

            if (isLogin) {
                // Login
                const tokenData = await authAPI.login(email, senha);
                token = tokenData.access_token;
            } else {
                // Register
                await authAPI.register(email, nome, senha);
                // After register, auto-login
                const tokenData = await authAPI.login(email, senha);
                token = tokenData.access_token;
            }

            // Save token TEMPORARILY to localStorage so interceptor can pick it up
            localStorage.setItem('token', token);

            // Now we can fetch user data
            const userData = await authAPI.getMe();

            // Update auth context (which might also set localStorage, but that's fine)
            login(token, userData);
            navigate('/');

        } catch (err) {
            console.error(err);
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Exibe a primeira mensagem de erro ou junta todas
                setError(detail.map(e => e.msg).join('. '));
            } else if (typeof detail === 'object') {
                setError(JSON.stringify(detail));
            } else {
                setError(detail || 'Ocorreu um erro. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page flex-center" style={{ minHeight: '100vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="text-center mb-lg">
                    <h1 className="navbar-brand" style={{ fontSize: '2rem' }}>DevFlow</h1>
                    <p className="text-muted">
                        {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="nome">Nome</label>
                            <input
                                id="nome"
                                type="text"
                                className="form-input"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Seu nome"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="senha">Senha</label>
                        <input
                            id="senha"
                            type="password"
                            className="form-input"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>

                <div className="text-center mt-lg">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                    >
                        {isLogin ? 'Criar conta' : 'Já tenho conta'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;
