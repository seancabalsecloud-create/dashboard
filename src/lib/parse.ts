import type { Project, WeightedItem } from '@/lib/models'

type ColumnRange = { start: string; end: string }

const TAG_COLUMNS: string[] = ['I','K','N','O','P','R','AE','AI']
const PROJECT_LEADS: ColumnRange = { start: 'AN', end: 'BB' }
const TRANSITION_TAGS: ColumnRange = { start: 'BD', end: 'BJ' }
const STATUS: ColumnRange = { start: 'BK', end: 'BO' }
const TRANSITION_PARTNERS: ColumnRange = { start: 'BP', end: 'CC' }
// Specific columns for lead metrics
const COL_TRANS_SUCCESS = 'BK' // Success
const COL_TRANS_NONEYET = 'BM' // NoneYet

function columnLabelToIndex(label: string): number {
  let idx = 0
  for (let i = 0; i < label.length; i++) {
    idx = idx * 26 + (label.charCodeAt(i) - 64)
  }
  return idx
}

function headerFromSheet(sheet: any, col: string): string {
  // row 1 expected to contain header names
  const cell = sheet[`${col}1`]
  return cell?.v?.toString?.() ?? col
}

function collectWeighted(sheet: any, row: number, columns: string[] | ColumnRange): WeightedItem[] {
  const items: WeightedItem[] = []
  const cols: string[] = Array.isArray(columns)
    ? columns
    : rangeColumns(columns.start, columns.end)

  let present = 0
  const values: number[] = []
  for (const col of cols) {
    const cell = sheet[`${col}${row}`]
    const raw = typeof cell?.v === 'string' ? parseFloat(cell.v) : Number(cell?.v)
    const value = isFinite(raw) ? raw : 0
    values.push(value)
    if (value > 0) present += 1
  }
  const weight = present > 0 ? 1 / present : 0
  for (let i = 0; i < cols.length; i++) {
    if (values[i] > 0) {
      items.push({ key: headerFromSheet(sheet, cols[i]), weight })
    }
  }
  return items
}

function rangeColumns(start: string, end: string): string[] {
  const res: string[] = []
  let s = columnLabelToIndex(start)
  const e = columnLabelToIndex(end)
  while (s <= e) {
    res.push(indexToColumnLabel(s))
    s += 1
  }
  return res
}

function indexToColumnLabel(index: number): string {
  let label = ''
  while (index > 0) {
    const rem = (index - 1) % 26
    label = String.fromCharCode(65 + rem) + label
    index = Math.floor((index - 1) / 26)
  }
  return label
}

export function parseWorkbookToProjects(wb: any): Project[] {
  const sheetName: string = wb.SheetNames.find((name: string) => name === 'OE_ExSum_Tags_Transitions') ?? wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const range = sheet['!ref'] as string
  if (!range) return []
  const match = /([A-Z]+)(\d+):([A-Z]+)(\d+)/.exec(range)
  if (!match) return []
  const startRow = Number(match[2])
  const endRow = Number(match[4])

  const projects: Project[] = []
  for (let row = Math.max(2, startRow); row <= endRow; row++) {
    const includeRaw = sheet[`A${row}`]?.v
    const includeStr = includeRaw == null ? '' : String(includeRaw).trim().toLowerCase()
    const include =
      includeStr === '1' || includeStr === 'x' || includeStr === 'y' || includeStr === 'yes' || includeStr === 'true' || Number(includeRaw) === 1
    const startYear = Number(sheet[`B${row}`]?.v) || NaN
    const projectName = sheet[`C${row}`]?.v?.toString?.() ?? null
    // Extract project title from format: "13ZZ-01: Some project title (SPT) [2013-2018]"
    const projectTitle = projectName ? (() => {
      const match = projectName.match(/:\s*([^(]+)\s*\(/)
      return match ? match[1].trim() : projectName
    })() : null
    const fundingMillionsRaw = Number(sheet[`D${row}`]?.v)
    const fundingMillions = isFinite(fundingMillionsRaw) ? fundingMillionsRaw : null

    const tags = collectWeighted(sheet, row, TAG_COLUMNS)
    const projectLeads = rangeColumns(PROJECT_LEADS.start, PROJECT_LEADS.end)
      .filter(col => Number(sheet[`${col}${row}`]?.v) === 1)
      .map(col => headerFromSheet(sheet, col))

    const transitionTags = collectWeighted(sheet, row, TRANSITION_TAGS)
    const statusCol = rangeColumns(STATUS.start, STATUS.end).find(col => Number(sheet[`${col}${row}`]?.v) === 1)
    const status = statusCol ? headerFromSheet(sheet, statusCol) : null
    const transitionPartners = collectWeighted(sheet, row, TRANSITION_PARTNERS)
    const transitionSuccess = Number(sheet[`${COL_TRANS_SUCCESS}${row}`]?.v) || 0
    const transitionNoneYet = Number(sheet[`${COL_TRANS_NONEYET}${row}`]?.v) || 0

    // If include is false but there is a project name, treat as included (fallback)
    if (!include && !projectName) {
      continue
    }

    projects.push({
      include,
      startYear: isFinite(startYear) ? startYear : null,
      projectName,
      projectTitle,
      fundingMillions,
      tags,
      projectLeads,
      transitionTags,
      status,
      transitionPartners,
      transitionNoneYet,
      transitionSuccess,
    })
  }
  return projects
}


