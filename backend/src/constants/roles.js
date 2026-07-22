// src/constants/roles.js

export const ROLES = Object.freeze({
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    AUTOMATION_MANAGER: 'AUTOMATION_MANAGER',
    TEAM_LEAD: 'TEAM_LEAD',
    EMPLOYEE: 'EMPLOYEE',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const DEFAULT_ROLE = ROLES.EMPLOYEE;