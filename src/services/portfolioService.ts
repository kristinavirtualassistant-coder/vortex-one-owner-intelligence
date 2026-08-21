import { ownerRepository } from '../repositories/ownerRepository.js';
import { propertyRepository } from '../repositories/propertyRepository.js';
import { generatePortfolioAnalytics } from '../lib/scoring.js';
import { PortfolioRecord } from '../types';

export const portfolioService = {
  async getAllPortfolios(): Promise<PortfolioRecord[]> {
    const owners = await ownerRepository.findAllOwnersForPortfolio();
    const portfolios: PortfolioRecord[] = [];

    for (const o of owners) {
      const props = await propertyRepository.findByQuery(o.full_name);
      const portfolio = generatePortfolioAnalytics(
        o.id,
        o.full_name,
        o.owner_type as any,
        props,
        Number(o.total_value) || 0,
        Number(o.total_units) || 1
      );
      portfolios.push(portfolio);
    }

    return portfolios;
  }
};
