
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { ClientForm } from "../ClientForm";
import { ClientFormData } from "@/types/client";

interface AdmissionsHeaderProps {
  userRole: string;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  newClient: ClientFormData & { customLicenseType?: string };
  setNewClient: (client: ClientFormData & { customLicenseType?: string }) => void;
  onAddClient: () => void;
}

export const AdmissionsHeader = ({
  userRole,
  showAddForm,
  setShowAddForm,
  newClient,
  setNewClient,
  onAddClient
}: AdmissionsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Admissions Management</h2>
        <p className="text-gray-600">Manage client admissions and track their progress</p>
      </div>
      
      {(userRole === "superadmin" || userRole === "admin") && (
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Fill in the client details for admission. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            
            <ClientForm
              formData={newClient}
              setFormData={setNewClient}
              onSubmit={onAddClient}
              onCancel={() => setShowAddForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
