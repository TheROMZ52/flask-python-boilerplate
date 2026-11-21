"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export type Profile = { name: string; telegram: string };

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const meta = data.user.user_metadata || {};
      setProfile({ name: String(meta.full_name || meta.name || ""), telegram: String(meta.telegram || "") });
    }).catch(() => undefined);
  }, []);
  return profile;
}
