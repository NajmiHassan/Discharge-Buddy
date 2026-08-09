import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://haupegcusrrnabbvggjo.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdXBlZ2N1c3JybmFiYnZnZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NTc3ODUsImV4cCI6MjEwMTUzMzc4NX0.zEdCW2RdUFFdssixYMCtYXci1rpF6BpBGyn2JCsQ32s";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "implicit",
  },
});