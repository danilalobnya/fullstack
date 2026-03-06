from sqlalchemy import create_engine, inspect, text

from app.config import settings


def main() -> None:
  """
  Простая миграция: добавить колонку role в таблицу users, если её ещё нет.

  Колонка:
    role VARCHAR NOT NULL DEFAULT 'user'
  """
  engine = create_engine(settings.database_url)

  with engine.begin() as conn:
    inspector = inspect(conn)

    # Проверяем, есть ли таблица users
    tables = inspector.get_table_names()
    if "users" not in tables:
      print("[MIGRATION] Таблица users не найдена. Нечего мигрировать.")
      return

    # Проверяем, есть ли уже колонка role
    columns = inspector.get_columns("users")
    has_role = any(col["name"] == "role" for col in columns)

    if has_role:
      print("[MIGRATION] Колонка role уже существует. Миграция не требуется.")
      return

    print("[MIGRATION] Добавляем колонку role в таблицу users...")
    conn.execute(
      text("ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT 'user';")
    )
    print("[MIGRATION] Колонка role успешно добавлена.")


if __name__ == "__main__":
  main()


