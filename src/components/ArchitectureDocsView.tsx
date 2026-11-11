import React, { useState } from 'react';
import { 
  Database, Code2, Cpu, FileText, Copy, Check, 
  Terminal, Server, CheckCircle2, Layers
} from 'lucide-react';
import { 
  POSTGRESQL_DDL, 
  PRISMA_SCHEMA, 
  SYSTEM_PROMPT, 
  JSON_SCHEMA_SPEC, 
  NEXTJS_SERVER_ACTION_CODE 
} from '../data/architecturalReference.ts';

export const ArchitectureDocsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ddl' | 'prisma' | 'prompt' | 'nextjs' | 'plan'>('ddl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Server className="w-4 h-4" />
              <span>Full-Stack Engineering Blueprint</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              TechIntake AI System Architecture & Schemas
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Complete production schemas, extraction engine prompts, and server implementation code for PostgreSQL/Supabase, Prisma, and Next.js / Express.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-[11px] font-mono text-cyan-300">
              Gemini 3.8 Flash • Structured Outputs
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ddl')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ddl'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>PostgreSQL / Supabase DDL</span>
        </button>

        <button
          onClick={() => setActiveTab('prisma')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'prisma'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Prisma Schema</span>
        </button>

        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'prompt'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>LLM System Prompt & JSON Schema</span>
        </button>

        <button
          onClick={() => setActiveTab('nextjs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'nextjs'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Next.js API Route / Server Action</span>
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'plan'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Implementation Plan</span>
        </button>
      </div>

      {/* Tab 1: PostgreSQL DDL */}
      {activeTab === 'ddl' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">PostgreSQL / Supabase Schema (DDL)</h3>
              <p className="text-xs text-slate-400">
                Relational schema with UUID primary keys, ENUM types, cascade deletes, foreign keys, and indexes.
              </p>
            </div>
            <button
              onClick={() => copyText('ddl', POSTGRESQL_DDL)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {copiedKey === 'ddl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'ddl' ? 'Copied DDL' : 'Copy SQL DDL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-[11px] font-mono text-cyan-200/90 overflow-x-auto leading-relaxed max-h-[65vh]">
            {POSTGRESQL_DDL}
          </pre>
        </div>
      )}

      {/* Tab 2: Prisma Schema */}
      {activeTab === 'prisma' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Prisma ORM Schema (`prisma/schema.prisma`)</h3>
              <p className="text-xs text-slate-400">
                Type-safe Prisma client models with relation mappings and Decimal precision.
              </p>
            </div>
            <button
              onClick={() => copyText('prisma', PRISMA_SCHEMA)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {copiedKey === 'prisma' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'prisma' ? 'Copied Prisma' : 'Copy Prisma Schema'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-[11px] font-mono text-emerald-200/90 overflow-x-auto leading-relaxed max-h-[65vh]">
            {PRISMA_SCHEMA}
          </pre>
        </div>
      )}

      {/* Tab 3: System Prompt & JSON Schema */}
      {activeTab === 'prompt' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Engineering Lead System Prompt</h3>
              <button
                onClick={() => copyText('prompt', SYSTEM_PROMPT)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                {copiedKey === 'prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'prompt' ? 'Copied Prompt' : 'Copy System Prompt'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-xs font-mono text-amber-200/90 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {SYSTEM_PROMPT}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">JSON Schema for Structured Outputs</h3>
              <button
                onClick={() => copyText('schema', JSON.stringify(JSON_SCHEMA_SPEC, null, 2))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                {copiedKey === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'schema' ? 'Copied JSON Schema' : 'Copy JSON Schema'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-[11px] font-mono text-blue-200/90 overflow-x-auto leading-relaxed max-h-96">
              {JSON.stringify(JSON_SCHEMA_SPEC, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Next.js API Route */}
      {activeTab === 'nextjs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Core Next.js Route (`app/api/intake/route.ts`)</h3>
              <p className="text-xs text-slate-400">
                Handles text/audio, executes Gemini extraction with structured output, matches stock, and populates procurement.
              </p>
            </div>
            <button
              onClick={() => copyText('nextjs', NEXTJS_SERVER_ACTION_CODE)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {copiedKey === 'nextjs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'nextjs' ? 'Copied Route Code' : 'Copy Route Code'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-[11px] font-mono text-cyan-200/90 overflow-x-auto leading-relaxed max-h-[65vh]">
            {NEXTJS_SERVER_ACTION_CODE}
          </pre>
        </div>
      )}

      {/* Tab 5: Implementation Plan */}
      {activeTab === 'plan' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Actionable Implementation Roadmap for TechIntake AI
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-[11px] flex items-center justify-center font-mono">1</span>
                  <span>Database Setup & Migration</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Initialize Supabase/PostgreSQL instance or SQLite with Prisma.</li>
                  <li>Run migration using the provided DDL or Prisma schema.</li>
                  <li>Seed standard workshop inventory catalog (SSDs, RAM, UniFi APs, patch cables).</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="font-bold text-blue-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-800 text-[11px] flex items-center justify-center font-mono">2</span>
                  <span>Multi-Modal Intake & Whisper / Gemini Transcribe</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Wire browser Web Audio API MediaRecorder to capture audio blobs.</li>
                  <li>Route audio through <code>gemini-3.5-transcribe</code> to extract raw transcripts.</li>
                  <li>Support text pasting from WhatsApp/Email with pre-fill quick scenario templates.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-800 text-[11px] flex items-center justify-center font-mono">3</span>
                  <span>LLM Reasoning & Stock Matching Engine</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Use Gemini 3.8 Flash with <code>responseMimeType: "application/json"</code> and <code>responseSchema</code>.</li>
                  <li>Query local workshop inventory to verify stock levels for each item in the BOM.</li>
                  <li>Trigger automated procurement entry creation for any missing or depleted parts.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 text-[11px] flex items-center justify-center font-mono">4</span>
                  <span>Work Order Dashboard & WhatsApp Linkage</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Kanban workflow with drag/drop or stage selectors across the 7 repair stages.</li>
                  <li>Interactive checklist progress tracking with real-time completion status.</li>
                  <li>One-click "Send via WhatsApp" formatted message generation with quote calculations.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
