"use client"

import { useState, useEffect } from "react"
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { TouchableOpacity, Text, Alert, View, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Dashboard from "../screens/Dashboard/Dashboard"
import Salas from "../components/salas/index"
import StudentDashboardScreen from "../screens/Students/StudentDashboardScreen"
import VillainSelectionScreen from "../screens/VillainSelectionScreen/VillainSelectionScreen"
import BattleScreen from "../screens/Versus/BattleScreen"
import ProfileScreen from "../screens/Profile/ProfileScreen"

import Mision from "../screens/mision/mission-screen"
import MissionGameScreen from "../screens/mission-game-screen/mission-game-screen"
import compot from "../../front/screens/QuizScreen/ExampleUsage"
import ResultsScreen from "../screens/ComponentesQuiz/results-screen"
import AllRooms from "../screens/AllRooms/AllRooms"
import UploadEvaluationScreen from "../screens/UploadEvaluation/UploadEvaluationScreen"

// 🔥 NUEVAS IMPORTACIONES PARA ESTUDIANTES
import RoomSelectorForStudents from "../componentes/Students/RoomSelectorForStudents"
import StudentListScreen from "../componentes/Students/StudentListScreen"

export type DrawerNavigatorParamList = {
  MainTabs: undefined
  StudentDashboard: undefined
  Inicio: undefined
  Profile: undefined
  Salas: undefined
  AllRooms: undefined
  UploadEvaluation: { roomId?: string; roomName?: string }
  VillainSelection: undefined
  BattleScreen: undefined
  Mision: undefined
  MissionGameScreen: undefined
  Quiz: undefined
  Results: undefined
  // 🔥 NUEVAS RUTAS PARA ESTUDIANTES
  RoomSelectorForStudents: undefined
  StudentList: { roomId: string; roomName: string }
}

const Tab = createMaterialTopTabNavigator()
const Stack = createStackNavigator<DrawerNavigatorParamList>()

// 🎯 NAVEGADOR DE TABS PRINCIPALES (SOLO PANTALLAS PRINCIPALES)
function TabNavigator({ userRole }: { userRole: string }) {
  const isTeacher = () => userRole === "TEACHER"
  const isStudent = () => userRole === "STUDENT"

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#FF8C00",
        tabBarInactiveTintColor: "#666",
        tabBarIndicatorStyle: {
          backgroundColor: "#FF8C00",
          height: 3,
        },
        tabBarStyle: {
          backgroundColor: "#fff",
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          textTransform: "none",
        },
        tabBarScrollEnabled: true,
        tabBarItemStyle: {
          width: "auto",
          minWidth: 100,
        },
      }}
    >
      {/* 🎓 PANTALLA PRINCIPAL PARA ESTUDIANTES */}
      {isStudent() && (
        <Tab.Screen
          name="StudentDashboard"
          component={StudentDashboardScreen}
          options={{
            title: "🏠 Inicio",
          }}
        />
      )}

      {/* 🏫 DASHBOARD SOLO PARA PROFESORES */}
      {isTeacher() && (
        <Tab.Screen
          name="Inicio"
          component={Dashboard}
          options={{
            title: "🏠 Dashboard",
          }}
        />
      )}

      {/* 👤 PERFIL - DISPONIBLE PARA TODOS */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "👤 Perfil",
        }}
      />
    </Tab.Navigator>
  )
}

