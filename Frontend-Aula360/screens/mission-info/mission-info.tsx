"use client"

import { useState, useEffect } from "react"
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation } from '@react-navigation/native'  // Importar useNavigation
import MissionHeader from "./mission-header"
import MissionButton from "./mission-button"

// Tipos para las misiones
interface Mission {
  id: string
  title: string
  description: string
  image: any // Ruta de la imagen
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
  const navigation = useNavigation(); // Hook de navegación para redirigir

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
  const { width } = Dimensions.get("window")
  const isTablet = width > 768

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadCharacterName = async () => {
      try {
        setLoading(true)

        // Cargar nombre del personaje seleccionado
        const savedCharacterName = await AsyncStorage.getItem("selectedCharacterName")
        if (savedCharacterName) {
          setCharacterName(savedCharacterName)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error al cargar nombre del personaje:", error)
        setLoading(false)
      }
    }

    loadCharacterName()
  }, [])

  // Reemplazar el useEffect que genera la misión con este código actualizado que también establece los colores del tema
  useEffect(() => {
    if (characterName) {
      // Definir misiones específicas para cada personaje
      let characterMission: Mission | null = null
      let themeColors: ThemeColors = {
        primary: ["#FF6B00", "#FF9500"], // Colores por defecto
        accent: "#FF6B00",
        text: "#333333",
        badge: "#FFE0CC",
      }

      switch (characterName) {
        case "Qhapaq":
          characterMission = {
            id: "mission-qhapaq-1",
            title: "Proteger las tierras sagradas",
            description:
              "Qhapaq debe proteger las tierras sagradas de su pueblo de Corporatus, un enemigo mestizo que busca destruir las tradiciones y explotar la naturaleza con su tecnología moderna.",
            image: require("../../assets/Personajes/Amaru1.png"),
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
    navigation.navigate("MissionGameScreen")  // Navegar a MissionGameScreen
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.primary} style={styles.sidebar} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <View style={styles.content}>
        <MissionHeader title="Información" onClose={onClose} accentColor={theme.text} />

        <View style={styles.tabsContainer}>
          <LinearGradient colors={theme.primary} style={styles.activeTab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.activeTabText}>Misión</Text>
          </LinearGradient>
          <TouchableOpacity style={styles.inactiveTab}>
            <Text style={styles.inactiveTabText}>Objetivos</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.imageContainer, { backgroundColor: `${theme.badge}20` }]}>
          {mission && <Image source={mission.image} style={styles.missionImage} resizeMode="contain" />}
        </View>

        <ScrollView style={styles.descriptionContainer}>
          {mission && (
            <>
              <Text style={[styles.missionTitle, { color: theme.text }]}>{mission.title}</Text>

              <Text style={[styles.missionDescription, { color: theme.text }]}>{mission.description}</Text>

              <MissionButton
                title="¡Iniciar misión!"
                onPress={handleStartMission}  // Usar la función handleStartMission
                style={styles.startButton}
                colors={theme.primary}
              />
            </>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sidebar: {
    width: 16,
    height: "100%",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#333",
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
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    marginVertical: 12,
  },
  activeTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  inactiveTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#EEEEEE",
    borderRadius: 20,
    marginRight: 8,
  },
  inactiveTabText: {
    color: "#666666",
    fontWeight: "500",
    fontSize: 16,
  },
  imageContainer: {
    width: "100%",
    height: "50%", // Que ocupe la mitad del espacio disponible
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    justifyContent: "center", // Centrar la imagen verticalmente
    alignItems: "center", // Centrar la imagen horizontalmente
    backgroundColor: "transparent", // Fondo transparente
  },
  missionImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain", // Mostrar la imagen completa sin recortes
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
  },
  descriptionContainer: {
    flex: 1,
    marginBottom: 16,
  },
  difficultyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  difficultyText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  missionDescription: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  objectivesContainer: {
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  objectiveItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  objectiveIcon: {
    marginRight: 8,
  },
  objectiveText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  startButton: {
    marginTop: 8,
  },
})

export default MissionInfo
