import base64
import hashlib
import hmac
import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
CREDENTIAL_FILE = DATA_DIR / "credentials.enc"
ENV_SECRET_NAME = "AUTH_SECRET"
DEFAULT_USER = {
    "admin": {
        "email": "admin@example.com",
        "password": "123456"
    }
}


def _derive_keys(secret: str) -> tuple[bytes, bytes]:
    raw = secret.encode("utf-8")
    enc_key = hashlib.pbkdf2_hmac("sha256", raw, b"scrumway_auth_enc", 200_000, dklen=32)
    mac_key = hashlib.pbkdf2_hmac("sha256", raw, b"scrumway_auth_mac", 200_000, dklen=32)
    return enc_key, mac_key


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return base64.b64encode(salt + derived).decode("utf-8")


def _verify_password(password: str, stored: str) -> bool:
    decoded = base64.b64decode(stored.encode("utf-8"))
    salt = decoded[:16]
    key = decoded[16:]
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return hmac.compare_digest(derived, key)


def _get_secret() -> str:
    secret = os.environ.get(ENV_SECRET_NAME)
    if not secret:
        raise ValueError(
            f"Defina a variável de ambiente {ENV_SECRET_NAME} antes de usar o arquivo de credenciais."
        )
    return secret


def _keystream(key: bytes, iv: bytes, length: int) -> bytes:
    counter = 0
    stream = bytearray()
    while len(stream) < length:
        block = hmac.new(key, iv + counter.to_bytes(8, "big"), hashlib.sha256).digest()
        stream.extend(block)
        counter += 1
    return bytes(stream[:length])


def _encrypt_payload(data: dict) -> bytes:
    secret = _get_secret()
    enc_key, mac_key = _derive_keys(secret)
    plaintext = json.dumps(data, ensure_ascii=False).encode("utf-8")
    iv = os.urandom(16)
    stream = _keystream(enc_key, iv, len(plaintext))
    ciphertext = bytes(a ^ b for a, b in zip(plaintext, stream))
    mac = hmac.new(mac_key, iv + ciphertext, hashlib.sha256).digest()
    return iv + mac + ciphertext


def _decrypt_payload(payload: bytes) -> dict:
    secret = _get_secret()
    enc_key, mac_key = _derive_keys(secret)
    iv = payload[:16]
    mac = payload[16:48]
    ciphertext = payload[48:]
    expected_mac = hmac.new(mac_key, iv + ciphertext, hashlib.sha256).digest()
    if not hmac.compare_digest(mac, expected_mac):
        raise ValueError("Falha na validação do arquivo de credenciais. Verifique se AUTH_SECRET está correto.")
    stream = _keystream(enc_key, iv, len(ciphertext))
    plaintext = bytes(a ^ b for a, b in zip(ciphertext, stream))
    return json.loads(plaintext.decode("utf-8"))


def create_default_credentials() -> dict:
    return {
        "users": {
            "admin": {
                "email": DEFAULT_USER["admin"]["email"],
                "passwordHash": _hash_password(DEFAULT_USER["admin"]["password"])
            }
        }
    }


def credentials_exist() -> bool:
    return CREDENTIAL_FILE.exists()


def save_credentials(payload: dict) -> None:
    _ensure_data_dir()
    encrypted = _encrypt_payload(payload)
    CREDENTIAL_FILE.write_bytes(encrypted)


def load_credentials() -> dict | None:
    if not credentials_exist():
        return None
    raw = CREDENTIAL_FILE.read_bytes()
    return _decrypt_payload(raw)


def add_user(username: str, email: str, password: str) -> None:
    credentials = load_credentials() or {"users": {}}
    if username in credentials["users"]:
        raise ValueError(f"O usuário '{username}' já existe.")
    credentials["users"][username] = {
        "email": email,
        "passwordHash": _hash_password(password)
    }
    save_credentials(credentials)


def validate_user(username: str, password: str) -> bool:
    credentials = load_credentials()
    if not credentials or username not in credentials["users"]:
        return False
    stored = credentials["users"][username]["passwordHash"]
    return _verify_password(password, stored)


def ensure_secret_set() -> None:
    if os.environ.get(ENV_SECRET_NAME) is None:
        raise ValueError(
            f"A variável de ambiente {ENV_SECRET_NAME} não está definida. Copie .env.example para .env ou defina o valor manualmente."
        )
