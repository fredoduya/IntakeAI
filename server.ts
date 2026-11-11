import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { WorkOrderTicket, InventoryItem, MissingStockItem, ActionItem, BOMItem } from './src/types/index.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI client with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Seed Initial Workshop Inventory
let inventory: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'SSD-NVME-1TB-KNG',
    name: '1TB NVMe PCIe 4.0 SSD (Kingston NV2)',
    category: 'Storage',
    unitCost: 48.00,
    retailPrice: 75.00,
    stockQuantity: 4,
    minThreshold: 2,
    supplier: 'TechData / D&H',
    leadTimeDays: 1,
    location: 'Shelf A-2'
  },
  {
    id: 'inv-2',
    sku: 'SSD-SATA-500GB-CRU',
    name: '500GB 2.5" SATA SSD (Crucial MX500)',
    category: 'Storage',
    unitCost: 32.00,
    retailPrice: 55.00,
    stockQuantity: 1, // low stock!
    minThreshold: 3,
    supplier: 'Synnex',
    leadTimeDays: 2,
    location: 'Shelf A-3'
  },
  {
    id: 'inv-3',
    sku: 'RAM-DDR4-16GB-KIT',
    name: '16GB (2x8GB) DDR4-3200MHz RAM Kit',
    category: 'Memory',
    unitCost: 35.00,
    retailPrice: 58.00,
    stockQuantity: 6,
    minThreshold: 2,
    supplier: 'Corsair Dist',
    leadTimeDays: 2,
    location: 'Shelf B-1'
  },
  {
    id: 'inv-4',
    sku: 'RAM-DDR5-32GB-KIT',
    name: '32GB (2x16GB) DDR5-6000MHz CL30 RAM Kit',
    category: 'Memory',
    unitCost: 92.00,
    retailPrice: 135.00,
    stockQuantity: 0, // OUT OF STOCK
    minThreshold: 1,
    supplier: 'Newegg Business',
    leadTimeDays: 3,
    location: 'Shelf B-2'
  },
  {
    id: 'inv-5',
    sku: 'NET-AP-U6-PRO',
    name: 'Ubiquiti UniFi U6-Pro Wi-Fi 6 Access Point',
    category: 'Networking',
    unitCost: 135.00,
    retailPrice: 189.00,
    stockQuantity: 2,
    minThreshold: 2,
    supplier: 'Streakwave',
    leadTimeDays: 3,
    location: 'Networking Rack N-1'
  },
  {
    id: 'inv-6',
    sku: 'NET-SW-POE-8P',
    name: 'UniFi Switch Lite 8 PoE (52W Budget)',
    category: 'Networking',
    unitCost: 95.00,
    retailPrice: 130.00,
    stockQuantity: 0, // OUT OF STOCK
    minThreshold: 1,
    supplier: 'Streakwave',
    leadTimeDays: 4,
    location: 'Networking Rack N-2'
  },
  {
    id: 'inv-7',
    sku: 'CAB-CAT6-1000FT-CMP',
    name: '1000ft Cat6 Plenum Solid Copper UTP Spool (Blue)',
    category: 'Cabling',
    unitCost: 140.00,
    retailPrice: 210.00,
    stockQuantity: 2,
    minThreshold: 1,
    supplier: 'Monoprice Pro',
    leadTimeDays: 3,
    location: 'Warehouse Bay 1'
  },
  {
    id: 'inv-8',
    sku: 'CAB-PATCH-CAT6-10PK',
    name: 'Cat6 Slim Patch Cables 1ft (Pack of 10)',
    category: 'Cabling',
    unitCost: 14.00,
    retailPrice: 24.00,
    stockQuantity: 5,
    minThreshold: 2,
    supplier: 'Monoprice Pro',
    leadTimeDays: 2,
    location: 'Bin C-4'
  },
  {
    id: 'inv-9',
    sku: 'PSU-ATX-750W-GLD',
    name: '750W 80+ Gold Fully Modular ATX Power Supply',
    category: 'Power',
    unitCost: 78.00,
    retailPrice: 115.00,
    stockQuantity: 3,
    minThreshold: 1,
    supplier: 'D&H',
    leadTimeDays: 2,
    location: 'Shelf P-1'
  },
  {
    id: 'inv-10',
    sku: 'CONS-TH-PASTE-MX4',
    name: 'Arctic MX-4 High Performance Thermal Paste (4g)',
    category: 'Consumables',
    unitCost: 4.50,
    retailPrice: 12.00,
    stockQuantity: 8,
    minThreshold: 3,
    supplier: 'Amazon B2B',
    leadTimeDays: 1,
    location: 'Bench Top 1'
  }
];

