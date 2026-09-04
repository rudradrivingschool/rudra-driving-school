import { useState } from 'react';
import { Client, ClientFormData, SortField, SortDirection } from "@/types/client";
import { validateClientForm } from "@/utils/validation";
import { useAdmissions } from "@/hooks/useAdmissions";

export const useAdmissionsManager = () => {
  const { clients, loading, addClient, updateClient, deleteClient } = useAdmissions();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [newClient, setNewClient] = useState<ClientFormData & { customLicenseType?: string }>({
    name: '',
    contact: '',
    email: '',
    sex: '',
    licenseType: '',
    licenseNumber: '',
    fees: 0,
    advanceAmount: 0,
    duration: '',
    learningLicense: '',
    drivingLicense: '',
    status: 'Active',
    startDate: new Date(),
    additionalNotes: '',
    customLicenseType: '',
    packageRides: 8 // Default to 8 rides package
  });

  const [editClient, setEditClient] = useState<ClientFormData & { customLicenseType?: string }>({
    name: '',
    contact: '',
    email: '',
    sex: '',
    licenseType: '',
    licenseNumber: '',
    fees: 0,
    advanceAmount: 0,
    duration: '',
    learningLicense: '',
    drivingLicense: '',
    status: '',
    startDate: new Date(),
    additionalNotes: '',
    customLicenseType: '',
    packageRides: 8
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteClient, setPendingDeleteClient] = useState<Client | null>(null);

  const handleAddClient = async () => {
    if (!validateClientForm(newClient, false)) return;

    const success = await addClient(newClient);
    if (success) {
      setShowAddForm(false);
      setNewClient({
        name: '',
        contact: '',
        email: '',
        sex: '',
        licenseType: '',
        licenseNumber: '',
        fees: 0,
        advanceAmount: 0,
        duration: '',
        learningLicense: '',
        drivingLicense: '',
        status: 'Active',
        startDate: new Date(),
        additionalNotes: '',
        customLicenseType: '',
        packageRides: 8
      });
      setCurrentPage(1);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditClient({
      name: client.name,
      contact: client.contact,
      email: client.email,
      sex: client.sex,
      licenseType: client.licenseType,
      licenseNumber: client.licenseNumber,
      fees: client.fees,
      advanceAmount: client.advanceAmount,
      duration: client.duration,
      learningLicense: client.licenseStatus.learning,
      drivingLicense: client.licenseStatus.driving,
      status: client.status,
      startDate: client.startDate,
      additionalNotes: client.additionalNotes,
      customLicenseType: '',
      packageRides: client.totalRides || 8 // supports old clients, fallback to 8
    });
    setSelectedClient(client);
    setShowEditForm(true);
  };

  const handleUpdateClient = async () => {
    if (!validateClientForm(editClient, true) || !selectedClient) return;

    const success = await updateClient(selectedClient.id, editClient);
    if (success) {
      setShowEditForm(false);
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  const handleDeleteClient = (client: Client) => {
    setPendingDeleteClient(client);
    setShowDeleteModal(true);
  };

  const confirmDeleteClient = async () => {
    if (pendingDeleteClient) {
      const success = await deleteClient(pendingDeleteClient.id);
      if (success) {
        setShowDeleteModal(false);
        setPendingDeleteClient(null);
      }
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.contact.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'startDate':
          aValue = a.startDate;
          bValue = b.startDate;
          break;
        case 'fees':
          aValue = a.fees;
          bValue = b.fees;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'progress':
          aValue = (a.rides.completed / a.rides.total) * 100;
          bValue = (b.rides.completed / b.rides.total) * 100;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredAndSortedClients.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return {
    // Data
    clients,
    loading,
    paginatedClients,
    
    // State
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
    
    // Computed
    totalPages,
    startIndex,
    endIndex,
    
    // Handlers
    handleAddClient,
    handleEditClient,
    handleUpdateClient,
    handleViewClient,
    handleDeleteClient,
    confirmDeleteClient,
    handleSort,
    handlePageChange
  };
};
