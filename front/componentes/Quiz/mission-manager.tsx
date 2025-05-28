"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { MissionScreen } from "./mission-screen"
import { FeedbackScreen } from "./feedback-screen"
import { TransitionScreen } from "./transition-screen"
import { CharacterFeedback } from "./character-feedback"

// Tipo para imágenes (puede ser require local o URL)
type ImageSource = number | { uri: string }

// Tipo para una misión completa
type MissionType = {
  id: number
  missionNumber: number
  backgroundImage: ImageSource
  characterImage: ImageSource
  villainImage: ImageSource
  question: string
  questionType?: "MULTIPLE_CHOICE_SINGLE" | "OPEN_ENDED"
  options: {
    id: string
    text: string
    isCorrect: boolean
    isOpenEnded?: boolean
  }[]
  // Contenido para la pantalla de retroalimentación
  feedback: {
    correctImage: ImageSource
    incorrectImage: ImageSource
    correctBackground: ImageSource
    incorrectBackground: ImageSource
    correctDescription: string
    incorrectDescription: string
  }
  // Contenido para la pantalla de transición
  transition?: {
    backgroundImage: ImageSource
    image: ImageSource
    title: string
    description: string
  }
}

// Estados posibles de la misión
type MissionState = "QUESTION" | "FEEDBACK" | "TRANSITION"

type MissionManagerProps = {
  missions: MissionType[]
  onComplete?: (score: number, totalMissions: number) => void
}

export const MissionManager = ({ missions, onComplete }: MissionManagerProps) => {
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [missionState, setMissionState] = useState<MissionState>("QUESTION")
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [showCharacterFeedback, setShowCharacterFeedback] = useState(true)
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    if (missions.length === 0) {
      return
    }
  }, [missions])

  useEffect(() => {
    const currentMission = missions[currentMissionIndex]
    if (!currentMission) {
      return
    }
  }, [currentMissionIndex, missions])

  const handleSubmit = (selectedOption: string, isCorrect: boolean, userAnswer?: string) => {
    // Guardar la respuesta del usuario si es una pregunta abierta
    if (currentMissionIndex < missions.length) {
      const currentMission = missions[currentMissionIndex]
      if (currentMission.questionType === "OPEN_ENDED" && userAnswer) {
        setUserAnswers((prev) => ({
          ...prev,
          [currentMissionIndex]: userAnswer,
        }))
      }

      // Actualizar puntuación si la respuesta es correcta
      if (isCorrect) {
        setScore((prevScore) => prevScore + 1)
      }

      // Guardar si la respuesta fue correcta para la pantalla de retroalimentación
      setLastAnswerCorrect(isCorrect)
      setShowCharacterFeedback(true)
      setMissionState("FEEDBACK")
    }
  }

  useEffect(() => {
    if (missionState === "FEEDBACK" && showCharacterFeedback) {
      const timer = setTimeout(() => {
        setShowCharacterFeedback(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [missionState, showCharacterFeedback])

  const handleFeedbackContinue = () => {
    // Si es la última misión, llamar a onComplete
    if (currentMissionIndex >= missions.length - 1) {
      if (onComplete) {
        onComplete(score, missions.length)
      }
      return
    }

    // Verificar si hay información de transición disponible
    const nextMission = missions[currentMissionIndex + 1]
    if (nextMission && nextMission.transition) {
      // Cambiar al estado de transición
      setMissionState("TRANSITION")
    } else {
      // Si no hay información de transición, avanzar directamente a la siguiente misión
      setCurrentMissionIndex((prev) => prev + 1)
      setMissionState("QUESTION")
    }
  }

  const handleTransitionFinish = () => {
    // Avanzar a la siguiente misión
    setCurrentMissionIndex((prev) => prev + 1)

    // Volver al estado de pregunta
    setMissionState("QUESTION")
  }

  // Renderizar según el estado actual
  const currentMission = missions[currentMissionIndex]
  if (!currentMission) {
    return null
  }

  switch (missionState) {
    case "QUESTION":
      return (
        <View style={styles.container}>
          <MissionScreen
            missionNumber={currentMission.missionNumber}
            backgroundImage={currentMission.backgroundImage}
            characterImage={currentMission.villainImage}
            question={currentMission.question}
            questionType={currentMission.questionType}
            options={currentMission.options}
            onSubmit={handleSubmit}
          />
        </View>
      )

    case "FEEDBACK":
      // Verificar que exista el objeto feedback
      if (!currentMission.feedback) {
        console.error(`La misión ${currentMission.id} no tiene definido el objeto feedback`)
        // Avanzar a la siguiente misión o estado
        handleFeedbackContinue()
        return null
      }

      return (
        <View style={styles.container}>
          {showCharacterFeedback ? (
            <CharacterFeedback
              isCorrect={lastAnswerCorrect}
              characterImage={currentMission.characterImage}
              backgroundImage={currentMission.backgroundImage}
            />
          ) : (
            <FeedbackScreen
              isCorrect={lastAnswerCorrect}
              correctImage={currentMission.feedback.correctImage}
              incorrectImage={currentMission.feedback.incorrectImage}
              correctBackground={currentMission.feedback.correctBackground}
              incorrectBackground={currentMission.feedback.incorrectBackground}
              correctDescription={
                currentMission.questionType === "OPEN_ENDED"
                  ? "¡Gracias por tu respuesta! Continuemos con la siguiente pregunta."
                  : currentMission.feedback.correctDescription
              }
              incorrectDescription={
                currentMission.questionType === "OPEN_ENDED"
                  ? "¡Gracias por tu respuesta! Continuemos con la siguiente pregunta."
                  : currentMission.feedback.incorrectDescription
              }
              userAnswer={userAnswers[currentMissionIndex]}
              isOpenEnded={currentMission.questionType === "OPEN_ENDED"}
              onContinue={handleFeedbackContinue}
            />
          )}
        </View>
      )

    case "TRANSITION":
      // Si es la última misión, no mostrar transición
      if (currentMissionIndex >= missions.length - 1) {
        return null
      }

      const nextMission = missions[currentMissionIndex + 1]

      // Verificar que exista la siguiente misión y su objeto transition
      if (!nextMission || !nextMission.transition) {
        console.error(`La misión ${currentMissionIndex + 1} no tiene definido el objeto transition`)
        // Avanzar directamente a la siguiente misión
        handleTransitionFinish()
        return null
      }

      return (
        <View style={styles.container}>
          <TransitionScreen
            backgroundImage={nextMission.transition.backgroundImage}
            image={nextMission.transition.image}
            title={nextMission.transition.title}
            description={nextMission.transition.description}
            missionNumber={nextMission.missionNumber}
            onFinishTransition={handleTransitionFinish}
          />
        </View>
      )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
