import { create } from 'zustand'
import type { Project, TagAggregate, YearlyCount } from '@/lib/models'
import { SUCCESS_STATUSES } from '@/lib/models'

type Filters = {
  years: [number | null, number | null]
  tags: string[]
  statuses: string[]
}

type ProjectState = {
  projects: Project[]
  setProjects: (projects: Project[]) => void
  filters: Filters
  setFilters: (filters: Partial<Filters>) => void
  tagAggregates: () => TagAggregate[]
  yearlyCounts: (by: 'status' | 'tag') => YearlyCount[]
  leadAggregates: () => { projectLead: string; sumNoneYet: number; sumSuccess: number; successRate: number; totalFunding: number }[]
  yearlySummary: () => { year: number; uniqueProjects: number; commandEnergyMgmt: number; controlsPowerMgmt: number; distribution: number; energyConversion: number; energySource: number; energyStorage: number; powerGeneration: number; powerToolsAnalytics: number }[]
  fundingMatrix: () => { year: number; [leadName: string]: number | string }[]
  modifiedLeadAggregates: () => { projectLead: string; sumNoneYet: number; sumSuccess: number; successRate: number; totalFunding: number }[]
  fundingChartData: () => { projectLead: string; totalFunding: number; bkOnlyFunding: number }[]
  projectsChartData: () => { projectLead: string; bmProjects: number; bkProjects: number }[]
  yearlyFundingChartData: () => { year: number; [leadName: string]: number | string }[]
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  filters: { years: [null, null], tags: [], statuses: [] },
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  tagAggregates: () => {
    const { projects, filters } = get()
    const filtered = projects.filter(p => {
      const inYear =
        filters.years[0] === null && filters.years[1] === null
          ? true
          : (p.startYear ?? -Infinity) >= (filters.years[0] ?? -Infinity) &&
            (p.startYear ?? Infinity) <= (filters.years[1] ?? Infinity)
      const tagOk = filters.tags.length === 0 || p.tags.some(t => filters.tags.includes(t.key))
      const statusOk = filters.statuses.length === 0 || (p.status ? filters.statuses.includes(p.status) : false)
      return inYear && tagOk && statusOk
    })
    const map = new Map<string, { total: number; success: number; funding: number }>()
    for (const p of filtered) {
      for (const t of p.tags) {
        const key = `${t.key}||${p.status ?? ''}`
        const prev = map.get(key) ?? { total: 0, success: 0, funding: 0 }
        prev.total += t.weight
        if (p.status && SUCCESS_STATUSES.has(p.status)) prev.success += t.weight
        if (typeof p.fundingMillions === 'number') prev.funding += p.fundingMillions * t.weight
        map.set(key, prev)
      }
    }
    const result: TagAggregate[] = []
    for (const [key, v] of map) {
      const [tag, status] = key.split('||')
      const successRate = v.total > 0 ? v.success / v.total : 0
      result.push({ tag, status: status || null, totalProjects: v.total, successCount: v.success, successRate, totalFunding: v.funding })
    }
    return result.sort((a, b) => b.totalFunding - a.totalFunding)
  },
  yearlyCounts: (by) => {
    const { projects, filters } = get()
    const map = new Map<string, number>()
    for (const p of projects) {
      if (p.startYear == null) continue
      const inYear =
        filters.years[0] === null && filters.years[1] === null
          ? true
          : p.startYear >= (filters.years[0] ?? -Infinity) && p.startYear <= (filters.years[1] ?? Infinity)
      if (!inYear) continue
      if (by === 'status') {
        const category = p.status ?? 'Unknown'
        map.set(`${p.startYear}||${category}`, (map.get(`${p.startYear}||${category}`) ?? 0) + 1)
      } else {
        for (const t of p.tags) {
          map.set(`${p.startYear}||${t.key}`, (map.get(`${p.startYear}||${t.key}`) ?? 0) + t.weight)
        }
      }
    }
    const res: YearlyCount[] = []
    for (const [key, count] of map) {
      const [year, cat] = key.split('||')
      res.push({ year: Number(year), category: cat, count })
    }
    return res.sort((a, b) => a.year - b.year)
  },
  leadAggregates: () => {
    const { projects, filters } = get()
    const map = new Map<string, { noneYet: number; success: number; funding: number }>()
    const inYear = (p: Project) =>
      filters.years[0] === null && filters.years[1] === null
        ? true
        : (p.startYear ?? -Infinity) >= (filters.years[0] ?? -Infinity) &&
          (p.startYear ?? Infinity) <= (filters.years[1] ?? Infinity)
    for (const p of projects) {
      if (!inYear(p)) continue
      const funding = typeof p.fundingMillions === 'number' ? p.fundingMillions : 0
      for (const lead of p.projectLeads) {
        const prev = map.get(lead) ?? { noneYet: 0, success: 0, funding: 0 }
        prev.noneYet += p.transitionNoneYet ?? 0
        prev.success += p.transitionSuccess ?? 0
        prev.funding += funding
        map.set(lead, prev)
      }
    }
    const rows = Array.from(map.entries()).map(([lead, v]) => {
      const denom = v.success + v.noneYet
      const successRate = denom > 0 ? v.success / denom : 0
      return { projectLead: lead, sumNoneYet: v.noneYet, sumSuccess: v.success, successRate, totalFunding: v.funding }
    })
    return rows.sort((a, b) => b.totalFunding - a.totalFunding)
  },
  yearlySummary: () => {
    const { projects, filters } = get()
    const map = new Map<number, { uniqueTitles: Set<string>; tagSums: Record<string, number> }>()
    const inYear = (p: Project) =>
      filters.years[0] === null && filters.years[1] === null
        ? true
        : (p.startYear ?? -Infinity) >= (filters.years[0] ?? -Infinity) &&
          (p.startYear ?? Infinity) <= (filters.years[1] ?? Infinity)
    for (const p of projects) {
      if (!inYear(p) || !p.startYear) continue
      const year = p.startYear
      const entry = map.get(year) ?? { uniqueTitles: new Set(), tagSums: {} }
      if (p.projectTitle) entry.uniqueTitles.add(p.projectTitle)
      for (const tag of p.tags) {
        entry.tagSums[tag.key] = (entry.tagSums[tag.key] ?? 0) + tag.weight
      }
      map.set(year, entry)
    }
    const rows = Array.from(map.entries()).map(([year, data]) => ({
      year,
      uniqueProjects: data.uniqueTitles.size,
      commandEnergyMgmt: data.tagSums['Command and Energy Management'] ?? 0,
      controlsPowerMgmt: data.tagSums['Controls & Power Mgmt'] ?? 0,
      distribution: data.tagSums['Distribution'] ?? 0,
      energyConversion: data.tagSums['Energy Conversion'] ?? 0,
      energySource: data.tagSums['Energy Source'] ?? 0,
      energyStorage: data.tagSums['Energy Storage'] ?? 0,
      powerGeneration: data.tagSums['Power Generation'] ?? 0,
      powerToolsAnalytics: data.tagSums['Power Tools & Analytics'] ?? 0,
    }))
    return rows.sort((a, b) => a.year - b.year)
  },
  fundingMatrix: () => {
    const { projects, filters } = get()
    const inYear = (p: Project) =>
      filters.years[0] === null && filters.years[1] === null
        ? true
        : (p.startYear ?? -Infinity) >= (filters.years[0] ?? -Infinity) &&
          (p.startYear ?? Infinity) <= (filters.years[1] ?? Infinity)
    
    // Get all unique project leads
    const allLeads = Array.from(new Set(projects.flatMap(p => p.projectLeads))).sort()
    
    // Group by year and lead
    const yearLeadMap = new Map<string, Map<string, number>>()
    for (const p of projects) {
      if (!inYear(p) || !p.startYear || typeof p.fundingMillions !== 'number') continue
      const year = p.startYear.toString()
      const yearMap = yearLeadMap.get(year) ?? new Map()
      for (const lead of p.projectLeads) {
        yearMap.set(lead, (yearMap.get(lead) ?? 0) + p.fundingMillions)
      }
      yearLeadMap.set(year, yearMap)
    }
    
    // Convert to matrix format
    const matrix = Array.from(yearLeadMap.entries()).map(([year, leadMap]) => {
      const row: { year: number; [leadName: string]: number | string } = { year: Number(year) }
      for (const lead of allLeads) {
        row[lead] = leadMap.get(lead) ?? 0
      }
      return row
    })
    
    return matrix.sort((a, b) => a.year - b.year)
  },
  modifiedLeadAggregates: () => {
    const { projects, filters } = get()
    const map = new Map<string, { success: number; funding: number }>()
    const inYear = (p: Project) =>
      filters.years[0] === null && filters.years[1] === null
        ? true
        : (p.startYear ?? -Infinity) >= (filters.years[0] ?? -Infinity) &&
          (p.startYear ?? Infinity) <= (filters.years[1] ?? Infinity)
    
    for (const p of projects) {
      if (!inYear(p)) continue
      // Only include projects that have BK (Success) values
      if (!p.transitionSuccess || p.transitionSuccess <= 0) continue
      
      const funding = typeof p.fundingMillions === 'number' ? p.fundingMillions : 0
      for (const lead of p.projectLeads) {
        const prev = map.get(lead) ?? { success: 0, funding: 0 }
        prev.success += p.transitionSuccess
        prev.funding += funding
        map.set(lead, prev)
      }
    }
    
    const rows = Array.from(map.entries()).map(([lead, v]) => ({
      projectLead: lead,
      sumNoneYet: 0, // Fixed to 0
      sumSuccess: v.success,
      successRate: 100, // Fixed to 100%
      totalFunding: v.funding,
    }))
    
    return rows.sort((a, b) => b.totalFunding - a.totalFunding)
  },
  fundingChartData: () => {
    const { projects, filters } = get()
    const map = new Map<string, { totalFunding: number; bkOnlyFunding: number }>()
    const inYear = (p: Project) =>
      filters.years[0] === null && filters.years[1] === null
        ? true
        : (p.startYear ?? -Infinity) >= (filters.years[0] ?? -Infinity) &&
          (p.startYear ?? Infinity) <= (filters.years[1] ?? Infinity)
    
    for (const p of projects) {
      if (!inYear(p) || typeof p.fundingMillions !== 'number') continue
      
      const funding = p.fundingMillions
      for (const lead of p.projectLeads) {
        const prev = map.get(lead) ?? { totalFunding: 0, bkOnlyFunding: 0 }
        prev.totalFunding += funding
        // Only add to BK-only funding if project has BK values
        if (p.transitionSuccess && p.transitionSuccess > 0) {
          prev.bkOnlyFunding += funding
        }
        map.set(lead, prev)
      }
    }
    
    const rows = Array.from(map.entries()).map(([lead, v]) => ({
      projectLead: lead,
      totalFunding: v.totalFunding,
      bkOnlyFunding: v.bkOnlyFunding,
    }))
    
    return rows.sort((a, b) => b.totalFunding - a.totalFunding)
  },
  projectsChartData: () => {
    const { projects, filters } = get()
    const map = new Map<string, { bmProjects: number; bkProjects: number }>()
    const inYear = (p: Project) =>
      filters.years[0] === null && filters.years[1] === null
        ? true
        : (p.startYear ?? -Infinity) >= (filters.years[0] ?? -Infinity) &&
          (p.startYear ?? Infinity) <= (filters.years[1] ?? Infinity)
    
    for (const p of projects) {
      if (!inYear(p)) continue
      
      for (const lead of p.projectLeads) {
        const prev = map.get(lead) ?? { bmProjects: 0, bkProjects: 0 }
        
        // Count projects with BM values
        if (p.transitionNoneYet && p.transitionNoneYet > 0) {
          prev.bmProjects += 1
        }
        
        // Count projects with BK values
        if (p.transitionSuccess && p.transitionSuccess > 0) {
          prev.bkProjects += 1
        }
        
        map.set(lead, prev)
      }
    }
    
    const rows = Array.from(map.entries()).map(([lead, v]) => ({
      projectLead: lead,
      bmProjects: v.bmProjects,
      bkProjects: v.bkProjects,
    }))
    
    return rows.sort((a, b) => (b.bmProjects + b.bkProjects) - (a.bmProjects + a.bkProjects))
  },
  yearlyFundingChartData: () => {
    const { projects, filters } = get()
    const inYear = (p: Project) =>
      filters.years[0] === null && filters.years[1] === null
        ? true
        : (p.startYear ?? -Infinity) >= (filters.years[0] ?? -Infinity) &&
          (p.startYear ?? Infinity) <= (filters.years[1] ?? Infinity)
    
    // Get all unique project leads
    const allLeads = Array.from(new Set(projects.flatMap(p => p.projectLeads))).sort()
    
    // Group by year and lead
    const yearLeadMap = new Map<number, Map<string, number>>()
    for (const p of projects) {
      if (!inYear(p) || !p.startYear || typeof p.fundingMillions !== 'number') continue
      const year = p.startYear
      const yearMap = yearLeadMap.get(year) ?? new Map()
      for (const lead of p.projectLeads) {
        yearMap.set(lead, (yearMap.get(lead) ?? 0) + p.fundingMillions)
      }
      yearLeadMap.set(year, yearMap)
    }
    
    // Convert to matrix format for stacked chart
    const matrix = Array.from(yearLeadMap.entries()).map(([year, leadMap]) => {
      const row: { year: number; [leadName: string]: number | string } = { year }
      for (const lead of allLeads) {
        row[lead] = leadMap.get(lead) ?? 0
      }
      return row
    })
    
    return matrix.sort((a, b) => a.year - b.year)
  },
}))


