"use client"

import type React from "react"
import { useState } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useRooms } from "../../components/salas/hooks/useRooms"

interface Room {
  id: string
  name: string
  course?: string
  topic?: string
  description?: string
  created_at: string
}

const RoomSelectorForStudents: React.FC = () => {
  const navigation = useNavigation()
  const { rooms, loading, error, refetchRooms } = useRooms()
  const [searchText, setSearchText] = useState("")

  // Filtrar salas por texto de búsqueda
  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (room.course && room.course.toLowerCase().includes(searchText.toLowerCase())) ||
      (room.topic && room.topic.toLowerCase().includes(searchText.toLowerCase())),
  )

  const handleSelectRoom = (room: Room) => {
    console.log("Sala seleccionada para ver estudiantes:", room.name)
    navigation.navigate("StudentList", {
      roomId: room.id,
      roomName: room.name,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => handleSelectRoom(item)} activeOpacity={0.7}>
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{item.name}</Text>
          {item.course && <Text style={styles.roomCourse}>{item.course}</Text>}
          {item.topic && <Text style={styles.roomTopic}>{item.topic}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#4361EE" />
      </View>

      {item.description && (
        <Text style={styles.roomDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.roomFooter}>
        <Text style={styles.roomDate}>Creado: {formatDate(item.created_at)}</Text>
        <View style={styles.studentsIndicator}>
          <Ionicons name="people" size={14} color="#4361EE" />
          <Text style={styles.studentsText}>Ver estudiantes</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="school-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No hay salas disponibles</Text>
      <Text style={styles.emptyStateText}>Crea una sala primero para poder ver sus estudiantes.</Text>
      <TouchableOpacity style={styles.createRoomButton} onPress={() => navigation.navigate("Salas")}>
        <Text style={styles.createRoomButtonText}>Crear sala</Text>
      </TouchableOpacity>
    </View>
  )

  const renderSearchEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No se encontraron salas</Text>
      <Text style={styles.emptyStateText}>No hay salas que coincidan con tu búsqueda "{searchText}".</Text>
    </View>
  )

  if (loading && rooms.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleccionar Sala</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Cargando salas...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar salas..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Información */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Selecciona una sala para ver sus estudiantes registrados</Text>
        <Text style={styles.roomCount}>
          {filteredRooms.length} sala{filteredRooms.length !== 1 ? "s" : ""} disponible
          {filteredRooms.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Lista de salas */}
      <FlatList
        data={filteredRooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={rooms.length === 0 ? renderEmptyState : renderSearchEmptyState}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#E3F2FD",
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1976D2",
    textAlign: "center",
    marginBottom: 4,
  },
  roomCount: {
    fontSize: 12,
    color: "#1565C0",
    textAlign: "center",
    fontWeight: "500",
  },
  listContainer: {
    padding: 20,
    paddingTop: 16,
  },
  roomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  roomCourse: {
    fontSize: 14,
    color: "#4361EE",
    fontWeight: "500",
    marginBottom: 2,
  },
  roomTopic: {
    fontSize: 12,
    color: "#666",
  },
  roomDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  roomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomDate: {
    fontSize: 12,
    color: "#999",
  },
  studentsIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentsText: {
    fontSize: 12,
    color: "#4361EE",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  createRoomButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createRoomButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
})

export { RoomSelectorForStudents }
export default RoomSelectorForStudents
