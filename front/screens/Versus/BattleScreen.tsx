"use client"
import { useState, useRef, useEffect } from "react"
import { View, StyleSheet, Dimensions, StatusBar, Text, ActivityIndicator } from "react-native"
import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import * as ScreenOrientation from "expo-screen-orientation"
import { __DEV__ } from "react-native"

const { width, height } = Dimensions.get("window")

//  TIPOS DE NAVEGACIÓN
type RootStackParamList = {
  Login: undefined
  Register: undefined
  StudentAuth: undefined
  VillainSelection: undefined
  MissionGameScreen: undefined
  Mision: undefined
  BattleScreen: undefined
  Quiz: undefined
}

type NavigationProps = NativeStackNavigationProp<RootStackParamList>

//  CONFIGURACIÓN DE VIDEOS
const VIDEO_URLS = {
  heroes: {
    Amaru: "https://d1xh8jk9umgr2r.cloudfront.net/Amaru_intro.mp4",
    Killa: "https://d1xh8jk9umgr2r.cloudfront.net/Killa_intro.mp4",
    Qhapac: "https://d1xh8jk9umgr2r.cloudfront.net/Qhapac_intro.mp4",
  },
  vs: "https://d1xh8jk9umgr2r.cloudfront.net/vs.mp4",
  villains: {
    Corporatus: "https://d1xh8jk9umgr2r.cloudfront.net/Corporatus_intro.mp4",
    Shadowman: "https://d1xh8jk9umgr2r.cloudfront.net/Fantasma_intro.mp4",
    Toxicus: "https://d1xh8jk9umgr2r.cloudfront.net/Toxicus_intro.mp4",
  },
}

//  FASES DE LA BATALLA
enum BattlePhase {
  LOADING = "loading",
  HERO_VIDEO = "hero",
  VS_VIDEO = "vs",
  VILLAIN_VIDEO = "villain",
  COMPLETED = "completed",
}

