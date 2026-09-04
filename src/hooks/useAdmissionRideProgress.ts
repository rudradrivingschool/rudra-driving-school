// Supabase response typed as any — PostgREST does not infer from service-role queries
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/lib/api/client";

/**
 * Updates the rides_completed count for a client in "admissions" table,
 * and sets status="Completed" if rides_completed === total_rides.
 * Call after every ride insertion or manual progress update!
 */
export async function updateAdmissionRideProgress(
  client_id: string,
  onProgressUpdate?: () => void,
) {
  if (!client_id) return;

  try {
    // Fetch all rides for this client
    const allRides = await apiClient.getRides({ client_id });

    // Count completed rides
    const rides_completed = allRides.filter(
      (r: any) => r.status === "completed",
    ).length;

    // Fetch client's admission data (scoped by id)
    const [admissionRow] = await apiClient.getAdmissions({ id: client_id });

    // Guard: if no admission record exists, return early
    if (!admissionRow) {
      console.warn(`[progress] No admission found for client_id=${client_id}`);
      return;
    }

    // Calculate new status based on completion
    const totalRides = (admissionRow as any).total_rides;
    const newStatus =
      totalRides > 0 && rides_completed === totalRides
        ? "Completed"
        : admissionRow.status;

    // Conditional no-op write: only update if values changed
    if (
      admissionRow.rides_completed === rides_completed &&
      admissionRow.status === newStatus
    ) {
      // No change, skip update
      if (onProgressUpdate) {
        onProgressUpdate();
      }
      return;
    }

    // Perform the update
    await apiClient.updateAdmission(client_id, {
      rides_completed,
      status: newStatus,
    });

    if (onProgressUpdate) {
      onProgressUpdate();
    }
  } catch (error) {
    console.error("Error updating admission ride progress:", error);
  }
}