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

interface Props {
  setIsAuthenticated?: (value: boolean) => void // Opcional para manejar logout
}

export default function ProfileScreen({ setIsAuthenticated }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  // VERIFICAR DISPONIBILIDAD DE setIsAuthenticated AL MONTAR
  useEffect(() => {
    console.log(" ProfileScreen montado - setIsAuthenticated disponible:", !!setIsAuthenticated)
    if (!setIsAuthenticated) {
      console.error(" CRÍTICO: setIsAuthenticated no está disponible en ProfileScreen!")
    }
  }, [setIsAuthenticated])

  const getProfileEndpoint = (role: string | null) => {
    if (role === "STUDENT") {
      return "https://iza2ya8d9j.execute-api.us-east-1.amazonaws.com/dev/students/me"
    } else {
      // Para TEACHER, ADMIN u otros roles
      return "https://9l68voxzvc.execute-api.us-east-1.amazonaws.com/dev/user/me"
    }
  }

  //  FUNCIÓN PARA OBTENER TOKEN CON VALIDACIÓN MEJORADA
  const getAuthToken = async (role: string | null) => {
    try {
      let token = null

      if (role === "STUDENT") {
        // Para estudiantes, priorizar studentToken
        token = await AsyncStorage.getItem("studentToken")
        console.log("Buscando token de estudiante:", token ? `${token.substring(0, 15)}...` : "NO TOKEN")
      } else {
        // Para otros roles, usar userToken
        token = await AsyncStorage.getItem("userToken")
        console.log(" Buscando token de usuario:", token ? `${token.substring(0, 15)}...` : "NO TOKEN")
      }

      // Fallback: si no encontramos el token específico, buscar en otros lugares
      if (!token) {
        console.log("Token específico no encontrado, buscando alternativas...")
        token =
          (await AsyncStorage.getItem("studentToken")) ||
          (await AsyncStorage.getItem("userToken")) ||
          (await AsyncStorage.getItem("teacherToken")) ||
          (await AsyncStorage.getItem("adminToken"))
      }

      console.log("TOKEN FINAL OBTENIDO:", token ? `${token.substring(0, 15)}...` : "NO TOKEN")

      if (!token) {
        throw new Error("No se encontró ningún token de autenticación")
      }

      // Validar formato básico del token (no vacío y sin espacios extras)
      token = token.trim()
      if (!token) {
        throw new Error("Token inválido (vacío)")
      }

      return token
    } catch (error) {
      console.error(" Error al obtener el token:", error)
      throw error
    }
  }

  // 🔍 FUNCIÓN PARA OBTENER EL ROL DEL USUARIO
  const getUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem("userRole")
      console.log("Rol del usuario obtenido:", role)
      return role
    } catch (error) {
      console.error("Error al obtener el rol:", error)
      return null
    }
  }

  const handleLogout = async () => {
    try {
      console.log("Iniciando proceso de logout desde ProfileScreen...")
      console.log(" setIsAuthenticated disponible:", !!setIsAuthenticated)

      if (!setIsAuthenticated) {
        console.error(" CRÍTICO: setIsAuthenticated no está disponible!")
        Alert.alert(
          " Error Crítico",
          "No se puede cerrar sesión correctamente. La función de autenticación no está disponible.",
          [{ text: "OK" }],
        )
        return
      }

      Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres cerrar sesión?", [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(" Limpiando datos de usuario...")

              // Lista de todas las claves relacionadas con autenticación
              const authKeys = [
                "studentToken",
                "studentData",
                "authMethod",
                "userRole",
                "userInfo",
                "room_code",
                "roomId",
                "teacherToken",
                "teacherData",
                "adminToken",
                "adminData",
                "userToken",
                "isAuthenticated",
              ]

              // Eliminar todas las claves de autenticación
              await AsyncStorage.multiRemove(authKeys)
              console.log(" Datos de sesión limpiados correctamente")

              console.log(" Ejecutando setIsAuthenticated(false) - App.js cambiará al AuthStack")
              setIsAuthenticated(false)
              console.log(" setIsAuthenticated(false) ejecutado correctamente")

              Alert.alert("Sesión Cerrada", "Has cerrado sesión correctamente.", [{ text: "OK" }])
            } catch (error) {
              console.error(" Error al cerrar sesión:", error)
              console.log("Fallback: Ejecutando setIsAuthenticated(false)")
              setIsAuthenticated(false)
              Alert.alert("Error", "Hubo un problema al cerrar sesión, pero se ha desautenticado.")
            }
          },
        },
      ])
    } catch (error) {
      console.error(" Error en handleLogout:", error)
      if (setIsAuthenticated) {
        console.log(" Fallback final: setIsAuthenticated(false)")
        setIsAuthenticated(false)
      }
    }
  }

  //  FUNCIÓN MEJORADA PARA MANEJAR SESIÓN EXPIRADA CON VERIFICACIÓN
  const handleSessionExpired = async () => {
    try {
      console.log(" Sesión expirada detectada - limpiando datos...")
      console.log(" setIsAuthenticated disponible en sesión expirada:", !!setIsAuthenticated)

      const authKeys = [
        "studentToken",
        "studentData",
        "authMethod",
        "userRole",
        "userInfo",
        "room_code",
        "roomId",
        "teacherToken",
        "teacherData",
        "adminToken",
        "adminData",
        "userToken",
        "isAuthenticated",
      ]

      await AsyncStorage.multiRemove(authKeys)
      console.log(" Datos de sesión limpiados")

      if (!setIsAuthenticated) {
        console.error(" CRÍTICO: setIsAuthenticated no está disponible en sesión expirada!")
        Alert.alert(
          " Sesión Expirada",
          "Tu sesión ha expirado. La aplicación se reiniciará.",
          [
            {
              text: "OK",
              onPress: () => {
                console.log("Último recurso: Intentando recargar la aplicación...")
              },
            },
          ],
          { cancelable: false },
        )
        return
      }

      Alert.alert(
        " Sesión Expirada",
        "Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente para continuar.",
        [
          {
            text: "Ir al Login",
            onPress: () => {
              console.log("Redirigiendo al AuthStack por sesión expirada...")
              console.log(" Ejecutando setIsAuthenticated(false) - App.js cambiará al AuthStack")
              setIsAuthenticated(false)
              console.log(" setIsAuthenticated(false) ejecutado por sesión expirada")
            },
          },
        ],
        { cancelable: false },
      )
    } catch (error) {
      console.error("Error al limpiar sesión expirada:", error)

      Alert.alert(
        "Error de Sesión",
        "Hubo un problema con tu sesión. Por favor, inicia sesión nuevamente.",
        [
          {
            text: "Ir al Login",
            onPress: () => {
              console.log("Fallback por error en limpieza de sesión expirada...")
              if (setIsAuthenticated) {
                setIsAuthenticated(false)
              } else {
                console.error(" setIsAuthenticated no disponible en fallback!")
              }
            },
          },
        ],
        { cancelable: false },
      )
    }
  }

  // FUNCIÓN PARA OBTENER DATOS DEL PERFIL CON ENDPOINT DINÁMICO
  const fetchUserProfile = async () => {
    try {
      console.log("🔍 Obteniendo datos del perfil...")

      // Primero obtener el rol del usuario
      const role = await getUserRole()
      setUserRole(role)

      if (!role) {
        throw new Error("No se pudo determinar el rol del usuario")
      }

      // Obtener el token apropiado para el rol
      const token = await getAuthToken(role)

      // Verificar si el token parece válido (formato básico)
      if (!token || token.length < 10) {
        console.error(" Token inválido o muy corto:", token)
        throw new Error("Token de autenticación inválido")
      }

      // Determinar el endpoint correcto según el rol
      const endpoint = getProfileEndpoint(role)
      console.log(" Endpoint seleccionado para rol", role, ":", endpoint)

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      }

      console.log(" Enviando petición al perfil...")

      const response = await fetch(endpoint, {
        method: "GET",
        headers: headers,
      })

      console.log(" Respuesta del perfil - Status:", response.status)

      const responseText = await response.text()
      console.log(" Response del perfil:", responseText)

      // Manejar errores HTTP
      if (!response.ok) {
        let errorMessage = `Error ${response.status}`

        try {
          const errorData = JSON.parse(responseText)
          console.log(" Error data del perfil:", errorData)

          if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.log(" No se pudo parsear error del perfil")
          errorMessage = responseText || `Error ${response.status}`
        }

        //  MANEJAR ESPECÍFICAMENTE ERRORES DE AUTENTICACIÓN Y REDIRIGIR
        if (
          response.status === 401 ||
          response.status === 403 ||
          errorMessage.includes("no encontrado") ||
          errorMessage.includes("expirado") ||
          errorMessage.includes("invalid") ||
          errorMessage.includes("unauthorized") ||
          errorMessage.includes("forbidden")
        ) {
          console.error(" Token expirado o inválido - Status:", response.status)
          await handleSessionExpired()
          throw new Error("Sesión expirada. Redirigiendo al login...")
        }

        throw new Error(errorMessage)
      }

      //  PARSEAR RESPUESTA EXITOSA
      let data
      try {
        data = JSON.parse(responseText)
        console.log(" Data del perfil parseada:", data)
      } catch (parseError) {
        console.error(" Error parseando respuesta del perfil:", parseError)
        throw new Error("Respuesta del servidor inválida")
      }

      let userProfile: UserProfile

      // Intentar extraer el perfil de diferentes estructuras posibles
      if (data.body) {
        // Si la respuesta viene en data.body
        userProfile = typeof data.body === "string" ? JSON.parse(data.body) : data.body
      } else if (data.user) {
        // Si la respuesta viene en data.user
        userProfile = data.user
      } else if (data.data) {
        // Si la respuesta viene en data.data
        userProfile = data.data
      } else if (data.student) {
        // Si la respuesta viene en data.student (específico para estudiantes)
        userProfile = data.student
      } else if (data.teacher) {
        // Si la respuesta viene en data.teacher (específico para profesores)
        userProfile = data.teacher
      } else {
        // Si la respuesta es directamente el usuario
        userProfile = data
      }

      // Verificar que tenemos datos mínimos necesarios
      if (!userProfile || !userProfile.id || !userProfile.username) {
        console.error("Datos de perfil incompletos:", userProfile)
        throw new Error("Los datos del perfil están incompletos")
      }

      // Asegurar que el rol esté presente en el perfil
      if (!userProfile.role && role) {
        userProfile.role = role
      }

      console.log(" Perfil del usuario obtenido:", userProfile)
      console.log("Endpoint usado:", endpoint)
      console.log(" Rol confirmado:", userProfile.role)

      return userProfile
    } catch (error: any) {
      console.error(" Error completo en fetchUserProfile:", error)

      //  SI ES ERROR DE SESIÓN EXPIRADA, YA SE MANEJÓ LA REDIRECCIÓN
      if (error.message.includes("expirada") || error.message.includes("Redirigiendo al login")) {
        return
      }

      // Si es error de token, manejar sesión expirada
      if (error.message.includes("token") || error.message.includes("autenticación")) {
        await handleSessionExpired()
      }

      throw error
    }
  }

  //  CARGAR PERFIL AL MONTAR COMPONENTE
  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const userProfile = await fetchUserProfile()

      //SI userProfile ES UNDEFINED (SESIÓN EXPIRADA), NO CONTINUAR
      if (!userProfile) {
        return
      }

      setProfile(userProfile)
    } catch (error: any) {
      console.error(" Error al cargar perfil:", error)

      //  SI EL ERROR INDICA REDIRECCIÓN, NO MOSTRAR ERROR
      if (error.message.includes("Redirigiendo al login")) {
        return
      }

      setError(error.message)

      // MANEJAR ERRORES DE SESIÓN CON ALERTA
      if (error.message.includes("Sesión expirada") || error.message.includes("token")) {
        return
      }
    } finally {
      setLoading(false)
    }
  }

  //  FUNCIÓN PARA REFRESCAR
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await loadProfile()
    } finally {
      setRefreshing(false)
    }
  }

  // CARGAR PERFIL AL MONTAR
  useEffect(() => {
    loadProfile()
  }, [])

  //  FUNCIÓN PARA FORMATEAR FECHAS
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

  // FUNCIÓN PARA OBTENER COLOR DE ROL
  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case "TEACHER":
        return "#FF8C00"
      case "STUDENT":
        return "#4361EE"
      case "ADMIN":
        return "#9C27B0"
      default:
        return "#666"
    }
  }

  // FUNCIÓN PARA OBTENER TEXTO DE ROL
  const getRoleText = (role: string) => {
    switch (role?.toUpperCase()) {
      case "TEACHER":
        return "Profesor"
      case "STUDENT":
        return "Estudiante"
      case "ADMIN":
        return "Administrador"
      default:
        return role || "Usuario"
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
        {userRole && (
          <Text style={styles.debugText}>Endpoint: {userRole === "STUDENT" ? "students/me" : "user/me"}</Text>
        )}
        <Text style={styles.debugText}>
          setIsAuthenticated: {setIsAuthenticated ? " Disponible" : " No disponible"}
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF4444" />
        <Text style={styles.errorTitle}>Error al cargar perfil</Text>
        <Text style={styles.errorText}>{error}</Text>
        {userRole && (
          <Text style={styles.debugText}>
            Rol: {userRole} | Endpoint: {userRole === "STUDENT" ? "students/me" : "user/me"}
          </Text>
        )}
        <Text style={styles.debugText}>
          setIsAuthenticated: {setIsAuthenticated ? "Disponible" : "No disponible"}
        </Text>
        <View style={styles.errorButtonsContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logoutButton, !setIsAuthenticated && { backgroundColor: "#999", opacity: 0.5 }]}
            onPress={handleLogout}
            disabled={!setIsAuthenticated}
          >
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle" size={64} color="#666" />
        <Text style={styles.errorTitle}>No se encontró el perfil</Text>
        <View style={styles.errorButtonsContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logoutButton, !setIsAuthenticated && { backgroundColor: "#999", opacity: 0.5 }]}
            onPress={handleLogout}
            disabled={!setIsAuthenticated}
          >
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4361EE"]} />}
    >
      {/*  HEADER DEL PERFIL */}
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
            <Text style={[styles.userRole, { color: getRoleColor(profile.role) }]}>{getRoleText(profile.role)}</Text>
          </View>
          <Text style={styles.endpointIndicator}>API: {profile.role === "STUDENT" ? "students/me" : "user/me"}</Text>
          {/*  INDICADOR DE ESTADO DE setIsAuthenticated */}
          <Text style={[styles.endpointIndicator, { color: setIsAuthenticated ? "#2ED573" : "#FF4757" }]}>
            Auth: {setIsAuthenticated ? "Disponible" : "No disponible"}
          </Text>
        </View>
      </View>

      {/* INFORMACIÓN BÁSICA */}
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

      {/* INFORMACIÓN DE ACTIVIDAD */}
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

      {/* INFORMACIÓN ADICIONAL (SI EXISTE) */}
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

      {/* BOTONES DE ACCIÓN */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshButtonText}>Actualizar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButtonFull, !setIsAuthenticated && { backgroundColor: "#999", opacity: 0.5 }]}
          onPress={handleLogout}
          disabled={!setIsAuthenticated}
        >
          <Ionicons name="log-out" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>
            {setIsAuthenticated ? "Cerrar Sesión" : "Cerrar Sesión (No disponible)"}
          </Text>
        </TouchableOpacity>
      </View>
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
  debugText: {
    marginTop: 5,
    fontSize: 12,
    color: "#999",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
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
  errorButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#4361EE",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  logoutButton: {
    backgroundColor: "#FF4444",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
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
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    marginLeft: 6,
  },
  endpointIndicator: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "#999",
    fontStyle: "italic",
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
  actionButtonsContainer: {
    gap: 12,
    marginTop: 10,
  },
  refreshButton: {
    backgroundColor: "#4361EE",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 8,
  },
  logoutButtonFull: {
    backgroundColor: "#FF4444",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
})
