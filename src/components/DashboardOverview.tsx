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

interface DashboardOverviewProps {
  userRole: string;
}

export const DashboardOverview = ({ userRole }: DashboardOverviewProps) => {
  const { clients: admissions } = useAdmissions();
  const { drivers } = useDrivers();
  const { rides } = useRides({ drivers, onProgressUpdate: () => {} });
  const { payments, getTotalCollected } = usePayments();
  const { expenses } = useExpenses();

  // Calculate real statistics
  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const activeClients = admissions.filter(a => a.status === 'Active').length;
    const activeDrivers = drivers.filter(d => d.status === 'active').length;
    
    const thisMonthRides = rides.filter(ride => {
      const rideDate = new Date(ride.date);
      return rideDate.getMonth() === currentMonth && rideDate.getFullYear() === currentYear;
    });
    
    const thisMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });
    
    const thisMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const monthlyRevenue = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const monthlyExpenseAmount = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const completedRides = rides.length; // All rides are completed in this system
    
    const licensesPending = admissions.filter(a => 
      a.licenseStatus.learning === 'Applied' || a.licenseStatus.driving === 'Pending'
    ).length;

    return {
      totalClients: admissions.length,
      activeClients,
      activeDrivers,
      monthlyRides: thisMonthRides.length,
      monthlyRevenue,
      monthlyExpenses: monthlyExpenseAmount,
      pendingRides: 0, // No pending rides in current system
      completedRides,
      licensesPending,
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
      
      const dayRides = rides.filter(ride => {
        const rideDate = new Date(ride.date);
        return rideDate.toDateString() === date.toDateString();
      }).length;

      weekData.push({ name: dayName, rides: dayRides });
    }
    return weekData;
  }, [rides]);

  // Package distribution data
  const packageData = useMemo(() => {
    const packageCounts = admissions.reduce((acc, admission) => {
      const duration = admission.duration;
      acc[duration] = (acc[duration] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = admissions.length;
    const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#F59E0B'];
    
    return Object.entries(packageCounts).map(([name, count], index) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
      color: colors[index % colors.length]
    }));
  }, [admissions]);

  // Revenue vs Expenses trend (last 6 months)
  const financialTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const month = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      
      const monthPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
      });
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
      });
      
      const revenue = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const expenseAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      data.push({
        name: months[month],
        revenue,
        expenses: expenseAmount,
        profit: revenue - expenseAmount
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
              Monthly Rides
            </CardTitle>
            <div className='p-2 bg-emerald-100 rounded-lg'>
              <Car className='h-5 w-5 text-emerald-600' />
            </div>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='text-3xl font-bold text-emerald-800 mb-1'>
              {stats.monthlyRides}
            </div>
            <p className='text-sm text-emerald-600 flex items-center gap-1'>
              <CheckCircle className='w-4 h-4' />
              {stats.completedRides} completed
            </p>
          </CardContent>
        </Card>

        {(userRole === 'superadmin' || userRole === 'admin') && (
          <Card className='relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-violet-500/10 via-violet-400/5 to-transparent border-violet-200/50'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-transparent rounded-full -translate-y-16 translate-x-16'></div>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
              <CardTitle className='text-sm font-medium text-violet-700'>
                Monthly Revenue
              </CardTitle>
              <div className='p-2 bg-violet-100 rounded-lg'>
                <Wallet className='h-5 w-5 text-violet-600' />
              </div>
            </CardHeader>
            <CardContent className='relative z-10'>
              <div className='text-3xl font-bold text-violet-800 mb-1'>
                ₹{stats.monthlyRevenue.toLocaleString()}
              </div>
              <p className='text-sm text-violet-600 flex items-center gap-1'>
                <TrendingUp className='w-4 h-4' />
                ₹{stats.totalRevenue.toLocaleString()} total
              </p>
            </CardContent>
          </Card>
        )}

        <Card className='relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border-amber-200/50'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -translate-y-16 translate-x-16'></div>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 relative z-10'>
            <CardTitle className='text-sm font-medium text-amber-700'>
              License Applications
            </CardTitle>
            <div className='p-2 bg-amber-100 rounded-lg'>
              <AlertCircle className='h-5 w-5 text-amber-600' />
            </div>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='text-3xl font-bold text-amber-800 mb-1'>
              {stats.licensesPending}
            </div>
            <p className='text-sm text-amber-600 flex items-center gap-1'>
              <Clock className='w-4 h-4' />
              Pending processing
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
                  <linearGradient id="rideGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='opacity-20' />
                <XAxis 
                  dataKey='name' 
                  axisLine={false}
                  tickLine={false}
                  className='text-sm'
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className='text-sm'
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='rides'
                  stroke='hsl(var(--primary))'
                  fill="url(#rideGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Package Distribution */}
        <Card className='hover:shadow-xl transition-all duration-300 border-secondary/20'>
          <CardHeader className='pb-4'>
            <CardTitle className='flex items-center gap-2 text-xl'>
              <div className='p-2 bg-secondary/10 rounded-lg'>
                <Target className='w-5 h-5 text-secondary' />
              </div>
              Package Distribution
            </CardTitle>
            <CardDescription className='text-muted-foreground'>
              Student enrollment across different packages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={320}>
              <PieChart>
                <Pie
                  data={packageData}
                  cx='50%'
                  cy='50%'
                  innerRadius={80}
                  outerRadius={120}
                  dataKey='count'
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {packageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name) => [`${value} students`, name]}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend (Admin/Superadmin only) */}
      {(userRole === 'superadmin' || userRole === 'admin') && (
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
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='opacity-20' />
                <XAxis 
                  dataKey='name' 
                  axisLine={false}
                  tickLine={false}
                  className='text-sm'
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className='text-sm'
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number, name: string) => [
                    `₹${value.toLocaleString()}`,
                    name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Profit'
                  ]}
                />
                <Area
                  type='monotone'
                  dataKey='revenue'
                  stroke='#10B981'
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                />
                <Area
                  type='monotone'
                  dataKey='expenses'
                  stroke='#EF4444'
                  fill="url(#expenseGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card className='relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-indigo-400/5 to-transparent border-indigo-200/50 hover:shadow-xl transition-all duration-300'>
          <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-transparent rounded-full -translate-y-12 translate-x-12'></div>
          <CardHeader className='relative z-10'>
            <CardTitle className='text-indigo-800 flex items-center gap-2'>
              <div className='p-1.5 bg-indigo-100 rounded-lg'>
                <AlertCircle className='w-4 h-4 text-indigo-600' />
              </div>
              License Processing
            </CardTitle>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-indigo-700'>Pending Applications</span>
                <Badge variant='outline' className='border-indigo-300 text-indigo-700'>
                  {stats.licensesPending}
                </Badge>
              </div>
              <Progress value={((admissions.length - stats.licensesPending) / admissions.length) * 100} className='h-2' />
              <p className='text-xs text-indigo-600'>
                {Math.round(((admissions.length - stats.licensesPending) / admissions.length) * 100)}% processed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='relative overflow-hidden bg-gradient-to-br from-teal-500/10 via-teal-400/5 to-transparent border-teal-200/50 hover:shadow-xl transition-all duration-300'>
          <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-transparent rounded-full -translate-y-12 translate-x-12'></div>
          <CardHeader className='relative z-10'>
            <CardTitle className='text-teal-800 flex items-center gap-2'>
              <div className='p-1.5 bg-teal-100 rounded-lg'>
                <Users className='w-4 h-4 text-teal-600' />
              </div>
              Driver Performance
            </CardTitle>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-teal-700'>Active Drivers</span>
                <Badge variant='outline' className='border-teal-300 text-teal-700'>
                  {stats.activeDrivers}
                </Badge>
              </div>
              <Progress value={stats.activeDrivers > 0 ? (stats.completedRides / (stats.completedRides + stats.pendingRides)) * 100 : 0} className='h-2' />
              <p className='text-xs text-teal-600'>
                {stats.activeDrivers > 0 ? Math.round((stats.completedRides / (stats.completedRides + stats.pendingRides)) * 100) : 0}% completion rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-rose-400/5 to-transparent border-rose-200/50 hover:shadow-xl transition-all duration-300'>
          <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-400/20 to-transparent rounded-full -translate-y-12 translate-x-12'></div>
          <CardHeader className='relative z-10'>
            <CardTitle className='text-rose-800 flex items-center gap-2'>
              <div className='p-1.5 bg-rose-100 rounded-lg'>
                <Target className='w-4 h-4 text-rose-600' />
              </div>
              Monthly Goals
            </CardTitle>
          </CardHeader>
          <CardContent className='relative z-10'>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-rose-700'>Target: {monthlyTarget} rides</span>
                <Badge variant='outline' className='border-rose-300 text-rose-700'>
                  {stats.monthlyRides}/{monthlyTarget}
                </Badge>
              </div>
              <Progress value={Math.min(progressPercentage, 100)} className='h-2' />
              <p className='text-xs text-rose-600'>
                {Math.round(progressPercentage)}% of monthly target
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
