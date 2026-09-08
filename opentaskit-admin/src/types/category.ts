export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}
