'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import BrokerHeader from '../../../components/broker/BrokerHeader'
import { brokerApi } from '../../../api'
import type { Team, TeamMember } from '../../../api/endpoints/broker'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiMoreVertical,
  FiHome,
  FiKey,
  FiGrid,
  FiStar,
  FiUser,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiArrowUp,
  FiArrowDown,
  FiFilter,
} from 'react-icons/fi'

interface TeamMemberDisplay {
  id: number
  name: string
  role: 'Unit Manager' | 'Agent'
  reportsTo: string | null
  listings: number
  inquiryChannels: string[]
  status: 'Active' | 'Inactive' | 'Pending'
  joinDate: string
  joinDateRaw?: string // For sorting
}

interface AvailableAgent {
  id: number
  name: string
  role: 'Unit Manager' | 'Agent'
  status: 'Active' | 'Inactive' | 'Pending'
  joinDate: string
  joinDateRaw?: string
  email?: string
  listings: number
}

type SortField = 'name' | 'joinDate' | 'role' | 'status'
type SortDirection = 'asc' | 'desc'

function ActionMenu({ memberId, onClose }: { memberId: number; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50" ref={menuRef}>
      <button className="w-full flex items-center gap-2.5 py-2.5 px-4 text-sm text-gray-700 bg-transparent border-0 cursor-pointer transition-colors duration-200 hover:bg-gray-100" onClick={onClose}>
        <FiEdit className="text-base text-blue-600" />
        <span>Edit Profile</span>
      </button>
      <button className="w-full flex items-center gap-2.5 py-2.5 px-4 text-sm text-gray-700 bg-transparent border-0 cursor-pointer transition-colors duration-200 hover:bg-gray-100" onClick={onClose}>
        <FiRefreshCw className="text-base text-amber-600" />
        <span>Reassign</span>
      </button>
      <button className="w-full flex items-center gap-2.5 py-2.5 px-4 text-sm text-red-600 bg-transparent border-0 cursor-pointer transition-colors duration-200 hover:bg-red-50" onClick={onClose}>
        <FiAlertCircle className="text-base text-red-600" />
        <span>Deactivate</span>
      </button>
    </div>
  )
}

