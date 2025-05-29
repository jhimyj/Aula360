import json
def prompt_recommendation(course, topic, user_prompt: str) -> str:
    prompt = f"""
        Eres un generador de preguntas personalizadas para un curso y tema específicos.

        Información adicional:
        - Curso: {course}
        - Tema: {topic}
        - Guía del usuario: "{user_prompt}"

        Debes generar una lista de preguntas, cada una con la siguiente estructura JSON:

        [
            {{
                "type": "<string: tipo de pregunta - uno de 'MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'OPEN_ENDED'>",
                "text": "<string: enunciado de la pregunta>",
                "score": <int: puntaje de la pregunta (100-1000)>,
                "tags": ["<string>", "<string>", ...],  // Opcional
                "difficulty": "<string: nivel de dificultad - uno de 'EASY', 'MEDIUM', 'HARD'>",
                "config": <dict: configuración específica según el tipo de pregunta>
            }},
            ...
        ]

        Tipos de pregunta permitidos:
        - MULTIPLE_CHOICE_SINGLE: selección única
        - MULTIPLE_CHOICE_MULTIPLE: selección múltiple
        - OPEN_ENDED: respuesta abierta

        Niveles de dificultad permitidos:
        - EASY
        - MEDIUM
        - HARD

        La estructura del campo 'config' depende del tipo de pregunta:

        1️⃣ Para MULTIPLE_CHOICE_SINGLE o MULTIPLE_CHOICE_MULTIPLE:
            "config": {{
                "options": ["<opción1>", "<opción2>", ...]  // mínimo 2, máximo 5 opciones
            }}

        2️⃣ Para OPEN_ENDED:
            "config": {{}}

        ⚠️ La lista final que devuelvas debe ser un JSON válido y único.

        Tu respuesta final debe ser solo ese bloque JSON que contenga la lista de preguntas generadas, sin ningún texto adicional.
        """
    return prompt





def prompt_verify_response(question: dict, response: list) -> str:
    prompt = f"""
        Eres un experto en evaluación de preguntas. Tu tarea es revisar la respuesta del estudiante en función de la pregunta.
        
        📌 La pregunta tiene este formato:
        {{
            "type": "<string: tipo de pregunta - uno de 'MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'OPEN_ENDED'>",
            "text": "<string: enunciado de la pregunta>",
            "score": <int: puntaje de la pregunta (100-1000)>,
            "tags": ["<string>", "<string>", ...],  // Opcional
            "difficulty": "<string: nivel de dificultad - uno de 'EASY', 'MEDIUM', 'HARD'>",
            "config": <dict: configuración específica según el tipo de pregunta>
        }}
        
        📌 La respuesta está en este formato:
        ["<respuesta1>", "<respuesta2>", ...]  (mínimo 1, máximo 5)
        
        📌 Cantidad de respuestas permitidas por tipo de pregunta:
        - MULTIPLE_CHOICE_SINGLE: solo una respuesta
        - MULTIPLE_CHOICE_MULTIPLE: hasta cinco respuestas
        - OPEN_ENDED: una respuesta abierta
        
        📌 La estructura del campo 'config' depende del tipo de pregunta:
        1️⃣ Para MULTIPLE_CHOICE_SINGLE o MULTIPLE_CHOICE_MULTIPLE:
        "config": {{
            "options": ["<opción1>", "<opción2>", ...]  // mínimo 2, máximo 5 opciones
        }}
        
        2️⃣ Para OPEN_ENDED:
        "config": {{}}
        
        ✅ Debes devolver un JSON válido con esta estructura:
        {{
            "score": <int: puntaje otorgado a la respuesta; para selección única (MULTIPLE_CHOICE_SINGLE) debe ser 0 o el score completo>,
            "feedback": "<string: recomendación de mejora de forma asertiva; si la respuesta es correcta, felicítalo>"
        }}
        
        A continuación, te proporciono la pregunta y la respuesta del estudiante:
        
        📌 Pregunta:
        {json.dumps(question)}
        
        📌 Respuesta:
        {json.dumps(response)}
        
        Por favor, devuelve únicamente ese bloque JSON con la evaluación del score y el feedback, sin ningún texto adicional.
        """
    return prompt
