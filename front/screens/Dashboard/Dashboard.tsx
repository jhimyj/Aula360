"use client"

import { useState, useEffect } from "react"
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
  Dimensions,
  Platform,
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

// Hook personalizado para dimensiones responsivas
const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })

    return () => subscription?.remove()
  }, [])

  const { width, height } = dimensions

  return {
    width,
    height,
    isTablet: width >= 768,
    isLandscape: width > height,
    isSmallScreen: width < 350,
    scale: width / 375, // Base scale factor (iPhone 6/7/8 width)

    // Funciones de escalado responsivo
    wp: (percentage: number) => (width * percentage) / 100,
    hp: (percentage: number) => (height * percentage) / 100,
    fontSize: (size: number) => Math.round(size * (width / 375)),
    spacing: (size: number) => Math.round(size * (width / 375)),

    // 🎯 FUNCIÓN ESPECIAL PARA EMPTY STATE - MÁS INTELIGENTE
    emptyStateFontSize: (baseSize: number) => {
      if (width >= 1024) return Math.round(baseSize * 1.1) // Tablets grandes
      if (width >= 768) return Math.round(baseSize * 1.0) // Tablets medianos
      if (width >= 414) return Math.round(baseSize * 0.95) // Teléfonos grandes
      if (width >= 375) return Math.round(baseSize * 0.9) // Teléfonos medianos
      return Math.round(baseSize * 0.85) // Teléfonos pequeños
    },
  }
}

