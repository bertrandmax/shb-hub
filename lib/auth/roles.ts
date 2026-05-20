import { EVENTS } from '@/lib/constants'

export const ROLE_TYPE = {
  PROJECT_MANAGER:               'project_manager',
  SHB_CUP_PM:                    'shb_cup_pm',
  SHB_CUP_VICE_PM:               'shb_cup_vice_pm',
  RUN_PM:                        '5k_run_pm',
  RUN_VICE_PM:                   '5k_run_vice_pm',
  COMPETITION_COORDINATOR:       'competition_coordinator',
  COMPETITION_VICE_COORDINATOR:  'competition_vice_coordinator',
  COMPETITION_PIC_HEAD:          'competition_pic_head',
  COMPETITION_PIC_VICE:          'competition_pic_vice',
  DIVISION_HEAD:                 'division_head',
  DIVISION_VICE_HEAD:            'division_vice_head',
  MARKETING_HEAD:                'marketing_head',
} as const

export type RoleType = typeof ROLE_TYPE[keyof typeof ROLE_TYPE]

export const SCOPE_TYPE = {
  GLOBAL:      'global',
  EVENT:       'event',
  COMPETITION: 'competition',
  DIVISION:    'division',
} as const

export type ScopeType = typeof SCOPE_TYPE[keyof typeof SCOPE_TYPE]

export interface UserScope {
  scope_type: ScopeType
  scope_id:   string
}

export interface AppUser {
  id:         string
  email:      string
  name:       string
  role_type:  RoleType
  scopes:     UserScope[]   // from user_event_scopes join
}

export function isProjectManager(role: RoleType): boolean {
  return role === ROLE_TYPE.PROJECT_MANAGER
}

export function canManageEvent(role: RoleType, eventId: string): boolean {
  if (role === ROLE_TYPE.PROJECT_MANAGER) return true
  if (role === ROLE_TYPE.SHB_CUP_PM || role === ROLE_TYPE.SHB_CUP_VICE_PM) return eventId === EVENTS.SHB_CUP
  if (role === ROLE_TYPE.RUN_PM || role === ROLE_TYPE.RUN_VICE_PM) return eventId === EVENTS.RUN
  return false
}

export function isMarketingHead(role: RoleType): boolean {
  return role === ROLE_TYPE.MARKETING_HEAD
}

export function canEditFunds(role: RoleType): boolean {
  return role === ROLE_TYPE.PROJECT_MANAGER || role === ROLE_TYPE.MARKETING_HEAD
}

const SCORE_RECORDING_ROLES = new Set<RoleType>([
  ROLE_TYPE.PROJECT_MANAGER,
  ROLE_TYPE.SHB_CUP_PM,
  ROLE_TYPE.SHB_CUP_VICE_PM,
  ROLE_TYPE.COMPETITION_COORDINATOR,
  ROLE_TYPE.COMPETITION_VICE_COORDINATOR,
  ROLE_TYPE.COMPETITION_PIC_HEAD,
  ROLE_TYPE.COMPETITION_PIC_VICE,
])

export function canRecordScores(role: RoleType): boolean {
  return SCORE_RECORDING_ROLES.has(role)
}
