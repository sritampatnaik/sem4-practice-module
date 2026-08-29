export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      chat_memory: {
        Row: {
          agent: string | null;
          at: string;
          id: number;
          role: string;
          session_id: string;
          text: string;
        };
        Insert: {
          agent?: string | null;
          at?: string;
          id?: never;
          role: string;
          session_id: string;
          text: string;
        };
        Update: {
          agent?: string | null;
          at?: string;
          id?: never;
          role?: string;
          session_id?: string;
          text?: string;
        };
        Relationships: [];
      };
      eval_catalog_edits: {
        Row: {
          deleted: string[];
          evaluators: Json;
          extras: Json;
          id: string;
          updated_at: string;
          updates: Json;
        };
        Insert: {
          deleted?: string[];
          evaluators?: Json;
          extras?: Json;
          id?: string;
          updated_at?: string;
          updates?: Json;
        };
        Update: {
          deleted?: string[];
          evaluators?: Json;
          extras?: Json;
          id?: string;
          updated_at?: string;
          updates?: Json;
        };
        Relationships: [];
      };
      eval_runs: {
        Row: {
          created_at: string;
          finished_at: string;
          id: string;
          items: Json;
          model: string;
          started_at: string;
          suite_ids: string[];
          suites: Json;
          totals: Json;
        };
        Insert: {
          created_at?: string;
          finished_at: string;
          id: string;
          items?: Json;
          model: string;
          started_at: string;
          suite_ids?: string[];
          suites?: Json;
          totals?: Json;
        };
        Update: {
          created_at?: string;
          finished_at?: string;
          id?: string;
          items?: Json;
          model?: string;
          started_at?: string;
          suite_ids?: string[];
          suites?: Json;
          totals?: Json;
        };
        Relationships: [];
      };
      student_sessions: {
        Row: {
          created_at: string;
          diagnostic: Json;
          grade_level: string;
          id: string;
          name: string;
          notes: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          diagnostic?: Json;
          grade_level: string;
          id: string;
          name?: string;
          notes?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          diagnostic?: Json;
          grade_level?: string;
          id?: string;
          name?: string;
          notes?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
