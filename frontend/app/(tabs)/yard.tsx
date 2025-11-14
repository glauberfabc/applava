import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Vehicle {
  _id: string;
  plate: string;
  client_name: string;
  client_phone: string;
  status: 'waiting' | 'in_progress' | 'completed';
  entry_date: string;
  service_details: Array<{ name: string; price: number }>;
}

export default function YardScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'in_progress'>('all');

  useEffect(() => {
    loadVehicles();
  }, [filter]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? `${EXPO_PUBLIC_BACKEND_URL}/api/vehicles`
        : `${EXPO_PUBLIC_BACKEND_URL}/api/vehicles?status=${filter}`;
      
      const response = await axios.get(url);
      
      // Filter only vehicles in yard (not completed)
      const yardVehicles = response.data.filter(
        (v: Vehicle) => v.status !== 'completed'
      );
      setVehicles(yardVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVehicleStatus = async (vehicleId: string, newStatus: string) => {
    try {
      await axios.patch(`${EXPO_PUBLIC_BACKEND_URL}/api/vehicles/${vehicleId}`, {
        status: newStatus,
      });
      loadVehicles();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return '#FFA500';
      case 'in_progress':
        return '#007AFF';
      case 'completed':
        return '#4CAF50';
      default:
        return '#888';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Aguardando';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const getTimeDifference = (entryDate: string) => {
    const now = new Date();
    const entry = new Date(entryDate);
    const diffMs = now.getTime() - entry.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}min`;
    }
    return `${diffMins}min`;
  };

  const openWhatsApp = (phone: string, clientName: string, plate: string) => {
    const message = encodeURIComponent(
      `Olá ${clientName}! Seu veículo ${plate} está pronto para retirada. Aguardamos você!`
    );
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`;
    // In a real app, use Linking.openURL(whatsappUrl)
    Alert.alert('WhatsApp', `Mensagem para ${clientName}: Veículo ${plate} pronto!`);
  };

  const renderVehicleCard = ({ item }: { item: Vehicle }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.plate}>{item.plate}</Text>
          <Text style={styles.clientName}>{item.client_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.timeContainer}>
        <Ionicons name="time-outline" size={16} color="#888" />
        <Text style={styles.timeText}>No pátio há {getTimeDifference(item.entry_date)}</Text>
      </View>

      <View style={styles.services}>
        {item.service_details.map((service, index) => (
          <Text key={index} style={styles.serviceText}>
            • {service.name} - R$ {service.price.toFixed(2)}
          </Text>
        ))}
      </View>

      <View style={styles.actions}>
        {item.status === 'waiting' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => updateVehicleStatus(item._id, 'in_progress')}
          >
            <Text style={styles.actionButtonText}>Iniciar</Text>
          </TouchableOpacity>
        )}
        {item.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => updateVehicleStatus(item._id, 'completed')}
          >
            <Text style={styles.actionButtonText}>Finalizar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.whatsappButton]}
          onPress={() => openWhatsApp(item.client_phone, item.client_name, item.plate)}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Veículos no Pátio</Text>
        <Text style={styles.count}>{vehicles.length} veículos</Text>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'waiting' && styles.filterButtonActive]}
          onPress={() => setFilter('waiting')}
        >
          <Text style={[styles.filterText, filter === 'waiting' && styles.filterTextActive]}>
            Aguardando
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'in_progress' && styles.filterButtonActive]}
          onPress={() => setFilter('in_progress')}
        >
          <Text style={[styles.filterText, filter === 'in_progress' && styles.filterTextActive]}>
            Em Andamento
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        renderItem={renderVehicleCard}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadVehicles} tintColor="#007AFF" />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#888" />
            <Text style={styles.emptyText}>Nenhum veículo no pátio</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  count: {
    fontSize: 16,
    color: '#007AFF',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#16213e',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  plate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  timeText: {
    color: '#888',
    fontSize: 14,
  },
  services: {
    marginBottom: 16,
  },
  serviceText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flex: 0,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
});
