import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { DashboardOverview } from '@/components/DashboardOverview';
import { AdmissionsManager } from '@/components/AdmissionsManager';
import { RideManager } from '@/components/RideManager';
import { ExpenseTracker } from '@/components/ExpenseTracker';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { DriversManager } from '@/components/DriversManager';
import {
  Users,
  Car,
  DollarSign,
  BarChart3,
  Calendar,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Reports } from '@/components/Reports';
import { useAuth } from '@/contexts/AuthContext'; // <-- ESM import
import { DriverDashboard } from '@/components/DriverDashboard';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Get user from AuthContext using hook
  const { user } = useAuth();
  const userRole = user?.role || 'driver';

  // Only allow "dashboard" and "rides" to driver
  const allowedTabs =
    userRole === 'driver'
      ? ['dashboard', 'rides']
      : ['dashboard', 'admissions', 'rides', 'drivers', 'expenses', 'reports'];
  const shouldShowTab = (tab: string) => allowedTabs.includes(tab);

  // If role changes and current tab is no longer allowed, set to dashboard or first available
  React.useEffect(() => {
    if (!shouldShowTab(activeTab)) setActiveTab('dashboard');
    // eslint-disable-next-line
  }, [userRole]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-paleblue via-palepurple to-palepink bg-fixed'>
      <Navigation userRole={userRole} />
      <div className='container max-w-full mx-auto px-2 sm:px-4 py-4 sm:py-8'>
        {/* Header */}
        <div className=''>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0'>
            <div>
              {/* <h1 className='text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(129,98,248,0.18)]'>
                Rudra Driving School
              </h1>
              <p className='text-gray-600 mt-2 text-sm sm:text-base'>
                Comprehensive management system for your driving school
              </p> */}
            </div>
            <div className='flex items-center mb-4 xl:mb-0'>
              <Badge
                variant='outline'
                className='text-sm md:text-base  bg-palegreen/90 border-none font-semibold shadow'
              >
                <span className='text-2xl mb-1'>👋</span>Welcome Back,{' '}
                {user.name}
                {/* Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)} */}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-4 sm:space-y-6'
        >
          <TabsList className='overflow-x-auto custom-scroll'>
            {shouldShowTab('dashboard') && (
              <TabsTrigger value='dashboard' className=''>
                <BarChart3 className='w-4 h-4' />
                Dashboard
              </TabsTrigger>
            )}
            {shouldShowTab('admissions') && (
              <TabsTrigger value='admissions'>
                <Users className='w-4 h-4' />
                Admissions
              </TabsTrigger>
            )}
            {shouldShowTab('rides') && (
              <TabsTrigger value='rides'>
                <Car className='w-4 h-4' />
                Rides
              </TabsTrigger>
            )}
            {shouldShowTab('drivers') && (
              <TabsTrigger value='drivers'>
                <UserCheck className='w-4 h-4' />
                Drivers
              </TabsTrigger>
            )}
            {shouldShowTab('expenses') && (
              <TabsTrigger value='expenses'>
                <DollarSign className='w-4 h-4' />
                Expenses
              </TabsTrigger>
            )}
            {shouldShowTab('reports') && (
              <TabsTrigger value='reports'>
                <Calendar className='w-4 h-4' />
                Reports
              </TabsTrigger>
            )}
          </TabsList>

          {/* SWAP DASHBOARD VIEW BY ROLE */}
          <TabsContent value='dashboard'>
            {userRole === 'driver' ? (
              <DriverDashboard />
            ) : (
              <AnalyticsDashboard />
            )}
          </TabsContent>
          {shouldShowTab('admissions') && (
            <TabsContent value='admissions'>
              <AdmissionsManager userRole={userRole} />
            </TabsContent>
          )}
          <TabsContent value='rides'>
            <RideManager userRole={userRole} />
          </TabsContent>
          {shouldShowTab('drivers') && (
            <TabsContent value='drivers'>
              <DriversManager userRole={userRole} />
            </TabsContent>
          )}
          {shouldShowTab('expenses') && (
            <TabsContent value='expenses'>
              <ExpenseTracker userRole={userRole} />
            </TabsContent>
          )}
          {shouldShowTab('reports') && (
            <TabsContent value='reports'>
              <Reports />
            </TabsContent>
          )}
        </Tabs>
      </div>
      <footer className='w-full p-4 text-slate-600 text-center text-sm'>
        © 2025 All rights reserved. Project by{' '}
        <a
          href='https://x.com/girishdigge'
          className='text-indigo-600 hover:text-indigo-500 underline decoration-indigo-300 underline-offset-2 transition-colors duration-200'
        >
          Girish Digge
        </a>
      </footer>
    </div>
  );
};

export default Index;
