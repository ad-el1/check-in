export type Role = "admin" | "checkin" | "restauration";

export interface Member {
  id: string;
  cne: string;
  nom: string;
  prenom: string;
  filiere: string | null;
  active: boolean;
  created_at: string;
}

export interface Checkin {
  id: string;
  member_id: string;
  day: number;
  checked_at: string;
  method: "qr" | "manual";
}

export interface Meal {
  id: string;
  member_id: string;
  day: number;
  breakfast: boolean;
  breakfast_at: string | null;
  lunch: boolean;
  lunch_at: string | null;
}

export interface QrToken {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
}

export type MealType = "breakfast" | "lunch";

/** Ligne de présence enrichie avec les infos membre (jointure). */
export interface CheckinRow {
  id: string;
  day: number;
  checked_at: string;
  method: "qr" | "manual";
  member_id: string;
  cne: string;
  nom: string;
  prenom: string;
  filiere: string | null;
}

/** Membre présent + état repas du jour (pour la restauration). */
export interface PresentMealRow {
  member_id: string;
  cne: string;
  nom: string;
  prenom: string;
  filiere: string | null;
  checked_at: string;
  breakfast: boolean;
  lunch: boolean;
}

export interface CheckinApiError {
  error: string;
  code: "TOKEN_EXPIRED" | "TOKEN_INVALID" | "CNE_UNKNOWN" | "ALREADY_CHECKED" | "BAD_REQUEST" | "SERVER_ERROR";
}

export interface CheckinApiSuccess {
  success: true;
  member: { prenom: string; nom: string };
  day: number;
}
