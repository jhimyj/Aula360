from abc import ABC, abstractmethod
import anthropic
import logging

from utils.config import ANTHROPIC_API_KEY, MAX_TOKENS_ANTHROPIC

logger = logging.getLogger(__name__)

class LLMStrategy(ABC):
    @abstractmethod
    def prompt(self, prompt: str, **kwargs):
        """Envía el prompt a la IA y retorna la respuesta procesada."""
        NotImplemented()




class LLMClient:
    def __init__(self, strategy: LLMStrategy):
        self.strategy = strategy

    def prompt(self, prompt: str, **kwargs) -> str:
        return self.strategy.prompt(prompt, **kwargs)




class AnthropicStrategy(LLMStrategy):
    def __init__(
        self,
        api_key: str,
        model: str = "claude-3-5-haiku-20241022",
        timeout_seconds: int = 20,
        max_tokens: int = 10,
        temperature: float = 0,
        top_k: int = 250,
        top_p: float = 1
    ):
        self.api_key = api_key
        self.model = model
        self.timeout_seconds = timeout_seconds
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_k = top_k
        self.top_p = top_p
        self.client = anthropic.Anthropic(api_key=self.api_key, timeout=self.timeout_seconds)

    def prompt(self, prompt: str, **kwargs) -> str:
        try:
            logger.info("Invocando el modelo Anthropic (Messages API) con el prompt...")

            effective_max_tokens = kwargs.get('max_tokens', self.max_tokens)

            response = self.client.messages.create(model=self.model,
                                                    messages=[
                                                        {"role": "user", "content": prompt},
                                                    ],
                                                    max_tokens=effective_max_tokens,
                                                    temperature=self.temperature,
                                                    top_k=self.top_k,
                                                    top_p=self.top_p,
                                                )

            generated_text = response.content[0].text.strip()
            logger.info("Respuesta recibida del modelo Anthropic.")
            return generated_text

        except Exception as e:
            logger.exception("Error durante invocación del modelo Anthropic: %s", e)
            raise


def create_anthropic_haiku_client_instance():
    strategy = AnthropicStrategy(api_key=ANTHROPIC_API_KEY, max_tokens=MAX_TOKENS_ANTHROPIC, timeout_seconds=20)
    return LLMClient(strategy=strategy)





