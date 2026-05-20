import { META_GRAPH_API_VERSION } from "@/lib/constants/marketing";
import { MetaApiError, parseMetaError } from "@/lib/integrations/meta/errors";

const BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

export async function metaGet<T>(
  path: string,
  token: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("access_token", token);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  const json = (await res.json()) as T & { error?: { message: string; code: number } };
  if (!res.ok || (json as { error?: { message: string } }).error) {
    const msg =
      (json as { error?: { message: string } }).error?.message ?? res.statusText;
    const parsed = parseMetaError(new Error(`(${res.status}) ${msg}`));
    throw new MetaApiError(msg, parsed);
  }
  return json;
}

export async function metaPost<T>(
  path: string,
  token: string,
  body: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("access_token", token);
  const form = new URLSearchParams(body);
  const res = await fetch(url.toString(), { method: "POST", body: form });
  const json = (await res.json()) as T & { error?: { message: string } };
  if (!res.ok || (json as { error?: { message: string } }).error) {
    const msg =
      (json as { error?: { message: string } }).error?.message ?? res.statusText;
    const parsed = parseMetaError(new Error(msg));
    throw new MetaApiError(msg, parsed);
  }
  return json;
}

export async function metaDelete(
  path: string,
  token: string,
): Promise<{ success: boolean }> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString(), { method: "DELETE" });
  const json = (await res.json()) as { success?: boolean; error?: { message: string } };
  if (!res.ok || json.error) {
    const msg = json.error?.message ?? res.statusText;
    throw new MetaApiError(msg, parseMetaError(new Error(msg)));
  }
  return { success: json.success ?? true };
}
