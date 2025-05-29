"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Dimensions, Alert, type ScaledSize } from "react-native"
import { StatusBar } from "expo-status-bar"
import { Audio } from "expo-av"
import { Feather } from "@expo/vector-icons"
import { useIsFocused, useNavigation, type NavigationProp } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import CharacterDisplay from "../ComponentesHero/CharacterDisplay"
import CharacterList from "../ComponentesHero/CharacterList"
import type { Character } from "../ComponentesHero/types"

// 🎯 TIPOS PARA INCLUIR VILLAINSELECTION EN AUTHSTACK
type RootStackParamList = {
  Login: undefined
  Register: undefined
  StudentAuth: undefined
  VillainSelection: undefined
}

type NavigationProps = NavigationProp<RootStackParamList>

// ---------- Tipos ----------
type CharacterWithSize = Character & {
  imageSize?: { width: number; height: number }
}

// ---------- Componente ----------
export default function StudentDashboardScreen() {
  const isFocused = useIsFocused()
  const navigation = useNavigation<NavigationProps>()
  const soundRef = useRef<Audio.Sound | null>(null)
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get("window"))
  const [isNavigating, setIsNavigating] = useState(false)

  // Detect screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })

    return () => subscription.remove()
  }, [])

  // Calculate if device is a tablet
  const isTablet = useCallback(() => {
    const { width, height } = dimensions
    const screenSize = Math.sqrt(width * width + height * height) / 160
    return screenSize >= 7
  }, [dimensions])

  // ---------------- Datos de personajes -------------
  const characters: CharacterWithSize[] = [
    {
      id: "1",
      name: "Qhapaq",
      image: require("../../assets/images/chaman.png"),
      description: "Un Inca muy sabio y hábil",
      background: ["#8E44AD", "#9B59B6"],
      stats: { strength: 70, wisdom: 95, agility: 65, defense: 80 },
      imageSize: { width: 200, height: 250 },
      class: "Sabio",
    },
    {
      id: "2",
      name: "Amaru",
      image: require("../../assets/Personajes/Amaru1.png"),
      description: "Una persona muy fuerte",
      background: ["#E74C3C", "#C0392B"],
      stats: { strength: 95, wisdom: 60, agility: 85, defense: 75 },
      imageSize: { width: 150, height: 500 },
      class: "Aventurero",
    },
    {
      id: "3",
      name: "Killa",
      image: require("../../assets/Personajes/Guerrera.png"),
      description: "Una guerrera",
      background: ["#3498DB", "#2980B9"],
      stats: { strength: 75, wisdom: 80, agility: 90, defense: 65 },
      imageSize: { width: 200, height: 150 },
      class: "Guerrera",
    },
  ]

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterWithSize>(characters[0])
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    console.log("✅ Entraste a StudentDashboardScreen")
    setIsNavigating(false)
  }, [])

  // ---------------- Funciones de audio --------------
  const playBackgroundSound = useCallback(async () => {
    if (soundRef.current) return

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      })

      const { sound } = await Audio.Sound.createAsync(require("../../assets/SonidoJuego/SonidoFondoOriginal.mp3"), {
        isLooping: true,
        volume: 0.5,
        shouldPlay: true,
      })

      soundRef.current = sound
      setIsPlaying(true)
    } catch (error) {
      console.error("Error al cargar el audio:", error)
    }
  }, [])

  const stopSound = useCallback(async () => {
    if (!soundRef.current) return

    try {
      await soundRef.current.stopAsync()
      await soundRef.current.unloadAsync()
      soundRef.current = null
      setIsPlaying(false)
    } catch (error) {
      console.error("Error al detener el audio:", error)
    }
  }, [])

  // ------------- Manejar foco de pantalla -----------
  useEffect(() => {
    if (isFocused) {
      playBackgroundSound()
    } else {
      stopSound()
    }

    return () => {
      stopSound()
    }
  }, [isFocused, playBackgroundSound, stopSound])

  // ------------- Toggle manual (botón volumen) ------
  const togglePlayback = async () => {
    if (!soundRef.current) return

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync()
      } else {
        await soundRef.current.playAsync()
      }
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error("Error al cambiar reproducción:", error)
    }
  }

  // ------------- Guardar personaje seleccionado ------
  const handleSelectCharacter = (character: CharacterWithSize) => {
    setSelectedCharacter(character)
    console.log(`🎯 Personaje seleccionado: ${character.name}`)
  }

  // 🎯 FUNCIÓN PARA CONFIRMAR PERSONAJE
  const handleConfirmCharacter = async () => {
    if (isNavigating) {
      console.log("⚠️ Ya se está navegando, ignorando...")
      return
    }

    try {
      setIsNavigating(true)
      console.log(`🎯 INICIANDO NAVEGACIÓN - Personaje: ${selectedCharacter.name}`)

      // 🎯 GUARDAR EL PERSONAJE
      await AsyncStorage.setItem("selectedCharacterName", selectedCharacter.name)
      await AsyncStorage.setItem("blockMissionInfo", "true")
      await AsyncStorage.setItem("screenState", "navigating_to_villain")

      console.log(`✅ Personaje guardado: ${selectedCharacter.name}`)

      // 🔍 VERIFICAR ESTADO DE NAVEGACIÓN
      const state = navigation.getState()
      console.log("📋 Estado de navegación:", JSON.stringify(state, null, 2))
      console.log("📋 Rutas disponibles:", state?.routeNames)

      // ✅ VILLAINSELECTION DEBERÍA ESTAR DISPONIBLE EN AUTHSTACK
      if (!state?.routeNames?.includes("VillainSelection")) {
        throw new Error("La ruta VillainSelection no está disponible en AuthStack")
      }

      // 🚀 NAVEGACIÓN DIRECTA
      console.log("🚀 EJECUTANDO NAVEGACIÓN A VillainSelection...")
      navigation.navigate("VillainSelection")
      console.log("✅ NAVEGACIÓN EJECUTADA EXITOSAMENTE")

      // Timeout para resetear flag
      setTimeout(() => {
        setIsNavigating(false)
        console.log("🔄 Flag de navegación reseteado")
      }, 2000)
    } catch (error) {
      console.error("❌ ERROR EN NAVEGACIÓN:", error)
      setIsNavigating(false)

      Alert.alert("Error de Navegación", `No se pudo navegar: ${error.message}`, [
        {
          text: "Reintentar",
          onPress: () => {
            setTimeout(() => handleConfirmCharacter(), 500)
          },
        },
        { text: "Cancelar", style: "cancel" },
      ])
    }
  }

  // 🎯 CARGAR PERSONAJE
  useEffect(() => {
    const loadSelectedCharacter = async () => {
      try {
        const savedCharacterName = await AsyncStorage.getItem("selectedCharacterName")
        if (savedCharacterName) {
          const foundCharacter = characters.find((char) => char.name === savedCharacterName)
          if (foundCharacter) {
            setSelectedCharacter(foundCharacter)
            console.log(`📱 Personaje cargado: ${foundCharacter.name}`)
          }
        }
      } catch (error) {
        console.error("Error al cargar el personaje:", error)
      }
    }

    loadSelectedCharacter()
  }, [])

  // Calculate responsive sizes
  const getResponsiveSize = (size: number) => {
    const { width } = dimensions
    const baseWidth = 375
    return (width / baseWidth) * size
  }

  // --------------------- UI -------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {/* Botón de volumen */}
        <TouchableOpacity
          style={[
            styles.musicButton,
            {
              width: getResponsiveSize(40),
              height: getResponsiveSize(40),
              borderRadius: getResponsiveSize(20),
              top: getResponsiveSize(10),
              right: getResponsiveSize(10),
            },
          ]}
          onPress={togglePlayback}
          activeOpacity={0.7}
        >
          <Feather name={isPlaying ? "volume-2" : "volume-x"} size={getResponsiveSize(24)} color="#FFD700" />
        </TouchableOpacity>

        <View style={styles.characterContainer}>
          <CharacterDisplay
            character={selectedCharacter}
            imageSize={
              selectedCharacter.imageSize
                ? {
                    width: getResponsiveSize(selectedCharacter.imageSize.width),
                    height: getResponsiveSize(selectedCharacter.imageSize.height),
                  }
                : undefined
            }
            onSelect={handleConfirmCharacter}
          />
        </View>

        <View style={styles.listContainer}>
          <CharacterList characters={characters} onSelectCharacter={handleSelectCharacter} isTablet={isTablet()} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  characterContainer: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    flex: 1,
    marginBottom: 10,
  },
  musicButton: {
    position: "absolute",
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
})