"use client"

import React, { useState, useEffect } from "react"

import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MissionManager } from "../ComponentesQuiz/mission-manager"


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

const buildMissionsData = (characterName: CharacterName, villainName: VillainName) => {
  const assets = characterAssets[characterName]

  const charImgs = characterAssets[characterName].correctImages
  const vilImgs = villainCharacterImages[villainName]
  const incorrectImgs = villainIncorrectImages[villainName]

  if (villainName === "Corporatus") {
    return [
      {
        id: 1,
        missionNumber: 1,
        backgroundImage: assets.backgroundImages[0],
        villainImage: vilImgs[0],
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
          image: vilImgs[0],
          title: "Explorando la Naturaleza",
          description: "Prepárate para poner a prueba tus conocimientos sobre geografía.",
        },
      },
      {
        id: 2,
        missionNumber: 2,
        backgroundImage: assets.backgroundImages[1],
        villainImage: vilImgs[1],
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
          image: vilImgs[1],
          title: "Explorando el Espacio",
          description: "Vamos a descubrir los planetas del sistema solar.",
        },
      },
      {
        id: 3,
        missionNumber: 3,
        backgroundImage: assets.backgroundImages[2],
        villainImage: vilImgs[2],
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
            "La representa mucho más que rechazo a la modernización o solo una conexión espiritual.",
        },
        transition: {
          backgroundImage: assets.backgroundImages[2],
          image: vilImgs[2],
          title: "Explorando la Cultura Andina",
          description: "Conoce la cosmovisión andina y sus símbolos.",
        },
      },
    ]
  }

  if (villainName === "Toxicus") {
    return [
      {
        id: 1,
        missionNumber: 1,
        backgroundImage: assets.backgroundImages[0],
        villainImage: vilImgs[0],
        characterImage: charImgs[0],
        question: "¿Cuál es el gas más abundante en la atmósfera terrestre?",
        options: [
          { id: "A", text: "Oxígeno", isCorrect: false },
          { id: "B", text: "Nitrógeno", isCorrect: true },
          { id: "C", text: "Dióxido de carbono", isCorrect: false },
        ],
        feedback: {
          correctImage: assets.correctImages[0],
          incorrectImage: incorrectImgs[0],
          correctBackground: assets.backgroundImages[0],
          incorrectBackground: assets.backgroundImages[0],
          correctDescription: "¡Correcto! El nitrógeno compone aproximadamente el 78% de la atmósfera.",
          incorrectDescription: "El oxígeno es importante, pero el nitrógeno es el más abundante.",
        },
        transition: {
          backgroundImage: assets.backgroundImages[0],
          image: vilImgs[0],
          title: "Cuidando el Aire",
          description: "Aprende sobre la composición del aire que respiramos.",
        },
      },
      {
        id: 2,
        missionNumber: 2,
        backgroundImage: assets.backgroundImages[1],
        villainImage: vilImgs[1],
        characterImage: charImgs[1],
        question: "¿Qué sustancia es la principal causa de la lluvia ácida?",
        options: [
          { id: "A", text: "Dióxido de azufre", isCorrect: true },
          { id: "B", text: "Ozono", isCorrect: false },
          { id: "C", text: "Metano", isCorrect: false },
        ],
        feedback: {
          correctImage: assets.correctImages[1],
          incorrectImage: incorrectImgs[1],
          correctBackground: assets.backgroundImages[1],
          incorrectBackground: assets.backgroundImages[1],
          correctDescription: "¡Bien hecho! El dióxido de azufre es el principal responsable de la lluvia ácida.",
          incorrectDescription: "El ozono y el metano no causan lluvia ácida como el dióxido de azufre.",
        },
        transition: {
          backgroundImage: assets.backgroundImages[1],
          image: vilImgs[1],
          title: "Problemas Ambientales",
          description: "Descubre los efectos de la contaminación en el planeta.",
        },
      },
      {
        id: 3,
        missionNumber: 3,
        backgroundImage: assets.backgroundImages[2],
        villainImage: vilImgs[2],
        characterImage: charImgs[2],
        question: "¿Cuál es el principal efecto del plástico en los océanos?",
        options: [
          { id: "A", text: "Aumenta la temperatura del agua", isCorrect: false },
          { id: "B", text: "Contamina y daña la vida marina", isCorrect: true },
          { id: "C", text: "Produce más oxígeno", isCorrect: false },
        ],
        feedback: {
          correctImage: assets.correctImages[2],
          incorrectImage: incorrectImgs[2],
          correctBackground: assets.backgroundImages[2],
          incorrectBackground: assets.backgroundImages[2],
          correctDescription: "¡Exacto! El plástico contamina y afecta gravemente a la vida marina.",
          incorrectDescription: "El mayor problema es la contaminación y daño a los seres vivos del mar.",
        },
        transition: {
          backgroundImage: assets.backgroundImages[2],
          image: vilImgs[2],
          title: "Océanos en Peligro",
          description: "Reflexiona sobre el impacto del plástico en los océanos.",
        },
      },
    ]
  }

  if (villainName === "Shadowman") {
    return [
      {
        id: 1,
        missionNumber: 1,
        backgroundImage: assets.backgroundImages[0],
        villainImage: vilImgs[0],
        characterImage: charImgs[0],
        question: "¿Qué es la huella de carbono?",
        options: [
          { id: "A", text: "La marca que dejan los zapatos", isCorrect: false },
          { id: "B", text: "La cantidad de gases de efecto invernadero emitidos", isCorrect: true },
          { id: "C", text: "La sombra de una persona", isCorrect: false },
        ],
        feedback: {
          correctImage: assets.correctImages[0],
          incorrectImage: incorrectImgs[0],
          correctBackground: assets.backgroundImages[0],
          incorrectBackground: assets.backgroundImages[0],
          correctDescription: "¡Correcto! Es la cantidad de gases de efecto invernadero que emitimos.",
          incorrectDescription: "No es una marca física, sino una medida de contaminación.",
        },
        transition: {
          backgroundImage: assets.backgroundImages[0],
          image: vilImgs[0],
          title: "Sombra Ambiental",
          description: "Aprende sobre el impacto de nuestras acciones en el planeta.",
        },
      },
      {
        id: 2,
        missionNumber: 2,
        backgroundImage: assets.backgroundImages[1],
        villainImage: vilImgs[1],
        characterImage: charImgs[1],
        question: "¿Qué acción ayuda a reducir la huella de carbono?",
        options: [
          { id: "A", text: "Usar bicicleta", isCorrect: true },
          { id: "B", text: "Dejar luces encendidas", isCorrect: false },
          { id: "C", text: "Consumir más plástico", isCorrect: false },
        ],
        feedback: {
          correctImage: assets.correctImages[1],
          incorrectImage: incorrectImgs[1],
          correctBackground: assets.backgroundImages[1],
          incorrectBackground: assets.backgroundImages[1],
          correctDescription: "¡Bien! Usar bicicleta reduce las emisiones de gases contaminantes.",
          incorrectDescription: "Dejar luces encendidas y consumir plástico aumentan la huella de carbono.",
        },
        transition: {
          backgroundImage: assets.backgroundImages[1],
          image: vilImgs[1],
          title: "Acciones Positivas",
          description: "Descubre cómo puedes ayudar al medio ambiente.",
        },
      },
      {
        id: 3,
        missionNumber: 3,
        backgroundImage: assets.backgroundImages[2],
        villainImage: vilImgs[2],
        characterImage: charImgs[2],
        question: "¿Qué recurso es fundamental para la vida y debe ser cuidado?",
        options: [
          { id: "A", text: "Agua", isCorrect: true },
          { id: "B", text: "Petróleo", isCorrect: false },
          { id: "C", text: "Oro", isCorrect: false },
        ],
        feedback: {
          correctImage: assets.correctImages[2],
          incorrectImage: incorrectImgs[2],
          correctBackground: assets.backgroundImages[2],
          incorrectBackground: assets.backgroundImages[2],
          correctDescription: "¡Exacto! El agua es esencial para la vida y debemos protegerla.",
          incorrectDescription: "El agua es más importante para la vida que el oro o el petróleo.",
        },
        transition: {
          backgroundImage: assets.backgroundImages[2],
          image: vilImgs[2],
          title: "Cuidando el Agua",
          description: "Reflexiona sobre la importancia del agua en nuestras vidas.",
        },
      },
    ]
  }

  // fallback (no debería ocurrir)
  return []

}

const QuizScreen = ({ navigation }) => {
  const [missionsData, setMissionsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCharacterAndVillain = async () => {
      try {
        const characterNameRaw = await AsyncStorage.getItem("selectedCharacterName")
        const villainNameRaw = await AsyncStorage.getItem("selectedVillainName")


        const characterName = characterNameRaw; // (characterNameRaw ?? "Qhapaq") as CharacterName
        const villainName = villainNameRaw; //(villainNameRaw ?? "Corporatus") as VillainName


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
