import { NextResponse } from "next/server";
import { getDb, initDatabase } from "@/lib/db";
import {
  initialConfig,
  initialUsers,
  initialMembers,
  initialSavings,
  initialLoans,
  initialInstallments,
  initialAuditLogs,
  initialProducts,
  initialSales,
} from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const SEED_DATA: Record<string, any> = {
  config: initialConfig,
  users: initialUsers,
  members: initialMembers,
  savings: initialSavings,
  loans: initialLoans,
  installments: initialInstallments,
  audit_logs: initialAuditLogs,
  products: initialProducts,
  sales: initialSales,
};

export async function GET(req: Request) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      success: false,
      message: "Database belum terkonfigurasi. Menggunakan penyimpanan lokal.",
      isCloud: false,
    });
  }

  const { searchParams } = new URL(req.url);
  const targetKey = searchParams.get("key");

  try {
    await initDatabase();

    if (targetKey) {
      const rows = await sql`SELECT key, value FROM app_store WHERE key = ${targetKey};`;
      if (rows.length > 0) {
        return NextResponse.json({
          success: true,
          data: rows[0].value,
          isCloud: true,
        });
      } else if (SEED_DATA[targetKey]) {
        const defaultVal = SEED_DATA[targetKey];
        await sql`
          INSERT INTO app_store (key, value, updated_at)
          VALUES (${targetKey}, ${JSON.stringify(defaultVal)}::jsonb, NOW())
          ON CONFLICT (key) DO NOTHING;
        `;
        return NextResponse.json({
          success: true,
          data: defaultVal,
          isCloud: true,
        });
      }
      return NextResponse.json({ success: false, message: "Key not found" }, { status: 404 });
    }

    const rows = await sql`SELECT key, value FROM app_store;`;
    const dataMap: Record<string, any> = {};

    for (const row of rows) {
      dataMap[row.key] = row.value;
    }

    // Seed missing keys automatically
    for (const [key, defaultVal] of Object.entries(SEED_DATA)) {
      if (!dataMap[key]) {
        await sql`
          INSERT INTO app_store (key, value, updated_at)
          VALUES (${key}, ${JSON.stringify(defaultVal)}::jsonb, NOW())
          ON CONFLICT (key) DO NOTHING;
        `;
        dataMap[key] = defaultVal;
      }
    }

    return NextResponse.json({
      success: true,
      data: dataMap,
      isCloud: true,
    });
  } catch (error: any) {
    console.error("Gagal mengambil data dari database cloud:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Database error", isCloud: false },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      success: false,
      message: "Database URL tidak ditemukan di environment.",
      isCloud: false,
    });
  }

  try {
    await initDatabase();
    const body = await req.json();

    if (body.key && body.value !== undefined) {
      const valJson = JSON.stringify(body.value);
      await sql`
        INSERT INTO app_store (key, value, updated_at)
        VALUES (${body.key}, ${valJson}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE 
        SET value = ${valJson}::jsonb, updated_at = NOW();
      `;
      return NextResponse.json({ success: true, isCloud: true });
    }

    if (body.bulk && typeof body.bulk === "object") {
      for (const [key, value] of Object.entries(body.bulk)) {
        const valJson = JSON.stringify(value);
        await sql`
          INSERT INTO app_store (key, value, updated_at)
          VALUES (${key}, ${valJson}::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE 
          SET value = ${valJson}::jsonb, updated_at = NOW();
        `;
      }
      return NextResponse.json({ success: true, isCloud: true });
    }

    return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
  } catch (error: any) {
    console.error("Gagal menyimpan ke database cloud:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Database write error" },
      { status: 500 }
    );
  }
}
