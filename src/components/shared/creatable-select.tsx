"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreatableOption {
  id: string
  name: string
  code?: string
}

interface CreatableSelectProps {
  options: CreatableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onCreate: (name: string) => Promise<CreatableOption | null>
  className?: string
  disabled?: boolean
  formatOption?: (opt: CreatableOption) => string
}

export function CreatableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  onCreate,
  className,
  disabled,
  formatOption,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter((opt) =>
    (opt.name + (opt.code ? ` ${opt.code}` : ""))
      .toLowerCase()
      .includes(query.toLowerCase())
  )

  const selected = options.find((opt) => opt.id === value)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open, creating])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const created = await onCreate(newName.trim())
      if (created) {
        onChange(created.id)
        setNewName("")
        setQuery("")
        setOpen(false)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen(!open); setCreating(false); setQuery("") }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected ? (formatOption ? formatOption(selected) : selected.name) : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          {!creating ? (
            <>
              <div className="p-1">
                <Input
                  ref={inputRef}
                  placeholder="Search or type new..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-8 border-0 focus-visible:ring-0"
                />
              </div>
              <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
                {filtered.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); setQuery("") }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                      value === opt.id && "bg-accent"
                    )}
                  >
                    <Check className={cn("h-4 w-4", value === opt.id ? "opacity-100" : "opacity-0")} />
                    {formatOption ? formatOption(opt) : opt.name}
                  </button>
                ))}
                {filtered.length === 0 && !query && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">No options available</p>
                )}
                {query && filtered.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">No matches for &quot;{query}&quot;</p>
                )}
              </div>
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setCreating(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </div>
            </>
          ) : (
            <div className="p-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">New item name</p>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Enter name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate() } }}
                  className="h-8"
                />
                <Button type="button" size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
                  {creating ? "..." : "Add"}
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 w-full text-xs"
                onClick={() => { setCreating(false); setNewName("") }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
