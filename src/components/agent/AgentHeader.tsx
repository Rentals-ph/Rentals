'use client'

import { useEffect } from 'react'
import DashboardHeader from '../common/DashboardHeader'
import { agentsApi } from '../../api'

interface AgentHeaderProps {
  title?: string
  subtitle?: string
  /** Optional right-side content (e.g. Add Listing button, notifications) */
  rightAction?: React.ReactNode
  showNotifications?: boolean
}

function AgentHeader({ title = 'Dashboard', subtitle = 'Welcome back, manage your rental properties.', rightAction, showNotifications = false }: AgentHeaderProps) {
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const agentData = await agentsApi.getCurrent()
        if (agentData.first_name && agentData.last_name) {
          const fullName = `${agentData.first_name} ${agentData.last_name}`
          localStorage.setItem('agent_name', fullName)
          localStorage.setItem('user_name', fullName)
        }
        if (agentData.id) {
          localStorage.setItem('agent_id', agentData.id.toString())
        }
      } catch {
        try {
          const agentId = localStorage.getItem('agent_id')
          if (agentId) {
            const agentData = await agentsApi.getById(parseInt(agentId))
            if (agentData.first_name && agentData.last_name) {
              const fullName = `${agentData.first_name} ${agentData.last_name}`
              localStorage.setItem('agent_name', fullName)
              localStorage.setItem('user_name', fullName)
            }
          }
        } catch {
          // ignore
        }
      }
    }
    fetchAgentData()
  }, [])

  return (
    <DashboardHeader
      title={title}
      subtitle={subtitle}
      rightAction={rightAction}
      showNotifications={showNotifications}
    />
  )
}

export default AgentHeader
