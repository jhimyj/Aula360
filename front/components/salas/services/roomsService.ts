import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://iz6hr4i7m9.execute-api.us-east-1.amazonaws.com/dev';
// https://iz6hr4i7m9.execute-api.us-east-1.amazonaws.com/dev
export interface RoomData {
  name: string;
  description: string;
  course: string;
  topic: string;
}

export const createRoom = async (roomData: RoomData) => {
  // Obtener token de autenticación
  console.log(roomData)
  const token = await AsyncStorage.getItem('userToken');
  console.log("TOKEN : ",token)
  if (!token) {
    throw new Error('No se ha encontrado el token de autenticación');
  }
  
  // Realizar petición a la API
  const response = await axios.post(
    `${API_URL}/rooms/create`,
    roomData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    }
  );
  console.log(".........................")
  console.log(response.data)
  
  return response.data;
};