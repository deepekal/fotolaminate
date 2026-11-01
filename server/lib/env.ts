import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 8787),
  supabasePoolerConnectionString: process.env.SUPABASE_POOLER_CONNECTION_STRING ?? "",
  imgbbApiKey: process.env.IMGBB_API_KEY ?? "",
  adminToken: process.env.ADMIN_TOKEN ?? "",
  adminUsername: process.env.ADMIN_USERNAME ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
};

export function requireEnv(value: string, name: string) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}
