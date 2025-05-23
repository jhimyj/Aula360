// hooks/useRoomDetails.ts
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface RoomDetails {
  user_id: string;
  created_at: string;
  course: string;
  topic: string;
  description: string;
  id: string;
  name: string;
}

interface ApiResponse {
  message: string;
  data: RoomDetails;
}

export const useRoomDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoomDetails = async (roomId: string): Promise<RoomDetails | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await axios.get<ApiResponse>(
        `https://iz6hr4i7m9.execute-api.us-east-1.amazonaws.com/dev/rooms/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching room details:', error);
      setError(error.message || 'Error al obtener detalles de la sala');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getRoomDetails,
    loading,
    error
  };
};