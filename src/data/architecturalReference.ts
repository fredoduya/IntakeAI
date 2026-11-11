export const POSTGRESQL_DDL = `-- =========================================================================
-- TechIntake AI - Enterprise PostgreSQL / Supabase Schema (DDL)
-- Includes Clients, Work Orders, Inventory, BOM items, and Procurement
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE job_type_enum AS ENUM (
  'Repair', 'Network Setup', 'Upgrade', 'New Build', 'General Inquiry'
);

CREATE TYPE priority_level_enum AS ENUM (
  'Urgent', 'High', 'Medium', 'Low'
);

CREATE TYPE ticket_status_enum AS ENUM (
  'New Intake', 'Triage & Diagnosis', 'Waiting on Parts', 
  'In Progress / Bench', 'Testing & QA', 'Ready for Pickup', 'Completed'
);

CREATE TYPE procurement_status_enum AS ENUM (
  'Needed', 'Ordered', 'Received'
);

-- 1. Clients Table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  preferred_contact VARCHAR(50) DEFAULT 'WhatsApp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inventory Items Table (Master Stock)
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  retail_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  stock_quantity INT NOT NULL DEFAULT 0,
  min_threshold INT NOT NULL DEFAULT 2,
  supplier VARCHAR(255),
  lead_time_days INT DEFAULT 2,
  shelf_location VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tickets / Work Orders Table
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  job_type job_type_enum NOT NULL DEFAULT 'Repair',
  priority priority_level_enum NOT NULL DEFAULT 'Medium',
  status ticket_status_enum NOT NULL DEFAULT 'New Intake',
  
  -- Raw Intake
  raw_input TEXT NOT NULL,
  input_modality VARCHAR(20) DEFAULT 'text', -- 'text', 'audio', 'mixed'
  transcribed_text TEXT,
  
  -- AI Extracted Engineering Data
  layman_problem_summary TEXT NOT NULL,
  technical_diagnosis_or_spec TEXT NOT NULL,
  root_cause_analysis TEXT,
  client_facing_explanation TEXT NOT NULL,
  
  -- Financial & Scheduling Estimates
  estimated_labor_hours NUMERIC(5, 2) DEFAULT 1.0,
  labor_rate_per_hour NUMERIC(10, 2) DEFAULT 85.00,
  total_estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
  
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Suggested Diagnostic Checklist / Action Items
CREATE TABLE ticket_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  step_order INT NOT NULL DEFAULT 1,
  step_description TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'diagnostic', -- 'diagnostic', 'hardware', 'configuration', 'bench_test'
  estimated_minutes INT DEFAULT 15,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- 5. Bill of Materials (BOM) / Ticket Components
CREATE TABLE ticket_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100),
  category VARCHAR(100),
  quantity INT NOT NULL DEFAULT 1,
  estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  in_stock BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Missing Stock / Procurement Orders
CREATE TABLE procurement_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_component_id UUID REFERENCES ticket_components(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100),
  quantity_needed INT NOT NULL DEFAULT 1,
  estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
  status procurement_status_enum NOT NULL DEFAULT 'Needed',
  supplier VARCHAR(255),
  order_date DATE,
  expected_arrival_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful Indexes
CREATE INDEX idx_work_orders_client ON work_orders(client_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_ticket_components_order ON ticket_components(work_order_id);
CREATE INDEX idx_procurement_status ON procurement_items(status);
CREATE INDEX idx_inventory_sku ON inventory_items(sku);
`;

