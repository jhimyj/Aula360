
import boto3
import json
from botocore.config import Config

from utils.config import MAX_TOKENS_NOVA, MODEL_IA_NOVA

class LLMStrategy:
    def build_payload(self, prompt, **kwargs):
        raise NotImplementedError

    def parse_response(self, response_body):
        raise NotImplementedError


class NovaStrategy(LLMStrategy):
    def __init__(self, max_tokens=10):
        self.max_tokens = max_tokens

    def build_payload(self, prompt, **kwargs):
        return {
            "inferenceConfig": {
                "max_new_tokens": kwargs.get("max_tokens", self.max_tokens)
            },
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]

        }

    def parse_response(self, response_body):
        return response_body["output"]["message"]["content"][0]["text"]



class BedrockLLMClient:
    def __init__(self, model_id, strategy, region="us-east-1", connect_timeout=5, timeout=10):
        self.model_id = model_id
        self.strategy = strategy
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=region,
            config=Config(connect_timeout=connect_timeout, read_timeout=timeout),
        )

    def prompt(self, user_input, **kwargs):
        payload = self.strategy.build_payload(user_input, **kwargs)
        response = self.client.invoke_model(
            modelId=self.model_id,
            body=json.dumps(payload),
            contentType="application/json",
            accept="application/json",
        )
        body = json.loads(response["body"].read())
        return self.strategy.parse_response(body)


def create_new_nova_client_instance():
    strategy = NovaStrategy(max_tokens=MAX_TOKENS_NOVA)
    return BedrockLLMClient(model_id=MODEL_IA_NOVA, strategy=strategy, timeout=60)






