import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { getExecucoes } from '../services/api';

export default function DashboardScreen({ navigation }) {
    const [execucoes, setExecucoes] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        setRefreshing(true);
        try {
            const data = await getExecucoes();
            setExecucoes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return '#4caf50';
            case 'failed': return '#f44336';
            case 'running': return '#2196f3';
            default: return '#999';
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ExecutionDetails', { executionId: item.id })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Execução #{item.id}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.badgeText}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.projectText}>Projeto #{item.projeto_id}</Text>
            <Text style={styles.dateText}>
                {new Date(item.iniciado_em).toLocaleDateString()} {new Date(item.iniciado_em).toLocaleTimeString()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={execucoes}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadData} />
                }
                contentContainerStyle={styles.list}
            />
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
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    projectText: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 6,
        fontWeight: '500',
    },
    dateText: {
        fontSize: 12,
        color: '#64748b',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