// 🔧 NAVEGADOR PRINCIPAL CON STACK PARA TODAS LAS PANTALLAS
function MainNavigator({
  userRole,
  userInfo,
  onLogout,
}: {
  userRole: string
  userInfo: any
  onLogout: () => void
}) {
  const isStudent = () => userRole === "STUDENT"
  const isTeacher = () => userRole === "TEACHER"

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FF8C00",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
        },
        headerRight: () => (
          <TouchableOpacity onPress={onLogout} style={{ marginRight: 15, padding: 5 }}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      {/* 🎯 PANTALLA PRINCIPAL CON TABS */}
      <Stack.Screen
        name="MainTabs"
        options={{
          title: isStudent() ? "Dashboard para Estudiantes" : "Dashboard para Profesores",
          headerLeft: () => (
            <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 15 }}>
              <Ionicons name={isStudent() ? "school" : "briefcase"} size={24} color="#fff" />
            </View>
          ),
        }}
      >
        {() => <TabNavigator userRole={userRole} />}
      </Stack.Screen>

      {/* 🎮 PANTALLAS DE JUEGO PARA ESTUDIANTES */}
      {isStudent() && (
        <>
          <Stack.Screen
            name="VillainSelection"
            component={VillainSelectionScreen}
            options={{
              title: "👹 Selección de Villanos",
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="BattleScreen"
            component={BattleScreen}
            options={{
              title: "Batalla",
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="Mision"
            component={Mision}
            options={{
              title: "🗺️ Misiones",
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="MissionGameScreen"
            component={MissionGameScreen}
            options={{
              title: "🎮 Juego de Misión",
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="Quiz"
            component={compot}
            options={{
              title: " Quiz",
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="Results"
            component={ResultsScreen}
            options={{
              title: "🏆 Resultados",
              headerBackTitleVisible: false,
            }}
          />
        </>
      )}

      {/* 🔧 PANTALLAS ADMINISTRATIVAS PARA PROFESORES */}
      {isTeacher() && (
        <>
          <Stack.Screen
            name="Salas"
            component={Salas}
            options={{
              title: "🏫 Crear Salas",
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="AllRooms"
            component={AllRooms}
            options={{
              title: "📚 Todas las Salas",
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="UploadEvaluation"
            component={UploadEvaluationScreen}
            initialParams={{ roomId: "", roomName: "" }}
            options={{
              title: "📤 Subir Evaluación",
              headerBackTitleVisible: false,
            }}
          />
          {/* 🔥 NUEVAS PANTALLAS PARA VER ESTUDIANTES */}
          <Stack.Screen
            name="RoomSelectorForStudents"
            component={RoomSelectorForStudents}
            options={{
              title: "👥 Seleccionar Sala",
              headerBackTitleVisible: false,
              headerStyle: {
                backgroundColor: "#4361EE", // Color diferente para distinguir
              },
            }}
          />
          <Stack.Screen
            name="StudentList"
            component={StudentListScreen}
            options={{
              title: "👨‍🎓 Lista de Estudiantes",
              headerBackTitleVisible: false,
              headerStyle: {
                backgroundColor: "#4361EE", // Color diferente para distinguir
              },
            }}
          />
        </>
      )}

      {/* 🌐 PANTALLAS COMPARTIDAS (ACCESIBLES PARA AMBOS ROLES) */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "👤 Mi Perfil",
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  )
}

// Crear un componente wrapper que maneje el logout Y LOS ROLES
function DrawerNavigatorContent({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  // 🎯 ESTADOS PARA MANEJAR EL ROL
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 🔍 FUNCIÓN PARA CARGAR EL ROL DESDE ASYNCSTORAGE
  const loadUserRole = async () => {
    try {
      setIsLoading(true)

      // Obtener el rol y la información del usuario
      const role = await AsyncStorage.getItem("userRole")
      const authMethod = await AsyncStorage.getItem("authMethod")
      const userInfoString = await AsyncStorage.getItem("userInfo")

      console.log("🔍 Cargando información del usuario:")
      console.log("- Rol:", role)
      console.log("- Método de auth:", authMethod)
      console.log("- Info del usuario:", userInfoString)

      if (role && userInfoString) {
        const parsedUserInfo = JSON.parse(userInfoString)
        setUserRole(role)
        setUserInfo(parsedUserInfo)

        console.log("✅ Usuario cargado:", {
          role: role,
          username: parsedUserInfo.username,
          loginMethod: parsedUserInfo.loginMethod,
        })
      } else {
        console.log("⚠️ No se encontró información del usuario")
        setUserRole(null)
        setUserInfo(null)
      }
    } catch (error) {
      console.error("❌ Error al cargar el rol del usuario:", error)
      setUserRole(null)
      setUserInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 🔄 CARGAR ROL AL MONTAR EL COMPONENTE
  useEffect(() => {
    loadUserRole()
  }, [])

  // 🧹 FUNCIÓN PARA LIMPIAR DATOS DE USUARIO
 

  const handleLogout = async () => {
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
            // 🧹 LIMPIAR TODA LA INFORMACIÓN DEL USUARIO
           // await clearUserRole()
            setIsAuthenticated(false)
            console.log("👋 Sesión cerrada exitosamente")
          } catch (error) {
            console.error("❌ Error al cerrar sesión:", error)
          }
        },
      },
    ])
  }

  // 🔄 MOSTRAR LOADING MIENTRAS SE CARGA EL ROL
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F8FAFC",
        }}
      >
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text
          style={{
            marginTop: 10,
            fontSize: 16,
            color: "#666",
            fontWeight: "500",
          }}
        >
          Cargando perfil...
        </Text>
      </View>
    )
  }

  if (!userRole) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F8FAFC",
          padding: 20,
        }}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={{ fontSize: 18, color: "#333", fontWeight: "600", marginTop: 16, textAlign: "center" }}>
          Error al cargar el perfil
        </Text>
        <Text style={{ fontSize: 14, color: "#666", marginTop: 8, textAlign: "center" }}>
          No se pudo determinar tu rol de usuario
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#FF8C00",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 20,
          }}
          onPress={async () => {
            await clearUserRole()
            setIsAuthenticated(false)
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Volver al login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  console.log("🎯 Renderizando MainNavigator para rol:", userRole)
  console.log("👤 Info del usuario:", userInfo?.username)

  return <MainNavigator userRole={userRole} userInfo={userInfo} onLogout={handleLogout} />
}

export default DrawerNavigatorContent
