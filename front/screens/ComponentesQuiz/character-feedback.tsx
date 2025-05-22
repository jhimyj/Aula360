import React from "react"
import { View, Text, Image, StyleSheet, ImageBackground } from "react-native"

// Tipo para imágenes (puede ser require local o URL)
type ImageSource = number | { uri: string }

type CharacterFeedbackProps = {
  isCorrect: boolean
  characterImage: ImageSource
  backgroundImage: ImageSource
}

export const CharacterFeedback: React.FC<CharacterFeedbackProps> = ({
  isCorrect,
  characterImage,
  backgroundImage,
}) => {
  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        <Image source={characterImage} style={styles.image} resizeMode="contain" />
        <Text style={[styles.text, isCorrect ? styles.correct : styles.incorrect]}>
          {isCorrect ? "¡Lo hiciste bien!" : "Oh no! Mis puntos de vida..."}
        </Text>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.2)", // opcional: leve overlay para contraste
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  correct: {
    color: "#2ecc40",
  },
  incorrect: {
    color: "#e74c3c",
  },
})