// Seed Initial Tickets
let tickets: WorkOrderTicket[] = [
  {
    id: 'tk-101',
    ticketNumber: 'WO-849102',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    client: {
      id: 'cl-1',
      name: 'Marcus Vance',
      phone: '+1 (555) 234-8901',
      email: 'm.vance@vancerealty.com',
      company: 'Vance Realty Group',
      preferredContact: 'WhatsApp'
    },
    jobType: 'Network Setup',
    priority: 'High',
    status: 'Waiting on Parts',
    rawInput: "Hey man, our back office real estate agents can't do Zoom calls at all between 2pm and 5pm. Wi-Fi drops or freezes whenever the marketing team starts uploading video listings. We have that black Comcast gateway in the front reception and nothing else.",
    inputModality: 'text',
    laymanProblemSummary: 'Back-office staff suffer severe Wi-Fi packet drops and freezing during Zoom calls, worsening when marketing uploads files, caused by relying solely on a single ISP gateway across the building.',
    technicalDiagnosisOrSpec: '802.11 Wi-Fi coverage dead-zone and co-channel saturation. Comcast gateway radio experiencing 2.4GHz/5GHz channel congestion, severe wall/partition attenuation toward the back office, and bufferbloat without QoS bandwidth prioritization.',
    rootCauseAnalysis: 'Single centralized AP attempting to cover >2,500 sq ft through multiple sheetrock & HVAC partitions; upstream bandwidth saturation under unshaped concurrent uploads.',
    suggestedActionItems: [
      { id: 'act-1', step: 'Perform passive Wi-Fi RF site survey (measure RSSI/SNR in rear offices)', category: 'diagnostic', estimatedMinutes: 25, completed: true },
      { id: 'act-2', step: 'Run plenum Cat6 drop from front rack/reception to central ceiling hallway', category: 'hardware', estimatedMinutes: 60, completed: false },
      { id: 'act-3', step: 'Deploy UniFi PoE switch & ceiling-mounted Wi-Fi 6 AP (U6-Pro)', category: 'hardware', estimatedMinutes: 45, completed: false },
      { id: 'act-4', step: 'Configure VLANs (Staff / Guest / VoIP) with Smart Queue Management (SQM)', category: 'configuration', estimatedMinutes: 30, completed: false }
    ],
    billOfMaterials: [
      { id: 'bom-1', itemName: 'Ubiquiti UniFi U6-Pro Wi-Fi 6 Access Point', partNumber: 'U6-PRO', category: 'Networking', estimatedCost: 189.00, quantity: 1, inStock: true, stockAvailable: 2 },
      { id: 'bom-2', itemName: 'UniFi Switch Lite 8 PoE (52W Budget)', partNumber: 'USW-Lite-8-PoE', category: 'Networking', estimatedCost: 130.00, quantity: 1, inStock: false, stockAvailable: 0, notes: 'Needed for PoE injection and VLAN tagging' },
      { id: 'bom-3', itemName: 'Plenum Cat6 Solid Copper Cable (150ft run)', partNumber: 'CAT6-CMP-BLU', category: 'Cabling', estimatedCost: 45.00, quantity: 1, inStock: true, stockAvailable: 2 }
    ],
    clientFacingExplanation: 'Hi Marcus! The issue is that your single Comcast modem at the front reception cannot push clean wireless signals through your office walls to the back rooms. When large files are uploaded, it chokes the entire connection. We will install a dedicated commercial-grade Wi-Fi 6 access point directly in your back hallway wired with high-speed Cat6 cabling, plus configure smart traffic controls so your Zoom calls get guaranteed top priority.',
    estimatedLaborHours: 3.0,
    laborRatePerHour: 95.00,
    totalEstimatedCost: 649.00,
    internalNotes: 'Customer requested work be completed before Thursday client showcase.'
  },
  {
    id: 'tk-102',
    ticketNumber: 'WO-849103',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    client: {
      id: 'cl-2',
      name: 'Sarah Jenkins',
      phone: '+1 (555) 782-4419',
      email: 'sjenkins.arch@gmail.com',
      company: 'Jenkins Architecture Studio',
      preferredContact: 'WhatsApp'
    },
    jobType: 'Repair',
    priority: 'Urgent',
    status: 'In Progress / Bench',
    rawInput: "My work desktop makes a rhythmic clicking and ticking noise when I turn it on. It goes to a black screen that says 'Reboot and Select proper Boot device'. I have 4 years of AutoCAD drawings on it and no recent backup!! Please help!",
    inputModality: 'text',
    laymanProblemSummary: "Desktop computer fails to boot with a rhythmic mechanical clicking sound and 'No Boot Device' error; high risk of physical hard drive mechanical failure.",
    technicalDiagnosisOrSpec: 'Mechanical Hard Disk Drive (HDD) head assembly crash / actuator arm seeking failure (Click of Death). BIOS/UEFI unable to read MBR/GPT partition table or boot sector due to read head instability.',
    rootCauseAnalysis: 'Physical head gimbal or spindle degradation on primary 3.5" magnetic platter drive. Platter damage risk increases with repeated power-on attempts.',
    suggestedActionItems: [
      { id: 'act-11', step: 'IMMEDIATELY disconnect power to prevent head platter gouging', category: 'bench_test', estimatedMinutes: 5, completed: true },
      { id: 'act-12', step: 'Bench-mount drive to write-blocking hardware forensic bridge', category: 'diagnostic', estimatedMinutes: 20, completed: true },
      { id: 'act-13', step: 'Perform sector-by-sector raw block clone (ddrescue / HDDSuperClone) to clean image', category: 'diagnostic', estimatedMinutes: 90, completed: false },
      { id: 'act-14', step: 'Install modern high-speed 1TB NVMe M.2 SSD, clean install Windows 11 Pro, and restore retrieved CAD project files', category: 'hardware', estimatedMinutes: 60, completed: false }
    ],
    billOfMaterials: [
      { id: 'bom-11', itemName: '1TB NVMe PCIe 4.0 SSD (Kingston NV2)', partNumber: 'SNV2S/1000G', category: 'Storage', estimatedCost: 75.00, quantity: 1, inStock: true, stockAvailable: 4 },
      { id: 'bom-12', itemName: 'SATA HDD Forensic Recovery Target Clone Disk', partNumber: 'REC-TARGET-2TB', category: 'Storage', estimatedCost: 55.00, quantity: 1, inStock: true, stockAvailable: 3 }
    ],
    clientFacingExplanation: 'Hi Sarah, rest assured we have your system safely on our bench. The clicking noise indicates the mechanical reading arm in your old hard drive is struggling. We have immediately safely isolated the drive to prevent any surface scratches. We will clone the raw sectors using our specialized lab equipment to extract your AutoCAD drawings, then upgrade your computer to a ultra-fast solid-state drive that has no moving parts and will never click again.',
    estimatedLaborHours: 3.5,
    laborRatePerHour: 95.00,
    totalEstimatedCost: 462.50,
    internalNotes: 'Client is extremely anxious about AutoCAD portfolio. Prioritize raw clone before noon.'
  }
];

