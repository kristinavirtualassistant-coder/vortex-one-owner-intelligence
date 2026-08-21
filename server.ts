import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import Papa from 'papaparse';
import { pool, query } from './src/db/client.js';
import { propertyRepository } from './src/repositories/propertyRepository.js';
import { ownerRepository } from './src/repositories/ownerRepository.js';
import { researchRepository } from './src/repositories/researchRepository.js';
import { savedPropertyRepository } from './src/repositories/savedPropertyRepository.js';
import { propertySearchService } from './src/services/propertySearchService.js';
import { portfolioService } from './src/services/portfolioService.js';
import { sourceVerifier } from './src/services/sourceVerifier.js';

let __filename = '';
let __dirname = process.cwd();
try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  }
} catch {
  // fallback to process.cwd()
}

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'connected';
  try {
    await query('SELECT 1');
  } catch (err) {
    dbStatus = 'disconnected';
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    app: 'Vortex One Owner Intelligence Platform',
    version: '4.2.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Autocomplete Suggestions (Database-backed GIN / Trigram Index)
app.get('/api/suggestions', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.json([]);
  }

  try {
    const results = await propertyRepository.getAutocompleteSuggestions(q);
    const suggestions = results.map((r) => ({
      type: 'property',
      display: `${r.formatted_address}, ${r.city}, CA`,
      apn: r.apn,
      searchKey: r.apn || r.formatted_address,
    }));
    res.json(suggestions);
  } catch (err: any) {
    console.error('Suggestions error:', err);
    res.json([]);
  }
});

// Property Search Endpoint (Database source of truth, no synthetic random fallback)
app.get('/api/search', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Search query parameter "q" is required.' });
  }

  try {
    const payload = await propertySearchService.search(q);
    if (!payload) {
      return res.status(404).json({
        error: 'Property not found or unverified in public records database.',
        code: 'PROPERTY_UNVERIFIED',
        query: q,
      });
    }
    res.json(payload);
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message || 'Search execution failed.' });
  }
});

// Bulk Area Search Endpoint
app.get('/api/bulk-search', async (req: Request, res: Response) => {
  const city = String(req.query.city || '').trim();
  const useCode = String(req.query.useCode || '').trim();
  const minVal = Number(req.query.minVal || 0);
  const maxVal = Number(req.query.maxVal || 999999999);
  const sortBy = String(req.query.sortBy || 'value_desc');
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 50), 1), 500);
  const offset = (page - 1) * pageSize;

  try {
    const rows = await propertyRepository.bulkSearch({
      city,
      useCode,
      minVal,
      maxVal,
      sortBy,
      limit: pageSize,
      offset,
    });

    const detailedResults = rows.map((row) => ({
      id: row.id,
      propertyKey: row.property_key,
      formattedAddress: row.formatted_address,
      streetNumber: row.street_number || '',
      streetName: row.street_name || '',
      unit: row.unit || '',
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      sourceName: 'Orange County Assessor & Public GIS REST Portal',
      sourceJurisdiction: 'Orange County, CA',
      sourceUrl: 'https://gis.ocgov.com/',
      retrievedAt: row.retrieved_at,
      saved: !!row.saved_at,
      savedNote: row.saved_note || '',
      parcel: {
        id: `parcel-${row.apn}`,
        apn: row.apn,
        canonicalApn: row.canonical_apn,
        rawApn: row.raw_apn,
        apnFormat: 'OC_8_DIGIT',
        propertyId: row.id,
        fipsCountyCode: '06059',
        landAssessedValue: Number(row.land_assessed_value),
        improvementAssessedValue: Number(row.improvement_assessed_value),
        totalAssessedValue: Number(row.total_assessed_value),
        useCode: row.use_code,
        yearBuilt: row.year_built,
        units: row.units,
        bedrooms: row.bedrooms,
        rollYear: 2026,
      },
      owner: {
        id: row.owner_id || 'owner-unknown',
        fullName: row.owner_name || 'UNKNOWN OWNER',
        normalizedName: row.owner_name || 'UNKNOWN OWNER',
        ownerType: row.owner_type || 'INDIVIDUAL',
        mailingAddress: row.mailing_address || '',
        isOwnerOccupied: row.mailing_address === row.formatted_address,
      },
      totalVal: Number(row.total_assessed_value),
      useCode: row.use_code,
      yearBuilt: row.year_built,
      units: row.units,
      leadScore: 75,
      isAbsentee: row.mailing_address !== row.formatted_address,
    }));

    res.json({
      count: detailedResults.length,
      page,
      pageSize,
      properties: detailedResults,
    });
  } catch (err: any) {
    console.error('Bulk search error:', err);
    res.status(500).json({ error: err.message || 'Bulk search failed' });
  }
});

