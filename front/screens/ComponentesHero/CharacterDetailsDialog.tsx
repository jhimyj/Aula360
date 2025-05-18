"use client"

import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, ScrollView, Platform } from "react-native"
import { BlurView } from "expo-blur"
import { Feather } from "@expo/vector-icons"
import { Video } from "expo-av"
import { LinearGradient } from "expo-linear-gradient"
import type { Character } from "./types"
import { useMemo } from "react"

const { width, height } = Dimensions.get("window")

interface CharacterDetailsDialogProps {
  character: Character
  visible: boolean
  onClose: () => void
}

const CharacterDetailsDialog: React.FC<CharacterDetailsDialogProps> = ({ character, visible, onClose }) => {
  // Calculate if device is a tablet based on screen size
  const isTablet = useMemo(() => {
    const screenSize = Math.sqrt(width * width + height * height) / (Platform.OS === "ios" ? 163 : 160)
    return screenSize >= 7 // Common threshold for tablets
  }, [])

  // Calculate optimal dialog dimensions based on device type
  const dialogWidth = isTablet ? width * 0.7 : width * 0.9
  const dialogMaxHeight = isTablet ? height * 0.8 : height * 0.85

  // Calculate optimal video height based on device type and orientation
  const videoHeight = isTablet ? 350 : width > height ? 200 : 250

  // Get character description or use a default enhanced description based on character name
  const getEnhancedDescription = () => {
    if (character.name === "Qhapaq") {
      return "Qhapaq es un sabio chamán inca con profundos conocimientos de medicina natural y rituales ancestrales. Su sabiduría le permite conectar con los espíritus de la naturaleza y utilizar su poder para sanar y proteger a su pueblo. Domina el arte de la herbología y puede predecir eventos futuros a través de sus visiones místicas."
    } else if (character.name === "Amaru") {
      return "Amaru es un poderoso guerrero con la fuerza de las montañas y el espíritu indomable del cóndor. Su valentía en batalla es legendaria, y su lealtad hacia sus compañeros es inquebrantable. Entrenado desde niño en las artes marciales incas, puede derrotar a enemigos que lo superan en número gracias a su astucia y fuerza sobrenatural."
    } else if (character.name === "Killa") {
      return "Killa, cuyo nombre significa 'Luna' en quechua, es una ágil y astuta guerrera. Su destreza con el arco y la espada la convierten en una formidable aliada en cualquier batalla. Bendecida por la diosa lunar, sus poderes se intensifican durante la noche, permitiéndole moverse como una sombra y atacar con precisión letal."
    } else {
      return (
        character.description ||
        "Un valiente héroe del imperio inca, dotado de habilidades extraordinarias y un corazón noble."
      )
    }
  }

  // Get the appropriate video source based on character name
  const getVideoSource = () => {
    if (character.name === "Qhapaq") {
      return require("../../assets/videos/Mago-intro.mp4")
    } else if (character.name === "Amaru") {
      return require("../../assets/videos/Amaru-intro.mp4")
    } else if (character.name === "Killa") {
      return require("../../assets/videos/Killa-intro.mp4")
    } else {
      // Default video if character doesn't match
      return require("../../assets/videos/Killa-intro.mp4")
    }
  }

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { width: dialogWidth, maxHeight: dialogMaxHeight }]}>
          <LinearGradient
            colors={character.background || ["#6A3093", "#A044FF"]}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{character.name}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <BlurView intensity={20} style={styles.contentBlur} tint="dark">
                <Text style={styles.subtitle}>{character.class || "Aventurero"}</Text>

                <View style={styles.descriptionContainer}>
                  <Text style={styles.description}>{getEnhancedDescription()}</Text>
                </View>

                <View style={styles.videoContainer}>
                  <Video
                    source={getVideoSource()}
                    rate={1.0}
                    volume={1.0}
                    isMuted={false}
                    resizeMode="cover"
                    shouldPlay={visible}
                    isLooping
                    style={[styles.video, { height: videoHeight }]}
                    useNativeControls
                  />
                </View>

                {character.abilities && (
                  <View style={styles.abilitiesSection}>
                    <Text style={styles.abilitiesTitle}>Special Abilities</Text>
                    <View style={styles.abilitiesContainer}>
                      {character.abilities.map((ability, index) => (
                        <View key={index} style={styles.abilityBadge}>
                          <Feather name="zap" size={12} color="#FFD700" />
                          <Text style={styles.abilityText}>{ability}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </BlurView>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  modalContent: {
    width: "100%",
    height: "100%",
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 28,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  contentBlur: {
    borderRadius: 15,
    padding: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  subtitle: {
    color: "#FFD700",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 15,
    fontStyle: "italic",
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  videoContainer: {
    width: "100%",
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    borderRadius: 10,
  },
  abilitiesSection: {
    marginTop: 10,
  },
  abilitiesTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  abilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  abilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginHorizontal: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  abilityText: {
    color: "#FFFFFF",
    marginLeft: 5,
    fontSize: 12,
  },
})

export default CharacterDetailsDialog
