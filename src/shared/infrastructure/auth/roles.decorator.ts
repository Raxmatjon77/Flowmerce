import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY, Role } from './auth.constants';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
