import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCMS } from '../context/CMSContext';
import {
  PRISMA_SCHEMA_SOURCE,
  generatePostgresSqlDump,
  generatePrismaSeedScript
} from '../cms/prismaGenerators';
import {
  Database,
  RefreshCw,
  Play,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  Terminal,
  Table as TableIcon,
  FileCode,
  ShieldCheck,
  X,
  Save,
  Activity
} from 'lucide-react';

interface DbTableSummary {
  name: string;
  model: string;
  rowCount: number;
  primaryKey: string;
  description: string;
}

interface DbStatusResponse {
  connected: boolean;
  host: string;
  provider: string;
  sslMode: string;
  pingMs: number;
  serverInfo: {
    version: string;
    fullVersion: string;
    databaseName: string;
    currentUser: string;
    currentSchema: string;
    dbSize: string;
    serverTime: string;
  };
  tables: DbTableSummary[];
  totalRows: number;
  migrations: any[];
  schemaSource: string;
}

interface DbTableDataResponse {
  tableName: string;
  columns: { name: string; dataType: string; nullable: boolean }[];
  rows: Record<string, any>[];
  rowCount: number;
  durationMs: number;
  queriedAt: string;
}

interface CMSDatabaseSectionProps {
  notify: (text: string, type?: 'success' | 'error') => void;
  onSyncDrafts: () => void;
}

