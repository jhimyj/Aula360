"use client"

import type React from "react"
import { useState, useMemo } from "react"
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

// ✅ INTERFAZ COMPLETA QUE COINCIDE CON EL HOOK useRooms
interface Room {
  id: string
  name: string
  studentCount: number
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  color: string
  course: string
  topic: string
  description: string
  created_at: string // 📅 Campo original de la API para ordenamiento
}

const RoomSelectorForStudents: React.FC = () => {
  const navigation = useNavigation()
  const { rooms, loading, error, refetchRooms } = useRooms()
  const [searchText, setSearchText] = useState("")

  // 📅 FUNCIÓN MEJORADA PARA ORDENAR SALAS POR FECHA DE CREACIÓN (MÁS RECIENTES PRIMERO)
  const sortRoomsByDate = (roomsToSort: Room[]): Room[] => {
    console.log("🔄 INICIANDO ORDENAMIENTO POR FECHA:")
    console.log("- Salas a ordenar:", roomsToSort.length)

    const sorted = [...roomsToSort].sort((a, b) => {
      // Si alguna sala no tiene fecha, ponerla al final
      if (!a.created_at && !b.created_at) return 0
      if (!a.created_at) return 1
      if (!b.created_at) return -1

      // Convertir fechas y ordenar (más recientes primero)
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()

      return dateB - dateA // Orden descendente (más recientes primero)
    })

    console.log("✅ ORDENAMIENTO COMPLETADO:")
    console.log("- Total ordenadas:", sorted.length)
    if (sorted.length > 0) {
      console.log("- Sala MÁS RECIENTE:", sorted[0].name, "->", sorted[0].created_at)
      console.log("- Sala MÁS ANTIGUA:", sorted[sorted.length - 1].name, "->", sorted[sorted.length - 1].created_at)
    }

    // 📊 LOG DETALLADO DE TODAS LAS SALAS ORDENADAS
    console.log("📋 ORDEN FINAL DE SALAS:")
    sorted.forEach((room, index) => {
      console.log(`${index + 1}. ${room.name} - ${room.created_at}`)
    })

    return sorted
  }

  // 📅 FUNCIÓN PARA OBTENER TIEMPO RELATIVO (ej: "hace 2 días")
  const getRelativeTime = (dateString: string) => {
    if (!dateString) return "Sin fecha"

    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    if (diffInDays > 0) {
      return `hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`
    } else if (diffInHours > 0) {
      return `hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`
    } else if (diffInMinutes > 0) {
      return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""}`
    } else {
      return "hace un momento"
    }
  }

  // 🔍 FILTRAR Y ORDENAR SALAS CON USEMEMO PARA OPTIMIZACIÓN
  const filteredAndSortedRooms = useMemo(() => {
    console.log("🔄 PROCESANDO SALAS:")
    console.log("- Salas totales recibidas:", rooms.length)
    console.log("- Texto de búsqueda:", searchText)

    // PASO 1: Ordenar TODAS las salas por fecha primero
    const allSortedRooms = sortRoomsByDate(rooms)

    // PASO 2: Luego filtrar por texto de búsqueda
    const filtered = allSortedRooms.filter(
      (room) =>
        room.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (room.course && room.course.toLowerCase().includes(searchText.toLowerCase())) ||
        (room.topic && room.topic.toLowerCase().includes(searchText.toLowerCase())) ||
        (room.description && room.description.toLowerCase().includes(searchText.toLowerCase())),
    )

    console.log("✅ PROCESAMIENTO FINAL:")
    console.log("- Salas después del filtro:", filtered.length)
    console.log("- Orden mantenido por fecha de creación")

    return filtered
  }, [rooms, searchText]) // Se recalcula cuando cambian las salas o el texto de búsqueda

  // 🎯 MANEJAR SELECCIÓN DE SALA
  const handleSelectRoom = (room: Room) => {
    console.log("🎯 Sala seleccionada para ver estudiantes:", {
      id: room.id,
      name: room.name,
      created_at: room.created_at,
      studentCount: room.studentCount,
      course: room.course,
      topic: room.topic,
    })
    navigation.navigate("StudentList", {
      roomId: room.id,
      roomName: room.name,
    })
  }

  // 📅 FUNCIONES DE FORMATEO DE FECHAS
  const formatDate = (dateString: string) => {
    if (!dateString) return "Sin fecha"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatFullDate = (dateString: string) => {
    if (!dateString) return "Sin fecha"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return "Sin hora"
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 🎨 RENDERIZAR TARJETA DE SALA CON INDICADOR DE POSICIÓN
  const renderRoom = ({ item, index }: { item: Room; index: number }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => handleSelectRoom(item)} activeOpacity={0.7}>
      {/* Header de la sala */}
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <View style={styles.roomTitleRow}>
            <Text style={styles.roomName}>{item.name}</Text>
            {/* 📍 Indicador de posición en el ordenamiento */}
            <View style={styles.positionIndicator}>
              <Text style={styles.positionText}>#{index + 1}</Text>
            </View>
          </View>

          {/* Tags informativos */}
          <View style={styles.tagsContainer}>
            {item.course && item.course !== "Sin curso" && (
              <View style={[styles.tag, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="book" size={10} color="#1976D2" />
                <Text style={[styles.tagText, { color: "#1976D2" }]}>{item.course}</Text>
              </View>
            )}

            {item.topic && item.topic !== "Sin tema" && (
              <View style={[styles.tag, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="pricetag" size={10} color="#7B1FA2" />
                <Text style={[styles.tagText, { color: "#7B1FA2" }]}>{item.topic}</Text>
              </View>
            )}

            {/* 📅 Tag de tiempo relativo */}
            <View style={[styles.tag, { backgroundColor: "#E8F5E8" }]}>
              <Ionicons name="time" size={10} color="#2E7D32" />
              <Text style={[styles.tagText, { color: "#2E7D32" }]}>{getRelativeTime(item.created_at)}</Text>
            </View>

            {/* 🎨 Tag de color de la sala */}
            <View style={[styles.tag, { backgroundColor: `${item.color}20` }]}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={[styles.tagText, { color: item.color }]}>Sala</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Ionicons name="chevron-forward" size={20} color="#4361EE" />
        </View>
      </View>

      {/* Descripción de la sala */}
      {item.description && (
        <Text style={styles.roomDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {/* Footer con información detallada */}
      <View style={styles.roomFooter}>
        <View style={styles.footerLeft}>
          {/* Fecha de creación */}
          <View style={styles.footerItem}>
            <Ionicons name="calendar" size={12} color="#999" />
            <Text style={styles.footerText}>Creada: {formatDate(item.created_at)}</Text>
          </View>

          {/* Hora de creación */}
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={12} color="#999" />
            <Text style={styles.footerText}>Hora: {formatTime(item.created_at)}</Text>
          </View>

          {/* Fecha completa (tooltip) */}
          <View style={styles.footerItem}>
            <Ionicons name="information-circle-outline" size={12} color="#999" />
            <Text style={styles.footerText} numberOfLines={1}>
              {formatFullDate(item.created_at)}
            </Text>
          </View>
        </View>

        {/* Indicador de estudiantes */}
        <View style={styles.studentsIndicator}>
          <Ionicons name="people" size={14} color="#4361EE" />
          <Text style={styles.studentsText}>
            {item.studentCount} estudiante{item.studentCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  // 🚫 ESTADO VACÍO - NO HAY SALAS
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="school-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No hay salas disponibles</Text>
      <Text style={styles.emptyStateText}>Crea una sala primero para poder ver sus estudiantes.</Text>
      <TouchableOpacity style={styles.createRoomButton} onPress={() => navigation.navigate("Salas")}>
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={styles.createRoomButtonText}>Crear sala</Text>
      </TouchableOpacity>
    </View>
  )

  // 🔍 ESTADO VACÍO - NO HAY RESULTADOS DE BÚSQUEDA
  const renderSearchEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No se encontraron salas</Text>
      <Text style={styles.emptyStateText}>No hay salas que coincidan con tu búsqueda "{searchText}".</Text>
      <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchText("")}>
        <Ionicons name="close-circle" size={16} color="#4361EE" />
        <Text style={styles.clearSearchButtonText}>Limpiar búsqueda</Text>
      </TouchableOpacity>
    </View>
  )

  // 🔄 PANTALLA DE CARGA INICIAL
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
          <Text style={styles.loadingSubtext}>Ordenando por fecha de creación...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // 🎨 PANTALLA PRINCIPAL
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* 📱 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seleccionar Sala</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refetchRooms}>
          <Ionicons name="refresh" size={24} color="#4361EE" />
        </TouchableOpacity>
      </View>

      {/* 🔍 BARRA DE BÚSQUEDA */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, curso, tema o descripción..."
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

      {/* ℹ️ INFORMACIÓN Y ESTADÍSTICAS MEJORADAS */}
      <View style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={16} color="#1976D2" />
          <Text style={styles.infoText}>📅 Ordenadas por fecha de creación (más recientes primero)</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredAndSortedRooms.length}</Text>
            <Text style={styles.statLabel}>Mostradas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rooms.length}</Text>
            <Text style={styles.statLabel}>Total cargadas</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="swap-vertical" size={16} color="#4CAF50" />
            <Text style={[styles.statLabel, { color: "#4CAF50" }]}>Ordenadas</Text>
          </View>
          {error && (
            <View style={styles.statItem}>
              <Ionicons name="warning" size={16} color="#FF5722" />
              <Text style={[styles.statLabel, { color: "#FF5722" }]}>Error</Text>
            </View>
          )}
        </View>
      </View>

      {/* 📋 LISTA DE SALAS ORDENADAS */}
      <FlatList
        data={filteredAndSortedRooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={rooms.length === 0 ? renderEmptyState : renderSearchEmptyState}
        refreshing={loading}
        onRefresh={refetchRooms}
        // 🚀 OPTIMIZACIONES PARA LISTAS GRANDES
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </SafeAreaView>
  )
}

// 🎨 ESTILOS COMPLETOS CON MEJORAS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // 📱 Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  placeholder: {
    width: 40,
  },

  // 🔍 Búsqueda
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },

  // ℹ️ Información
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#E3F2FD",
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 8,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1976D2",
    marginLeft: 6,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
  },
  statLabel: {
    fontSize: 12,
    color: "#1565C0",
    marginTop: 2,
  },

  // 📋 Lista
  listContainer: {
    padding: 20,
    paddingTop: 16,
  },

  // 🏠 Tarjeta de sala
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
    borderLeftWidth: 4,
    borderLeftColor: "#4361EE",
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  // 🆕 Fila del título con indicador de posición
  roomTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  // 🆕 Indicador de posición en el ordenamiento
  positionIndicator: {
    backgroundColor: "#4361EE",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  positionText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerRight: {
    marginLeft: 12,
  },

  // 🏷️ Tags
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // 📝 Descripción
  roomDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: "italic",
  },

  // 📊 Footer
  roomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
  footerLeft: {
    flex: 1,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
  studentsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  studentsText: {
    fontSize: 12,
    color: "#4361EE",
    fontWeight: "500",
    marginLeft: 4,
  },

  // 🚫 Estados vacíos
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4361EE",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createRoomButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 6,
  },
  clearSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4361EE",
    marginLeft: 6,
  },

  // 🔄 Carga
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
})

export { RoomSelectorForStudents }
export default RoomSelectorForStudents
