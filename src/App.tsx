import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dashboard } from '@/components/Dashboard'
import { useProjectStore } from '@/lib/store'
import { parseWorkbookToProjects } from '@/lib/parse'
import { Layout } from '@/components/Layout'

function App() {
  const [fileName, setFileName] = useState<string>('')
  const [rowsCount, setRowsCount] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const setProjects = useProjectStore(s => s.setProjects)
  const [tab, setTab] = useState<'upload' | 'dashboard'>('upload')
  const [loading, setLoading] = useState<boolean>(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    try {
      setLoading(true)
      const xlsx = await import('xlsx')
      const arrayBuffer = await file.arrayBuffer()
      const wb = xlsx.read(arrayBuffer, { type: 'array' })
      const projects = parseWorkbookToProjects(wb)
      setProjects(projects)
      setRowsCount(projects.length)
      setTab('dashboard')
    } catch (err) {
      setError('Failed to parse file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'upload' | 'dashboard')}>
          <TabsList>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload XLSX</CardTitle>
                <CardDescription>Load the spreadsheet to begin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
                </div>
                {loading && <div className="text-sm">Processing...</div>}
                {fileName && <div className="text-sm">Selected: {fileName}</div>}
                {rowsCount > 0 && <div className="text-sm">Parsed rows: {rowsCount}</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
        </Tabs>
      </div>
      </Layout>
    </div>
  )
}

export default App
