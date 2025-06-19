"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  Share,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { captureRef } from "react-native-view-shot"
import * as FileSystem from "expo-file-system"
import * as MediaLibrary from "expo-media-library"
import * as Sharing from "expo-sharing"
import { processStatisticsData } from "../../componentes/Statistics/util/statistics"

const { width } = Dimensions.get("window")

export const StatisticsModal = ({ visible, onClose, room }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const statsViewRef = useRef(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    if (visible && room?.id) {
      fetchStatistics(room.id)
    }
  }, [visible, room])

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }
      return token
    } catch (error) {
      console.error("Error al obtener el token:", error)
      throw error
    }
  }

  const fetchStatistics = async (roomId) => {
    try {
      setLoading(true)
      setError(null)

      const token = await getAuthToken()

      // Using the endpoint provided in the room card component
      const response = await fetch(
        `https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/all/room/${roomId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Error al obtener las estadísticas: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Process the raw data into statistics
        const processedStats = processStatisticsData(data.data || [])
        setStats(processedStats)
      } else {
        throw new Error(data.message || "Error al obtener las estadísticas")
      }
    } catch (error) {
      console.error("Error al obtener las estadísticas:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const captureStatisticsImage = async () => {
    try {
      setExportLoading(true)
      // Wait a moment to ensure the view is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 500))

      const uri = await captureRef(statsViewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      })

      console.log("Statistics captured at:", uri)
      return uri
    } catch (error) {
      console.error("Error al capturar estadísticas:", error)
      throw new Error("No se pudieron capturar las estadísticas. Intenta nuevamente.")
    } finally {
      setExportLoading(false)
    }
  }

  const handleShareStatistics = async () => {
    try {
      setExportLoading(true)

      const shareMessage =
        `📊 Estadísticas de la sala: ${room.name}\n\n` +
        `Total de preguntas: ${stats.totalQuestions}\n` +
        `Media: ${stats.mean}\n` +
        `Mediana: ${stats.median}\n` +
        `Moda: ${stats.mode}\n\n` +
        `Preguntas fáciles: ${stats.difficultyCount.EASY}\n` +
        `Preguntas medias: ${stats.difficultyCount.MEDIUM}\n` +
        `Preguntas difíciles: ${stats.difficultyCount.HARD}`

      if (Platform.OS === "android") {
        try {
          const imageUri = await captureStatisticsImage()
          const fileInfo = await FileSystem.getInfoAsync(imageUri)

          if (!fileInfo.exists) {
            throw new Error("El archivo de imagen no se generó correctamente")
          }

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(imageUri, {
              mimeType: "image/png",
              dialogTitle: `Estadísticas - ${room.name}`,
            })
          } else {
            await Share.share({
              message: shareMessage,
              title: `Estadísticas - ${room.name}`,
            })
          }
        } catch (imageError) {
          console.warn("Error al compartir imagen, usando texto:", imageError)
          await Share.share({
            message: shareMessage,
            title: `Estadísticas - ${room.name}`,
          })
        }
      } else {
        try {
          const imageUri = await captureStatisticsImage()
          await Share.share({
            message: shareMessage,
            url: imageUri,
            title: `Estadísticas - ${room.name}`,
          })
        } catch (imageError) {
          console.warn("Error al compartir imagen, usando texto:", imageError)
          await Share.share({
            message: shareMessage,
            title: `Estadísticas - ${room.name}`,
          })
        }
      }
    } catch (error) {
      console.error("Error al compartir estadísticas:", error)
      Alert.alert("Error", "No se pudieron compartir las estadísticas. Intenta nuevamente.")
    } finally {
      setExportLoading(false)
    }
  }

  const handleSaveStatistics = async () => {
    try {
      setExportLoading(true)

      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permisos requeridos", "Se necesitan permisos para guardar la imagen en tu galería.", [
          { text: "Cancelar", style: "cancel" },
          { text: "Configurar", onPress: () => MediaLibrary.requestPermissionsAsync() },
        ])
        return
      }

      const imageUri = await captureStatisticsImage()
      const fileInfo = await FileSystem.getInfoAsync(imageUri)

      if (!fileInfo.exists) {
        throw new Error("No se pudo generar la imagen de estadísticas")
      }

      const asset = await MediaLibrary.createAssetAsync(imageUri)

      try {
        const album = await MediaLibrary.getAlbumAsync("LIA")
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
        } else {
          await MediaLibrary.createAlbumAsync("LIA", asset, false)
        }
      } catch (albumError) {
        console.warn("No se pudo crear álbum específico:", albumError)
      }

      Alert.alert("✅ Guardado", "Las estadísticas han sido guardadas en tu galería")
    } catch (error) {
      console.error("Error al guardar estadísticas:", error)
      Alert.alert("Error", `No se pudieron guardar las estadísticas: ${error.message}`)
    } finally {
      setExportLoading(false)
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#E63946" />
          <Text style={styles.errorText}>Error al cargar estadísticas</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchStatistics(room.id)}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (!stats || !stats.totalQuestions) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="bar-chart-2" size={48} color="#999" />
          <Text style={styles.emptyText}>No hay datos disponibles</Text>
          <Text style={styles.emptyMessage}>
            Esta sala no tiene preguntas o evaluaciones para generar estadísticas.
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.statsContent} ref={statsViewRef}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Estadísticas Básicas</Text>
          <Text style={styles.statsSubtitle}>Medidas de tendencia central</Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: "#4361EE20" }]}>
                <Feather name="bar-chart-2" size={20} color="#4361EE" />
              </View>
              <Text style={styles.statValue}>{stats.mean}</Text>
              <Text style={styles.statLabel}>Media</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: "#FF6B6B20" }]}>
                <Feather name="align-center" size={20} color="#FF6B6B" />
              </View>
              <Text style={styles.statValue}>{stats.median}</Text>
              <Text style={styles.statLabel}>Mediana</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: "#4CAF5020" }]}>
                <Feather name="trending-up" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{stats.mode}</Text>
              <Text style={styles.statLabel}>Moda</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Información General</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total de preguntas:</Text>
            <Text style={styles.infoValue}>{stats.totalQuestions}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Preguntas fáciles:</Text>
            <Text style={[styles.infoValue, { color: "#4CAF50" }]}>{stats.difficultyCount.EASY}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Preguntas medias:</Text>
            <Text style={[styles.infoValue, { color: "#FF9F1C" }]}>{stats.difficultyCount.MEDIUM}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Preguntas difíciles:</Text>
            <Text style={[styles.infoValue, { color: "#E63946" }]}>{stats.difficultyCount.HARD}</Text>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <View style={styles.explanationHeader}>
            <Feather name="info" size={18} color="#4361EE" />
            <Text style={styles.explanationTitle}>¿Qué significan estas estadísticas?</Text>
          </View>

          <Text style={styles.explanationText}>
            <Text style={styles.boldText}>Media:</Text> Es el promedio de todos los puntajes de las preguntas.
          </Text>

          <Text style={styles.explanationText}>
            <Text style={styles.boldText}>Mediana:</Text> Es el valor central de los puntajes ordenados.
          </Text>

          <Text style={styles.explanationText}>
            <Text style={styles.boldText}>Moda:</Text> Es el puntaje que aparece con mayor frecuencia.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Estadísticas</Text>
              <Text style={styles.modalSubtitle}>{room?.name || ""}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>

        </View>
      </View>
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
    backgroundColor: "#fff",
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: "90%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    maxHeight: "80%",
  },
  scrollViewContent: {
    padding: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#666",
  },
  errorContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#4361EE",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
  },
  statsContent: {
    paddingBottom: 16,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#666",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#333",
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#4361EE",
  },
  explanationCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  boldText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4361EE",
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    marginLeft: 8,
  },
})
