import base64
import io
from PyPDF2 import PdfReader

def extract_text_from_base64_pdf(base64_str):
    """
    Extrae el texto de un PDF codificado en base64.
    """
    try:
        pdf_bytes = base64.b64decode(base64_str)
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)

        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        raise ValueError(f"No se pudo extraer el texto del PDF: {e}")


