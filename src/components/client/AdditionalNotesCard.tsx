
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Client } from "@/types/client";

interface AdditionalNotesCardProps {
  notes: string;
}

export const AdditionalNotesCard: React.FC<AdditionalNotesCardProps> = ({ notes }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Additional Notes</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-700 p-3 bg-blue-50 rounded">{notes}</p>
    </CardContent>
  </Card>
);
