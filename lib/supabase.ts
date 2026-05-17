import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";

// Public client — for frontend usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — for server-side operations (bypasses RLS)
// Uses SERVICE_ROLE_KEY, never expose to browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET = "uploads";

/**
 * Uploads a File object to Supabase Storage and returns the public URL.
 *
 * @param file   - The File object from FormData
 * @param folder - Sub-folder inside the bucket (e.g. "donations", "items", "proofs", "upcycles")
 * @returns      - The public URL of the uploaded file
 */
export async function uploadToSupabase(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitize original filename and prepend UUID to avoid collisions
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniquePrefix = crypto.randomUUID();
  const fileName = `${folder}/${uniquePrefix}-${safeName}`;

  // Local fallback if Supabase is not configured
  if (supabaseUrl === "https://placeholder.supabase.co" || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("Supabase not configured. Falling back to local upload...");
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, `${uniquePrefix}-${safeName}`);
    await writeFile(filePath, buffer);
    
    // Return local API route URL to prevent Next.js dev caching 404s
    return `/api/uploads/${folder}/${uniquePrefix}-${safeName}`;
  }

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // Build and return the permanent public URL
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}