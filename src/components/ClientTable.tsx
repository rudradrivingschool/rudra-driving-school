import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { format } from 'date-fns';
import {
  Phone,
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  UserPlus,
} from 'lucide-react';
import { Client, SortField, SortDirection } from '@/types/client';
import { ClientPaymentCell } from './ClientPaymentCell';

interface ClientTableProps {
  clients: Client[];
  userRole: string;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onSort: (field: SortField) => void;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onPageChange: (page: number) => void;
}

export const ClientTable = ({
  clients,
  userRole,
  sortField,
  sortDirection,
  currentPage,
  itemsPerPage,
  totalPages,
  startIndex,
  endIndex,
  onSort,
  onView,
  onEdit,
  onDelete,
  onPageChange,
}: ClientTableProps) => {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className='w-4 h-4 ml-1' />
    ) : (
      <ArrowDown className='w-4 h-4 ml-1' />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className='cursor-pointer hover:bg-gray-50'
                  onClick={() => onSort('name')}
                >
                  <div className='flex items-center'>
                    Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Package</TableHead>
                <TableHead
                  className='cursor-pointer hover:bg-gray-50'
                  onClick={() => onSort('progress')}
                >
                  <div className='flex items-center'>
                    Progress
                    {getSortIcon('progress')}
                  </div>
                </TableHead>
                <TableHead
                  className='cursor-pointer hover:bg-gray-50'
                  onClick={() => onSort('status')}
                >
                  <div className='flex items-center'>
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead
                  className='cursor-pointer hover:bg-gray-50'
                  onClick={() => onSort('fees')}
                >
                  <div className='flex items-center'>
                    Fees & Paid
                    {getSortIcon('fees')}
                  </div>
                </TableHead>
                <TableHead
                  className='cursor-pointer hover:bg-gray-50'
                  onClick={() => onSort('startDate')}
                >
                  <div className='flex items-center'>
                    Start Date
                    {getSortIcon('startDate')}
                  </div>
                </TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className='font-medium'>
                    <div>
                      <div className='font-semibold'>{client.name}</div>
                      <div className='text-sm text-gray-500'>
                        {client.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='text-sm'>
                      <div className='flex items-center gap-1'>
                        <Phone className='w-3 h-3' />
                        {client.contact}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>{client.duration}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className='space-y-1'>
                      <div className='text-sm'>
                        {client.rides.completed}/{client.rides.total} rides
                      </div>
                      <Progress
                        value={
                          (client.rides.completed / client.rides.total) * 100
                        }
                        className='h-2 w-20'
                      />
                      <div className='text-xs text-gray-500'>
                        {Math.round(
                          (client.rides.completed / client.rides.total) * 100
                        )}
                        %
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(client.status)}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ClientPaymentCell client={client} />
                  </TableCell>
                  <TableCell>
                    <div className='text-sm'>
                      {format(client.startDate, 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onView(client)}
                      >
                        <Eye className='w-4 h-4' />
                      </Button>
                      {userRole === 'superadmin' && (
                        <>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => onEdit(client)}
                          >
                            <Edit className='w-4 h-4' />
                          </Button>
                          {userRole === 'superadmin' && (
                            <Button
                              size='sm'
                              variant='outline'
                              className='text-red-600 hover:text-red-700'
                              onClick={() => onDelete(client)}
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {clients.length === 0 && (
            <div className='text-center py-8'>
              <UserPlus className='w-12 h-12 text-gray-400 mx-auto mb-2' />
              <h3 className='text-lg font-semibold text-gray-600'>
                No clients found
              </h3>
              <p className='text-gray-500'>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-700'>
            Showing {startIndex + 1} to {Math.min(endIndex, clients.length)} of{' '}
            {clients.length} results
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className='cursor-pointer'
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
