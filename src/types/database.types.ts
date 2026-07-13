// Generated manually for v1 (single profiles table).
// Will be regenerated via `supabase gen types` once CLI auth is configured.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          exercise_type: "strength" | "cardio" | "mobility" | "plyometric";
          muscle_groups: string[];
          equipment: string[];
          technique: string | null;
          image_url: string | null;
          image_prompt: string | null;
          substitute_ids: string[];
          is_seed: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          exercise_type: "strength" | "cardio" | "mobility" | "plyometric";
          muscle_groups?: string[];
          equipment?: string[];
          technique?: string | null;
          image_url?: string | null;
          image_prompt?: string | null;
          substitute_ids?: string[];
          is_seed?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          exercise_type?: "strength" | "cardio" | "mobility" | "plyometric";
          muscle_groups?: string[];
          equipment?: string[];
          technique?: string | null;
          image_url?: string | null;
          image_prompt?: string | null;
          substitute_ids?: string[];
          is_seed?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          mesocycle_weeks: number;
          current_week: number;
          current_week_started_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          mesocycle_weeks?: number;
          current_week?: number;
          current_week_started_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          mesocycle_weeks?: number;
          current_week?: number;
          current_week_started_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_templates: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          name: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          name: string;
          position: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          name?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_template_exercises: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          exercise_id: string;
          position: number;
          prescribed_sets: number;
          reps_min: number;
          reps_max: number;
          target_rpe: number | null;
          rest_seconds: number;
          is_warmup: boolean;
          superset_with_position: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          exercise_id: string;
          position: number;
          prescribed_sets: number;
          reps_min: number;
          reps_max: number;
          target_rpe?: number | null;
          rest_seconds?: number;
          is_warmup?: boolean;
          superset_with_position?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string;
          exercise_id?: string;
          position?: number;
          prescribed_sets?: number;
          reps_min?: number;
          reps_max?: number;
          target_rpe?: number | null;
          rest_seconds?: number;
          is_warmup?: boolean;
          superset_with_position?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_schedule_slots: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          day_of_week: number;
          template_id: string | null;
          activity_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          day_of_week: number;
          template_id?: string | null;
          activity_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          day_of_week?: number;
          template_id?: string | null;
          activity_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          date: string;
          status: "planned" | "in_progress" | "completed" | "skipped";
          started_at: string | null;
          ended_at: string | null;
          duration_min: number | null;
          overall_rpe: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          date?: string;
          status?: "planned" | "in_progress" | "completed" | "skipped";
          started_at?: string | null;
          ended_at?: string | null;
          duration_min?: number | null;
          overall_rpe?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string | null;
          date?: string;
          status?: "planned" | "in_progress" | "completed" | "skipped";
          started_at?: string | null;
          ended_at?: string | null;
          duration_min?: number | null;
          overall_rpe?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercise_set_logs: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          reps: number | null;
          weight_kg: number | null;
          duration_sec: number | null;
          rpe: number | null;
          is_pr: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          reps?: number | null;
          weight_kg?: number | null;
          duration_sec?: number | null;
          rpe?: number | null;
          is_pr?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          exercise_id?: string;
          set_number?: number;
          reps?: number | null;
          weight_kg?: number | null;
          duration_sec?: number | null;
          rpe?: number | null;
          is_pr?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_tips: {
        Row: {
          id: string;
          user_id: string | null;
          category: "sleep" | "stress" | "recovery" | "nutrition" | "mobility" | "supplement" | "other";
          context: string[];
          title: string;
          content: string;
          priority: number;
          is_seed: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          category: "sleep" | "stress" | "recovery" | "nutrition" | "mobility" | "supplement" | "other";
          context?: string[];
          title: string;
          content: string;
          priority?: number;
          is_seed?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          category?: "sleep" | "stress" | "recovery" | "nutrition" | "mobility" | "supplement" | "other";
          context?: string[];
          title?: string;
          content?: string;
          priority?: number;
          is_seed?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_tip_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          tip_id: string;
          status: "shown" | "done" | "skipped";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          tip_id: string;
          status?: "shown" | "done" | "skipped";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          tip_id?: string;
          status?: "shown" | "done" | "skipped";
          created_at?: string;
        };
        Relationships: [];
      };
      supplements: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string | null;
          form: "capsula" | "tableta" | "polvo" | "liquido" | "softgel";
          dose_amount: number;
          dose_unit: "mg" | "g" | "mcg" | "IU" | "ml";
          category: "vitamina" | "mineral" | "aminoacido" | "herb" | "probiotico" | "omega" | "otro";
          notes: string | null;
          active: boolean;
          is_seed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand?: string | null;
          form: "capsula" | "tableta" | "polvo" | "liquido" | "softgel";
          dose_amount: number;
          dose_unit: "mg" | "g" | "mcg" | "IU" | "ml";
          category: "vitamina" | "mineral" | "aminoacido" | "herb" | "probiotico" | "omega" | "otro";
          notes?: string | null;
          active?: boolean;
          is_seed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          brand?: string | null;
          form?: "capsula" | "tableta" | "polvo" | "liquido" | "softgel";
          dose_amount?: number;
          dose_unit?: "mg" | "g" | "mcg" | "IU" | "ml";
          category?: "vitamina" | "mineral" | "aminoacido" | "herb" | "probiotico" | "omega" | "otro";
          notes?: string | null;
          active?: boolean;
          is_seed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplement_schedules: {
        Row: {
          id: string;
          supplement_id: string;
          user_id: string;
          time_of_day: "ayunas" | "desayuno" | "cena" | "noche" | "antes_dormir";
          days_of_week: number[];
          reminder: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplement_id: string;
          user_id: string;
          time_of_day: "ayunas" | "desayuno" | "cena" | "noche" | "antes_dormir";
          days_of_week?: number[];
          reminder?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplement_id?: string;
          user_id?: string;
          time_of_day?: "ayunas" | "desayuno" | "cena" | "noche" | "antes_dormir";
          days_of_week?: number[];
          reminder?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplement_logs: {
        Row: {
          id: string;
          user_id: string;
          supplement_id: string;
          schedule_id: string | null;
          taken_at: string;
          skipped: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          supplement_id: string;
          schedule_id?: string | null;
          taken_at?: string;
          skipped?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          supplement_id?: string;
          schedule_id?: string | null;
          taken_at?: string;
          skipped?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      supplement_stacks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplement_stack_items: {
        Row: {
          id: string;
          stack_id: string;
          supplement_id: string;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          stack_id: string;
          supplement_id: string;
          order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          stack_id?: string;
          supplement_id?: string;
          order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          emoji: string | null;
          time_of_day: "manana" | "tarde" | "noche" | "cualquier";
          days_of_week: number[];
          active: boolean;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          emoji?: string | null;
          time_of_day: "manana" | "tarde" | "noche" | "cualquier";
          days_of_week?: number[];
          active?: boolean;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          emoji?: string | null;
          time_of_day?: "manana" | "tarde" | "noche" | "cualquier";
          days_of_week?: number[];
          active?: boolean;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      habit_logs: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string;
          completed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          birthdate: string | null;
          units_pref: "metric" | "imperial";
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          birthdate?: string | null;
          units_pref?: "metric" | "imperial";
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          birthdate?: string | null;
          units_pref?: "metric" | "imperial";
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
