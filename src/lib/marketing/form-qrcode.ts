import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { QR_BUCKET, publicFormUrl } from "@/lib/constants/marketing-events";

/**
 * Gera o QR Code (PNG 1024×1024, correção M, quiet zone para impressão) da
 * URL pública do formulário e salva no bucket privado, sobrescrevendo o
 * arquivo existente — usado na criação e na rotação de token.
 */
export async function generateAndStoreFormQr(
  formId: string,
  slug: string,
  token: string,
): Promise<string> {
  const url = publicFormUrl(slug, token);
  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "M",
  });

  const path = `forms/${formId}/qrcode.png`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(QR_BUCKET).upload(path, png, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw new Error(`Falha ao salvar QR Code: ${error.message}`);
  return path;
}

/** Signed URL (1h) para exibir/baixar o QR no app autenticado. */
export async function getQrSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(QR_BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
