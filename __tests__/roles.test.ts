import { isProjectManager, canManageEvent, canEditFunds, canRecordScores, ROLE_TYPE } from '@/lib/auth/roles'

test('isProjectManager returns true for project_manager', () => {
  expect(isProjectManager(ROLE_TYPE.PROJECT_MANAGER)).toBe(true)
})

test('isProjectManager returns false for division_head', () => {
  expect(isProjectManager(ROLE_TYPE.DIVISION_HEAD)).toBe(false)
})

test('canManageEvent returns true for shb_cup_pm on shb_cup event', () => {
  expect(canManageEvent(ROLE_TYPE.SHB_CUP_PM, 'shb_cup')).toBe(true)
})

test('canManageEvent returns false for shb_cup_pm on 5k_run event', () => {
  expect(canManageEvent(ROLE_TYPE.SHB_CUP_PM, '5k_run')).toBe(false)
})

test('canManageEvent returns true for project_manager on any event', () => {
  expect(canManageEvent(ROLE_TYPE.PROJECT_MANAGER, 'shb_cup')).toBe(true)
  expect(canManageEvent(ROLE_TYPE.PROJECT_MANAGER, '5k_run')).toBe(true)
})

test('canEditFunds returns true only for PM and marketing_head', () => {
  expect(canEditFunds(ROLE_TYPE.PROJECT_MANAGER)).toBe(true)
  expect(canEditFunds(ROLE_TYPE.MARKETING_HEAD)).toBe(true)
  expect(canEditFunds(ROLE_TYPE.DIVISION_HEAD)).toBe(false)
})

test('canRecordScores returns false for division_head', () => {
  expect(canRecordScores(ROLE_TYPE.DIVISION_HEAD)).toBe(false)
})
