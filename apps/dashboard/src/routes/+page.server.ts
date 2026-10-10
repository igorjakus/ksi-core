import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getUrls } from 'shared';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ locals }) => {
  if (!locals.user) redirect(303, '/login');
  return {
    user: locals.user,
    activationContact: env.ACTIVATION_CONTACT ?? 'KSI board',
    websocketOrigin: getUrls(env).websocket
  };
};
