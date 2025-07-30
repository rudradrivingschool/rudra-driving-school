
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";

interface ExpensesChartsProps {
  categoryData: Array<{ name: string, value: number, color: string }>;
  last6MonthsData: Array<{ name: string, amount: number, fullDate: Date }>;
}

export const ExpensesCharts: React.FC<ExpensesChartsProps> = ({
  categoryData,
  last6MonthsData
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories</CardTitle>
        <CardDescription>Distribution of expenses by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              dataKey="value"
              label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trend</CardTitle>
        <CardDescription>Expense trend over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={last6MonthsData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']} />
            <Bar dataKey="amount" fill="#EF4444" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);
