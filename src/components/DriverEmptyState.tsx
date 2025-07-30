
import React from 'react';
import { Card } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

export const DriverEmptyState = () => {
  return (
    <Card className="p-6 sm:p-8 text-center">
      <div className="space-y-2">
        <UserCheck className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-600">No drivers found</h3>
        <p className="text-sm sm:text-base text-gray-500">Try adjusting your search or filter criteria</p>
      </div>
    </Card>
  );
};
