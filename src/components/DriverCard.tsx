import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DriverDetailsModal } from "./DriverDetailsModal";
import { Phone, Eye, Mail, Edit, Trash2 } from "lucide-react";
import { Driver } from "@/types/driver";

interface DriverCardProps {
  driver: Driver;
  userRole: string;
  onEdit: (driver: Driver) => void;
  onDelete: (driverId: string) => void;
  onViewDetails: (driver: Driver) => void;
}

export const DriverCard = ({ driver, userRole, onEdit, onDelete, onViewDetails }: DriverCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{driver.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" />
                {driver.phone}
              </p>
              {driver.email && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3" />
                  {driver.email}
                </p>
              )}
            </div>
            <Badge 
              variant={driver.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {driver.status}
            </Badge>
          </div>

          {/* Credentials */}
          <div className="space-y-1 text-xs sm:text-sm text-gray-500">
            <div>
              <span className="font-semibold">Username:</span> <span>{driver.username}</span>
            </div>
            <div>
              <span className="font-semibold">Role:</span> <span>{driver.role.charAt(0).toUpperCase() + driver.role.slice(1)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={() => onViewDetails(driver)}
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
            
            {userRole === "superadmin" && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => onEdit(driver)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs text-red-600 hover:text-red-700"
                  onClick={() => onDelete(driver.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
