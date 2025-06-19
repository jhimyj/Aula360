"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, Alert, BackHandler } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"
import { MissionManager } from "../ComponentesQuiz/mission-manager" // 🔍 IMPORTAR LA VERSIÓN ACTUALIZADA
import { Audio } from "expo-av"
import { CommonActions } from "@react-navigation/native"

type CharacterName = "Qhapaq" | "Amaru" | "Killa"
type VillainName = "Corporatus" | "Toxicus" | "Shadowman"

// Tipos para las preguntas del API
type ApiQuestion = {
  id: string
  text: string
  type: "MULTIPLE_CHOICE_SINGLE" | "MULTIPLE_CHOICE_MULTIPLE" | "OPEN_ENDED"
  config: {
    options?: string[]
    correct_option?: number
  }
  score: number
  difficulty: "EASY" | "MEDIUM" | "HARD"
  tags?: string[]
  room_id: string
  created_at: string
  updated_at: string
}

type ApiResponse = {
  success: boolean
  code: string
  message: string
  data: ApiQuestion[]
  request_id: string
}

// 🎵 ARCHIVOS DE MÚSICA PARA CADA PERSONAJE
const characterMusic: Record<CharacterName, any> = {
  Qhapaq: require("../../assets/Musica/Amaru.mp3"),
  Amaru: require("../../assets/Musica/Killa.mp3"),
  Killa: require("../../assets/Musica/Qhapac.mp3"),
}

// Videos para resultados de cada personaje
const characterResultVideos: Record<CharacterName, { win: string; lose: string }> = {
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

// Imágenes del villano para cada misión
const villainCharacterImages: Record<VillainName, any[]> = {
  Corporatus: [
    require("../../assets/PersonajesQuiz/Corporatus/CorporatusLevel-1.png"),
    require("../../assets/PersonajesQuiz/Corporatus/CorporatusLevel-2.png"),
    require("../../assets/PersonajesQuiz/Corporatus/CorporatusLevel-3.png"),
  ],
  Toxicus: [
    require("../../assets/PersonajesQuiz/Toxicus/ToxicusLevel-1.png"),
    require("../../assets/PersonajesQuiz/Toxicus/ToxicusLevel-2.png"),
    require("../../assets/PersonajesQuiz/Toxicus/ToxicusLevel-3.png"),
  ],
  Shadowman: [
    require("../../assets/PersonajesQuiz/Shadowman/ShadowmanLevel-1.png"),
    require("../../assets/PersonajesQuiz/Shadowman/ShadowmanLevel-2.png"),
    require("../../assets/PersonajesQuiz/Shadowman/ShadowmanLevel-3.png"),
  ],
}

// Imágenes incorrectas para cada villano y misión
const villainIncorrectImages: Record<VillainName, any[]> = {
  Corporatus: [
    require("../../assets/PersonajesQuiz/Corporatus/CorporatusLevel-1.png"),
    require("../../assets/PersonajesQuiz/Corporatus/CorporatusLevel-2.png"),
    require("../../assets/villanosBattle/Corporatus.png"),
  ],
  Toxicus: [
    require("../../assets/villanosBattle/El Demonio de la Avidez.png"),
    require("../../assets/villanosBattle/El Demonio de la Avidez.png"),
    require("../../assets/villanosBattle/El Demonio de la Avidez.png"),
  ],
  Shadowman: [
    require("../../assets/villanosBattle/Shadowman.png"),
    require("../../assets/villanosBattle/Shadowman.png"),
    require("../../assets/villanosBattle/Shadowman.png"),
  ],
}

// Fondos y correctImages por personaje
const characterAssets: Record<CharacterName, { backgroundImages: any[] }> = {
  Qhapaq: {
    backgroundImages: [
      require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
    ],
  },
  Amaru: {
    backgroundImages: [
      require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),
    ],
  },
  Killa: {
    backgroundImages: [
      require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
    ],
  },
}

