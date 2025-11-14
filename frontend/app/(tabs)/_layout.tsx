import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import React from 'react';

export default function TabLayout() {
  const { user } = useAuth();

  // Admin tabs
  if (user?.role === 'admin') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            backgroundColor: '#16213e',
            borderTopColor: '#2a3f5f',
          },
          headerStyle: {
            backgroundColor: '#16213e',
          },
          headerTintColor: '#fff',
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="yard"
          options={{
            title: 'Pátio',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car-sport" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="financial"
          options={{
            title: 'Financeiro',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Configurações',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="register-vehicle" options={{ href: null }} />
        <Tabs.Screen name="vehicle-status" options={{ href: null }} />
        <Tabs.Screen name="schedule" options={{ href: null }} />
        <Tabs.Screen name="history" options={{ href: null }} />
      </Tabs>
    );
  }

  // Collaborator tabs
  if (user?.role === 'collaborator') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            backgroundColor: '#16213e',
            borderTopColor: '#2a3f5f',
          },
          headerStyle: {
            backgroundColor: '#16213e',
          },
          headerTintColor: '#fff',
        }}
      >
        <Tabs.Screen
          name="register-vehicle"
          options={{
            title: 'Registrar',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="yard"
          options={{
            title: 'Pátio',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car-sport" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Histórico',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="dashboard" options={{ href: null }} />
        <Tabs.Screen name="financial" options={{ href: null }} />
        <Tabs.Screen name="vehicle-status" options={{ href: null }} />
        <Tabs.Screen name="schedule" options={{ href: null }} />
      </Tabs>
    );
  }

  // Client tabs
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#16213e',
          borderTopColor: '#2a3f5f',
        },
        headerStyle: {
          backgroundColor: '#16213e',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="vehicle-status"
        options={{
          title: 'Meu Veículo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Agendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="financial" options={{ href: null }} />
      <Tabs.Screen name="register-vehicle" options={{ href: null }} />
      <Tabs.Screen name="yard" options={{ href: null }} />
    </Tabs>
  );
}