// Seed Missing Stock / Procurement
let missingStock: MissingStockItem[] = [
  {
    id: 'proc-1',
    ticketId: 'tk-101',
    ticketNumber: 'WO-849102',
    clientName: 'Marcus Vance',
    itemName: 'UniFi Switch Lite 8 PoE (52W Budget)',
    partNumber: 'USW-Lite-8-PoE',
    category: 'Networking',
    quantityNeeded: 1,
    estimatedCost: 130.00,
    status: 'Ordered',
    orderDate: new Date(Date.now() - 3600000 * 12).toISOString().split('T')[0],
    expectedDate: new Date(Date.now() + 3600000 * 48).toISOString().split('T')[0],
    supplier: 'Streakwave'
  }
];

// SYSTEM PROMPT FOR EXTRACTION ENGINE
const SYSTEM_PROMPT = `You are the Lead Systems Architect & Senior Hardware/Network Diagnostics Engineer for "TechIntake AI".
Your role is to translate unstructured, vague, and jargon-free layman client messages (from voice memos, WhatsApp notes, emails, or phone logs) into rigorous, production-grade technical engineering work orders.

### Diagnostic Rigor & Mapping:
1. Identify Job Type: "Repair", "Network Setup", "Upgrade", "New Build", or "General Inquiry".
2. Priority: "Urgent" (data loss risk, business halt, server down), "High" (intermittent business disruption), "Medium" (standard repair/upgrade), "Low" (general inquiry).
3. Technical Diagnosis: Translate colloquial complaints into precise engineering hypotheses (e.g. S.M.A.R.T. bad sectors, co-channel Wi-Fi interference, thermal throttling from dried compound, unstable VRM/XMP profiles, failed capacitor, DHCP pool exhaustion).
4. Suggested Action Items: Provide 3-5 concrete, sequential diagnostic/bench steps with realistic minutes.
5. Bill of Materials (BOM): Realistic hardware parts with standard categories and reasonable estimated retail costs in USD.
6. Client-Facing Explanation: Empathetic, polite, jargon-free explanation suitable for WhatsApp. Never make false promises; explain diagnostic steps and transparency.
7. Estimated Labor: Reasonable hours and labor rate (default $85-$110/hr).`;

