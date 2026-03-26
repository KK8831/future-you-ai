const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://iraolkerdmhsfncsquic.supabase.co";
const supabaseKey = "sb_publishable_MNMHziHs1x4aprnjaBL-5g_WvzH5qxa";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log("Testing Profile Update...");
  
  // Try to update one by one to see which fails
  const fields = {
    full_name: "Test User",
    age: 35,
    sex: "male",
    height_cm: 180,
    weight_kg: 85,
    blood_pressure_systolic: 120,
    blood_pressure_diastolic: 80,
    mental_health_index: 8,
    health_goals: ["sleep", "longevity"]
  };

  for (const [key, value] of Object.entries(fields)) {
    console.log(`Testing field: ${key}...`);
    // Note: This won't actually update unless we have a session, 
    // but the API will still return a 400 if the column doesn't exist or is invalid.
    // To get a REAL test we'd need a valid token.
    const { error } = await supabase.from("profiles").update({ [key]: value }).eq("user_id", "00000000-0000-0000-0000-000000000000");
    if (error && error.code === "PGRST204") {
      console.log(`  Result: Column exists (no rows matched, which is fine)`);
    } else if (error) {
       console.log(`  Error for ${key}:`, error.message, error.code, error.details);
    } else {
       console.log(`  Result: Success (or no error returned)`);
    }
  }
}

testUpdate();
