import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { usePayments } from '@/hooks/usePayments';

export const BalanceSheet = () => {
  const { expenses } = useExpenses();
  const { payments } = usePayments();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Overall Calculations
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );
  const totalCollected = payments.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  );
  const balance = totalCollected - totalExpenses;
  const profitMargin =
    totalCollected > 0 ? (balance / totalCollected) * 100 : 0;

  // Current Month Calculations (Memoized)
  const {
    currentMonthExpenses,
    currentMonthCollected,
    currentMonthBalance,
    currentMonthProfitMargin,
  } = useMemo(() => {
    const monthExpenses = expenses
      .filter(
        (expense) =>
          new Date(expense.date).getMonth() === currentMonth &&
          new Date(expense.date).getFullYear() === currentYear
      )
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const monthCollected = payments
      .filter(
        (payment) =>
          new Date(payment.payment_date).getMonth() === currentMonth &&
          new Date(payment.payment_date).getFullYear() === currentYear
      )
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const monthBalance = monthCollected - monthExpenses;
    const monthProfitMargin =
      monthCollected > 0 ? (monthBalance / monthCollected) * 100 : 0;

    return {
      currentMonthExpenses: monthExpenses,
      currentMonthCollected: monthCollected,
      currentMonthBalance: monthBalance,
      currentMonthProfitMargin: monthProfitMargin,
    };
  }, [expenses, payments, currentMonth, currentYear]);

  const getStatusText = (margin) => {
    return margin >= 20
      ? 'Excellent'
      : margin >= 10
      ? 'Good'
      : 'Needs improvement';
  };

  const getStatusColor = (margin) => {
    return margin >= 20
      ? 'text-emerald-600'
      : margin >= 10
      ? 'text-blue-600'
      : 'text-amber-600';
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
      {/* Overall Balance Sheet Card */}
      <Card className='relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border border-slate-200/50 shadow-xl'>
        <div className='absolute inset-0 bg-gradient-to-r from-violet-100/30 via-transparent to-blue-100/30'></div>
        <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-transparent rounded-full -translate-y-8 translate-x-8'></div>
        <div className='absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-violet-200/15 to-transparent rounded-full translate-y-8 -translate-x-8'></div>

        <CardHeader className='pb-6 relative z-10'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xl font-semibold text-slate-700 flex items-center gap-3'>
              <div className='p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg'>
                <BarChart3 className='h-5 w-5 text-white' />
              </div>
              Overall Financial Summary
            </CardTitle>
            <div className='flex items-center gap-2 text-xs font-medium text-indigo-700 bg-gradient-to-r from-indigo-100 to-violet-100 px-3 py-2 rounded-full border border-indigo-200/50'>
              <Sparkles className='h-3 w-3' />
              All Time
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-5 relative z-10'>
          {/* Revenue & Expenses Combined Section */}
          <div className='bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 shadow-sm border border-slate-200/50'>
            <div className='grid grid-cols-2 gap-6'>
              {/* Revenue */}
              <div>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md'>
                    <TrendingUp className='h-4 w-4 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-emerald-800'>
                    Total Revenue
                  </span>
                </div>
                <div className='text-3xl font-bold text-emerald-700 mb-2 tracking-tight'>
                  ₹{totalCollected.toLocaleString()}
                </div>
                <p className='text-xs text-emerald-600/80'>
                  From all admissions and payments
                </p>
              </div>

              {/* Expenses */}
              <div>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg shadow-md'>
                    <TrendingDown className='h-4 w-4 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-rose-800'>
                    Total Expenses
                  </span>
                </div>
                <div className='text-3xl font-bold text-rose-700 mb-2 tracking-tight'>
                  ₹{totalExpenses.toLocaleString()}
                </div>
                <p className='text-xs text-rose-600/80'>
                  All operational and administrative costs
                </p>
              </div>
            </div>
          </div>

          {/* Net Position */}
          <div className='bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 border-2 border-dashed border-slate-300/60 shadow-sm'>
            <div className='grid grid-cols-2 gap-5'>
              <div>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-md'>
                    <DollarSign className='h-4 w-4 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-slate-700'>
                    Net Balance
                  </span>
                </div>
                <div
                  className={`text-2xl font-bold mb-2 tracking-tight ${
                    balance >= 0 ? 'text-blue-700' : 'text-amber-700'
                  }`}
                >
                  ₹{balance.toLocaleString()}
                </div>
                <p
                  className={`text-xs font-medium ${
                    balance >= 0 ? 'text-blue-600/80' : 'text-amber-600/80'
                  }`}
                >
                  {balance >= 0 ? 'Total Profit' : 'Total Loss'}
                </p>
              </div>
              <div>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-md'>
                    <Target className='h-4 w-4 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-slate-700'>
                    Profit Margin
                  </span>
                </div>
                <div className='text-2xl font-bold text-violet-700 mb-2 tracking-tight'>
                  {profitMargin.toFixed(1)}%
                </div>
                <p
                  className={`text-xs font-medium ${getStatusColor(
                    profitMargin
                  )}`}
                >
                  {getStatusText(profitMargin)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Month Balance Sheet Card */}
      <Card className='relative overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 border border-sky-200/50 shadow-xl'>
        <div className='absolute inset-0 bg-gradient-to-r from-emerald-100/30 via-transparent to-cyan-100/30'></div>
        <div className='absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-cyan-200/20 to-transparent rounded-full -translate-y-16 -translate-x-16'></div>
        <div className='absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-tl from-blue-200/15 to-transparent rounded-full translate-y-12 translate-x-12'></div>

        <CardHeader className='pb-6 relative z-10'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xl font-semibold text-slate-700 flex items-center gap-3'>
              <div className='p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg'>
                <Calendar className='h-5 w-5 text-white' />
              </div>
              {monthName} {currentYear} Summary
            </CardTitle>
            <div className='flex items-center gap-2 text-xs font-medium text-cyan-700 bg-gradient-to-r from-cyan-100 to-blue-100 px-3 py-2 rounded-full border border-cyan-200/50'>
              <Sparkles className='h-3 w-3' />
              Current Month
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-5 relative z-10'>
          {/* Monthly Revenue & Expenses Combined Section */}
          <div className='bg-gradient-to-br from-white to-sky-50 rounded-xl p-5 shadow-sm border border-sky-200/50'>
            <div className='grid grid-cols-2 gap-6'>
              {/* Monthly Revenue */}
              <div>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-gradient-to-br from-lime-500 to-emerald-600 rounded-lg shadow-md'>
                    <TrendingUp className='h-4 w-4 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-emerald-800'>
                    Monthly Revenue
                  </span>
                </div>
                <div className='text-3xl font-bold text-emerald-700 mb-2 tracking-tight'>
                  ₹{currentMonthCollected.toLocaleString()}
                </div>
                <p className='text-xs text-emerald-600/80'>
                  Collections received this month
                </p>
              </div>

              {/* Monthly Expenses */}
              <div>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-md'>
                    <TrendingDown className='h-4 w-4 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-orange-800'>
                    Monthly Expenses
                  </span>
                </div>
                <div className='text-3xl font-bold text-orange-700 mb-2 tracking-tight'>
                  ₹{currentMonthExpenses.toLocaleString()}
                </div>
                <p className='text-xs text-orange-600/80'>
                  Operational expenses this month
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Net Position */}
          <div className='bg-gradient-to-br from-white to-sky-50 rounded-xl p-5 border-2 border-dashed border-sky-300/60 shadow-sm'>
            <div className='grid grid-cols-2 gap-5'>
              <div>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-md'>
                    <DollarSign className='h-4 w-4 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-slate-700'>
                    Monthly Balance
                  </span>
                </div>
                <div
                  className={`text-2xl font-bold mb-2 tracking-tight ${
                    currentMonthBalance >= 0
                      ? 'text-teal-700'
                      : 'text-orange-700'
                  }`}
                >
                  ₹{currentMonthBalance.toLocaleString()}
                </div>
                <p
                  className={`text-xs font-medium ${
                    currentMonthBalance >= 0
                      ? 'text-teal-600/80'
                      : 'text-orange-600/80'
                  }`}
                >
                  {currentMonthBalance >= 0 ? 'Monthly Profit' : 'Monthly Loss'}
                </p>
              </div>
              <div>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-md'>
                    <Target className='h-4 w-4 text-white' />
                  </div>
                  <span className='text-sm font-semibold text-slate-700'>
                    Monthly Margin
                  </span>
                </div>
                <div className='text-2xl font-bold text-indigo-700 mb-2 tracking-tight'>
                  {currentMonthProfitMargin.toFixed(1)}%
                </div>
                <p
                  className={`text-xs font-medium ${getStatusColor(
                    currentMonthProfitMargin
                  )}`}
                >
                  {getStatusText(currentMonthProfitMargin)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
