import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UnitsPreference = Profile["units_pref"];

export type AccountSettings = {
  userId: string;
  email: string | null;
  profile: Profile | null;
};