// Función para obtener preguntas del API
const fetchQuestionsFromAPI = async (roomId: string): Promise<ApiQuestion[]> => {
  try {
    console.log("🔍 Obteniendo preguntas del API para room:", roomId)

    const studentToken = await AsyncStorage.getItem("studentToken")

    if (!studentToken) {
      throw new Error("No se encontró el token del estudiante. Por favor, inicia sesión nuevamente.")
    }

    console.log("🔑 Token del estudiante obtenido para la petición")

    const response = await axios.get<ApiResponse>(
      `https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/all/room/${roomId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
      },
    )

    console.log("=".repeat(50))
    console.log("📡 RESPUESTA COMPLETA DEL ENDPOINT:")
    console.log("=".repeat(50))
    console.log("Status:", response.status)
    console.log("Headers:", JSON.stringify(response.headers, null, 2))
    console.log("Data completa:", JSON.stringify(response.data, null, 2))
    console.log("=".repeat(50))

    if (response.data.success && response.data.data) {
      console.log(`📚 Se obtuvieron ${response.data.data.length} preguntas`)

      response.data.data.forEach((question, index) => {
        console.log(`\n📝 PREGUNTA ${index + 1}:`)
        console.log("- ID:", question.id)
        console.log("- Texto:", question.text)
        console.log("- Tipo:", question.type)
        console.log("- Dificultad:", question.difficulty)
        console.log("- Score:", question.score)
        console.log("- Tags:", question.tags)
        console.log("- Config:", JSON.stringify(question.config, null, 2))
        console.log("- Room ID:", question.room_id)
        console.log("- Creado:", question.created_at)
        console.log("- Actualizado:", question.updated_at)
        console.log("-".repeat(30))
      })

      return response.data.data
    } else {
      console.error("❌ Respuesta del API no exitosa:", response.data)
      throw new Error(response.data.message || "Error al obtener preguntas")
    }
  } catch (error: any) {
    console.error("💥 Error al obtener preguntas del API:", error)

    if (error.response) {
      console.log("=".repeat(50))
      console.log("❌ ERROR DE RESPUESTA:")
      console.log("=".repeat(50))
      console.error("- Status:", error.response.status)
      console.error("- Status Text:", error.response.statusText)
      console.error("- Headers:", JSON.stringify(error.response.headers, null, 2))
      console.error("- Data:", JSON.stringify(error.response.data, null, 2))
      console.log("=".repeat(50))

      // 🔐 MEJORAR DETECCIÓN DE ERRORES DE AUTENTICACIÓN
      if (error.response.status === 401) {
        throw new Error("Token de autenticación inválido. Por favor, inicia sesión nuevamente.")
      } else if (error.response.status === 403) {
        throw new Error("No tienes permisos para acceder a este contenido. Por favor, inicia sesión nuevamente.")
      } else if (error.response.status === 404) {
        throw new Error("No se encontraron preguntas para esta sala. Contacta a tu profesor.")
      }

      throw new Error(error.response.data?.message || `Error del servidor: ${error.response.status}`)
    } else if (error.request) {
      console.log("=".repeat(50))
      console.log("❌ ERROR DE REQUEST:")
      console.log("=".repeat(50))
      console.error("Request:", error.request)
      console.log("=".repeat(50))
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión a internet.")
    } else {
      console.log("=".repeat(50))
      console.log("❌ ERROR GENERAL:")
      console.log("=".repeat(50))
      console.error("Message:", error.message)
      console.log("=".repeat(50))
      throw new Error(error.message || "Error desconocido")
    }
  }
}

// Función para construir misiones a partir de las preguntas del API
const buildMissionsFromAPI = async (characterName: CharacterName, villainName: VillainName) => {
  const assets = characterAssets[characterName]
  const vilImgs = villainCharacterImages[villainName]
  const incorrectImgs = villainIncorrectImages[villainName]

  // Obtener los videos para el personaje seleccionado
  const characterVideos = characterResultVideos[characterName]

  try {
    const roomId = await AsyncStorage.getItem("roomId")

    if (!roomId) {
      throw new Error("No se encontró el Room ID")
    }

    console.log("🏠 Room ID obtenido del localStorage:", roomId)

    const apiQuestions = await fetchQuestionsFromAPI(roomId)

    if (apiQuestions.length === 0) {
      throw new Error("No se encontraron preguntas para este room")
    }

    console.log("🎯 PROCESANDO TODAS LAS PREGUNTAS PARA MISIONES:")
    console.log(`- Total de preguntas recibidas: ${apiQuestions.length}`)
    console.log(`- Se crearán ${apiQuestions.length} misiones`)

    return apiQuestions.map((apiQuestion, index) => {
      console.log(`\n🔄 PROCESANDO PREGUNTA ${index + 1} de ${apiQuestions.length}:`)
      console.log("- Tipo original:", apiQuestion.type)
      console.log("- Config original:", JSON.stringify(apiQuestion.config, null, 2))

      let options = []

      if (apiQuestion.type === "OPEN_ENDED") {
        options = []
        console.log("✏️ PREGUNTA ABIERTA - NO se crean opciones")
      } else if (apiQuestion.type === "MULTIPLE_CHOICE_SINGLE" && apiQuestion.config.options) {
        const correctOptionIndex =
          apiQuestion.config.correct_option !== undefined ? apiQuestion.config.correct_option : 0

        console.log("- Opción correcta (índice):", correctOptionIndex)
        console.log("- Opciones disponibles:", apiQuestion.config.options)

        options = apiQuestion.config.options.slice(0, 5).map((optionText, optIndex) => ({
          id: String.fromCharCode(65 + optIndex),
          text: optionText,
          isCorrect: optIndex === correctOptionIndex,
        }))

        console.log(
          "- Opciones procesadas:",
          options.map((o) => `${o.id}: ${o.text} (${o.isCorrect ? "CORRECTA" : "incorrecta"})`),
        )
      } else if (apiQuestion.type === "MULTIPLE_CHOICE_MULTIPLE" && apiQuestion.config.options) {
        const correctOptionIndex = 0

        console.log("- Tipo de pregunta con múltiples respuestas correctas")
        console.log("- Tratando como pregunta de opción única para compatibilidad")
        console.log("- Opciones disponibles:", apiQuestion.config.options)

        options = apiQuestion.config.options.slice(0, 5).map((optionText, optIndex) => ({
          id: String.fromCharCode(65 + optIndex),
          text: optionText,
          isCorrect: optIndex === correctOptionIndex,
        }))

        console.log(
          "- Opciones procesadas:",
          options.map((o) => `${o.id}: ${o.text} (${o.isCorrect ? "CORRECTA" : "incorrecta"})`),
        )
      } else {
        console.log("- Tipo de pregunta no reconocido:", apiQuestion.type)
        console.log("- Tratando como pregunta abierta por defecto")
        options = []
      }

      console.log(`✅ Pregunta ${index + 1} procesada exitosamente`)

      const getImageByIndex = (imageArray: any[], index: number) => {
        return imageArray[index % imageArray.length]
      }

      const getTransitionTitle = () => {
        if (apiQuestion.tags && apiQuestion.tags.length > 0) {
          return `Explorando ${apiQuestion.tags[0]}`
        }
        switch (apiQuestion.difficulty) {
          case "EASY":
            return "Pregunta Básica"
          case "MEDIUM":
            return "Pregunta Intermedia"
          case "HARD":
            return "Pregunta Avanzada"
          default:
            return "Nueva Pregunta"
        }
      }

      const getTransitionDescription = () => {
        if (apiQuestion.tags && apiQuestion.tags.length > 0) {
          return `Pon a prueba tus conocimientos sobre ${apiQuestion.tags.join(", ")}`
        }
        return "Prepárate para responder esta pregunta"
      }

      const getFeedback = () => {
        if (apiQuestion.type === "MULTIPLE_CHOICE_SINGLE") {
          return {
            // Reemplazamos las imágenes por videos
            correctVideo: characterVideos.win,
            incorrectVideo: characterVideos.lose,
            correctBackground: getImageByIndex(assets.backgroundImages, index),
            incorrectBackground: getImageByIndex(assets.backgroundImages, index),
            correctDescription: `¡Excelente! Has respondido correctamente. Puntaje: ${apiQuestion.score}`,
            incorrectDescription: "No te preocupes, sigue intentando. ¡Puedes hacerlo mejor!",
            // Indicamos que ahora usamos videos en lugar de imágenes
            useVideo: true,
          }
        } else {
          return {
            correctVideo: characterVideos.win,
            incorrectVideo: characterVideos.lose,
            correctBackground: getImageByIndex(assets.backgroundImages, index),
            incorrectBackground: getImageByIndex(assets.backgroundImages, index),
            correctDescription: `¡Gracias por tu respuesta! Puntaje: ${apiQuestion.score}. Continuemos con la siguiente pregunta.`,
            incorrectDescription: "¡Gracias por tu respuesta! Continuemos con la siguiente pregunta.",
            useVideo: true,
          }
        }
      }

      return {
        id: apiQuestion.id,
        missionNumber: index + 1,
        backgroundImage: getImageByIndex(assets.backgroundImages, index),
        villainImage: getImageByIndex(vilImgs, index),
        question: apiQuestion.text,
        questionType: apiQuestion.type,
        options: options,
        feedback: getFeedback(),
        transition: {
          backgroundImage: getImageByIndex(assets.backgroundImages, index),
          image: getImageByIndex(vilImgs, index),
          title: getTransitionTitle(),
          description: getTransitionDescription(),
        },
        // 🔍 CONFIGURACIÓN DEL AMPLIFICADOR
        amplifier: {
          enabled: true,
          threshold: 1,
          modalTitle: `Pregunta ${index + 1} - ${getTransitionTitle()}`,
          modalDescription: getTransitionDescription(),
        },
        difficulty: apiQuestion.difficulty,
        tags: apiQuestion.tags,
        score: apiQuestion.score,
      }
    })
  } catch (error) {
    console.error("💥 Error en buildMissionsFromAPI:", error)
    throw error
  }
}

const QuizScreen = ({ navigation }) => {
  const [missionsData, setMissionsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isQuizActive, setIsQuizActive] = useState(false)

  // 🎵 ESTADO PARA MANEJAR LA MÚSICA DE FONDO
  const [backgroundMusic, setBackgroundMusic] = useState<Audio.Sound | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterName>("Qhapaq")

  // 🎵 FUNCIÓN PARA REPRODUCIR MÚSICA DE FONDO
  const playBackgroundMusic = async (characterName: CharacterName) => {
    try {
      console.log(`🎵 Iniciando música de fondo para ${characterName}`)

      if (backgroundMusic) {
        console.log("🛑 Deteniendo música anterior")
        await backgroundMusic.stopAsync()
        await backgroundMusic.unloadAsync()
        setBackgroundMusic(null)
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      })

      const musicSource = characterMusic[characterName]
      const { sound } = await Audio.Sound.createAsync(musicSource, {
        shouldPlay: true,
        isLooping: true,
        volume: 0.6,
      })

      setBackgroundMusic(sound)
      console.log(`✅ Música de ${characterName} iniciada exitosamente`)
    } catch (error) {
      console.error("❌ Error al reproducir música de fondo:", error)
    }
  }

  // 🎵 FUNCIÓN PARA DETENER MÚSICA DE FONDO
  const stopBackgroundMusic = async () => {
    try {
      if (backgroundMusic) {
        console.log("🛑 Deteniendo música de fondo")
        await backgroundMusic.stopAsync()
        await backgroundMusic.unloadAsync()
        setBackgroundMusic(null)
        console.log("✅ Música detenida exitosamente")
      }
    } catch (error) {
      console.error("❌ Error al detener música de fondo:", error)
    }
  }

  // 🏠 NAVEGACIÓN AL STUDENT DASHBOARD AL PRESIONAR BACK
  useFocusEffect(
    useCallback(() => {
      console.log("🎯 QuizScreen ENFOCADO - Activando quiz y configurando navegación back")
      setIsQuizActive(true)

      const onBackPress = () => {
        console.log("🏠 BOTÓN BACK PRESIONADO - Navegando a StudentDashboard")

        Alert.alert(
          "¿Salir del Quiz?",
          "Si sales ahora, perderás todo tu progreso. ¿Estás seguro?",
          [
            {
              text: "Cancelar",
              onPress: () => {
                console.log("❌ Usuario canceló salir del quiz")
              },
              style: "cancel",
            },
            {
              text: "Salir",
              onPress: async () => {
                console.log("✅ Usuario confirmó salir del quiz - Navegando a StudentDashboard")

                await stopBackgroundMusic()

                setIsQuizActive(false)
                navigation.navigate("StudentDashboard")
              },
              style: "destructive",
            },
          ],
          { cancelable: false },
        )

        return true
      }

      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress)

      if (navigation.setOptions) {
        navigation.setOptions({
          gestureEnabled: false,
          headerLeft: () => null,
          headerBackVisible: false,
          headerBackButtonMenuEnabled: false,
          headerBackTitleVisible: false,
        })
      }

      return () => {
        console.log("🎯 QuizScreen DESENFOCADO - Desactivando quiz y restaurando navegación")

        stopBackgroundMusic()

        setIsQuizActive(false)

        backHandler.remove()

        if (navigation.setOptions) {
          navigation.setOptions({
            gestureEnabled: true,
            headerLeft: undefined,
            headerBackVisible: true,
            headerBackButtonMenuEnabled: true,
            headerBackTitleVisible: true,
          })
        }
      }
    }, [navigation, backgroundMusic]),
  )

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    return () => {
      console.log("🧹 QuizScreen DESMONTÁNDOSE - Limpieza final")

      stopBackgroundMusic()

      setIsQuizActive(false)
    }
  }, [backgroundMusic])

  const loadQuestionsAndBuildMissions = async () => {
    try {
      setLoading(true)

      const characterNameRaw = await AsyncStorage.getItem("selectedCharacterName")
      const villainNameRaw = await AsyncStorage.getItem("selectedVillainName")

      const characterName = (characterNameRaw || "Qhapaq") as CharacterName
      const villainName = (villainNameRaw || "Corporatus") as VillainName

      console.log("Personaje seleccionado:", characterName)
      console.log("Villano seleccionado:", villainName)

      setSelectedCharacter(characterName)

      const roomId = await AsyncStorage.getItem("roomId")
      if (!roomId) {
        await AsyncStorage.setItem("roomId", "7642a6c9-9978-43b8-b0c6-a0d2e15d7629")
      }

      const missions = await buildMissionsFromAPI(characterName, villainName)
      console.log(`🎮 Se crearon ${missions.length} misiones exitosamente`)
      setMissionsData(missions)

      await playBackgroundMusic(characterName)
    } catch (error: any) {
      console.error("Error cargando preguntas:", error)

      // 🔐 DETECTAR ERRORES DE AUTENTICACIÓN
      const isAuthError =
        error.message?.includes("Token de autenticación inválido") ||
        error.message?.includes("inicia sesión nuevamente") ||
        error.message?.includes("No se encontró el token del estudiante")

      if (isAuthError) {
        console.log("🚨 ERROR DE AUTENTICACIÓN DETECTADO - Redirigiendo al login")

        Alert.alert(
          "Sesión Expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          [
            {
              text: "Ir al Login",
              onPress: async () => {
                console.log("🔐 Navegando al login por error de autenticación")

                // 🧹 LIMPIAR DATOS DE USUARIO
                const keysToRemove = [
                  "userRole",
                  "userInfo",
                  "authMethod",
                  "userToken",
                  "studentToken",
                  "isAuthenticated",
                  "selectedCharacterName",
                  "selectedVillainName",
                  "roomId",
                  "quizResults",
                ]

                try {
                  await AsyncStorage.multiRemove(keysToRemove)
                  console.log("✅ Datos de usuario limpiados")
                } catch (cleanupError) {
                  console.error("❌ Error limpiando datos:", cleanupError)
                }

                // 🛑 DETENER MÚSICA
                await stopBackgroundMusic()
                setIsQuizActive(false)

                // 🚀 NAVEGAR AL LOGIN Y RESETEAR STACK
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  }),
                )
              },
            },
          ],
          { cancelable: false },
        )
      } else {
        // 🔄 ERRORES NORMALES - MOSTRAR OPCIONES DE REINTENTAR
        Alert.alert("Error al cargar preguntas", error.message || "No se pudieron cargar las preguntas", [
          {
            text: "Reintentar",
            onPress: () => loadQuestionsAndBuildMissions(),
          },
          {
            text: "Volver",
            onPress: async () => {
              await stopBackgroundMusic()
              setIsQuizActive(false)
              navigation.navigate("StudentDashboard")
            },
          },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadQuestionsAndBuildMissionsWrapper = async () => {
      try {
        setLoading(true)

        const characterNameRaw = await AsyncStorage.getItem("selectedCharacterName")
        const villainNameRaw = await AsyncStorage.getItem("selectedVillainName")

        const characterName = (characterNameRaw || "Qhapaq") as CharacterName
        const villainName = (villainNameRaw || "Corporatus") as VillainName

        console.log("Personaje seleccionado:", characterName)
        console.log("Villano seleccionado:", villainName)

        setSelectedCharacter(characterName)

        const roomId = await AsyncStorage.getItem("roomId")
        if (!roomId) {
          await AsyncStorage.setItem("roomId", "7642a6c9-9978-43b8-b0c6-a0d2e15d7629")
        }

        const missions = await buildMissionsFromAPI(characterName, villainName)
        console.log(`🎮 Se crearon ${missions.length} misiones exitosamente`)
        setMissionsData(missions)

        await playBackgroundMusic(characterName)
      } catch (error: any) {
        console.error("Error cargando preguntas:", error)

        Alert.alert("Error al cargar preguntas", error.message || "No se pudieron cargar las preguntas", [
          {
            text: "Reintentar",
            onPress: () => loadQuestionsAndBuildMissions(),
          },
          {
            text: "Volver",
            onPress: async () => {
              await stopBackgroundMusic()

              setIsQuizActive(false)
              navigation.navigate("StudentDashboard")
            },
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    if (isQuizActive) {
      loadQuestionsAndBuildMissions()
    }
  }, [isQuizActive])

  const handleComplete = async (
    score: number,
    totalMissions: number,
    aiScores?: number[],
    responseTimes?: number[],
    correctAnswers?: number,
    incorrectAnswers?: number,
  ) => {
    console.log(`🏁 Quiz completado: ${score}/${totalMissions}`)
    console.log(`📊 Respuestas correctas: ${correctAnswers}, incorrectas: ${incorrectAnswers}`)

    await stopBackgroundMusic()

    setIsQuizActive(false)

    navigation.navigate("Results", {
      score,
      totalMissions,
      aiScores,
      responseTimes,
      correctAnswers,
      incorrectAnswers,
    })
  }

  if (loading || !isQuizActive) {
    return <View style={styles.container} />
  }

  return (
    <View style={styles.container}>
      <MissionManager missions={missionsData} onComplete={handleComplete} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

export default QuizScreen