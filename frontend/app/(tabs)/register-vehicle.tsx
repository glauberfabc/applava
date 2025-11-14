import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Service {
  _id: string;
  name: string;
  price: number;
  estimated_duration: number;
}

export default function RegisterVehicleScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [plate, setPlate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [observations, setObservations] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleCameraCapture = async () => {
    if (!cameraRef) return;

    try {
      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      setCapturedImage(`data:image/jpg;base64,${photo.base64}`);
      setShowCamera(false);

      // Perform OCR
      setProcessingOCR(true);
      try {
        const response = await axios.post(
          `${EXPO_PUBLIC_BACKEND_URL}/api/vehicles/ocr`,
          { image_base64: photo.base64 }
        );
        setPlate(response.data.plate);
      } catch (error) {
        console.error('OCR error:', error);
        Alert.alert('Aviso', 'Não foi possível ler a placa automaticamente. Digite manualmente.');
      } finally {
        setProcessingOCR(false);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Erro', 'Erro ao capturar foto');
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permissão necessária', 'Por favor, permita o acesso à câmera');
        return;
      }
    }
    setShowCamera(true);
  };

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSubmit = async () => {
    if (!plate || !clientName || !clientPhone || selectedServices.length === 0) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const photos = capturedImage ? [capturedImage, ...additionalPhotos] : additionalPhotos;

      await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/vehicles`, {
        plate: plate.toUpperCase(),
        client_name: clientName,
        client_phone: clientPhone,
        services: selectedServices,
        observations,
        photos,
      });

      Alert.alert('Sucesso', 'Veículo registrado com sucesso!');
      
      // Reset form
      setCapturedImage(null);
      setPlate('');
      setClientName('');
      setClientPhone('');
      setObservations('');
      setSelectedServices([]);
      setAdditionalPhotos([]);
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao registrar veículo');
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          ref={(ref) => setCameraRef(ref)}
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.cameraBottom}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCameraCapture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Registrar Veículo</Text>

          {/* Plate Photo */}
          <TouchableOpacity style={styles.photoButton} onPress={openCamera}>
            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={48} color="#007AFF" />
                <Text style={styles.photoText}>Capturar Placa</Text>
              </View>
            )}
          </TouchableOpacity>

          {processingOCR && (
            <View style={styles.ocrLoading}>
              <ActivityIndicator color="#007AFF" />
              <Text style={styles.ocrText}>Processando OCR...</Text>
            </View>
          )}

          {/* Plate Input */}
          <TextInput
            style={styles.input}
            placeholder="Placa do Veículo"
            placeholderTextColor="#888"
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
            maxLength={7}
          />

          {/* Client Info */}
          <TextInput
            style={styles.input}
            placeholder="Nome do Cliente"
            placeholderTextColor="#888"
            value={clientName}
            onChangeText={setClientName}
          />

          <TextInput
            style={styles.input}
            placeholder="Telefone (WhatsApp)"
            placeholderTextColor="#888"
            value={clientPhone}
            onChangeText={setClientPhone}
            keyboardType="phone-pad"
          />

          {/* Services */}
          <Text style={styles.sectionTitle}>Serviços</Text>
          {services.map(service => (
            <TouchableOpacity
              key={service._id}
              style={[
                styles.serviceItem,
                selectedServices.includes(service._id) && styles.serviceItemSelected,
              ]}
              onPress={() => toggleService(service._id)}
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDetails}>
                  R$ {service.price.toFixed(2)} - {service.estimated_duration} min
                </Text>
              </View>
              <Ionicons
                name={selectedServices.includes(service._id) ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedServices.includes(service._id) ? '#007AFF' : '#888'}
              />
            </TouchableOpacity>
          ))}

          {/* Observations */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Observações"
            placeholderTextColor="#888"
            value={observations}
            onChangeText={setObservations}
            multiline
            numberOfLines={4}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Registrar Veículo</Text>
            )}
          </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  photoButton: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    color: '#007AFF',
    marginTop: 8,
    fontSize: 16,
  },
  ocrLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#16213e',
    borderRadius: 8,
    marginBottom: 16,
  },
  ocrText: {
    color: '#007AFF',
    marginLeft: 12,
    fontSize: 14,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  serviceItemSelected: {
    backgroundColor: '#0a4080',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDetails: {
    color: '#888',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  cameraBottom: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
