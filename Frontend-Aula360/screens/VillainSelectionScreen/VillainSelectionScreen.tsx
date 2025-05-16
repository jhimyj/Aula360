"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  StatusBar as RNStatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { useIsFocused } from "@react-navigation/native";

import BackButton from "../ComponentesVillano/UI/back-button";
import VillainCarousel from "../ComponentesVillano/villain-carousel";
import VillainCard from "../ComponentesVillano/villain-card";
import ActionButton from "../ComponentesVillano/UI/action-button";

const { width, height } = Dimensions.get("window");

// -------------------- Datos de villanos --------------------
const villains = [
  {
    id: 1,
    name: "Corporatus",
    image: require("../../assets/villanos/Corporatus.png"),
    description:
      "El magnate corrupto que contamina el planeta por beneficio propio. Sus acciones han causado daños irreparables al ecosistema global y ha sobornado a políticos para evitar regulaciones ambientales.",
    power: 80,
    danger: 75,
    reach: 90,
  },
  {
    id: 2,
    name: "Toxicus",
    image: require("../../assets/villanos/El Demonio de la Avidez.png"),
    description:
      "Maestro de los desechos tóxicos y enemigo del medio ambiente. Sus experimentos han contaminado océanos enteros y creado zonas inhabitables en varios continentes.",
    power: 85,
    danger: 90,
    reach: 70,
  },
  {
    id: 3,
    name: "Shadowman",
    image: require("../../assets/villanos/Shadowman.png"),
    description:
      "Manipulador de las sombras que opera desde las tinieblas. Nadie conoce su verdadera identidad ni sus motivaciones, pero su red de espionaje se extiende por todo el mundo.",
    power: 75,
    danger: 95,
    reach: 85,
  },
];

// -------------------- Componente ---------------------------
export default function VillainSelectionScreen({ navigation }) {
  const isFocused = useIsFocused();                 // ← detecta foco
  const soundRef = useRef<Audio.Sound | null>(null);

  const [selectedVillain, setSelectedVillain] = useState(0);
  const [animateCard, setAnimateCard] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // ------------------ Audio helpers ------------------------
  const playBackgroundSound = useCallback(async () => {
    if (soundRef.current) return; // ya cargado

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/SonidoJuego/sonidoFondo.mp3"),
      { isLooping: true, volume: 0.5, shouldPlay: true }
    );

    soundRef.current = sound;
    setIsPlaying(true);
  }, []);

  const stopSound = useCallback(async () => {
    if (!soundRef.current) return;
    await soundRef.current.stopAsync();
    await soundRef.current.unloadAsync();
    soundRef.current = null;
    setIsPlaying(false);
  }, []);

  // ------------------ Control de foco ----------------------
  useEffect(() => {
    if (isFocused) playBackgroundSound();
    else stopSound();

    return () => stopSound(); // limpieza al desmontar
  }, [isFocused, playBackgroundSound, stopSound]);

  // ----------- Resto de lógica de componente ---------------
  useEffect(() => {
    setAnimateCard(true);
    const t = setTimeout(() => setAnimateCard(false), 300);
    return () => clearTimeout(t);
  }, [selectedVillain]);

  const handleBack = () => {
    navigation?.goBack?.();
  };

  const handleVillainSelect = (index) => {
    setSelectedVillain(index);
  };

  const handleStartMission = () => {
    alert(`Iniciando misión con ${villains[selectedVillain].name}`);
  };

  const handleMoreInfo = (villainId) => {
    alert(`Más información sobre ${villains.find((v) => v.id === villainId).name}`);
  };

  // -------------------- UI --------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <RNStatusBar barStyle="light-content" backgroundColor="#051438" />
      <LinearGradient colors={["#051438", "#0A2463", "#1E3A8A"]} style={styles.gradient}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={handleBack} />
            <Text style={styles.title}>SELECCIÓN DE VILLANO</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Carrusel */}
          <View style={styles.carouselSection}>
            <VillainCarousel
              onVillainSelect={handleVillainSelect}
              selectedIndex={selectedVillain}
            >
              {villains.map((villain) => (
                <View key={villain.id} style={styles.villainPreview}>
                  <View style={styles.imageWrapper}>
                    <Image source={villain.image} style={styles.villainImage} />
                  </View>
                  <View style={styles.nameWrapper}>
                    <Text style={styles.villainName}>{villain.name}</Text>
                  </View>
                </View>
              ))}
            </VillainCarousel>
          </View>

          {/* Tarjeta */}
          <View style={styles.cardSection}>
            <VillainCard
              villain={villains[selectedVillain]}
              onPress={() => {}}
              onMorePress={() => handleMoreInfo(villains[selectedVillain].id)}
            />
          </View>

          {/* Botón de acción */}
          <View style={styles.actionSection}>
            <ActionButton
              title="¡INICIAR MISIÓN!"
              onPress={handleStartMission}
              primary
              icon="play-circle"
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ------------------ Estilos -------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  gradient: { flex: 1 },
  container: {
    flex: 1,
    padding: width * 0.05,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: height * 0.0000000001,
    height: height * 0.065,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  placeholder: { width: 40, height: 40 },
  carouselSection: {
    height: height * 0.28,
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
  },
  villainPreview: {
    alignItems: "center",
    justifyContent: "space-between",
    width: width * 0.6,
    height: height * 0.22,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 12,
  },
  imageWrapper: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%" },
  villainImage: { width: 120, height: 120, resizeMode: "contain" },
  nameWrapper: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  villainName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardSection: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
  },
  actionSection: {
    height: height * 0.1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
});
