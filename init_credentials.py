from auth_storage import create_default_credentials, credentials_exist, ensure_secret_set, save_credentials


def main() -> None:
    try:
        ensure_secret_set()
    except ValueError as error:
        print(error)
        raise SystemExit(1)

    if credentials_exist():
        print("O arquivo de credenciais já existe em data/credentials.enc.")
        print("Use outro segredo ou remova o arquivo para recriá-lo.")
        return

    save_credentials(create_default_credentials())
    print("Arquivo de credenciais criado com sucesso em data/credentials.enc.")
    print("Usuário padrão: admin / senha: 123456")


if __name__ == "__main__":
    main()
