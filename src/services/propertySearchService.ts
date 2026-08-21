import { propertyRepository } from '../repositories/propertyRepository.js';
import { parcelRepository } from '../repositories/parcelRepository.js';
import { ownerRepository } from '../repositories/ownerRepository.js';
import { contactRepository } from '../repositories/contactRepository.js';
import { provenanceRepository } from '../repositories/provenanceRepository.js';
import { researchRepository } from '../repositories/researchRepository.js';
import { generatePortfolioAnalytics } from '../lib/scoring.js';
import { SearchResultPayload } from '../types';

export const propertySearchService = {
  async search(queryStr: string): Promise<SearchResultPayload | null> {
    const trimmed = queryStr.trim();
    if (!trimmed) return null;

    const matchedProps = await propertyRepository.findByQuery(trimmed);
    if (matchedProps.length === 0) {
      return null;
    }

    const prop = matchedProps[0];
    const parcel = await parcelRepository.findByPropertyId(prop.id);
    const owner = await ownerRepository.findByPropertyId(prop.id);
    const contacts = owner ? await contactRepository.findByEntityId(owner.id) : [];
    const provenance = await provenanceRepository.findByEntity(parcel?.id || prop.id);
    const tasks = owner ? (await researchRepository.findAll()).filter((t) => t.targetEntityId === owner.id) : [];

    let portfolio = undefined;
    if (owner && parcel) {
      const ownerProps = await propertyRepository.findByQuery(owner.fullName);
      portfolio = generatePortfolioAnalytics(
        owner.id,
        owner.fullName,
        owner.ownerType,
        ownerProps,
        parcel.totalAssessedValue,
        parcel.units
      );
    }

    if (!parcel || !owner) {
      return null;
    }

    return {
      property: prop,
      parcel,
      owner,
      contacts,
      provenance,
      portfolio,
      researchTasks: tasks,
    };
  }
};
