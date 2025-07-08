import boto3
import uuid
import random
import json
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

if not logger.hasHandlers():
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

sqs = boto3.client('sqs')
def send_single_message_to_sqs_fifo(queue_url, message, num_groups):

    group_id = f"group-{random.randint(0, num_groups - 1)}"
    deduplication_id = str(uuid.uuid4())

    logger.info(f"Enviando mensaje a SQS FIFO | GroupID: {group_id} | DedupID: {deduplication_id}")

    try:
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message),
            MessageGroupId=group_id,
            MessageDeduplicationId=deduplication_id
        )
        logger.info(f"Mensaje enviado | MessageId: {response.get('MessageId')}")
        return response
    except Exception as e:
        logger.error(f"Error al enviar mensaje: {e}", exc_info=True)
        raise