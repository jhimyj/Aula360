// components/QRModal.js
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  Dimensions, 
  Clipboard, 
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";
import QRCode from 'react-native-qrcode-svg';

// Obtenemos dimensiones de pantalla
const { width: initialWidth, height: initialHeight } = Dimensions.get('window');

const QRModal = ({ 
  visible, 
  onClose, 
  room, 
  onSaveQR, 
  onShareQR, 
  onShareText, 
  qrLoading, 
  qrViewRef,
  getLiaLogoBase64 
}) => {
  const [screenDimensions, setScreenDimensions] = useState({ 
    width: initialWidth, 
    height: initialHeight 
  });
  
  // Calcular tamaño QR basado en el ancho de pantalla (máximo 200, mínimo 150)
  const qrSize = Math.min(200, Math.max(150, screenDimensions.width * 0.45));
  
  // Actualizar dimensiones cuando cambia la orientación
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      setScreenDimensions({ width, height });
    };
    
    const dimensionsListener = Dimensions.addEventListener('change', updateDimensions);
    
    return () => {
      // Limpiar listener en React Native moderno
      if (typeof dimensionsListener?.remove === 'function') {
        dimensionsListener.remove();
      } else {
        // Fallback para versiones anteriores
        Dimensions.removeEventListener('change', updateDimensions);
      }
    };
  }, []);

  // Calcular padding basado en tamaño de pantalla
  const containerPadding = screenDimensions.width < 350 ? 16 : 24;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <View style={styles.qrModalOverlay}>
            <ScrollView 
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[
                styles.qrModalContainer, 
                { 
                  padding: containerPadding,
                  width: screenDimensions.width > 500 
                    ? 450 
                    : screenDimensions.width * 0.9
                }
              ]}>
                {/* Header */}
                <View style={styles.qrModalHeader}>
                  <Text style={styles.qrModalTitle}>🚀 Código QR - LIA</Text>
                  <TouchableOpacity style={styles.qrCloseButton} onPress={onClose}>
                    <Feather name="x" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                {/* Room Info */}
                <View style={styles.qrRoomInfo}>
                  <Text style={styles.qrRoomName}>{room.name}</Text>
                  {room.course && <Text style={styles.qrRoomCourse}>{room.course}</Text>}
                  {room.topic && <Text style={styles.qrRoomTopic}>Tema: {room.topic}</Text>}
                </View>
                
                {/* QR Code Container - Responsivo */}
                <View ref={qrViewRef} style={styles.qrCaptureContainer}>
                  <View style={styles.qrContainer}>
                    <QRCode
                      value={room.short_code || room.id}
                      size={qrSize}
                      color="#333"
                      backgroundColor="#fff"
                      logo={{
                        uri: getLiaLogoBase64()
                      }}
                      logoSize={qrSize * 0.2}
                      logoBackgroundColor="transparent"
                      logoMargin={2}
                      logoBorderRadius={8}
                    />
                  </View>
                  
                  <View style={styles.liaTextContainer}>
                    <Text style={styles.liaText}>LIA</Text>
                    <Text style={styles.liaSubtext}>Learning Intelligence Assistant</Text>
                  </View>
                </View>
                
                {/* Room ID */}
                <View style={styles.qrIdContainer}>
                  <Text style={styles.qrIdLabel}>Código de la sala:</Text>
                  <Text style={styles.qrIdText}>{room.short_code || room.id}</Text>
                </View>
                
                {/* Action Buttons - Layout responsivo */}
                <View style={[
                  styles.qrButtonsContainer,
                  screenDimensions.width < 350 && { flexDirection: 'column' }
                ]}>
                  <TouchableOpacity 
                    style={[
                      styles.qrButton,
                      screenDimensions.width < 350 && styles.fullWidthButton
                    ]}
                    onPress={() => {
                      Clipboard.setString(room.short_code || room.id);
                      Alert.alert('✅ Copiado', 'El código ha sido copiado al portapapeles');
                    }}
                    disabled={qrLoading}
                  >
                    <Feather name="copy" size={16} color="#4361EE" />
                    <Text style={styles.qrButtonText}>Copiar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.qrButton, 
                      qrLoading && styles.qrButtonDisabled,
                      screenDimensions.width < 350 && styles.fullWidthButton
                    ]}
                    onPress={onSaveQR}
                    disabled={qrLoading}
                  >
                    <Feather name={qrLoading ? "loader" : "download"} size={16} color="#4361EE" />
                    <Text style={styles.qrButtonText}>
                      {qrLoading ? 'Guardando...' : 'Guardar'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.qrButton, 
                      styles.qrShareButton, 
                      qrLoading && styles.qrButtonDisabled,
                      screenDimensions.width < 350 && styles.fullWidthButton
                    ]}
                    onPress={onShareQR}
                    disabled={qrLoading}
                  >
                    <Feather name={qrLoading ? "loader" : "share-2"} size={16} color="#fff" />
                    <Text style={[styles.qrButtonText, styles.qrShareButtonText]}>
                      {qrLoading ? 'Compartiendo...' : 'Compartir'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.qrTextShareButton}
                  onPress={onShareText}
                  disabled={qrLoading}
                >
                  <Feather name="message-circle" size={16} color="#666" />
                  <Text style={styles.qrTextShareButtonText}>Compartir solo texto</Text>
                </TouchableOpacity>
                
                <Text style={styles.qrInstructions}>
                  🎓 Comparte este código QR para que otros se unan a tu sala de estudio en LIA
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  qrModalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  qrModalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: '#333',
    flex: 1,
  },
  qrCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrRoomInfo: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  qrRoomName: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  qrRoomCourse: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: '#4361EE',
    marginBottom: 2,
  },
  qrRoomTopic: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: '#666',
  },
  qrCaptureContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    width: '100%',
  },
  qrContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liaTextContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  liaText: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: '#4361EE',
    letterSpacing: 2,
  },
  liaSubtext: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: '#666',
    marginTop: 2,
  },
  qrIdContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    width: '100%',
  },
  qrIdLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: '#666',
    marginBottom: 4,
  },
  qrIdText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#333',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    textAlign: 'center',
    maxWidth: '100%',
  },
  qrButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4361EE',
    backgroundColor: 'transparent',
    minWidth: 80,
    justifyContent: 'center',
    flex: 1,
  },
  fullWidthButton: {
    width: '100%',
    marginBottom: 8,
  },
  qrButtonDisabled: {
    opacity: 0.6,
  },
  qrShareButton: {
    backgroundColor: '#4361EE',
    borderColor: '#4361EE',
  },
  qrButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: '#4361EE',
  },
  qrShareButtonText: {
    color: '#fff',
  },
  qrTextShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  qrTextShareButtonText: {
    marginLeft: 8,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: '#666',
  },
  qrInstructions: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});

export default QRModal;