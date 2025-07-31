import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Using regular HTML table elements instead of shadcn table components
import {
  Download,
  Phone,
  Calendar,
  User,
  CreditCard,
  Car,
  CheckCircle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface AdmissionRow {
  id: string;
  student_name: string;
  admission_date: string | null;
  status: string;
  contact: string;
  license_type: string;
  fees: number;
  advance_amount: number;
  duration: string;
  rides_completed: number;
  total_rides: number;
  ride_dates: string; // CSV of dates
}

const MobileAdmissionCard: React.FC<{ admission: AdmissionRow }> = ({
  admission,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'terminated':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const progress =
    admission.total_rides > 0
      ? (admission.rides_completed / admission.total_rides) * 100
      : 0;

  return (
    <Card className='mb-4 shadow-sm'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between mb-3'>
          <div className='flex-1 min-w-0'>
            <h3 className='font-semibold text-lg text-gray-900 truncate flex items-center'>
              <User className='w-4 h-4 mr-2 text-gray-500 flex-shrink-0' />
              {admission.student_name}
            </h3>
            <div className='flex items-center mt-1 text-sm text-gray-600'>
              <Calendar className='w-3 h-3 mr-1 flex-shrink-0' />
              {admission.admission_date || 'N/A'}
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              admission.status
            )}`}
          >
            {admission.status}
          </span>
        </div>

        <div className='grid grid-cols-2 gap-3 mb-3'>
          <div className='flex items-center text-sm'>
            <Phone className='w-3 h-3 mr-2 text-gray-500 flex-shrink-0' />
            <span className='text-gray-600 truncate'>{admission.contact}</span>
          </div>
          <div className='flex items-center text-sm'>
            <Car className='w-3 h-3 mr-2 text-gray-500 flex-shrink-0' />
            <span className='text-gray-600'>{admission.license_type}</span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3 mb-3'>
          <div className='bg-gray-50 p-2 rounded'>
            <div className='text-xs text-gray-500'>Fees</div>
            <div className='font-semibold flex items-center'>
              <CreditCard className='w-3 h-3 mr-1' />
              {admission.fees}
            </div>
          </div>
          <div className='bg-gray-50 p-2 rounded'>
            <div className='text-xs text-gray-500'>Advance</div>
            <div className='font-semibold flex items-center'>
              <CreditCard className='w-3 h-3 mr-1' />
              {admission.advance_amount}
            </div>
          </div>
        </div>

        <div className='mb-3'>
          <div className='flex justify-between text-sm mb-1'>
            <span className='text-gray-600 flex items-center'>
              <CheckCircle className='w-3 h-3 mr-1' />
              Rides Progress
            </span>
            <span className='font-medium'>
              {admission.rides_completed}/{admission.total_rides}
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300'
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <div className='text-xs text-gray-500 mt-1'>
            {progress.toFixed(1)}% complete
          </div>
        </div>

        {admission.ride_dates && (
          <div className='pt-2 border-t border-gray-100'>
            <div className='text-xs text-gray-500 mb-1'>Ride Dates</div>
            <div className='text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-16 overflow-y-auto'>
              {admission.ride_dates}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const Reports: React.FC = () => {
  const [admissions, setAdmissions] = useState<AdmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    async function fetchAdmissionsWithRides() {
      setLoading(true);
      // 1. Fetch all admissions
      const { data: admissionsData, error } = await supabase
        .from('admissions')
        .select(
          'id, student_name, admission_date, status, contact, license_type, fees, advance_amount, duration, rides_completed, total_rides'
        )
        .order('admission_date', { ascending: false });

      if (error) {
        toast.error('Could not fetch admissions data');
        setAdmissions([]);
        setLoading(false);
        return;
      }
      // 2. Fetch rides, group by client_id
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('client_id, date');

      const ridesMap: Record<string, string[]> = {};
      if (ridesData && !ridesError) {
        for (const ride of ridesData) {
          if (ride.client_id && ride.date) {
            if (!ridesMap[ride.client_id]) ridesMap[ride.client_id] = [];
            ridesMap[ride.client_id].push(ride.date);
          }
        }
      }

      const rows: AdmissionRow[] = admissionsData.map((adm: any) => ({
        id: adm.id,
        student_name: adm.student_name,
        admission_date: adm.admission_date,
        status: adm.status,
        contact: adm.contact,
        license_type: adm.license_type,
        fees: Number(adm.fees),
        advance_amount: Number(adm.advance_amount),
        duration: adm.duration,
        rides_completed: adm.rides_completed,
        total_rides: adm.total_rides,
        ride_dates: (ridesMap[adm.id] || []).sort().join(', '),
      }));

      setAdmissions(rows);
      setLoading(false);
    }
    fetchAdmissionsWithRides();
  }, []);

  // Filter according to tab
  const filteredAdmissions =
    tab === 'active'
      ? admissions.filter((a) => a.status?.toLowerCase() === 'active')
      : admissions.filter(
          (a) =>
            a.status?.toLowerCase() === 'completed' ||
            a.status?.toLowerCase() === 'terminated'
        );

  const downloadCSV = () => {
    if (!filteredAdmissions.length) return;
    const headers = [
      'student_name',
      'admission_date',
      'status',
      'contact',
      'license_type',
      'fees',
      'advance_amount',
      'rides_completed',
      'total_rides',
      'ride_dates',
    ];
    const csvRows = [
      headers.join(','),
      ...filteredAdmissions.map((row) =>
        headers
          .map((h) => {
            const value = (row as any)[h];
            if (value === null || value === undefined) return '';
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      tab === 'active'
        ? 'admissions_active_clients.csv'
        : 'admissions_completed_terminated.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Downloaded admissions backup CSV');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className='text-center py-6 text-gray-500'>
          Loading admissions data...
        </div>
      );
    }

    if (filteredAdmissions.length === 0) {
      return (
        <div className='text-center py-8'>No admissions data available</div>
      );
    }

    return (
      <>
        {/* Mobile View - Cards */}
        <div className='block md:hidden'>
          {filteredAdmissions.map((adm) => (
            <MobileAdmissionCard key={adm.id} admission={adm} />
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className='hidden md:block overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b bg-gray-50'>
                <th className='text-left p-3 font-medium text-gray-700'>
                  Student
                </th>
                <th className='text-left p-3 font-medium text-gray-700'>
                  Admission Date
                </th>
                <th className='text-left p-3 font-medium text-gray-700'>
                  Status
                </th>
                <th className='text-left p-3 font-medium text-gray-700'>
                  Contact
                </th>
                <th className='text-left p-3 font-medium text-gray-700'>
                  License Type
                </th>
                <th className='text-left p-3 font-medium text-gray-700'>
                  Fees
                </th>
                <th className='text-left p-3 font-medium text-gray-700'>
                  Advance Amt
                </th>
                <th className='text-left p-3 font-medium text-gray-700'>
                  Rides Completed
                </th>
                <th className='text-left p-3 font-medium text-gray-700'>
                  Total Rides
                </th>
                <th className='text-left p-3 font-medium text-gray-700'>
                  Ride Dates
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmissions.map((adm) => (
                <tr key={adm.id} className='border-b hover:bg-gray-50'>
                  <td className='p-3'>{adm.student_name}</td>
                  <td className='p-3'>{adm.admission_date}</td>
                  <td className='p-3'>{adm.status}</td>
                  <td className='p-3'>{adm.contact}</td>
                  <td className='p-3'>{adm.license_type}</td>
                  <td className='p-3'>{adm.fees}</td>
                  <td className='p-3'>{adm.advance_amount}</td>
                  <td className='p-3'>{adm.rides_completed}</td>
                  <td className='p-3'>{adm.total_rides}</td>
                  <td className='p-3'>{adm.ride_dates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='text-xs text-gray-400 mt-3'>
          Total admissions: {filteredAdmissions.length}
        </div>
      </>
    );
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>Admissions Backup Reports</CardTitle>
        <Button
          className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
          size='sm'
          onClick={downloadCSV}
          disabled={loading || !filteredAdmissions.length}
        >
          <Download className='w-4 h-4 mr-2' /> Download CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(val) => setTab(val as 'active' | 'completed')}
        >
          <TabsList className='mb-4 flex w-full max-w-xs'>
            <TabsTrigger value='active' className='flex-1'>
              Active Clients
            </TabsTrigger>
            <TabsTrigger value='completed' className='flex-1'>
              Completed / Terminated
            </TabsTrigger>
          </TabsList>
          <TabsContent value='active'>{renderContent()}</TabsContent>
          <TabsContent value='completed'>{renderContent()}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