export const PRISMA_SCHEMA = `// =========================================================================
// TechIntake AI - Prisma Schema
// schema.prisma
// =========================================================================

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum JobType {
  Repair
  NetworkSetup
  Upgrade
  NewBuild
  GeneralInquiry
}

enum PriorityLevel {
  Urgent
  High
  Medium
  Low
}

enum TicketStatus {
  NewIntake
  TriageAndDiagnosis
  WaitingOnParts
  InProgressBench
  TestingAndQA
  ReadyForPickup
  Completed
}

enum ProcurementStatus {
  Needed
  Ordered
  Received
}

model Client {
  id               String       @id @default(uuid())
  name             String
  phone            String
  email            String?
  company          String?
  preferredContact String       @default("WhatsApp")
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  workOrders       WorkOrder[]

  @@map("clients")
}

model InventoryItem {
  id            String             @id @default(uuid())
  sku           String             @unique
  name          String
  category      String
  unitCost      Decimal            @default(0.0) @db.Decimal(10, 2)
  retailPrice   Decimal            @default(0.0) @db.Decimal(10, 2)
  stockQuantity Int                @default(0)
  minThreshold  Int                @default(2)
  supplier      String?
  leadTimeDays  Int                @default(2)
  shelfLocation String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  components    TicketComponent[]

  @@map("inventory_items")
}

model WorkOrder {
  id                       String             @id @default(uuid())
  ticketNumber             String             @unique
  clientId                 String
  client                   Client             @relation(fields: [clientId], references: [id], onDelete: Cascade)
  jobType                  JobType            @default(Repair)
  priority                 PriorityLevel      @default(Medium)
  status                   TicketStatus       @default(NewIntake)
  
  // Raw Customer Ingestion
  rawInput                 String             @db.Text
  inputModality            String             @default("text")
  transcribedText          String?            @db.Text
  
  // AI Engineering Extraction
  laymanProblemSummary     String             @db.Text
  technicalDiagnosisOrSpec String             @db.Text
  rootCauseAnalysis        String?            @db.Text
  clientFacingExplanation  String             @db.Text
  
  // Financials & Labor
  estimatedLaborHours      Decimal            @default(1.0) @db.Decimal(5, 2)
  laborRatePerHour         Decimal            @default(85.00) @db.Decimal(10, 2)
  totalEstimatedCost       Decimal            @default(0.0) @db.Decimal(10, 2)
  internalNotes            String?            @db.Text
  
  createdAt                DateTime           @default(now())
  updatedAt                DateTime           @updatedAt
  
  actionItems              TicketActionItem[]
  components               TicketComponent[]
  procurementItems         ProcurementItem[]

  @@map("work_orders")
}

model TicketActionItem {
  id             String      @id @default(uuid())
  workOrderId    String
  workOrder      WorkOrder   @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  stepOrder      Int         @default(1)
  stepDescription String     @db.Text
  category       String      @default("diagnostic")
  estimatedMinutes Int       @default(15)
  isCompleted    Boolean     @default(false)
  completedAt    DateTime?

  @@map("ticket_action_items")
}

model TicketComponent {
  id               String           @id @default(uuid())
  workOrderId      String
  workOrder        WorkOrder        @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  inventoryItemId  String?
  inventoryItem    InventoryItem?   @relation(fields: [inventoryItemId], references: [id], onDelete: SetNull)
  itemName         String
  partNumber       String?
  category         String?
  quantity         Int              @default(1)
  estimatedCost    Decimal          @default(0.0) @db.Decimal(10, 2)
  inStock          Boolean          @default(false)
  notes            String?          @db.Text
  createdAt        DateTime         @default(now())
  procurementItems ProcurementItem[]

  @@map("ticket_components")
}

model ProcurementItem {
  id                String            @id @default(uuid())
  ticketComponentId String?
  ticketComponent   TicketComponent?  @relation(fields: [ticketComponentId], references: [id], onDelete: Cascade)
  workOrderId       String
  workOrder         WorkOrder         @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  itemName          String
  partNumber        String?
  quantityNeeded    Int               @default(1)
  estimatedCost     Decimal           @default(0.0) @db.Decimal(10, 2)
  status            ProcurementStatus @default(Needed)
  supplier          String?
  orderDate         DateTime?
  expectedArrivalDate DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@map("procurement_items")
}
`;

export const SYSTEM_PROMPT = `You are the Lead Systems Architect & Senior Hardware/Network Diagnostics Engineer for "TechIntake AI".
Your role is to translate unstructured, vague, and jargon-free layman client messages (from voice memos, WhatsApp notes, emails, or phone logs) into rigorous, production-grade technical engineering work orders.

### Domain Rules:
1. Identify the core Job Type accurately:
   - "Repair": Hardware failures (clicking drives, BSODs, bad PSUs, water spills, broken screens, overheating).
   - "Network Setup": Wi-Fi dead zones, co-channel interference, mesh APs, VLANs, PoE switches, router configs, cabling.
   - "Upgrade": RAM, SSD migration, GPU upgrade, cooling, OS clean install.
   - "New Build": Custom PC specification, server rack build, workstation assembly.
   - "General Inquiry": Software troubleshooting, malware check, backup consultation.

2. Diagnostic Rigor:
   - "Clicking drive" -> S.M.A.R.T. failing mechanical HDD head-crash / actuator arm failure; advise immediate power down to prevent platter scratching.
   - "Slow back office Wi-Fi during streaming" -> 2.4GHz saturation, co-channel interference, attenuation through firewalls/concrete, absence of roaming handoff (802.11k/v/r), or insufficient backhaul bandwidth.
   - "Blue screen with memory errors" -> Memory timings, bad DIMM slot, or unstable XMP profile requiring MemTest86 diagnostic.

3. Bill of Materials (BOM):
   - Specify real, industry-standard component names, typical part categories, and reasonable hardware costs (USD).
   - Flag required tools, consumables (thermal paste, thermal pads, Cat6 RJ45 patch cables, mounting brackets) if applicable.

4. Client-Facing Explanation:
   - Write in a polite, highly reassuring, transparent tone without condescending tech jargon.
   - Clearly explain: What is likely happening, what we will test first, estimated repair turnaround, and that no unapproved costs will be billed.

5. Step-by-Step Action Checklist:
   - Numbered, practical bench steps for the engineer (e.g., 1. Bench test with known-good PSU; 2. Boot to Linux USB live environment; 3. Run CrystalDiskInfo/smartctl; 4. Image drive before file recovery).
`;

