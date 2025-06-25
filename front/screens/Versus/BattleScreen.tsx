"use client"

import { useState, useRef, useEffect } from "react"
import { View, StyleSheet, Dimensions, StatusBar, Text, ActivityIndicator } from "react-native"
import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

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

const BattleVideoScreen = () => {
  const navigation = useNavigation<NavigationProps>()

  // 📱 ESTADOS PRINCIPALES
  const [currentPhase, setCurrentPhase] = useState<BattlePhase>(BattlePhase.LOADING)
  const [characterName, setCharacterName] = useState<string>("Qhapac")
  const [villainName, setVillainName] = useState<string>("Corporatus")
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // 🔥 ESTADOS SIMPLIFICADOS PARA CONTROL DE VIDEOS
  const [videoCompletionFlags, setVideoCompletionFlags] = useState({
    hero: false,
    vs: false,
    villain: false
  })

  // 📹 REFERENCIAS DE VIDEO
  const heroVideoRef = useRef<Video>(null)
  const vsVideoRef = useRef<Video>(null)
  const villainVideoRef = useRef<Video>(null)

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

      await new Promise((resolve) => setTimeout(resolve, 200))

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

      await new Promise((resolve) => setTimeout(resolve, 200))

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

  // 🔄 RESETEAR FLAGS DE COMPLETACIÓN
  const resetVideoFlags = () => {
    setVideoCompletionFlags({
      hero: false,
      vs: false,
      villain: false
    })
  }

  // 🎬 INICIAR VIDEO DEL HÉROE - SIMPLIFICADO
  const startHeroVideo = async () => {
    try {
      console.log("🦸‍♂️ Iniciando video del héroe...")
      
      // Resetear flags
      resetVideoFlags()
      
      if (heroVideoRef.current) {
        // Asegurar posición inicial
        await heroVideoRef.current.setPositionAsync(0)
        
        // Reproducir después de un breve delay
        setTimeout(async () => {
          try {
            await heroVideoRef.current?.playAsync()
            console.log("✅ Video del héroe iniciado correctamente")
          } catch (error) {
            console.error("❌ Error al reproducir video héroe:", error)
            setTimeout(() => startVsVideo(), 1000)
          }
        }, 300)
      }
    } catch (error) {
      console.error("❌ Error reproduciendo video héroe:", error)
      setTimeout(() => startVsVideo(), 1000)
    }
  }

  // ⚔️ INICIAR VIDEO VS
  const startVsVideo = async () => {
    try {
      console.log("⚔️ Iniciando video VS...")
      setCurrentPhase(BattlePhase.VS_VIDEO)
      if (vsVideoRef.current) {
        await vsVideoRef.current.setPositionAsync(0)
        setTimeout(async () => {
          await vsVideoRef.current?.playAsync()
        }, 300)
      }
    } catch (error) {
      console.error("❌ Error reproduciendo video VS:", error)
      setTimeout(() => startVillainVideo(), 1000)
    }
  }

  // 🦹‍♂️ INICIAR VIDEO DEL VILLANO
  const startVillainVideo = async () => {
    try {
      console.log("🦹‍♂️ Iniciando video del villano...")
      setCurrentPhase(BattlePhase.VILLAIN_VIDEO)
      if (villainVideoRef.current) {
        await villainVideoRef.current.setPositionAsync(0)
        setTimeout(async () => {
          await villainVideoRef.current?.playAsync()
        }, 300)
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

      await AsyncStorage.multiSet([
        ["battleCompleted", "true"],
        ["quizMode", "post_battle"],
        ["battleResult", "completed"],
        ["gamePhase", "quiz"],
        ["gameState", "in_quiz"],
      ])

      setCurrentPhase(BattlePhase.COMPLETED)
      navigation.navigate("Quiz")
    } catch (error) {
      console.error("❌ Error navegando al quiz:", error)
      navigation.navigate("Quiz")
    }
  }

  // 📹 MANEJAR ESTADO DE REPRODUCCIÓN - SIMPLIFICADO Y CORREGIDO
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus, videoType: "hero" | "vs" | "villain") => {
    if (!status.isLoaded) return

    // 🔥 SOLO USAR didJustFinish PARA DETERMINAR FINALIZACIÓN
    if (status.didJustFinish && !videoCompletionFlags[videoType]) {
      console.log(`✅ Video ${videoType} terminado completamente por didJustFinish`)
      
      // Marcar como completado para evitar múltiples ejecuciones
      setVideoCompletionFlags(prev => ({
        ...prev,
        [videoType]: true
      }))

      // Proceder al siguiente video con un pequeño delay
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
      if (!videoCompletionFlags[videoType]) {
        setVideoCompletionFlags(prev => ({
          ...prev,
          [videoType]: true
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
        shouldPlay={currentPhase === BattlePhase.HERO_VIDEO}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, "hero")}
        useNativeControls={false}
        progressUpdateIntervalMillis={500} // Menos frecuente para mejor estabilidad
        positionMillis={0}
      />

      {/* ⚔️ VIDEO VS */}
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

      {/* 🦹‍♂️ VIDEO DEL VILLANO */}
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
})

export default BattleVideoScreen