
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Client } from "@/types/client";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Completed":
      return "bg-blue-100 text-blue-800";
    case "Terminated":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

interface PersonalInfoCardProps {
  client: Client;
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({ client }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Personal Information</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-600">Full Name</Label>
          <p className="text-sm font-semibold">{client.name}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Gender</Label>
          <p className="text-sm font-semibold">{client.sex}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Contact</Label>
          <p className="text-sm font-semibold">{client.contact}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Email</Label>
          <p className="text-sm font-semibold">{client.email}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">License Type</Label>
          <p className="text-sm font-semibold">{client.licenseType}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">License Number</Label>
          <p className="text-sm font-semibold">{client.licenseNumber}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Status</Label>
          <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

