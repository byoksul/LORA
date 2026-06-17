-- Yeni/bozuk migration history için: EF migration'ları sıfırdan uygula
-- Çalıştır: docker exec -i lora-postgres psql -U loracoffee -d loracoffee < scripts/reset-migration-history.sql
-- Sonra: cd backend/LoraCoffee.API && dotnet ef database update --project ../LoraCoffee.Infrastructure

DELETE FROM "__EFMigrationsHistory"
WHERE "MigrationId" = '20260616111740_AddUsernameToUsers';

-- Eğer tablolar da yoksa / tam reset istiyorsan aşağıdaki satırları kullan:
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO loracoffee;
-- GRANT ALL ON SCHEMA public TO public;
