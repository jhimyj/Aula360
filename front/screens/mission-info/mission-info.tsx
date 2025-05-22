"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from "react-native"
import { Feather } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import MissionButton from "./mission-button"
import { Video } from "expo-av"

// Tipos para las misiones
interface Mission {
  id: string
  title: string
  description: string
  image: any // Ruta de la imagen (mantener para compatibilidad)
  video: any // Ruta del video
  difficulty: "easy" | "medium" | "hard"
  rewards: {
    xp: number
    items?: string[] // Recompensas opcionales
  }
  objectives: string[] // Lista de objetivos de la misión
}

// Añadir esta interfaz para los colores del tema
interface ThemeColors {
  primary: string[]
  accent: string
  text: string
  badge: string
}

// Props del componente
interface MissionInfoProps {
  onStartMission: () => void
  onClose: () => void
}

/**
 * Componente MissionInfo
 *
 * Muestra la información de la misión basada en el personaje seleccionado.
 * Carga dinámicamente el nombre del personaje desde AsyncStorage y muestra la misión correspondiente.
 */
const MissionInfo = ({ onStartMission, onClose }: MissionInfoProps) => {
  const navigation = useNavigation() // Hook de navegación para redirigir

  // Estados para almacenar datos
  const [characterName, setCharacterName] = useState<string | null>(null)
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)

  // Añadir este estado después de los otros estados al inicio del componente
  const [theme, setTheme] = useState<ThemeColors>({
    primary: ["#FF6B00", "#FF9500"],
    accent: "#FF6B00",
    text: "#333333",
    badge: "#FFE0CC",
  })

  // Dimensiones de la pantalla para diseño responsivo
  const { width, height } = Dimensions.get("window")
  const isTablet = width > 768

  // Cargar datos al montar el componente y cada vez que la pantalla obtiene foco
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true
      const loadCharacterName = async () => {
        try {
          setLoading(true)

          // Cargar nombre del personaje seleccionado
          const savedCharacterName = await AsyncStorage.getItem("selectedCharacterName")
          if (isActive && savedCharacterName) {
            setCharacterName(savedCharacterName)
          }

          setLoading(false)
        } catch (error) {
          console.error("Error al cargar nombre del personaje:", error)
          setLoading(false)
        }
      }

      loadCharacterName()

      return () => {
        isActive = false
      }
    }, [])
  )

  // Add this near the top of the component, after the other useEffect hooks
  useEffect(() => {
    // Function to update dimensions when screen size changes
    const updateLayout = () => {
      const { width, height } = Dimensions.get("window")
      // You can set additional state here if needed for responsive layouts
    }

    // Set up event listener for dimension changes (orientation changes)
    const subscription = Dimensions.addEventListener("change", updateLayout)

    // Initial call
    updateLayout()

    // Clean up
    return () => {
      // Remove event listener on unmount (compatible con RN >= 0.65)
      subscription?.remove && subscription.remove()
    }
  }, [])

  // Reemplazar el useEffect que genera la misión con este código actualizado que también establece los colores del tema
  useEffect(() => {
    if (characterName) {
      // Normalizar el nombre del personaje para evitar errores de espacios o mayúsculas
      const normalizedCharacterName = characterName.trim();

      // Depuración: mostrar el nombre normalizado
      // console.log("characterName (raw):", characterName, "normalized:", normalizedCharacterName);

      // Definir misiones específicas para cada personaje
      let characterMission: Mission | null = null
      let themeColors: ThemeColors = {
        primary: ["#FF6B00", "#FF9500"], // Colores por defecto
        accent: "#FF6B00",
        text: "#333333",
        badge: "#FFE0CC",
      }

      switch (normalizedCharacterName) {
        case "Qhapaq":
          characterMission = {
            id: "mission-qhapaq-1",
            title: "Proteger las tierras sagradas",
            description:
              "Qhapaq debe proteger las tierras sagradas de su pueblo de Corporatus, un enemigo mestizo que busca destruir las tradiciones y explotar la naturaleza con su tecnología moderna.",
            image: require("../../assets/Personajes/Amaru1.png"),
            video: require("../../assets/MisionesGame/Mision-Qhapac.mp4"),
            difficulty: "medium",
            rewards: {
              xp: 500,
              items: ["Amuleto de protección", "Poción de sabiduría ancestral"],
            },
            objectives: [
              "Defender el bosque sagrado",
              "Reunir a los ancianos de la tribu",
              "Realizar el ritual de protección",
            ],
          }
          // Colores para Qhapaq (tonos morados)
          themeColors = {
            primary: ["#8E44AD", "#9B59B6"],
            accent: "#8E44AD",
            text: "#4A235A",
            badge: "#E8DAEF",
          }
          break

        case "Amaru":
          characterMission = {
            id: "mission-amaru-1",
            title: "Purificar las aguas contaminadas",
            description:
              "Amaru debe enfrentarse a Toxicus, quien ha contaminado los ríos sagrados con sus desechos industriales. Su fuerza será clave para restaurar el equilibrio natural.",
            image: require("../../assets/Personajes/Amaru1.png"),
            video: require("../../assets/EntradaMision/Amaru-entrada-mision.mp4"),
            difficulty: "hard",
            rewards: {
              xp: 750,
              items: ["Guantes de fuerza", "Escudo de la naturaleza"],
            },
            objectives: [
              "Localizar la fuente de contaminación",
              "Derrotar a los secuaces de Toxicus",
              "Instalar filtros purificadores",
            ],
          }
          // Colores para Amaru (tonos rojos)
          themeColors = {
            primary: ["#E74C3C", "#C0392B"],
            accent: "#E74C3C",
            text: "#7B241C",
            badge: "#FADBD8",
          }
          break

        case "Killa":
          characterMission = {
            id: "mission-killa-1",
            title: "Desenmascarar al infiltrado",
            description:
              "Killa debe usar su astucia para descubrir la identidad de Shadowman, quien se ha infiltrado en el consejo de ancianos para manipular las decisiones sobre el uso de los recursos naturales.",
            image: require("../../assets/Personajes/Amaru1.png"),
            video: require("../../assets/MisionesGame/MIsion-killa.mp4"),

            difficulty: "easy",
            rewards: {
              xp: 450,
              items: ["Capa de sigilo", "Amuleto de visión"],
            },
            objectives: [
              "Investigar a los miembros del consejo",
              "Recolectar pruebas de la conspiración",
              "Exponer al infiltrado ante el pueblo",
            ],
          }
          // Colores para Killa (tonos azules)
          themeColors = {
            primary: ["#3498DB", "#2980B9"],
            accent: "#3498DB",
            text: "#1B4F72",
            badge: "#D4E6F1",
          }
          break

        default:
          characterMission = {
            id: "mission-default",
            title: "Defender el equilibrio natural",
            description: `${characterName} debe enfrentarse a las fuerzas que amenazan el equilibrio de la naturaleza y las tradiciones ancestrales.`,
            image: require("../../assets/Personajes/Amaru1.png"),
            video: require("../../assets/videos/Tunel.mp4"),
            difficulty: "medium",
            rewards: {
              xp: 400,
              items: ["Poción de energía"],
            },
            objectives: ["Proteger los recursos naturales", "Preservar las tradiciones ancestrales"],
          }
      }

      setMission(characterMission)
      setTheme(themeColors)
    }
  }, [characterName])

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando misión...</Text>
      </View>
    )
  }

  // Si no hay personaje seleccionado
  if (!characterName) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Debes seleccionar un personaje antes de ver la misión.</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Feather name="x" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    )
  }

  // Función para iniciar la misión
  const handleStartMission = () => {
    navigation.navigate("MissionGameScreen") // Navegar a MissionGameScreen
  }

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000" }}>
      <StatusBar hidden />

      {mission && (
        <>
          <Video
            source={mission.video}
            style={styles.fullScreenVideo}
            resizeMode="cover"
            shouldPlay
            isLooping={true}
            useNativeControls={false}
          />

          <View style={styles.overlayContainer}>
            <TouchableOpacity style={styles.closeButtonFullScreen} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.missionTitle}>{mission.title}</Text>
            <Text style={styles.missionDescription}>{mission.description}</Text>

            <MissionButton
              title="¡Iniciar misión!"
              onPress={handleStartMission}
              style={styles.startButton}
              colors={theme.primary}
            />
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  fullScreenVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40, // Extra padding for status bar
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 5,
  },
  closeButtonFullScreen: {
    position: "absolute",
    top: 40, // Position below status bar area
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  missionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginTop: 40, // Add space for the close button
  },
  missionDescription: {
    fontSize: 18,
    color: "#FFFFFF",
    lineHeight: 26,
    marginBottom: 24,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  startButton: {
    marginTop: 16,
    alignSelf: "center",
    width: "80%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
})

export default MissionInfo
