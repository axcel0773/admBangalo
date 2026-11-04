/**
 * Tipos do banco no formato gerado pela Supabase CLI.
 * Espelha supabase/migrations/0001_init.sql.
 *
 * Depois de vincular o projeto (`supabase link`), regenere com:
 *   npm run db:types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          business_name: string | null;
          pix_key: string | null;
          pix_city: string | null;
        } & Timestamps;
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          business_name?: string | null;
          pix_key?: string | null;
          pix_city?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      chalets: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          max_guests: number;
          base_guests: number;
          base_nightly_rate: number;
          check_in_time: string;
          check_out_time: string;
          color: string;
          active: boolean;
          ical_token: string;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          description?: string | null;
          max_guests: number;
          base_guests?: number;
          base_nightly_rate: number;
          check_in_time?: string;
          check_out_time?: string;
          color?: string;
          active?: boolean;
          ical_token?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chalets"]["Insert"]>;
        Relationships: [];
      };
      chalet_rates: {
        Row: {
          id: string;
          owner_id: string;
          chalet_id: string;
          label: string;
          period: string;
          nightly_rate: number;
          min_nights: number;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          chalet_id: string;
          label: string;
          period: string;
          nightly_rate: number;
          min_nights?: number;
        };
        Update: Partial<Database["public"]["Tables"]["chalet_rates"]["Insert"]>;
        Relationships: [];
      };
      fees: {
        Row: {
          id: string;
          owner_id: string;
          chalet_id: string | null;
          name: string;
          kind: Database["public"]["Enums"]["fee_kind"];
          mode: Database["public"]["Enums"]["charge_mode"];
          amount: number;
          auto_apply: boolean;
          active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id?: string;
          chalet_id?: string | null;
          name: string;
          kind: Database["public"]["Enums"]["fee_kind"];
          mode: Database["public"]["Enums"]["charge_mode"];
          amount: number;
          auto_apply?: boolean;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["fees"]["Insert"]>;
        Relationships: [];
      };
      guests: {
        Row: {
          id: string;
          owner_id: string;
          full_name: string;
          document: string | null;
          birth_date: string | null;
          phone: string | null;
          email: string | null;
          city: string | null;
          state: string | null;
          notes: string | null;
          deleted_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id?: string;
          full_name: string;
          document?: string | null;
          birth_date?: string | null;
          phone?: string | null;
          email?: string | null;
          city?: string | null;
          state?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["guests"]["Insert"]>;
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          owner_id: string;
          chalet_id: string;
          main_guest_id: string;
          check_in: string;
          check_out: string;
          nights: number;
          adults: number;
          children: number;
          nightly_rate: number;
          discount: number;
          lodging_total: number;
          status: Database["public"]["Enums"]["reservation_status"];
          source: Database["public"]["Enums"]["reservation_source"];
          notes: string | null;
          checked_in_at: string | null;
          checked_out_at: string | null;
          cancelled_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id?: string;
          chalet_id: string;
          main_guest_id: string;
          check_in: string;
          check_out: string;
          adults?: number;
          children?: number;
          nightly_rate: number;
          discount?: number;
          status?: Database["public"]["Enums"]["reservation_status"];
          source?: Database["public"]["Enums"]["reservation_source"];
          notes?: string | null;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          cancelled_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Insert"]>;
        Relationships: [];
      };
      reservation_guests: {
        Row: {
          id: string;
          owner_id: string;
          reservation_id: string;
          guest_id: string | null;
          full_name: string;
          document: string | null;
          is_child: boolean;
          is_main: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          reservation_id: string;
          guest_id?: string | null;
          full_name: string;
          document?: string | null;
          is_child?: boolean;
          is_main?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["reservation_guests"]["Insert"]>;
        Relationships: [];
      };
      reservation_charges: {
        Row: {
          id: string;
          owner_id: string;
          reservation_id: string;
          fee_id: string | null;
          kind: Database["public"]["Enums"]["fee_kind"];
          description: string;
          mode: Database["public"]["Enums"]["charge_mode"];
          unit_amount: number;
          quantity: number;
          meter_start: number | null;
          meter_end: number | null;
          total: number;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id?: string;
          reservation_id: string;
          fee_id?: string | null;
          kind: Database["public"]["Enums"]["fee_kind"];
          description: string;
          mode: Database["public"]["Enums"]["charge_mode"];
          unit_amount: number;
          quantity?: number;
          meter_start?: number | null;
          meter_end?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["reservation_charges"]["Insert"]>;
        Relationships: [];
      };
      chalet_ical_sources: {
        Row: {
          id: string;
          owner_id: string;
          chalet_id: string;
          label: string;
          url: string;
          last_synced_at: string | null;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          chalet_id: string;
          label: string;
          url: string;
          last_synced_at?: string | null;
          last_error?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["chalet_ical_sources"]["Insert"]>;
        Relationships: [];
      };
      chalet_blocks: {
        Row: {
          id: string;
          owner_id: string;
          chalet_id: string;
          starts_on: string;
          ends_on: string;
          reason: string;
          source: Database["public"]["Enums"]["block_source"];
          ical_source_id: string | null;
          external_uid: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          chalet_id: string;
          starts_on: string;
          ends_on: string;
          reason: string;
          source?: Database["public"]["Enums"]["block_source"];
          ical_source_id?: string | null;
          external_uid?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["chalet_blocks"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          owner_id: string;
          reservation_id: string;
          kind: Database["public"]["Enums"]["payment_kind"];
          method: Database["public"]["Enums"]["payment_method"];
          amount: number;
          paid_at: string;
          receipt_path: string | null;
          notes: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id?: string;
          reservation_id: string;
          kind?: Database["public"]["Enums"]["payment_kind"];
          method?: Database["public"]["Enums"]["payment_method"];
          amount: number;
          paid_at?: string;
          receipt_path?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      payment_schedule: {
        Row: {
          id: string;
          owner_id: string;
          reservation_id: string;
          description: string;
          amount: number;
          due_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          reservation_id: string;
          description: string;
          amount: number;
          due_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_schedule"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      reservation_financials: {
        Row: {
          reservation_id: string;
          owner_id: string;
          chalet_id: string;
          chalet_name: string;
          main_guest_id: string;
          main_guest_name: string;
          check_in: string;
          check_out: string;
          nights: number;
          guests_count: number;
          status: Database["public"]["Enums"]["reservation_status"];
          lodging_total: number;
          charges_total: number;
          energy_total: number;
          cleaning_total: number;
          grand_total: number;
          paid_total: number;
          balance_due: number;
          payment_status: "cancelled" | "unpaid" | "partial" | "paid";
        };
        Relationships: [];
      };
      monthly_summary: {
        Row: {
          owner_id: string;
          month: string;
          reservations: number;
          nights_sold: number;
          revenue_expected: number;
          revenue_received: number;
          revenue_pending: number;
          energy_total: number;
          cleaning_total: number;
        };
        Relationships: [];
      };
      occupancy_days: {
        Row: {
          owner_id: string;
          chalet_id: string;
          reservation_id: string;
          day: string;
          status: Database["public"]["Enums"]["reservation_status"];
        };
        Relationships: [];
      };
    };
    Functions: {
      anonymize_guest: {
        Args: { p_guest_id: string };
        Returns: undefined;
      };
      remove_guest: {
        Args: { p_guest_id: string };
        Returns: string;
      };
      ical_feed: {
        Args: { p_token: string };
        Returns: { uid: string; starts_on: string; ends_on: string; summary: string; chalet_name: string }[];
      };
      create_reservation: {
        Args: { payload: Json };
        Returns: string;
      };
      chalet_is_available: {
        Args: {
          p_chalet_id: string;
          p_check_in: string;
          p_check_out: string;
          p_ignore_reservation?: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      reservation_status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
      reservation_source: "direct" | "whatsapp" | "airbnb" | "booking" | "other";
      fee_kind: "energy" | "cleaning" | "extra_guest" | "pet" | "other";
      block_source: "manual" | "ical";
      charge_mode: "per_stay" | "per_night" | "per_guest" | "per_guest_night" | "metered";
      payment_method:
        | "pix"
        | "cash"
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "platform"
        | "other";
      payment_kind: "deposit" | "installment" | "balance" | "refund";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
