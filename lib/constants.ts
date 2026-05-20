export const EVENTS = {
  SHB_CUP: 'shb_cup',
  RUN:     '5k_run',
} as const

export const CROSS_ASSIGNED_DIVISIONS = [
  'registration',
  'security',
  'medic',
  'equipment',
  'documentation',
] as const

export const DIVISION_TYPES = {
  MARKETING:       'marketing',
  CENTRAL_SUPPORT: 'central_support',
  RUN:             'run',
  SHARED:          'shared',
} as const
