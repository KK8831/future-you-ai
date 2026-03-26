const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://iraolkerdmhsfncsquic.supabase.co";
const supabaseKey = "sb_publishable_MNMHziHs1x4aprnjaBL-5g_WvzH5qxa";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSelect() {
  console.log("START_SELECT_TEST");
  const { data, error } = await supabase.from("profiles").select("health_goals").limit(1);
  if (error) {
    console.log(`ERROR: ${error.code} - ${error.message}`);
  } else {
    console.log("SUCCESS: Column exists");
  }
  console.log("END_SELECT_TEST");
}

testSelect();
