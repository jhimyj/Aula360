from typing import Optional
def extract_delimited_text(text: str, char_start: str, char_end: str) -> Optional[str]:
    """
    Extrae de forma eficiente un bloque de texto delimitado dentro de 'text',
    usando los caracteres de inicio y fin proporcionados.
    """
    if not text or not char_start or not char_end:
        return None  # Validación de entrada

    start = text.find(char_start)
    end = text.rfind(char_end)

    if start == -1 or end == -1 or end <= start:
        return None

    return text[start:end + 1]

