
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { IndianRupee } from "lucide-react";

interface ExpensesListProps {
  expenses: any[];
  userRole: string;
  categoryColors: { [key: string]: string };
  getCategoryIcon: (category: string) => React.ReactNode;
  onEdit: (exp: any) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  filteredEmpty: boolean;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  userRole,
  categoryColors,
  getCategoryIcon,
  onEdit,
  onDelete,
  loading,
  filteredEmpty
}) => (
  <div className="space-y-4">
    {loading && (
      <Card className="p-6 text-center">Loading expenses...</Card>
    )}
    {!loading && expenses.map((expense) => (
      <Card key={expense.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${categoryColors[expense.category]}20` }}>
                <span style={{ color: categoryColors[expense.category] }}>
                  {getCategoryIcon(expense.category)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{expense.description}</h3>
                  <Badge variant="outline" style={{ borderColor: categoryColors[expense.category] }}>
                    {expense.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {format(expense.date, 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold text-red-600">
                ₹{expense.amount.toLocaleString()}
              </p>
              {userRole === "superadmin" && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEdit(expense)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDelete(expense.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
    {!loading && filteredEmpty && (
      <Card className="p-8 text-center">
        <div className="space-y-2">
          <IndianRupee className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-600">No expenses found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      </Card>
    )}
  </div>
);