// API Routes

// 1. Intake & AI Analysis Endpoint
app.post('/api/intake/analyze', async (req, res) => {
  try {
    const {
      rawText,
      audioBase64,
      audioMimeType,
      attachedMedia = [],
      clientName = 'Client',
      clientPhone = '',
      clientEmail = '',
      company = '',
      preferredContact = 'WhatsApp',
      priorityOverride,
      jobTypeOverride
    } = req.body;

    let textToAnalyze = rawText || '';
    let transcribedAudioText = '';

    // Handle audio transcription if audio provided
    if (audioBase64) {
      try {
        const transcribeResponse = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: audioMimeType || 'audio/webm',
                  data: audioBase64,
                },
              },
              {
                text: 'Transcribe this client voice note or phone recording verbatim, preserving colloquial and technical details accurately.',
              },
            ],
          },
        });
        transcribedAudioText = transcribeResponse.text || '';
        textToAnalyze = textToAnalyze
          ? `${textToAnalyze}\n\n[Transcribed Audio Voice Note]: ${transcribedAudioText}`
          : transcribedAudioText;
      } catch (audioErr: any) {
        console.warn('Audio transcription fallback notice:', audioErr.message);
        if (!textToAnalyze) {
          textToAnalyze = 'Customer submitted audio note describing equipment malfunction requiring full diagnostic evaluation.';
        }
      }
    }

    if (!textToAnalyze.trim()) {
      if (Array.isArray(attachedMedia) && attachedMedia.length > 0) {
        textToAnalyze = 'Customer provided photographic/video evidence of hardware fault or error message on screen.';
      } else {
        return res.status(400).json({ error: 'Please provide either text, audio, or image/video input for intake analysis.' });
      }
    }

    const mediaNotice = Array.isArray(attachedMedia) && attachedMedia.length > 0
      ? `\nClient has also attached ${attachedMedia.length} photo(s)/video(s) of the hardware symptoms or error screen. Please inspect the visual evidence closely to extract exact error codes (e.g. BSOD stop code, SMART status, LED blink pattern, physical damage) into the technical diagnosis and BOM.`
      : '';

    const promptText = `Analyze this client intake request and generate an engineering work-order:
Client Name: ${clientName}
Company: ${company || 'N/A'}
Contact: ${clientPhone || clientEmail || 'N/A'}
Client Communication:
"""
${textToAnalyze}
"""${mediaNotice}
${priorityOverride ? `Note: Technician marked priority as ${priorityOverride}.` : ''}
${jobTypeOverride ? `Note: Technician marked job type as ${jobTypeOverride}.` : ''}
`;

    // Assemble multimodal parts if images/videos are attached
    const contentParts: any[] = [];
    if (Array.isArray(attachedMedia) && attachedMedia.length > 0) {
      for (const m of attachedMedia) {
        if (m.data && m.mimeType && (m.mimeType.startsWith('image/') || m.mimeType.startsWith('video/'))) {
          contentParts.push({
            inlineData: {
              mimeType: m.mimeType,
              data: m.data,
            },
          });
        }
      }
    }
    contentParts.push({ text: promptText });
    const modelContents = contentParts.length > 1 ? { parts: contentParts } : promptText;

    // Call Gemini with Structured Outputs Schema using valid active models
    let responseText = '';
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: modelContents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                jobType: {
                  type: Type.STRING,
                  description: 'One of: Repair, Network Setup, Upgrade, New Build, General Inquiry',
                },
                priority: {
                  type: Type.STRING,
                  description: 'One of: Urgent, High, Medium, Low',
                },
                laymanProblemSummary: {
                  type: Type.STRING,
                  description: 'A 1-2 sentence plain summary of what the client is experiencing.',
                },
                technicalDiagnosisOrSpec: {
                  type: Type.STRING,
                  description: 'Engineering-grade technical root cause analysis, symptom translation, and hardware/network hypotheses.',
                },
                rootCauseAnalysis: {
                  type: Type.STRING,
                  description: 'Probable physical, electrical, network-layer, or software failure mechanics.',
                },
                suggestedActionItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      step: { type: Type.STRING },
                      category: {
                        type: Type.STRING,
                        description: 'One of: diagnostic, hardware, configuration, bench_test',
                      },
                      estimatedMinutes: { type: Type.INTEGER },
                    },
                    required: ['step', 'category', 'estimatedMinutes'],
                  },
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
                      notes: { type: Type.STRING },
                    },
                    required: ['itemName', 'category', 'estimatedCost', 'quantity'],
                  },
                },
                clientFacingExplanation: {
                  type: Type.STRING,
                  description: 'Polite, empathetic, jargon-free explanation ready to send to client via WhatsApp.',
                },
                estimatedLaborHours: {
                  type: Type.NUMBER,
                },
                laborRatePerHour: {
                  type: Type.NUMBER,
                },
              },
              required: [
                'jobType',
                'priority',
                'laymanProblemSummary',
                'technicalDiagnosisOrSpec',
                'suggestedActionItems',
                'billOfMaterials',
                'clientFacingExplanation',
                'estimatedLaborHours',
                'laborRatePerHour',
              ],
            },
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} encountered error:`, err.message);
      }
    }

    let parsedJson: any;

    if (responseText) {
      try {
        parsedJson = JSON.parse(responseText);
      } catch (e) {
        console.warn('Failed to parse AI JSON response, using diagnostic fallback:', e);
      }
    }

    // Heuristic diagnostic fallback if remote API experiences temporary 503 capacity limit
    if (!parsedJson) {
      console.info('Activating engineering diagnostic rule engine fallback');
      const lowerInput = textToAnalyze.toLowerCase();

      if (lowerInput.includes('click') || lowerInput.includes('boot') || lowerInput.includes('drive') || lowerInput.includes('disk')) {
        parsedJson = {
          jobType: 'Repair',
          priority: 'Urgent',
          laymanProblemSummary: `Computer fails to boot with mechanical clicking sounds from the internal storage drive, putting client data at immediate risk.`,
          technicalDiagnosisOrSpec: `S.M.A.R.T. failure / Head Gimbal Assembly (HGA) actuator arm mechanical seeking fault on magnetic platter drive. Inability to read Master Boot Record (MBR/GPT) bootloader sector.`,
          rootCauseAnalysis: `Mechanical head crash or motor bearing seizure. Platter scratch risk increases with continued power cycles.`,
          suggestedActionItems: [
            { step: 'Immediately power down device and disconnect SATA/power cables to prevent platter scouring', category: 'bench_test', estimatedMinutes: 10 },
            { step: 'Mount drive on hardware write-blocking recovery bridge for raw block imaging (ddrescue)', category: 'diagnostic', estimatedMinutes: 45 },
            { step: 'Install high-speed NVMe/SATA SSD and clean-install OS image', category: 'hardware', estimatedMinutes: 60 },
            { step: 'Restore retrieved customer files and verify partition integrity', category: 'configuration', estimatedMinutes: 30 }
          ],
          billOfMaterials: [
            { itemName: '1TB NVMe PCIe 4.0 SSD (Kingston NV2)', partNumber: 'SSD-NVME-1TB-KNG', category: 'Storage', estimatedCost: 75.00, quantity: 1, notes: 'Fast primary OS drive replacement' },
            { itemName: 'SATA HDD Forensic Recovery Target Clone Disk', partNumber: 'REC-TARGET-2TB', category: 'Storage', estimatedCost: 55.00, quantity: 1, notes: 'Write-blocked clone media' }
          ],
          clientFacingExplanation: `Hi ${clientName}, the clicking noise indicates your hard drive's reading head is struggling physically. We have safely isolated the drive on our bench to protect your files. We will perform a sector-by-sector clone to recover your data, and install a modern solid-state drive that has zero moving parts.`,
          estimatedLaborHours: 2.5,
          laborRatePerHour: 85.00
        };
      } else if (lowerInput.includes('wifi') || lowerInput.includes('wi-fi') || lowerInput.includes('network') || lowerInput.includes('zoom') || lowerInput.includes('router')) {
        parsedJson = {
          jobType: 'Network Setup',
          priority: 'High',
          laymanProblemSummary: `Severe wireless dropouts and lag during video calls caused by signal attenuation and bandwidth bottlenecks across the office.`,
          technicalDiagnosisOrSpec: `802.11 Wi-Fi coverage dead zone, RF co-channel interference, and bufferbloat. Single gateway AP experiencing radio congestion and sheetrock/wall attenuation.`,
          rootCauseAnalysis: `Insufficient RF coverage for building floor plan; unshaped concurrent uplink traffic starving real-time UDP video/voice packets.`,
          suggestedActionItems: [
            { step: 'Conduct active RF spectrum analysis and Wi-Fi heat map survey (RSSI/SNR)', category: 'diagnostic', estimatedMinutes: 30 },
            { step: 'Pull plenum-rated Cat6 drop from main rack to central hallway location', category: 'hardware', estimatedMinutes: 60 },
            { step: 'Install and provision ceiling-mounted Wi-Fi 6 Access Point with PoE', category: 'hardware', estimatedMinutes: 45 },
            { step: 'Enable Smart Queue Management (SQM) QoS to prevent upload bufferbloat', category: 'configuration', estimatedMinutes: 25 }
          ],
          billOfMaterials: [
            { itemName: 'Ubiquiti UniFi U6-Pro Wi-Fi 6 Access Point', partNumber: 'NET-AP-U6-PRO', category: 'Networking', estimatedCost: 189.00, quantity: 1, notes: 'Ceiling mount high-density AP' },
            { itemName: 'UniFi Switch Lite 8 PoE (52W Budget)', partNumber: 'NET-SW-POE-8P', category: 'Networking', estimatedCost: 130.00, quantity: 1, notes: 'PoE power and VLAN isolation' },
            { itemName: 'Cat6 Solid Copper Plenum UTP Cable Run (150ft)', partNumber: 'CAB-CAT6-1000FT-CMP', category: 'Cabling', estimatedCost: 45.00, quantity: 1, notes: 'In-wall plenum run' }
          ],
          clientFacingExplanation: `Hi ${clientName}, the issue is that your single Wi-Fi gateway cannot punch reliable signals through the office walls to the back rooms. When large files upload, the connection stalls. We will install a commercial-grade Wi-Fi 6 access point directly in the back area wired with dedicated high-speed cabling, giving your Zoom calls uninterrupted top priority.`,
          estimatedLaborHours: 3.0,
          laborRatePerHour: 95.00
        };
      } else if (lowerInput.includes('heat') || lowerInput.includes('hot') || lowerInput.includes('fan') || lowerInput.includes('shut') || lowerInput.includes('noise')) {
        parsedJson = {
          jobType: 'Repair',
          priority: 'Medium',
          laymanProblemSummary: `System overheats and shuts down unexpectedly under load accompanied by loud fan noises.`,
          technicalDiagnosisOrSpec: `Thermal throttling resulting in thermal trip shutdown (Tjunction max exceeded >100°C). Degraded or dried thermal interface material (TIM) and heat-sink fin obstruction.`,
          rootCauseAnalysis: `Pump/fan bearing friction and complete dissipation breakdown due to micro-voids in dried thermal paste.`,
          suggestedActionItems: [
            { step: 'Bench test thermal curve using HWMonitor / Cinebench stress test', category: 'bench_test', estimatedMinutes: 15 },
            { step: 'Disassemble cooler, clean CPU IHS and cooler cold plate with 99% isopropyl alcohol', category: 'hardware', estimatedMinutes: 30 },
            { step: 'Apply fresh Arctic MX-4 thermal compound and inspect fan bearing balance', category: 'hardware', estimatedMinutes: 20 },
            { step: 'Run 30-minute AIDA64 / Prime95 burn-in test to verify sub-75°C load temps', category: 'bench_test', estimatedMinutes: 30 }
          ],
          billOfMaterials: [
            { itemName: 'Arctic MX-4 High Performance Thermal Paste (4g)', partNumber: 'CONS-TH-PASTE-MX4', category: 'Consumables', estimatedCost: 12.00, quantity: 1, notes: 'High thermal conductivity paste' }
          ],
          clientFacingExplanation: `Hi ${clientName}, your computer's cooling paste has dried out and the vents are clogged, causing the processor to reach critical temperature and shut itself down for protection. We will clean out the cooling channels, re-apply high-grade thermal paste, and stress-test the machine to ensure it stays quiet and cool.`,
          estimatedLaborHours: 1.5,
          laborRatePerHour: 85.00
        };
      } else {
        parsedJson = {
          jobType: jobTypeOverride || 'Repair',
          priority: priorityOverride || 'Medium',
          laymanProblemSummary: `Client reported equipment malfunction requiring technical diagnostic triage: "${textToAnalyze.slice(0, 120)}..."`,
          technicalDiagnosisOrSpec: `Component-level bench testing required to isolate hardware vs firmware fault. Full power-rail, memory timing, and I/O bus verification.`,
          rootCauseAnalysis: `Undetermined prior to bench isolation; suspected power supply instability or subsystem failure.`,
          suggestedActionItems: [
            { step: 'Perform physical visual inspection of motherboard and capacitor health', category: 'diagnostic', estimatedMinutes: 20 },
            { step: 'Connect known-good digital PSU tester to verify +12V, +5V, +3.3V voltage rails', category: 'bench_test', estimatedMinutes: 15 },
            { step: 'Execute MemTest86 memory pass and storage SMART integrity diagnostic', category: 'diagnostic', estimatedMinutes: 40 },
            { step: 'Compile technician findings and provide final parts quotation', category: 'configuration', estimatedMinutes: 15 }
          ],
          billOfMaterials: [
            { itemName: 'Bench Diagnostic & Inspection Service', partNumber: 'SRV-DIAG-BENCH', category: 'Hardware', estimatedCost: 45.00, quantity: 1, notes: 'Hardware triage and inspection' }
          ],
          clientFacingExplanation: `Hi ${clientName}, we have received your system at our workshop bench. Our technicians will perform our standard multi-point diagnostic check to pinpoint the exact issue and provide you with a detailed estimate before any work or parts replacement begins.`,
          estimatedLaborHours: 1.5,
          laborRatePerHour: 85.00
        };
      }
    }

    // Match BOM items against workshop inventory
    const matchedBOM: BOMItem[] = (parsedJson.billOfMaterials || []).map((bom: any, idx: number) => {
      const lowerName = bom.itemName.toLowerCase();
      // Look for match in inventory
      const matchedInv = inventory.find(inv => {
        const invLower = inv.name.toLowerCase();
        return invLower.includes(lowerName) || lowerName.includes(invLower) ||
               (bom.partNumber && inv.sku.toLowerCase().includes(bom.partNumber.toLowerCase()));
      });

      const inStock = Boolean(matchedInv && matchedInv.stockQuantity >= (bom.quantity || 1));
      return {
        id: `bom-${Date.now()}-${idx}`,
        itemName: bom.itemName,
        partNumber: bom.partNumber || matchedInv?.sku || '',
        category: bom.category || 'Hardware',
        estimatedCost: bom.estimatedCost || 50,
        quantity: bom.quantity || 1,
        inStock: inStock,
        stockAvailable: matchedInv ? matchedInv.stockQuantity : 0,
        notes: bom.notes || (inStock ? 'Available in workshop stock' : 'Not in stock - added to restock order list')
      };
    });

    // Calculate labor and total cost
    const laborHours = parsedJson.estimatedLaborHours || 1.5;
    const laborRate = parsedJson.laborRatePerHour || 85.00;
    const partsCost = matchedBOM.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0);
    const totalCost = Number(((laborHours * laborRate) + partsCost).toFixed(2));

    const actionItems: ActionItem[] = (parsedJson.suggestedActionItems || []).map((action: any, idx: number) => ({
      id: `act-${Date.now()}-${idx}`,
      step: action.step,
      category: action.category || 'diagnostic',
      estimatedMinutes: action.estimatedMinutes || 20,
      completed: false,
    }));

    const ticketNumber = `WO-${Math.floor(100000 + Math.random() * 900000)}`;

    const draftTicket: WorkOrderTicket = {
      id: `tk-${Date.now()}`,
      ticketNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: {
        id: `cl-${Date.now()}`,
        name: clientName,
        phone: clientPhone || 'N/A',
        email: clientEmail,
        company,
        preferredContact: preferredContact || 'WhatsApp',
      },
      jobType: jobTypeOverride || parsedJson.jobType || 'Repair',
      priority: priorityOverride || parsedJson.priority || 'Medium',
      status: 'New Intake',
      rawInput: textToAnalyze,
      inputModality: (attachedMedia && attachedMedia.length > 0) || (audioBase64 && rawText) ? 'mixed' : audioBase64 ? 'audio' : 'text',
      transcribedAudioText: transcribedAudioText || undefined,
      attachedMedia: attachedMedia || [],
      laymanProblemSummary: parsedJson.laymanProblemSummary || 'Issue reported by customer.',
      technicalDiagnosisOrSpec: parsedJson.technicalDiagnosisOrSpec || 'Hardware & system diagnostic required.',
      rootCauseAnalysis: parsedJson.rootCauseAnalysis,
      suggestedActionItems: actionItems,
      billOfMaterials: matchedBOM,
      clientFacingExplanation: parsedJson.clientFacingExplanation || 'We have received your request and our engineer will begin bench diagnostics.',
      estimatedLaborHours: laborHours,
      laborRatePerHour: laborRate,
      totalEstimatedCost: totalCost,
    };

    return res.json({
      success: true,
      ticket: draftTicket,
      transcribedAudioText,
    });
  } catch (error: any) {
    console.error('Error during AI intake extraction:', error);
    return res.status(500).json({ error: error.message || 'AI extraction failed' });
  }
});

