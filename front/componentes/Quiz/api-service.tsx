// API service for handling feedback generation
export interface FeedbackResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    score: number;
    feedback: string;
  };
  request_id: string;
}

export interface SubmitResponseRequest {
  room_id: string;
  question_id: string;
  response_student: string[];
}

export class ApiService {
  private static readonly BASE_URL = 'https://6axx5kevpc.execute-api.us-east-1.amazonaws.com/dev';
  
  static async submitResponse(request: SubmitResponseRequest): Promise<FeedbackResponse> {
    try {
      // Get token from localStorage (you might need to adjust this based on your storage method)
      const token = localStorage.getItem('authToken'); // Adjust key as needed
      
      const response = await fetch(`${this.BASE_URL}/responses/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FeedbackResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  }
}
