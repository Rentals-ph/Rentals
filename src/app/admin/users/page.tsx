'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import DashboardHeader from '../../../components/common/DashboardHeader'
import api from '../../../lib/api'
import { 
  FiRefreshCw,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiSave
} from 'react-icons/fi'

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: 'renter' | 'agent' | 'admin' | 'super_admin'
  status: string
  is_active: boolean
  phone?: string
  created_at: string
  updated_at: string
}

export default function UserManagementPage() {
  const [filter, setFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'renter' as 'renter' | 'agent' | 'admin',
    phone: '',
    status: 'active',
    is_active: true,
  })

  useEffect(() => {
    fetchUsers()
  }, [filter, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      if (roleFilter !== 'all') {
        params.append('role', roleFilter)
      }
      
      const response = await api.get<User[]>(`/admin/users?${params.toString()}`)
      if (response.success && response.data) {
        setUsers(response.data)
      } else {
        setError(response.message || 'Failed to fetch users')
      }
    } catch (err) {
      setError('An error occurred while fetching users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await api.post('/admin/users', formData)
      if (response.success) {
        setShowCreateModal(false)
        resetForm()
        fetchUsers()
      } else {
        setError(response.message || 'Failed to create user')
      }
    } catch (err) {
      setError('An error occurred while creating user')
      console.error(err)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role as 'renter' | 'agent' | 'admin',
      phone: user.phone || '',
      status: user.status,
      is_active: user.is_active,
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    
    try {
      // Only include password if it's been changed
      const { password, ...updateDataWithoutPassword } = formData
      const updateData = password 
        ? { ...updateDataWithoutPassword, password }
        : updateDataWithoutPassword
      
      const response = await api.put(`/admin/users/${editingUser.id}`, updateData)
      if (response.success) {
        setShowEditModal(false)
        setEditingUser(null)
        resetForm()
        fetchUsers()
      } else {
        setError(response.message || 'Failed to update user')
      }
    } catch (err) {
      setError('An error occurred while updating user')
      console.error(err)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const response = await api.delete(`/admin/users/${userId}`)
      if (response.success) {
        fetchUsers()
      } else {
        setError(response.message || 'Failed to delete user')
      }
    } catch (err) {
      setError('An error occurred while deleting user')
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'renter',
      phone: '',
      status: 'active',
      is_active: true,
    })
  }

  const filteredUsers = users

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'suspended':
        return 'Suspended'
      case 'pending':
        return 'Pending'
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'renter':
        return 'Renter'
      case 'agent':
        return 'Agent'
      case 'admin':
        return 'Admin'
      case 'super_admin':
        return 'Super Admin'
      default:
        return role
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'renter':
        return <FiUser />
      case 'agent':
        return <FiUserCheck />
      case 'admin':
      case 'super_admin':
        return <FiUserX />
      default:
        return <FiUser />
    }
  }

  return (
    <div className="admin-dashboard">
      <AppSidebar />

      <main className="admin-main">
        <DashboardHeader
          title="User Management"
          subtitle="Manage all users in the system"
          showNotifications={true}
        />

        {error && (
          <div style={{
            padding: '1rem',
            margin: '1rem',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B'
          }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>
              <FiX />
            </button>
          </div>
        )}

        <div className="properties-section">
          <div className="agents-header">
            <h2 className="properties-title">User Management</h2>
            <div className="agents-controls">
              <div className="filter-options">
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="userFilter" 
                    value="all" 
                    checked={filter === 'all'}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <span>All</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="userFilter" 
                    value="active" 
                    checked={filter === 'active'}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <span>Active</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="userFilter" 
                    value="inactive" 
                    checked={filter === 'inactive'}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <span>Inactive</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="userFilter" 
                    value="pending" 
                    checked={filter === 'pending'}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <span>Pending</span>
                </label>
              </div>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: '0.5rem', marginRight: '0.5rem', borderRadius: '4px' }}
              >
                <option value="all">All Roles</option>
                <option value="renter">Renters</option>
                <option value="agent">Agents</option>
                <option value="admin">Admins</option>
              </select>
              <button className="refresh-button" onClick={fetchUsers} title="Refresh" disabled={loading}>
                <FiRefreshCw className={`refresh-icon ${loading ? 'spinning' : ''}`} />
              </button>
              <button 
                className="refresh-button" 
                onClick={() => setShowCreateModal(true)}
                style={{ marginLeft: '0.5rem', backgroundColor: '#2563EB', color: 'white' }}
                title="Create User"
              >
                <FiPlus /> Create User
              </button>
            </div>
          </div>

          {loading ? (
            <div className="properties-table-container">
              <table className="properties-table">
                <thead>
                  <tr>
                    <th><span className="block h-4 w-8 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-16 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-20 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-12 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-16 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-16 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-20 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-16 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}><span className="block h-4 rounded bg-gray-200 animate-pulse" style={{ width: j === 7 ? 80 : '70%' }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="properties-table-container">
              <table className="properties-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Phone</th>
                    <th>Date Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="property-id" data-label="ID">{user.id}</td>
                        <td className="property-name" data-label="Name">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="property-location" data-label="Email">{user.email}</td>
                        <td className="property-type" data-label="Role">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getRoleIcon(user.role)}
                            <span>{getRoleDisplay(user.role)}</span>
                          </div>
                        </td>
                        <td data-label="Status">
                          <span className={`property-status-indicator ${user.status}`}>
                            <span className="property-status-dot"></span>
                            <span className="property-status-text">
                              {getStatusDisplay(user.status)}
                            </span>
                          </span>
                        </td>
                        <td data-label="Phone">{user.phone || 'N/A'}</td>
                        <td className="property-date" data-label="Date Joined">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td data-label="Actions">
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleEdit(user)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB' }}
                              title="Edit"
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Create User</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FiX />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                >
                  <option value="renter">Renter</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => { setShowCreateModal(false); resetForm(); }} style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button onClick={handleCreate} style={{ padding: '0.5rem 1rem', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '4px' }}>
                  <FiSave style={{ marginRight: '0.5rem' }} />
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Edit User</h2>
              <button onClick={() => { setShowEditModal(false); setEditingUser(null); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FiX />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                >
                  <option value="renter">Renter</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => { setShowEditModal(false); setEditingUser(null); resetForm(); }} style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button onClick={handleUpdate} style={{ padding: '0.5rem 1rem', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '4px' }}>
                  <FiSave style={{ marginRight: '0.5rem' }} />
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
