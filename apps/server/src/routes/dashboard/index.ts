import { createProtectedElysia } from '@ksi-core/server/lib/createElysia';
import admin from './admin';
export default createProtectedElysia({ prefix: '/dashboard' })
  .get('/user', ({ user }) => user)
  .use(admin);
