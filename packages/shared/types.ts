import type { ContentTranslations } from './content-locales';
export interface Profile {
  translations?: ContentTranslations;
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string | null;
  nickname: string | null;
  bio: string | null;
  github: string | null;
  linkedin: string | null;
  membershipStatus: 'pending' | 'active' | 'suspended' | 'deleted';
  role: 'member' | 'board' | 'administrator';
  flags: string[];
  publicPrivacy: 'full-name' | 'last-initial' | 'initials';
}
