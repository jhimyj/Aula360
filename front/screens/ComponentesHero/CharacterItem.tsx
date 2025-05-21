import type React from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native"
import type { Character } from "./types"

interface CharacterItemProps {
  character: Character
  onPress: () => void
}

const CharacterItem: React.FC<CharacterItemProps> = ({ character, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={character.image} style={styles.image} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{character.name}</Text>
        <View style={styles.descriptionContainer}>
          {/* Use the character's own image instead of hardcoded Qhapac.png */}
          <Image source={character.image} style={styles.eyeIcon} />
          <Text style={styles.description}>{character.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#444444",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
    height: 80,
  },
  imageContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333333",
  },
  image: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  infoContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  description: {
    color: "#CCCCCC",
    fontSize: 14,
  },
})

export default CharacterItem