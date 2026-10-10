import type { Profile } from 'shared/types';
declare global {
  namespace App {
    interface Locals {
      user: Profile | null;
    }
  }
}
export {};
