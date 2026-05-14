import type { EventOrg } from '@/types';
import type { Church } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawImportRow {
  rowIndex:              number;
  fullName:              string;
  email:                 string;
  phone:                 string;
  birthday:              string;  // normalized to YYYY-MM-DD
  nickname?:             string;
  address?:              string;
  church?:               string;  // raw name from Excel
  division?:             string;  // raw name from Excel
  emergencyContactName?: string;
  emergencyContactPhone?:string;
  status:                'APPROVED' | 'PENDING';
  // resolved after church/division matching
  churchId?:             string;
  divisionOrgId?:        string;
}

export type RowOutcome = 'valid' | 'duplicate' | 'error';
export type DuplicateAction = 'skip' | 'overwrite' | null;

export interface PreviewRow extends RawImportRow {
  outcome:         RowOutcome;
  errors:          string[];       // field-level validation errors
  duplicateAction: DuplicateAction;// only relevant when outcome === 'duplicate'
}

// ─── Header Aliases ───────────────────────────────────────────────────────────

const HEADER_ALIASES: Record<string, keyof RawImportRow> = {
  'full name':              'fullName',
  'fullname':               'fullName',
  'name':                   'fullName',
  'email':                  'email',
  'email address':          'email',
  'phone':                  'phone',
  'phone number':           'phone',
  'contact':                'phone',
  'contact number':         'phone',
  'birthday':               'birthday',
  'date of birth':          'birthday',
  'dob':                    'birthday',
  'birthdate':              'birthday',
  'nickname':               'nickname',
  'nick name':              'nickname',
  'address':                'address',
  'church':                 'church',
  'division':               'division',
  'org':                    'division',
  'organization':           'division',
  'emergency contact name': 'emergencyContactName',
  'emergency name':         'emergencyContactName',
  'emergency contact':      'emergencyContactName',
  'emergency contact phone':'emergencyContactPhone',
  'emergency phone':        'emergencyContactPhone',
  'status':                 'status',
};

// ─── Date normalization ───────────────────────────────────────────────────────

function normalizeDate(raw: unknown): string {
  if (!raw) return '';
  const s = String(raw).trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // MM/DD/YYYY or M/D/YYYY
  const mdY = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdY) {
    const [, m, d, y] = mdY;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Excel serial date (number of days since 1900-01-00)
  if (!isNaN(Number(s))) {
    const serial = Number(s);
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  // Try JS Date parse as last resort
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return s;
}

// ─── Parse Excel file ─────────────────────────────────────────────────────────

export async function parseExcelFile(file: File): Promise<RawImportRow[]> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: true,
  });

  if (rawRows.length === 0) return [];

  // Normalize header keys
  const rows: RawImportRow[] = rawRows.map((raw, idx) => {
    const normalized: Partial<RawImportRow> = { rowIndex: idx + 2 }; // +2 for 1-index + header row

    for (const [key, val] of Object.entries(raw)) {
      const alias = HEADER_ALIASES[key.toLowerCase().trim()];
      if (!alias) continue;
      const strVal = String(val ?? '').trim();
      if (!strVal) continue;

      if (alias === 'birthday') {
        normalized.birthday = normalizeDate(val);
      } else if (alias === 'status') {
        normalized.status = strVal.toUpperCase() === 'PENDING' ? 'PENDING' : 'APPROVED';
      } else {
        (normalized as Record<string, string>)[alias] = strVal;
      }
    }

    return {
      rowIndex:             normalized.rowIndex ?? idx + 2,
      fullName:             normalized.fullName             ?? '',
      email:                normalized.email                ?? '',
      phone:                normalized.phone                ?? '',
      birthday:             normalized.birthday             ?? '',
      nickname:             normalized.nickname,
      address:              normalized.address,
      church:               normalized.church,
      division:             normalized.division,
      emergencyContactName: normalized.emergencyContactName,
      emergencyContactPhone:normalized.emergencyContactPhone,
      status:               normalized.status               ?? 'APPROVED',
    };
  });

  return rows;
}

// ─── Name matching ────────────────────────────────────────────────────────────

export function matchChurchByName(name: string | undefined, churches: Church[]): string | undefined {
  if (!name) return undefined;
  const q = name.trim().toLowerCase();
  return churches.find((c) => c.name.toLowerCase() === q)?.id;
}

export function matchDivisionByName(name: string | undefined, orgs: EventOrg[]): string | undefined {
  if (!name) return undefined;
  const q = name.trim().toLowerCase();
  return orgs.find((o) => o.orgName.toLowerCase() === q)?.orgId;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateRow(row: RawImportRow): string[] {
  const errors: string[] = [];
  if (!row.fullName) errors.push('Full Name is required');
  if (!row.email)    errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Email is invalid');
  if (!row.phone)    errors.push('Phone is required');
  if (!row.birthday) errors.push('Birthday is required');
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.birthday)) errors.push('Birthday format must be YYYY-MM-DD');
  return errors;
}

// ─── Template download ────────────────────────────────────────────────────────

export async function downloadImportTemplate(): Promise<void> {
  const XLSX = await import('xlsx');

  const headers = [
    'Full Name', 'Email', 'Phone', 'Birthday',
    'Nickname', 'Address', 'Church', 'Division',
    'Emergency Contact Name', 'Emergency Contact Phone', 'Status',
  ];
  const sample = [
    'Juan dela Cruz', 'juan@example.com', '09123456789', '2000-01-15',
    'Juan', 'Juban, Sorsogon', 'Juban FGC', 'UFY - Pearl Division',
    'Maria dela Cruz', '09987654321', 'APPROVED',
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);

  // Column widths
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registrants');
  XLSX.writeFile(wb, 'registration-import-template.xlsx');
}
