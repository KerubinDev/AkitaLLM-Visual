import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { getExecucaoLogs } from '../services/api';

export default function ExecutionDetailsScreen({ route }) {
    const { executionId } = route.params;
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let interval;

        const fetchDetails = async () => {
            try {
                const data = await getExecucaoLogs(executionId);
                setDetails(data);

                // If finished, stop polling (or reduce frequency)
                if (data.status !== 'running' && data.status !== 'pending') {
                    // Keep polling less frequently or stop? 
                    // Ideally stop, but we want to catch the final update immediately.
                    // For simplicity, we just keep polling if we want, but usually better to stop logic here.
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();

        // Poll every 3 seconds
        interval = setInterval(fetchDetails, 3000);

        return () => clearInterval(interval);
    }, [executionId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return '#4caf50';
            case 'failed': return '#f44336';
            case 'running': return '#2196f3';
            default: return '#999';
        }
    };

    if (loading && !details) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0070f3" />
            </View>
        );
    }

    if (!details) return null;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.statusLabel}>Execução #{executionId}</Text>
                    <Text style={styles.projectText}>Projeto #{details.projeto_id}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusColor(details.status) }]}>
                    <Text style={styles.badgeText}>{details.status}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Logs em Tempo Real</Text>
                <ScrollView
                    style={styles.logsContainer}
                    contentContainerStyle={{ padding: 12 }}
                    nestedScrollEnabled
                >
                    <Text style={styles.logText}>
                        {details.logs || 'Aguardando logs...'}
                    </Text>
                </ScrollView>
            </View>

            {details.resultado && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resultado Final</Text>
                    <View style={styles.resultContainer}>
                        <Text style={styles.codeText}>
                            {typeof details.resultado === 'string'
                                ? details.resultado
                                : JSON.stringify(details.resultado, null, 2)}
                        </Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
    },
    header: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    projectText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    logsContainer: {
        backgroundColor: '#000',
        borderRadius: 16,
        height: 350,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#334155',
    },
    logText: {
        color: '#4ade80',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        lineHeight: 18,
    },
    resultContainer: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
        elevation: 4,
    },
    codeText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        color: '#e2e8f0',
    },
});
