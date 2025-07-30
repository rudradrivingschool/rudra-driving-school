import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Download } from 'lucide-react';
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
          <TabsContent value='active'>
            {loading ? (
              <div className='text-center py-6 text-gray-500'>
                Loading admissions data...
              </div>
            ) : filteredAdmissions.length === 0 ? (
              <div className='text-center py-8'>
                No admissions data available
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>License Type</TableHead>
                      <TableHead>Fees</TableHead>
                      <TableHead>Advance Amt</TableHead>
                      <TableHead>Rides Completed</TableHead>
                      <TableHead>Total Rides</TableHead>
                      <TableHead>Ride Dates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmissions.map((adm) => (
                      <TableRow key={adm.id}>
                        <TableCell>{adm.student_name}</TableCell>
                        <TableCell>{adm.admission_date}</TableCell>
                        <TableCell>{adm.status}</TableCell>
                        <TableCell>{adm.contact}</TableCell>
                        <TableCell>{adm.license_type}</TableCell>
                        <TableCell>{adm.fees}</TableCell>
                        <TableCell>{adm.advance_amount}</TableCell>
                        <TableCell>{adm.rides_completed}</TableCell>
                        <TableCell>{adm.total_rides}</TableCell>
                        <TableCell>{adm.ride_dates}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className='text-xs text-gray-400 mt-3'>
                  Total admissions: {filteredAdmissions.length}
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value='completed'>
            {loading ? (
              <div className='text-center py-6 text-gray-500'>
                Loading admissions data...
              </div>
            ) : filteredAdmissions.length === 0 ? (
              <div className='text-center py-8'>
                No admissions data available
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>License Type</TableHead>
                      <TableHead>Fees</TableHead>
                      <TableHead>Advance Amt</TableHead>
                      <TableHead>Rides Completed</TableHead>
                      <TableHead>Total Rides</TableHead>
                      <TableHead>Ride Dates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmissions.map((adm) => (
                      <TableRow key={adm.id}>
                        <TableCell>{adm.student_name}</TableCell>
                        <TableCell>{adm.admission_date}</TableCell>
                        <TableCell>{adm.status}</TableCell>
                        <TableCell>{adm.contact}</TableCell>
                        <TableCell>{adm.license_type}</TableCell>
                        <TableCell>{adm.fees}</TableCell>
                        <TableCell>{adm.advance_amount}</TableCell>
                        <TableCell>{adm.rides_completed}</TableCell>
                        <TableCell>{adm.total_rides}</TableCell>
                        <TableCell>{adm.ride_dates}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className='text-xs text-gray-400 mt-3'>
                  Total admissions: {filteredAdmissions.length}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
