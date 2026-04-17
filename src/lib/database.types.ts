// ── Manual Supabase table types ─────────────────────────
// To auto-generate (requires Supabase CLI + auth):
//   npx supabase login
//   npx supabase gen types typescript --project-id yiiqcfozmiprwuqladym > src/lib/database.types.ts

export interface Tables {
  user_profiles: {
    id: string;
    name: string;
    email: string;
    business: string;
    phone: string;
    booking_slug: string | null;
    has_onboarded: boolean;
    account_type: string | null;
    subscription_plan: string | null;
    beta_status: string | null;
    chat_enabled: boolean | null;
    business_type: string | null;
    setup_completed: boolean | null;
    onboarding_data: Record<string, unknown> | null;
    settings: Record<string, unknown>;
    is_admin: boolean;
    created_at: string;
  };
  clients: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    notes: string;
    avatar: string;
    created_at: string;
  };
  appointments: {
    id: string;
    user_id: string;
    client_id: string;
    title: string;
    date: string;
    time: string;
    duration: number;
    status: string;
    price: number;
    notes: string;
    guest_name: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    is_guest: boolean;
    created_at: string;
  };
  invoices: {
    id: string;
    user_id: string;
    client_id: string;
    appointment_id: string | null;
    amount: number;
    status: string;
    date: string;
    description: string;
    items: Array<{ label: string; quantity: number; unitPrice: number }>;
    created_at: string;
  };
  services: {
    id: string;
    user_id: string;
    name: string;
    duration: number;
    price: number;
    description: string;
    active: boolean;
    created_at: string;
  };
  products: {
    id: string;
    user_id: string;
    name: string;
    quantity: number;
    min_quantity: number;
    price: number;
    category: string;
    emoji: string;
    created_at: string;
  };
  reviews: {
    id: string;
    user_id: string;
    author_name: string;
    author_email: string | null;
    rating: number;
    text: string;
    status: "pending" | "published" | "hidden";
    created_at: string;
  };
}
