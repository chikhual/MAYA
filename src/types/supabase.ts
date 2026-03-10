export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          nombre: string;
          mote: string | null;
          club: string;
          rol: string;
          foto_url: string | null;
          biografia: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          mote?: string | null;
          club: string;
          rol?: string;
          foto_url?: string | null;
          biografia?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          mote?: string | null;
          club?: string;
          rol?: string;
          foto_url?: string | null;
          biografia?: string | null;
          user_id?: string | null;
          updated_at?: string;
        };
      };
      proyectos: {
        Row: {
          id: string;
          director_id: string;
          nombre_proyecto: string;
          descripcion: string | null;
          meta_mensual: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          director_id: string;
          nombre_proyecto: string;
          descripcion?: string | null;
          meta_mensual?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          director_id?: string;
          nombre_proyecto?: string;
          descripcion?: string | null;
          meta_mensual?: string | null;
          updated_at?: string;
        };
      };
      check_semanales: {
        Row: {
          id: string;
          proyecto_id: string;
          completado: boolean;
          fecha_corte: string;
          comentario: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          completado: boolean;
          fecha_corte: string;
          comentario?: string | null;
          created_at?: string;
        };
        Update: {
          completado?: boolean;
          comentario?: string | null;
        };
      };
      evidencias: {
        Row: {
          id: string;
          proyecto_id: string;
          file_url: string;
          fecha_subida: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          file_url: string;
          fecha_subida?: string;
          created_at?: string;
        };
        Update: {
          file_url?: string;
          fecha_subida?: string;
        };
      };
    };
  };
}

export type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];
export type Proyecto = Database["public"]["Tables"]["proyectos"]["Row"];
export type CheckSemanal = Database["public"]["Tables"]["check_semanales"]["Row"];
export type Evidencia = Database["public"]["Tables"]["evidencias"]["Row"];
