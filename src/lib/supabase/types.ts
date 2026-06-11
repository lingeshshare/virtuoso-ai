// Auto-typed Supabase database schema.
// Update this file alongside supabase/migrations/ when the schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type RecordingStatus = 'uploading' | 'processing' | 'analyzed' | 'error'
export type AudioEngine = 'librosa' | 'crepe' | 'basic-pitch' | 'essentia'
export type ReferenceFileType = 'pdf' | 'musicxml' | 'mxl' | 'midi'
export type ReferenceMaterialType = 'score' | 'excerpt' | 'audition_packet'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          instrument: string | null
          current_level: string | null
          target_level: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          instrument?: string | null
          current_level?: string | null
          target_level?: string | null
          onboarding_completed?: boolean
        }
        Update: {
          instrument?: string | null
          current_level?: string | null
          target_level?: string | null
          onboarding_completed?: boolean
          updated_at?: string
        }
      }
      recordings: {
        Row: {
          id: string
          user_id: string
          title: string | null
          instrument: string
          file_path: string
          file_url: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          mime_type: string
          status: RecordingStatus
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          instrument: string
          file_path: string
          file_url?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          mime_type: string
          status?: RecordingStatus
          error_message?: string | null
        }
        Update: {
          title?: string | null
          instrument?: string
          status?: RecordingStatus
          duration_seconds?: number | null
          error_message?: string | null
          file_url?: string | null
          updated_at?: string
        }
      }
      audio_metrics: {
        Row: {
          id: string
          recording_id: string
          engine: string
          metrics_json: Json
          tempo_bpm: number | null
          avg_loudness_db: number | null
          onset_count: number | null
          timing_score: number | null
          dynamics_score: number | null
          pitch_accuracy: number | null
          intonation_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          recording_id: string
          engine: string
          metrics_json: Json
          tempo_bpm?: number | null
          avg_loudness_db?: number | null
          onset_count?: number | null
          timing_score?: number | null
          dynamics_score?: number | null
          pitch_accuracy?: number | null
          intonation_score?: number | null
        }
        Update: never
      }
      feedback_reports: {
        Row: {
          id: string
          recording_id: string
          overall_score: number | null
          estimated_level: string | null
          summary: string | null
          report_json: Json | null
          persona: string | null
          claude_model: string | null
          prompt_tokens: number | null
          completion_tokens: number | null
          created_at: string
        }
        Insert: {
          id?: string
          recording_id: string
          overall_score?: number | null
          estimated_level?: string | null
          summary?: string | null
          report_json?: Json | null
          persona?: string | null
          claude_model?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
        }
        Update: never
      }
      practice_plans: {
        Row: {
          id: string
          recording_id: string | null
          report_id: string | null
          user_id: string
          drills_json: Json
          total_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recording_id?: string | null
          report_id?: string | null
          user_id: string
          drills_json?: Json
          total_minutes?: number
        }
        Update: {
          drills_json?: Json
          total_minutes?: number
          updated_at?: string
        }
      }
      reference_materials: {
        Row: {
          id: string
          user_id: string
          recording_id: string | null
          file_name: string
          file_type: ReferenceFileType
          material_type: ReferenceMaterialType
          file_path: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recording_id?: string | null
          file_name: string
          file_type: ReferenceFileType
          material_type?: ReferenceMaterialType
          file_path: string
        }
        Update: {
          material_type?: ReferenceMaterialType
          recording_id?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Recording = Database['public']['Tables']['recordings']['Row']
export type AudioMetricsRow = Database['public']['Tables']['audio_metrics']['Row']
export type FeedbackReportRow = Database['public']['Tables']['feedback_reports']['Row']
export type PracticePlanRow = Database['public']['Tables']['practice_plans']['Row']
export type ReferenceMaterialRow = Database['public']['Tables']['reference_materials']['Row']
