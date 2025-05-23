// components/PreviousRooms.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import RoomCard from "../CreateRoomCard/RoomCard";

export default function PreviousRooms({ 
  rooms, 
  onViewAll, 
  showViewAll = true,
  onViewMore,
  onEdit,
  onDelete 
}) {
  return (
    <View style={styles.previousRoomsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Salas previas</Text>
        {showViewAll && (
          <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
            <Text style={styles.viewAllText}>Ver todas</Text>
            <Feather name="chevron-right" size={16} color="#4361EE" />
          </TouchableOpacity>
        )}
      </View>
      
      {rooms.map((room) => (
        <RoomCard 
          key={room.id} 
          room={room}
          onViewMore={onViewMore}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

// ... (mantén los estilos igual)
const styles = StyleSheet.create({
  previousRoomsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#4361EE",
    marginRight: 4,
  },
});