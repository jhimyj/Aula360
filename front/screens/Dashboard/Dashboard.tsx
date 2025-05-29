"use client"

import { useState } from "react"
import { useNavigation } from "@react-navigation/native"
import type { DrawerNavigationProp } from "@react-navigation/drawer"
import type { DrawerNavigatorParamList } from "../../navigation/DrawerNavigator"
import {
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Button,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native"
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins"
import CreateRoomCard from "../CreateRoomCard/CreateRoomCard"
import ActionCards from "../CreateRoomCard/ActionCards"
import PreviousRooms from "../CreateRoomCard/PreviousRooms"
import RoomSelectorModal from "../../components/Evaluation/RoomSelectorModal"
import { useRooms } from "../../components/salas/hooks/useRooms"
import { useRoomDetails } from "../../components/salas/hooks/useRoomDetails"

export default function Dashboard() {
  const navigation = useNavigation<DrawerNavigationProp<DrawerNavigatorParamList>>()
  const { rooms, loading, error, refetchRooms, loadMoreRooms, hasMoreRooms, isLoadingMore } = useRooms()

  const { getRoomDetails, loading: detailsLoading } = useRoomDetails()

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  const [roomSelectorVisible, setRoomSelectorVisible] = useState(false)

  const handleCreateRoom = () => {
    navigation.navigate("Salas")
    console.log("Create room pressed")
  }

  const handleUploadEvaluation = () => {
    console.log("Upload evaluation pressed")

    // Verificar si hay salas disponibles
    if (rooms.length === 0) {
      Alert.alert("No hay salas disponibles", "Debes crear una sala primero para poder subir evaluaciones.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Crear sala",
          onPress: () => navigation.navigate("Salas"),
        },
      ])
      return
    }

    // Si solo hay una sala, usarla directamente
    if (rooms.length === 1) {
      const selectedRoom = rooms[0]
      navigation.navigate("UploadEvaluation", {
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
      })
      return
    }

    // Mostrar el modal de selección de sala
    setRoomSelectorVisible(true)
  }

  const handleSelectRoomForEvaluation = (room) => {
    navigation.navigate("UploadEvaluation", {
      roomId: room.id,
      roomName: room.name,
    })
  }

  // 🔥 NUEVA FUNCIÓN PARA VER ESTUDIANTES
  const handleViewStudents = () => {
    console.log("View students pressed")

    // Verificar si hay salas disponibles
    if (rooms.length === 0) {
      Alert.alert("No hay salas disponibles", "Debes crear una sala primero para poder ver estudiantes.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Crear sala",
          onPress: () => navigation.navigate("Salas"),
        },
      ])
      return
    }

    // Si solo hay una sala, ir directamente a ver sus estudiantes
    if (rooms.length === 1) {
      const selectedRoom = rooms[0]
      navigation.navigate("StudentList", {
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
      })
      return
    }

    // Si hay múltiples salas, mostrar selector
    navigation.navigate("RoomSelectorForStudents")
  }

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: () => {
          // Aquí implementarías la lógica de logout
          console.log("Logged out")
          // navigation.navigate("Login"); // Si tienes una pantalla de login
        },
      },
    ])
  }

  // Nueva función para navegar a todas las salas
  const handleViewAllRooms = () => {
    navigation.navigate("AllRooms")
  }

  // Función para ver más detalles de una sala - SOLO DETALLES
  const handleViewMore = async (room) => {
    console.log("Ver más detalles de:", room.name)

    try {
      const details = await getRoomDetails(room.id)
      if (details) {
        console.log("Detalles completos:", details)

        // Función para formatear la fecha
        const formatDate = (dateString) => {
          if (!dateString) return "Sin fecha"
          const date = new Date(dateString)
          return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        }

        // Mostrar solo los detalles sin opciones adicionales
        Alert.alert(
          `Detalles de ${details.name}`,
          `Curso: ${details.course || "No especificado"}\n` +
            `Tema: ${details.topic || "No especificado"}\n` +
            `Descripción: ${details.description || "Sin descripción"}\n` +
            `Creado: ${formatDate(details.created_at)}\n`,
          [{ text: "Cerrar", style: "cancel" }],
        )
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los detalles de la sala", [{ text: "OK", style: "cancel" }])
    }
  }

  // Función para ver preguntas de una sala
  const handleViewQuestions = (room) => {
    console.log("Ver preguntas de:", room.name)

    // Navegar a la pantalla de preguntas
    navigation.navigate("RoomQuestions", {
      roomId: room.id,
      roomName: room.name,
    })
  }

  // Función para subir evaluación a una sala específica
  const handleUploadEvaluationForRoom = (room) => {
    console.log("Subir evaluación a:", room.name)

    // Navegar a la pantalla de subir evaluación
    navigation.navigate("UploadEvaluation", {
      roomId: room.id,
      roomName: room.name,
    })
  }

  // Función para editar una sala
  const handleEdit = (room) => {
    console.log("Editar sala:", room.name)

    Alert.alert("Editar Sala", `¿Qué quieres hacer con "${room.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Editar Información",
        onPress: () => {
          // Aquí navegarías a la pantalla de edición de sala
          console.log("Navegando a editar sala:", room.id)
          Alert.alert("Próximamente", "La edición de salas estará disponible pronto.")
        },
      },
      {
        text: "Gestionar Preguntas",
        onPress: () => handleViewQuestions(room),
      },
    ])
  }

  // Función para eliminar una sala
  const handleDelete = async (room) => {
    console.log("Eliminar sala:", room.name)

    Alert.alert(
      "Eliminar Sala",
      `¿Estás seguro de que quieres eliminar "${room.name}"?\n\nEsta acción no se puede deshacer y se eliminarán todas las preguntas asociadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              // Aquí implementarías la lógica de eliminación
              // await deleteRoom(room.id);

              // Simular eliminación exitosa
              Alert.alert("Sala Eliminada", `La sala "${room.name}" ha sido eliminada correctamente.`, [
                {
                  text: "OK",
                  onPress: () => {
                    // Refrescar la lista de salas
                    refetchRooms()
                  },
                },
              ])
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar la sala. Inténtalo de nuevo.", [
                { text: "OK", style: "cancel" },
              ])
            }
          },
        },
      ],
    )
  }

  // 🆕 Función para cargar más salas en el modal
  const handleLoadMoreInModal = () => {
    console.log("📄 Cargando más salas desde el modal...")
    loadMoreRooms()
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    )
  }

  // Solo mostrar las primeras 3 salas en el dashboard
  const limitedRooms = rooms.slice(0, 3)

  console.log("🏠 DASHBOARD - Estado de salas:")
  console.log("- Total de salas:", rooms.length)
  console.log("- ¿Hay más salas?:", hasMoreRooms)
  console.log("- ¿Cargando más?:", isLoadingMore)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetchRooms} colors={["#4361EE"]} tintColor="#4361EE" />
        }
      >
        <CreateRoomCard onPress={handleCreateRoom} />

        <ActionCards onUploadEvaluation={handleUploadEvaluation} onViewStudents={handleViewStudents} />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <Button title="Reintentar" onPress={refetchRooms} color="#4361EE" />
          </View>
        )}

        {loading && rooms.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4361EE" />
            <Text style={styles.loadingText}>Cargando salas...</Text>
          </View>
        ) : (
          <PreviousRooms
            rooms={limitedRooms}
            onViewAll={handleViewAllRooms}
            showViewAll={rooms.length > 3}
            onViewMore={handleViewMore}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewQuestions={handleViewQuestions}
            onUploadEvaluation={handleUploadEvaluationForRoom}
          />
        )}

        {/* Indicador de carga para detalles */}
        {detailsLoading && (
          <View style={styles.detailsLoadingContainer}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.detailsLoadingText}>Cargando detalles...</Text>
          </View>
        )}

        {/* Información adicional si no hay salas */}
        {!loading && rooms.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>¡Bienvenido!</Text>
            <Text style={styles.emptyStateText}>
              Parece que aún no tienes salas creadas. Comienza creando tu primera sala para poder subir evaluaciones y
              gestionar a tus estudiantes.
            </Text>
            <TouchableOpacity style={styles.createFirstRoomButton} onPress={handleCreateRoom} activeOpacity={0.8}>
              <Text style={styles.createFirstRoomButtonText}>Crear mi primera sala</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 🆕 Modal actualizado con soporte para paginación */}
      <RoomSelectorModal
        visible={roomSelectorVisible}
        onClose={() => setRoomSelectorVisible(false)}
        rooms={rooms}
        onSelectRoom={handleSelectRoomForEvaluation}
        onViewAllRooms={handleViewAllRooms}
        loading={loading && rooms.length === 0}
        onLoadMore={handleLoadMoreInModal} // 🆕 Función para cargar más
        hasMoreRooms={hasMoreRooms} // 🆕 Indicador de más salas
        isLoadingMore={isLoadingMore} // 🆕 Estado de carga
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins_400Regular",
  },
  errorContainer: {
    backgroundColor: "#FFE6E6",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#FF4444",
  },
  errorText: {
    color: "#CC0000",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginBottom: 10,
  },
  detailsLoadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    marginVertical: 10,
  },
  detailsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#4361EE",
    fontFamily: "Poppins_400Regular",
  },
  emptyStateContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  createFirstRoomButton: {
    backgroundColor: "#4361EE",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createFirstRoomButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
})
