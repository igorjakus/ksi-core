import { redirect, error, isRedirect } from '@sveltejs/kit';
import { env } from '$lib/server/environment';
import { finishSso } from 'shared/server';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async (event) => {
  try {
    redirect(303, await finishSso(event, env));
  } catch (cause) {
    if (isRedirect(cause)) throw cause;
    error(400, 'Login expired. Please try again.');
  }
};
