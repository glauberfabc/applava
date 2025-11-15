import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!date || !time) {
      Alert.alert('Erro', 'Por favor, preencha data e hora');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/appointments`, {
        client_phone: user?.phone || '',
        vehicle_plate: user?.plate || '',
        services: [],
        date,
        time,
        notes,
      });

      Alert.alert('Sucesso', 'Agendamento realizado com sucesso!');
      setDate('');
      setTime('');
      setNotes('');
    } catch (error: any) {
      console.error('Schedule error:', error);
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao agendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Agendar Serviço</Text>
          <Text style={styles.subtitle}>Escolha data e horário para seu atendimento</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={24} color="#007AFF" />
            <TextInput
              style={styles.input}
              placeholder="Data (DD/MM/AAAA)"
              placeholderTextColor="#888"
              value={date}
              onChangeText={setDate}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
            <TextInput
              style={styles.input}
              placeholder="Horário (HH:MM)"
              placeholderTextColor="#888"
              value={time}
              onChangeText={setTime}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={24} color="#007AFF" />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observações (opcional)"
              placeholderTextColor="#888"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSchedule}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Confirmar Agendamento</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Informações Importantes</Text>
              <Text style={styles.infoText}>
                • Chegue com 10 minutos de antecedência{'\n'}
                • Traga os documentos do veículo{'\n'}
                • Em caso de atraso, entre em contato
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
});
