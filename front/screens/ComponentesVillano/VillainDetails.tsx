"use client";

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import type { Character } from "../ComponentesHero/types";

const { width, height } = Dimensions.get("window");

interface CharacterDetailsDialogProps {
  character: Character;
  visible: boolean;
  onClose: () => void;
}

const VillainDetails: React.FC<CharacterDetailsDialogProps> = ({
  character,
  visible,
  onClose,
}) => {
  const isTablet = useMemo(() => {
    const screenSize =
      Math.sqrt(width * width + height * height) /
      (Platform.OS === "ios" ? 163 : 160);
    return screenSize >= 7;
  }, []);

  const dialogWidth = isTablet ? width * 0.7 : width * 0.9;
  const dialogMaxHeight = isTablet ? height * 0.8 : height * 0.85;
  const videoHeight = isTablet ? 350 : width > height ? 200 : 250;

  // Descripciones y videos según personaje
  const descriptions: Record<string, string> = {
    Corporatus:
      "El magnate corrupto que contamina el planeta por beneficio propio. Sus acciones han causado daños irreparables al ecosistema global y ha sobornado a políticos para evitar regulaciones ambientales.",
    Toxicus:
      "Maestro de los desechos tóxicos y enemigo del medio ambiente. Sus experimentos han contaminado océanos enteros y creado zonas inhabitables en varios continentes.",
    Shadowman:
      "Manipulador de las sombras que opera desde las tinieblas. Nadie conoce su verdadera identidad ni sus motivaciones, pero su red de espionaje se extiende por todo el mundo.",
  };
  const videos: Record<string, any> = {
  Corporatus: { uri: "https://d1xh8jk9umgr2r.cloudfront.net/Corporatus-intro.mp4" },
  Toxicus:    { uri: "https://d1xh8jk9umgr2r.cloudfront.net/Toxicus-intro.mp4" },
  Shadowman:  { uri: "https://d1xh8jk9umgr2r.cloudfront.net/Shadowman-intro.mp4" },
};


  const description =
    descriptions[character.name] ||
    character.description ||
    "Un valiente héroe del imperio inca.";
  const videoSource =
    videos[character.name] || require("../../assets/videos/Killa-intro.mp4");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { width: dialogWidth, maxHeight: dialogMaxHeight },
          ]}
        >
          <LinearGradient
            colors={["#1e3c72", "#2a5298"]} // azul degradado
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
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <BlurView intensity={20} style={styles.contentBlur} tint="dark">
                <Text style={styles.description}>{description}</Text>
                <View style={styles.videoContainer}>
                  <Video
                    source={videoSource}
                    resizeMode="cover"
                    shouldPlay={visible}
                    isLooping
                    style={[styles.video, { height: videoHeight }]}
                    useNativeControls
                  />
                </View>
                {character.abilities && character.abilities.length > 0 && (
                  <View style={styles.abilitiesSection}>
                    <Text style={styles.abilitiesTitle}>
                      Habilidades Especiales
                    </Text>
                    <View style={styles.abilitiesContainer}>
                      {character.abilities.map((ability, idx) => (
                        <View key={idx} style={styles.abilityBadge}>
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
  );
};

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
  description: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
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
});

export default VillainDetails;