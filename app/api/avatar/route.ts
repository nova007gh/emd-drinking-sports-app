import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 2MB" }, { status: 400 });

    // Get the authenticated user from the server-side client (uses cookies)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Use service role key to bypass RLS for storage upload + profile update
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({ error: "Server not configured for avatar uploads" }, { status: 500 });
    }

    const admin = createServiceClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await admin.storage.from("avatars").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: { publicUrl } } = admin.storage.from("avatars").getPublicUrl(path);

    // Add cache-busting query param so the browser fetches the new image instead of using cached version
    const cacheBustUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await admin
      .from("profiles")
      .update({ avatar_url: cacheBustUrl })
      .eq("id", user.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ url: cacheBustUrl });
  } catch {
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}
