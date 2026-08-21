
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const users = [
    { email: "admin@clinica.com", password: "admin123" },
    { email: "doctor@clinica.com", password: "doctor123" },
    { email: "doctora@clinica.com", password: "doctora123" },
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
    });
    if (error) {
      console.log(`Failed for ${u.email}:`, error.message);
    } else {
      console.log(`Success for ${u.email}:`, data.user?.id);
    }
  }
}

seed();
