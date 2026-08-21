/**
 * Vortex One Property-Management Lead Score & Portfolio Analytics Engine
 */

import { OwnerType, PortfolioRecord, PropertyRecord } from '../types';

export interface LeadScoreBreakdown {
  propertyCountScore: number;
  corporateBonus: number;
  absenteeBonus: number;
  unitVolumeBonus: number;
  totalScore: number;
}

export function calculateLeadScore(
  totalProperties: number,
  ownerType: OwnerType,
  isAbsenteePortfolio: boolean,
  totalUnits: number
): LeadScoreBreakdown {
  const propertyCountScore = Math.min(totalProperties * 15, 45);
  const corporateBonus = ownerType === 'CORPORATE_ENTITY' ? 25 : 10;
  const absenteeBonus = isAbsenteePortfolio ? 20 : 0;
  const unitVolumeBonus = totalUnits >= 5 ? 20 : 5;

  const rawTotal = propertyCountScore + corporateBonus + absenteeBonus + unitVolumeBonus;
  const totalScore = Math.min(Math.max(rawTotal, 0), 100);

  return {
    propertyCountScore,
    corporateBonus,
    absenteeBonus,
    unitVolumeBonus,
    totalScore,
  };
}

export function generatePortfolioAnalytics(
  ownerId: string,
  ownerName: string,
  ownerType: OwnerType,
  properties: PropertyRecord[],
  totalAssessedValue: number = 0,
  totalUnits: number = 0
): PortfolioRecord {
  const totalProps = properties.length || 1;
  const cities = new Set(properties.map((p) => p.city).filter(Boolean));

  // Determine absentee status
  let absenteeProps = 0;
  let ownerOccupiedProps = 0;

  for (const prop of properties) {
    if (prop.savedNote && prop.savedNote.includes('Owner-Occupied')) {
      ownerOccupiedProps++;
    } else {
      absenteeProps++;
    }
  }

  const absenteeRatio = absenteeProps / totalProps;
  const isAbsenteePortfolio = absenteeRatio >= 0.5;

  const scoreResult = calculateLeadScore(
    totalProps,
    ownerType,
    isAbsenteePortfolio,
    totalUnits || totalProps
  );

  return {
    id: `portfolio-${ownerId}`,
    ownerId,
    ownerName,
    ownerType,
    totalProperties: totalProps,
    totalAssessedValue: totalAssessedValue || totalProps * 650000,
    totalUnits: totalUnits || totalProps,
    distinctCities: cities.size || 1,
    absenteeProperties: absenteeProps,
    ownerOccupiedProperties: ownerOccupiedProps,
    absenteeRatio: Number(absenteeRatio.toFixed(4)),
    isAbsenteePortfolio,
    leadScore: scoreResult.totalScore,
    calculatedAt: new Date().toISOString(),
    properties: properties.map((p) => ({
      apn: p.propertyKey.replace('oc:', ''),
      address: p.formattedAddress,
      city: p.city,
      assessedValue: 650000,
      units: 1,
      useCode: 'Residential',
      isOwnerOccupied: false,
    })),
  };
}