function DraggableAgent({ agent }: { agent: AvailableAgent }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `agent-${agent.id}`,
    data: { agent },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : { opacity: isDragging ? 0.5 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-lg border border-gray-200 p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${
        isDragging ? 'shadow-lg border-blue-400' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{agent.name}</div>
            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
              <span>{agent.role}</span>
              <span>•</span>
              <span className={`${
                agent.status.toLowerCase() === 'active' ? 'text-emerald-600' :
                agent.status.toLowerCase() === 'inactive' ? 'text-gray-500' :
                'text-amber-600'
              }`}>
                {agent.status}
              </span>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 ml-4">
          {agent.joinDate}
        </div>
      </div>
    </div>
  )
}

function DroppableTeam({ team, children }: { team: Team; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `team-${team.id}`,
    data: { team },
  })

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' : ''
      }`}
    >
      {children}
    </div>
  )
}

export default function TeamManagementPage() {
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMemberDisplay[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    company_id: null as number | null,
    teamLeadId: null as number | null,
    selectedMembers: [] as number[],
    focusArea: '',
    teamColor: '#2563EB',
    teamIcon: 'home' as 'home' | 'key' | 'grid' | 'star',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [teamsData, agentsData] = await Promise.all([
          brokerApi.getTeams(),
          brokerApi.getAgents(),
        ])
        
        setTeams(teamsData)
        setAgents(agentsData)
        
        // Transform agents to TeamMemberDisplay format
        const members: TeamMemberDisplay[] = agentsData.map((agent: any) => {
          // Find which team this agent belongs to
          const teamMembership = teamsData
            .flatMap(team => team.members || [])
            .find((member: TeamMember) => member.agent_id === agent.id)
          
          return {
            id: agent.id,
            name: `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Unknown',
            role: teamMembership?.role === 'Unit Manager' ? 'Unit Manager' : 'Agent',
            reportsTo: null, // Would need to determine from team structure
            listings: 0, // Would need to fetch from properties
            inquiryChannels: ['WhatsApp', 'Email'], // Default
            status: agent.status === 'approved' ? 'Active' : 'Pending',
            joinDate: teamMembership?.joined_at ? new Date(teamMembership.joined_at).toLocaleDateString() : 'N/A',
            joinDateRaw: teamMembership?.joined_at || agent.created_at || new Date().toISOString(),
          }
        })
        
        setTeamMembers(members)
      } catch (error: any) {
        console.error('Error fetching team data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get assigned agent IDs
  const assignedAgentIds = useMemo(() => {
    return new Set(
      teams.flatMap(team => (team.members || []).map((member: TeamMember) => member.agent_id))
    )
  }, [teams])

  // Filter available agents (not assigned to any team)
  const availableAgents = useMemo(() => {
    return agents
      .filter((agent: any) => !assignedAgentIds.has(agent.id))
      .map((agent: any): AvailableAgent => ({
        id: agent.id,
        name: `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Unknown',
        role: 'Agent',
        status: agent.status === 'approved' ? 'Active' : 'Pending',
        joinDate: agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'N/A',
        joinDateRaw: agent.created_at || new Date().toISOString(),
        email: agent.email,
        listings: 0,
      }))
  }, [agents, assignedAgentIds])

  // Sort available agents
  const sortedAvailableAgents = useMemo(() => {
    const sorted = [...availableAgents]
    sorted.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'joinDate':
          const dateA = new Date(a.joinDateRaw || '').getTime()
          const dateB = new Date(b.joinDateRaw || '').getTime()
          comparison = dateA - dateB
          break
        case 'role':
          comparison = a.role.localeCompare(b.role)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [availableAgents, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dragging an agent to a team
    if (activeId.startsWith('agent-') && overId.startsWith('team-')) {
      const agentId = parseInt(activeId.replace('agent-', ''))
      const teamId = parseInt(overId.replace('team-', ''))
      
      try {
        await brokerApi.assignAgentToTeam(teamId, agentId, 'member')
        
        // Refresh data
        const [teamsData, agentsData] = await Promise.all([
          brokerApi.getTeams(),
          brokerApi.getAgents(),
        ])
        
        setTeams(teamsData)
        setAgents(agentsData)
        
        // Update team members display
        const members: TeamMemberDisplay[] = agentsData.map((agent: any) => {
          const teamMembership = teamsData
            .flatMap(team => team.members || [])
            .find((member: TeamMember) => member.agent_id === agent.id)
          
          return {
            id: agent.id,
            name: `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Unknown',
            role: teamMembership?.role === 'Unit Manager' ? 'Unit Manager' : 'Agent',
            reportsTo: null,
            listings: 0,
            inquiryChannels: ['WhatsApp', 'Email'],
            status: agent.status === 'approved' ? 'Active' : 'Pending',
            joinDate: teamMembership?.joined_at ? new Date(teamMembership.joined_at).toLocaleDateString() : 'N/A',
            joinDateRaw: teamMembership?.joined_at || agent.created_at || new Date().toISOString(),
          }
        })
        
        setTeamMembers(members)
      } catch (error: any) {
        console.error('Error assigning agent to team:', error)
        alert('Failed to assign agent to team. Please try again.')
      }
    }
    
    setActiveId(null)
  }

  const allSelected = selectedMembers.length === teamMembers.length && teamMembers.length > 0

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(teamMembers.map((m) => m.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const formatChannels = (channels: string[]) => {
    return channels.map((ch) => `[${ch}]`).join(' ')
  }

  const handleCreateTeam = async () => {
    try {
      const teamData = {
        name: newTeam.name,
        description: newTeam.description,
        company_id: newTeam.company_id || undefined,
      }
      
      const result = await brokerApi.createTeam(teamData)
      
      // Assign team lead and members
      if (result.data.id) {
        if (newTeam.teamLeadId) {
          await brokerApi.assignAgentToTeam(result.data.id, newTeam.teamLeadId, 'Unit Manager')
        }
        
        for (const agentId of newTeam.selectedMembers) {
          if (agentId !== newTeam.teamLeadId) {
            await brokerApi.assignAgentToTeam(result.data.id, agentId, 'member')
          }
        }
      }
      
      alert('Team created successfully!')
      setShowCreateTeamForm(false)
      setNewTeam({
        name: '',
        description: '',
        company_id: null,
        teamLeadId: null,
        selectedMembers: [],
        focusArea: '',
        teamColor: '#2563EB',
        teamIcon: 'home',
      })
      
      // Refresh data
      const [teamsData, agentsData] = await Promise.all([
        brokerApi.getTeams(),
        brokerApi.getAgents(),
      ])
      
      setTeams(teamsData)
      setAgents(agentsData)
      
      // Update team members display
      const members: TeamMemberDisplay[] = agentsData.map((agent: any) => {
        const teamMembership = teamsData
          .flatMap(team => team.members || [])
          .find((member: TeamMember) => member.agent_id === agent.id)
        
        return {
          id: agent.id,
          name: `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Unknown',
          role: teamMembership?.role === 'Unit Manager' ? 'Unit Manager' : 'Agent',
          reportsTo: null,
          listings: 0,
          inquiryChannels: ['WhatsApp', 'Email'],
          status: agent.status === 'approved' ? 'Active' : 'Pending',
          joinDate: teamMembership?.joined_at ? new Date(teamMembership.joined_at).toLocaleDateString() : 'N/A',
          joinDateRaw: teamMembership?.joined_at || agent.created_at || new Date().toISOString(),
        }
      })
      
      setTeamMembers(members)
    } catch (error: any) {
      console.error('Error creating team:', error)
      alert('Failed to create team. Please try again.')
    }
  }

  const getTeamColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      '#2563EB': 'bg-blue-600',
      '#10B981': 'bg-emerald-600',
      '#F97316': 'bg-orange-600',
      '#6EE7B7': 'bg-emerald-300',
    }
    return colorMap[color] || 'bg-blue-600'
  }

  const getTeamIcon = (icon: string) => {
    const iconMap: Record<string, JSX.Element> = {
      home: <FiHome />,
      key: <FiKey />,
      grid: <FiGrid />,
      star: <FiStar />,
    }
    return iconMap[icon] || <FiHome />
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15">
        <BrokerHeader 
          title="Team Management" 
          subtitle="Manage your team members and their account permissions here." 
        />

        {/* Main Content Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-[1fr_400px] gap-6 lg:grid-cols-2">
            {/* Available Agents - Left Column */}
            <div className="bg-white rounded-[14px] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <FiUser className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 m-0">Available Agents</h3>
                    <p className="text-xs text-gray-500 m-0 mt-0.5">{sortedAvailableAgents.length} available agents</p>
                  </div>
                </div>
              </div>

              {/* Sorting Controls */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['name', 'joinDate', 'role', 'status'] as SortField[]).map((field) => (
                    <button
                      key={field}
                      onClick={() => handleSort(field)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                        sortField === field
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="capitalize">{field === 'joinDate' ? 'Join Date' : field}</span>
                      {sortField === field && (
                        sortDirection === 'asc' ? (
                          <FiArrowUp className="w-3 h-3" />
                        ) : (
                          <FiArrowDown className="w-3 h-3" />
                        )
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Agents List */}
              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="py-8 text-center text-gray-500">Loading available agents...</div>
                ) : sortedAvailableAgents.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <p className="mb-2">All agents are assigned to teams.</p>
                    <p className="text-sm text-gray-400">Create a new team or remove agents from existing teams to see them here.</p>
                  </div>
                ) : (
                  sortedAvailableAgents.map((agent) => (
                    <DraggableAgent key={agent.id} agent={agent} />
                  ))
                )}
              </div>
            </div>

          {/* My Teams - Right Column */}
          <div className="flex flex-col gap-4 h-fit">
            {/* Create Team Form */}
            <div className="bg-white rounded-[14px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-gray-900 m-0">My Teams</h4>
                {showCreateTeamForm && (
                  <button
                    onClick={() => setShowCreateTeamForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            
            {showCreateTeamForm ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Team Name</label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Enter team name"
                    className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Team description"
                    className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    rows={3}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Team Lead</label>
                  <select
                    value={newTeam.teamLeadId || ''}
                    onChange={(e) => setNewTeam({ ...newTeam, teamLeadId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select team lead</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.first_name} {agent.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Team Members</label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {agents.map((agent) => {
                      const agentName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim()
                      const isSelected = newTeam.selectedMembers.includes(agent.id) || newTeam.teamLeadId === agent.id
                      return (
                        <label key={agent.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={newTeam.teamLeadId === agent.id}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTeam({ ...newTeam, selectedMembers: [...newTeam.selectedMembers, agent.id] })
                              } else {
                                setNewTeam({ ...newTeam, selectedMembers: newTeam.selectedMembers.filter(id => id !== agent.id) })
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500"
                          />
                          <span className={newTeam.teamLeadId === agent.id ? 'font-semibold text-blue-600' : ''}>
                            {agentName} {newTeam.teamLeadId === agent.id && '(Lead)'}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Focus Area</label>
                  <input
                    type="text"
                    value={newTeam.focusArea}
                    onChange={(e) => setNewTeam({ ...newTeam, focusArea: e.target.value })}
                    placeholder="e.g., Luxury Condos"
                    className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Team Color</label>
                  <div className="flex gap-2">
                    {['#2563EB', '#10B981', '#F97316', '#6EE7B7'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewTeam({ ...newTeam, teamColor: color })}
                        className={`w-7 h-7 rounded-lg border-2 transition-all ${
                          newTeam.teamColor === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Team Icon</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'home', icon: <FiHome /> },
                      { value: 'key', icon: <FiKey /> },
                      { value: 'grid', icon: <FiGrid /> },
                      { value: 'star', icon: <FiStar /> },
                    ].map(({ value, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setNewTeam({ ...newTeam, teamIcon: value as any })}
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                          newTeam.teamIcon === value
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeam.name}
                  className="w-full py-3 px-6 bg-blue-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiCheck />
                  Create Team
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateTeamForm(true)}
                className="w-full py-3 px-6 bg-blue-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FiPlus />
                Create New Team
              </button>
            )}
            </div>

            {/* Team List */}
            {loading ? (
              <div className="py-8 text-center text-gray-500 bg-white rounded-[14px] p-6 shadow-sm">Loading teams...</div>
            ) : teams.length === 0 ? (
              <div className="py-8 text-center text-gray-500 bg-white rounded-[14px] p-6 shadow-sm">
                No teams yet. Create your first team to get started.
              </div>
            ) : (
              teams.map((team) => {
                const teamMembersList = team.members || []
                const teamLead = teamMembersList.find((m: TeamMember) => m.role === 'Unit Manager' || m.role === 'manager')
                const regularMembers = teamMembersList.filter((m: TeamMember) => m.role !== 'Unit Manager' && m.role !== 'manager')
                
                return (
                  <DroppableTeam key={team.id} team={team}>
                    <div className="bg-white rounded-[14px] p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl text-blue-600">
                          {getTeamIcon('home')}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">{team.name}</div>
                          <div className="text-sm text-gray-600">{team.description || 'No description'}</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Active</span>
                    </div>
                    
                    <div className="mb-4">
                      {teamLead && teamLead.agent && (
                        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg text-white">
                            {teamLead.agent.first_name?.[0] || 'L'}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-gray-900">
                              {teamLead.agent.first_name} {teamLead.agent.last_name}
                            </div>
                            <div className="text-xs text-gray-600">Unit Manager</div>
                          </div>
                        </div>
                      )}
                      
                      {regularMembers.length > 0 && (
                        <div className="space-y-2">
                          {regularMembers.slice(0, 2).map((member: TeamMember) => (
                            <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                                {member.agent?.first_name?.[0] || 'A'}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">
                                  {member.agent?.first_name} {member.agent?.last_name}
                                </div>
                                <div className="text-xs text-gray-600">Sales Agent</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{teamMembersList.length}</div>
                        <div className="text-xs text-gray-600">Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">0</div>
                        <div className="text-xs text-gray-600">Listings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">0%</div>
                        <div className="text-xs text-gray-600">Response</div>
                      </div>
                    </div>
                    </div>
                  </DroppableTeam>
                )
              })
            )}
          </div>
          </div>
          
          {/* Drag Overlay */}
          <DragOverlay>
            {activeId && activeId.startsWith('agent-') ? (
              (() => {
                const agentId = parseInt(activeId.replace('agent-', ''))
                const agent = sortedAvailableAgents.find(a => a.id === agentId)
                return agent ? (
                  <div className="bg-white rounded-lg border-2 border-blue-400 p-4 shadow-xl opacity-90">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{agent.name}</div>
                        <div className="text-xs text-gray-500">{agent.role}</div>
                      </div>
                    </div>
                  </div>
                ) : null
              })()
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  )
}
