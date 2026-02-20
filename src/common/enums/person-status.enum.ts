export enum PersonStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  DELETED = 3,
}

export const PersonStatusLabel: Record<PersonStatus, string> = {
  [PersonStatus.ACTIVE]: 'ACTIVE',
  [PersonStatus.INACTIVE]: 'INACTIVE',
  [PersonStatus.DELETED]: 'DELETED',
};
