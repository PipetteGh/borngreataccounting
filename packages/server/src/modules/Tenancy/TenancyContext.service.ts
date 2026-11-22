import { Inject, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { QueryBuilder } from 'objection';
import { SystemUser } from '../System/models/SystemUser';
import { TenantModel } from '../System/models/TenantModel';

const TENANT_CACHE_TTL_MS = 15 * 1000;

@Injectable()
export class TenancyContext {
  private readonly tenantCache = new Map<
    string,
    { tenant: TenantModel; at: number }
  >();

  constructor(
    private readonly cls: ClsService,

    @Inject(SystemUser.name)
    private readonly systemUserModel: typeof SystemUser,

    @Inject(TenantModel.name)
    private readonly systemTenantModel: typeof TenantModel,
  ) {}

  /**
   * Get the current tenant.
   * Returns a QueryBuilder-compatible proxy: awaiting directly resolves from
   * per-request CLS or short-lived memory cache, while chaining QueryBuilder
   * methods (e.g. `.withGraphFetched(...)`) delegates to a fresh Objection query.
   * @param {boolean} withMetadata - If true, the tenant metadata will be fetched.
   * @returns
   */
  getTenant(withMetadata: boolean = false): QueryBuilder<TenantModel, TenantModel> {
    const buildQuery = () => {
      const organizationId = this.cls.get('organizationId');
      if (!organizationId) {
        throw new Error('Tenant not found');
      }
      const query = this.systemTenantModel.query().findOne({ organizationId });
      if (withMetadata) {
        query.withGraphFetched('metadata');
      }
      return query;
    };

    const resolveTenant = async (): Promise<TenantModel> => {
      const organizationId = this.cls.get('organizationId');
      if (!organizationId) {
        throw new Error('Tenant not found');
      }

      if (withMetadata) {
        const clsTenantMeta = this.cls.get<TenantModel>('tenantWithMetadata');
        if (clsTenantMeta && clsTenantMeta.organizationId === organizationId) {
          return clsTenantMeta;
        }
        const tenant = await buildQuery();
        if (tenant) {
          this.cls.set('tenantWithMetadata', tenant);
        }
        return tenant;
      }

      const clsTenant = this.cls.get<TenantModel>('tenant');
      if (clsTenant && clsTenant.organizationId === organizationId) {
        return clsTenant;
      }
      const cached = this.tenantCache.get(organizationId);
      if (cached && Date.now() - cached.at < TENANT_CACHE_TTL_MS) {
        this.cls.set('tenant', cached.tenant);
        return cached.tenant;
      }

      const tenant = await buildQuery();
      if (tenant?.initializedAt && tenant?.seededAt) {
        if (this.tenantCache.size > 10000) {
          this.tenantCache.clear();
        }
        this.tenantCache.set(organizationId, { tenant, at: Date.now() });
        this.cls.set('tenant', tenant);
      }
      return tenant;
    };

    return new Proxy({} as QueryBuilder<TenantModel, TenantModel>, {
      get: (_target, prop) => {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          const p = resolveTenant();
          return (...args: any[]) => (p as any)[prop](...args);
        }
        const qb = buildQuery();
        const val = (qb as any)[prop];
        return typeof val === 'function' ? val.bind(qb) : val;
      },
    });
  }

  async getTenantMetadata() {
    const tenant = await this.getTenant(true);

    return tenant?.metadata;
  }

  /**
   * Retrieves the current system user.
   * @returns {Promise<SystemUser>}
   */
  async getSystemUser() {
    const clsUser = this.cls.get<SystemUser>('systemUser');
    if (clsUser) {
      return clsUser;
    }
    // Get the user from the request headers.
    const userId = this.cls.get('userId');

    const user = await this.systemUserModel.query().findById(userId);
    if (user) {
      this.cls.set('systemUser', user);
    }
    return user;
  }

  async getTenantJobPayload() {
    const tenant = await this.getTenant();
    const user = await this.getSystemUser();

    const organizationId = tenant.organizationId;
    const userId = user.id;

    return { organizationId, userId };
  }
}