export const JSON_SCHEMA_SPEC = {
  type: "object",
  properties: {
    jobType: {
      type: "string",
      enum: ["Repair", "Network Setup", "Upgrade", "New Build", "General Inquiry"],
      description: "Auto-detected category of the job based on customer symptoms."
    },
    priority: {
      type: "string",
      enum: ["Urgent", "High", "Medium", "Low"],
      description: "Urgency assessment based on client business impact, data loss risk, or deadlines."
    },
    laymanProblemSummary: {
      type: "string",
      description: "Concise 1-2 sentence plain-language summary of what the client is experiencing."
    },
    technicalDiagnosisOrSpec: {
      type: "string",
      description: "Engineering-grade technical root cause analysis, symptom translation, and hardware/network hypotheses."
    },
    rootCauseAnalysis: {
      type: "string",
      description: "Probable physical, electrical, network-layer, or software failure mechanics."
    },
    suggestedActionItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step: { type: "string", description: "Concrete, testable action for the technician." },
          category: { 
            type: "string", 
            enum: ["diagnostic", "hardware", "configuration", "bench_test"],
            description: "Technician task classification."
          },
          estimatedMinutes: { type: "integer", description: "Estimated time in minutes to complete this step." }
        },
        required: ["step", "category", "estimatedMinutes"]
      },
      description: "Sequential diagnostic checklist for the technician on the bench or on-site."
    },
    billOfMaterials: {
      type: "array",
      items: {
        type: "object",
        properties: {
          itemName: { type: "string", description: "Hardware component, cable, or consumable item needed." },
          partNumber: { type: "string", description: "Generic or specific manufacturer part number or spec." },
          category: { type: "string", description: "Component category e.g., Storage, Networking, Memory, Power, Cable." },
          estimatedCost: { type: "number", description: "Estimated unit purchase cost in USD." },
          quantity: { type: "integer", description: "Quantity needed." },
          notes: { type: "string", description: "Compatibility or installation notes." }
        },
        required: ["itemName", "category", "estimatedCost", "quantity"]
      },
      description: "List of replacement parts or installation hardware required."
    },
    clientFacingExplanation: {
      type: "string",
      description: "Empathetic, jargon-free message ready to send to the client via WhatsApp, email, or SMS."
    },
    estimatedLaborHours: {
      type: "number",
      description: "Estimated technician hours required."
    },
    laborRatePerHour: {
      type: "number",
      description: "Standard hourly labor rate (defaults to 85.00)."
    }
  },
  required: [
    "jobType",
    "priority",
    "laymanProblemSummary",
    "technicalDiagnosisOrSpec",
    "suggestedActionItems",
    "billOfMaterials",
    "clientFacingExplanation",
    "estimatedLaborHours",
    "laborRatePerHour"
  ]
};

