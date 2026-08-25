import { SetMetadata } from '@nestjs/common';
import { StaffPermission } from '../enums';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: (StaffPermission | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

