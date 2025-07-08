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

        La lista final que devuelvas debe ser un JSON válido y único.

        Tu respuesta final debe ser solo ese bloque JSON que contenga la lista de preguntas generadas (maximo 3), sin ningún texto adicional.
        """
    return prompt


def prompt_recommendation_pdf(course, topic, text: str) -> str:
    prompt = f"""
        Eres un generador de preguntas personalizadas para un curso y tema específicos.

        Información adicional:
        - Curso: {course}
        - Tema: {topic}
        - A continuación, se presenta el texto de referencia que debe utilizarse para generar las preguntas: "{text}"

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

        La lista final que devuelvas debe ser un JSON válido y único.

        Tu respuesta final debe ser solo ese bloque JSON que contenga la lista de preguntas generadas (maximo 3), sin ningún texto adicional.
        """
    return prompt



def prompt_recommendation_with_number(course, topic, user_prompt: str, number_questions: int) -> str:
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

        La lista final que devuelvas debe ser un JSON válido y único.
        Debes generar exactamente {number_questions} preguntas.
        Tu respuesta final debe ser solo ese bloque JSON que contenga la lista de preguntas generadas, sin ningún texto adicional.
        """
    return prompt





