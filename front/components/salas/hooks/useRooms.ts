// hooks/useRooms.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface RoomApiResponse {
  user_id: string;
  created_at: string;
  course?: string;
  topic?: string;
  description: string;
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  studentCount: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  color: string;
  course: string;
  topic: string;
  description: string;
}

interface ApiResponse {
  data: {
    rooms: RoomApiResponse[];
    size: number;
    last_evaluated_key: string | null;
  }
}

const ROOM_COLORS = [
  "#4361EE",
  "#3A0CA3", 
  "#7209B7",
  "#F72585",
  "#4CC9F0",
  "#7209B7",
  "#F77F00",
  "#FCBF49"
];

export const useRooms = (pageSize = 10) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);
  const [hasMoreRooms, setHasMoreRooms] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const transformRoomData = (apiRoom: RoomApiResponse, index: number): Room => {
    return {
      id: apiRoom.id,
      name: apiRoom.name,
      studentCount: Math.floor(Math.random() * 10) + 1, // Hardcodeado como solicitaste
      startDate: formatDate(apiRoom.created_at),
      startTime: formatTime(apiRoom.created_at),
      endDate: formatDate(apiRoom.created_at), // Misma fecha para inicio y fin
      endTime: formatTime(apiRoom.created_at),
      color: ROOM_COLORS[index % ROOM_COLORS.length],
      course: apiRoom.course || 'Sin curso',
      topic: apiRoom.topic || 'Sin tema',
      description: apiRoom.description
    };
  };

  const fetchRooms = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
        setLastEvaluatedKey(null);
        setHasMoreRooms(true);
      } else if (isLoadingMore) {
        return;
      } else if (!hasMoreRooms && !refresh) {
        return;
      } else if (!refresh && !loading) {
        setIsLoadingMore(true);
      }

      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Construir URL con parámetros de paginación
      let url = `https://iz6hr4i7m9.execute-api.us-east-1.amazonaws.com/dev/rooms?size=${pageSize}`;
      if (lastEvaluatedKey && !refresh) {
        url += `&last_evaluated_key=${lastEvaluatedKey}`;
      }

      const response = await axios.get<ApiResponse>(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const { rooms: apiRooms, last_evaluated_key } = response.data.data;
      
      // Transformar datos
      const transformedRooms = apiRooms.map((room, index) => 
        transformRoomData(room, refresh ? index : rooms.length + index)
      );

      // Actualizar estado
      if (refresh) {
        setRooms(transformedRooms);
      } else {
        setRooms(prevRooms => [...prevRooms, ...transformedRooms]);
      }

      // Actualizar paginación
      setLastEvaluatedKey(last_evaluated_key || null);
      setHasMoreRooms(!!last_evaluated_key);

    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      setError(error.message || 'Error al cargar las salas');
      
      // Si es la primera carga y hay error, mostrar datos de ejemplo
      if (refresh || rooms.length === 0) {
        setRooms([
          {
            id: "1",
            name: "Sala de Comunicación 1° Grado",
            studentCount: 3,
            startDate: "12/05/2025",
            startTime: "9:00 am",
            endDate: "19/05/2025",
            endTime: "9:00 am",
            color: "#4361EE",
            course: "communication",
            topic: "Comunicación básica",
            description: "Sala para practicar comunicación"
          }
        ]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [lastEvaluatedKey, hasMoreRooms, isLoadingMore, loading, rooms.length, pageSize]);

  // Cargar salas al montar el componente
  useEffect(() => {
    fetchRooms(true);
  }, []);

  // Refrescar salas
  const refetchRooms = () => {
    fetchRooms(true);
  };

  // Cargar más salas (paginación)
  const loadMoreRooms = () => {
    if (!loading && !isLoadingMore && hasMoreRooms) {
      fetchRooms(false);
    }
  };

  return {
    rooms,
    loading,
    error,
    refetchRooms,
    loadMoreRooms,
    hasMoreRooms,
    isLoadingMore
  };
};