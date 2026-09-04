// Supabase response typed as any — PostgREST does not infer from service-role queries
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Client, ClientFormData } from '@/types/client';
import { getTotalRidesFromDuration } from './useAdmissionsUtils';

export const useAdmissions = () => {
  const queryClient = useQueryClient();

  const fetchClients = async () => {
    try {
      // Admissions-only fetch: no rides, no drivers.
      // Ride counts come from DB columns (rides_completed, total_rides).
      const admissionsData = await apiClient.getAdmissions();

      const clientsData: Client[] = (admissionsData as any[]).map(
        (admission: any) => {
          const completed: number = admission.rides_completed ?? 0;
          const total: number = admission.total_rides ?? 0;

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
              completed,
              remaining: Math.max(0, total - completed),
              total,
            },
            ridesCompleted: completed,
            totalRides: total,
            startDate: admission.start_date
              ? new Date(admission.start_date)
              : new Date(),
            endDate: new Date(),
            status: admission.status || 'Active',
            additionalNotes: admission.additional_notes || '',
            // rideHistory is not loaded here; consumers that need it
            // should derive it from the shared ['rides'] cache.
            rideHistory: [],
          };
        },
      );

      return clientsData;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load clients');
      throw error;
    }
  };

  const {
    data: clients = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['admissions'],
    queryFn: fetchClients,
  });

  const addClientMutation = useMutation({
    mutationFn: async (clientData: ClientFormData & { customLicenseType?: string }) => {
      const totalRides = getTotalRidesFromDuration(clientData.duration);
      const data = await apiClient.createAdmission({
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
      });

      // Add advance amount as first payment if it exists
      if (clientData.advanceAmount > 0) {
        try {
          await apiClient.createPayment({
            admission_id: (data as any).id,
            amount: clientData.advanceAmount,
            payment_type: 'advance',
            payment_date: clientData.startDate.toISOString().split('T')[0],
            notes: 'Initial advance payment',
          });
        } catch (paymentError) {
          console.error('Error adding advance payment:', paymentError);
          toast.error('Client added but failed to record advance payment');
        }
      }
    },
    onSuccess: () => {
      toast.success('Client added successfully!');
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
    },
    onError: () => {
      toast.error('Failed to add client');
    },
  });

  const addClient = async (
    clientData: ClientFormData & { customLicenseType?: string },
  ) => {
    try {
      await addClientMutation.mutateAsync(clientData);
      return true;
    } catch {
      return false;
    }
  };

  const updateClientMutation = useMutation({
    mutationFn: ({ clientId, clientData }: { clientId: string; clientData: ClientFormData & { customLicenseType?: string } }) => {
      const totalRides = getTotalRidesFromDuration(clientData.duration);
      return apiClient.updateAdmission(clientId, {
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
      });
    },
    onSuccess: () => {
      toast.success('Client updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
    },
    onError: () => {
      toast.error('Failed to update client');
    },
  });

  const updateClient = async (
    clientId: string,
    clientData: ClientFormData & { customLicenseType?: string },
  ) => {
    try {
      await updateClientMutation.mutateAsync({ clientId, clientData });
      return true;
    } catch {
      return false;
    }
  };

  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) => apiClient.deleteAdmission(clientId),
    onSuccess: () => {
      toast.success('Client deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
    },
    onError: () => {
      toast.error('Failed to delete client');
    },
  });

  const deleteClient = async (clientId: string) => {
    try {
      await deleteClientMutation.mutateAsync(clientId);
      return true;
    } catch {
      return false;
    }
  };

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: ['admissions'] });

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    refetch,
  };
};