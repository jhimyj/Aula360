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

// 🎯 TIPOS DE NAVEGACIÓN
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

// 🎬 CONFIGURACIÓN DE VIDEOS
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

// 🎮 FASES DE LA BATALLA
enum BattlePhase {
  LOADING = "loading",
  HERO_VIDEO = "hero",
  VS_VIDEO = "vs",
  VILLAIN_VIDEO = "villain",
  COMPLETED = "completed",
}

// ⏱️ DURACIONES ESPERADAS DE VIDEOS (en milisegundos)
const VIDEO_DURATIONS = {
  hero: 12000, // 12 segundos
  vs: 8000, // 8 segundos
  villain: 12000, // 12 segundos
}

const BattleVideoScreen = () => {
  const navigation = useNavigation<NavigationProps>()

  // 📱 ESTADOS PRINCIPALES
  const [currentPhase, setCurrentPhase] = useState<BattlePhase>(BattlePhase.LOADING)
  const [characterName, setCharacterName] = useState<string>("Qhapac")
  const [villainName, setVillainName] = useState<string>("Corporatus")
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // 🔥 ESTADOS MEJORADOS PARA CONTROL DE VIDEOS
  const [videoStates, setVideoStates] = useState({
    hero: { completed: false, playing: false, duration: 0, position: 0 },
    vs: { completed: false, playing: false, duration: 0, position: 0 },
    villain: { completed: false, playing: false, duration: 0, position: 0 },
  })

  // 📹 REFERENCIAS DE VIDEO
  const heroVideoRef = useRef<Video>(null)
  const vsVideoRef = useRef<Video>(null)
  const villainVideoRef = useRef<Video>(null)

  // ⏰ REFERENCIAS DE TIMEOUTS
  const timeoutRefs = useRef<{
    hero?: NodeJS.Timeout
    vs?: NodeJS.Timeout
    villain?: NodeJS.Timeout
  }>({})

  // 🔒 BLOQUEAR ORIENTACIÓN AL MONTAR EL COMPONENTE
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // Bloquear en orientación vertical (portrait)
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
        console.log("🔒 Orientación bloqueada en vertical")
      } catch (error) {
        console.error("❌ Error bloqueando orientación:", error)
      }
    }

    lockOrientation()

    // Cleanup: desbloquear orientación al desmontar
    return () => {
      ScreenOrientation.unlockAsync().catch(console.error)
    }
  }, [])

  // 🎯 CARGAR DATOS DE PERSONAJES (SOLO UNA VEZ)
  useEffect(() => {
    if (isInitialized) return

    const loadCharacterData = async () => {
      try {
        console.log("🔄 Cargando datos de personajes...")
        setIsInitialized(true)

        // Cargar héroe
        const savedCharacterName = await AsyncStorage.getItem("selectedCharacterName")
        if (savedCharacterName && VIDEO_URLS.heroes[savedCharacterName as keyof typeof VIDEO_URLS.heroes]) {
          setCharacterName(savedCharacterName)
          console.log("✅ Héroe cargado:", savedCharacterName)
        } else {
          console.log("⚠️ Usando héroe por defecto: Qhapac")
          setCharacterName("Qhapac")
        }

        // Cargar villano
        const savedVillainName = await AsyncStorage.getItem("selectedVillainName")
        console.log("NAME Villano : ", savedVillainName)
        let finalVillainName = "Corporatus"

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
        } else {
          const savedVillain = await AsyncStorage.getItem("selectedVillain")
          if (savedVillain) {
            try {
              const villainData = JSON.parse(savedVillain)
              if (villainData.name && VIDEO_URLS.villains[villainData.name as keyof typeof VIDEO_URLS.villains]) {
                finalVillainName = villainData.name
              }
            } catch (error) {
              console.log("Error parsing villain data:", error)
            }
          }
        }

        setVillainName(finalVillainName)
        console.log("✅ Villano cargado:", finalVillainName)

        // Iniciar precarga de videos
        await preloadVideos(savedCharacterName || "Qhapac", finalVillainName)
      } catch (error) {
        console.error("❌ Error cargando datos:", error)
        setCharacterName("Qhapac")
        setVillainName("Corporatus")
        await preloadVideos("Qhapac", "Corporatus")
      }
    }

    loadCharacterData()
  }, [isInitialized])

  // 🎬 PRECARGA OPTIMIZADA DE VIDEOS
  const preloadVideos = async (heroName: string, villainName: string) => {
    try {
      console.log("🎬 Iniciando precarga de videos...")
      setLoadingProgress(10)

      const heroUrl = VIDEO_URLS.heroes[heroName as keyof typeof VIDEO_URLS.heroes]
      const vsUrl = VIDEO_URLS.vs
      const villainUrl = VIDEO_URLS.villains[villainName as keyof typeof VIDEO_URLS.villains]

      console.log("📹 URLs a precargar:", { heroUrl, vsUrl, villainUrl })

      // Precargar video del héroe
      if (heroVideoRef.current && heroUrl) {
        try {
          await heroVideoRef.current.loadAsync({ uri: heroUrl }, { shouldPlay: false }, false)
          setLoadingProgress(40)
          console.log("✅ Video héroe precargado")
        } catch (error) {
          console.log("⚠️ Error precargando héroe:", error)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 300))

      // Precargar video VS
      if (vsVideoRef.current && vsUrl) {
        try {
          await vsVideoRef.current.loadAsync({ uri: vsUrl }, { shouldPlay: false }, false)
          setLoadingProgress(70)
          console.log("✅ Video VS precargado")
        } catch (error) {
          console.log("⚠️ Error precargando VS:", error)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 300))

      // Precargar video del villano
      if (villainVideoRef.current && villainUrl) {
        try {
          await villainVideoRef.current.loadAsync({ uri: villainUrl }, { shouldPlay: false }, false)
          setLoadingProgress(100)
          console.log("✅ Video villano precargado")
        } catch (error) {
          console.log("⚠️ Error precargando villano:", error)
        }
      }

      setTimeout(() => {
        setIsLoading(false)
        setCurrentPhase(BattlePhase.HERO_VIDEO)
        startHeroVideo()
      }, 1000)
    } catch (error) {
      console.error("❌ Error en precarga:", error)
      setIsLoading(false)
      setCurrentPhase(BattlePhase.HERO_VIDEO)
      startHeroVideo()
    }
  }

  // 🔄 RESETEAR ESTADOS DE VIDEOS
  const resetVideoStates = () => {
    setVideoStates({
      hero: { completed: false, playing: false, duration: 0, position: 0 },
      vs: { completed: false, playing: false, duration: 0, position: 0 },
      villain: { completed: false, playing: false, duration: 0, position: 0 },
    })

    // Limpiar timeouts existentes
    Object.values(timeoutRefs.current).forEach((timeout) => {
      if (timeout) clearTimeout(timeout)
    })
    timeoutRefs.current = {}
  }

  // ⏰ CONFIGURAR TIMEOUT DE SEGURIDAD
  const setSecurityTimeout = (videoType: keyof typeof VIDEO_DURATIONS, callback: () => void) => {
    const duration = VIDEO_DURATIONS[videoType] + 2000 // +2 segundos de margen

    timeoutRefs.current[videoType] = setTimeout(() => {
      console.log(`⚠️ Timeout de seguridad activado para ${videoType}`)
      if (!videoStates[videoType].completed) {
        callback()
      }
    }, duration)
  }

  // 🎬 INICIAR VIDEO DEL HÉROE - MEJORADO
  const startHeroVideo = async () => {
    try {
      console.log("🦸‍♂️ Iniciando video del héroe...")

      // Resetear estados
      resetVideoStates()

      if (heroVideoRef.current) {
        const status = await heroVideoRef.current.getStatusAsync()

        if (status.isLoaded) {
          // Asegurar posición inicial
          await heroVideoRef.current.setPositionAsync(0)

          // Actualizar estado
          setVideoStates((prev) => ({
            ...prev,
            hero: { ...prev.hero, playing: true },
          }))

          // Configurar timeout de seguridad
          setSecurityTimeout("hero", startVsVideo)

          // Reproducir con delay
          setTimeout(async () => {
            try {
              await heroVideoRef.current?.playAsync()
              console.log("✅ Video del héroe iniciado correctamente")
            } catch (error) {
              console.error("❌ Error al reproducir video héroe:", error)
              setTimeout(() => startVsVideo(), 1000)
            }
          }, 800)
        } else {
          console.log("⚠️ Video héroe no está cargado, reintentando...")
          setTimeout(() => startHeroVideo(), 1500)
        }
      }
    } catch (error) {
      console.error("❌ Error reproduciendo video héroe:", error)
      setTimeout(() => startVsVideo(), 1000)
    }
  }

  // ⚔️ INICIAR VIDEO VS - MEJORADO
  const startVsVideo = async () => {
    try {
      console.log("⚔️ Iniciando video VS...")

      // Limpiar timeout del héroe
      if (timeoutRefs.current.hero) {
        clearTimeout(timeoutRefs.current.hero)
      }

      setCurrentPhase(BattlePhase.VS_VIDEO)

      if (vsVideoRef.current) {
        const status = await vsVideoRef.current.getStatusAsync()

        if (status.isLoaded) {
          await vsVideoRef.current.setPositionAsync(0)

          setVideoStates((prev) => ({
            ...prev,
            hero: { ...prev.hero, completed: true, playing: false },
            vs: { ...prev.vs, playing: true },
          }))

          // Configurar timeout de seguridad
          setSecurityTimeout("vs", startVillainVideo)

          setTimeout(async () => {
            try {
              await vsVideoRef.current?.playAsync()
              console.log("✅ Video VS iniciado correctamente")
            } catch (error) {
              console.error("❌ Error al reproducir video VS:", error)
              setTimeout(() => startVillainVideo(), 1000)
            }
          }, 800)
        } else {
          setTimeout(() => startVsVideo(), 1500)
        }
      }
    } catch (error) {
      console.error("❌ Error reproduciendo video VS:", error)
      setTimeout(() => startVillainVideo(), 1000)
    }
  }

  // 🦹‍♂️ INICIAR VIDEO DEL VILLANO - MEJORADO
  const startVillainVideo = async () => {
    try {
      console.log("🦹‍♂️ Iniciando video del villano...")

      // Limpiar timeout del VS
      if (timeoutRefs.current.vs) {
        clearTimeout(timeoutRefs.current.vs)
      }

      setCurrentPhase(BattlePhase.VILLAIN_VIDEO)

      if (villainVideoRef.current) {
        const status = await villainVideoRef.current.getStatusAsync()

        if (status.isLoaded) {
          await villainVideoRef.current.setPositionAsync(0)

          setVideoStates((prev) => ({
            ...prev,
            vs: { ...prev.vs, completed: true, playing: false },
            villain: { ...prev.villain, playing: true },
          }))

          // Configurar timeout de seguridad
          setSecurityTimeout("villain", navigateToQuiz)

          setTimeout(async () => {
            try {
              await villainVideoRef.current?.playAsync()
              console.log("✅ Video villano iniciado correctamente")
            } catch (error) {
              console.error("❌ Error al reproducir video villano:", error)
              setTimeout(() => navigateToQuiz(), 1000)
            }
          }, 800)
        } else {
          setTimeout(() => startVillainVideo(), 1500)
        }
      }
    } catch (error) {
      console.error("❌ Error reproduciendo video villano:", error)
      setTimeout(() => navigateToQuiz(), 1000)
    }
  }

  // 🎯 NAVEGAR AL QUIZ
  const navigateToQuiz = async () => {
    try {
      console.log("🎮 Batalla completada - Navegando a Quiz...")

      // Limpiar timeout del villano
      if (timeoutRefs.current.villain) {
        clearTimeout(timeoutRefs.current.villain)
      }

      await AsyncStorage.multiSet([
        ["battleCompleted", "true"],
        ["quizMode", "post_battle"],
        ["battleResult", "completed"],
        ["gamePhase", "quiz"],
        ["gameState", "in_quiz"],
      ])

      setCurrentPhase(BattlePhase.COMPLETED)

      // Desbloquear orientación antes de navegar
      await ScreenOrientation.unlockAsync()

      navigation.navigate("Quiz")
    } catch (error) {
      console.error("❌ Error navegando al quiz:", error)
      navigation.navigate("Quiz")
    }
  }

  // 📹 MANEJAR ESTADO DE REPRODUCCIÓN - SISTEMA MEJORADO
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus, videoType: "hero" | "vs" | "villain") => {
    if (!status.isLoaded) return

    // Actualizar posición y duración
    setVideoStates((prev) => ({
      ...prev,
      [videoType]: {
        ...prev[videoType],
        duration: status.durationMillis || 0,
        position: status.positionMillis || 0,
      },
    }))

    // 🔥 DETECCIÓN MEJORADA DE FINALIZACIÓN
    const isNearEnd =
      status.durationMillis && status.positionMillis && status.positionMillis >= status.durationMillis - 200 // 200ms de margen

    const isVideoFinished = status.didJustFinish || isNearEnd

    // Verificar si el video ya fue marcado como completado
    if (isVideoFinished && !videoStates[videoType].completed && videoStates[videoType].playing) {
      console.log(
        `✅ Video ${videoType} terminado - Posición: ${status.positionMillis}ms, Duración: ${status.durationMillis}ms`,
      )

      // Marcar como completado inmediatamente
      setVideoStates((prev) => ({
        ...prev,
        [videoType]: { ...prev[videoType], completed: true, playing: false },
      }))

      // Limpiar timeout correspondiente
      if (timeoutRefs.current[videoType]) {
        clearTimeout(timeoutRefs.current[videoType])
      }

      // Proceder al siguiente video
      setTimeout(() => {
        switch (videoType) {
          case "hero":
            startVsVideo()
            break
          case "vs":
            startVillainVideo()
            break
          case "villain":
            navigateToQuiz()
            break
        }
      }, 500)
    }

    // Manejar errores
    if (status.error) {
      console.error(`❌ Error en video ${videoType}:`, status.error)
      if (!videoStates[videoType].completed) {
        setVideoStates((prev) => ({
          ...prev,
          [videoType]: { ...prev[videoType], completed: true, playing: false },
        }))

        setTimeout(() => {
          switch (videoType) {
            case "hero":
              startVsVideo()
              break
            case "vs":
              startVillainVideo()
              break
            case "villain":
              navigateToQuiz()
              break
          }
        }, 1000)
      }
    }
  }

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    return () => {
      // Limpiar todos los timeouts
      Object.values(timeoutRefs.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout)
      })

      // Desbloquear orientación
      ScreenOrientation.unlockAsync().catch(console.error)
    }
  }, [])

  // 🎨 RENDERIZAR PANTALLA DE CARGA
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

      {/* 🦸‍♂️ VIDEO DEL HÉROE */}
      <Video
        ref={heroVideoRef}
        style={currentPhase === BattlePhase.HERO_VIDEO ? styles.activeVideo : styles.hiddenVideo}
        source={{ uri: VIDEO_URLS.heroes[characterName as keyof typeof VIDEO_URLS.heroes] }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={currentPhase === BattlePhase.HERO_VIDEO && videoStates.hero.playing}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, "hero")}
        useNativeControls={false}
        progressUpdateIntervalMillis={250} // Más frecuente para mejor detección
        positionMillis={0}
      />

      {/* ⚔️ VIDEO VS */}
      <Video
        ref={vsVideoRef}
        style={currentPhase === BattlePhase.VS_VIDEO ? styles.activeVideo : styles.hiddenVideo}
        source={{ uri: VIDEO_URLS.vs }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={currentPhase === BattlePhase.VS_VIDEO && videoStates.vs.playing}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, "vs")}
        useNativeControls={false}
        progressUpdateIntervalMillis={250}
      />

      {/* 🦹‍♂️ VIDEO DEL VILLANO */}
      <Video
        ref={villainVideoRef}
        style={currentPhase === BattlePhase.VILLAIN_VIDEO ? styles.activeVideo : styles.hiddenVideo}
        source={{ uri: VIDEO_URLS.villains[villainName as keyof typeof VIDEO_URLS.villains] }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={currentPhase === BattlePhase.VILLAIN_VIDEO && videoStates.villain.playing}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, "villain")}
        useNativeControls={false}
        progressUpdateIntervalMillis={250}
      />

      {/* 🐛 DEBUG INFO (solo en desarrollo) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Fase: {currentPhase} | Héroe: {videoStates.hero.completed ? "✅" : "⏳"} | VS:{" "}
            {videoStates.vs.completed ? "✅" : "⏳"} | Villano: {videoStates.villain.completed ? "✅" : "⏳"}
          </Text>
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
  },
})

export default BattleVideoScreen
