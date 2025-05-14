import type React from "react"
import { View, Text, StyleSheet, FlatList } from "react-native"
import CharacterItem from "./CharacterItem"
import type { Character } from "./types"

interface CharacterListProps {
  characters: Character[]
  onSelectCharacter: (character: Character) => void
}

const CharacterList: React.FC<CharacterListProps> = ({ characters, onSelectCharacter }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personajes</Text>
      <View style={styles.divider} />
      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CharacterItem character={item} onPress={() => onSelectCharacter(item)} />}
        style={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#333333",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: "40%",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 8,
  },
  divider: {
    height: 2,
    backgroundColor: "#555555",
    width: 100,
    marginLeft: 16,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
  },
})

export default CharacterList
