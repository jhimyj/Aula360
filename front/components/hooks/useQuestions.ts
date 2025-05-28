// hooks/useQuestionsUpdated.ts
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Tipos existentes...
export type QuestionType = 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTIPLE' | 'OPEN_ENDED';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionConfig {
  options?: string[];
}

export interface Question {
  id?: string;
  room_id: string;
  type: QuestionType;
  text: string;
  score: number;
  tags?: string[];
  difficulty: DifficultyLevel;
  config: QuestionConfig;
  created_at?: string;
  updated_at?: string;
}

// Nuevos tipos para IA
interface AIRecommendationRequest {
  room_id: string;
  user_prompt: string;
}

interface AIQuestion {
  type: QuestionType;
  text: string;
  score: number;
  tags?: string[];
  difficulty: DifficultyLevel;
  config: {
    options?: string[];
  };
}

interface AIRecommendationResponse {
  success: boolean;
  code: string;
  message: string;
  data: AIQuestion[];
  request_id: string;
}

// Interfaces existentes...
interface CreateQuestionResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    id: string;
  };
  request_id: string;
}

interface CreateQuestionsListResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    question_ids: string[];
  };
  request_id: string;
}

interface GetQuestionsResponse {
  success: boolean;
  code: string;
  message: string;
  data: Question[];
  request_id: string;
}

export const useQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nueva función para generar recomendaciones con IA
  const generateAIRecommendations = async (roomId: string, userPrompt: string): Promise<AIQuestion[] | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const payload: AIRecommendationRequest = {
        room_id: roomId,
        user_prompt: userPrompt
      };

      const response = await axios.post<AIRecommendationResponse>(
        'https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/room/recommendation_ia',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al generar recomendaciones');
      }
    } catch (error: any) {
      console.error('Error generating AI recommendations:', error);
      setError(error.response?.data?.message || error.message || 'Error al generar recomendaciones con IA');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Funciones existentes...
  const createQuestion = async (question: Question): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await axios.post<CreateQuestionResponse>(
        'https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/create',
        question,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.id;
    } catch (error: any) {
      console.error('Error creating question:', error);
      setError(error.response?.data?.message || error.message || 'Error al crear la pregunta');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createQuestionsList = async (roomId: string, questions: Omit<Question, 'room_id'>[]): Promise<string[] | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const payload = {
        room_id: roomId,
        questions: questions
      };

      const response = await axios.post<CreateQuestionsListResponse>(
        'https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/create/list',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.question_ids;
    } catch (error: any) {
      console.error('Error creating questions list:', error);
      setError(error.response?.data?.message || error.message || 'Error al crear las preguntas');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getQuestionsByRoom = async (roomId: string): Promise<Question[] | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await axios.get<GetQuestionsResponse>(
        `https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/all/room/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      setError(error.response?.data?.message || error.message || 'Error al obtener las preguntas');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getQuestion = async (questionId: string, roomId: string): Promise<Question | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await axios.get<any>(
        `https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/${questionId}/room/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching question:', error);
      setError(error.response?.data?.message || error.message || 'Error al obtener la pregunta');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createQuestion,
    createQuestionsList,
    getQuestionsByRoom,
    getQuestion,
    generateAIRecommendations, // Nueva función exportada
  };
};