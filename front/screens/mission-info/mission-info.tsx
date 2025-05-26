"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useNavigationState } from "@react-navigation/native"

import MissionButton from "./mission-button"
import { Video } from "expo-av"
import type { DrawerNavigatorParamList } from "../../navigation/DrawerNavigator" // ajusta la ruta a donde defines DrawerNavigatorParamList

type NavigationProp = NativeStackNavigationProp<DrawerNavigatorParamList>

interface Mission {
  id: string
  title: string
  description: string
  image: any
  video: any
  difficulty: "easy" | "medium" | "hard"
  rewards: { xp: number; items?: string[] }
  objectives: string[]
}

interface ThemeColors {
  primary: string[]
  accent: string
  text: string
  badge: string
}

interface MissionInfoProps {
  onStartMission: () => void
  onClose: () => void
}

const MissionInfo = ({ onStartMission, onClose }: MissionInfoProps) => {
  const navigation = useNavigation<NavigationProp>()

  const [characterName, setCharacterName] = useState<string | null>(null)
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)

  const [theme, setTheme] = useState<ThemeColors>({
    primary: ["#FF6B00", "#FF9500"],
    accent: "#FF6B00",
    text: "#333333",
    badge: "#FFE0CC",
  })

  const { width } = Dimensions.get("window")
  const isTablet = width > 768
  const routeNames = useNavigationState((state) => state.routeNames)

useEffect(() => {
  console.log("📍 Rutas disponibles desde MissionInf:", routeNames)
}, [routeNames])

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true
      const loadCharacterName = async () => {
        try {
          setLoading(true)
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

  useEffect(() => {
    if (characterName) {
      const normalized = characterName.trim()
      console.log("📍 Nombre del personaje normalizado:", normalized)

      let characterMission: Mission | null = null
      let themeColors: ThemeColors = {
        primary: ["#FF6B00", "#FF9500"],
        accent: "#FF6B00",
        text: "#333333",
        badge: "#FFE0CC",
      }

      switch (normalized) {
        case "Qhapaq":
          characterMission = {
            id: "mission-qhapaq-1",
            title: "Proteger las tierras sagradas",
            description:
              "Qhapaq debe proteger las tierras sagradas de su pueblo de Corporatus...",
            image: require("../../assets/Personajes/Amaru1.png"),
            video: require("../../assets/MisionesGame/Qhapac-mision.mp4"),
            difficulty: "medium",
            rewards: { xp: 500, items: ["Amuleto de protección", "Poción de sabiduría ancestral"] },
            objectives: ["Defender el bosque sagrado", "Reunir a los ancianos", "Realizar el ritual"],
          }
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
              "Amaru debe enfrentarse a Toxicus, quien ha contaminado los ríos...",
            image: require("../../assets/Personajes/Amaru1.png"),
            video: require("../../assets/MisionesGame/Amaru-misión.mp4"),
            difficulty: "hard",
            rewards: { xp: 750, items: ["Guantes de fuerza", "Escudo de la naturaleza"] },
            objectives: ["Localizar la fuente", "Derrotar secuaces", "Instalar filtros"],
          }
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
              "Killa debe descubrir la identidad de Shadowman...",
            image: require("../../assets/Personajes/Amaru1.png"),
            video: require("../../assets/MisionesGame/MIsion-killa.mp4"),
            difficulty: "easy",
            rewards: { xp: 450, items: ["Capa de sigilo", "Amuleto de visión"] },
            objectives: ["Investigar al consejo", "Recolectar pruebas", "Exponer al enemigo"],
          }
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
            description: `${characterName} debe enfrentar amenazas al medio ambiente...`,
            image: require("../../assets/Personajes/Amaru1.png"),
            video: require("../../assets/videos/Tunel.mp4"),
            difficulty: "medium",
            rewards: { xp: 400, items: ["Poción de energía"] },
            objectives: ["Proteger los recursos", "Preservar tradiciones"],
          }
      }

      setMission(characterMission)
      setTheme(themeColors)
    }
  }, [characterName])

  const handleStartMission = () => {
    navigation.navigate("MissionGameScreen")
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando misió...</Text>
      </View>
    )
  }

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
    paddingTop: 40,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 5,
  },
  closeButtonFullScreen: {
    position: "absolute",
    top: 40,
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
  },
  missionDescription: {
    fontSize: 18,
    color: "#FFFFFF",
    lineHeight: 26,
    marginBottom: 24,
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
