import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
} from 'recharts';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  IndianRupee,
  Plus,
  Calendar as CalendarIcon,
  Fuel,
  Wrench,
  Car,
  FileText,
  Soup,
  Store,
  Wallet,
  Landmark,
  CircleDollarSign,
  TrendingUp,
  Filter,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSignIcon,
} from 'lucide-react';
import { useExpenses, Expense as BackendExpense } from '@/hooks/useExpenses';
import { ExpensesStatsCards } from '@/components/expenses/ExpensesStatsCards';
import { ExpensesBreakdown } from '@/components/expenses/ExpensesBreakdown';
import { CollectionsBreakdown } from '@/components/expenses/CollectionsBreakdown';
import { ExpensesCharts } from '@/components/expenses/ExpensesCharts';
import { ExpensesFilterBar } from '@/components/expenses/ExpensesFilterBar';
import { ExpensesList } from '@/components/expenses/ExpensesList';
import { BalanceSheet } from '@/components/BalanceSheet';
import { usePayments } from '@/hooks/usePayments';
import { useAdmissions } from '@/hooks/useAdmissions';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface ExpenseTrackerProps {
  userRole: string;
}

// --- Category Array: always available ---
const categories = [
  'Fuel',
  'Maintenance',
  'Food',
  'Salaries',
  'Essentials',
  'EMI',
  'Licence',
  'Other',
];

// Help parse backend expense into correct frontend structure (add Date fields, keep IDs)
const parseExpense = (exp: BackendExpense) => ({
  ...exp,
  date: exp.date
    ? typeof exp.date === 'string'
      ? parseISO(exp.date)
      : exp.date
    : new Date(),
  category: exp.purpose, // purposely using backend 'purpose' as category
  description: exp.notes || '',
  amount:
    typeof exp.amount === 'number'
      ? exp.amount
      : parseFloat(String(exp.amount)),
});

