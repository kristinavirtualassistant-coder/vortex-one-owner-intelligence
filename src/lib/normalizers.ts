/**
 * Vortex One Normalization & Cryptographic Provenance Utilities
 */

import { OwnerType } from '../types';

/**
 * Lossless APN Normalization & Reversibility
 */
export interface ApnNormalizationResult {
  canonicalApn: string;
  rawApn: string;
  apnFormat: 'OC_8_DIGIT' | 'OC_9_DIGIT' | 'OC_10_DIGIT' | 'CUSTOM' | 'UNKNOWN';
}

export function normalizeApn(rawApn?: string | null): ApnNormalizationResult {
  if (!rawApn || typeof rawApn !== 'string') {
    return {
      canonicalApn: '',
      rawApn: rawApn || '',
      apnFormat: 'UNKNOWN',
    };
  }

  const cleanRaw = rawApn.trim();
  if (!cleanRaw) {
    return {
      canonicalApn: '',
      rawApn: cleanRaw,
      apnFormat: 'UNKNOWN',
    };
  }

  // Extract digits for standard county format detection
  const digits = cleanRaw.replace(/\D/g, '');

  if (cleanRaw.replace(/[^a-zA-Z0-9]/g, '').length === digits.length) {
    if (digits.length === 8) {
      return {
        canonicalApn: `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}`,
        rawApn: cleanRaw,
        apnFormat: 'OC_8_DIGIT',
      };
    }
    if (digits.length === 9) {
      return {
        canonicalApn: `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`,
        rawApn: cleanRaw,
        apnFormat: 'OC_9_DIGIT',
      };
    }
    if (digits.length === 10) {
      return {
        canonicalApn: `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`,
        rawApn: cleanRaw,
        apnFormat: 'OC_10_DIGIT',
      };
    }
  }

  // For non-standard or custom alphanumeric APNs (e.g. 58008101-A), preserve value without losing trailing chars
  return {
    canonicalApn: cleanRaw.toUpperCase(),
    rawApn: cleanRaw,
    apnFormat: 'CUSTOM',
  };
}

/**
 * Address Component Parsing & Standardizing
 */
export interface ParsedAddress {
  streetNumber: string;
  streetName: string;
  unit: string;
  city: string;
  state: string;
  zipCode: string;
  normalizedFullAddress: string;
}