const BattleVideoScreen = () => {
  const navigation = useNavigation<NavigationProps>()

  // Referencias de control
  const isMountedRef = useRef(true)
  const currentTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Estados principales
  const [currentPhase, setCurrentPhase] = useState<BattlePhase>(BattlePhase.LOADING)
  const [characterName, setCharacterName] = useState<string>("Qhapac")
  const [villainName, setVillainName] = useState<string>("Corporatus")
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Referencias de video
  const heroVideoRef = useRef<Video>(null)
  const vsVideoRef = useRef<Video>(null)
  const villainVideoRef = useRef<Video>(null)

  //  Bloquear orientación
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
        console.log(" Orientación bloqueada")
      } catch (error) {
        console.log(" No se pudo bloquear orientación:", error)
      }
    }

    lockOrientation()

    return () => {
      ScreenOrientation.unlockAsync().catch(() => {})
      isMountedRef.current = false
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        console.log("Cargando datos de personajes...")

        // Cargar héroe
        const savedCharacterName = await AsyncStorage.getItem("selectedCharacterName")
        if (savedCharacterName && VIDEO_URLS.heroes[savedCharacterName as keyof typeof VIDEO_URLS.heroes]) {
          setCharacterName(savedCharacterName)
        }

        // Cargar villano
        let finalVillainName = "Corporatus"
        const savedVillainName = await AsyncStorage.getItem("selectedVillainName")

        if (savedVillainName) {
          try {
            const villainData = JSON.parse(savedVillainName)
            if (villainData.name && VIDEO_URLS.villains[villainData.name as keyof typeof VIDEO_URLS.villains]) {
              finalVillainName = villainData.name
            }
          } catch {
            if (VIDEO_URLS.villains[savedVillainName as keyof typeof VIDEO_URLS.villains]) {
              finalVillainName = savedVillainName
            }
          }
        }

        setVillainName(finalVillainName)
        console.log("Personajes cargados:", { hero: savedCharacterName || "Qhapac", villain: finalVillainName })

        // Simular carga
        await simulateLoading()
      } catch (error) {
        console.error("Error cargando datos:", error)
        await simulateLoading()
      }
    }

    loadCharacterData()
  }, [])

  // Simular carga progresiva
  const simulateLoading = async () => {
    const steps = [20, 40, 60, 80, 100]

    for (const step of steps) {
      if (!isMountedRef.current) return

      setLoadingProgress(step)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    if (isMountedRef.current) {
      setIsLoading(false)
      // Pequeño delay antes de empezar
      setTimeout(() => {
        if (isMountedRef.current) {
          setCurrentPhase(BattlePhase.HERO_VIDEO)
        }
      }, 1000)
    }
  }

  //  Manejar finalización de video
  const handleVideoEnd = (videoType: "hero" | "vs" | "villain") => {
    console.log(`Video ${videoType} terminado`)

    // Limpiar timeout actual
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current)
      currentTimeoutRef.current = null
    }

    if (!isMountedRef.current) return

    // Proceder al siguiente video con un pequeño delay
    setTimeout(() => {
      if (!isMountedRef.current) return

      switch (videoType) {
        case "hero":
          console.log("Cambiando a video VS")
          setCurrentPhase(BattlePhase.VS_VIDEO)
          break
        case "vs":
          console.log("Cambiando a video villano")
          setCurrentPhase(BattlePhase.VILLAIN_VIDEO)
          break
        case "villain":
          console.log("Navegando al quiz")
          navigateToQuiz()
          break
      }
    }, 500)
  }

  //  Manejar estado de reproducción
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus, videoType: "hero" | "vs" | "villain") => {
    if (!status.isLoaded || !isMountedRef.current) return

    // Detectar finalización del video
    if (status.didJustFinish) {
      handleVideoEnd(videoType)
      return
    }

    // Detectar si está cerca del final (fallback)
    if (status.durationMillis && status.positionMillis) {
      const progress = status.positionMillis / status.durationMillis
      const timeRemaining = status.durationMillis - status.positionMillis

      // Si queda menos de 500ms, considerar terminado
      if (timeRemaining <= 500 && progress > 0.95) {
        console.log(` Video ${videoType} cerca del final, finalizando`)
        handleVideoEnd(videoType)
        return
      }
    }

    // Manejar errores
    if (status.error) {
      console.error(` Error en video ${videoType}:`, status.error)
      handleVideoEnd(videoType)
    }
  }

  //  Configurar timeout de seguridad cuando cambia la fase
  useEffect(() => {
    if (currentPhase === BattlePhase.LOADING || currentPhase === BattlePhase.COMPLETED) {
      return
    }

    // Limpiar timeout anterior
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current)
    }

    // Configurar nuevo timeout de seguridad
    const timeoutDuration = currentPhase === BattlePhase.VS_VIDEO ? 10000 : 15000 // VS es más corto

    currentTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return

      console.log(` Timeout de seguridad para ${currentPhase}`)

      switch (currentPhase) {
        case BattlePhase.HERO_VIDEO:
          handleVideoEnd("hero")
          break
        case BattlePhase.VS_VIDEO:
          handleVideoEnd("vs")
          break
        case BattlePhase.VILLAIN_VIDEO:
          handleVideoEnd("villain")
          break
      }
    }, timeoutDuration)

    return () => {
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current)
        currentTimeoutRef.current = null
      }
    }
  }, [currentPhase])

  //  Navegar al quiz
  const navigateToQuiz = async () => {
    if (!isMountedRef.current) return

    try {
      console.log(" Navegando al quiz...")

      await AsyncStorage.multiSet([
        ["battleCompleted", "true"],
        ["quizMode", "post_battle"],
        ["battleResult", "completed"],
        ["gamePhase", "quiz"],
        ["gameState", "in_quiz"],
      ])

      setCurrentPhase(BattlePhase.COMPLETED)

      // Desbloquear orientación
      await ScreenOrientation.unlockAsync()

      // Marcar como desmontado y navegar
      isMountedRef.current = false
      navigation.navigate("Quiz")
    } catch (error) {
      console.error("s Error navegando al quiz:", error)
      isMountedRef.current = false
      navigation.navigate("Quiz")
    }
  }

  //  Renderizar pantalla de carga
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar hidden />
        <Text style={styles.loadingTitle}>Preparando Batalla</Text>
        <Text style={styles.loadingSubtitle}>
          {characterName} vs {villainName}
        </Text>
        <ActivityIndicator size="large" color="#FF6B35" style={styles.loadingSpinner} />
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
        </View>
        <Text style={styles.loadingPercentage}>{loadingProgress}%</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/*  VIDEO DEL HÉROE */}
      <Video
        ref={heroVideoRef}
        style={currentPhase === BattlePhase.HERO_VIDEO ? styles.activeVideo : styles.hiddenVideo}
        source={{ uri: VIDEO_URLS.heroes[characterName as keyof typeof VIDEO_URLS.heroes] }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={currentPhase === BattlePhase.HERO_VIDEO}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, "hero")}
        useNativeControls={false}
        progressUpdateIntervalMillis={500}
      />

      {/*  VIDEO VS */}
      <Video
        ref={vsVideoRef}
        style={currentPhase === BattlePhase.VS_VIDEO ? styles.activeVideo : styles.hiddenVideo}
        source={{ uri: VIDEO_URLS.vs }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={currentPhase === BattlePhase.VS_VIDEO}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, "vs")}
        useNativeControls={false}
        progressUpdateIntervalMillis={500}
      />

      {/*  VIDEO DEL VILLANO */}
      <Video
        ref={villainVideoRef}
        style={currentPhase === BattlePhase.VILLAIN_VIDEO ? styles.activeVideo : styles.hiddenVideo}
        source={{ uri: VIDEO_URLS.villains[villainName as keyof typeof VIDEO_URLS.villains] }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={currentPhase === BattlePhase.VILLAIN_VIDEO}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, "villain")}
        useNativeControls={false}
        progressUpdateIntervalMillis={500}
      />

      {/*  DEBUG INFO */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>Fase Actual: {currentPhase}</Text>
          <Text style={styles.debugText}>
            Héroe: {characterName} | Villano: {villainName}
          </Text>
          <Text style={styles.debugText}>Montado: {isMountedRef.current ? "si" : "no"}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    width: width,
    height: height,
  },
  activeVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 1,
  },
  hiddenVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    opacity: 0,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF6B35",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  loadingSubtitle: {
    fontSize: 20,
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 40,
    fontWeight: "600",
  },
  loadingSpinner: {
    marginBottom: 30,
    transform: [{ scale: 1.5 }],
  },
  progressContainer: {
    width: "80%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FF6B35",
    borderRadius: 4,
  },
  loadingPercentage: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  debugContainer: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 5,
    zIndex: 999,
  },
  debugText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 2,
  },
})

export default BattleVideoScreen
