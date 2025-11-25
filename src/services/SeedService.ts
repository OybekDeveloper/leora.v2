import Realm from 'realm';
import { AccountDAO, FxRateDAO } from '@/database/dao/FinanceDAO';

export class SeedService {
  private realm: Realm;
  private accountDAO: AccountDAO;
  private fxRateDAO: FxRateDAO;

  constructor(realm: Realm) {
    this.realm = realm;
    this.accountDAO = new AccountDAO(realm);
    this.fxRateDAO = new FxRateDAO(realm);
  }

  hasData(): boolean {
    return this.accountDAO.list().length > 0;
  }

  seedDemoAccounts(): void {
    if (this.hasData()) {
      console.log('Data already exists, skipping seed');
      return;
    }

    console.log('Seeding demo accounts...');

    const demoAccounts = [
      {
        name: 'Наличные',
        type: 'cash' as const,
        currency: 'UZS',
        balance: 450000,
        isPrimary: true,
      },
      {
        name: 'Humo Card',
        type: 'card' as const,
        currency: 'UZS',
        balance: 1250000,
        isPrimary: false,
      },
      {
        name: 'USD Wallet',
        type: 'cash' as const,
        currency: 'USD',
        balance: 120.50,
        isPrimary: true,
      },
    ];

    demoAccounts.forEach((account) => {
      this.accountDAO.create({
        name: account.name,
        accountType: account.type,
        currency: account.currency,
        initialBalance: account.balance,
        isArchived: false,
      });
    });

    this.seedRates();
    console.log('Demo data seeded successfully');
  }

  seedRates(): void {
    const rates = [
      { currency: 'USD', rateToUSD: 1, source: 'manual' as const },
      { currency: 'UZS', rateToUSD: 0.000079, source: 'manual' as const },
      { currency: 'EUR', rateToUSD: 1.08, source: 'manual' as const },
    ];

    const date = new Date().toISOString();
    rates.forEach((rate) => {
      this.fxRateDAO.upsert({
        fromCurrency: rate.currency,
        toCurrency: 'USD',
        rate: rate.rateToUSD,
        source: rate.source,
        isOverridden: true,
        date,
      });
    });
  }

  clearAllData(): void {
    this.realm.write(() => {
      this.realm.deleteAll();
    });
    console.log('All data cleared');
  }
}
