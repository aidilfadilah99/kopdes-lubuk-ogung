import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Helper to get connection string from Vercel Neon environment variables
export function getDatabaseUrl(): string | null {
  if (process.env.STORAGE_URL) return process.env.STORAGE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.STORAGE_PRISMA_URL) return process.env.STORAGE_PRISMA_URL;
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
  if (process.env.STORAGE_URL_NON_POOLING) return process.env.STORAGE_URL_NON_POOLING;
  if (process.env.POSTGRES_URL_NON_POOLING) return process.env.POSTGRES_URL_NON_POOLING;

  // Deteksi otomatis jika Vercel menggunakan nama prefix custom
  for (const [key, val] of Object.entries(process.env)) {
    if (
      typeof val === "string" &&
      (val.startsWith("postgres://") || val.startsWith("postgresql://"))
    ) {
      return val;
    }
  }

  return null;
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
