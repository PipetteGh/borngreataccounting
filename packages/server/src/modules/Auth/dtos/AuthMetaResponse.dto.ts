import { ApiProperty } from '@nestjs/swagger';

export class AuthMetaResponseDto {
  @ApiProperty({ description: 'Whether signup is disabled' })
  signupDisabled: boolean;

  @ApiProperty({ description: 'Whether sign-in with Google is enabled' })
  googleEnabled: boolean;

  @ApiProperty({
    description: 'Whether initial administrator account setup is required',
  })
  needsSetup: boolean;
}