// Batch CSV Enrichment Endpoint using PapaParse
app.post('/api/batch-enrich', async (req: Request, res: Response) => {
  const { csvText } = req.body;

  if (!csvText || typeof csvText !== 'string') {
    return res.status(400).json({ error: 'CSV text body required.' });
  }

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data as any[];

  if (!rows || rows.length === 0) {
    return res.status(400).json({ error: 'CSV contains no valid data rows.' });
  }

  const outputRows = [
    'input_address,matched_address,apn,canonical_apn,owner_name,owner_type,pierced_officer,primary_phone,primary_email,lead_score,provenance_hash,enrichment_status'
  ];

  for (const row of rows) {
    const inputAddr = row.address || row.Address || Object.values(row)[0] || '';
    if (!inputAddr) continue;

    try {
      const result = await propertySearchService.search(String(inputAddr));
      if (result) {
        outputRows.push(
          `"${inputAddr}","${result.property.formattedAddress}","${result.parcel.apn}","${result.parcel.canonicalApn}","${result.owner.fullName}","${result.owner.ownerType}","${result.owner.corporateOfficer || ''}","","${result.portfolio?.leadScore || 50}","UNVERIFIED"`
        );
      } else {
        outputRows.push(`"${inputAddr}","","","","","","","","","","","UNVERIFIED"`);
      }
    } catch {
      outputRows.push(`"${inputAddr}","","","","","","","","","","","ERROR"`);
    }
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="enriched_leads_vortex_one.csv"');
  res.send(outputRows.join('\n'));
});

// Portfolios Dashboard API
app.get('/api/portfolios', async (req: Request, res: Response) => {
  try {
    const portfolios = await portfolioService.getAllPortfolios();
    res.json({ count: portfolios.length, portfolios });
  } catch (err: any) {
    console.error('Portfolios error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch portfolios' });
  }
});

// Research Tasks Queue
app.get('/api/research-tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await researchRepository.findAll();
    res.json({ count: tasks.length, tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch research tasks' });
  }
});

app.post('/api/research-tasks/:id/complete', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const updated = await researchRepository.completeTask(id);
    if (updated) {
      return res.json({ success: true, task: updated });
    }
    res.status(404).json({ error: 'Task not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to complete task' });
  }
});

// Saved Properties API (Database-backed)
app.get('/api/saved', async (req: Request, res: Response) => {
  try {
    const saved = await savedPropertyRepository.getAll();
    const results = saved.map((row) => ({
      id: row.id,
      propertyKey: row.property_key,
      formattedAddress: row.formatted_address,
      streetNumber: row.street_number || '',
      streetName: row.street_name || '',
      unit: row.unit || '',
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      sourceName: row.source_name || 'Orange County Assessor',
      sourceJurisdiction: 'Orange County, CA',
      sourceUrl: row.source_url || '',
      retrievedAt: row.retrieved_at,
      saved: true,
      savedNote: row.note || '',
      savedAt: row.saved_at,
    }));

    res.json({ count: results.length, results });
  } catch (err: any) {
    console.error('Saved properties error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch saved properties' });
  }
});

app.post('/api/saved', async (req: Request, res: Response) => {
  const { propertyKey, note } = req.body;
  if (!propertyKey) {
    return res.status(400).json({ error: 'propertyKey is required' });
  }

  try {
    const cleanKey = propertyKey.replace(/^oc:/, '');
    const propRes = await query(`SELECT id FROM properties WHERE property_key = $1 OR property_key = $2 OR id IN (SELECT property_id FROM parcels WHERE apn = $3)`, [propertyKey, `oc:${cleanKey}`, cleanKey]);
    if (propRes.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found in database to save.' });
    }
    const propertyId = propRes.rows[0].id;
    await savedPropertyRepository.save(propertyId, note || '');
    res.json({ success: true, propertyKey, note });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save property' });
  }
});

app.delete('/api/saved/:key', async (req: Request, res: Response) => {
  const key = req.params.key;
  try {
    const deleted = await savedPropertyRepository.remove(key);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete saved property' });
  }
});

// GIS Audit API (58 California counties)
app.get('/api/gis-audit', async (req: Request, res: Response) => {
  try {
    const audit = await sourceVerifier.getGisAudit();
    res.json(audit);
  } catch (err: any) {
    console.error('GIS audit error:', err);
    res.status(500).json({ error: err.message || 'GIS audit failed' });
  }
});

// AI Chat Endpoint
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

app.post('/api/ai-chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    const ai = getGenAI();

    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: 'You are Vortex One AI, an expert real estate, public records, tax assessor, and property intelligence advisor specializing in Orange County and California public records. Distinguish strictly between FACT, INFERENCE, UNVERIFIED, and CONFLICT. Never invent missing property facts.',
        tools: [{ googleSearch: {} }],
      }
    });

    res.json({
      reply: response.text || 'I am ready to assist with your property intelligence analysis.',
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null
    });
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ error: err.message || 'AI Chat failed' });
  }
});

// Start Express Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vortex One Owner Intelligence server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
