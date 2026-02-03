import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, BASE_URL } from '../services/api';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Preencha todos os campos');
            return;
        }

        const sanitizedEmail = email.trim().toLowerCase();
        const sanitizedPassword = password.trim();

        setLoading(true);
        try {
            const data = await login(sanitizedEmail, sanitizedPassword);
            await AsyncStorage.setItem('token', data.access_token);
            navigation.replace('Main');
        } catch (error) {
            console.error('Erro de Login:', error);
            Alert.alert('Erro', `Login falhou: ${error.message}. Verifique se o backend está acessível em ${BASE_URL}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>DevFlow Mobile</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#f8fafc',
        textAlign: 'center',
        marginBottom: 40,
    },
    input: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        color: '#f8fafc',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
