import { useState, useEffect } from 'react';
import { projetosAPI } from '../services/api';

function Projetos() {
    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    // Execution Modal State
    const [showExecutionModal, setShowExecutionModal] = useState(false);
    const [executionConfig, setExecutionConfig] = useState({
        mode: 'review',
        target: '.',
        projectId: null
    });

    const [showModal, setShowModal] = useState(false);
    const [editingProjeto, setEditingProjeto] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        idioma: 'en',
        temperatura: 0.7
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const loadProjetos = async () => {
        try {
            const data = await projetosAPI.list();
            setProjetos(data);
        } catch (err) {
            console.error('Erro ao carregar projetos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjetos();
    }, []);

    const openModal = (projeto = null) => {
        if (projeto) {
            setEditingProjeto(projeto);
            setFormData({
                nome: projeto.nome,
                descricao: projeto.descricao || '',
                idioma: projeto.idioma || 'en',
                temperatura: projeto.temperatura || 0.7
            });
        } else {
            setEditingProjeto(null);
            setFormData({
                nome: '',
                descricao: '',
                idioma: 'en',
                temperatura: 0.7
            });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProjeto(null);
        setFormData({
            nome: '',
            descricao: '',
            idioma: 'en',
            temperatura: 0.7
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (editingProjeto) {
                await projetosAPI.update(editingProjeto.id, formData);
            } else {
                await projetosAPI.create({
                    ...formData,
                    configuracao_pipeline: { pipeline: 'default' }
                });
            }
            closeModal();
            loadProjetos();
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao salvar projeto');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return;

        try {
            await projetosAPI.delete(id);
            loadProjetos();
        } catch (err) {
            alert('Erro ao excluir projeto');
        }
    };
    const handleOpenExecution = (projetoId) => {
        setExecutionConfig({
            mode: 'review',
            target: '.',
            projectId: projetoId
        });
        setShowExecutionModal(true);
    };

    const handleConfirmExecution = async (e) => {
        e.preventDefault();
        if (!executionConfig.projectId) return;

        try {
            await projetosAPI.startExecution(executionConfig.projectId, {
                mode: executionConfig.mode,
                target: executionConfig.target
            });
            setShowExecutionModal(false);
            alert('Execução iniciada! Acompanhe na aba Execuções.');
        } catch (err) {
            alert('Erro ao iniciar execução: ' + (err.response?.data?.detail || err.message));
        }
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
                <h1>Projetos</h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    + Novo Projeto
                </button>
            </div>

            {projetos.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📁</div>
                        <p>Nenhum projeto criado ainda</p>
                        <button className="btn btn-primary mt-md" onClick={() => openModal()}>
                            Criar Primeiro Projeto
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-3">
                    {projetos.map(projeto => (
                        <div key={projeto.id} className="card">
                            <div className="card-header">
                                <h3 className="card-title">{projeto.nome}</h3>
                                <span className="badge badge-secondary" style={{ textTransform: 'uppercase' }}>
                                    {projeto.idioma}
                                </span>
                            </div>

                            <p className="text-muted text-small mb-md">
                                {projeto.descricao || 'Sem descrição'}
                            </p>

                            <div className="flex-between text-muted text-small mb-md">
                                <span>Creativity: {projeto.temperatura}</span>
                                <span>{new Date(projeto.criado_em).toLocaleDateString('pt-BR')}</span>
                            </div>

                            <div className="flex gap-sm mt-md">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleOpenExecution(projeto.id)}
                                >
                                    ▶ Executar
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => openModal(projeto)}
                                >
                                    Editar
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleDelete(projeto.id)}
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Project Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingProjeto ? 'Editar Projeto' : 'Novo Projeto'}</h2>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nome</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descrição</label>
                                <textarea
                                    className="form-input form-textarea"
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-2 gap-md">
                                <div className="form-group">
                                    <label className="form-label">Idioma da Interface</label>
                                    <select
                                        className="form-input"
                                        value={formData.idioma}
                                        onChange={e => setFormData({ ...formData, idioma: e.target.value })}
                                    >
                                        <option value="en">🇺🇸 English</option>
                                        <option value="pt">🇧🇷 Português</option>
                                        <option value="es">🇪🇸 Español</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-small flex-between">
                                        Nível de Criatividade (IA)
                                        <span className="text-secondary">{formData.temperatura}</span>
                                    </label>
                                    <input
                                        type="range"
                                        className="form-input"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={formData.temperatura}
                                        onChange={e => setFormData({ ...formData, temperatura: parseFloat(e.target.value) })}
                                        style={{ height: '38px', padding: '0' }}
                                    />
                                    <div className="flex-between text-muted" style={{ fontSize: '10px' }}>
                                        <span>Preciso</span>
                                        <span>Criativo</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-sm mt-lg">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Execution Modal */}
            {showExecutionModal && (
                <div className="modal-overlay" onClick={() => setShowExecutionModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Configurar Execução AkitaLLM</h2>
                            <button className="modal-close" onClick={() => setShowExecutionModal(false)}>&times;</button>
                        </div>

                        <div className="alert alert-info mb-md">
                            Configure como a IA deve atuar neste projeto.
                        </div>

                        <form onSubmit={handleConfirmExecution}>
                            <div className="form-group">
                                <label className="form-label">Modo de Operação</label>
                                <select
                                    className="form-input"
                                    value={executionConfig.mode}
                                    onChange={e => setExecutionConfig({ ...executionConfig, mode: e.target.value })}
                                >
                                    <option value="review">🕵️ Review (Revisão de Código)</option>
                                    <option value="plan">📝 Plan (Planejamento Técnico)</option>
                                    <option value="solve">🛠️ Solve (Resolver Problema/Bug)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    {executionConfig.mode === 'review' ? 'Caminho / Arquivo' : 'Instrução / Prompt'}
                                </label>
                                {executionConfig.mode === 'review' ? (
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={executionConfig.target}
                                        onChange={e => setExecutionConfig({ ...executionConfig, target: e.target.value })}
                                        placeholder="Ex: src/ ou app/main.py"
                                        required
                                    />
                                ) : (
                                    <textarea
                                        className="form-input form-textarea"
                                        value={executionConfig.target}
                                        onChange={e => setExecutionConfig({ ...executionConfig, target: e.target.value })}
                                        placeholder={executionConfig.mode === 'plan'
                                            ? "Ex: Implementar autenticação JWT com refresh token"
                                            : "Ex: Corrigir erro de conexão no arquivo database.py"}
                                        required
                                        rows={4}
                                    />
                                )}
                            </div>

                            <div className="flex gap-sm mt-lg">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowExecutionModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    🚀 Iniciar Agente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Projetos;
