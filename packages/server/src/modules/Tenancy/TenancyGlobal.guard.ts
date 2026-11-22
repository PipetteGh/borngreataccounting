import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { IS_PUBLIC_ROUTE } from '../Auth/Auth.constants';
import { getAuthApiKey } from '../Auth/Auth.utils';
import { UserTenant } from '../System/models/UserTenant.model';
import { TenantModel } from '../System/models/TenantModel';

export const IS_TENANT_AGNOSTIC = 'IS_TENANT_AGNOSTIC';

export const TenantAgnosticRoute = () => SetMetadata(IS_TENANT_AGNOSTIC, true);

const TENANCY_CACHE_TTL_MS = 15 * 1000;

@Injectable()
export class TenancyGlobalGuard implements CanActivate {
  private readonly tenantCache = new Map<
    string,
    { tenant: TenantModel; at: number }
  >();
  private readonly membershipCache = new Map<
    string,
    { valid: boolean; at: number }
  >();

  constructor(
    @Inject(UserTenant.name)
    private readonly userTenantModel: typeof UserTenant,

    @Inject(TenantModel.name)
    private readonly tenantModel: typeof TenantModel,

    private readonly reflector: Reflector,
    private readonly clsService: ClsService,
  ) {}

  /**
   * Validates the organization ID in the request headers and enforces
   * that the authenticated user is a member of the requested organization.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.headers['organization-id'];
    const authorization = request.headers['authorization']?.trim();
    const isAuthApiKey = !!getAuthApiKey(authorization || '');

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );
    const isTenantAgnostic = this.reflector.getAllAndOverride<boolean>(
      IS_TENANT_AGNOSTIC,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || isTenantAgnostic || isAuthApiKey) {
      return true;
    }
    if (!organizationId) {
      throw new UnauthorizedException('Organization ID is required.');
    }
    // Validate that the authenticated user is a member of the requested organization.
    const userId = this.clsService.get<number>('userId');
    const now = Date.now();

    let tenant: TenantModel | undefined;
    const cachedTenant = this.tenantCache.get(organizationId);
    if (cachedTenant && now - cachedTenant.at < TENANCY_CACHE_TTL_MS) {
      tenant = cachedTenant.tenant;
    } else {
      tenant = await this.tenantModel.query().findOne({ organizationId });
      if (!tenant) {
        throw new UnauthorizedException('Organization not found.');
      }
      if (tenant.initializedAt && tenant.seededAt) {
        if (this.tenantCache.size > 10000) this.tenantCache.clear();
        this.tenantCache.set(organizationId, { tenant, at: now });
      }
    }
    this.clsService.set('tenant', tenant);

    const memberKey = `${userId}:${tenant.id}`;
    const cachedMember = this.membershipCache.get(memberKey);
    if (cachedMember && now - cachedMember.at < TENANCY_CACHE_TTL_MS) {
      return cachedMember.valid;
    }

    const membership = await this.userTenantModel
      .query()
      .findOne({ userId, tenantId: tenant.id });

    if (!membership) {
      throw new UnauthorizedException(
        'You do not have access to this organization.',
      );
    }
    if (this.membershipCache.size > 10000) this.membershipCache.clear();
    this.membershipCache.set(memberKey, { valid: true, at: now });
    return true;
  }
}