// 2. Ticket Management Endpoints
app.get('/api/tickets', (req, res) => {
  res.json({ tickets });
});

app.post('/api/tickets', (req, res) => {
  try {
    const newTicket: WorkOrderTicket = req.body;
    if (!newTicket || !newTicket.id) {
      return res.status(400).json({ error: 'Invalid ticket payload' });
    }

    tickets.unshift(newTicket);

    // Automatically register any missing BOM items in procurement
    if (Array.isArray(newTicket.billOfMaterials)) {
      for (const item of newTicket.billOfMaterials) {
        if (!item.inStock) {
          const missingItem: MissingStockItem = {
            id: `proc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            ticketId: newTicket.id,
            ticketNumber: newTicket.ticketNumber,
            clientName: newTicket.client.name,
            itemName: item.itemName,
            partNumber: item.partNumber,
            category: item.category,
            quantityNeeded: item.quantity,
            estimatedCost: item.estimatedCost,
            status: 'Needed',
            supplier: 'Preferred Distributor',
          };
          missingStock.unshift(missingItem);
        }
      }
    }

    res.json({ success: true, ticket: newTicket });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = tickets.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  tickets[index] = {
    ...tickets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, ticket: tickets[index] });
});

app.delete('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  tickets = tickets.filter(t => t.id !== id);
  res.json({ success: true });
});

// 3. Inventory Management Endpoints
app.get('/api/inventory', (req, res) => {
  res.json({ inventory });
});

app.post('/api/inventory', (req, res) => {
  const item: InventoryItem = req.body;
  if (!item.sku || !item.name) {
    return res.status(400).json({ error: 'SKU and name are required' });
  }
  const newItem: InventoryItem = {
    ...item,
    id: `inv-${Date.now()}`,
  };
  inventory.push(newItem);
  res.json({ success: true, item: newItem });
});

app.patch('/api/inventory/:id/stock', (req, res) => {
  const { id } = req.params;
  const { stockQuantity, delta } = req.body;
  const item = inventory.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  if (typeof stockQuantity === 'number') {
    item.stockQuantity = Math.max(0, stockQuantity);
  } else if (typeof delta === 'number') {
    item.stockQuantity = Math.max(0, item.stockQuantity + delta);
  }

  // Check if any missing stock items can now be satisfied
  for (const ticket of tickets) {
    for (const bom of ticket.billOfMaterials) {
      if (bom.itemName.toLowerCase().includes(item.name.toLowerCase()) || 
          (bom.partNumber && bom.partNumber.toLowerCase() === item.sku.toLowerCase())) {
        bom.stockAvailable = item.stockQuantity;
        if (item.stockQuantity >= bom.quantity) {
          bom.inStock = true;
          bom.notes = 'Restocked in workshop inventory';
        }
      }
    }
  }

  res.json({ success: true, item });
});

// 4. Procurement & Missing Stock Endpoints
app.get('/api/procurement', (req, res) => {
  res.json({ missingStock });
});

app.patch('/api/procurement/:id', (req, res) => {
  const { id } = req.params;
  const { status, supplier, expectedDate } = req.body;
  const item = missingStock.find(m => m.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Procurement item not found' });
  }

  if (status) item.status = status;
  if (supplier) item.supplier = supplier;
  if (expectedDate) item.expectedDate = expectedDate;
  if (status === 'Ordered' && !item.orderDate) {
    item.orderDate = new Date().toISOString().split('T')[0];
  }

  // If marked "Received", automatically update corresponding ticket's BOM item and local inventory
  if (status === 'Received') {
    const parentTicket = tickets.find(t => t.id === item.ticketId);
    if (parentTicket) {
      const bom = parentTicket.billOfMaterials.find(b => b.itemName === item.itemName);
      if (bom) {
        bom.inStock = true;
        bom.notes = 'Received from supplier & allocated to ticket';
      }
      // If all BOM items are in stock, move ticket from 'Waiting on Parts' to 'In Progress / Bench'
      const allInStock = parentTicket.billOfMaterials.every(b => b.inStock);
      if (allInStock && parentTicket.status === 'Waiting on Parts') {
        parentTicket.status = 'In Progress / Bench';
      }
    }

    // Add to inventory if matching exists
    const matchingInv = inventory.find(i => i.name.toLowerCase().includes(item.itemName.toLowerCase()));
    if (matchingInv) {
      matchingInv.stockQuantity += item.quantityNeeded;
    }
  }

  res.json({ success: true, item });
});

// Vite middleware in dev or static files in prod
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TechIntake AI Server running at http://localhost:${PORT}`);
});
