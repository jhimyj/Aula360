"use client"

import { useState, useEffect, useRef } from "react"
import { StyleSheet, View, StatusBar, BackHandler } from "react-native"
import { Video } from "expo-av" // ✅ CORRECTO
import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Pantalla que muestra un video a pantalla completa según el personaje seleccionado
 * Sin controles adicionales, solo el video
 */
const MissionGameScreen = ({ navigation }) => {
  const [videoSource, setVideoSource] = useState(null)
  const videoRef = useRef(null)

  // Cargar el personaje seleccionado y configurar el video correspondiente
  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        const savedName = await AsyncStorage.getItem("selectedCharacterName")
        if (savedName) {
          switch (savedName) {
            case "Qhapaq":
                setVideoSource(require("..//../assets/videos/Tunel.mp4"))

              break
            case "Amaru":
                setVideoSource(require("..//../assets/videos/Tunel.mp4"))

              break
            case "Killa":
                setVideoSource(require("..//../assets/videos/Tunel.mp4"))

              break
            default:
                setVideoSource(require("..//../assets/videos/Tunel.mp4"))

          }
        }
      } catch (error) {
        console.error("Error al cargar el nombre del personaje:", error)
      }
    }

    loadCharacterData()
  }, [])

  // Manejar el botón de retroceso en Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack()
      return true
    })

    return () => {
      backHandler.remove()
    }
  }, [navigation])

  // Navegar al finalizar el video
  const handlePlaybackEnd = () => {
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {videoSource && (
        <Video
          ref={videoRef}
          style={styles.video}
          source={videoSource}
          resizeMode="cover"
          shouldPlay
          isLooping={false}
          useNativeControls={false}
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) {
              handlePlaybackEnd()
            }
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
})

export default MissionGameScreen
