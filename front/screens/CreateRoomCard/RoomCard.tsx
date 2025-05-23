// components/CreateRoomCard/RoomCard.tsx
import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import QuestionsModal from "../../components/Evaluation/QuestionsModal";

const { width: screenWidth } = Dimensions.get('window');

export default function RoomCard({ 
  room, 
  onViewMore, 
  onEdit, 
  onDelete, 
  onViewQuestions, 
  onUploadEvaluation 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [questionsModalVisible, setQuestionsModalVisible] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  const moreButtonRef = useRef(null);

  const handleMenuPress = () => {
    // Medir la posición del botón de tres puntos
    moreButtonRef.current?.measure((fx, fy, width, height, px, py) => {
      setMenuPosition({
        top: py + height + 5, // Un poco abajo del botón
        right: screenWidth - px - width, // Alineado a la derecha del botón
      });
      setShowMenu(true);
    });
  };

  // Función para obtener el token de autenticación
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      return token;
    } catch (error) {
      console.error('Error al obtener el token:', error);
      throw error;
    }
  };

  // Función para obtener las preguntas de una sala
  const fetchRoomQuestions = async (roomId) => {
    try {
      setLoadingQuestions(true);
      setQuestionsError(null);
      
      const token = await getAuthToken();
      
      const response = await fetch(
        `https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/all/room/${roomId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error al obtener las preguntas: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Preguntas obtenidas:', data);
      
      if (data.success) {
        setQuestions(data.data || []);
      } else {
        throw new Error(data.message || 'Error al obtener las preguntas');
      }
    } catch (error) {
      console.error('Error al obtener las preguntas:', error);
      setQuestionsError(error.message);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleMenuOption = async (option) => {
    setShowMenu(false);
    
    switch (option) {
      case 'view':
        onViewMore && onViewMore(room);
        break;
      case 'questions':
        // Manejar la visualización de preguntas directamente aquí
        console.log('Ver preguntas de:', room.name);
        setQuestionsModalVisible(true);
        await fetchRoomQuestions(room.id);
        break;
      case 'upload':
        onUploadEvaluation && onUploadEvaluation(room);
        break;
      case 'edit':
        onEdit && onEdit(room);
        break;
      case 'delete':
        Alert.alert(
          'Eliminar Sala',
          `¿Estás seguro de que quieres eliminar "${room.name}"?\n\nEsta acción eliminará todas las preguntas asociadas y no se puede deshacer.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Eliminar', 
              style: 'destructive',
              onPress: () => onDelete && onDelete(room)
            }
          ]
        );
        break;
    }
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  return (
    <>
      <TouchableOpacity style={styles.roomCard} activeOpacity={0.9}>
        {/* Room Info */}
        <View style={styles.roomInfo}>
          <View style={[styles.roomIconContainer, { backgroundColor: `${room.color || '#4361EE'}20` }]}>
            <Feather name="book-open" size={20} color={room.color || '#4361EE'} />
          </View>
          <View style={styles.roomNameContainer}>
            <Text style={styles.roomName}>{room.name}</Text>
            
            {/* Curso */}
            {room.course && (
              <Text style={styles.roomCourse}>{room.course}</Text>
            )}
            
            {/* Descripción */}
            {room.description && (
              <Text style={styles.roomDescription} numberOfLines={2}>
                {room.description}
              </Text>
            )}
            
            <Text style={styles.roomStatus}>Activa</Text>
          </View>
          <TouchableOpacity 
            ref={moreButtonRef}
            style={styles.moreButton} 
            onPress={handleMenuPress}
          >
            <Feather name="more-vertical" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Room Details */}
        <View style={[styles.roomDetails, { backgroundColor: room.color || '#4361EE' }]}>
          <View style={styles.roomStudentsCount}>
            <View>
              <Text style={styles.roomStudentsLabel}>N° estudiantes</Text>
              <View style={styles.studentAvatars}>
                {[...Array(Math.min(3, room.studentCount || 0))].map((_, i) => (
                  <View key={i} style={[styles.studentAvatar, { marginLeft: i * -10 }]}>
                    <Text style={styles.studentAvatarText}>{i + 1}</Text>
                  </View>
                ))}
                {(room.studentCount || 0) > 3 && (
                  <View style={[styles.studentAvatar, styles.moreAvatar, { marginLeft: -10 }]}>
                    <Text style={styles.moreAvatarText}>+{(room.studentCount || 0) - 3}</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.roomStudentsNumber}>{room.studentCount || 0}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.roomDates}>
            <View style={styles.roomDateColumn}>
              <View style={styles.dateRow}>
                <Feather name="calendar" size={14} color="#fff" style={styles.dateIcon} />
                <Text style={styles.roomDateText}>
                  Creada: {formatDate(room.created_at)}
                </Text>
              </View>
              <View style={styles.dateRow}>
                <Feather name="clock" size={14} color="#fff" style={styles.dateIcon} />
                <Text style={styles.roomDateText}>
                  {room.startTime || 'Sin horario'}
                </Text>
              </View>
            </View>
            <View style={styles.roomDateColumn}>
              <View style={styles.dateRow}>
                <Feather name="target" size={14} color="#fff" style={styles.dateIcon} />
                <Text style={styles.roomDateText}>
                  Tema: {room.topic || 'General'}
                </Text>
              </View>
              <View style={styles.dateRow}>
                <Feather name="users" size={14} color="#fff" style={styles.dateIcon} />
                <Text style={styles.roomDateText}>
                  Activa
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Popover Menu */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.popoverOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          {/* Menú posicionado */}
          <View 
            style={[
              styles.popoverMenu, 
              { 
                top: menuPosition.top, 
                right: menuPosition.right 
              }
            ]}
          >
            {/* Flecha hacia arriba */}
            <View style={styles.popoverArrow} />
            
            <TouchableOpacity 
              style={styles.popoverItem} 
              onPress={() => handleMenuOption('view')}
            >
              <Feather name="info" size={18} color="#4361EE" />
              <Text style={styles.popoverItemText}>Ver detalles</Text>
            </TouchableOpacity>
            
            <View style={styles.popoverDivider} />
            
            <TouchableOpacity 
              style={styles.popoverItem} 
              onPress={() => handleMenuOption('questions')}
            >
              <Feather name="help-circle" size={18} color="#4361EE" />
              <Text style={styles.popoverItemText}>Ver preguntas</Text>
            </TouchableOpacity>
            
            <View style={styles.popoverDivider} />
            
            <TouchableOpacity 
              style={styles.popoverItem} 
              onPress={() => handleMenuOption('upload')}
            >
              <Feather name="upload" size={18} color="#4361EE" />
              <Text style={styles.popoverItemText}>Subir evaluación</Text>
            </TouchableOpacity>
            
            <View style={styles.popoverDivider} />
            
            <TouchableOpacity 
              style={styles.popoverItem} 
              onPress={() => handleMenuOption('edit')}
            >
              <Feather name="edit-2" size={18} color="#FF8C00" />
              <Text style={styles.popoverItemText}>Editar</Text>
            </TouchableOpacity>
            
            <View style={styles.popoverDivider} />
            
            <TouchableOpacity 
              style={styles.popoverItem} 
              onPress={() => handleMenuOption('delete')}
            >
              <Feather name="trash-2" size={18} color="#FF4444" />
              <Text style={[styles.popoverItemText, styles.deleteText]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para mostrar preguntas */}
      <QuestionsModal
        visible={questionsModalVisible}
        onClose={() => setQuestionsModalVisible(false)}
        questions={questions}
        roomName={room.name}
        loading={loadingQuestions}
        error={questionsError}
      />
    </>
  );
}

const styles = StyleSheet.create({
  roomCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  roomIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roomNameContainer: {
    flex: 1,
  },
  roomName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 2,
  },
  roomCourse: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#4361EE",
    marginBottom: 2,
  },
  roomDescription: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginTop: 2,
    marginBottom: 4,
    lineHeight: 18,
  },
  roomStatus: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#4CAF50",
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
  },
  roomDetails: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
  },
  roomStudentsCount: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  roomStudentsLabel: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    marginBottom: 4,
  },
  studentAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  studentAvatarText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
  moreAvatar: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  moreAvatarText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
  },
  roomStudentsNumber: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 12,
  },
  roomDates: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roomDateColumn: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateIcon: {
    marginRight: 6,
  },
  roomDateText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },
  // Estilos del popover
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  popoverMenu: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  popoverArrow: {
    position: 'absolute',
    top: -6,
    right: 16,
    width: 12,
    height: 12,
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E5E5E5',
    transform: [{ rotate: '45deg' }],
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  popoverItemText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#333',
  },
  popoverDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
  },
  deleteText: {
    color: '#FF4444',
  },
});