export default function Dashboard() {
  const navigation = useNavigation<DrawerNavigationProp<DrawerNavigatorParamList>>()
  const { rooms, loading, error, refetchRooms, loadMoreRooms, hasMoreRooms, isLoadingMore } = useRooms()
  const { getRoomDetails, loading: detailsLoading } = useRoomDetails()
  const dimensions = useResponsiveDimensions()

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  const [roomSelectorVisible, setRoomSelectorVisible] = useState(false)

  // Crear estilos responsivos
  const responsiveStyles = createResponsiveStyles(dimensions)

  const handleCreateRoom = () => {
    navigation.navigate("Salas")
    console.log("Create room pressed")
  }

  const handleUploadEvaluation = () => {
    console.log("Upload evaluation pressed")

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

    if (rooms.length === 1) {
      const selectedRoom = rooms[0]
      navigation.navigate("UploadEvaluation", {
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
      })
      return
    }

    setRoomSelectorVisible(true)
  }

  const handleSelectRoomForEvaluation = (room) => {
    navigation.navigate("UploadEvaluation", {
      roomId: room.id,
      roomName: room.name,
    })
  }

  const handleViewStudents = () => {
    console.log("View students pressed")

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

    if (rooms.length === 1) {
      const selectedRoom = rooms[0]
      navigation.navigate("StudentList", {
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
      })
      return
    }

    navigation.navigate("RoomSelectorForStudents")
  }

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: () => {
          console.log("Logged out")
        },
      },
    ])
  }

  const handleViewAllRooms = () => {
    navigation.navigate("AllRooms")
  }

  const handleViewMore = async (room) => {
    console.log("Ver más detalles de:", room.name)

    try {
      const details = await getRoomDetails(room.id)
      if (details) {
        console.log("Detalles completos:", details)

        const formatDate = (dateString) => {
          if (!dateString) return "Sin fecha"
          const date = new Date(dateString)
          return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        }

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

  const handleViewQuestions = (room) => {
    console.log("Ver preguntas de:", room.name)
    navigation.navigate("RoomQuestions", {
      roomId: room.id,
      roomName: room.name,
    })
  }

  const handleUploadEvaluationForRoom = (room) => {
    console.log("Subir evaluación a:", room.name)
    navigation.navigate("UploadEvaluation", {
      roomId: room.id,
      roomName: room.name,
    })
  }

  const handleEdit = (room) => {
    console.log("Editar sala:", room.name)

    Alert.alert("Editar Sala", `¿Qué quieres hacer con "${room.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Editar Información",
        onPress: () => {
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
              Alert.alert("Sala Eliminada", `La sala "${room.name}" ha sido eliminada correctamente.`, [
                {
                  text: "OK",
                  onPress: () => {
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

  const handleLoadMoreInModal = () => {
    console.log("📄 Cargando más salas desde el modal...")
    loadMoreRooms()
  }

  if (!fontsLoaded) {
    return (
      <View style={responsiveStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    )
  }

  const limitedRooms = rooms.slice(0, 3)

  console.log("🏠 DASHBOARD - Estado de salas:")
  console.log("- Total de salas:", rooms.length)
  console.log("- ¿Hay más salas?:", hasMoreRooms)
  console.log("- ¿Cargando más?:", isLoadingMore)

  return (
    <SafeAreaView style={responsiveStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" translucent={false} />

      <ScrollView
        style={responsiveStyles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={responsiveStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetchRooms} colors={["#4361EE"]} tintColor="#4361EE" />
        }
      >
        <CreateRoomCard onPress={handleCreateRoom} />

        <ActionCards onUploadEvaluation={handleUploadEvaluation} onViewStudents={handleViewStudents} />

        {error && (
          <View style={responsiveStyles.errorContainer}>
            <Text style={responsiveStyles.errorText}>Error: {error}</Text>
            <Button title="Reintentar" onPress={refetchRooms} color="#4361EE" />
          </View>
        )}

        {loading && rooms.length === 0 ? (
          <View style={responsiveStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#4361EE" />
            <Text style={responsiveStyles.loadingText}>Cargando salas...</Text>
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

        {detailsLoading && (
          <View style={responsiveStyles.detailsLoadingContainer}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={responsiveStyles.detailsLoadingText}>Cargando detalles...</Text>
          </View>
        )}

        {!loading && rooms.length === 0 && (
          <View style={responsiveStyles.emptyStateContainer}>
            <Text style={responsiveStyles.emptyStateTitle}>¡Bienvenido!</Text>
            <Text style={responsiveStyles.emptyStateText}>
              Parece que aún no tienes salas creadas. Comienza creando tu primera sala para poder subir evaluaciones y
              gestionar a tus estudiantes.
            </Text>
            <TouchableOpacity
              style={responsiveStyles.createFirstRoomButton}
              onPress={handleCreateRoom}
              activeOpacity={0.8}
            >
              <Text style={responsiveStyles.createFirstRoomButtonText}>Crear mi primera sala</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <RoomSelectorModal
        visible={roomSelectorVisible}
        onClose={() => setRoomSelectorVisible(false)}
        rooms={rooms}
        onSelectRoom={handleSelectRoomForEvaluation}
        onViewAllRooms={handleViewAllRooms}
        loading={loading && rooms.length === 0}
        onLoadMore={handleLoadMoreInModal}
        hasMoreRooms={hasMoreRooms}
        isLoadingMore={isLoadingMore}
      />
    </SafeAreaView>
  )
}

// Función para crear estilos responsivos
const createResponsiveStyles = (dimensions) => {
  const { width, height, isTablet, isSmallScreen, fontSize, spacing, wp, hp, emptyStateFontSize } = dimensions

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8F9FA",
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing(20),
      paddingBottom: spacing(40),
      minHeight: height - (Platform.OS === "ios" ? 100 : 80), // Asegurar altura mínima
    },
    loadingContainer: {
      flex: 1,
      padding: spacing(20),
      alignItems: "center",
      justifyContent: "center",
      minHeight: hp(30),
    },
    loadingText: {
      marginTop: spacing(10),
      fontSize: fontSize(16),
      color: "#666",
      fontFamily: "Poppins_400Regular",
      textAlign: "center",
    },
    errorContainer: {
      backgroundColor: "#FFE6E6",
      padding: spacing(15),
      borderRadius: spacing(10),
      marginVertical: spacing(10),
      borderLeftWidth: 4,
      borderLeftColor: "#FF4444",
      marginHorizontal: isSmallScreen ? spacing(5) : 0,
    },
    errorText: {
      color: "#CC0000",
      fontSize: fontSize(14),
      fontFamily: "Poppins_400Regular",
      marginBottom: spacing(10),
      lineHeight: fontSize(20),
    },
    detailsLoadingContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing(10),
      backgroundColor: "#F0F8FF",
      borderRadius: spacing(8),
      marginVertical: spacing(10),
      marginHorizontal: isSmallScreen ? spacing(5) : 0,
    },
    detailsLoadingText: {
      marginLeft: spacing(8),
      fontSize: fontSize(14),
      color: "#4361EE",
      fontFamily: "Poppins_400Regular",
    },
    emptyStateContainer: {
      backgroundColor: "#FFFFFF",
      borderRadius: spacing(16),
      padding: spacing(24),
      alignItems: "center",
      marginTop: spacing(20),
      marginHorizontal: isSmallScreen ? spacing(5) : 0,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    // 🎯 SISTEMA RESPONSIVO INTELIGENTE SOLO PARA EMPTY STATE
    emptyStateTitle: {
      fontSize: emptyStateFontSize(20), // Base 20px, se escala inteligentemente
      fontFamily: "Poppins_600SemiBold",
      color: "#333",
      marginBottom: spacing(12),
      textAlign: "center",
    },
    emptyStateText: {
      fontSize: emptyStateFontSize(18), // Base 14px, se escala inteligentemente
      fontFamily: "Poppins_400Regular",
      color: "#666",
      textAlign: "center",
      lineHeight: emptyStateFontSize(26), // Line height proporcional
      marginBottom: spacing(20),
      paddingHorizontal: spacing(isSmallScreen ? 20 : 20),
    },
    createFirstRoomButton: {
      backgroundColor: "#4361EE",
      borderRadius: spacing(12),
      paddingVertical: spacing(isTablet ? 16 : 12),
      paddingHorizontal: spacing(isTablet ? 32 : 24),
      minWidth: wp(isSmallScreen ? 80 : 60),
      alignItems: "center",
    },
    createFirstRoomButtonText: {
      fontSize: emptyStateFontSize(14), // Base 14px, se escala inteligentemente
      fontFamily: "Poppins_600SemiBold",
      color: "#FFFFFF",
      textAlign: "center",
    },
  })
}
