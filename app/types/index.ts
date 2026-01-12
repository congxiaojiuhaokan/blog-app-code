export interface Post {
  id: string;
  title: string;
  href: string;
}

export interface NavigationItem {
  label: string;
  href: string;
}

export interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

export interface SearchResultsProps {
  results: Post[];
  onResultClick: () => void;
}

export interface MenuDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
