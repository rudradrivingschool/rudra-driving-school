
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Client, ClientFormData } from "@/types/client";
import { ClientForm } from "../ClientForm";
import { ClientDetailsModal } from "../ClientDetailsModal";
import { ClientDeleteModal } from "../ClientDeleteModal";

interface AdmissionsDialogsProps {
  showEditForm: boolean;
  setShowEditForm: (show: boolean) => void;
  showClientDetails: boolean;
  setShowClientDetails: (show: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  selectedClient: Client | null;
  editClient: ClientFormData & { customLicenseType?: string };
  setEditClient: (client: ClientFormData & { customLicenseType?: string }) => void;
  pendingDeleteClient: Client | null;
  setPendingDeleteClient: (client: Client | null) => void;
  onUpdateClient: () => void;
  onConfirmDelete: () => void;
}

export const AdmissionsDialogs = ({
  showEditForm,
  setShowEditForm,
  showClientDetails,
  setShowClientDetails,
  showDeleteModal,
  setShowDeleteModal,
  selectedClient, // now passed from manager
  editClient,
  setEditClient,
  pendingDeleteClient,
  setPendingDeleteClient,
  onUpdateClient,
  onConfirmDelete
}: AdmissionsDialogsProps) => {
  return (
    <>
      {/* Edit Client Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client details. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <ClientForm
            formData={editClient}
            setFormData={setEditClient}
            onSubmit={onUpdateClient}
            onCancel={() => setShowEditForm(false)}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Client Details Modal */}
      <ClientDetailsModal
        client={selectedClient} // correctly pass client details
        isOpen={showClientDetails}
        onClose={() => setShowClientDetails(false)}
      />

      {/* Client Delete Modal */}
      <ClientDeleteModal
        open={showDeleteModal}
        onOpenChange={open => {
          setShowDeleteModal(open);
          if (!open) setPendingDeleteClient(null);
        }}
        clientName={pendingDeleteClient?.name || ""}
        onConfirm={onConfirmDelete}
      />
    </>
  );
};
