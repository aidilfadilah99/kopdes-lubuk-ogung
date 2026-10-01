import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Helper to get connection string from Vercel Neon environment variables
export function getDatabaseUrl(): string | null {
  return (
    process.env.STORAGE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_PRISMA_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  );
}

export function getDb(): NeonQueryFunction<false, false> | null {
  const url = getDatabaseUrl();
  if (!url) return null;
  return neon(url);
}

/**
 * Pastikan tabel penyimpanan cloud 'app_store' sudah ada di Neon Postgres
 */
export async function initDatabase(): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS app_store (
        key VARCHAR(64) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return true;
  } catch (error) {
    console.error("Gagal menginisialisasi tabel database cloud:", error);
    return false;
  }
}
