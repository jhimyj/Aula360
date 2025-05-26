"use client"

import { useState, useEffect } from "react"
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins"

interface UserProfile {
  id: string
  username: string
  email?: string
  name?: string
  role: string
  created_at: string
  last_login?: string
  profile_picture?: string
  [key: string]: any // Para campos adicionales
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  // 🔑 FUNCIÓN PARA OBTENER TOKEN
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }
      return token.trim()
    } catch (error) {
      console.error("❌ Error al obtener el token:", error)
      throw error
    }
  }

  // 🎯 FUNCIÓN PARA OBTENER DATOS DEL PERFIL
  const fetchUserProfile = async () => {
    try {
      console.log("🔍 Obteniendo datos del perfil...")

      const token = await getAuthToken()
      console.log("🔑 Token obtenido:", token ? `${token.substring(0, 15)}...` : "NO TOKEN")

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      }

      console.log("📤 Enviando petición al perfil...")

      const response = await fetch("https://9l68voxzvc.execute-api.us-east-1.amazonaws.com/dev/user/me", {
        method: "GET",
        headers: headers,
      })

      console.log("📥 Respuesta del perfil - Status:", response.status)

      const responseText = await response.text()
      console.log("📄 Response del perfil:", responseText)

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`

        try {
          const errorData = JSON.parse(responseText)
          console.log("❌ Error data del perfil:", errorData)

          if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.log("⚠️ No se pudo parsear error del perfil")
          errorMessage = responseText || `Error ${response.status}`
        }

        if (response.status === 401) {
          console.error("❌ Token expirado o inválido")
          await AsyncStorage.removeItem("userToken")
          throw new Error("Sesión expirada. Inicia sesión nuevamente.")
        }

        throw new Error(errorMessage)
      }

      // ✅ PARSEAR RESPUESTA EXITOSA
      let data
      try {
        data = JSON.parse(responseText)
        console.log("✅ Data del perfil parseada:", data)
      } catch (parseError) {
        console.error("❌ Error parseando respuesta del perfil:", parseError)
        throw new Error("Respuesta del servidor inválida")
      }

      // ✅ EXTRAER DATOS DEL USUARIO
      let userProfile: UserProfile

      if (data.body) {
        // Si la respuesta viene en data.body
        userProfile = typeof data.body === "string" ? JSON.parse(data.body) : data.body
      } else if (data.user) {
        // Si la respuesta viene en data.user
        userProfile = data.user
      } else if (data.data) {
        // Si la respuesta viene en data.data
        userProfile = data.data
      } else {
        // Si la respuesta es directamente el usuario
        userProfile = data
      }

      console.log("✅ Perfil del usuario obtenido:", userProfile)
      return userProfile
    } catch (error) {
      console.error("❌ Error completo en fetchUserProfile:", error)
      throw error
    }
  }

  // 🔄 CARGAR PERFIL AL MONTAR COMPONENTE
  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const userProfile = await fetchUserProfile()
      setProfile(userProfile)
    } catch (error: any) {
      console.error("❌ Error al cargar perfil:", error)
      setError(error.message)

      if (error.message.includes("Sesión expirada")) {
        Alert.alert("Sesión Expirada", "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.", [
          {
            text: "OK",
            onPress: () => {
              // Aquí podrías llamar a logout o redirigir al login
              console.log("🚪 Redirigiendo al login...")
            },
          },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  // 🔄 FUNCIÓN PARA REFRESCAR
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await loadProfile()
    } finally {
      setRefreshing(false)
    }
  }

  // 🎯 CARGAR PERFIL AL MONTAR
  useEffect(() => {
    loadProfile()
  }, [])

  // 📅 FUNCIÓN PARA FORMATEAR FECHAS
  const formatDate = (dateString: string) => {
    if (!dateString) return "No disponible"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Fecha inválida"
    }
  }

  // 🎨 FUNCIÓN PARA OBTENER ICONO DE ROL
  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case "TEACHER":
        return "briefcase"
      case "STUDENT":
        return "school"
      case "ADMIN":
        return "shield-checkmark"
      default:
        return "person"
    }
  }

  // 🎨 FUNCIÓN PARA OBTENER COLOR DE ROL
  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case "TEACHER":
        return "#FF8C00"
      case "STUDENT":
        return "#4CAF50"
      case "ADMIN":
        return "#9C27B0"
      default:
        return "#666"
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF4444" />
        <Text style={styles.errorTitle}>Error al cargar perfil</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle" size={64} color="#666" />
        <Text style={styles.errorTitle}>No se encontró el perfil</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF8C00"]} />}
    >
      {/* 🎯 HEADER DEL PERFIL */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {profile.profile_picture ? (
            <Image source={{ uri: profile.profile_picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: getRoleColor(profile.role) }]}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{profile.name || profile.username}</Text>
          <View style={styles.roleContainer}>
            <Ionicons name={getRoleIcon(profile.role)} size={16} color={getRoleColor(profile.role)} />
            <Text style={[styles.userRole, { color: getRoleColor(profile.role) }]}>
              {profile.role === "TEACHER" ? "Profesor" : profile.role === "STUDENT" ? "Estudiante" : profile.role}
            </Text>
          </View>
        </View>
      </View>

      {/* 📋 INFORMACIÓN BÁSICA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nombre de Usuario</Text>
              <Text style={styles.infoValue}>{profile.username}</Text>
            </View>
          </View>

          {profile.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Correo Electrónico</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="finger-print-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>ID de Usuario</Text>
              <Text style={styles.infoValue}>{profile.id}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 📅 INFORMACIÓN DE ACTIVIDAD */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fecha de Registro</Text>
              <Text style={styles.infoValue}>{formatDate(profile.created_at)}</Text>
            </View>
          </View>

          {profile.last_login && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Último Acceso</Text>
                <Text style={styles.infoValue}>{formatDate(profile.last_login)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 🔧 INFORMACIÓN ADICIONAL (SI EXISTE) */}
      {Object.keys(profile).some(
        (key) =>
          !["id", "username", "email", "name", "role", "created_at", "last_login", "profile_picture"].includes(key),
      ) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Adicional</Text>

          <View style={styles.infoCard}>
            {Object.entries(profile)
              .filter(
                ([key]) =>
                  !["id", "username", "email", "name", "role", "created_at", "last_login", "profile_picture"].includes(
                    key,
                  ),
              )
              .map(([key, value]) => (
                <View key={key} style={styles.infoRow}>
                  <Ionicons name="information-circle-outline" size={20} color="#666" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
                    </Text>
                    <Text style={styles.infoValue}>{String(value)}</Text>
                  </View>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* 🔄 BOTÓN DE ACTUALIZAR */}
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshButtonText}>Actualizar Perfil</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins_400Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  profileHeader: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userRole: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    marginLeft: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  refreshButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 8,
  },
})
