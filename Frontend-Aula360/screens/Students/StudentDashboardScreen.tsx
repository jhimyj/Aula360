"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Dimensions, type ScaledSize } from "react-native"
import { StatusBar } from "expo-status-bar"
import { Audio } from "expo-av"
import { Feather } from "@expo/vector-icons"
import { useIsFocused } from "@react-navigation/native"
import CharacterDisplay from "../ComponentesHero/CharacterDisplay"
import CharacterList from "../ComponentesHero/CharacterList"
import type { Character } from "../ComponentesHero/types"

// ---------- Tipos ----------
type CharacterWithSize = Character & {
  imageSize?: { width: number; height: number }
}

// ---------- Componente ----------
export default function App() {
  const isFocused = useIsFocused()
  const soundRef = useRef<Audio.Sound | null>(null)
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get("window"))

  // Detect screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })

    return () => subscription.remove()
  }, [])

  // Calculate if device is a tablet based on screen size and pixel density
  const isTablet = useCallback(() => {
    const { width, height } = dimensions
    const screenSize = Math.sqrt(width * width + height * height) / 160
    return screenSize >= 7 // Common threshold for tablets
  }, [dimensions])

  // ---------------- Datos de personajes -------------
  const characters: CharacterWithSize[] = [
    {
      id: "1",
      name: "Qhapaq",
      image: require("../../assets/Personajes/Qhapac.png"),
      description: "Un Inca muy sabio y hábil",
      background: ["#8E44AD", "#9B59B6"],
      stats: { strength: 70, wisdom: 95, agility: 65, defense: 80 },
      imageSize: { width: 200, height: 250 },
      class: "Sabio",
    },
    {
      id: "2",
      name: "Amaru",
      image: require("../../assets/Personajes/Amaru.png"),
      description: "Una persona muy fuerte",
      background: ["#E74C3C", "#C0392B"],
      stats: { strength: 95, wisdom: 60, agility: 85, defense: 75 },
      imageSize: { width: 150, height: 500 },
      class: "Aventurero",
    },
    {
      id: "3",
      name: "Killa",
      image: require("../../assets/Personajes/Killa.png"),
      description: "Una guerrera",
      background: ["#3498DB", "#2980B9"],
      stats: { strength: 75, wisdom: 80, agility: 90, defense: 65 },
      imageSize: { width: 200, height: 150 },
      class: "Guerrera",
    },
  ]

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterWithSize>(characters[0])
  const [isPlaying, setIsPlaying] = useState(true)

  // ---------------- Funciones de audio --------------
  const playBackgroundSound = useCallback(async () => {
    if (soundRef.current) return // ya está cargado

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    })

    const { sound } = await Audio.Sound.createAsync(require("../../assets/SonidoJuego/sonidoFondo.mp3"), {
      isLooping: true,
      volume: 0.5,
      shouldPlay: true,
    })

    soundRef.current = sound
    setIsPlaying(true)
  }, [])

  const stopSound = useCallback(async () => {
    if (!soundRef.current) return

    await soundRef.current.stopAsync()
    await soundRef.current.unloadAsync()
    soundRef.current = null
    setIsPlaying(false)
  }, [])

  // ------------- Manejar foco de pantalla -----------
  useEffect(() => {
    if (isFocused) playBackgroundSound()
    else stopSound()

    // Limpieza extra si el componente se desmonta
    return () => {
      stopSound()
    }
  }, [isFocused, playBackgroundSound, stopSound])

  // ------------- Toggle manual (botón volumen) ------
  const togglePlayback = async () => {
    if (!soundRef.current) return

    if (isPlaying) {
      await soundRef.current.pauseAsync()
    } else {
      await soundRef.current.playAsync()
    }
    setIsPlaying(!isPlaying)
  }

  // Calculate responsive sizes based on screen width
  const getResponsiveSize = (size: number) => {
    const { width } = dimensions
    const baseWidth = 375 // iPhone 8 width as base
    return (width / baseWidth) * size
  }

  // --------------------- UI -------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
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
            isTablet={isTablet()}
          />
        </View>

        <View style={styles.listContainer}>
          <CharacterList characters={characters} onSelectCharacter={setSelectedCharacter} isTablet={isTablet()} />
        </View>
      </View>
    </SafeAreaView>
  )
}

// ------------------- Estilos ------------------------
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
