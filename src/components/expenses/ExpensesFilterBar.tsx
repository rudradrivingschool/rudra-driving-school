
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface ExpensesFilterBarProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  filterCategory: string;
  onCategory: (cat: string) => void;
  categories: string[];
}

export const ExpensesFilterBar: React.FC<ExpensesFilterBarProps> = ({
  searchTerm,
  onSearch,
  filterCategory,
  onCategory,
  categories
}) => (
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder="Search expenses..."
        value={searchTerm}
        onChange={e => onSearch(e.target.value)}
        className="pl-10"
      />
    </div>
    <Select value={filterCategory} onValueChange={onCategory}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <Filter className="w-4 h-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {categories.map(category => (
          <SelectItem key={category} value={category}>{category}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
