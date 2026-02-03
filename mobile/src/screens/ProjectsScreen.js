import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { getProjetos, createProjeto, updateProjeto, deleteProjeto, startExecucao } from '../services/api';

export default function ProjectsScreen({ navigation }) {
    const [projetos, setProjetos] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Create/Edit Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({ nome: '', descricao: '' });
    const [submitting, setSubmitting] = useState(false);

    // Execution Modal
    const [execModalVisible, setExecModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [execConfig, setExecConfig] = useState({ mode: 'review', target: '.' });

    const loadData = async () => {
        setRefreshing(true);
        try {
            const data = await getProjetos();
            setProjetos(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao carregar projetos');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async () => {
        if (!formData.nome) {
            Alert.alert('Erro', 'O nome é obrigatório');
            return;
        }

        setSubmitting(true);
        try {
            if (editingProject) {
                await updateProjeto(editingProject.id, formData);
            } else {
                await createProjeto(formData);
            }
            setModalVisible(false);
            loadData();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar projeto');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir este projeto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProjeto(id);
                            loadData();
                        } catch (error) {
                            Alert.alert('Erro', 'Falha ao excluir projeto');
                        }
                    }
                }
            ]
        );
    };

    const handleStartExecution = async () => {
        setSubmitting(true);
        try {
            await startExecucao(selectedProject.id, execConfig);
            setExecModalVisible(false);
            Alert.alert('Sucesso', 'Execução iniciada!');
            navigation.navigate('Executions'); // We'll rename Dashboard to Executions
        } catch (error) {
            Alert.alert('Erro', 'Falha ao iniciar execução');
        } finally {
            setSubmitting(false);
        }
    };

    const renderProject = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.nome}</Text>
                <Text style={styles.cardDesc}>{item.descricao || 'Sem descrição'}</Text>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.execButton]}
                    onPress={() => {
                        setSelectedProject(item);
                        setExecModalVisible(true);
                    }}
                >
                    <Text style={styles.actionButtonText}>Executar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                        setEditingProject(item);
                        setFormData({ nome: item.nome, descricao: item.descricao });
                        setModalVisible(true);
                    }}
                >
                    <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Text style={styles.actionButtonText}>X</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={projetos}
                renderItem={renderProject}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadData} />
                }
                contentContainerStyle={styles.list}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    setEditingProject(null);
                    setFormData({ nome: '', descricao: '' });
                    setModalVisible(true);
                }}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Project Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nome do Projeto"
                            placeholderTextColor="#64748b"
                            value={formData.nome}
                            onChangeText={text => setFormData({ ...formData, nome: text })}
                        />

                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Descrição"
                            placeholderTextColor="#64748b"
                            value={formData.descricao}
                            onChangeText={text => setFormData({ ...formData, descricao: text })}
                            multiline
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.modalButtonText}>Salvar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Execution Modal */}
            <Modal visible={execModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Configurar Execução</Text>
                        <Text style={styles.modalSubtitle}>Projeto: {selectedProject?.nome}</Text>

                        <Text style={styles.label}>Modo</Text>
                        <View style={styles.pickerContainer}>
                            {['review', 'fix', 'refactor'].map(mode => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[styles.modeItem, execConfig.mode === mode && styles.selectedMode]}
                                    onPress={() => setExecConfig({ ...execConfig, mode })}
                                >
                                    <Text style={[styles.modeText, execConfig.mode === mode && styles.selectedModeText]}>
                                        {mode.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Target</Text>
                        <TextInput
                            style={styles.input}
                            value={execConfig.target}
                            placeholderTextColor="#64748b"
                            onChangeText={text => setExecConfig({ ...execConfig, target: text })}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setExecModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.execButton]}
                                onPress={handleStartExecution}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.modalButtonText}>Iniciar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardInfo: {
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    cardDesc: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 6,
        lineHeight: 20,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    actionButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    execButton: { backgroundColor: '#3b82f6' },
    editButton: { backgroundColor: '#10b981' },
    deleteButton: { backgroundColor: '#ef4444' },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#3b82f6',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    fabText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'normal',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 24,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#f8fafc',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        color: '#f8fafc',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 6,
    },
    cancelButton: { backgroundColor: '#334155' },
    saveButton: { backgroundColor: '#3b82f6' },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pickerContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 10,
    },
    modeItem: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#1e293b',
    },
    selectedMode: {
        borderColor: '#3b82f6',
        backgroundColor: '#1e3a8a',
    },
    modeText: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
    selectedModeText: { color: '#f8fafc' },
});
