'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { SimplePropertyCard } from '@/components/common/cards'
import { brokerApi } from '@/api'
import type { Team, TeamMember } from '@/api/endpoints/broker'
import type { Property } from '@/types'
import { resolvePropertyImage } from '@/utils/imageResolver'
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
  FiUserPlus,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiArrowUp,
  FiArrowDown,
  FiFilter,
  FiLayers,
  FiSearch,
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
  teamName?: string | null
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
              <span>•</span>
              <span className="text-gray-500">
                {agent.teamName ? `Team: ${agent.teamName}` : 'Unassigned'}
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
      className={`transition-all duration-300 ease-out ${
        isOver
          ? 'ring-4 ring-blue-500 ring-offset-2 bg-blue-50 scale-[1.02] shadow-lg shadow-blue-200/50 animate-pulse'
          : ''
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
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteSearchQuery, setInviteSearchQuery] = useState('')
  const [inviteSearchResults, setInviteSearchResults] = useState<any[]>([])
  const [inviteSearching, setInviteSearching] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [invitingId, setInvitingId] = useState<number | null>(null)
  const inviteSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null)
  const [editTeamForm, setEditTeamForm] = useState({ name: '', description: '' })
  const [editTeamSaving, setEditTeamSaving] = useState(false)
  const [editTeamError, setEditTeamError] = useState<string | null>(null)
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const [brokerId, setBrokerId] = useState(0)
  useEffect(() => {
    const id = parseInt(localStorage.getItem('user_id') || localStorage.getItem('agent_id') || '0', 10)
    setBrokerId(id)
  }, [])

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
        
        // Transform agents to TeamMemberDisplay format (listings count updated after properties load)
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
        console.error('Error fetching team data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoadingListings(true)
        const res = await brokerApi.getProperties({ per_page: 2000 })
        const list = Array.isArray(res) ? res : (res as any)?.data ?? []
        setProperties(list)
      } catch (e) {
        console.error('Error fetching properties:', e)
      } finally {
        setLoadingListings(false)
      }
    }
    fetchProperties()
  }, [])

  // Debounced search for invite-agent modal
  useEffect(() => {
    if (!showInviteModal) return
    const q = inviteSearchQuery.trim()
    if (q.length < 2) {
      setInviteSearchResults([])
      return
    }
    if (inviteSearchTimeoutRef.current) clearTimeout(inviteSearchTimeoutRef.current)
    inviteSearchTimeoutRef.current = setTimeout(async () => {
      setInviteSearching(true)
      setInviteError(null)
      try {
        const data = await brokerApi.searchAgentsToInvite(q)
        setInviteSearchResults(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setInviteSearchResults([])
        setInviteError(err?.message || 'Search failed.')
      } finally {
        setInviteSearching(false)
      }
    }, 300)
    return () => {
      if (inviteSearchTimeoutRef.current) clearTimeout(inviteSearchTimeoutRef.current)
    }
  }, [showInviteModal, inviteSearchQuery])

  const handleInviteAgent = async (agentId: number) => {
    setInviteError(null)
    setInvitingId(agentId)
    try {
      await brokerApi.inviteAgent(agentId)
      const agentsData = await brokerApi.getAgents()
      setAgents(agentsData)
      setInviteSearchResults(prev => prev.filter(a => a.id !== agentId))
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to invite agent.'
      setInviteError(msg)
    } finally {
      setInvitingId(null)
    }
  }

  const listingCountByAgentId = useMemo(() => {
    const map: Record<number, number> = {}
    properties.forEach((p: Property) => {
      const id = p.agent_id ?? 0
      map[id] = (map[id] || 0) + 1
    })
    return map
  }, [properties])

  const brokerListingCount = brokerId ? (listingCountByAgentId[brokerId] ?? 0) : 0
  const agentListingCount = Object.entries(listingCountByAgentId).reduce(
    (sum, [id, count]) => (id !== String(brokerId) ? sum + count : sum),
    0
  )

  // Map each agent ID to the team they belong to (if any)
  const agentTeamMap = useMemo(() => {
    const map: Record<number, { teamId: number; teamName: string }> = {}
    teams.forEach(team => {
      ;(team.members || []).forEach((member: TeamMember) => {
        map[member.agent_id] = { teamId: team.id, teamName: team.name }
      })
    })
    return map
  }, [teams])

  // Available agents list (all agents) with listing counts and team info
  const availableAgents = useMemo(() => {
    return agents
      .map((agent: any): AvailableAgent => ({
        id: agent.id,
        name: `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Unknown',
        role: 'Agent',
        status: agent.status === 'approved' ? 'Active' : 'Pending',
        joinDate: agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'N/A',
        joinDateRaw: agent.created_at || new Date().toISOString(),
        email: agent.email,
        listings: listingCountByAgentId[agent.id] ?? 0,
        teamName: agentTeamMap[agent.id]?.teamName ?? null,
      }))
  }, [agents, agentTeamMap, listingCountByAgentId])

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
        team_color: newTeam.teamColor,
        team_icon: newTeam.teamIcon,
        focus_area: newTeam.focusArea,
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

  const handleOpenEditTeam = (team: Team) => {
    setEditingTeamId(team.id)
    setEditTeamForm({ name: team.name, description: (team.description ?? '') || '' })
    setEditTeamError(null)
  }

  const handleSaveEditTeam = async () => {
    if (editingTeamId == null) return
    setEditTeamSaving(true)
    setEditTeamError(null)
    try {
      const result = await brokerApi.updateTeam(editingTeamId, {
        name: editTeamForm.name,
        description: editTeamForm.description || undefined,
      })
      setTeams(prev => prev.map(t => t.id === editingTeamId ? (result.data ?? t) : t))
      setEditingTeamId(null)
    } catch (err: any) {
      setEditTeamError(err?.response?.data?.message || err?.message || 'Failed to update team.')
    } finally {
      setEditTeamSaving(false)
    }
  }

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? Members will be removed from the team but remain in your agent pool.`)) return
    setDeletingTeamId(teamId)
    try {
      await brokerApi.deleteTeam(teamId)
      setTeams(prev => prev.filter(t => t.id !== teamId))
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete team.')
    } finally {
      setDeletingTeamId(null)
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
    <> 
        {/* Listings summary + property cards - white container above team grid */}
        <div className="bg-white rounded-[14px] p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiLayers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 m-0">Listings Overview</h3>
              <p className="text-xs text-gray-500 m-0 mt-0.5">All listings created by you and your agents</p>
            </div>
          </div>
          {loadingListings ? (
            <div className="flex items-center gap-4 py-4 text-gray-500">
              <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Loading listings...
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  <strong className="text-gray-900">{properties.length}</strong> total listings
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-700">
                  <strong className="text-blue-600">{brokerListingCount}</strong> your listings
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-700">
                  <strong className="text-emerald-600">{agentListingCount}</strong> by agents
                </span>
              </div>
              <div className="overflow-x-auto pb-2">
                <p className="text-sm font-medium text-gray-700 mb-3">Recent listings</p>
                {properties.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No listings yet.</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 min-h-[200px]" style={{ scrollbarWidth: 'thin' }}>
                    {properties
                      .slice()
                      .sort((a, b) => {
                        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
                        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
                        return tb - ta
                      })
                      .slice(0, 8)
                      .map((p) => {
                        const imageUrl = p.image_url || resolvePropertyImage(p.image_path || p.image, p.id)
                        const priceStr = p.price != null
                          ? `₱${Number(p.price).toLocaleString('en-US')}/${(p.price_type || 'mo').toLowerCase()}`
                          : '₱0/mo'
                        const location = [p.street_address, p.city, p.state_province].filter(Boolean).join(', ') || p.location || ''
                        return (
                          <div key={p.id} className="flex-shrink-0 w-[260px]">
                            <SimplePropertyCard
                              id={p.id}
                              title={p.title || 'Untitled'}
                              location={location}
                              price={priceStr}
                              image={imageUrl || undefined}
                              bedrooms={p.bedrooms}
                              bathrooms={p.bathrooms}
                              area={p.area ?? undefined}
                            />
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

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
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(true)
                    setInviteSearchQuery('')
                    setInviteSearchResults([])
                    setInviteError(null)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg border-0 cursor-pointer transition-colors hover:bg-blue-700"
                >
                  <FiUserPlus className="w-4 h-4" />
                  Invite agent
                </button>
              </div>

              {/* Invite Agent Modal */}
              {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowInviteModal(false)}>
                  <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 m-0">Invite agent</h4>
                      <button type="button" onClick={() => setShowInviteModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-sm text-gray-600 mb-3">Search for an already registered agent by name or email to add them to Available Agents.</p>
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={inviteSearchQuery}
                          onChange={e => setInviteSearchQuery(e.target.value)}
                          placeholder="Search by name or email..."
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                          autoFocus
                        />
                      </div>
                      {inviteError && (
                        <p className="mt-2 text-sm text-red-600">{inviteError}</p>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      {inviteSearching ? (
                        <div className="py-6 text-center text-gray-500 text-sm">Searching...</div>
                      ) : inviteSearchQuery.trim().length < 2 ? (
                        <div className="py-6 text-center text-gray-500 text-sm">Type at least 2 characters to search.</div>
                      ) : inviteSearchResults.length === 0 ? (
                        <div className="py-6 text-center text-gray-500 text-sm">No agents found. Try a different search.</div>
                      ) : (
                        <ul className="space-y-2">
                          {inviteSearchResults.map((person: any) => {
                            const name = [person.first_name, person.last_name].filter(Boolean).join(' ') || 'Unknown'
                            const email = person.email || ''
                            const isAlready = agents.some((a: any) => a.id === person.id)
                            return (
                              <li key={person.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{name}</div>
                                  {email && <div className="text-xs text-gray-500 truncate">{email}</div>}
                                </div>
                                <button
                                  type="button"
                                  disabled={isAlready || invitingId === person.id}
                                  onClick={() => handleInviteAgent(person.id)}
                                  className="shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg border-0 cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isAlready ? 'Added' : invitingId === person.id ? 'Adding...' : 'Add'}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Team Modal */}
              {editingTeamId != null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditingTeamId(null)}>
                  <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 m-0">Edit team</h4>
                      <button type="button" onClick={() => setEditingTeamId(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Team name</label>
                        <input
                          type="text"
                          value={editTeamForm.name}
                          onChange={e => setEditTeamForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Enter team name"
                          className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                        <textarea
                          value={editTeamForm.description}
                          onChange={e => setEditTeamForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Team description"
                          className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          rows={3}
                        />
                      </div>
                      {editTeamError && <p className="text-sm text-red-600">{editTeamError}</p>}
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
                      <button type="button" onClick={() => setEditingTeamId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Cancel
                      </button>
                      <button type="button" onClick={handleSaveEditTeam} disabled={editTeamSaving || !editTeamForm.name.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {editTeamSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                  <div className="py-8 text-center text-gray-500">No agents found.</div>
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
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center text-2xl text-white ${getTeamColorClasses((team as any).team_color || '#2563EB')}`}>
                          {getTeamIcon((team as any).team_icon || 'home')}
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-bold text-gray-900 truncate">{team.name}</div>
                          <div className="text-sm text-gray-600">
                            {team.description || 'No description'}
                            {(team as any).focus_area && (
                              <span className="block text-xs text-gray-500 mt-0.5">
                                Focus: {(team as any).focus_area}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTeam(team)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit team"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          disabled={deletingTeamId === team.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete team"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Active</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      {teamLead && teamLead.agent && (
                        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg text-white">
                            {teamLead.agent.first_name?.[0] || 'L'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-900">
                              {teamLead.agent.first_name} {teamLead.agent.last_name}
                            </div>
                            <div className="text-xs text-gray-600">Unit Manager</div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Remove ${teamLead.agent?.first_name} ${teamLead.agent?.last_name} from this team?`)) {
                                try {
                                  await brokerApi.removeAgentFromTeam(team.id, teamLead.agent_id)
                                  const [teamsData, agentsData] = await Promise.all([
                                    brokerApi.getTeams(),
                                    brokerApi.getAgents(),
                                  ])
                                  setTeams(teamsData)
                                  setAgents(agentsData)
                                  const members: TeamMemberDisplay[] = agentsData.map((agent: any) => {
                                    const teamMembership = teamsData
                                      .flatMap((t: Team) => t.members || [])
                                      .find((m: TeamMember) => m.agent_id === agent.id)
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
                                } catch (err: any) {
                                  alert(err?.response?.data?.message || 'Failed to remove agent from team')
                                }
                              }
                            }}
                            className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove from team"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      {regularMembers.length > 0 && (
                        <div className="space-y-2">
                          {regularMembers.map((member: TeamMember) => (
                            <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                                {member.agent?.first_name?.[0] || 'A'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {member.agent?.first_name} {member.agent?.last_name}
                                </div>
                                <div className="text-xs text-gray-600">Sales Agent</div>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Remove ${member.agent?.first_name} ${member.agent?.last_name} from this team?`)) {
                                    try {
                                      await brokerApi.removeAgentFromTeam(team.id, member.agent_id)
                                      const [teamsData, agentsData] = await Promise.all([
                                        brokerApi.getTeams(),
                                        brokerApi.getAgents(),
                                      ])
                                      setTeams(teamsData)
                                      setAgents(agentsData)
                                      const members: TeamMemberDisplay[] = agentsData.map((agent: any) => {
                                        const teamMembership = teamsData
                                          .flatMap((t: Team) => t.members || [])
                                          .find((m: TeamMember) => m.agent_id === agent.id)
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
                                    } catch (err: any) {
                                      alert(err?.response?.data?.message || 'Failed to remove agent from team')
                                    }
                                  }
                                }}
                                className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                                title="Remove from team"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
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
                        <div className="text-xl font-bold text-gray-900">
                          {teamMembersList.reduce((sum: number, m: TeamMember) => sum + (listingCountByAgentId[m.agent_id] ?? 0), 0)}
                        </div>
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
    </>
  )
}
