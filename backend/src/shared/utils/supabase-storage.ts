import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { AppError } from "./app-error.js";
import { HTTP_STATUS } from "../constants/http-status.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "card-attachments";

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new AppError(
      "Supabase storage is not configured",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const createSignedUploadUrl = async (cardId: string, filename: string) => {
  const supabase = getSupabaseClient();
  const storagePath = `${cardId}/${randomUUID()}-${filename}`;

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new AppError(
      error?.message ?? "Failed to create signed upload URL",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return {
    signedUrl: data.signedUrl,
    storagePath,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
};

export const deleteObject = async (storagePath: string) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage.from(storageBucket).remove([storagePath]);

  if (error) {
    throw new AppError(
      error.message ?? "Failed to delete storage object",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getPublicUrl = (storagePath: string) => {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(storageBucket).getPublicUrl(storagePath);
  return data.publicUrl;
};
