import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Vehicle {
  _id: string;
  plate: string;
  client_name: string;
  status: string;
  entry_date: string;
  updated_at: string;
  service_details: Array<{ name: string; price: number }>;
}

export default function HistoryScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/vehicles?status=completed`);
      setVehicles(response.data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryCard = ({ item }: { item: Vehicle }) => {
    const total = item.service_details.reduce((sum, service) => sum + service.price, 0);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.plate}>{item.plate}</Text>
            <Text style={styles.clientName}>{item.client_name}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        </View>

        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#888" />
          <Text style={styles.dateText}>
            {new Date(item.updated_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        <View style={styles.services}>
          {item.service_details.map((service, index) => (
            <Text key={index} style={styles.serviceText}>
              • {service.name} - R$ {service.price.toFixed(2)}
            </Text>
          ))}
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.count}>{vehicles.length} serviços concluídos</Text>
      </View>

      <FlatList
        data={vehicles}
        renderItem={renderHistoryCard}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadHistory} tintColor="#007AFF" />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#888" />
            <Text style={styles.emptyText}>Nenhum serviço concluído</Text>
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
    fontSize: 14,
    color: '#888',
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
    padding: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  dateText: {
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a3f5f',
  },
  totalLabel: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    color: '#4CAF50',
    fontSize: 20,
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
