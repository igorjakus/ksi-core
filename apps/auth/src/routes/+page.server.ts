import { redirect } from '@sveltejs/kit';
import { getUrls } from 'shared';
import { env } from '$lib/server/environment';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.user && url.searchParams.has('destination')) {
    redirect(303, `/sso${url.search}`);
  }
  return {
    user: locals.user,
    dashboardOrigin: getUrls(env).frontend.dashboard,
    websiteOrigin: getUrls(env).frontend.landing
  };
};
