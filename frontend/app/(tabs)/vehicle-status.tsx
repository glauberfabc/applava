import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Vehicle {
  _id: string;
  plate: string;
  client_name: string;
  status: string;
  entry_date: string;
  service_details: Array<{ name: string; price: number; estimated_duration: number }>;
  observations?: string;
}

export default function VehicleStatusScreen() {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.plate) {
      loadVehicleStatus();
    }
  }, [user]);

  const loadVehicleStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/vehicles/${user?.plate}`
      );
      setVehicle(response.data);
    } catch (error) {
      console.error('Error loading vehicle status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'waiting':
        return {
          icon: 'time',
          text: 'Aguardando Início',
          color: '#FFA500',
          description: 'Seu veículo está na fila e em breve iniciaremos o serviço.',
        };
      case 'in_progress':
        return {
          icon: 'construct',
          text: 'Em Andamento',
          color: '#007AFF',
          description: 'Estamos trabalhando no seu veículo agora!',
        };
      case 'completed':
        return {
          icon: 'checkmark-circle',
          text: 'Concluído',
          color: '#4CAF50',
          description: 'Seu veículo está pronto para retirada!',
        };
      default:
        return {
          icon: 'help',
          text: status,
          color: '#888',
          description: '',
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color="#888" />
          <Text style={styles.emptyText}>Nenhum veículo em atendimento</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(vehicle.status);
  const total = vehicle.service_details.reduce((sum, service) => sum + service.price, 0);
  const estimatedTime = vehicle.service_details.reduce(
    (sum, service) => sum + service.estimated_duration,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadVehicleStatus} tintColor="#007AFF" />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Meu Veículo</Text>

          <View style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
            <View style={styles.statusHeader}>
              <Ionicons name={statusInfo.icon as any} size={48} color={statusInfo.color} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusText}>{statusInfo.text}</Text>
                <Text style={styles.statusDescription}>{statusInfo.description}</Text>
              </View>
            </View>
          </View>

          <View style={styles.vehicleCard}>
            <Text style={styles.plate}>{vehicle.plate}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#888" />
              <Text style={styles.infoText}>{vehicle.client_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#888" />
              <Text style={styles.infoText}>
                Entrada: {new Date(vehicle.entry_date).toLocaleString('pt-BR')}
              </Text>
            </View>
            {vehicle.status !== 'completed' && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#888" />
                <Text style={styles.infoText}>
                  Tempo estimado: {estimatedTime} minutos
                </Text>
              </View>
            )}
          </View>

          <View style={styles.servicesCard}>
            <Text style={styles.sectionTitle}>Serviços</Text>
            {vehicle.service_details.map((service, index) => (
              <View key={index} style={styles.serviceRow}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDuration}>{service.estimated_duration} min</Text>
                </View>
                <Text style={styles.servicePrice}>R$ {service.price.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
            </View>
          </View>

          {vehicle.observations && (
            <View style={styles.observationsCard}>
              <Text style={styles.sectionTitle}>Observações</Text>
              <Text style={styles.observationsText}>{vehicle.observations}</Text>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#888',
  },
  vehicleCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  plate: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
  },
  servicesCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3f5f',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 12,
    color: '#888',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#2a3f5f',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  observationsCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
  },
  observationsText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
});
