import React from 'react';
import { Loader2 } from 'lucide-react';
import { ClientTable } from './ClientTable';
import { AdmissionsHeader } from './admissions/AdmissionsHeader';
import { AdmissionsSearchFilter } from './admissions/AdmissionsSearchFilter';
import { AdmissionsDialogs } from './admissions/AdmissionsDialogs';
import { useAdmissionsManager } from './admissions/useAdmissionsManager';

interface AdmissionsManagerProps {
  userRole: string;
}

export const AdmissionsManager = ({ userRole }: AdmissionsManagerProps) => {
  const {
    loading,
    paginatedClients,
    showAddForm,
    setShowAddForm,
    showEditForm,
    setShowEditForm,
    showClientDetails,
    setShowClientDetails,
    selectedClient,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortField,
    sortDirection,
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    newClient,
    setNewClient,
    editClient,
    setEditClient,
    showDeleteModal,
    setShowDeleteModal,
    pendingDeleteClient,
    setPendingDeleteClient,
    totalPages,
    startIndex,
    endIndex,
    handleAddClient,
    handleEditClient,
    handleUpdateClient,
    handleViewClient,
    handleDeleteClient,
    confirmDeleteClient,
    handleSort,
    handlePageChange,
  } = useAdmissionsManager();

  // Allow update for admin and superadmin, but delete only for superadmin
  const canEdit = userRole === 'superadmin';
  const canDelete = userRole === 'superadmin';

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='w-8 h-8 animate-spin' />
        <span className='ml-2'>Loading clients...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <AdmissionsHeader
        userRole={userRole}
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        newClient={newClient}
        setNewClient={setNewClient}
        onAddClient={handleAddClient}
      />

      <AdmissionsSearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
      />

      <ClientTable
        clients={paginatedClients}
        userRole={userRole}
        sortField={sortField}
        sortDirection={sortDirection}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        onSort={handleSort}
        onView={handleViewClient}
        onEdit={canEdit ? handleEditClient : undefined}
        onDelete={canDelete ? handleDeleteClient : undefined}
        onPageChange={handlePageChange}
      />

      <AdmissionsDialogs
        showEditForm={showEditForm && canEdit}
        setShowEditForm={setShowEditForm}
        showClientDetails={showClientDetails}
        setShowClientDetails={setShowClientDetails}
        showDeleteModal={showDeleteModal && canDelete}
        setShowDeleteModal={setShowDeleteModal}
        selectedClient={selectedClient}
        editClient={editClient}
        setEditClient={setEditClient}
        pendingDeleteClient={pendingDeleteClient}
        setPendingDeleteClient={setPendingDeleteClient}
        onUpdateClient={canEdit ? handleUpdateClient : undefined}
        onConfirmDelete={canDelete ? confirmDeleteClient : undefined}
      />
    </div>
  );
};
