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
      chat_chunks: {
        Row: {
          chunk_index: number;
          content: string;
          conversation_id: string;
          created_at: string;
          embedding: string | number[] | null;
          id: number;
          user_id: string;
        };
        Insert: {
          chunk_index?: number;
          content: string;
          conversation_id: string;
          created_at?: string;
          embedding?: string | number[] | null;
          id?: never;
          user_id: string;
        };
        Update: {
          chunk_index?: number;
          content?: string;
          conversation_id?: string;
          created_at?: string;
          embedding?: string | number[] | null;
          id?: never;
          user_id?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
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
          grade: string | null;
          grade_level: string;
          id: string;
          name: string;
          notes: Json;
          parent_email: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          diagnostic?: Json;
          grade?: string | null;
          grade_level: string;
          id: string;
          name?: string;
          notes?: Json;
          parent_email?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          diagnostic?: Json;
          grade?: string | null;
          grade_level?: string;
          id?: string;
          name?: string;
          notes?: Json;
          parent_email?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      guardrail_alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          categories: string[];
          created_at: string;
          id: string;
          notified_at: string | null;
          notified_email: string | null;
          prompt_version: string;
          reason: string;
          session_id: string;
          severity: string;
          snippet: string;
          student_email: string | null;
          student_name: string;
          user_id: string | null;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          categories?: string[];
          created_at?: string;
          id: string;
          notified_at?: string | null;
          notified_email?: string | null;
          prompt_version: string;
          reason: string;
          session_id: string;
          severity: string;
          snippet: string;
          student_email?: string | null;
          student_name?: string;
          user_id?: string | null;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          categories?: string[];
          created_at?: string;
          id?: string;
          notified_at?: string | null;
          notified_email?: string | null;
          prompt_version?: string;
          reason?: string;
          session_id?: string;
          severity?: string;
          snippet?: string;
          student_email?: string | null;
          student_name?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_chat_chunks: {
        Args: {
          filter_user_id: string;
          match_count: number;
          query_embedding: string | number[];
        };
        Returns: {
          content: string;
          conversation_id: string;
          id: number;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
