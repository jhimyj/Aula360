import { useState } from "react"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView, StyleSheet, View } from "react-native"
import ProfileHeader from "../ComponentesHero/ProfileHeader"
import CharacterDisplay from "../ComponentesHero/CharacterDisplay"
import CharacterList from "../ComponentesHero/CharacterList"
import type { Character } from "../ComponentesHero/types"

type CharacterWithSize = Character & {
  imageSize?: {
    width: number
    height: number
  }
}

export default function App() {
  const characters: CharacterWithSize[] = [
    {
      id: "1",
      name: "Qhapaq",
      image: require("../../assets/Personajes/Qhapac.png"),
      description: "Un Inca muy sabio y hábil",
      background: ["#8E44AD", "#9B59B6"],
      stats: {
        strength: 70,
        wisdom: 95,
        agility: 65,
        defense: 80
      },
      imageSize: { width: 200, height: 250 },
      class: "Sabio" // Added class property for Qhapaq
    },
    {
      id: "2",
      name: "Amaru",
      image: require("../../assets/Personajes/Amaru.png"),
      description: "Una persona muy fuerte",
      background: ["#E74C3C", "#C0392B"],
      stats: {
        strength: 95,
        wisdom: 60,
        agility: 85,
        defense: 75
      },
      imageSize: { width: 150, height: 500 },
      class: "Aventurero" // Added class property for Amaru
    },
    {
      id: "3",
      name: "Killa",
      image: require("../../assets/Personajes/Killa.png"),
      description: "Una guerrera",
      background: ["#3498DB", "#2980B9"],
      stats: {
        strength: 75,
        wisdom: 80,
        agility: 90,
        defense: 65
      },
      imageSize: { width: 200, height: 150 },
      class: "Guerrera" // Added class property for Killa
    },
  ]

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterWithSize>(characters[0])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <CharacterDisplay
          character={selectedCharacter}
          imageSize={selectedCharacter.imageSize}
        />
        <CharacterList
          characters={characters}
          onSelectCharacter={setSelectedCharacter}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  content: {
    flex: 1,
  },
})