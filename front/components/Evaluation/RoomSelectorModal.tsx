"use client"

// components/Evaluation/RoomSelectorModal.tsx
import { useState, useEffect } from "react"
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
  Image,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"

interface Room {
  id: string
  name: string
  description?: string
  course?: string
  topic?: string
  created_at?: string
  color?: string
  studentCount?: number
  hasQuestions?: boolean
  questionCount?: number
}

interface RoomSelectorModalProps {
  visible: boolean
  onClose: () => void
  rooms: Room[]
  onSelectRoom: (room: Room) => void
  onViewAllRooms: () => void
  loading?: boolean
  // Props para paginación
  onLoadMore?: () => void
  hasMoreRooms?: boolean
  isLoadingMore?: boolean
}

const { width, height } = Dimensions.get("window")

const RoomSelectorModal = ({
  visible,
  onClose,
  rooms,
  onSelectRoom,
  onViewAllRooms,
  loading = false,
  onLoadMore,
  hasMoreRooms = false,
  isLoadingMore = false,
}: RoomSelectorModalProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [roomsWithQuestions, setRoomsWithQuestions] = useState<Set<string>>(new Set())
  const [checkingQuestions, setCheckingQuestions] = useState(false)

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  // 📅 FUNCIÓN PARA ORDENAR SALAS POR FECHA DE CREACIÓN (MÁS RECIENTES PRIMERO)
  const sortRoomsByDate = (roomsToSort: Room[]): Room[] => {
    return [...roomsToSort].sort((a, b) => {
      // Si alguna sala no tiene fecha, ponerla al final
      if (!a.created_at && !b.created_at) return 0
      if (!a.created_at) return 1
      if (!b.created_at) return -1

      // Convertir fechas y ordenar (más recientes primero)
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()

      return dateB - dateA // Orden descendente (más recientes primero)
    })
  }

  // Verificar qué salas tienen preguntas (solo para mostrar indicadores, no para filtrar)
  useEffect(() => {
    const checkAllRoomsForQuestions = async () => {
      if (!visible || rooms.length === 0) {
        return
      }

      console.log(`🔍 Verificando preguntas para ${rooms.length} salas...`)
      setCheckingQuestions(true)

      const roomsWithQuestionsSet = new Set<string>()

      // Verificar cada sala en paralelo para mejor rendimiento
      const promises = rooms.map(async (room) => {
        try {
          const token = await AsyncStorage.getItem("userToken")
          if (!token) {
            console.log(`❌ No se encontró token para verificar sala ${room.id}`)
            return { roomId: room.id, hasQuestions: false }
          }

          console.log(`🔍 Verificando preguntas para sala: ${room.id}`)

          const response = await axios.get(
            `https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/all/room/${room.id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          )

          const hasQuestions = response.data?.success && response.data?.data && response.data.data.length > 0
          console.log(
            `📊 Sala ${room.id} tiene preguntas:`,
            hasQuestions,
            `(${response.data?.data?.length || 0} preguntas)`,
          )

          if (hasQuestions) {
            roomsWithQuestionsSet.add(room.id)
          }

          return { roomId: room.id, hasQuestions, questionCount: response.data?.data?.length || 0 }
        } catch (error) {
          console.log(`❌ Error verificando preguntas para sala ${room.id}:`, error)
          return { roomId: room.id, hasQuestions: false }
        }
      })

      try {
        const results = await Promise.all(promises)
        console.log(`✅ Verificación completada:`, results)
        setRoomsWithQuestions(roomsWithQuestionsSet)
      } catch (error) {
        console.error("❌ Error verificando preguntas en salas:", error)
      } finally {
        setCheckingQuestions(false)
      }
    }

    checkAllRoomsForQuestions()
  }, [visible, rooms])

  if (!fontsLoaded) {
    return null
  }

  // 🔍 FILTRAR Y ORDENAR SALAS
  const getFilteredAndSortedRooms = () => {
    // Primero filtrar por búsqueda
    const filtered = rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.course && room.course.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (room.topic && room.topic.toLowerCase().includes(searchQuery.toLowerCase())),
    )

    // Luego ordenar por fecha de creación (más recientes primero)
    const sorted = sortRoomsByDate(filtered)

    console.log("📅 ORDENAMIENTO DE SALAS:")
    console.log("- Salas antes del ordenamiento:", filtered.length)
    console.log("- Salas después del ordenamiento:", sorted.length)
    if (sorted.length > 0) {
      console.log("- Sala más reciente:", sorted[0].name, "creada el:", sorted[0].created_at)
      console.log(
        "- Sala más antigua:",
        sorted[sorted.length - 1].name,
        "creada el:",
        sorted[sorted.length - 1].created_at,
      )
    }

    return sorted
  }

  const filteredRooms = getFilteredAndSortedRooms()

  console.log("🏠 SALAS DISPONIBLES EN MODAL:")
  console.log("- Total de salas recibidas:", rooms.length)
  console.log("- Salas después del filtro de búsqueda y ordenamiento:", filteredRooms.length)
  console.log("- Salas con preguntas:", rooms.filter((r) => roomsWithQuestions.has(r.id)).length)
  console.log("- Salas sin preguntas:", rooms.filter((r) => !roomsWithQuestions.has(r.id)).length)
  console.log("- ¿Hay más salas para cargar?:", hasMoreRooms)
  console.log("- ¿Cargando más salas?:", isLoadingMore)

  // Función para formatear la fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  // 📅 Función para formatear fecha completa (para mostrar en detalles)
  const formatFullDate = (dateString?: string) => {
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

  // 📅 Función para obtener tiempo relativo (ej: "hace 2 días")
  const getRelativeTime = (dateString?: string) => {
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

  // Colores predeterminados para las salas que no tienen color
  const defaultColors = ["#4361EE", "#3A0CA3", "#7209B7", "#F72585", "#4CC9F0", "#4895EF", "#560BAD"]

  const getColorForRoom = (room: Room, index: number) => {
    return room.color || defaultColors[index % defaultColors.length]
  }

  const handleSelectRoom = (room: Room) => {
    setSelectedRoomId(room.id)
    console.log("🎯 SALA SELECCIONADA:", {
      id: room.id,
      name: room.name,
      hasQuestions: roomsWithQuestions.has(room.id),
      created_at: room.created_at,
    })

    // Pequeña demora para mostrar la selección antes de cerrar
    setTimeout(() => {
      onSelectRoom(room)
      onClose()
      // Resetear la selección después de cerrar
      setTimeout(() => setSelectedRoomId(null), 300)
    }, 150)
  }

  // Función para manejar la carga de más salas
  const handleLoadMore = () => {
    if (hasMoreRooms && !isLoadingMore && onLoadMore) {
      console.log("📄 Cargando más salas...")
      onLoadMore()
    }
  }

  const renderRoomCard = ({ item, index }: { item: Room; index: number }) => {
    const roomColor = getColorForRoom(item, index)
    const isSelected = selectedRoomId === item.id
    const hasQuestions = roomsWithQuestions.has(item.id)

    return (
      <TouchableOpacity
        style={[styles.roomCard, isSelected && styles.selectedRoomCard]}
        onPress={() => handleSelectRoom(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.roomCardContent, { borderLeftColor: roomColor, borderLeftWidth: 4 }]}>
          <View style={styles.roomHeader}>
            <View style={[styles.roomIconContainer, { backgroundColor: `${roomColor}20` }]}>
              <Feather
                name={hasQuestions ? "check-circle" : "book-open"}
                size={20}
                color={hasQuestions ? "#4CAF50" : roomColor}
              />
            </View>

            <View style={styles.roomInfo}>
              <Text style={styles.roomName} numberOfLines={1}>
                {item.name}
              </Text>

              <View style={styles.tagsContainer}>
                {item.course && (
                  <View style={styles.tagContainer}>
                    <Text style={[styles.tagText, { color: roomColor }]}>{item.course}</Text>
                  </View>
                )}

                {/* Indicador de preguntas */}
                {hasQuestions ? (
                  <View style={[styles.tagContainer, { backgroundColor: "#E8F5E8" }]}>
                    <Text style={[styles.tagText, { color: "#2E7D32" }]}>Con preguntas</Text>
                  </View>
                ) : (
                  <View style={[styles.tagContainer, { backgroundColor: "#FFF3E0" }]}>
                    <Text style={[styles.tagText, { color: "#F57C00" }]}>Sin preguntas</Text>
                  </View>
                )}

                {/* 📅 NUEVO: Indicador de tiempo relativo */}
                <View style={[styles.tagContainer, { backgroundColor: "#F3E5F5" }]}>
                  <Text style={[styles.tagText, { color: "#7B1FA2" }]}>{getRelativeTime(item.created_at)}</Text>
                </View>
              </View>
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

            {/* 📅 NUEVO: Mostrar fecha completa en tooltip */}
            <View style={styles.roomDetail}>
              <Feather name="clock" size={12} color="#999" style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {formatFullDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Componente para el footer de la lista (botón de cargar más)
  const renderListFooter = () => {
    if (!hasMoreRooms) return null

    return (
      <View style={styles.loadMoreContainer}>
        {isLoadingMore ? (
          <View style={styles.loadingMoreIndicator}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.loadingMoreText}>Cargando más salas...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore} activeOpacity={0.7}>
            <Feather name="plus-circle" size={16} color="#4361EE" style={styles.loadMoreIcon} />
            <Text style={styles.loadMoreButtonText}>Cargar más salas</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={{
          uri: "https://img.freepik.com/free-vector/no-data-concept-illustration_114360-536.jpg?w=740&t=st=1684956399~exp=1684956999~hmac=f3c8adfbbb6a31d5d5b4c9ba90b3a69edeeb2dbd8c5f587a0017574562aba573",
        }}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>No se encontraron salas</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? `No hay resultados para "${searchQuery}"` : "No hay salas disponibles. Crea una sala primero."}
      </Text>
    </View>
  )

  const isLoading = loading || checkingQuestions

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Sala</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
              <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
                <Feather name="x-circle" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.modalDescription}>📚 Salas ordenadas por fecha (más recientes primero):</Text>

          {/* Información de salas */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rooms.length}</Text>
              <Text style={styles.statLabel}>Cargadas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rooms.filter((r) => roomsWithQuestions.has(r.id)).length}</Text>
              <Text style={styles.statLabel}>Con preguntas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rooms.filter((r) => !roomsWithQuestions.has(r.id)).length}</Text>
              <Text style={styles.statLabel}>Sin preguntas</Text>
            </View>
            {/* Indicador de más salas disponibles */}
            {hasMoreRooms && (
              <View style={styles.statItem}>
                <Feather name="more-horizontal" size={18} color="#FF9800" />
                <Text style={[styles.statLabel, { color: "#FF9800" }]}>Hay más</Text>
              </View>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4361EE" />
              <Text style={styles.loadingText}>
                {checkingQuestions ? "Verificando salas disponibles..." : "Cargando salas..."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredRooms}
              renderItem={renderRoomCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.roomsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={EmptyListComponent}
              ListFooterComponent={renderListFooter}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
            />
          )}

          <View style={styles.modalFooter}>
            {rooms.length > 5 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => {
                  onClose()
                  onViewAllRooms()
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllButtonText}>Ver todas las salas</Text>
                <Feather name="arrow-right" size={18} color="#4361EE" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
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
    height: "100%",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  clearButton: {
    padding: 6,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#4361EE",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#666",
  },
  roomsList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  roomCard: {
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  selectedRoomCard: {
    shadowColor: "#4361EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  roomCardContent: {
    padding: 16,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  roomIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
    marginRight: 8,
  },
  roomName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagContainer: {
    backgroundColor: "rgba(67, 97, 238, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  selectIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  roomDescription: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 18,
  },
  roomFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  roomDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#999",
  },
  // Estilos para cargar más salas
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  loadMoreIcon: {
    marginRight: 8,
  },
  loadMoreButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#4361EE",
  },
  loadingMoreIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#4361EE",
    marginRight: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#666",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
  },
})

export default RoomSelectorModal
