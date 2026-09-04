import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  Users,
  Car,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';
import { useAdmissions } from '@/hooks/useAdmissions';
import { useDrivers } from '@/hooks/useDrivers';
import { useRides } from '@/hooks/useRides';
import { usePayments } from '@/hooks/usePayments';
import { useExpenses } from '@/hooks/useExpenses';

export const AnalyticsDashboard = () => {
  const { clients: admissions } = useAdmissions();
  const { drivers } = useDrivers();
  const { rides } = useRides({ drivers, onProgressUpdate: () => {} });
  const { payments, getTotalCollected } = usePayments();
  const { expenses } = useExpenses();

  // Calculate real statistics
  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const activeClients = admissions.filter(
      (a) => a.status === 'Active'
    ).length;
    const activeDrivers = drivers.filter((d) => d.status === 'active').length;

    const thisMonthRides = rides.filter((ride) => {
      const rideDate = new Date(ride.date);
      return (
        rideDate.getMonth() === currentMonth &&
        rideDate.getFullYear() === currentYear
      );
    });

    const thisMonthPayments = payments.filter((payment) => {
      const paymentDate = new Date(payment.payment_date);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    });

    const thisMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });

    const monthlyRevenue = thisMonthPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const monthlyExpenseAmount = thisMonthExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const completedRides = rides.length; // All rides are completed in this system

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return {
      totalClients: admissions.length,
      activeClients,
      activeDrivers,
      monthlyRides: thisMonthRides.length,
      monthlyRevenue,
      monthlyExpenses: monthlyExpenseAmount,
      pendingRides: 0, // No pending rides in current system
      completedRides,
      totalExpenses,
      totalRevenue: getTotalCollected(),
    };
  }, [admissions, drivers, rides, payments, expenses, getTotalCollected]);

  // Generate last 7 days ride data
  const weeklyRideData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];

      const dayRides = rides.filter((ride) => {
        const rideDate = new Date(ride.date);
        return rideDate.toDateString() === date.toDateString();
      }).length;

      weekData.push({ name: dayName, rides: dayRides });
    }
    return weekData;
  }, [rides]);

  // Driver ride completion comparison data
  const driverRideData = useMemo(() => {
    const driverRides = drivers
      .map((driver) => {
        const driverRideCount = rides.filter(
          (ride) => ride.driverId === driver.id
        ).length;
        return {
          name: driver.name.split(' ')[0], // First name only for chart readability
          rides: driverRideCount,
          status: driver.status,
        };
      })
      .filter((driver) => driver.rides > 0);

    // Sort by ride count for better visualization
    return driverRides.sort((a, b) => b.rides - a.rides);
  }, [drivers, rides]);

  // Revenue vs Expenses trend (last 6 months)
  const financialTrendData = useMemo(() => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const month = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;

      const monthPayments = payments.filter((payment) => {
        const paymentDate = new Date(payment.payment_date);
        return (
          paymentDate.getMonth() === month && paymentDate.getFullYear() === year
        );
      });

      const monthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === month && expenseDate.getFullYear() === year
        );
      });

      const revenue = monthPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      const expenseAmount = monthExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      data.push({
        name: months[month],
        revenue,
        expenses: expenseAmount,
        profit: revenue - expenseAmount,
      });
    }
    return data;
  }, [payments, expenses]);

  const monthlyTarget = 1000;
  const progressPercentage = (stats.monthlyRides / monthlyTarget) * 100;

  return (
    <div className='space-y-8 p-6'>
      {/* Header Section */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'>
            Dashboard Overview
          </h1>
          <p className='text-muted-foreground mt-1'>
            Welcome back! Here's what's happening at your driving school.
          </p>
        </div>
        <div className='flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20'>
          <Sparkles className='w-5 h-5 text-primary' />
          <span className='text-sm font-medium'>Live Dashboard</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent border-blue-200/50'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -translate-y-16 translate-x-16'></div>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
            <CardTitle className='text-sm font-medium text-blue-700'>
              Total Students
            </CardTitle>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Users className='h-5 w-5 text-blue-600' />
            </div>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='text-3xl font-bold text-blue-800 mb-1'>
              {stats.totalClients}
            </div>
            <p className='text-sm text-blue-600 flex items-center gap-1'>
              <TrendingUp className='w-4 h-4' />
              {stats.activeClients} active students
            </p>
          </CardContent>
        </Card>

        <Card className='relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent border-emerald-200/50'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full -translate-y-16 translate-x-16'></div>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
            <CardTitle className='text-sm font-medium text-emerald-700'>
              Total Rides
            </CardTitle>
            <div className='p-2 bg-emerald-100 rounded-lg'>
              <Car className='h-5 w-5 text-emerald-600' />
            </div>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='text-3xl font-bold text-emerald-800 mb-1'>
              {stats.completedRides}
            </div>
            <p className='text-sm text-emerald-600 flex items-center gap-1'>
              <CheckCircle className='w-4 h-4' />
              {stats.monthlyRides} rides this month
            </p>
          </CardContent>
        </Card>

        <Card className='relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-violet-500/10 via-violet-400/5 to-transparent border-violet-200/50'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-transparent rounded-full -translate-y-16 translate-x-16'></div>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
            <CardTitle className='text-sm font-medium text-violet-700'>
              Total Revenue
            </CardTitle>
            <div className='p-2 bg-violet-100 rounded-lg'>
              <Wallet className='h-5 w-5 text-violet-600' />
            </div>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='text-3xl font-bold text-violet-800 mb-1'>
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <p className='text-sm text-violet-600 flex items-center gap-1'>
              <TrendingUp className='w-4 h-4 mr-1' />₹
              {stats.monthlyRevenue.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card className='relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-red-500/10 via-red-400/5 to-transparent border-red-200/50'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/20 to-transparent rounded-full -translate-y-16 translate-x-16'></div>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
            <CardTitle className='text-sm font-medium text-red-700'>
              Total Expenses
            </CardTitle>
            <div className='p-2 bg-red-100 rounded-lg'>
              <DollarSign className='h-5 w-5 text-red-600' />
            </div>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='text-3xl font-bold text-red-800 mb-1'>
              ₹{stats.totalExpenses.toLocaleString()}
            </div>
            <p className='text-sm text-red-600 flex items-center gap-1'>
              <TrendingUp className='w-4 h-4 mr-1' />₹
              {stats.monthlyExpenses.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Weekly Rides Chart */}
        <Card className='hover:shadow-xl transition-all duration-300 border-primary/20'>
          <CardHeader className='pb-4'>
            <CardTitle className='flex items-center gap-2 text-xl'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Calendar className='w-5 h-5 text-primary' />
              </div>
              Weekly Performance
            </CardTitle>
            <CardDescription className='text-muted-foreground'>
              Ride completions over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={320}>
              <AreaChart data={weeklyRideData}>
                <defs>
                  <linearGradient id='rideGradient' x1='0' y1='0' x2='0' y2='1'>
                    <stop
                      offset='5%'
                      stopColor='hsl(var(--primary))'
                      stopOpacity={0.3}
                    />
                    <stop
                      offset='95%'
                      stopColor='hsl(var(--primary))'
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='opacity-20' />
                <XAxis
                  dataKey='name'
                  axisLine={false}
                  tickLine={false}
                  className='text-sm'
                />
                <YAxis axisLine={false} tickLine={false} className='text-sm' />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='rides'
                  stroke='hsl(var(--primary))'
                  fill='url(#rideGradient)'
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Driver Ride Completion Comparison */}
        <Card className='hover:shadow-xl transition-all duration-300 border-secondary/20'>
          <CardHeader className='pb-4'>
            <CardTitle className='flex items-center gap-2 text-xl'>
              <div className='p-2 bg-secondary/10 rounded-lg'>
                <Users className='w-5 h-5 text-secondary' />
              </div>
              Driver Performance
            </CardTitle>
            <CardDescription className='text-muted-foreground'>
              Ride completion comparison across all drivers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={320}>
              <BarChart
                data={driverRideData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id='driverBarGradient'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop
                      offset='5%'
                      stopColor='hsl(var(--secondary))'
                      stopOpacity={0.9}
                    />
                    <stop
                      offset='95%'
                      stopColor='hsl(var(--secondary))'
                      stopOpacity={0.6}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='opacity-20' />
                <XAxis
                  dataKey='name'
                  axisLine={false}
                  tickLine={false}
                  className='text-sm'
                  angle={-45}
                  textAnchor='end'
                  height={80}
                />
                <YAxis axisLine={false} tickLine={false} className='text-sm' />
                <Tooltip
                  formatter={(value: number) => [
                    `${value} rides`,
                    'Completed Rides',
                  ]}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar
                  dataKey='rides'
                  fill='url(#driverBarGradient)'
                  radius={[4, 4, 0, 0]}
                  stroke='hsl(var(--secondary))'
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card className='hover:shadow-xl transition-all duration-300 border-accent/20'>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center gap-2 text-xl'>
            <div className='p-2 bg-accent/10 rounded-lg'>
              <TrendingUp className='w-5 h-5 text-accent' />
            </div>
            Financial Overview
          </CardTitle>
          <CardDescription className='text-muted-foreground'>
            Revenue vs expenses comparison over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={400}>
            <AreaChart data={financialTrendData}>
              <defs>
                <linearGradient
                  id='revenueGradient'
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop offset='5%' stopColor='#10B981' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='#10B981' stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id='expenseGradient'
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop offset='5%' stopColor='#EF4444' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='#EF4444' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' className='opacity-20' />
              <XAxis
                dataKey='name'
                axisLine={false}
                tickLine={false}
                className='text-sm'
              />
              <YAxis axisLine={false} tickLine={false} className='text-sm' />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString()}`,
                  name === 'revenue'
                    ? 'Revenue'
                    : name === 'expenses'
                    ? 'Expenses'
                    : 'Profit',
                ]}
              />
              <Area
                type='monotone'
                dataKey='revenue'
                stroke='#10B981'
                fill='url(#revenueGradient)'
                strokeWidth={3}
              />
              <Area
                type='monotone'
                dataKey='expenses'
                stroke='#EF4444'
                fill='url(#expenseGradient)'
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
