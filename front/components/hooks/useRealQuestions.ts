import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export type QuestionType = 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTIPLE' | 'OPEN_ENDED';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface Question {
  id?: string;
  room_id: string;
  type: QuestionType;
  text: string;
  score: number;
  difficulty: DifficultyLevel;
  config: {
    options?: string[];
  };
  tags?: string[];
}

interface CreateQuestionRequest {
  type: QuestionType;
  text: string;
  score: number;
  tags?: string[];
  difficulty: DifficultyLevel;
  config: {
    options?: string[];
  };
}

interface APIResponse {
  success: boolean;
  code: string;
  message: string;
  data: any;
  request_id: string;
}

export const useQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuestion = async (roomId: string, questionData: CreateQuestionRequest): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await axios.post<APIResponse>(
        `https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/room/${roomId}`,
        questionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return response.data.data.id;
      } else {
        throw new Error(response.data.message || 'Error al crear pregunta');
      }
    } catch (error: any) {
      console.error('Error creating question:', error);
      setError(error.response?.data?.message || error.message || 'Error al crear pregunta');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createQuestionsList = async (roomId: string, questions: CreateQuestionRequest[]): Promise<string[] | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const questionIds: string[] = [];

      for (const questionData of questions) {
        const response = await axios.post<APIResponse>(
          `https://fmrdkboi63.execute-api.us-east-1.amazonaws.com/dev/questions/room/${roomId}`,
          questionData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          questionIds.push(response.data.data.id);
        } else {
          throw new Error(response.data.message || 'Error al crear pregunta');
        }
      }

      return questionIds;
    } catch (error: any) {
      console.error('Error creating questions list:', error);
      setError(error.response?.data?.message || error.message || 'Error al crear preguntas');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createQuestion,
    createQuestionsList,
    loading,
    error
  };
};
