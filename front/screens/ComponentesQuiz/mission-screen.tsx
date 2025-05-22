"use client"

import { useState, useEffect } from "react"
import { View, Text, Image, ImageBackground, TouchableOpacity, StyleSheet, Dimensions, Animated } from "react-native"

// Tipos para las propiedades
type OptionType = {
  id: string
  text: string
  isCorrect?: boolean
}

// Tipo para imágenes (puede ser require local o URL)
type ImageSource = number | { uri: string }

type MissionScreenProps = {
  missionNumber: number
  backgroundImage: ImageSource
  characterImage: ImageSource
  question: string
  options: OptionType[]
  onSubmit?: (selectedOption: string, isCorrect: boolean) => void
}

const { width } = Dimensions.get("window")

export const MissionScreen = ({
  missionNumber,
  backgroundImage,
  characterImage,
  question,
  options,
  onSubmit,
}: MissionScreenProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answered, setAnswered] = useState<boolean>(false)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleOptionPress = (optionId: string) => {
    if (!answered) {
      setSelectedOption(optionId)
    }
  }

  const handleSubmit = () => {
    if (selectedOption && !answered) {
      // Encontrar la opción seleccionada
      const selected = options.find((option) => option.id === selectedOption)
      const correct = selected?.isCorrect || false

      setIsCorrect(correct)
      setAnswered(true)

      if (onSubmit) {
        onSubmit(selectedOption, correct)
      }
    }
  }

  const getOptionStyle = (optionId: string, isOptionCorrect?: boolean) => {
    if (!answered) {
      return [styles.optionButton, selectedOption === optionId && styles.selectedOption]
    } else {
      if (optionId === selectedOption) {
        return [styles.optionButton, isOptionCorrect ? styles.correctOption : styles.incorrectOption]
      } else if (isOptionCorrect) {
        return [styles.optionButton, styles.correctOption]
      } else {
        return [styles.optionButton]
      }
    }
  }

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Título de la misión */}
        <Text style={styles.missionTitle}>Misión {missionNumber}</Text>

        {/* Imagen del personaje */}
        <Image source={characterImage} style={styles.characterImage} />

        {/* Contenedor de la pregunta */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question}</Text>

          {/* Opciones */}
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={getOptionStyle(option.id, option.isCorrect)}
                onPress={() => handleOptionPress(option.id)}
                disabled={answered}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    answered && option.isCorrect && styles.correctOptionText,
                    answered && selectedOption === option.id && !option.isCorrect && styles.incorrectOptionText,
                  ]}
                >
                  {option.id}.
                </Text>
                <Text
                  style={[
                    styles.optionText,
                    answered && option.isCorrect && styles.correctOptionText,
                    answered && selectedOption === option.id && !option.isCorrect && styles.incorrectOptionText,
                  ]}
                >
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón de enviar */}
        {!answered && (
          <TouchableOpacity
            style={[styles.submitButton, !selectedOption && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!selectedOption}
          >
            <Text style={styles.submitButtonText}>Enviar</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  missionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
    textShadowColor: "rgba(255, 255, 255, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  characterImage: {
    width: width * 0.5,
    height: width * 0.5,
    resizeMode: "contain",
    marginBottom: 20,
  },
  questionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 15,
    width: width * 0.85,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  optionsContainer: {
    width: "100%",
  },
  optionButton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    marginVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedOption: {
    backgroundColor: "#4CAF50",
  },
  correctOption: {
    backgroundColor: "#4CAF50",
  },
  incorrectOption: {
    backgroundColor: "#F44336",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    flex: 1,
  },
  correctOptionText: {
    color: "white",
  },
  incorrectOptionText: {
    color: "white",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#A5D6A7",
    opacity: 0.7,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
