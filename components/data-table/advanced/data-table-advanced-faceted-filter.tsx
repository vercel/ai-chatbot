import type { DataTableFilterOption, Option } from "@/types"
import { CheckIcon } from "@radix-ui/react-icons"
import type { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

interface DataTableAdvancedFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: Option[]
  selectedValues: Set<string>
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<DataTableFilterOption<TData>[]>
  >
}

export function DataTableAdvancedFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  selectedValues,
  setSelectedOptions,
}: DataTableAdvancedFacetedFilterProps<TData, TValue>) {
  return (
    <Command className="p-1">
      <div className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:px-0">
        <CommandInput
          placeholder={title}
          className="h-full border-0 pl-0 ring-0"
          autoFocus
        />
      </div>
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup className="px-0">
          {options.map((option) => {
            const isSelected = selectedValues.has(option.value)

            return (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  if (isSelected) {
                    selectedValues.delete(option.value)
                  } else {
                    selectedValues.add(option.value)
                  }
                  const filterValues = Array.from(selectedValues)
                  column?.setFilterValue(
                    filterValues.length ? filterValues : undefined
                  )
                  setSelectedOptions((prev) =>
                    prev.map((item) =>
                      item.value === column?.id
                        ? {
                            ...item,
                            filterValues,
                          }
                        : item
                    )
                  )
                }}
              >
                <div
                  className={cn(
                    "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}
                >
                  <CheckIcon className="size-4" aria-hidden="true" />
                </div>
                {option.icon && (
                  <option.icon
                    className="mr-2 size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <span>{option.label}</span>
                {option.withCount &&
                  column?.getFacetedUniqueValues()?.get(option.value) && (
                    <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
                      {column?.getFacetedUniqueValues().get(option.value)}
                    </span>
                  )}
              </CommandItem>
            )
          })}
        </CommandGroup>
        {selectedValues.size > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  column?.setFilterValue(undefined)
                  setSelectedOptions((prev) =>
                    prev.map((item) =>
                      item.value === column?.id
                        ? {
                            ...item,
                            filterValues: [],
                          }
                        : item
                    )
                  )
                }}
                className="justify-center text-center"
              >
                Clear filters
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}
