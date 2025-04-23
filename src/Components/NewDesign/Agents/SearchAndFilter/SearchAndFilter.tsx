import { Search, Filter } from "lucide-react";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";

interface AgentCategory {
  id: string;
  name: string;
}
interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: AgentCategory[];
}

const SearchAndFilter = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: SearchAndFilterProps) => {
  return (
    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative flex-1 md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search agents..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background/50 border-white/10 focus:ring-1 focus:ring-primary/40 focus:border-primary/30"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-background/50 border-white/10"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline-block">
              {categories.find((c) => c.id === selectedCategory)?.name ||
                "All Agents"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-black/80 text-white backdrop-blur-md border border-white/10"
        >
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`cursor-pointer ${
                selectedCategory === category.id
                  ? "bg-primary/10 text-white"
                  : ""
              }`}
            >
              {category.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SearchAndFilter;
