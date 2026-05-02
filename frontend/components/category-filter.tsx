"use client"

import { Badge } from "@/components/ui/badge"

interface Category {
  id: string
  label: string
  count: number
}

interface CategoryFilterProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (id: string) => void
}

export function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeCategory === cat.id
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card border hover:bg-muted"
          }`}
        >
          {cat.label}
          <span className={`ml-1.5 ${activeCategory === cat.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            {cat.count}
          </span>
        </button>
      ))}
    </div>
  )
}
