import { useState, useEffect } from 'react';
import { execucoesAPI } from '../services/api';

function Execucoes() {
    const [execucoes, setExecucoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExecucao, setSelectedExecucao] = useState(null);
    const [logs, setLogs] = useState('');
    const [loadingLogs, setLoadingLogs] = useState(false);

    const loadExecucoes = async () => {
        try {
            const data = await execucoesAPI.list();
            setExecucoes(data);
        } catch (err) {
            console.error('Erro ao carregar execuções:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExecucoes();

        // Poll for updates every 5 seconds
        const interval = setInterval(loadExecucoes, 5000);
        return () => clearInterval(interval);
    }, []);

    const viewLogs = async (execucao) => {
        setSelectedExecucao(execucao);
        setLoadingLogs(true);

        try {
            const data = await execucoesAPI.getLogs(execucao.id);
            setLogs(data.logs);
        } catch (err) {
            setLogs('Erro ao carregar logs');
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Tem certeza que deseja cancelar esta execução?')) return;

        try {
            await execucoesAPI.cancel(id);
            loadExecucoes();
            setSelectedExecucao(null);
        } catch (err) {
            alert('Erro ao cancelar: ' + (err.response?.data?.detail || err.message));
        }
    };

    const closeModal = () => {
        setSelectedExecucao(null);
        setLogs('');
    };

    // Poll logs when modal is open and execution is running
    useEffect(() => {
        let interval;
        if (selectedExecucao && ['pending', 'running'].includes(selectedExecucao.status)) {
            interval = setInterval(async () => {
                try {
                    const data = await execucoesAPI.getLogs(selectedExecucao.id);
                    setLogs(data.logs);

                    // Update status in real-time too
                    if (data.status !== selectedExecucao.status) {
                        setSelectedExecucao(prev => ({ ...prev, status: data.status, resultado: data.resultado }));
                        // Refetch list to update background table
                        loadExecucoes();
                    }
                } catch (err) {
                    console.error("Erro ao atualizar logs:", err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [selectedExecucao]);

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
                <h1>Execuções</h1>
                <button className="btn btn-secondary" onClick={loadExecucoes}>
                    ↻ Atualizar
                </button>
            </div>

            {execucoes.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">⚡</div>
                        <p>Nenhuma execução registrada</p>
                        <p className="text-muted text-small">
                            Inicie uma execução a partir de um projeto
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Projeto</th>
                                <th>Status</th>
                                <th>Iniciado em</th>
                                <th>Finalizado em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {execucoes.map(exec => (
                                <tr key={exec.id}>
                                    <td>#{exec.id}</td>
                                    <td>Projeto #{exec.projeto_id}</td>
                                    <td>
                                        <span className={`badge badge-${exec.status}`}>
                                            {exec.status}
                                        </span>
                                    </td>
                                    <td className="text-muted">
                                        {new Date(exec.iniciado_em).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="text-muted">
                                        {exec.finalizado_em
                                            ? new Date(exec.finalizado_em).toLocaleString('pt-BR')
                                            : '-'
                                        }
                                    </td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => viewLogs(exec)}
                                            >
                                                Ver Logs
                                            </button>
                                            {(exec.status === 'pending' || exec.status === 'running') && (
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleCancel(exec.id)}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Logs Modal */}
            {selectedExecucao && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Execução #{selectedExecucao.id}</h2>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>

                        <div className="mb-md">
                            <span className={`badge badge-${selectedExecucao.status}`}>
                                {selectedExecucao.status}
                            </span>
                        </div>

                        <div className="mb-md">
                            <h4>Parâmetros de Entrada</h4>
                            <pre className="log-viewer" style={{ maxHeight: '100px' }}>
                                {JSON.stringify(selectedExecucao.parametros_entrada, null, 2)}
                            </pre>
                        </div>

                        <div className="mb-md">
                            <h4>Logs</h4>
                            {loadingLogs ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                </div>
                            ) : (
                                <pre className="log-viewer">
                                    {logs || 'Nenhum log disponível'}
                                </pre>
                            )}
                        </div>

                        {selectedExecucao.resultado && (
                            <div className="mb-md">
                                <h4>Resultado</h4>
                                <pre className="log-viewer" style={{ maxHeight: '150px' }}>
                                    {JSON.stringify(selectedExecucao.resultado, null, 2)}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-sm">
                            <button className="btn btn-secondary" onClick={closeModal}>
                                Fechar
                            </button>
                            {(selectedExecucao.status === 'pending' || selectedExecucao.status === 'running') && (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleCancel(selectedExecucao.id)}
                                >
                                    Cancelar Execução
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Execucoes;