export const NEXTJS_SERVER_ACTION_CODE = `// =========================================================================
// Next.js App Router (app/api/intake/route.ts or Server Action)
// Translates raw customer input (text or audio) -> Structured Work Order
// =========================================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma"; // Your Prisma client

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } }
});

export async function POST(req: NextRequest) {
  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      rawInput,
      audioBase64,
      audioMimeType,
      preferredContact = "WhatsApp"
    } = await req.json();

    let processedText = rawInput || "";

    // 1. Audio Ingestion (if voice memo uploaded)
    if (audioBase64) {
      const transcribeResponse = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: audioMimeType || "audio/webm",
                data: audioBase64
              }
            },
            { text: "Transcribe this customer voice message accurately verbatim." }
          ]
        }
      });
      const transcript = transcribeResponse.text || "";
      processedText = processedText ? \`\${processedText}\\n[Voice Memo Transcript]: \${transcript}\` : transcript;
    }

    if (!processedText.trim()) {
      return NextResponse.json({ error: "Missing text or audio input" }, { status: 400 });
    }

    // 2. LLM Extraction & Reasoning with Structured Output Schema
    const completion = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: \`Analyze this customer intake request and generate an engineering work-order specification:\\n\\n\${processedText}\`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            jobType: { type: Type.STRING },
            priority: { type: Type.STRING },
            laymanProblemSummary: { type: Type.STRING },
            technicalDiagnosisOrSpec: { type: Type.STRING },
            rootCauseAnalysis: { type: Type.STRING },
            suggestedActionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  category: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER }
                },
                required: ["step", "category", "estimatedMinutes"]
              }
            },
            billOfMaterials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  partNumber: { type: Type.STRING },
                  category: { type: Type.STRING },
                  estimatedCost: { type: Type.NUMBER },
                  quantity: { type: Type.INTEGER },
                  notes: { type: Type.STRING }
                },
                required: ["itemName", "category", "estimatedCost", "quantity"]
              }
            },
            clientFacingExplanation: { type: Type.STRING },
            estimatedLaborHours: { type: Type.NUMBER },
            laborRatePerHour: { type: Type.NUMBER }
          },
          required: [
            "jobType", "priority", "laymanProblemSummary",
            "technicalDiagnosisOrSpec", "suggestedActionItems",
            "billOfMaterials", "clientFacingExplanation",
            "estimatedLaborHours", "laborRatePerHour"
          ]
        }
      }
    });

    const parsed = JSON.parse(completion.text || "{}");

    // 3. Database Persistence & Missing Stock Linkage
    // A) Upsert client
    const client = await prisma.client.create({
      data: {
        name: clientName || "Walk-In Client",
        phone: clientPhone || "N/A",
        email: clientEmail || null,
        preferredContact
      }
    });

    // B) Calculate costs and stock matching
    const laborCost = (parsed.estimatedLaborHours || 1.5) * (parsed.laborRatePerHour || 85);
    const partsCost = parsed.billOfMaterials.reduce(
      (sum: number, item: any) => sum + (item.estimatedCost * item.quantity), 0
    );
    const totalCost = laborCost + partsCost;

    const ticketNumber = \`WO-\${Date.now().toString().slice(-6)}\`;

    // C) Save Work Order
    const workOrder = await prisma.workOrder.create({
      data: {
        ticketNumber,
        clientId: client.id,
        jobType: parsed.jobType || "Repair",
        priority: parsed.priority || "Medium",
        status: "NewIntake",
        rawInput: processedText,
        inputModality: audioBase64 ? "audio" : "text",
        transcribedText: audioBase64 ? processedText : null,
        laymanProblemSummary: parsed.laymanProblemSummary,
        technicalDiagnosisOrSpec: parsed.technicalDiagnosisOrSpec,
        rootCauseAnalysis: parsed.rootCauseAnalysis,
        clientFacingExplanation: parsed.clientFacingExplanation,
        estimatedLaborHours: parsed.estimatedLaborHours,
        laborRatePerHour: parsed.laborRatePerHour,
        totalEstimatedCost: totalCost,
        actionItems: {
          create: parsed.suggestedActionItems.map((item: any, idx: number) => ({
            stepOrder: idx + 1,
            stepDescription: item.step,
            category: item.category,
            estimatedMinutes: item.estimatedMinutes,
            isCompleted: false
          }))
        }
      }
    });

    // D) Stock Checking & Missing Stock Linkage
    for (const bomItem of parsed.billOfMaterials) {
      // Find matching inventory item in local workshop stock
      const inventoryMatch = await prisma.inventoryItem.findFirst({
        where: {
          name: { contains: bomItem.itemName, mode: "insensitive" }
        }
      });

      const inStock = Boolean(inventoryMatch && inventoryMatch.stockQuantity >= bomItem.quantity);

      const component = await prisma.ticketComponent.create({
        data: {
          workOrderId: workOrder.id,
          inventoryItemId: inventoryMatch?.id || null,
          itemName: bomItem.itemName,
          partNumber: bomItem.partNumber || inventoryMatch?.sku || null,
          category: bomItem.category,
          quantity: bomItem.quantity,
          estimatedCost: bomItem.estimatedCost,
          inStock,
          notes: bomItem.notes
        }
      });

      // Automatically add to Missing Stock if out of stock!
      if (!inStock) {
        await prisma.procurementItem.create({
          data: {
            ticketComponentId: component.id,
            workOrderId: workOrder.id,
            itemName: bomItem.itemName,
            partNumber: bomItem.partNumber || null,
            quantityNeeded: bomItem.quantity,
            estimatedCost: bomItem.estimatedCost,
            status: "Needed",
            supplier: inventoryMatch?.supplier || "Preferred Vendor"
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      workOrderId: workOrder.id,
      ticketNumber,
      data: parsed
    });
  } catch (error: any) {
    console.error("Intake processing failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`;
