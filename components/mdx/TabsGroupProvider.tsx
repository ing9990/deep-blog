'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type GroupMap = Record<string, string>

interface GroupState {
  groups: GroupMap
  setGroup: (groupId: string, value: string) => void
}

const TabsGroupContext = createContext<GroupState | null>(null)

export function TabsGroupProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<GroupMap>({})
  const setGroup = useCallback((groupId: string, value: string) => {
    setGroups((prev) => (prev[groupId] === value ? prev : { ...prev, [groupId]: value }))
  }, [])
  return (
    <TabsGroupContext.Provider value={{ groups, setGroup }}>
      {children}
    </TabsGroupContext.Provider>
  )
}

export function useTabsGroup(): GroupState | null {
  return useContext(TabsGroupContext)
}
