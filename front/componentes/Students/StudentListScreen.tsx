"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Tipos para los estudiantes
interface Student {
  id: string
  username: string
  role: string
  score_student: number
  score_villain: number
  status: string
  room_id: string
  created_at: string
  updated_at: string
  data: any
}

interface StudentsResponse {
  success: boolean
  code: string
  message: string
  data: {
    students: Student[]
    size: number
    last_evaluated_key?: string
  }
  request_id: string
}

interface RouteParams {
  roomId: string
  roomName: string
}

const StudentListScreen: React.FC = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { roomId, roomName } = route.params as RouteParams

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔍 NUEVO: Estado para la búsqueda
  const [searchText, setSearchText] = useState("")
  const [isSearchActive, setIsSearchActive] = useState(false)

  // Función para obtener estudiantes del endpoint
  const fetchStudents = async (isRefresh = false, lastKey?: string) => {
    try {
      console.log("🔍 Obteniendo estudiantes para sala:", roomId)

      const teacherToken = await AsyncStorage.getItem("userToken")
      if (!teacherToken) {
        throw new Error("No se encontró el token del profesor")
      }

      let url = `https://iza2ya8d9j.execute-api.us-east-1.amazonaws.com/dev/students/all/room/${roomId}`
      const queryParams = new URLSearchParams()

      queryParams.append("size", "20")

      if (lastKey) {
        queryParams.append("last_evaluated_key", lastKey)
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }

      console.log("📡 URL de solicitud:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data: StudentsResponse = await response.json()
      console.log("✅ Respuesta del endpoint:", data)

      if (data.success && data.data) {
        const newStudents = data.data.students || []

        if (isRefresh) {
          setStudents(newStudents)
        } else {
          setStudents((prev) => [...prev, ...newStudents])
        }

        setLastEvaluatedKey(data.data.last_evaluated_key || null)
        setHasMoreData(!!data.data.last_evaluated_key)
        setError(null)

        console.log(`📚 Se cargaron ${newStudents.length} estudiantes`)
      } else {
        throw new Error(data.message || "Error al obtener estudiantes")
      }
    } catch (error: any) {
      console.error("❌ Error obteniendo estudiantes:", error)
      setError(error.message)

      if (!isRefresh && students.length === 0) {
        Alert.alert("Error", `No se pudieron cargar los estudiantes: ${error.message}`, [{ text: "OK" }])
      }
    }
  }

  // 🔍 NUEVO: Filtrar estudiantes por nombre usando useMemo para optimización
  const filteredStudents = useMemo(() => {
    if (!searchText.trim()) {
      return students
    }

    const filtered = students.filter((student) =>
      student.username.toLowerCase().includes(searchText.toLowerCase().trim()),
    )

    console.log(`🔍 Búsqueda "${searchText}": ${filtered.length} de ${students.length} estudiantes`)
    return filtered
  }, [students, searchText])

  // 🔍 NUEVO: Estadísticas basadas en estudiantes filtrados
  const filteredStats = useMemo(() => {
    const totalStudents = filteredStudents.length
    const activeStudents = filteredStudents.filter((s) => s.status === "CREATED").length
    const averageScore =
      totalStudents > 0 ? Math.round(filteredStudents.reduce((sum, s) => sum + s.score_student, 0) / totalStudents) : 0

    return {
      total: totalStudents,
      active: activeStudents,
      average: averageScore,
    }
  }, [filteredStudents])

  // Cargar estudiantes inicialmente
  useEffect(() => {
    const loadInitialStudents = async () => {
      setLoading(true)
      await fetchStudents(true)
      setLoading(false)
    }

    loadInitialStudents()
  }, [roomId])

  // Función para refrescar
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    setLastEvaluatedKey(null)
    setHasMoreData(true)
    await fetchStudents(true)
    setRefreshing(false)
  }, [roomId])

  // Función para cargar más estudiantes
  const handleLoadMore = useCallback(async () => {
    // 🔍 NUEVO: No cargar más si hay búsqueda activa
    if (!loadingMore && hasMoreData && lastEvaluatedKey && !searchText.trim()) {
      setLoadingMore(true)
      await fetchStudents(false, lastEvaluatedKey)
      setLoadingMore(false)
    }
  }, [loadingMore, hasMoreData, lastEvaluatedKey, searchText])

  // 🔍 NUEVO: Manejar cambios en la búsqueda
  const handleSearchChange = (text: string) => {
    setSearchText(text)
    setIsSearchActive(text.trim().length > 0)
  }

  // 🔍 NUEVO: Limpiar búsqueda
  const clearSearch = () => {
    setSearchText("")
    setIsSearchActive(false)
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Función para obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "CREATED":
        return "#4CAF50"
      case "ACTIVE":
        return "#2196F3"
      case "INACTIVE":
        return "#FF9800"
      case "SUSPENDED":
        return "#F44336"
      default:
        return "#9E9E9E"
    }
  }

  // Función para obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case "CREATED":
        return "Creado"
      case "ACTIVE":
        return "Activo"
      case "INACTIVE":
        return "Inactivo"
      case "SUSPENDED":
        return "Suspendido"
      default:
        return status
    }
  }

  // 🔍 NUEVO: Renderizar estudiante con resaltado de búsqueda
  const renderStudent = ({ item, index }: { item: Student; index: number }) => {
    // Resaltar texto de búsqueda en el nombre
    const highlightSearchText = (text: string, search: string) => {
      if (!search.trim()) return text

      const parts = text.split(new RegExp(`(${search})`, "gi"))
      return parts.map((part, i) => (part.toLowerCase() === search.toLowerCase() ? `**${part}**` : part)).join("")
    }

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <View style={styles.studentNameRow}>
              <Text style={styles.studentName}>{item.username}</Text>
              {/* 🔍 NUEVO: Indicador de posición en búsqueda */}
              {isSearchActive && (
                <View style={styles.searchPositionBadge}>
                  <Text style={styles.searchPositionText}>#{index + 1}</Text>
                </View>
              )}
            </View>
            <Text style={styles.studentId}>ID: {item.id.slice(0, 8)}...</Text>
            {/* 🔍 NUEVO: Indicador de coincidencia de búsqueda */}
            {isSearchActive && (
              <View style={styles.searchMatchIndicator}>
                <Ionicons name="search" size={12} color="#4CAF50" />
                <Text style={styles.searchMatchText}>Coincidencia encontrada</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.scoresContainer}>
          <View style={styles.scoreItem}>
            <Ionicons name="trophy" size={16} color="#4CAF50" />
            <Text style={styles.scoreLabel}>Estudiante:</Text>
            <Text style={styles.scoreValue}>{item.score_student}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Ionicons name="skull" size={16} color="#F44336" />
            <Text style={styles.scoreLabel}>Villano:</Text>
            <Text style={styles.scoreValue}>{item.score_villain}</Text>
          </View>
        </View>

        <View style={styles.studentFooter}>
          <Text style={styles.dateText}>Creado: {formatDate(item.created_at)}</Text>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              Alert.alert(
                "Detalles del Estudiante",
                `Nombre: ${item.username}\n` +
                  `ID: ${item.id}\n` +
                  `Estado: ${getStatusText(item.status)}\n` +
                  `Puntuación Estudiante: ${item.score_student}\n` +
                  `Puntuación Villano: ${item.score_villain}\n` +
                  `Creado: ${formatDate(item.created_at)}\n` +
                  `Actualizado: ${formatDate(item.updated_at)}`,
                [{ text: "Cerrar" }],
              )
            }}
          >
            <Text style={styles.detailsButtonText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Renderizar footer de la lista
  const renderFooter = () => {
    // 🔍 NUEVO: No mostrar "cargar más" si hay búsqueda activa
    if (isSearchActive) {
      return (
        <View style={styles.searchFooter}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.searchFooterText}>
            Mostrando resultados de búsqueda. Limpia la búsqueda para cargar más estudiantes.
          </Text>
        </View>
      )
    }

    if (!loadingMore) return null

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4361EE" />
        <Text style={styles.footerLoaderText}>Cargando más estudiantes...</Text>
      </View>
    )
  }

  // 🔍 NUEVO: Renderizar estado vacío para búsqueda
  const renderSearchEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No se encontraron estudiantes</Text>
      <Text style={styles.emptyStateText}>No hay estudiantes que coincidan con "{searchText}".</Text>
      <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
        <Ionicons name="close-circle" size={16} color="#4361EE" />
        <Text style={styles.clearSearchButtonText}>Limpiar búsqueda</Text>
      </TouchableOpacity>
    </View>
  )

  // Renderizar estado vacío original
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No hay estudiantes</Text>
      <Text style={styles.emptyStateText}>Esta sala aún no tiene estudiantes registrados.</Text>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estudiantes</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Cargando estudiantes...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      

      {/* 🔍 NUEVA: Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar estudiante por nombre..."
            value={searchText}
            onChangeText={handleSearchChange}
            placeholderTextColor="#999"
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* 🔍 NUEVO: Indicador de búsqueda activa */}
        {isSearchActive && (
          <View style={styles.searchIndicator}>
            <Ionicons name="funnel" size={14} color="#4361EE" />
            <Text style={styles.searchIndicatorText}>
              Filtrando por: "{searchText}" • {filteredStats.total} resultado{filteredStats.total !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Estadísticas actualizadas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredStats.total}</Text>
          <Text style={styles.statLabel}>{isSearchActive ? "Encontrados" : "Estudiantes"}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredStats.active}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredStats.average}</Text>
          <Text style={styles.statLabel}>Promedio</Text>
        </View>
        {/* 🔍 NUEVO: Estadística de búsqueda */}
        {isSearchActive && (
          <View style={styles.statItem}>
            <Ionicons name="search" size={20} color="#4CAF50" />
            <Text style={[styles.statLabel, { color: "#4CAF50" }]}>Búsqueda</Text>
          </View>
        )}
      </View>

      {/* Lista de estudiantes filtrados */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#4361EE"]}
            tintColor="#4361EE"
            title={isSearchActive ? "Actualizando búsqueda..." : "Actualizando estudiantes..."}
            titleColor="#4361EE"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={isSearchActive ? renderSearchEmptyState : renderEmptyState}
        // 🔍 NUEVO: Optimizaciones para búsqueda
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
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
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },

  // 🔍 NUEVOS: Estilos de búsqueda
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
  searchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  searchIndicatorText: {
    fontSize: 12,
    color: "#4361EE",
    marginLeft: 6,
    fontWeight: "500",
  },

  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4361EE",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
    paddingTop: 16,
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },

  // 🔍 NUEVOS: Estilos para el nombre del estudiante con búsqueda
  studentNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  searchPositionBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  searchPositionText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  searchMatchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  searchMatchText: {
    fontSize: 11,
    color: "#4CAF50",
    marginLeft: 4,
    fontWeight: "500",
  },

  studentId: {
    fontSize: 12,
    color: "#999",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  scoresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  scoreItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    marginRight: 4,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  studentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 11,
    color: "#999",
  },
  detailsButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  // 🔍 NUEVO: Footer de búsqueda
  searchFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginTop: 8,
  },
  searchFooterText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
    textAlign: "center",
    lineHeight: 16,
  },

  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
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
  },

  // 🔍 NUEVO: Botón para limpiar búsqueda
  clearSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E3F2FD",
    marginTop: 16,
  },
  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4361EE",
    marginLeft: 6,
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

export { StudentListScreen }
export default StudentListScreen
