"use client";

import { useState, useEffect } from "react";
import { inviteAdminUser, listAdminUsers, removeAdminUser, updateAdminPermissions } from "@/actions/users.actions";
import { AdminPermission } from "@/types/database.types";
import { toast } from "sonner";
import { Users, UserPlus, Trash, Shield, Save, Edit2, X } from "lucide-react";

export function AdminUsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermissions, setInvitePermissions] = useState<AdminPermission[]>([]);
  const [inviting, setInviting] = useState(false);

  // Edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<AdminPermission[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const availablePermissions: { id: AdminPermission; label: string }[] = [
    { id: "manage_products", label: "Manage Products" },
    { id: "manage_content", label: "Manage Content" },
    { id: "manage_users", label: "Manage Users" },
    { id: "manage_settings", label: "Manage Settings" },
    { id: "manage_orders", label: "Manage Orders" },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    const res = await listAdminUsers();
    if (res.error) {
      toast.error(res.error);
    } else {
      setUsers(res.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return toast.error("Email is required");
    setInviting(true);
    const res = await inviteAdminUser(inviteEmail, invitePermissions);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInvitePermissions([]);
      fetchUsers();
    }
    setInviting(false);
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;
    const res = await removeAdminUser(userId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Admin user removed successfully");
      fetchUsers();
    }
  };

  const handleSaveEdit = async (userId: string) => {
    setSavingEdit(true);
    const res = await updateAdminPermissions(userId, editPermissions);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Permissions updated");
      setEditingUserId(null);
      fetchUsers();
    }
    setSavingEdit(false);
  };

  const toggleInvitePermission = (perm: AdminPermission) => {
    if (invitePermissions.includes(perm)) {
      setInvitePermissions(invitePermissions.filter(p => p !== perm));
    } else {
      setInvitePermissions([...invitePermissions, perm]);
    }
  };

  const toggleEditPermission = (perm: AdminPermission) => {
    if (editPermissions.includes(perm)) {
      setEditPermissions(editPermissions.filter(p => p !== perm));
    } else {
      setEditPermissions([...editPermissions, perm]);
    }
  };

  const startEditing = (user: any) => {
    setEditingUserId(user.user_id);
    setEditPermissions(user.permissions || []);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
        <Users className="w-5 h-5 text-indigo-500" />
        <h2 className="text-xl font-semibold text-slate-800">Admin User Management</h2>
      </div>

      {/* Invite Section */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <UserPlus className="w-4 h-4 mr-2" /> Invite New Admin
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email Address</label>
            <input 
              type="email" 
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="admin@hamperly.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {availablePermissions.map(perm => (
                <label key={perm.id} className="flex items-center space-x-2 bg-white px-3 py-1.5 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                  <input 
                    type="checkbox"
                    checked={invitePermissions.includes(perm.id)}
                    onChange={() => toggleInvitePermission(perm.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button 
            onClick={handleInvite}
            disabled={inviting || !inviteEmail}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {inviting ? "Inviting..." : "Send Invitation"}
          </button>
        </div>
      </div>

      {/* User List */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Current Admins</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading users...</p>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-full">
                  <div className="font-medium text-slate-900">{user.full_name || "Pending Name"}</div>
                  <div className="text-sm text-slate-500 mb-3">{user.email || "Unknown Email"}</div>
                  
                  {editingUserId === user.user_id ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {availablePermissions.map(perm => (
                          <label key={perm.id} className="flex items-center space-x-2 bg-white px-3 py-1.5 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                            <input 
                              type="checkbox"
                              checked={editPermissions.includes(perm.id)}
                              onChange={() => toggleEditPermission(perm.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleSaveEdit(user.user_id)}
                          disabled={savingEdit}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                        >
                          <Save className="w-4 h-4 mr-1.5" />
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingUserId(null)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 flex items-center"
                        >
                          <X className="w-4 h-4 mr-1.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.permissions?.map((p: string) => (
                        <span key={p} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          {p.replace('manage_', '')}
                        </span>
                      )) || <span className="text-xs text-slate-400">No specific permissions</span>}
                    </div>
                  )}
                </div>
                
                {editingUserId !== user.user_id && (
                  <div className="mt-4 sm:mt-0 flex space-x-2 shrink-0">
                    <button 
                      onClick={() => startEditing(user)}
                      className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors flex items-center text-sm"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleRemove(user.user_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center text-sm"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Revoke Access
                    </button>
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No admin users found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
