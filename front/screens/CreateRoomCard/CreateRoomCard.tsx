// components/CreateRoomCard.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function CreateRoomCard({ onPress }) {
  return (
    <TouchableOpacity style={styles.createRoomCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.createRoomContent}>
        <View style={styles.textContainer}>
          <View style={styles.createRoomButton}>
            <Feather name="plus" size={16} color="#4361EE" />
            <Text style={styles.createRoomButtonText}>Crear sala</Text>
          </View>
          <Text style={styles.createRoomText}>Crea salas para tus alumnos</Text>
          <Text style={styles.createRoomSubtext}>Gestiona evaluaciones y seguimiento</Text>
        </View>
        <View style={styles.createRoomImageContainer}>
          <Image 
            source={{ uri: "https://img.freepik.com/free-vector/teacher-concept-illustration_114360-2166.jpg" }} 
            style={styles.createRoomImage} 
            resizeMode="cover"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  createRoomCard: {
    backgroundColor: "#4361EE",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#4361EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createRoomContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  createRoomButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createRoomButtonText: {
    color: "#4361EE",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    marginLeft: 6,
  },
  createRoomText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  createRoomSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  createRoomImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  createRoomImage: {
    width: "100%",
    height: "100%",
  },
});