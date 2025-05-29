import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function ActionCards({ onUploadEvaluation, onViewStudents }) {
  return (
    <View style={styles.actionCardsContainer}>
      <TouchableOpacity 
        style={[styles.actionCard, styles.uploadCard]} 
        onPress={onUploadEvaluation} 
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Feather name="upload" size={24} color="#fff" />
        </View>
        <Text style={styles.actionCardText}>Crear{"\n"}Evaluación</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionCard, styles.analyticsCard]} 
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Feather name="bar-chart-2" size={24} color="#fff" />
        </View>
        <Text style={styles.actionCardText}>Ver{"\n"}Estadísticas</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionCard, styles.studentsCard]} 
        onPress={onViewStudents}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Feather name="users" size={24} color="#fff" />
        </View>
        <Text style={styles.actionCardText}>Ver{"\n"}Alumnos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  actionCard: {
    width: "31%",
    aspectRatio: 0.9,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  uploadCard: {
    backgroundColor: "#4361EE",
  },
  analyticsCard: {
    backgroundColor: "#3A0CA3",
  },
  studentsCard: {
    backgroundColor: "#4CC9F0",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionCardText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  actionCardSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 2,
  },
});