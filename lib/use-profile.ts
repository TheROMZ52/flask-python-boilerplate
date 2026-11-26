"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export type Profile = { name: string; telegram: string };

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    supabaseBrowser().auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const meta = data.user.user_metadata || {};
      const fallback = { name: String(meta.full_name || meta.name || ""), telegram: String(meta.telegram || "") };
      try {
        const response = await fetch("/api/account/overview", { cache: "no-store" });
        const result = await response.json();
        if (response.ok && result.ok && result.user) {
          setProfile({ name: String(result.user.name || fallback.name), telegram: String(result.user.telegram || fallback.telegram) });
          return;
        }
      } catch {}
      setProfile(fallback);
    }).catch(() => undefined);
  }, []);
  return profile;
}
