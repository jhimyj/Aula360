// components/RoomCard.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function RoomCard({ room }) {
  return (
    <TouchableOpacity style={styles.roomCard} activeOpacity={0.9}>
      {/* Room Info */}
      <View style={styles.roomInfo}>
        <View style={[styles.roomIconContainer, { backgroundColor: `${room.color}20` }]}>
          <Feather name="book-open" size={20} color={room.color} />
        </View>
        <View style={styles.roomNameContainer}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomStatus}>Activa</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-vertical" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Room Details */}
      <View style={[styles.roomDetails, { backgroundColor: room.color }]}>
        <View style={styles.roomStudentsCount}>
          <View>
            <Text style={styles.roomStudentsLabel}>N° estudiantes</Text>
            <View style={styles.studentAvatars}>
              {[...Array(Math.min(3, room.studentCount))].map((_, i) => (
                <View key={i} style={[styles.studentAvatar, { marginLeft: i * -10 }]}>
                  <Text style={styles.studentAvatarText}>{i + 1}</Text>
                </View>
              ))}
              {room.studentCount > 3 && (
                <View style={[styles.studentAvatar, styles.moreAvatar, { marginLeft: -10 }]}>
                  <Text style={styles.moreAvatarText}>+{room.studentCount - 3}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.roomStudentsNumber}>{room.studentCount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.roomDates}>
          <View style={styles.roomDateColumn}>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={14} color="#fff" style={styles.dateIcon} />
              <Text style={styles.roomDateText}>Inicio: {room.startDate}</Text>
            </View>
            <View style={styles.dateRow}>
              <Feather name="clock" size={14} color="#fff" style={styles.dateIcon} />
              <Text style={styles.roomDateText}>{room.startTime}</Text>
            </View>
          </View>
          <View style={styles.roomDateColumn}>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={14} color="#fff" style={styles.dateIcon} />
              <Text style={styles.roomDateText}>Fin: {room.endDate}</Text>
            </View>
            <View style={styles.dateRow}>
              <Feather name="clock" size={14} color="#fff" style={styles.dateIcon} />
              <Text style={styles.roomDateText}>{room.endTime}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  roomCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  roomIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roomNameContainer: {
    flex: 1,
  },
  roomName: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#333",
  },
  roomStatus: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#4CAF50",
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  roomDetails: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
  },
  roomStudentsCount: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  roomStudentsLabel: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    marginBottom: 4,
  },
  studentAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  studentAvatarText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
  moreAvatar: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  moreAvatarText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
  },
  roomStudentsNumber: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 12,
  },
  roomDates: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roomDateColumn: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateIcon: {
    marginRight: 4,
  },
  roomDateText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
});