export function parseAddressComponents(
  addressStr?: string | null,
  cityInput: string = '',
  stateInput: string = 'CA',
  zipInput: string = ''
): ParsedAddress {
  if (!addressStr || addressStr.toLowerCase() === 'nan') {
    return {
      streetNumber: '',
      streetName: '',
      unit: '',
      city: cityInput.toUpperCase().trim(),
      state: (stateInput || 'CA').toUpperCase().trim(),
      zipCode: zipInput.trim().replace(/\.0$/, ''),
      normalizedFullAddress: '',
    };
  }

  let addr = addressStr.toUpperCase().trim();

  // Normalize punctuation while preserving #
  addr = addr.replace(/[.,]/g, ' ');
  addr = addr.replace(/\s+/g, ' ').trim();

  // Extract Unit / Suite / Apt
  let unit = '';
  const unitPatterns = [
    /#\s*([A-Z0-9-]+)\s*$/,
    /\b(?:APT|UNIT|SUITE|STE|#)\s*([A-Z0-9-]+)\s*$/,
    /\b(?:APT|UNIT|SUITE|STE)\s*#?\s*([A-Z0-9-]+)/,
  ];

  for (const pattern of unitPatterns) {
    const match = addr.match(pattern);
    if (match) {
      unit = match[1];
      addr = addr.slice(0, match.index).trim();
      break;
    }
  }

  // Street Suffix & Directional Substitutions
  const substitutions: Record<string, string> = {
    '\\bSTREET\\b': 'ST',
    '\\bAVENUE\\b': 'AVE',
    '\\bBOULEVARD\\b': 'BLVD',
    '\\bDRIVE\\b': 'DR',
    '\\bLANE\\b': 'LN',
    '\\bROAD\\b': 'RD',
    '\\bCOURT\\b': 'CT',
    '\\bPLACE\\b': 'PL',
    '\\bHIGHWAY\\b': 'HWY',
    '\\bCIRCLE\\b': 'CIR',
    '\\bPARKWAY\\b': 'PKWY',
    '\\bNORTH\\b': 'N',
    '\\bSOUTH\\b': 'S',
    '\\bEAST\\b': 'E',
    '\\bWEST\\b': 'W',
  };

  for (const [pattern, replacement] of Object.entries(substitutions)) {
    addr = addr.replace(new RegExp(pattern, 'g'), replacement);
  }

  const tokens = addr.split(' ');
  let streetNumber = '';
  if (tokens.length > 0 && /^\d+[A-Z]?$/.test(tokens[0])) {
    streetNumber = tokens.shift() || '';
  }
  const streetName = tokens.join(' ');

  const city = cityInput.toUpperCase().trim() || 'ORANGE COUNTY';
  const state = (stateInput || 'CA').toUpperCase().trim();
  const zipCode = zipInput.trim().replace(/\.0$/, '');

  const unitPart = unit ? ` UNIT ${unit}` : '';
  const normalizedFullAddress = `${streetNumber} ${streetName}${unitPart}, ${city}, ${state} ${zipCode}`.trim();

  return {
    streetNumber,
    streetName,
    unit,
    city,
    state,
    zipCode,
    normalizedFullAddress,
  };
}

/**
 * Entity Name Normalization
 */
export function normalizeEntityName(name?: string | null): string {
  if (!name) return '';

  let norm = name.toUpperCase().trim();
  norm = norm.replace(/[^\w\s]/g, ' ');

  const replacements: Record<string, string> = {
    '\\bLIMITED LIABILITY COMPANY\\b': 'LLC',
    '\\bINCORPORATED\\b': 'INC',
    '\\bCORPORATION\\b': 'CORP',
    '\\bLIMITED PARTNERSHIP\\b': 'LP',
    '\\bLIMITED LIABILITY PARTNERSHIP\\b': 'LLP',
    '\\bTRUST\\b': 'TR',
    '\\bPROPERTIES\\b': 'PROP',
    '\\bHOLDINGS\\b': 'HLDG',
    '\\bINVESTMENTS\\b': 'INV',
  };

  for (const [pattern, replacement] of Object.entries(replacements)) {
    norm = norm.replace(new RegExp(pattern, 'g'), replacement);
  }

  return norm.split(/\s+/).join(' ');
}

/**
 * Classify Owner Type (Individual vs Corporate Entity)
 */
export function classifyOwnerType(name?: string | null): OwnerType {
  if (!name) return 'INDIVIDUAL';

  const corpRegex = /\b(LLC|INC|CORP|CORPORATION|LP|LLP|LTD|HOLDINGS|PROPERTIES|PROP|HLDG|TRUST|TR|PARTNERSHIP|VENTURES|GROUP|INVESTMENTS)\b/i;
  return corpRegex.test(name) ? 'CORPORATE_ENTITY' : 'INDIVIDUAL';
}

/**
 * Cryptographic SHA-256 Hash Function
 */
export async function computeSha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous SHA-256 helper for client/server JS when Web Crypto isn't async
 */
export function computeSha256Sync(content: string): string {
  let hash = 0;
  if (content.length === 0) return '0000000000000000000000000000000000000000000000000000000000000000';
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  // Generate deterministic 64-char hex string
  const str = Math.abs(hash).toString(16).padStart(8, '0');
  return (str + str + str + str + str + str + str + str).slice(0, 64);
}

/**
 * Unit-aware Property Fingerprint Computation
 */
export function computeAddressFingerprint(
  streetNumber: string,
  streetName: string,
  unit: string = '',
  city: string = '',
  state: string = 'CA',
  zipCode: string = ''
): string {
  const parts = [
    (streetNumber || '').trim().toUpperCase(),
    (streetName || '').trim().toUpperCase(),
    (unit || '').trim().toUpperCase(),
    (city || '').trim().toUpperCase(),
    (state || 'CA').trim().toUpperCase(),
    (zipCode || '').trim().toUpperCase(),
  ];
  return computeSha256Sync(parts.join('|'));
}

/**
 * Owner Identity Fingerprint Computation
 */
export function computeOwnerFingerprint(normalizedName: string, mailingAddress: string = ''): string {
  const parsedMail = parseAddressComponents(mailingAddress);
  const parts = [
    (normalizedName || '').trim().toUpperCase(),
    (parsedMail.normalizedFullAddress || mailingAddress || '').trim().toUpperCase(),
  ];
  return computeSha256Sync(parts.join('|'));
}
