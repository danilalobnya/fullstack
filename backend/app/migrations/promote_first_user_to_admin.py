from sqlalchemy import create_engine, text

from app.config import settings


def main() -> None:
    """
    Сделать первого найденного пользователя администратором.
    Удобно для лабораторной, чтобы быстро получить admin-аккаунт.
    """
    engine = create_engine(settings.database_url)

    with engine.begin() as conn:
        result = conn.execute(
            text("SELECT id, phone, name, role FROM users ORDER BY id")
        )
        rows = result.mappings().all()

        if not rows:
            print("[PROMOTE] В таблице users нет ни одного пользователя.")
            return

        print("[PROMOTE] Текущие пользователи:")
        for r in rows:
            print(f"  id={r['id']}, phone={r['phone']}, name={r['name']}, role={r['role']}")

        first = rows[0]
        conn.execute(
            text("UPDATE users SET role = 'admin' WHERE id = :id"),
            {"id": first["id"]},
        )

        print()
        print(
            f"[PROMOTE] Пользователь id={first['id']} (phone={first['phone']}) "
            f"назначен администратором (role='admin')."
        )


if __name__ == "__main__":
    main()


