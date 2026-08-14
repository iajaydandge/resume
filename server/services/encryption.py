import base64

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from server.config import settings


def get_public_key():
    if not settings.RSA_PUBLIC_KEY:
        raise ValueError("RSA_PUBLIC_KEY is not configured in the environment.")
    return serialization.load_pem_public_key(settings.RSA_PUBLIC_KEY.encode("utf-8"))


def get_private_key():
    if not settings.RSA_PRIVATE_KEY:
        raise ValueError("RSA_PRIVATE_KEY is not configured in the environment.")
    return serialization.load_pem_private_key(settings.RSA_PRIVATE_KEY.encode("utf-8"), password=None)


def get_public_key_pem() -> str:
    if not settings.RSA_PUBLIC_KEY:
        raise ValueError("RSA_PUBLIC_KEY is not configured in the environment.")
    return settings.RSA_PUBLIC_KEY


def decrypt_api_key(encrypted_key: str) -> str:
    if not encrypted_key:
        return ""
    private_key = get_private_key()
    ciphertext = base64.b64decode(encrypted_key.encode("utf-8"))
    plaintext = private_key.decrypt(
        ciphertext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return plaintext.decode("utf-8")
