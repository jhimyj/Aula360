// components/Evaluation/RoomSelectorModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface Room {
  id: string;
  name: string;
  description?: string;
  course?: string;
  topic?: string;
  created_at?: string;
  color?: string;
  studentCount?: number;
}

interface RoomSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
  onViewAllRooms: () => void;
  loading?: boolean;
}

const { width, height } = Dimensions.get('window');

const RoomSelectorModal = ({ 
  visible, 
  onClose, 
  rooms, 
  onSelectRoom,
  onViewAllRooms,
  loading = false
}: RoomSelectorModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
  });

  if (!fontsLoaded) {
    return null;
  }

  // Filtrar salas según la búsqueda
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.course && room.course.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (room.topic && room.topic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Función para formatear la fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  // Colores predeterminados para las salas que no tienen color
  const defaultColors = ['#4361EE', '#3A0CA3', '#7209B7', '#F72585', '#4CC9F0', '#4895EF', '#560BAD'];
  
  const getColorForRoom = (room: Room, index: number) => {
    return room.color || defaultColors[index % defaultColors.length];
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoomId(room.id);
    // Pequeña demora para mostrar la selección antes de cerrar
    setTimeout(() => {
      onSelectRoom(room);
      onClose();
      // Resetear la selección después de cerrar
      setTimeout(() => setSelectedRoomId(null), 300);
    }, 150);
  };

  const renderRoomCard = ({ item, index }: { item: Room; index: number }) => {
    const roomColor = getColorForRoom(item, index);
    const isSelected = selectedRoomId === item.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.roomCard,
          isSelected && styles.selectedRoomCard
        ]}
        onPress={() => handleSelectRoom(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.roomCardContent, { borderLeftColor: roomColor, borderLeftWidth: 4 }]}>
          <View style={styles.roomHeader}>
            <View style={[styles.roomIconContainer, { backgroundColor: `${roomColor}20` }]}>
              <Feather name="book-open" size={20} color={roomColor} />
            </View>
            
            <View style={styles.roomInfo}>
              <Text style={styles.roomName} numberOfLines={1}>{item.name}</Text>
              
              {item.course && (
                <View style={styles.tagContainer}>
                  <Text style={[styles.tagText, { color: roomColor }]}>{item.course}</Text>
                </View>
              )}
            </View>
            
            <View style={[styles.selectIndicator, isSelected && { backgroundColor: roomColor }]}>
              {isSelected ? (
                <Feather name="check" size={14} color="#FFF" />
              ) : (
                <Feather name="chevron-right" size={16} color="#999" />
              )}
            </View>
          </View>
          
          {item.description && (
            <Text style={styles.roomDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.roomFooter}>
            <View style={styles.roomDetail}>
              <Feather name="calendar" size={12} color="#999" style={styles.detailIcon} />
              <Text style={styles.detailText}>{formatDate(item.created_at)}</Text>
            </View>
            
            {item.topic && (
              <View style={styles.roomDetail}>
                <Feather name="tag" size={12} color="#999" style={styles.detailIcon} />
                <Text style={styles.detailText}>{item.topic}</Text>
              </View>
            )}
            
            <View style={styles.roomDetail}>
              <Feather name="users" size={12} color="#999" style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.studentCount || 0} estudiantes</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{ uri: 'https://img.freepik.com/free-vector/no-data-concept-illustration_114360-536.jpg?w=740&t=st=1684956399~exp=1684956999~hmac=f3c8adfbbb6a31d5d5b4c9ba90b3a69edeeb2dbd8c5f587a0017574562aba573' }} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>No se encontraron salas</Text>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? `No hay resultados para "${searchQuery}"`
          : "No hay salas disponibles. Crea una sala primero."}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Sala</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Feather name="x" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, curso o tema..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Feather name="x-circle" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.modalDescription}>
            Selecciona una sala para subir evaluaciones:
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4361EE" />
              <Text style={styles.loadingText}>Cargando salas...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRooms}
              renderItem={renderRoomCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.roomsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={EmptyListComponent}
            />
          )}
          
          <View style={styles.modalFooter}>
            {rooms.length > 5 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => {
                  onClose();
                  onViewAllRooms();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllButtonText}>Ver todas las salas</Text>
                <Feather name="arrow-right" size={18} color="#4361EE" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  clearButton: {
    padding: 6,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  roomsList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  roomCard: {
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  selectedRoomCard: {
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  roomCardContent: {
    padding: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
    marginRight: 8,
  },
  roomName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  tagContainer: {
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  selectIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 18,
  },
  roomFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  roomDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#4361EE',
    marginRight: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#666',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
  },
});

export default RoomSelectorModal;