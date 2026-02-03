import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projetosAPI, execucoesAPI } from '../services/api';
import { useAuth } from '../App';

function Dashboard() {
    const { user } = useAuth();
    const [projetos, setProjetos] = useState([]);
    const [execucoes, setExecucoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            projetosAPI.list(),
            execucoesAPI.list()
        ])
            .then(([projetosData, execucoesData]) => {
                setProjetos(projetosData);
                setExecucoes(execucoesData.slice(0, 5)); // Last 5 executions
            })
            .finally(() => setLoading(false));
    }, []);

    const stats = {
        totalProjetos: projetos.length,
        totalExecucoes: execucoes.length,
        execucoesAtivas: execucoes.filter(e =>
            e.status === 'pending' || e.status === 'running'
        ).length,
        sucessos: execucoes.filter(e => e.status === 'success').length,
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex-between mb-lg">
                <div>
                    <h1>Olá, {user?.nome}!</h1>
                    <p className="text-muted">Bem-vindo ao DevFlow</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-4 mb-lg">
                <div className="card">
                    <div className="text-muted text-small">Projetos</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {stats.totalProjetos}
                    </div>
                </div>

                <div className="card">
                    <div className="text-muted text-small">Execuções Recentes</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {stats.totalExecucoes}
                    </div>
                </div>

                <div className="card">
                    <div className="text-muted text-small">Em Execução</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-info)' }}>
                        {stats.execucoesAtivas}
                    </div>
                </div>

                <div className="card">
                    <div className="text-muted text-small">Sucessos</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        {stats.sucessos}
                    </div>
                </div>
            </div>

            {/* Recent Projects */}
            <div className="card mb-lg">
                <div className="card-header">
                    <h3 className="card-title">Projetos Recentes</h3>
                    <Link to="/projetos" className="btn btn-secondary">
                        Ver todos
                    </Link>
                </div>

                {projetos.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📁</div>
                        <p>Nenhum projeto criado ainda</p>
                        <Link to="/projetos" className="btn btn-primary mt-md">
                            Criar Projeto
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-3">
                        {projetos.slice(0, 3).map(projeto => (
                            <div key={projeto.id} className="card">
                                <h4>{projeto.nome}</h4>
                                <p className="text-muted text-small">
                                    {projeto.descricao || 'Sem descrição'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Executions */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Execuções Recentes</h3>
                    <Link to="/execucoes" className="btn btn-secondary">
                        Ver todas
                    </Link>
                </div>

                {execucoes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">⚡</div>
                        <p>Nenhuma execução registrada</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Status</th>
                                <th>Iniciado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {execucoes.map(exec => (
                                <tr key={exec.id}>
                                    <td>#{exec.id}</td>
                                    <td>
                                        <span className={`badge badge-${exec.status}`}>
                                            {exec.status}
                                        </span>
                                    </td>
                                    <td className="text-muted">
                                        {new Date(exec.iniciado_em).toLocaleString('pt-BR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
