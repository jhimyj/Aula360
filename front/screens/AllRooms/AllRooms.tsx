import {
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Feather } from "@expo/vector-icons"
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins"
import RoomCard from "../../screens/CreateRoomCard/RoomCard"
import { useRooms } from "../../components/salas/hooks/useRooms"
import { useRoomDetails } from "../../components/salas/hooks/useRoomDetails"

export default function AllRooms() {
  const navigation = useNavigation()
  const route = useRoute()
  const { rooms, loading, error, refetchRooms, loadMoreRooms, hasMoreRooms, isLoadingMore } = useRooms()

  const { getRoomDetails, loading: detailsLoading } = useRoomDetails()

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  // 🎯 FUNCIÓN PARA ORDENAR SALAS POR FECHA (MÁS RECIENTES PRIMERO)
  const getSortedRooms = (roomsArray) => {
    if (!roomsArray || roomsArray.length === 0) return []

    // Crear una copia del array para no mutar el original
    const sortedRooms = [...roomsArray].sort((a, b) => {
      // Buscar diferentes campos de fecha que podrían existir
      const dateA = a.createdAt || a.dateCreated || a.created_at || a.timestamp || a.id
      const dateB = b.createdAt || b.dateCreated || b.created_at || b.timestamp || b.id

      // Convertir a timestamp para comparar correctamente
      const getTimestamp = (date) => {
        if (date instanceof Date) return date.getTime()
        if (typeof date === "string") {
          const parsed = new Date(date)
          return isNaN(parsed.getTime()) ? 0 : parsed.getTime()
        }
        if (typeof date === "number") return date
        return 0
      }

      const timestampA = getTimestamp(dateA)
      const timestampB = getTimestamp(dateB)

      // Orden descendente (más reciente primero)
      return timestampB - timestampA
    })

    return sortedRooms
  }

  // 🎯 OBTENER SALAS ORDENADAS
  const sortedRooms = getSortedRooms(rooms)

  // Función para cargar más salas al llegar al final del scroll
  const handleLoadMore = () => {
    if (!loading && !isLoadingMore && hasMoreRooms) {
      loadMoreRooms()
    }
  }

  // Función para ver más detalles de una sala
  const handleViewMore = async (room) => {
    console.log("Ver más detalles de:", room.name)

    try {
      const details = await getRoomDetails(room.id)
      if (details) {
        console.log("Detalles completos:", details)

        // Mostrar los detalles en un Alert por ahora
        Alert.alert(
          `Detalles de ${details.name}`,
          `Curso: ${details.course || "No especificado"}\n` +
            `Tema: ${details.topic || "No especificado"}\n` +
            `Descripción: ${details.description || "Sin descripción"}\n` +
            `Creado: ${new Date(details.created_at).toLocaleDateString()}`,
          [{ text: "Cerrar", style: "cancel" }],
        )

        // Aquí puedes navegar a una pantalla de detalles si la tienes
        // navigation.navigate('RoomDetails', { roomDetails: details });
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los detalles de la sala", [{ text: "OK", style: "cancel" }])
    }
  }

  // Función para editar una sala
  const handleEdit = (room) => {
    console.log("Editar sala:", room.name)

    Alert.alert("Editar Sala", `¿Quieres editar "${room.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Editar",
        onPress: () => {
          // Aquí navegarías a la pantalla de edición
          console.log("Navegando a editar sala:", room.id)
          // navigation.navigate('EditRoom', { roomId: room.id, roomData: room });
        },
      },
    ])
  }

  // Función para eliminar una sala
  const handleDelete = async (room) => {
    console.log("Eliminar sala:", room.name)

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
      Alert.alert("Error", "No se pudo eliminar la sala. Inténtalo de nuevo.", [{ text: "OK", style: "cancel" }])
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && !isLoadingMore}
            onRefresh={refetchRooms}
            colors={["#4361EE"]}
            tintColor="#4361EE"
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
          const paddingToBottom = 20
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleLoadMore()
          }
        }}
        scrollEventThrottle={400}
      >
        {loading && sortedRooms.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4361EE" />
            <Text style={styles.loadingText}>Cargando salas...</Text>
          </View>
        ) : (
          <>
            {/* 🎯 CONTADOR ACTUALIZADO CON SALAS ORDENADAS */}
            <Text style={styles.roomCount}>
              {sortedRooms.length} sala{sortedRooms.length !== 1 ? "s" : ""} encontrada
              {sortedRooms.length !== 1 ? "s" : ""}
              {sortedRooms.length > 0 && <Text style={styles.sortIndicator}> • Ordenadas por fecha</Text>}
            </Text>

            {/* 🎯 MOSTRAR SALAS ORDENADAS */}
            {sortedRooms.map((room, index) => (
              <RoomCard
                key={room.id}
                room={room}
                onViewMore={handleViewMore}
                onEdit={handleEdit}
                onDelete={handleDelete}
                // 🎯 INDICAR CUÁL ES LA MÁS RECIENTE
                isLatest={index === 0 && sortedRooms.length > 1}
              />
            ))}

            {isLoadingMore && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#4361EE" />
                <Text style={styles.loadMoreText}>Cargando más salas...</Text>
              </View>
            )}

            {!hasMoreRooms && sortedRooms.length > 0 && (
              <Text style={styles.noMoreRoomsText}>No hay más salas para mostrar</Text>
            )}

            {sortedRooms.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Feather name="inbox" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No hay salas creadas</Text>
                <Text style={styles.emptySubtext}>Crea tu primera sala desde el dashboard</Text>
              </View>
            )}
          </>
        )}

        {/* Indicador de carga para detalles */}
        {detailsLoading && (
          <View style={styles.detailsLoadingContainer}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.detailsLoadingText}>Cargando detalles...</Text>
          </View>
        )}
      </ScrollView>
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
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  roomCount: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#666",
    marginBottom: 20,
  },
  // 🎯 NUEVO ESTILO PARA INDICADOR DE ORDENAMIENTO
  sortIndicator: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#999",
    fontStyle: "italic",
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
  loadMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  loadMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins_400Regular",
  },
  noMoreRoomsText: {
    textAlign: "center",
    padding: 10,
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#999",
    marginTop: 8,
    textAlign: "center",
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
})
