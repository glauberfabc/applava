import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [mode, setMode] = useState<'email' | 'plate'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithPlate } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handlePlateLogin = async () => {
    if (!plate) {
      Alert.alert('Erro', 'Por favor, digite a placa do veículo');
      return;
    }

    setLoading(true);
    try {
      await loginWithPlate(plate.toUpperCase());
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Veículo não encontrado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Estética Automotiva</Text>
          <Text style={styles.subtitle}>Gestão Profissional</Text>

          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'email' && styles.modeButtonActive]}
              onPress={() => setMode('email')}
            >
              <Text style={[styles.modeText, mode === 'email' && styles.modeTextActive]}>
                Admin/Colaborador
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'plate' && styles.modeButtonActive]}
              onPress={() => setMode('plate')}
            >
              <Text style={[styles.modeText, mode === 'plate' && styles.modeTextActive]}>
                Cliente
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'email' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleEmailLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Placa do Veículo (ex: ABC1234)"
                placeholderTextColor="#888"
                value={plate}
                onChangeText={setPlate}
                autoCapitalize="characters"
                maxLength={7}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handlePlateLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Verificando...' : 'Acessar'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 48,
  },
  modeSwitch: {
    flexDirection: 'row',
    marginBottom: 32,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