const PRESET_SQL_QUERIES: { label: string; sql: string }[] = [
  {
    label: 'AdminUser Credentials',
    sql: 'SELECT id, email, password, name, role, "lastLoginAt", "updatedAt" FROM "AdminUser";'
  },
  {
    label: 'All Portfolio Projects',
    sql: 'SELECT id, title, category, featured, published, "sortOrder" FROM "Project" ORDER BY "sortOrder" ASC;'
  },
  {
    label: 'Skills by Proficiency',
    sql: 'SELECT id, name, level, category, icon FROM "Skill" ORDER BY level DESC;'
  },
  {
    label: 'SiteProfile Record',
    sql: 'SELECT id, name, title, email, location, "buildVersion", "updatedAt" FROM "SiteProfile";'
  },
  {
    label: 'Partner Marquee Logos',
    sql: 'SELECT id, name, src, "fileName", active, "sortOrder" FROM "PartnerLogo" ORDER BY "sortOrder" ASC;'
  },
  {
    label: 'AI Knowledge Graph',
    sql: 'SELECT id, name, types, url, status FROM "KnowledgeRelationship" ORDER BY "createdAt" ASC;'
  },
  {
    label: 'Contact Messages Inbox',
    sql: 'SELECT id, name, email, status, "telegramDelivered", "createdAt" FROM "ContactMessage" ORDER BY "createdAt" DESC;'
  },
  {
    label: 'Recent Audit Trail',
    sql: 'SELECT id, action, section, summary, timestamp FROM "AuditLog" ORDER BY timestamp DESC LIMIT 20;'
  },
  {
    label: 'Prisma Migrations History',
    sql: 'SELECT migration_name, finished_at, applied_steps_count FROM "_prisma_migrations" ORDER BY started_at DESC;'
  },
  {
    label: 'PostgreSQL Public Tables',
    sql: "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  }
];

export default function CMSDatabaseSection({ notify, onSyncDrafts }: CMSDatabaseSectionProps) {
  const {
    cms,
    adminUser,
    envMetadata,
    getAuthHeaders,
    applyServerState,
    changePassword,
    importSnapshot,
    factoryReset
  } = useCMS();

  const [subTab, setSubTab] = useState<'explorer' | 'sql' | 'migrations' | 'backup'>('explorer');
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [syncingDb, setSyncingDb] = useState<boolean>(false);

  // Table Explorer state
  const [selectedTable, setSelectedTable] = useState<string>('Project');
  const [tableData, setTableData] = useState<DbTableDataResponse | null>(null);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [rowSearch, setRowSearch] = useState<string>('');
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [editingRowJson, setEditingRowJson] = useState<string>('');
  const [isInsertingRow, setIsInsertingRow] = useState<boolean>(false);
  const [rowSaving, setRowSaving] = useState<boolean>(false);

  // Live SQL Runner state
  const [sqlInput, setSqlInput] = useState<string>(PRESET_SQL_QUERIES[0].sql);
  const [sqlRunning, setSqlRunning] = useState<boolean>(false);
  const [sqlResult, setSqlResult] = useState<{
    command: string;
    rowCount: number;
    fields: { name: string; dataTypeID: number }[];
    rows: Record<string, any>[];
    durationMs: number;
  } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlViewMode, setSqlViewMode] = useState<'table' | 'json'>('table');

  // Backup & .env Security state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [currPass, setCurrPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [newAdminEmailInput, setNewAdminEmailInput] = useState<string>(
    adminUser?.email || 'amalkochuparambilp@gmail.com'
  );
  const [newDatabaseUrlInput, setNewDatabaseUrlInput] = useState<string>('');
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const fetchDbStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/cms/db/status?t=${Date.now()}`, {
        headers: getAuthHeaders(false)
      });
      if (res.ok) {
        const data = (await res.json()) as DbStatusResponse;
        setDbStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setStatusLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchTableRows = useCallback(
    async (tableName: string) => {
      setTableLoading(true);
      try {
        const res = await fetch(`/api/cms/db/table/${encodeURIComponent(tableName)}?t=${Date.now()}`, {
          headers: getAuthHeaders(false)
        });
        if (res.ok) {
          const data = (await res.json()) as DbTableDataResponse;
          setTableData(data);
        }
      } catch {
        // ignore
      } finally {
        setTableLoading(false);
      }
    },
    [getAuthHeaders]
  );

  useEffect(() => {
    fetchDbStatus();
  }, [fetchDbStatus]);

  useEffect(() => {
    fetchTableRows(selectedTable);
  }, [selectedTable, fetchTableRows]);

  const handleSyncDatabase = async () => {
    setSyncingDb(true);
    try {
      const res = await fetch('/api/cms/db/sync', {
        method: 'POST',
        headers: getAuthHeaders(false)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.state) applyServerState(data.state);
        if (data.status) setDbStatus(data.status);
        await fetchTableRows(selectedTable);
        onSyncDrafts();
        notify('PostgreSQL tables verified & synchronized with .env DATABASE_URL.');
      } else {
        notify(data.error || 'Database sync failed.', 'error');
      }
    } catch {
      notify('Could not reach PostgreSQL sync endpoint.', 'error');
    } finally {
      setSyncingDb(false);
    }
  };

  const openEditRowModal = (row: Record<string, any>) => {
    setIsInsertingRow(false);
    setEditingRow(row);
    const editableCopy = { ...row };
    delete editableCopy.createdAt;
    delete editableCopy.updatedAt;
    delete editableCopy.timestamp;
    setEditingRowJson(JSON.stringify(editableCopy, null, 2));
  };

  const openInsertRowModal = () => {
    setIsInsertingRow(true);
    let template: Record<string, any> = {};
    switch (selectedTable) {
      case 'Project':
        template = {
          id: `proj-${Date.now().toString().slice(-4)}`,
          title: 'New DZt System Module',
          description: 'Production-grade system architecture built with React and PostgreSQL.',
          longDescription: 'Full technical specification and real-time operational telemetry.',
          category: 'system',
          tech: ['React', 'TypeScript', 'PostgreSQL', 'Prisma'],
          features: ['Real-time PostgreSQL persistence', 'Zero-latency UI'],
          githubUrl: 'https://github.com/amalkochuparambilp',
          liveUrl: '',
          featured: false,
          published: true,
          sortOrder: (tableData?.rowCount || 0)
        };
        break;
      case 'Skill':
        template = {
          name: 'Prisma ORM & PostgreSQL',
          level: 92,
          category: 'Backend',
          icon: 'Database',
          sortOrder: (tableData?.rowCount || 0)
        };
        break;
      case 'Collaboration':
        template = {
          organization: 'New Institutional Partner',
          role: 'Lead Systems Architect',
          badge: 'ECOSYSTEM PARTNER',
          logoType: 'libcode',
          description: 'Architected and deployed core digital infrastructure.',
          highlights: ['Automated database workflows', 'Built real-time admin portal'],
          tags: ['PostgreSQL', 'Full-Stack'],
          sortOrder: (tableData?.rowCount || 0)
        };
        break;
      case 'PartnerLogo':
        template = {
          name: 'NEW PARTNER',
          src: '/logos/jnias.svg',
          alt: 'New Partner Logo',
          fileName: 'jnias.svg',
          active: true,
          sortOrder: (tableData?.rowCount || 0)
        };
        break;
      case 'KnowledgeRelationship':
        template = {
          name: 'Verified Contact',
          types: ['friend', 'collaborator'],
          alternateName: [],
          url: 'https://github.com/',
          status: 'confirmed'
        };
        break;
      case 'ContactMessage':
        template = {
          name: 'System Verification',
          email: 'verify@amalkp.online',
          message: 'Direct PostgreSQL row insertion test from Database Studio.',
          status: 'unread',
          telegramDelivered: false
        };
        break;
      default:
        template = {};
    }
    setEditingRow(template);
    setEditingRowJson(JSON.stringify(template, null, 2));
  };

  const handleSaveRowModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(editingRowJson);
    } catch {
      notify('Invalid JSON syntax in row editor.', 'error');
      return;
    }

    setRowSaving(true);
    try {
      const url = isInsertingRow
        ? `/api/cms/db/table/${encodeURIComponent(selectedTable)}`
        : `/api/cms/db/table/${encodeURIComponent(selectedTable)}/${encodeURIComponent(editingRow.id)}`;
      const method = isInsertingRow ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.state) applyServerState(data.state);
        onSyncDrafts();
        setEditingRow(null);
        await Promise.all([fetchTableRows(selectedTable), fetchDbStatus()]);
        notify(
          isInsertingRow
            ? `Inserted new row into "${selectedTable}" in PostgreSQL.`
            : `Updated row "${editingRow.id}" in "${selectedTable}" in PostgreSQL.`
        );
      } else {
        notify(data.error || 'Failed to save row in PostgreSQL.', 'error');
      }
    } catch {
      notify('Network error communicating with PostgreSQL.', 'error');
    } finally {
      setRowSaving(false);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    try {
      const res = await fetch(
        `/api/cms/db/table/${encodeURIComponent(selectedTable)}/${encodeURIComponent(rowId)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(false)
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.state) applyServerState(data.state);
        onSyncDrafts();
        await Promise.all([fetchTableRows(selectedTable), fetchDbStatus()]);
        notify(`Deleted row "${rowId}" from "${selectedTable}" in PostgreSQL.`);
      } else {
        notify(data.error || 'Could not delete row.', 'error');
      }
    } catch {
      notify('Failed to delete row from PostgreSQL.', 'error');
    }
  };

  const handleExecuteSql = async (customSql?: string) => {
    const queryToRun = customSql ?? sqlInput;
    if (!queryToRun.trim()) return;
    setSqlRunning(true);
    setSqlError(null);
    try {
      const res = await fetch('/api/cms/db/query', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ sql: queryToRun })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSqlResult({
          command: data.command,
          rowCount: data.rowCount,
          fields: data.fields || [],
          rows: data.rows || [],
          durationMs: data.durationMs
        });
        if (data.state) {
          applyServerState(data.state);
          onSyncDrafts();
          fetchDbStatus();
          fetchTableRows(selectedTable);
        }
      } else {
        setSqlError(data.error || 'SQL execution error');
      }
    } catch (err: any) {
      setSqlError(err?.message || 'Failed to execute SQL query');
    } finally {
      setSqlRunning(false);
    }
  };

  const handleCopyCode = (label: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(label);
    notify(`Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadFile = (filename: string, content: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Downloaded ${filename}`);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const ok = await importSnapshot(parsed);
        if (ok) {
          onSyncDrafts();
          await Promise.all([fetchDbStatus(), fetchTableRows(selectedTable)]);
          notify('Full CMS snapshot restored into Prisma PostgreSQL!');
        } else {
          notify('Invalid CMS snapshot file.', 'error');
        }
      } catch {
        notify('Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handlePasscodeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currPass.trim()) {
      notify('Current administrator password is required to modify .env credentials.', 'error');
      return;
    }
    const res = await changePassword(
      currPass,
      newPass.trim() || undefined,
      newAdminEmailInput.trim() || undefined,
      newDatabaseUrlInput.trim() || undefined
    );
    if (res.success) {
      notify('Updated .env configuration & PostgreSQL administrator security settings.');
      setCurrPass('');
      setNewPass('');
      setNewDatabaseUrlInput('');
      await Promise.all([fetchDbStatus(), fetchTableRows(selectedTable)]);
    } else {
      notify(res.error || 'Could not update .env credentials.', 'error');
    }
  };

  const canInsertIntoSelected = ![
    'AdminUser',
    'SiteProfile',
    'SiteSettings',
    '_prisma_migrations'
  ].includes(selectedTable);

  const canEditSelected = selectedTable !== '_prisma_migrations';
  const canDeleteFromSelected = ![
    'AdminUser',
    'SiteProfile',
    'SiteSettings',
    '_prisma_migrations'
  ].includes(selectedTable);

  const filteredRows = (tableData?.rows || []).filter((row) => {
    if (!rowSearch.trim()) return true;
    return JSON.stringify(row).toLowerCase().includes(rowSearch.toLowerCase());
  });

  const formatCellValue = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (Array.isArray(val)) return `[${val.join(', ')}]`;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Database Header & Live Connection Banner */}
      <div className="bg-[#0d0d0d] border border-white/15 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold uppercase rounded-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {dbStatus?.connected !== false ? 'LIVE POSTGRESQL (.ENV KEY)' : 'RECONNECTING...'}
              </span>
              <span className="text-xs font-mono text-white/60">
                {dbStatus?.host || envMetadata?.host || 'PostgreSQL via .env'}
              </span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-xs">
                {dbStatus?.sslMode || envMetadata?.sslMode || 'SSL (require)'}
              </span>
              <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-xs">
                KEY: process.env.DATABASE_URL
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Prisma PostgreSQL Live Database Studio
            </h1>
            <p className="text-xs text-white/50 font-sans">
              Authenticated Administrator connection to PostgreSQL via <code className="text-emerald-400 font-mono">.env (DATABASE_URL)</code>: <code className="text-white/70 font-mono">{envMetadata?.maskedUrl || 'postgres://••••••@pooled.db.prisma.io:5432/postgres?sslmode=require'}</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                fetchDbStatus();
                fetchTableRows(selectedTable);
                notify('Refreshed live PostgreSQL telemetry and table rows.');
              }}
              disabled={statusLoading}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono flex items-center gap-1.5 rounded-xs cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
              <span>Ping & Refresh</span>
            </button>

            <button
              onClick={handleSyncDatabase}
              disabled={syncingDb}
              className="px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-xs cursor-pointer transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{syncingDb ? 'Syncing...' : 'Verify & Sync DB'}</span>
            </button>
          </div>
        </div>

        {/* Live PostgreSQL Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-3 bg-black border border-white/10 space-y-0.5">
            <span className="text-[10px] text-white/40 uppercase block">Engine Version</span>
            <span className="text-sm font-bold text-white truncate block" title={dbStatus?.serverInfo?.fullVersion}>
              {dbStatus?.serverInfo?.version || 'PostgreSQL 17'}
            </span>
          </div>
          <div className="p-3 bg-black border border-white/10 space-y-0.5">
            <span className="text-[10px] text-white/40 uppercase block">Query Latency</span>
            <span className="text-sm font-bold text-emerald-400 tabular-nums block">
              {dbStatus?.pingMs ? `${dbStatus.pingMs} ms` : '12 ms'}
            </span>
          </div>
          <div className="p-3 bg-black border border-white/10 space-y-0.5">
            <span className="text-[10px] text-white/40 uppercase block">Database Size</span>
            <span className="text-sm font-bold text-white tabular-nums block">
              {dbStatus?.serverInfo?.dbSize || '—'}
            </span>
          </div>
          <div className="p-3 bg-black border border-white/10 space-y-0.5">
            <span className="text-[10px] text-white/40 uppercase block">Active Schema</span>
            <span className="text-sm font-bold text-cyan-400 block">
              {dbStatus?.serverInfo?.databaseName || 'postgres'}.{dbStatus?.serverInfo?.currentSchema || 'public'}
            </span>
          </div>
          <div className="p-3 bg-black border border-white/10 space-y-0.5">
            <span className="text-[10px] text-white/40 uppercase block">Relational Tables</span>
            <span className="text-sm font-bold text-white tabular-nums block">
              {dbStatus?.tables?.length || 10} Tables
            </span>
          </div>
          <div className="p-3 bg-black border border-white/10 space-y-0.5">
            <span className="text-[10px] text-white/40 uppercase block">Total Live Rows</span>
            <span className="text-sm font-bold text-amber-400 tabular-nums block">
              {dbStatus?.totalRows ?? '—'} Rows
            </span>
          </div>
        </div>
      </div>

      {/* Studio Mode Switcher */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
        {(
          [
            { id: 'explorer', label: '01. Live Table Explorer (Prisma Studio)', icon: TableIcon },
            { id: 'sql', label: '02. Live SQL Query Console', icon: Terminal },
            { id: 'migrations', label: '03. Prisma Schema & Migrations', icon: FileCode },
            { id: 'backup', label: '04. .env Database Key, Admin Security & Backups', icon: ShieldCheck }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-mono flex items-center gap-2 rounded-xs cursor-pointer transition-colors ${
                active
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#0d0d0d] border border-white/10 text-white/65 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          SUB-TAB 1: LIVE TABLE EXPLORER & ROW EDITOR (PRISMA STUDIO)
      ==================================================================== */}
      {subTab === 'explorer' && (
        <div className="space-y-5">
          {/* Table Selector Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(dbStatus?.tables || []).map((tbl) => {
              const isSelected = selectedTable === tbl.name;
              return (
                <button
                  key={tbl.name}
                  onClick={() => {
                    setSelectedTable(tbl.name);
                    setEditingRow(null);
                    setRowSearch('');
                  }}
                  className={`p-3 border text-left transition-all cursor-pointer rounded-xs flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-[#0d0d0d] border-white/10 text-white/75 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono truncate">{tbl.name}</span>
                    <span
                      className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-2xs ${
                        isSelected ? 'bg-black/15 text-black font-bold' : 'bg-white/10 text-emerald-400'
                      }`}
                    >
                      {tbl.rowCount}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono truncate block ${
                      isSelected ? 'text-black/60' : 'text-white/40'
                    }`}
                  >
                    {tbl.model}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Row Editor / Inserter Modal Panel */}
          {editingRow && (
            <form
              onSubmit={handleSaveRowModal}
              className="bg-[#111] border border-emerald-500/40 p-5 space-y-4 font-mono text-xs rounded-xs"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase">
                    {isInsertingRow
                      ? `INSERT INTO "${selectedTable}" (PostgreSQL)`
                      : `UPDATE "${selectedTable}" WHERE id = '${editingRow.id}'`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 uppercase block">
                  Row Payload (JSON — writes directly to PostgreSQL table "{selectedTable}")
                </label>
                <textarea
                  rows={12}
                  value={editingRowJson}
                  onChange={(e) => setEditingRowJson(e.target.value)}
                  className="w-full bg-black border border-white/20 p-3.5 text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-4 py-2 bg-white/5 border border-white/15 text-white/70 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rowSaving}
                  className="px-5 py-2 bg-emerald-400 text-black font-bold uppercase flex items-center gap-1.5 cursor-pointer hover:bg-emerald-300"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{rowSaving ? 'Committing to Postgres...' : isInsertingRow ? 'Insert Row' : 'Commit Update'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Selected Table Toolbar & Live Data Grid */}
          <div className="bg-[#0d0d0d] border border-white/10">
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-mono font-bold text-white">
                    public."{selectedTable}"
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-2xs tabular-nums">
                    {tableData?.rowCount ?? 0} rows · {tableData?.durationMs ?? 1} ms
                  </span>
                </div>
                <p className="text-[11px] text-white/40 font-sans mt-0.5">
                  {dbStatus?.tables?.find((t) => t.name === selectedTable)?.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={rowSearch}
                    onChange={(e) => setRowSearch(e.target.value)}
                    placeholder={`Filter ${selectedTable} rows...`}
                    className="bg-black border border-white/15 pl-8 pr-3 py-1.5 text-xs font-mono text-white w-48 sm:w-56"
                  />
                </div>

                <button
                  onClick={() => fetchTableRows(selectedTable)}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 hover:text-white cursor-pointer"
                  title="Reload rows from PostgreSQL"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${tableLoading ? 'animate-spin' : ''}`} />
                </button>

                {canInsertIntoSelected && (
                  <button
                    onClick={openInsertRowModal}
                    className="px-3.5 py-1.5 bg-white text-black font-mono font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer hover:bg-neutral-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert Row</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live PostgreSQL Rows Table */}
            <div className="overflow-x-auto max-h-[540px]">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="sticky top-0 bg-[#141414] border-b border-white/15 z-10">
                  <tr>
                    {canEditSelected && (
                      <th className="py-2.5 px-3 text-white/50 text-[10px] uppercase whitespace-nowrap w-24">
                        Actions
                      </th>
                    )}
                    {(tableData?.columns || []).map((col) => (
                      <th key={col.name} className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-white font-bold block">{col.name}</span>
                        <span className="text-[10px] text-cyan-400/70 font-normal block">
                          {col.dataType}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRows.map((row, rIdx) => {
                    const rowId = row.id || `row-${rIdx}`;
                    return (
                      <tr key={rowId} className="hover:bg-white/[0.03] transition-colors">
                        {canEditSelected && (
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditRowModal(row)}
                                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] flex items-center gap-1 cursor-pointer"
                                title="Edit Row in PostgreSQL"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              {canDeleteFromSelected && row.id && (
                                <button
                                  onClick={() => handleDeleteRow(row.id)}
                                  className="p-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 cursor-pointer"
                                  title="Delete Row from PostgreSQL"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                        {(tableData?.columns || []).map((col) => {
                          const val = row[col.name];
                          const formatted = formatCellValue(val);
                          return (
                            <td
                              key={col.name}
                              className="py-2.5 px-3 text-white/80 max-w-[260px] truncate whitespace-nowrap"
                              title={formatted}
                            >
                              {val === null || val === undefined ? (
                                <span className="text-white/25 italic">NULL</span>
                              ) : typeof val === 'boolean' ? (
                                <span className={val ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                                  {String(val)}
                                </span>
                              ) : (
                                formatted
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={(tableData?.columns?.length || 4) + 1}
                        className="py-10 text-center text-white/40"
                      >
                        {tableLoading
                          ? `Querying public."${selectedTable}" from pooled.db.prisma.io...`
                          : 'No rows match the current filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 2: LIVE SQL QUERY CONSOLE
      ==================================================================== */}
      {subTab === 'sql' && (
        <div className="space-y-5">
          <div className="bg-[#0d0d0d] border border-white/10 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase">
                  PostgreSQL Live Query Runner (`pooled.db.prisma.io:5432`)
                </h3>
                <p className="text-xs text-white/40 font-sans">
                  Execute real <code className="text-white/70">SELECT</code>, <code className="text-white/70">UPDATE</code>, or <code className="text-white/70">INSERT</code> statements directly against your PostgreSQL database.
                </p>
              </div>
              <button
                onClick={() => handleExecuteSql()}
                disabled={sqlRunning}
                className="px-5 py-2 bg-emerald-400 text-black font-mono font-bold text-xs uppercase flex items-center gap-2 cursor-pointer hover:bg-emerald-300"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{sqlRunning ? 'Executing...' : 'Run SQL Query'}</span>
              </button>
            </div>

            {/* Preset SQL Query Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-white/40 uppercase block">
                Quick Preset Queries (Click to load & execute):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SQL_QUERIES.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setSqlInput(q.sql);
                      handleExecuteSql(q.sql);
                    }}
                    className="px-2.5 py-1 bg-black hover:bg-white/10 border border-white/15 text-[11px] font-mono text-white/80 hover:text-white cursor-pointer transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Input Textarea */}
            <textarea
              rows={4}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder='SELECT * FROM "Project" ORDER BY "sortOrder" ASC;'
              className="w-full bg-black border border-white/20 p-3.5 text-cyan-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-white"
            />

            {sqlError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>PostgreSQL Error: {sqlError}</span>
              </div>
            )}

            {/* SQL Results Output */}
            {sqlResult && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-white/10 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">
                      {sqlResult.command} OK
                    </span>
                    <span className="text-white/40">·</span>
                    <span className="text-white tabular-nums">
                      {sqlResult.rowCount} {sqlResult.rowCount === 1 ? 'row' : 'rows'}
                    </span>
                    <span className="text-white/40">·</span>
                    <span className="text-cyan-400 tabular-nums">{sqlResult.durationMs} ms</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSqlViewMode('table')}
                      className={`px-2.5 py-1 text-[11px] cursor-pointer ${
                        sqlViewMode === 'table' ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/60'
                      }`}
                    >
                      Table View
                    </button>
                    <button
                      onClick={() => setSqlViewMode('json')}
                      className={`px-2.5 py-1 text-[11px] cursor-pointer ${
                        sqlViewMode === 'json' ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/60'
                      }`}
                    >
                      JSON Output
                    </button>
                  </div>
                </div>

                {sqlViewMode === 'table' ? (
                  <div className="overflow-x-auto max-h-[420px] border border-white/10 bg-black">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead className="bg-[#141414] border-b border-white/15">
                        <tr>
                          {sqlResult.fields.map((f) => (
                            <th key={f.name} className="py-2 px-3 text-white font-bold whitespace-nowrap">
                              {f.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sqlResult.rows.map((r, i) => (
                          <tr key={i} className="hover:bg-white/[0.03]">
                            {sqlResult.fields.map((f) => (
                              <td
                                key={f.name}
                                className="py-2 px-3 text-white/80 max-w-[280px] truncate whitespace-nowrap"
                              >
                                {formatCellValue(r[f.name])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <pre className="bg-black border border-white/10 p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[420px]">
                    {JSON.stringify(sqlResult.rows, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 3: PRISMA SCHEMA & APPLIED MIGRATIONS
      ==================================================================== */}
      {subTab === 'migrations' && (
        <div className="space-y-6">
          {/* Live Applied Migrations Table from _prisma_migrations */}
          <div className="bg-[#0d0d0d] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase">
                  Applied Prisma PostgreSQL Migrations (`_prisma_migrations`)
                </h3>
                <p className="text-xs text-white/40 font-sans">
                  Queried live from <code className="text-white/70">public."_prisma_migrations"</code> on <code className="text-white/70">pooled.db.prisma.io:5432</code>.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                {(dbStatus?.migrations || []).length} Applied
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[11px]">
                    <th className="py-2 px-3">Migration Name</th>
                    <th className="py-2 px-3">Steps</th>
                    <th className="py-2 px-3">Finished At</th>
                    <th className="py-2 px-3">Checksum (SHA-256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(dbStatus?.migrations || []).map((m: any) => (
                    <tr key={m.id}>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{m.migration_name}</td>
                      <td className="py-2.5 px-3 text-white tabular-nums">{m.applied_steps_count}</td>
                      <td className="py-2.5 px-3 text-white/70 tabular-nums">
                        {m.finished_at ? new Date(m.finished_at).toLocaleString() : 'Applied'}
                      </td>
                      <td className="py-2.5 px-3 text-white/40 truncate max-w-[220px]">{m.checksum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live prisma/schema.prisma */}
          <div className="bg-[#0d0d0d] border border-white/10 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-white block">
                  prisma/schema.prisma — Active Relational Schema
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  Synchronized with PostgreSQL via `npx prisma migrate dev --name init`
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    handleCopyCode('schema.prisma', dbStatus?.schemaSource || PRISMA_SCHEMA_SOURCE)
                  }
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode === 'schema.prisma' ? 'Copied' : 'Copy Schema'}</span>
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile('dzt-postgres-dump.sql', generatePostgresSqlDump(cms), 'application/sql')
                  }
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Live .SQL</span>
                </button>
                <button
                  onClick={() => handleDownloadFile('seed.ts', generatePrismaSeedScript(cms))}
                  className="px-3 py-1.5 bg-white text-black font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download seed.ts</span>
                </button>
              </div>
            </div>
            <pre className="bg-black border border-white/10 p-4 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-[420px] leading-relaxed">
              {dbStatus?.schemaSource || PRISMA_SCHEMA_SOURCE}
            </pre>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 4: BACKUP, RESTORE & SECURITY
      ==================================================================== */}
      {subTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div className="bg-[#0d0d0d] border border-white/10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase">
              Full PostgreSQL Snapshot Backup & Restore
            </h3>
            <p className="text-xs text-white/50 font-sans">
              Export all 9 PostgreSQL tables as a portable JSON or SQL file, or restore a snapshot directly into your live Prisma PostgreSQL database.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() =>
                  handleDownloadFile(
                    `dzt-postgres-snapshot-${new Date().toISOString().slice(0, 10)}.json`,
                    JSON.stringify(cms, null, 2),
                    'application/json'
                  )
                }
                className="px-4 py-2.5 bg-white text-black font-bold uppercase flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Snapshot</span>
              </button>
              <button
                onClick={() => importFileInputRef.current?.click()}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white uppercase flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore JSON to Postgres</span>
              </button>
              <input
                ref={importFileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportJsonFile}
                className="hidden"
              />
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-[10px] text-white/40 uppercase block">
                Re-Seed PostgreSQL to Factory Baseline
              </span>
              {confirmReset ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await factoryReset();
                      onSyncDrafts();
                      await Promise.all([fetchDbStatus(), fetchTableRows(selectedTable)]);
                      setConfirmReset(false);
                      notify('PostgreSQL database reset and re-seeded to baseline defaults.');
                    }}
                    className="px-3 py-2 bg-rose-600 text-white font-bold cursor-pointer"
                  >
                    Confirm Re-Seed Database
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-2 bg-white/10 text-white/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset & Re-Seed PostgreSQL Tables</span>
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={handlePasscodeUpdate}
            className="bg-[#0d0d0d] border border-white/10 p-6 space-y-4"
          >
            <div className="border-b border-white/10 pb-3 space-y-1">
              <h3 className="text-sm font-bold text-white uppercase">
                PostgreSQL Admin Credentials (`AdminUser` Table) & `.env` Database Key
              </h3>
              <p className="text-xs text-white/50 font-sans">
                Administrator <code className="text-emerald-400 font-mono">email</code> and <code className="text-emerald-400 font-mono">password</code> are stored directly in the PostgreSQL <code className="text-white/80 font-mono">AdminUser</code> & <code className="text-white/80 font-mono">SiteSettings</code> tables. Only <code className="text-amber-300 font-mono">DATABASE_URL</code> is stored in <code className="text-white/80 font-mono">.env</code>.
              </p>
            </div>

            <div className="p-3 bg-black border border-white/10 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase">.env Connection Key</span>
                <span className="text-emerald-400 font-bold">DATABASE_URL (Loaded from .env)</span>
              </div>
              <div className="text-white/70 truncate" title={envMetadata?.maskedUrl}>
                {envMetadata?.maskedUrl || 'postgres://••••••@pooled.db.prisma.io:5432/postgres?sslmode=require'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase block">
                Current Admin Password in PostgreSQL (`AdminUser.password`)
              </label>
              <input
                type="password"
                required
                value={currPass}
                onChange={(e) => setCurrPass(e.target.value)}
                placeholder="Enter current database admin password"
                className="w-full bg-black border border-white/15 p-2.5 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase block">
                Admin Email in PostgreSQL (`AdminUser.email`)
              </label>
              <input
                type="email"
                value={newAdminEmailInput}
                onChange={(e) => setNewAdminEmailInput(e.target.value)}
                placeholder="amalkochuparambilp@gmail.com"
                className="w-full bg-black border border-white/15 p-2.5 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase block">
                New Admin Password in PostgreSQL (`AdminUser.password` — leave blank to keep current)
              </label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Minimum 4 characters"
                className="w-full bg-black border border-white/15 p-2.5 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase block">
                Update DATABASE_URL in .env (Optional — leave blank to keep current PostgreSQL key)
              </label>
              <input
                type="password"
                value={newDatabaseUrlInput}
                onChange={(e) => setNewDatabaseUrlInput(e.target.value)}
                placeholder="postgres://user:pass@host:5432/postgres?sslmode=require"
                className="w-full bg-black border border-white/15 p-2.5 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-white text-black font-bold uppercase cursor-pointer hover:bg-neutral-200 transition-colors"
            >
              Update Admin Credentials in PostgreSQL
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
