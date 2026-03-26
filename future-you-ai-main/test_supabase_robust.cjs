const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://iraolkerdmhsfncsquic.supabase.co";
const supabaseKey = "sb_publishable_MNMHziHs1x4aprnjaBL-5g_WvzH5qxa";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log("START_DIAGNOSTIC");
  
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

  const results = [];

  for (const [key, value] of Object.entries(fields)) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("user_id", "00000000-0000-0000-0000-000000000000"); // Dummy ID

      if (error) {
        // PGRST204 means no rows matched, but the query itself was valid (columns exist)
        if (error.code === "PGRST204") {
          results.push(`${key}: VALID (Column exists)`);
        } else {
          results.push(`${key}: FAILED - ${error.code} - ${error.message} - ${JSON.stringify(error.details)}`);
        }
      } else {
        results.push(`${key}: SUCCESS (or no error)`);
      }
    } catch (err) {
      results.push(`${key}: CRASHED - ${err.message}`);
    }
  }

  console.log(results.join("\n"));
  console.log("END_DIAGNOSTIC");
}

testUpdate().catch(console.error);
