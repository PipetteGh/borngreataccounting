import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { Global, Module } from '@nestjs/common';
import { Knex } from 'knex';
import { initialize } from 'objection';
import { TENANCY_DB_CONNECTION } from './TenancyDB/TenancyDB.constants';

const RegisteredModels = [
  'SaleInvoice',
  'Bill',
  'Expense',
  'BankTransaction',
  'MatchedBankTransaction',
  'ManualJournalEntry',
  'Account',
  'UncategorizedBankTransaction',
  'RecognizedBankTransaction',
];
export const TENANT_MODELS_INIT = 'TENANT_MODELS_INIT';

const initializedKnexInstances = new WeakSet<Knex>();
const inFlightInitializations = new WeakMap<Knex, Promise<boolean>>();

const provider = ClsModule.forFeatureAsync({
  provide: TENANT_MODELS_INIT,
  inject: [TENANCY_DB_CONNECTION, ModuleRef],
  useFactory: (tenantKnex: () => Knex, moduleRef: ModuleRef) => async () => {
    const knexInstance = tenantKnex();
    if (!knexInstance) {
      return false;
    }
    if (initializedKnexInstances.has(knexInstance)) {
      return true;
    }
    const existingPromise = inFlightInitializations.get(knexInstance);
    if (existingPromise) {
      return existingPromise;
    }

    const initPromise = (async () => {
      const contextId = ContextIdFactory.create();
      const models = await Promise.all(
        RegisteredModels.map((model) => {
          return moduleRef.resolve(model, contextId, { strict: false });
        }),
      );
      const modelsInstances = models.map((model) => model());

      if (modelsInstances.length > 0) {
        try {
          // Initialize all models with the knex instance once per Knex pool
          await initialize(knexInstance, modelsInstances);
        } catch (error) {
          console.error('Error initializing models:', error);
          throw error;
        }
      }
      initializedKnexInstances.add(knexInstance);
      return true;
    })().finally(() => {
      inFlightInitializations.delete(knexInstance);
    });

    inFlightInitializations.set(knexInstance, initPromise);
    return initPromise;
  },
  strict: true,
  type: 'function',
});

@Module({
  imports: [provider],
  exports: [provider],
})
@Global()
export class TenantModelsInitializeModule {}
