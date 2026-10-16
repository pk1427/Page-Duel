import { getSupabase } from "./supabase";

export type PublishAction = "upload" | "validate" | "publish" | "unpublish";

/** Calls the Edge Function; the browser supplies an access token, never a privileged key. */
export async function secureBookPublish(action: PublishAction, payload: Record<string, unknown>) {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured.");
  const { data: session } = await client.auth.getSession();
  if (!session.session?.access_token) throw new Error("Your admin session has expired.");
  const { data, error } = await client.functions.invoke("book-publish", {
    body: { action, ...payload }, headers: { Authorization: `Bearer ${session.session.access_token}` },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.errors?.join(" ") || data.error);
  return data as Record<string, unknown>;
}
