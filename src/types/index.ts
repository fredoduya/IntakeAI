export type JobType = 'Repair' | 'Network Setup' | 'Upgrade' | 'New Build' | 'General Inquiry';
export type PriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TicketStatus = 'New Intake' | 'Triage & Diagnosis' | 'Waiting on Parts' | 'In Progress / Bench' | 'Testing & QA' | 'Ready for Pickup' | 'Completed';

export interface ActionItem {
  id: string;
  step: string;
  category: 'diagnostic' | 'hardware' | 'configuration' | 'bench_test';
  estimatedMinutes?: number;
  completed: boolean;
}

export interface BOMItem {
  id: string;
  itemName: string;
  partNumber?: string;
  category: string;
  estimatedCost: number;
  quantity: number;
  inStock: boolean;
  stockAvailable?: number;
  notes?: string;
}

export interface ClientInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  preferredContact: 'WhatsApp' | 'Phone' | 'Email' | 'Walk-In';
}

export interface AttachedMediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  mimeType: string;
  dataUrl: string;
  sizeStr?: string;
  description?: string;
}

export interface WorkOrderTicket {
  id: string;
  ticketNumber: string;
  createdAt: string;
  updatedAt: string;
  client: ClientInfo;
  jobType: JobType;
  priority: PriorityLevel;
  status: TicketStatus;
  rawInput: string;
  inputModality: 'text' | 'audio' | 'mixed';
  transcribedAudioText?: string;
  attachedMedia?: AttachedMediaItem[];
  
  // AI Extracted Reasoning
  laymanProblemSummary: string;
  technicalDiagnosisOrSpec: string;
  rootCauseAnalysis?: string;
  suggestedActionItems: ActionItem[];
  billOfMaterials: BOMItem[];
  clientFacingExplanation: string;
  
  // Time and Financial estimates
  estimatedLaborHours: number;
  laborRatePerHour: number;
  totalEstimatedCost: number;
  internalNotes?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitCost: number;
  retailPrice: number;
  stockQuantity: number;
  minThreshold: number;
  supplier: string;
  leadTimeDays: number;
  location: string;
}

export interface MissingStockItem {
  id: string;
  ticketId: string;
  ticketNumber: string;
  clientName: string;
  itemName: string;
  partNumber?: string;
  category: string;
  quantityNeeded: number;
  estimatedCost: number;
  status: 'Needed' | 'Ordered' | 'Received';
  orderDate?: string;
  expectedDate?: string;
  supplier?: string;
}
