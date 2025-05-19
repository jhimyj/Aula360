"use client"

import React, { useState, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MissionManager } from "../../componentes/Quiz/mission-manager"

type CharacterName = "Qhapaq" | "Amaru" | "Killa"
type VillainName = "Corporatus" | "Toxicus" | "Shadowman"

// Imágenes del villano para cada misión (3 por villano)
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

// Imágenes incorrectas para cada villano y misión (3 por villano)
const villainIncorrectImages: Record<VillainName, any[]> = {
  Corporatus: [
    // C:\Users\semin\OneDrive\Escritorio\Aula360REPOORIGINAL\Aula360\front\assets\PersonajesQuiz\Corporatus\CoporatusLevel-2.png
    require("../../assets/PersonajesQuiz/Corporatus/CorporatusLevel-1.png"),
    require("../../assets/PersonajesQuiz/Corporatus/CorporatusLevel-2.png"),

    require("../../assets/villanosBattle/Corporatus.png"),
  ],
  Toxicus: [
    require("../../assets/villanosBattle/Corporatus.png"),
    require("../../assets/villanosBattle/Corporatus.png"),
    require("../../assets/villanosBattle/Corporatus.png"),
  ],
  Shadowman: [
    require("../../assets/villanosBattle/Corporatus.png"),
    require("../../assets/villanosBattle/Corporatus.png"),
    require("../../assets/villanosBattle/Corporatus.png"),
  ],
}

// Fondos y correctImages por personaje (3 por personaje)
const characterAssets: Record<
  CharacterName,
  { backgroundImages: any[]; correctImages: any[] }
> = {
  Qhapaq: {
    backgroundImages: [
        // C:\Users\semin\OneDrive\Escritorio\Aula360REPOORIGINAL\Aula360\front\assets\fondoQuiz\FondoQuiz-Qhapaq.png
      require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Qhapaq.png"),
    ],
    correctImages: [
      require("../../assets/villanosBattle/Corporatus.png"),
      require("../../assets/villanosBattle/Corporatus.png"),
      require("../../assets/villanosBattle/Corporatus.png"),
    ],
  },
  Amaru: {
    backgroundImages: [
      require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Amaru.png"),


    ],
    correctImages: [
      require("../../assets/villanosBattle/Corporatus.png"),
      require("../../assets/villanosBattle/Corporatus.png"),
      require("../../assets/villanosBattle/Corporatus.png"),
    ],
  },
  Killa: {
    backgroundImages: [
      require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
      require("../../assets/fondoQuiz/FondoQuiz-Killa.png"),
    ],
    correctImages: [
      require("../../assets/villanosBattle/Corporatus.png"),
      require("../../assets/villanosBattle/Corporatus.png"),
      require("../../assets/villanosBattle/Corporatus.png"),
    ],
  },
}

const buildMissionsData = (characterName: CharacterName, villainName: VillainName) => {
  const assets = characterAssets[characterName]
  const charImgs = villainCharacterImages[villainName]
  const incorrectImgs = villainIncorrectImages[villainName]

  return [
    {
      id: 1,
      missionNumber: 1,
      backgroundImage: assets.backgroundImages[0],
      characterImage: charImgs[0],
      question: "¿Cuál es el nombre del río más largo del mundo?",
      options: [
        { id: "A", text: "Nilo", isCorrect: false },
        { id: "B", text: "Amazonas", isCorrect: true },
        { id: "C", text: "Misisipi", isCorrect: false },
      ],
      feedback: {
        correctImage: assets.correctImages[0],
        incorrectImage: incorrectImgs[0],
        correctBackground: assets.backgroundImages[0],
        incorrectBackground: assets.backgroundImages[0],
        correctDescription:
          "¡Excelente! El río Amazonas es el río más largo del mundo con aproximadamente 6,800 km de longitud.",
        incorrectDescription:
          "Aunque por mucho tiempo se pensó que era el Nilo, el Amazonas es el río más largo del mundo.",
      },
      transition: {
        backgroundImage: assets.backgroundImages[0],
        image: charImgs[0],
        title: "Explorando la Naturaleza",
        description: "Prepárate para poner a prueba tus conocimientos sobre geografía.",
      },
    },
    {
      id: 2,
      missionNumber: 2,
      backgroundImage: assets.backgroundImages[1],
      characterImage: charImgs[1],
      question: "¿Cuál es el planeta más grande del sistema solar?",
      options: [
        { id: "A", text: "Tierra", isCorrect: false },
        { id: "B", text: "Saturno", isCorrect: false },
        { id: "C", text: "Júpiter", isCorrect: true },
      ],
      feedback: {
        correctImage: assets.correctImages[1],
        incorrectImage: incorrectImgs[1],
        correctBackground: assets.backgroundImages[1],
        incorrectBackground: assets.backgroundImages[1],
        correctDescription: "¡Correcto! Júpiter es el planeta más grande del sistema solar.",
        incorrectDescription:
          "Saturno es grande, pero Júpiter es el planeta más grande del sistema solar.",
      },
      transition: {
        backgroundImage: assets.backgroundImages[1],
        image: charImgs[1],
        title: "Explorando el Espacio",
        description: "Vamos a descubrir los planetas del sistema solar.",
      },
    },
    {
      id: 3,
      missionNumber: 3,
      backgroundImage: assets.backgroundImages[2],
      characterImage: charImgs[2],
      question:
        '¿Qué simboliza la "Pachamama" (madre tierra) en las obras de José María Arguedas?',
      options: [
        { id: "A", text: "Conexión espiritual con los dioses", isCorrect: false },
        { id: "B", text: "Rechazo a la modernización", isCorrect: false },
        { id: "C", text: "Relación entre hombre y naturaleza", isCorrect: true },
      ],
      feedback: {
        correctImage: assets.correctImages[2],
        incorrectImage: incorrectImgs[2],
        correctBackground: assets.backgroundImages[2],
        incorrectBackground: assets.backgroundImages[2],
        correctDescription: "¡Exacto! La Pachamama simboliza la relación entre el hombre y la naturaleza.",
        incorrectDescription:
          "La Pachamama representa mucho más que rechazo a la modernización o solo una conexión espiritual.",
      },
      transition: {
        backgroundImage: assets.backgroundImages[2],
        image: charImgs[2],
        title: "Explorando la Cultura Andina",
        description: "Conoce la cosmovisión andina y sus símbolos.",
      },
    },
  ]
}

const QuizScreen = ({ navigation }) => {
  const [missionsData, setMissionsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCharacterAndVillain = async () => {
      try {
        const characterNameRaw = await AsyncStorage.getItem("selectedCharacterName")
        const villainNameRaw = await AsyncStorage.getItem("selectedVillainName")

        const characterName = (characterNameRaw ?? "Qhapaq") as CharacterName
        const villainName = (villainNameRaw ?? "Corporatus") as VillainName

        console.log("Personaje seleccionado:", characterName)
        console.log("Villano seleccionado:", villainName)

        const missions = buildMissionsData(characterName, villainName)
        setMissionsData(missions)
      } catch (error) {
        console.error("Error cargando personaje o villano:", error)
        const missions = buildMissionsData("Qhapaq", "Corporatus")
        setMissionsData(missions)
      } finally {
        setLoading(false)
      }
    }
    loadCharacterAndVillain()
  }, [])

  const handleComplete = (score: number, totalMissions: number) => {
    navigation.navigate("Results", { score, totalMissions })
  }

  if (loading) {
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
