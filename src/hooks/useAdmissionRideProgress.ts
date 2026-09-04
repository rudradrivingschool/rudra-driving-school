
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Updates the rides_completed count for a client in "admissions" table,
 * and sets status="Completed" if rides_completed === total_rides.
 * Call after every ride insertion or manual progress update!
 */
export async function updateAdmissionRideProgress(client_id: string, onProgressUpdate?: () => void) {
  if (!client_id) return;
  // Fetch count of completed rides (by client_id)
  const { data: completedRides, error: ridesError } = await supabase
    .from("rides" as any)
    .select("id")
    .eq("client_id", client_id)
    .eq("status", "completed");

  if (ridesError) {
    toast.error("Failed to get completed rides count");
    return;
  }
  const rides_completed = completedRides ? completedRides.length : 0;

  // Fetch client's total_rides
  const { data: admissionRow, error: admissionError } = await supabase
    .from("admissions" as any)
    .select("total_rides")
    .eq("id", client_id)
    .maybeSingle();

  if (admissionError) {
    toast.error("Failed to get client total rides");
    return;
  }

  let statusUpdate: { status?: string } = {};
  if (
    admissionRow &&
    typeof (admissionRow as any).total_rides === "number" &&
    rides_completed === (admissionRow as any).total_rides
  ) {
    statusUpdate.status = "Completed";
  }

  const { error: updateError } = await supabase
    .from("admissions" as any)
    .update({ rides_completed, ...statusUpdate })
    .eq("id", client_id);

  if (updateError) {
    toast.error("Failed to update client progress");
  } else if (onProgressUpdate) {
    onProgressUpdate();
  }
}
