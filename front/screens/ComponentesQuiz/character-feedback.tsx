"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, Text, StyleSheet, Dimensions } from "react-native"
import { Video, ResizeMode } from "expo-av"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Tipo para imágenes (puede ser require local o URL)
type ImageSource = number | { uri: string }

type CharacterFeedbackProps = {
  isCorrect: boolean
  characterImage: ImageSource
  backgroundImage: ImageSource
}

// URLs de videos para cada personaje
const characterResultVideos: Record<string, { win: string; lose: string }> = {
  Qhapaq: {
    win: "https://d1xh8jk9umgr2r.cloudfront.net/QhapacWin.mp4",
    lose: "https://d1xh8jk9umgr2r.cloudfront.net/QhapacLose.mp4",
  },
  Amaru: {
    win: "https://d1xh8jk9umgr2r.cloudfront.net/AmaruWin.mp4",
    lose: "https://d1xh8jk9umgr2r.cloudfront.net/AmaruLose.mp4",
  },
  Killa: {
    win: "https://d1xh8jk9umgr2r.cloudfront.net/KillaWin.mp4",
    lose: "https://d1xh8jk9umgr2r.cloudfront.net/KillaLose.mp4",
  },
}

const { width, height } = Dimensions.get("window")

export const CharacterFeedback: React.FC<CharacterFeedbackProps> = ({ isCorrect, characterImage, backgroundImage }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string>("Qhapaq")
  const [videoLoaded, setVideoLoaded] = useState(false)

  // Cargar el personaje seleccionado al inicio
  useEffect(() => {
    const loadSelectedCharacter = async () => {
      try {
        const characterName = await AsyncStorage.getItem("selectedCharacterName")
        if (characterName) {
          setSelectedCharacter(characterName)
        }
      } catch (error) {
        console.error("Error al cargar el personaje seleccionado:", error)
      }
    }

    loadSelectedCharacter()
  }, [])

  // Obtener los videos para el personaje seleccionado
  const characterVideos = characterResultVideos[selectedCharacter] || characterResultVideos.Qhapaq
  const videoSource = isCorrect ? characterVideos.win : characterVideos.lose

  // Función para manejar la carga del video
  const handleVideoLoad = (status) => {
    if (status.isLoaded) {
      setVideoLoaded(true)
    }
  }

  return (
    <View style={styles.container}>
      {/* Video a pantalla completa */}
      <Video
        source={{ uri: videoSource }}
        style={styles.fullScreenVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={false}
        onPlaybackStatusUpdate={handleVideoLoad}
      />

      {/* Texto superpuesto */}
      <View style={styles.textOverlay}>
        <Text style={[styles.text, isCorrect ? styles.correct : styles.incorrect]}>
          {isCorrect ? "¡Lo hiciste bien!" : "Oh no! Mis puntos de vida..."}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  fullScreenVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  textOverlay: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  correct: {
    color: "#2ecc40",
  },
  incorrect: {
    color: "#e74c3c",
  },
})
