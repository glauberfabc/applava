import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Metrics {
  vehicles_in_yard: number;
  appointments_today: number;
  completed_today: number;
  revenue_today: number;
  revenue_month: number;
}

export default function DashboardScreen() {
  const [metrics, setMetrics] = useState<Metrics>({
    vehicles_in_yard: 0,
    appointments_today: 0,
    completed_today: 0,
    revenue_today: 0,
    revenue_month: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/dashboard/metrics`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({
    icon,
    title,
    value,
    color,
    subtitle,
  }: {
    icon: string;
    title: string;
    value: string | number;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadMetrics} tintColor="#007AFF" />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Visão Geral do Negócio</Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              icon="car-sport"
              title="Veículos no Pátio"
              value={metrics.vehicles_in_yard}
              color="#007AFF"
            />

            <MetricCard
              icon="calendar"
              title="Agendamentos Hoje"
              value={metrics.appointments_today}
              color="#FFA500"
            />

            <MetricCard
              icon="checkmark-circle"
              title="Concluídos Hoje"
              value={metrics.completed_today}
              color="#4CAF50"
            />

            <MetricCard
              icon="cash"
              title="Receita Hoje"
              value={`R$ ${metrics.revenue_today.toFixed(2)}`}
              color="#4CAF50"
            />

            <MetricCard
              icon="trending-up"
              title="Receita do Mês"
              value={`R$ ${metrics.revenue_month.toFixed(2)}`}
              color="#007AFF"
            />
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
    marginBottom: 24,
  },
  metricsGrid: {
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  metricTitle: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 14,
    color: '#888',
  },
});
