import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client, ClientFormData } from '@/types/client';
import { fetchClientRides } from './useAdmissionsRides';
import { getTotalRidesFromDuration } from './useAdmissionsUtils';

export const useAdmissions = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admissions' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients');
        setLoading(false);
        return;
      }

      const clientsWithRides: Client[] = await Promise.all(
        (data as any[]).map(async (admission: any) => {
          const { progress, rideHistory } = await fetchClientRides(
            admission.id,
            admission.student_name
          );

          // Fetch driverName/car for each ride (based on latest rides table structure, you may enhance this!)
          // You might want to refactor this part later for advanced joins.

          return {
            id: admission.id,
            name: admission.student_name,
            contact: admission.contact || '',
            email: admission.email || '',
            sex: admission.sex || '',
            licenseType: admission.license_type || '',
            licenseNumber: admission.license_number || '',
            fees: admission.fees || 0,
            advanceAmount: admission.advance_amount || 0,
            duration: admission.duration || '',
            licenseStatus: {
              learning: admission.learning_license || '',
              driving: admission.driving_license || '',
            },
            rides: {
              completed: progress.completed,
              remaining: Math.max(
                0,
                (admission.total_rides ?? progress.total) - progress.completed
              ),
              total: admission.total_rides ?? progress.total,
            },
            ridesCompleted: progress.completed,
            totalRides: admission.total_rides ?? progress.total,
            startDate: admission.start_date
              ? new Date(admission.start_date)
              : new Date(),
            endDate: new Date(),
            status: admission.status || 'Active',
            additionalNotes: admission.additional_notes || '',
            rideHistory, // already includes driverName and car
          };
        })
      );

      setClients(clientsWithRides);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (
    clientData: ClientFormData & { customLicenseType?: string }
  ) => {
    try {
      const totalRides = getTotalRidesFromDuration(clientData.duration);
      const { data, error } = await supabase
        .from('admissions' as any)
        .insert({
          student_name: clientData.name,
          contact: clientData.contact,
          email: clientData.email,
          sex: clientData.sex,
          license_type:
            clientData.licenseType === 'Other'
              ? clientData.customLicenseType
              : clientData.licenseType,
          license_number: clientData.licenseNumber,
          fees: clientData.fees,
          advance_amount: clientData.advanceAmount,
          duration: clientData.duration,
          learning_license: clientData.learningLicense,
          driving_license: clientData.drivingLicense,
          start_date: clientData.startDate.toISOString().split('T')[0],
          status: 'Active',
          additional_notes: clientData.additionalNotes,
          rides_completed: 0,
          total_rides: totalRides,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding client:', error);
        toast.error('Failed to add client');
        return false;
      }

      // Add advance amount as first payment if it exists
      if (clientData.advanceAmount > 0) {
        const { error: paymentError } = await supabase
          .from('payments' as any)
          .insert({
            admission_id: (data as any).id,
            amount: clientData.advanceAmount,
            payment_type: 'advance',
            payment_date: clientData.startDate.toISOString().split('T')[0],
            notes: 'Initial advance payment',
          });

        if (paymentError) {
          console.error('Error adding advance payment:', paymentError);
          toast.error('Client added but failed to record advance payment');
        }
      }

      toast.success('Client added successfully!');
      await fetchClients();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add client');
      return false;
    }
  };

  const updateClient = async (
    clientId: string,
    clientData: ClientFormData & { customLicenseType?: string }
  ) => {
    try {
      const totalRides = getTotalRidesFromDuration(clientData.duration);
      const { error } = await supabase
        .from('admissions' as any)
        .update({
          student_name: clientData.name,
          contact: clientData.contact,
          email: clientData.email,
          sex: clientData.sex,
          license_type:
            clientData.licenseType === 'Other'
              ? clientData.customLicenseType
              : clientData.licenseType,
          license_number: clientData.licenseNumber,
          fees: clientData.fees,
          advance_amount: clientData.advanceAmount,
          duration: clientData.duration,
          learning_license: clientData.learningLicense,
          driving_license: clientData.drivingLicense,
          start_date: clientData.startDate.toISOString().split('T')[0],
          status: clientData.status,
          additional_notes: clientData.additionalNotes,
          total_rides: totalRides,
        })
        .eq('id', clientId);

      if (error) {
        console.error('Error updating client:', error);
        toast.error('Failed to update client');
        return false;
      }

      toast.success('Client updated successfully!');
      await fetchClients();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update client');
      return false;
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('admissions' as any)
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Error deleting client:', error);
        toast.error('Failed to delete client');
        return false;
      }

      toast.success('Client deleted successfully!');
      await fetchClients();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete client');
      return false;
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  };
};
