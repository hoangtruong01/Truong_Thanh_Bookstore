/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports */
import * as fs from 'fs';
import * as path from 'path';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { StaffPermission } from '../enums';

/**
 * TASK-005 (BUG-002 regression): every route protected by PermissionsGuard or
 * RolesGuard must declare @Permissions / @Roles explicitly. A missing decorator
 * previously opened /documents to every logged-in user (SEC-P0-01).
 */

type Violation = { controller: string; handler: string; reason: string };

// Mirrors Reflector.getAllAndOverride: the first defined value wins, so an empty
// handler-level @Permissions() overrides (and empties) a class-level list.
const hasMeta = (key: string, handler: object, controller: object): boolean => {
  const value: unknown =
    Reflect.getMetadata(key, handler) ?? Reflect.getMetadata(key, controller);
  return Array.isArray(value) && value.length > 0;
};

const guardsOf = (target: object): unknown[] =>
  (Reflect.getMetadata(GUARDS_METADATA, target) as unknown[]) || [];

function findViolations(controller: any): Violation[] {
  const violations: Violation[] = [];
  const classGuards = guardsOf(controller);
  for (const name of Object.getOwnPropertyNames(controller.prototype)) {
    if (name === 'constructor') continue;
    const handler = controller.prototype[name];
    if (typeof handler !== 'function') continue;
    if (Reflect.getMetadata(METHOD_METADATA, handler) === undefined) continue;

    const guards = [...classGuards, ...guardsOf(handler)];
    if (
      guards.includes(PermissionsGuard) &&
      !hasMeta(PERMISSIONS_KEY, handler, controller)
    ) {
      violations.push({
        controller: controller.name,
        handler: name,
        reason: 'PermissionsGuard without @Permissions',
      });
    }
    if (
      guards.includes(RolesGuard) &&
      !hasMeta(ROLES_KEY, handler, controller)
    ) {
      violations.push({
        controller: controller.name,
        handler: name,
        reason: 'RolesGuard without @Roles',
      });
    }
  }
  return violations;
}

function loadControllers(dir: string): any[] {
  const out: any[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...loadControllers(full));
    } else if (entry.name.endsWith('.controller.ts')) {
      const mod = require(full);
      for (const exported of Object.values(mod)) {
        if (
          typeof exported === 'function' &&
          Reflect.getMetadata(PATH_METADATA, exported) !== undefined
        ) {
          out.push(exported);
        }
      }
    }
  }
  return out;
}

describe('TASK-005: Guarded route coverage (deny-by-default safety net)', () => {
  const controllers = loadControllers(path.join(__dirname, '../../modules'));

  it('discovers the application controllers', () => {
    expect(controllers.length).toBeGreaterThan(20);
  });

  it('every PermissionsGuard/RolesGuard route declares its permissions or roles', () => {
    const violations = controllers.flatMap(findViolations);
    expect(violations).toEqual([]);
  });

  it('detects a guarded route that forgot its decorator', () => {
    @Controller('fake')
    @UseGuards(PermissionsGuard)
    class FakeController {
      @Get('open')
      open() {
        return true;
      }

      @Get('closed')
      @Permissions(StaffPermission.MANAGE_FINANCE)
      closed() {
        return true;
      }
    }

    expect(findViolations(FakeController)).toEqual([
      {
        controller: 'FakeController',
        handler: 'open',
        reason: 'PermissionsGuard without @Permissions',
      },
    ]);
  });

  it('flags an empty handler-level @Permissions() that overrides the class list', () => {
    @Controller('fake-empty')
    @UseGuards(PermissionsGuard)
    @Permissions(StaffPermission.MANAGE_FINANCE)
    class FakeEmptyController {
      @Get('inherits')
      inherits() {
        return true;
      }

      @Get('emptied')
      @Permissions()
      emptied() {
        return true;
      }
    }

    expect(findViolations(FakeEmptyController)).toEqual([
      {
        controller: 'FakeEmptyController',
        handler: 'emptied',
        reason: 'PermissionsGuard without @Permissions',
      },
    ]);
  });
});
