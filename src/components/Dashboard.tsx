import { useMemo, useState } from 'react'
import { useProjectStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const { projects, setFilters, leadAggregates, yearlySummary, fundingMatrix, modifiedLeadAggregates, fundingChartData, projectsChartData, yearlyFundingChartData } = useProjectStore()
  const [yearStart, setYearStart] = useState<string>('')
  const [yearEnd, setYearEnd] = useState<string>('')
  const statuses = useMemo(() => Array.from(new Set(projects.map(p => p.status).filter(Boolean) as string[])), [projects])
  const tags = useMemo(() => Array.from(new Set(projects.flatMap(p => p.tags.map(t => t.key)))), [projects])

  const leads = leadAggregates()
  const modifiedLeads = modifiedLeadAggregates()
  const yearly = yearlySummary()
  const matrix = fundingMatrix()
  const chartData = fundingChartData()
  const projectsData = projectsChartData()
  const yearlyFundingData = yearlyFundingChartData()
  const allLeads = useMemo(() => {
    const leads = Array.from(new Set(projects.flatMap(p => p.projectLeads))).sort()
    return leads
  }, [projects])

  function parseYear(value: string): number | null {
    const cleaned = value.trim()
    if (cleaned === '') return null
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : null
  }

  function applyFilters() {
    setFilters({ years: [parseYear(yearStart), parseYear(yearEnd)] })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-5 gap-3">
          <Input placeholder="Start Year" value={yearStart} onChange={(e) => setYearStart(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters() }} />
          <Input placeholder="End Year" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters() }} />
          <Select onValueChange={(v) => setFilters({ statuses: v ? [v] : [] })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => setFilters({ tags: v ? [v] : [] })}>
            <SelectTrigger>
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              {tags.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={applyFilters} className="px-3">Apply</Button>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">Total projects loaded: {projects.length}</div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads Summary</TabsTrigger>
          <TabsTrigger value="modified">Modified Leads</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Summary</TabsTrigger>
          <TabsTrigger value="funding">Funding Matrix</TabsTrigger>
          <TabsTrigger value="chart">Funding Chart</TabsTrigger>
          <TabsTrigger value="projects">Projects Chart</TabsTrigger>
          <TabsTrigger value="yearly-funding">Yearly Funding Chart</TabsTrigger>
        </TabsList>
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Leads Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Lead</TableHead>
                    <TableHead>SUM of Trans- NoneYet (BM)</TableHead>
                    <TableHead>SUM of Trans- Success (BK)</TableHead>
                    <TableHead>SUM of Trans- Success Rate</TableHead>
                    <TableHead className="text-right">TOTAL Funding ($M)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No data for selected filters.</TableCell>
                    </TableRow>
                  )}
                  {leads.map((l) => (
                    <TableRow key={l.projectLead}>
                      <TableCell>{l.projectLead}</TableCell>
                      <TableCell>{l.sumNoneYet.toFixed(2)}</TableCell>
                      <TableCell>{l.sumSuccess.toFixed(2)}</TableCell>
                      <TableCell>{(l.successRate * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{l.totalFunding.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="modified">
          <Card>
            <CardHeader>
              <CardTitle>Modified Leads Summary (BK Only)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Lead</TableHead>
                    <TableHead>SUM of Trans- NoneYet</TableHead>
                    <TableHead>SUM of Trans- Success (BK)</TableHead>
                    <TableHead>SUM of Trans- Success Rate</TableHead>
                    <TableHead className="text-right">TOTAL Funding ($M)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modifiedLeads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No data for selected filters.</TableCell>
                    </TableRow>
                  )}
                  {modifiedLeads.map((l) => (
                    <TableRow key={l.projectLead}>
                      <TableCell>{l.projectLead}</TableCell>
                      <TableCell>{l.sumNoneYet.toFixed(2)}</TableCell>
                      <TableCell>{l.sumSuccess.toFixed(2)}</TableCell>
                      <TableCell>{l.successRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{l.totalFunding.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="yearly">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Unique of Concate Name</TableHead>
                    <TableHead>Sum of Command and Energy Management</TableHead>
                    <TableHead>Sum of Controls & Power Mgmt</TableHead>
                    <TableHead>Sum of Distribution</TableHead>
                    <TableHead>Sum of Energy Conversion</TableHead>
                    <TableHead>Sum of Energy Source</TableHead>
                    <TableHead>Sum of Energy Storage</TableHead>
                    <TableHead>Sum of Power Generation</TableHead>
                    <TableHead>Sum of Power Tools & Analytics</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearly.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">No data for selected filters.</TableCell>
                    </TableRow>
                  )}
                  {yearly.map((y) => (
                    <TableRow key={y.year}>
                      <TableCell>{y.year}</TableCell>
                      <TableCell>{y.uniqueProjects}</TableCell>
                      <TableCell>{y.commandEnergyMgmt.toFixed(2)}</TableCell>
                      <TableCell>{y.controlsPowerMgmt.toFixed(2)}</TableCell>
                      <TableCell>{y.distribution.toFixed(2)}</TableCell>
                      <TableCell>{y.energyConversion.toFixed(2)}</TableCell>
                      <TableCell>{y.energySource.toFixed(2)}</TableCell>
                      <TableCell>{y.energyStorage.toFixed(2)}</TableCell>
                      <TableCell>{y.powerGeneration.toFixed(2)}</TableCell>
                      <TableCell>{y.powerToolsAnalytics.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {yearly.length > 0 && (
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>Grand Total</TableCell>
                      <TableCell>{yearly.reduce((sum, y) => sum + y.uniqueProjects, 0)}</TableCell>
                      <TableCell>{yearly.reduce((sum, y) => sum + y.commandEnergyMgmt, 0).toFixed(2)}</TableCell>
                      <TableCell>{yearly.reduce((sum, y) => sum + y.controlsPowerMgmt, 0).toFixed(2)}</TableCell>
                      <TableCell>{yearly.reduce((sum, y) => sum + y.distribution, 0).toFixed(2)}</TableCell>
                      <TableCell>{yearly.reduce((sum, y) => sum + y.energyConversion, 0).toFixed(2)}</TableCell>
                      <TableCell>{yearly.reduce((sum, y) => sum + y.energySource, 0).toFixed(2)}</TableCell>
                      <TableCell>{yearly.reduce((sum, y) => sum + y.energyStorage, 0).toFixed(2)}</TableCell>
                      <TableCell>{yearly.reduce((sum, y) => sum + y.powerGeneration, 0).toFixed(2)}</TableCell>
                      <TableCell>{yearly.reduce((sum, y) => sum + y.powerToolsAnalytics, 0).toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="funding">
          <Card>
            <CardHeader>
              <CardTitle>Funding Matrix by Project Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>FY</TableHead>
                      {allLeads.map(lead => (
                        <TableHead key={lead} className="text-right">{lead}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrix.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={allLeads.length + 1} className="text-center text-muted-foreground">No data for selected filters.</TableCell>
                      </TableRow>
                    )}
                    {matrix.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="font-medium">{row.year}</TableCell>
                        {allLeads.map(lead => (
                          <TableCell key={lead} className="text-right">
                            {typeof row[lead] === 'number' ? (row[lead] as number).toFixed(2) : '0.00'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {matrix.length > 0 && (
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>Grand Total</TableCell>
                        {allLeads.map(lead => {
                          const total = matrix.reduce((sum, row) => sum + (typeof row[lead] === 'number' ? row[lead] as number : 0), 0)
                          return (
                            <TableCell key={lead} className="text-right">{total.toFixed(2)}</TableCell>
                          )
                        })}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Funding by Project Lead</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 80, bottom: 80 }}>
                  <XAxis 
                    dataKey="projectLead" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Project Funding', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    tickFormatter={(value) => `$${value}M`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${Number(value).toFixed(2)}M`, 
                      name === 'totalFunding' ? 'Total Funding' : 'Successful Funding'
                    ]}
                    labelFormatter={(label) => `Project Lead: ${label}`}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                  <Bar 
                    dataKey="totalFunding" 
                    name="Total Funding" 
                    fill="#3b82f6" 
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="bkOnlyFunding" 
                    name="Successful Funding" 
                    fill="#10b981" 
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Number of Projects by Lead</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectsData} margin={{ top: 20, right: 30, left: 80, bottom: 80 }}>
                  <XAxis 
                    dataKey="projectLead" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Number of Projects', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} projects`, 
                      name === 'bmProjects' ? 'Sum of Trans-None Yet' : 'Sum of Trans-Success'
                    ]}
                    labelFormatter={(label) => `Project Lead: ${label}`}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                  <Bar 
                    dataKey="bmProjects" 
                    name="Sum of Trans-None Yet" 
                    fill="#f59e0b" 
                    stackId="projects"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="bkProjects" 
                    name="Sum of Trans-Success" 
                    fill="#ef4444" 
                    stackId="projects"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="yearly-funding">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Funding by Lead (Stacked)</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyFundingData} margin={{ top: 20, right: 30, left: 80, bottom: 80 }}>
                  <XAxis 
                    dataKey="year" 
                    type="number"
                    domain={[2011, 'dataMax']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `20${value}`}
                  />
                  <YAxis 
                    label={{ value: 'Funding ($M)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    tickFormatter={(value) => `$${value}M`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${Number(value).toFixed(2)}M`, 
                      name
                    ]}
                    labelFormatter={(label) => `Year: 20${label}`}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                  {allLeads.map((lead, index) => {
                    const colors = [
                      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
                    ]
                    return (
                      <Bar 
                        key={lead}
                        dataKey={lead} 
                        name={lead}
                        fill={colors[index % colors.length]}
                        stackId="funding"
                        radius={index === allLeads.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                        maxBarSize={40}
                      />
                    )
                  })}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


