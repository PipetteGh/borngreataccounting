import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { Knex } from 'knex';
import { ERRORS } from '../Users.constants';
import { ServiceError } from '@/modules/Items/ServiceError';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenantUser } from '@/modules/Tenancy/TenancyModels/models/TenantUser.model';
import { Role } from '@/modules/Roles/models/Role.model';
import { SystemUser } from '@/modules/System/models/SystemUser';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { SystemKnexConnection } from '@/modules/System/SystemDB/SystemDB.constants';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { hashPassword } from '@/modules/Auth/Auth.utils';
import { CreateUserDto } from '../dtos/CreateUser.dto';

@Injectable()
export class CreateUserService {
  constructor(
    private readonly tenancyContext: TenancyContext,

    @Inject(TenantUser.name)
    private readonly tenantUserModel: TenantModelProxy<typeof TenantUser>,

    @Inject(Role.name)
    private readonly roleModel: TenantModelProxy<typeof Role>,

    @Inject(SystemUser.name)
    private readonly systemUserModel: typeof SystemUser,

    @Inject(UserTenant.name)
    private readonly userTenantModel: typeof UserTenant,

    @Inject(SystemKnexConnection)
    private readonly systemKnex: Knex,
  ) {}

  /**
   * Directly creates a user with credentials, role, and active status
   * without requiring an email invitation flow.
   */
  public async createUser(createUserDTO: CreateUserDto): Promise<TenantUser> {
    const email = createUserDTO.email.trim().toLowerCase();

    const role = await this.roleModel().query().findById(createUserDTO.roleId);
    if (!role) {
      throw new ServiceError('ROLE_NOT_FOUND');
    }

    const existingTenantUser = await this.tenantUserModel()
      .query()
      .findOne({ email });
    if (existingTenantUser) {
      throw new ServiceError(ERRORS.EMAIL_ALREADY_EXISTS);
    }

    const authorizedUser = await this.tenancyContext.getSystemUser();
    const tenantId = authorizedUser.tenantId;
    const isActive = createUserDTO.active ?? true;
    const hashedPassword = await hashPassword(createUserDTO.password);

    const existingSystemUser = await this.systemUserModel
      .query()
      .findOne({ email });

    let systemUser: SystemUser;

    if (existingSystemUser) {
      // Allow adding an existing system user to this organization if not already a member.
      const existingMembership = await this.userTenantModel
        .query()
        .findOne({ userId: existingSystemUser.id, tenantId });
      if (existingMembership) {
        throw new ServiceError(ERRORS.EMAIL_ALREADY_EXISTS);
      }

      await this.userTenantModel.query().insert({
        userId: existingSystemUser.id,
        tenantId,
        role: 'member',
      });
      systemUser = existingSystemUser;
    } else {
      systemUser = await this.systemKnex.transaction(async (trx) => {
        const created = await this.systemUserModel.query(trx).insertAndFetch({
          firstName: createUserDTO.firstName.trim(),
          lastName: createUserDTO.lastName.trim(),
          email,
          password: hashedPassword,
          active: isActive,
          verified: true,
          tenantId,
          defaultTenantId: tenantId,
          inviteAcceptedAt: moment().format('YYYY-MM-DD'),
        });

        await this.userTenantModel.query(trx).insert({
          userId: created.id,
          tenantId,
          role: 'member',
        });

        return created;
      });
    }

    const now = new Date();
    const tenantUser = await this.tenantUserModel().query().insertAndFetch({
      firstName: createUserDTO.firstName.trim(),
      lastName: createUserDTO.lastName.trim(),
      email,
      roleId: createUserDTO.roleId,
      active: isActive,
      systemUserId: systemUser.id,
      invitedAt: now,
      inviteAcceptedAt: now,
    });

    return tenantUser;
  }
}
