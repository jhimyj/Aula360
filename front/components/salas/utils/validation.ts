export interface RoomFormData {
  roomName: string;
  description: string;
  course: string;
  topic: string;
}

export interface FormErrors {
  roomName: string;
  description: string;
  course: string;
  topic: string;
}

export const validateRoomForm = (data: RoomFormData): FormErrors => {
  const errors: FormErrors = {
    roomName: '',
    description: '',
    course: '',
    topic: ''
  };
  
  let isValid = true;

  if (!data.roomName.trim()) {
    errors.roomName = 'El nombre de la sala es requerido';
    isValid = false;
  }

  if (!data.description.trim()) {
    errors.description = 'La descripción es requerida';
    isValid = false;
  } else if (data.description.length < 10) {
    errors.description = 'La descripción debe tener al menos 10 caracteres';
    isValid = false;
  }

  if (!data.course.trim()) {
    errors.course = 'El curso es requerido';
    isValid = false;
  }

  if (!data.topic.trim()) {
    errors.topic = 'El tema es requerido';
    isValid = false;
  }

  return { errors, isValid };
};