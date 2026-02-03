import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity, Text, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ExecutionDetailsScreen from './src/screens/ExecutionDetailsScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator screenOptions={({ navigation }) => ({
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
            headerStyle: { backgroundColor: '#1e293b' },
            headerTitleStyle: { fontWeight: 'bold', color: '#f8fafc' },
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: 15 }}
                    onPress={async () => {
                        await AsyncStorage.removeItem('token');
                        navigation.replace('Login');
                    }}
                >
                    <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Sair</Text>
                </TouchableOpacity>
            )
        })}>
            <Tab.Screen
                name="Projects"
                component={ProjectsScreen}
                options={{ title: 'Projetos' }}
            />
            <Tab.Screen
                name="Executions"
                component={DashboardScreen}
                options={{ title: 'Execuções' }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
            <NavigationContainer theme={DarkTheme}>
                <Stack.Navigator initialRouteName="Login">
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Main"
                        component={MainTabs}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="ExecutionDetails"
                        component={ExecutionDetailsScreen}
                        options={{
                            title: 'Detalhes',
                            headerStyle: { backgroundColor: '#1e293b' },
                            headerTitleStyle: { color: '#f8fafc' },
                            headerTintColor: '#3b82f6'
                        }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
