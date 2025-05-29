"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, Alert } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"
import { MissionManager } from "../ComponentesQuiz/mission-manager"

type CharacterName = "Qhapaq" | "Amaru" | "Killa"
type VillainName = "Corporatus" | "Toxicus" | "Shadowman"

// Tipos para las preguntas del API
type ApiQuestion = {
  id: string
  text: string
  type: "MULTIPLE_CHOICE_SINGLE" | "MULTIPLE_CHOICE_MULTIPLE" | "OPEN_ENDED"
  config: {
    options?: string[]
    correct_option?: number // Índice de la opción correcta (si existe)
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

// Imágenes del villano para cada misión (3 por villano, se repetirán según sea necesario)
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

// Imágenes incorrectas para cada villano y misión (3 por villano, se repetirán según sea necesario)
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

// Fondos y correctImages por personaje (3 por personaje, se repetirán según sea necesario)
const characterAssets: Record<CharacterName, { backgroundImages: any[]; correctImages: any[] }> = {
  Qhapaq: {
    backgroundImages: [
      require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
    ],
    correctImages: [
      require("../../assets/images/chaman.png"),
      require("../../assets/images/chaman.png"),
      require("../../assets/images/chaman.png"),
    ],
  },
  Amaru: {
    backgroundImages: [
      require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),
    ],
    correctImages: [
      require("../../assets/Personajes/Amaru1.png"),
      require("../../assets/Personajes/Amaru1.png"),
      require("../../assets/Personajes/Amaru1.png"),
    ],
  },
  Killa: {
    backgroundImages: [
      require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
    ],
    correctImages: [
      require("../../assets/Personajes/Guerrera.png"),
      require("../../assets/Personajes/Guerrera.png"),
      require("../../assets/Personajes/Guerrera.png"),
    ],
  },
}

// Función para obtener preguntas del API
const fetchQuestionsFromAPI = async (roomId: string): Promise<ApiQuestion[]> => {
  try {
    console.log("🔍 Obteniendo preguntas del API para room:", roomId)

    // Obtener el token del estudiante del localStorage
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

    // 🔍 LOGS DETALLADOS DE LA RESPUESTA
    console.log("=".repeat(50))
    console.log("📡 RESPUESTA COMPLETA DEL ENDPOINT:")
    console.log("=".repeat(50))
    console.log("Status:", response.status)
    console.log("Headers:", JSON.stringify(response.headers, null, 2))
    console.log("Data completa:", JSON.stringify(response.data, null, 2))
    console.log("=".repeat(50))

    if (response.data.success && response.data.data) {
      console.log(`📚 Se obtuvieron ${response.data.data.length} preguntas`)

      // 🔍 LOG DETALLADO DE CADA PREGUNTA
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

    // 🔍 LOG DETALLADO DEL ERROR
    if (error.response) {
      console.log("=".repeat(50))
      console.log("❌ ERROR DE RESPUESTA:")
      console.log("=".repeat(50))
      console.error("- Status:", error.response.status)
      console.error("- Status Text:", error.response.statusText)
      console.error("- Headers:", JSON.stringify(error.response.headers, null, 2))
      console.error("- Data:", JSON.stringify(error.response.data, null, 2))
      console.log("=".repeat(50))

      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error("Token de autenticación inválido. Por favor, inicia sesión nuevamente.")
      }

      throw new Error(error.response.data?.message || `Error del servidor: ${error.response.status}`)
    } else if (error.request) {
      console.log("=".repeat(50))
      console.log("❌ ERROR DE REQUEST:")
      console.log("=".repeat(50))
      console.error("Request:", error.request)
      console.log("=".repeat(50))
      throw new Error("No se pudo conectar con el servidor")
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
  const charImgs = characterAssets[characterName].correctImages
  const vilImgs = villainCharacterImages[villainName]
  const incorrectImgs = villainIncorrectImages[villainName]

  try {
    // Obtener room_id del localStorage
    const roomId = await AsyncStorage.getItem("roomId")

    if (!roomId) {
      throw new Error("No se encontró el Room ID")
    }

    console.log("🏠 Room ID obtenido del localStorage:", roomId)

    // Obtener preguntas del API
    const apiQuestions = await fetchQuestionsFromAPI(roomId)

    if (apiQuestions.length === 0) {
      throw new Error("No se encontraron preguntas para este room")
    }

    // 🔥 USAR TODAS LAS PREGUNTAS, NO SOLO 3
    console.log("🎯 PROCESANDO TODAS LAS PREGUNTAS PARA MISIONES:")
    console.log(`- Total de preguntas recibidas: ${apiQuestions.length}`)
    console.log(`- Se crearán ${apiQuestions.length} misiones`)

    return apiQuestions.map((apiQuestion, index) => {
      console.log(`\n🔄 PROCESANDO PREGUNTA ${index + 1} de ${apiQuestions.length}:`)
      console.log("- Tipo original:", apiQuestion.type)
      console.log("- Config original:", JSON.stringify(apiQuestion.config, null, 2))

      // Preparar opciones según el tipo de pregunta
      let options = []

      if (apiQuestion.type === "OPEN_ENDED") {
        // Para preguntas abiertas, NO crear opciones - dejar array vacío
        options = []
        console.log("✏️ PREGUNTA ABIERTA - NO se crean opciones")
        console.log("- Tipo de pregunta:", apiQuestion.type)
        console.log("- Config de la pregunta:", JSON.stringify(apiQuestion.config, null, 2))
      } else if (apiQuestion.type === "MULTIPLE_CHOICE_SINGLE" && apiQuestion.config.options) {
        // Para preguntas de opción múltiple con respuesta única
        const correctOptionIndex =
          apiQuestion.config.correct_option !== undefined ? apiQuestion.config.correct_option : 0

        console.log("- Opción correcta (índice):", correctOptionIndex)
        console.log("- Opciones disponibles:", apiQuestion.config.options)

        // Soportar hasta 5 opciones (A, B, C, D, E)
        options = apiQuestion.config.options.slice(0, 5).map((optionText, optIndex) => ({
          id: String.fromCharCode(65 + optIndex), // A, B, C, D, E
          text: optionText,
          isCorrect: optIndex === correctOptionIndex,
        }))

        console.log(
          "- Opciones procesadas:",
          options.map((o) => `${o.id}: ${o.text} (${o.isCorrect ? "CORRECTA" : "incorrecta"})`),
        )
      } else if (apiQuestion.type === "MULTIPLE_CHOICE_MULTIPLE" && apiQuestion.config.options) {
        // Para preguntas de opción múltiple con múltiples respuestas correctas
        const correctOptionIndex = 0

        console.log("- Tipo de pregunta con múltiples respuestas correctas")
        console.log("- Tratando como pregunta de opción única para compatibilidad")
        console.log("- Opciones disponibles:", apiQuestion.config.options)

        // Convertimos a formato de opción única para mantener compatibilidad
        options = apiQuestion.config.options.slice(0, 5).map((optionText, optIndex) => ({
          id: String.fromCharCode(65 + optIndex), // A, B, C, D, E
          text: optionText,
          isCorrect: optIndex === correctOptionIndex, // Asumimos primera opción como correcta
        }))

        console.log(
          "- Opciones procesadas:",
          options.map((o) => `${o.id}: ${o.text} (${o.isCorrect ? "CORRECTA" : "incorrecta"})`),
        )
      } else {
        // Si el tipo no es reconocido, tratamos como pregunta abierta por defecto
        console.log("- Tipo de pregunta no reconocido:", apiQuestion.type)
        console.log("- Tratando como pregunta abierta por defecto")
        options = []
      }

      console.log(`✅ Pregunta ${index + 1} procesada exitosamente`)

      // Función para obtener imagen con índice cíclico
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

      // Generar feedback personalizado basado en el tipo de pregunta
      const getFeedback = () => {
        if (apiQuestion.type === "MULTIPLE_CHOICE_SINGLE") {
          return {
            correctImage: getImageByIndex(assets.correctImages, index),
            incorrectImage: getImageByIndex(incorrectImgs, index),
            correctBackground: getImageByIndex(assets.backgroundImages, index),
            incorrectBackground: getImageByIndex(assets.backgroundImages, index),
            correctDescription: "¡Excelente! Has respondido correctamente.",
            incorrectDescription: "No te preocupes, sigue intentando. ¡Puedes hacerlo mejor!",
          }
        } else {
          // Para preguntas abiertas, siempre mostramos feedback positivo
          return {
            correctImage: getImageByIndex(assets.correctImages, index),
            incorrectImage: getImageByIndex(assets.correctImages, index), // Usamos la misma imagen
            correctBackground: getImageByIndex(assets.backgroundImages, index),
            incorrectBackground: getImageByIndex(assets.backgroundImages, index),
            correctDescription: "¡Gracias por tu respuesta! Continuemos con la siguiente pregunta.",
            incorrectDescription: "¡Gracias por tu respuesta! Continuemos con la siguiente pregunta.",
          }
        }
      }

      return {
        id: apiQuestion.id, // Usar el ID real de la pregunta para el endpoint de feedback
        missionNumber: index + 1,
        backgroundImage: getImageByIndex(assets.backgroundImages, index),
        villainImage: getImageByIndex(vilImgs, index),
        characterImage: getImageByIndex(charImgs, index),
        question: apiQuestion.text,
        questionType: apiQuestion.type, // 🔥 USAR DIRECTAMENTE EL TIPO DE LA API
        options: options, // Array vacío para OPEN_ENDED, opciones reales para MULTIPLE_CHOICE
        feedback: getFeedback(),
        transition: {
          backgroundImage: getImageByIndex(assets.backgroundImages, index),
          image: getImageByIndex(vilImgs, index),
          title: getTransitionTitle(),
          description: getTransitionDescription(),
        },
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

  // 🎯 CONTROL DEL CICLO DE VIDA DEL QUIZ
  useFocusEffect(
    useCallback(() => {
      console.log("🎯 QuizScreen ENFOCADO - Activando quiz")
      setIsQuizActive(true)

      // Función de limpieza cuando se pierde el foco
      return () => {
        console.log("🎯 QuizScreen DESENFOCADO - Desactivando quiz")
        setIsQuizActive(false)
      }
    }, []),
  )

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    return () => {
      console.log("🧹 QuizScreen DESMONTÁNDOSE - Limpieza")
      setIsQuizActive(false)
    }
  }, [])

  useEffect(() => {
    const loadQuestionsAndBuildMissions = async () => {
      try {
        setLoading(true)

        const characterNameRaw = await AsyncStorage.getItem("selectedCharacterName")
        const villainNameRaw = await AsyncStorage.getItem("selectedVillainName")

        const characterName = (characterNameRaw || "Qhapaq") as CharacterName
        const villainName = (villainNameRaw || "Corporatus") as VillainName

        console.log("Personaje seleccionado:", characterName)
        console.log("Villano seleccionado:", villainName)

        // Guardar room_id en AsyncStorage para el endpoint de feedback
        const roomId = await AsyncStorage.getItem("roomId")
        if (!roomId) {
          // Si no existe, podrías obtenerlo de otro lugar o usar un valor por defecto
          await AsyncStorage.setItem("roomId", "7642a6c9-9978-43b8-b0c6-a0d2e15d7629")
        }

        // Obtener misiones con preguntas del API
        const missions = await buildMissionsFromAPI(characterName, villainName)
        console.log(`🎮 Se crearon ${missions.length} misiones exitosamente`)
        setMissionsData(missions)

      } catch (error: any) {
        console.error("Error cargando preguntas:", error)

        // Mostrar alerta de error
        Alert.alert("Error al cargar preguntas", error.message || "No se pudieron cargar las preguntas", [
          {
            text: "Reintentar",
            onPress: () => loadQuestionsAndBuildMissions(),
          },
          {
            text: "Volver",
            onPress: () => {
              setIsQuizActive(false)
              navigation.goBack()
            },
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    // Solo cargar si el quiz está activo
    if (isQuizActive) {
      loadQuestionsAndBuildMissions()
    }
  }, [isQuizActive])

  const handleComplete = (score: number, totalMissions: number) => {
    console.log(`🏁 Quiz completado: ${score}/${totalMissions}`)

    // Desactivar quiz al completar
    setIsQuizActive(false)

    navigation.navigate("Results", { score, totalMissions })
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