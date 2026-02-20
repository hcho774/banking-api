export enum PersonStatus {
  NOT_SET = 0,
  ACTIVE = 1,
  INACTIVE = 2,
  DELETED = 3,
}

export const PersonStatusLabel: Record<PersonStatus, string> = {
  [PersonStatus.NOT_SET]: 'NOT_SET',
  [PersonStatus.ACTIVE]: 'ACTIVE',
  [PersonStatus.INACTIVE]: 'INACTIVE',
  [PersonStatus.DELETED]: 'DELETED',
};
