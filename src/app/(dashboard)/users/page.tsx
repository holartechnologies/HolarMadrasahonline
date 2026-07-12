"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  Pencil,
  Trash2,
  Plus,
  Users,
  Shield,
  ShieldAlert,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-header"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useToast } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface UserItem {
  id: string
  username: string
  fullName: string
  email: string
  phone: string
  role: string
  isActive: boolean
}

const ROLES = ["Super Admin", "Principal/Mudir", "Teacher", "Accountant"] as const

const initialUsers: UserItem[] = [
  { id: "1", username: "admin", fullName: "Admin User", email: "admin@holartechmadrasahpro.com", phone: "+234-800-0001", role: "Super Admin", isActive: true },
  { id: "2", username: "mudir", fullName: "Dr. Hassan Ibrahim", email: "mudir@holartechmadrasahpro.com", phone: "+234-800-0002", role: "Principal/Mudir", isActive: true },
  { id: "3", username: "teacher1", fullName: "Ahmad Abdullah", email: "ahmad@holartechmadrasahpro.com", phone: "+234-800-0003", role: "Teacher", isActive: true },
  { id: "4", username: "teacher2", fullName: "Fatima Yusuf", email: "fatima@holartechmadrasahpro.com", phone: "+234-800-0004", role: "Teacher", isActive: true },
  { id: "5", username: "accountant", fullName: "Aliyu Bello", email: "aliyu@holartechmadrasahpro.com", phone: "+234-800-0005", role: "Accountant", isActive: true },
  { id: "6", username: "teacher3", fullName: "Khadija Mohammed", email: "khadija@holartechmadrasahpro.com", phone: "+234-800-0006", role: "Teacher", isActive: false },
]

const emptyForm: Omit<UserItem, "id"> & { password: string } = {
  username: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
  role: "Teacher",
  isActive: true,
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [form, setForm] = useState<Omit<UserItem, "id"> & { password: string }>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  function openAddDialog() {
    setEditingUser(null)
    setForm(emptyForm)
    setShowDialog(true)
  }

  function openEditDialog(user: UserItem) {
    setEditingUser(user)
    setForm({ ...user, password: "" })
    setShowDialog(true)
  }

  function handleSave() {
    if (!form.username.trim() || !form.fullName.trim() || !form.email.trim()) {
      toast({ title: "Validation Error", description: "Username, Full Name, and Email are required.", variant: "destructive" })
      return
    }

    setSaving(true)
    setTimeout(() => {
      if (editingUser) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { id: u.id, username: form.username, fullName: form.fullName, email: form.email, phone: form.phone, role: form.role, isActive: form.isActive }
              : u
          )
        )
        toast({ title: "Success", description: "User updated successfully" })
      } else {
        const newUser: UserItem = {
          id: String(Date.now()),
          username: form.username,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          isActive: form.isActive,
        }
        setUsers((prev) => [...prev, newUser])
        toast({ title: "Success", description: "User added successfully" })
      }
      setSaving(false)
      setShowDialog(false)
    }, 400)
  }

  function handleDelete() {
    if (!deleteId) return
    setUsers((prev) => prev.filter((u) => u.id !== deleteId))
    toast({ title: "Success", description: "User deleted successfully" })
    setDeleteId(null)
  }

  const columns: ColumnDef<UserItem>[] = [
    { accessorKey: "username", header: "Username" },
    { accessorKey: "fullName", header: "Full Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <div className="flex items-center gap-1.5">
            {role === "Super Admin" ? (
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-sm">{role}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users and their roles"
      >
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </PageHeader>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          User management uses local state for demonstration. Persistent storage requires admin API endpoints.
        </span>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No users found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Add your first user to get started with user management.
          </p>
          <Button onClick={openAddDialog}>Add User</Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchKey="search"
          searchPlaceholder="Search by username, name, or email..."
        />
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user details and permissions."
                : "Fill in the details to create a new user."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="johndoe"
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@school.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+234-800-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm((f) => ({ ...f, role: value }))}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  {form.isActive ? "User can log in and access the system" : "User account is disabled"}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingUser ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}
