
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Client } from "@/types/client";

const getLicenseStatusIcon = (status: string) => {
  switch (status) {
    case "Received":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "Applied":
    case "Pending":
      return <Clock className="w-4 h-4 text-yellow-600" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
  }
};

interface LicenseStatusCardProps {
  client: Client;
}

export const LicenseStatusCard: React.FC<LicenseStatusCardProps> = ({ client }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">License Status</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span className="font-medium">Learning License</span>
          <div className="flex items-center gap-2">
            {getLicenseStatusIcon(client.licenseStatus.learning)}
            <span className="font-semibold">{client.licenseStatus.learning}</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span className="font-medium">Driving License</span>
          <div className="flex items-center gap-2">
            {getLicenseStatusIcon(client.licenseStatus.driving)}
            <span className="font-semibold">{client.licenseStatus.driving}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
