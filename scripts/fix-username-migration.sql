-- SADECE Username kolonu VAR ama index/data bozuksa kullan
-- Yeni boş DB için KULLANMA — bunun yerine: dotnet ef database update

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'Username'
  ) THEN
    UPDATE "Users" SET "Username" = 'admin' WHERE "Email" = 'admin@loracoffee.com';
    UPDATE "Users" SET "Username" = 'manager' WHERE "Email" = 'manager@loracoffee.com';
    UPDATE "Users" SET "Username" = 'kasiyer' WHERE "Email" = 'cashier@loracoffee.com';
    UPDATE "Users" SET "Username" = 'barista' WHERE "Email" = 'barista@loracoffee.com';
    UPDATE "Users" SET "Username" = split_part("Email", '@', 1)
    WHERE "Username" IS NULL OR "Username" = '';

    CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username");

    RAISE NOTICE 'Username verileri düzeltildi.';
  ELSE
    RAISE NOTICE 'Username kolonu yok — bu script gerekli değil. dotnet ef database update çalıştır.';
  END IF;
END $$;