export const ExpenseTracker = ({ userRole }: ExpenseTrackerProps) => {
  const {
    expenses: backendExpenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: refetchExpenses,
  } = useExpenses();

  const { payments } = usePayments();
  const { clients } = useAdmissions();

  // UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);

  // --- New Expense State (for Add dialog) ---
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: 0,
    date: new Date(),
    description: '',
  });

  // --- GLOBAL Search and Filter State (no duplicate declarations!) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  // ---- SINGLE "now" for consistent global date calculations ----
  const now = new Date();

  // All expenses, unfiltered
  const allExpenses = useMemo(
    () => backendExpenses.map(parseExpense),
    [backendExpenses]
  );

  // -- The following "selectedMonth/selectedYear" usage is only for the breakdown section --
  // (No longer needed for the bottom expense list/filter/search/category summary)
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const allExpenseYears = useMemo(
    () => [
      ...new Set(
        allExpenses
          .map((exp) => exp.date.getFullYear())
          .concat([now.getFullYear()])
      ),
    ],
    [allExpenses, now]
  );
  const years = Array.from(
    { length: Math.max(...allExpenseYears) - Math.min(...allExpenseYears) + 2 },
    (_, i) => Math.min(...allExpenseYears) + i
  );

  // Separate selectors for breakdown view
  const [selectedBreakdownMonth, setSelectedBreakdownMonth] = useState(
    now.getMonth()
  );
  const [selectedBreakdownYear, setSelectedBreakdownYear] = useState(
    now.getFullYear()
  );

  // Separate selectors for collections breakdown view
  const [selectedCollectionsMonth, setSelectedCollectionsMonth] = useState(
    now.getMonth()
  );
  const [selectedCollectionsYear, setSelectedCollectionsYear] = useState(
    now.getFullYear()
  );

  // Monthly breakdown data (only for the breakdown card/section)
  const breakdownMonthExpenses = allExpenses.filter(
    (exp) =>
      exp.date.getMonth() === selectedBreakdownMonth &&
      exp.date.getFullYear() === selectedBreakdownYear
  );

  // ------- CATEGORY DATA (Global) -------
  // Filter/search logic for the bottom Expenses section (GLOBAL)
  // Global search & filter (over ALL expenses)
  const filteredGlobalExpenses = useMemo(
    () =>
      allExpenses.filter((expense) => {
        const matchesSearch =
          (expense.description || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (expense.category || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesCategory =
          filterCategory === 'all' || expense.category === filterCategory;
        return matchesSearch && matchesCategory;
      }),
    [allExpenses, searchTerm, filterCategory]
  );

  // Chart data (aggregate for filteredGlobalExpenses, i.e., for all filtered, not just month)
  const categoryData = categories
    .map((category) => {
      const categoryExpenses = filteredGlobalExpenses.filter(
        (expense) => expense.category === category
      );
      const total = categoryExpenses.reduce(
        (sum, expense) => sum + (expense.amount || 0),
        0
      );
      return {
        name: category,
        value: total,
        color: {
          Fuel: '#3B82F6',
          Maintenance: '#10B981',
          Food: '#F59E0B',
          Salaries: '#8B5CF6',
          Essentials: '#06B6D4',
          EMI: '#EF4444',
          Licence: '#CA4E79',
          Other: '#6B7280',
        }[category],
      };
    })
    .filter((item) => item.value > 0);

  // Last 6 months bar (still show for all expenses)
  const last6MonthsData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthExpenses = allExpenses
      .filter(
        (expense) =>
          expense.date.getMonth() === date.getMonth() &&
          expense.date.getFullYear() === date.getFullYear()
      )
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    return {
      name: format(date, 'MMM'),
      amount: monthExpenses,
      fullDate: date,
    };
  }).reverse();

  // Pagination for bottom expense list, on filteredGlobalExpenses instead
  const [listPage, setListPage] = useState(1);
  const pageSize = 10;
  const totalFiltered = filteredGlobalExpenses.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);

  // Reset to first page on new filter/search
  useEffect(() => {
    setListPage(1);
  }, [searchTerm, filterCategory]);

  // Only display the current page's expenses from the GLOBAL filtered list
  const paginatedExpenses = useMemo(() => {
    const start = (listPage - 1) * pageSize;
    return filteredGlobalExpenses.slice(start, start + pageSize);
  }, [filteredGlobalExpenses, listPage]);

  // CRUD handlers connected to backend
  const handleAddExpense = async () => {
    if (!newExpense.category) {
      toast.error('Please select a category.');
      return;
    }
    if (!newExpense.amount || isNaN(newExpense.amount)) {
      toast.error('Please enter a valid amount.');
      return;
    }
    const backendPayload = {
      purpose: newExpense.category,
      amount: newExpense.amount,
      date: format(newExpense.date, 'yyyy-MM-dd'),
      notes: newExpense.description,
    };
    const success = await addExpense(backendPayload as any);
    if (success) {
      setShowAddForm(false);
      setNewExpense({
        category: '',
        amount: 0,
        date: new Date(),
        description: '',
      });
      await refetchExpenses();
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;
    const updatedPayload = {
      purpose: editingExpense.category,
      amount: editingExpense.amount,
      date: format(editingExpense.date, 'yyyy-MM-dd'),
      notes: editingExpense.description,
    };
    const success = await updateExpense(editingExpense.id, updatedPayload);
    if (success) {
      setEditingExpense(null);
      await refetchExpenses();
    }
  };

  // For delete confirmation (superadmin only)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteExpense = (id: string) => {
    // superadmin only sees confirm; others just delete (but only superadmin can actually delete)
    if (userRole === 'superadmin') {
      setPendingDeleteId(id);
      setShowDeleteModal(true);
    }
  };
  const confirmDeleteExpense = async () => {
    if (pendingDeleteId) {
      await deleteExpense(pendingDeleteId);
      setShowDeleteModal(false);
      setPendingDeleteId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fuel':
        return <Fuel className='w-4 h-4' />;
      case 'Maintenance':
        return <Wrench className='w-4 h-4' />;
      case 'Food':
        return <Soup className='w-4 h-4' />;
      case 'EMI':
        return <CircleDollarSign className='w-4 h-4' />;
      case 'Licence':
        return <Landmark className='w-4 h-4' />;
      case 'Salaries':
        return <Wallet className='w-4 h-4' />;
      case 'Essentials':
        return <Store className='w-4 h-4' />;
      case 'Other':
        return <FileText className='w-4 h-4' />;
      default:
        return <Car className='w-4 h-4' />;
    }
  };

  return (
    <div className='space-y-8'>
      {/* Balance Sheet */}
      <BalanceSheet />

      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-200'>
        <div>
          <h2 className='text-3xl font-bold bg-gradient-to-r from-slate-800 to-gray-700 bg-clip-text text-transparent'>
            Financial Management
          </h2>
          <p className='text-slate-600 text-lg mt-1'>
            Track expenses and monitor collections with detailed insights.
          </p>
        </div>
        {(userRole === 'superadmin' || userRole === 'admin') && (
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button className='bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg'>
                <Plus className='w-4 h-4 mr-2' />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Record a new expense for your driving school
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='category'>Category</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='amount'>Amount (₹)</Label>
                  <Input
                    id='amount'
                    type='number'
                    value={newExpense.amount}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        amount: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder='0'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-start text-left font-normal'
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {format(newExpense.date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={newExpense.date}
                        onSelect={(date) =>
                          setNewExpense({
                            ...newExpense,
                            date: date || new Date(),
                          })
                        }
                        initialFocus
                        className='p-3 pointer-events-auto'
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={newExpense.description}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        description: e.target.value,
                      })
                    }
                    placeholder='Enter expense description...'
                  />
                </div>
              </div>
              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddExpense}
                  className='bg-green-600 hover:bg-green-700'
                >
                  Add Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Monthly Breakdowns Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Monthly Collections Breakdown */}
        <CollectionsBreakdown
          months={months}
          years={years}
          selectedMonth={selectedCollectionsMonth}
          setSelectedMonth={setSelectedCollectionsMonth}
          selectedYear={selectedCollectionsYear}
          setSelectedYear={setSelectedCollectionsYear}
          payments={payments}
          clients={clients}
        />

        {/* Monthly Expense Breakdown */}
        <ExpensesBreakdown
          months={months}
          years={years}
          selectedMonth={selectedBreakdownMonth}
          setSelectedMonth={setSelectedBreakdownMonth}
          selectedYear={selectedBreakdownYear}
          setSelectedYear={setSelectedBreakdownYear}
          breakdownExpenses={breakdownMonthExpenses}
          userRole={userRole}
          categoryColors={{
            Fuel: '#3B82F6',
            Maintenance: '#10B981',
            Food: '#F59E0B',
            Salaries: '#8B5CF6',
            Essentials: '#06B6D4',
            EMI: '#EF4444',
            Licence: '#CA4E79',
            Other: '#6B7280',
          }}
          getCategoryIcon={getCategoryIcon}
          onEdit={setEditingExpense}
          onDelete={handleDeleteExpense}
        />
      </div>

      {/* Stats Cards */}
      {/* <ExpensesStatsCards
        total={allExpenses.reduce(
          (sum, expense) => sum + (expense.amount || 0),
          0
        )}
        thisMonth={allExpenses
          .filter(
            (exp) =>
              exp.date.getMonth() === now.getMonth() &&
              exp.date.getFullYear() === now.getFullYear()
          )
          .reduce((sum, exp) => sum + (exp.amount || 0), 0)}
        avgPerMonth={(() => {
          const monthlySums: number[] = [];
          for (let i = 0; i < 12; i++) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const sum = allExpenses
              .filter(
                (exp) =>
                  exp.date.getMonth() === month.getMonth() &&
                  exp.date.getFullYear() === month.getFullYear()
              )
              .reduce((s, exp) => s + (exp.amount || 0), 0);
            monthlySums.unshift(sum);
          }
          return Math.round(monthlySums.reduce((a, b) => a + b, 0) / 12);
        })()}
      /> */}

      {/* Charts */}
      <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-6 rounded-xl border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Expense Analytics
        </h3>
        <ExpensesCharts
          categoryData={categoryData}
          last6MonthsData={last6MonthsData}
        />
      </div>

      {/* All Expenses Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          All Expenses
        </h3>
        
        {/* Filter/Search Bar - now filters all expenses */}
        <ExpensesFilterBar
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          filterCategory={filterCategory}
          onCategory={setFilterCategory}
          categories={categories}
        />

        {/* Expense List with Pagination - now shows global filtered expenses */}
        <ExpensesList
          expenses={paginatedExpenses}
          userRole={userRole}
          categoryColors={{
            Fuel: '#3B82F6',
            Maintenance: '#10B981',
            Food: '#F59E0B',
            Salaries: '#8B5CF6',
            Essentials: '#06B6D4',
            EMI: '#EF4444',
            Licence: '#CA4E79',
            Other: '#6B7280',
          }}
          getCategoryIcon={getCategoryIcon}
          onEdit={setEditingExpense}
          onDelete={handleDeleteExpense}
          loading={loading}
          filteredEmpty={filteredGlobalExpenses.length === 0}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className='flex justify-center pt-6'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      setListPage((p) => Math.max(1, p - 1));
                    }}
                    className={
                      listPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href='#'
                      isActive={i + 1 === listPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setListPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      setListPage((p) => Math.min(totalPages, p + 1));
                    }}
                    className={
                      listPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the expense details</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit-category'>Category</Label>
                <Select
                  value={editingExpense.category}
                  onValueChange={(value) =>
                    setEditingExpense({ ...editingExpense, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-amount'>Amount (₹)</Label>
                <Input
                  id='edit-amount'
                  type='number'
                  value={editingExpense.amount}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      amount: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-start text-left font-normal'
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {format(editingExpense.date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={editingExpense.date}
                      onSelect={(date) =>
                        setEditingExpense({
                          ...editingExpense,
                          date: date || new Date(),
                        })
                      }
                      initialFocus
                      className='p-3 pointer-events-auto'
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-description'>Description</Label>
                <Textarea
                  id='edit-description'
                  value={editingExpense.description}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setEditingExpense(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditExpense}
              className='bg-blue-600 hover:bg-blue-700'
            >
              Update Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense DELETE CONFIRM MODAL for superadmin */}
      {userRole === 'superadmin' && (
        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteModal(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteExpense}
                className='bg-red-600 text-white hover:bg-red-700'
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
