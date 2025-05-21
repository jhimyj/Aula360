import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Dimensions, Platform } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import type { Character } from "./types"

type Props = {
  characters: Character[]
  onSelectCharacter: (character: Character) => void
  isTablet?: boolean
}

const CharacterList = ({ characters, onSelectCharacter, isTablet = false }: Props) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window")
  const isAndroid = Platform.OS === "android"
  
  // Calculate responsive sizes based on screen dimensions
  const getResponsiveSize = (size: number) => {
    const baseWidth = 375 // Base width reference
    return (screenWidth / baseWidth) * size
  }

  // Calculate item width based on screen size and device type
  const getItemWidth = () => {
    if (isTablet) {
      // Wider cards on tablets - better use of horizontal space
      return screenWidth * 0.30 // Increased from 0.28 to 0.30 for more text space
    }
    // More compact on phones
    return screenWidth * 0.28 // 28% of screen width on phones
  }
  
  // Calculate item height based on screen size and device type
  const getItemHeight = () => {
    if (isTablet) {
      // Shorter height on tablets
      return screenHeight * 0.16 // Increased from 0.15 to 0.16 for more text space
    }
    // Taller on phones relative to width (more square-ish)
    return getResponsiveSize(120)
  }
  
  // Calculate thumbnail size based on device type
  const getThumbnailSize = () => {
    if (isTablet) {
      // On tablets, make thumbnails wider but not as tall
      return {
        width: getResponsiveSize(55), // Slightly reduced from 60
        height: getResponsiveSize(45)
      }
    }
    // On phones, keep thumbnails more square
    const baseSize = 45
    return {
      width: getResponsiveSize(baseSize),
      height: getResponsiveSize(baseSize)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: getResponsiveSize(18) }]}>Personajes</Text>
      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          isTablet && styles.tabletListContent
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.characterItem, 
              { 
                width: getItemWidth(),
                marginHorizontal: getResponsiveSize(4)
              }
            ]}
            onPress={() => onSelectCharacter(item)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={item.background || ["#333", "#666"]}
              style={[
                styles.itemGradient,
                {
                  height: getItemHeight(),
                  padding: getResponsiveSize(8)
                },
                // For tablets, use a row layout instead of column
                isTablet && styles.tabletItemLayout
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image 
                source={item.image} 
                style={[
                  styles.thumbnail, 
                  {
                    width: getThumbnailSize().width,
                    height: getThumbnailSize().height,
                    marginBottom: isTablet ? 0 : getResponsiveSize(4),
                    marginRight: isTablet ? getResponsiveSize(10) : 0 // Increased from 8 to 10
                  }
                ]} 
                resizeMode="contain" 
              />
              <View style={[
                styles.textContainer,
                isTablet && styles.tabletTextContainer
              ]}>
                <Text 
                  style={[
                    styles.characterName,
                    isTablet ? styles.tabletCharacterName : { fontSize: getResponsiveSize(13) }
                  ]}
                  numberOfLines={1} // Ensure text doesn't wrap to multiple lines
                  ellipsizeMode="tail" // Add ellipsis if text is too long
                >
                  {item.name}
                </Text>
                <Text 
                  style={[
                    styles.characterClass,
                    isTablet ? styles.tabletCharacterClass : { fontSize: getResponsiveSize(10) }
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.class}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  title: {
    fontWeight: "bold",
    color: "#FFF",
    marginLeft: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  tabletListContent: {
    paddingHorizontal: 16,
  },
  characterItem: {
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  itemGradient: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  // For tablets, use a row layout instead of column
  tabletItemLayout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 12,
  },
  thumbnail: {
    marginBottom: 4,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  // For tablets, align text to the left
  tabletTextContainer: {
    alignItems: 'flex-start',
    flex: 1,
    width: '65%', // Limit width to prevent overflow
  },
  characterName: {
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  // Specific tablet text styles with fixed sizes
  tabletCharacterName: {
    fontSize: 13, // Fixed size for tablets
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "left",
    marginBottom: 2,
  },
  characterClass: {
    color: "#FFD700",
    textAlign: "center",
  },
  // Specific tablet class text style
  tabletCharacterClass: {
    fontSize: 11, // Fixed size for tablets
    color: "#FFD700",
    textAlign: "left",
  },
})

export default CharacterList