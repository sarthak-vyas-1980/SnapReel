import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function uploadFileToSupabase(
  filePath: string,
  fileName: string,
  contentType: string
) {
  const fileBuffer = fs.readFileSync(filePath);

  const { error } = await supabase.storage
    .from("reels")
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("reels")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
