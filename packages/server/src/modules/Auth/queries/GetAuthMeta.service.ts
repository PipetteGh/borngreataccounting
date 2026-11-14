import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemUser } from '@/modules/System/models/SystemUser';
import { IAuthGetMetaPOJO } from '../Auth.interfaces';

@Injectable()
export class GetAuthMetaService {
  constructor(
    private readonly configService: ConfigService,

    @Inject(SystemUser.name)
    private readonly systemUserModel: typeof SystemUser,
  ) {}
  /**
   * Retrieves the authentication meta for SPA.
   * @returns {Promise<IAuthGetMetaPOJO>}
   */
  public async getAuthMeta(): Promise<IAuthGetMetaPOJO> {
    let needsSetup = false;
    try {
      const existingUser = await this.systemUserModel
        .query()
        .select('id')
        .first();
      needsSetup = !existingUser;
    } catch {
      needsSetup = false;
    }

    return {
      signupDisabled: this.configService.get('signupRestrictions.disabled'),
      googleEnabled: this.configService.get<boolean>('google.enabled') ?? false,
      needsSetup,
    };
  }
}
