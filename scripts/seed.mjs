// Run: node scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";

// Usage: SUPABASE_URL=... SUPABASE_KEY=... node scripts/seed.mjs
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.error("Set SUPABASE_URL and SUPABASE_KEY env vars"); process.exit(1); }
const supabase = createClient(url, key);

const today = new Date();
const fmt = (d) => d.toISOString().split("T")[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

async function seed() {
  console.log("Seeding database...");

  // 1. Create user profile
  const { data: profile, error: profileErr } = await supabase
    .from("user_profiles")
    .insert({ name: "", business: "", phone: "", email: "", has_onboarded: false })
    .select()
    .single();

  if (profileErr) {
    // Profile might already exist, try to get it
    const { data: existing } = await supabase.from("user_profiles").select("*").limit(1).single();
    if (!existing) { console.error("Failed to create/get profile:", profileErr); return; }
    console.log("Using existing profile:", existing.id);
    var userId = existing.id;
  } else {
    var userId = profile.id;
    console.log("Created profile:", userId);
  }

  // 2. Clients
  const clientsData = [
    { user_id: userId, first_name: "Marie", last_name: "Dupont", phone: "06 12 34 56 78", email: "marie.dupont@email.com", notes: "Préfère les créneaux du matin. Allergie au latex.", avatar: "#7C3AED" },
    { user_id: userId, first_name: "Sophie", last_name: "Martin", phone: "06 98 76 54 32", email: "sophie.martin@email.com", notes: "Cliente régulière, tous les 15 jours.", avatar: "#3B82F6" },
    { user_id: userId, first_name: "Léa", last_name: "Bernard", phone: "07 11 22 33 44", email: "lea.bernard@email.com", notes: "", avatar: "#10B981" },
    { user_id: userId, first_name: "Camille", last_name: "Petit", phone: "06 55 66 77 88", email: "camille.petit@email.com", notes: "Vient avec sa fille parfois.", avatar: "#F59E0B" },
    { user_id: userId, first_name: "Julie", last_name: "Robert", phone: "07 99 88 77 66", email: "julie.robert@email.com", notes: "Nouvelle cliente, recommandée par Sophie.", avatar: "#EC4899" },
    { user_id: userId, first_name: "Thomas", last_name: "Leroy", phone: "06 44 33 22 11", email: "thomas.leroy@email.com", notes: "Coaching business. Séances le vendredi.", avatar: "#8B5CF6" },
  ];

  const { data: clients, error: clientsErr } = await supabase.from("clients").insert(clientsData).select();
  if (clientsErr) { console.error("Clients error:", clientsErr); return; }
  console.log(`Inserted ${clients.length} clients`);

  const cIds = {};
  clients.forEach((c) => { cIds[c.first_name] = c.id; });

  // 3. Appointments
  const appointmentsData = [
    { user_id: userId, client_id: cIds["Marie"], title: "Manucure gel", date: fmt(today), time: "09:00", duration: 60, status: "confirmed", price: 45, notes: "" },
    { user_id: userId, client_id: cIds["Sophie"], title: "Pose complète", date: fmt(today), time: "10:30", duration: 90, status: "confirmed", price: 65, notes: "Couleur : rouge cerise" },
    { user_id: userId, client_id: cIds["Camille"], title: "Retouche", date: fmt(today), time: "14:00", duration: 45, status: "confirmed", price: 30, notes: "" },
    { user_id: userId, client_id: cIds["Thomas"], title: "Séance coaching", date: fmt(today), time: "16:00", duration: 60, status: "confirmed", price: 80, notes: "Suivi mensuel" },
    { user_id: userId, client_id: cIds["Léa"], title: "Nail art", date: fmt(addDays(today, 1)), time: "11:00", duration: 75, status: "confirmed", price: 55, notes: "Design floral" },
    { user_id: userId, client_id: cIds["Julie"], title: "Première consultation", date: fmt(addDays(today, 1)), time: "15:00", duration: 30, status: "confirmed", price: 0, notes: "Consultation gratuite" },
    { user_id: userId, client_id: cIds["Marie"], title: "Manucure classique", date: fmt(addDays(today, -2)), time: "10:00", duration: 45, status: "done", price: 35, notes: "" },
    { user_id: userId, client_id: cIds["Sophie"], title: "Dépose + repose", date: fmt(addDays(today, -5)), time: "09:30", duration: 90, status: "done", price: 70, notes: "" },
    { user_id: userId, client_id: cIds["Léa"], title: "Pose gel", date: fmt(addDays(today, -7)), time: "14:00", duration: 60, status: "canceled", price: 50, notes: "Annulé par la cliente" },
    { user_id: userId, client_id: cIds["Camille"], title: "Manucure", date: fmt(addDays(today, 2)), time: "09:00", duration: 60, status: "confirmed", price: 45, notes: "" },
    { user_id: userId, client_id: cIds["Thomas"], title: "Coaching stratégie", date: fmt(addDays(today, 3)), time: "10:00", duration: 60, status: "confirmed", price: 80, notes: "" },
  ];

  const { data: appts, error: apptsErr } = await supabase.from("appointments").insert(appointmentsData).select();
  if (apptsErr) { console.error("Appointments error:", apptsErr); return; }
  console.log(`Inserted ${appts.length} appointments`);

  // 4. Invoices
  const invoicesData = [
    { user_id: userId, client_id: cIds["Marie"], amount: 35, status: "paid", date: fmt(addDays(today, -2)), description: "Manucure classique" },
    { user_id: userId, client_id: cIds["Sophie"], amount: 70, status: "paid", date: fmt(addDays(today, -5)), description: "Dépose + repose" },
    { user_id: userId, client_id: cIds["Marie"], amount: 45, status: "pending", date: fmt(today), description: "Manucure gel" },
    { user_id: userId, client_id: cIds["Sophie"], amount: 65, status: "pending", date: fmt(today), description: "Pose complète" },
    { user_id: userId, client_id: cIds["Camille"], amount: 30, status: "pending", date: fmt(today), description: "Retouche" },
    { user_id: userId, client_id: cIds["Thomas"], amount: 80, status: "paid", date: fmt(addDays(today, -15)), description: "Séance coaching" },
    { user_id: userId, client_id: cIds["Thomas"], amount: 80, status: "pending", date: fmt(today), description: "Séance coaching" },
  ];

  const { data: invs, error: invsErr } = await supabase.from("invoices").insert(invoicesData).select();
  if (invsErr) { console.error("Invoices error:", invsErr); return; }
  console.log(`Inserted ${invs.length} invoices`);

  // 5. Products
  const productsData = [
    { user_id: userId, name: "Gel UV transparent", quantity: 8, min_quantity: 3, price: 12.5, category: "Gel", emoji: "💅" },
    { user_id: userId, name: "Vernis rouge cerise", quantity: 2, min_quantity: 3, price: 8.9, category: "Vernis", emoji: "💄" },
    { user_id: userId, name: "Lime à ongles 180", quantity: 25, min_quantity: 10, price: 1.5, category: "Accessoires", emoji: "📐" },
    { user_id: userId, name: "Primer sans acide", quantity: 5, min_quantity: 2, price: 14.0, category: "Préparation", emoji: "🧴" },
    { user_id: userId, name: "Top coat brillant", quantity: 1, min_quantity: 3, price: 11.0, category: "Finition", emoji: "✨" },
    { user_id: userId, name: "Coton cellulose", quantity: 150, min_quantity: 50, price: 3.5, category: "Accessoires", emoji: "🧻" },
    { user_id: userId, name: "Huile cuticules", quantity: 4, min_quantity: 2, price: 9.9, category: "Soin", emoji: "🫧" },
    { user_id: userId, name: "Capsules gel X", quantity: 0, min_quantity: 5, price: 15.0, category: "Extensions", emoji: "💎" },
  ];

  const { data: prods, error: prodsErr } = await supabase.from("products").insert(productsData).select();
  if (prodsErr) { console.error("Products error:", prodsErr); return; }
  console.log(`Inserted ${prods.length} products`);

  console.log("\nDone! Database seeded successfully.");
}

seed().catch(console.error);
