import { redirect, error, isRedirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { startSso, finishSso } from 'shared/server';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
  try {
    redirect(303, await finishSso(event, env));
  } catch (cause) {
    if (isRedirect(cause)) throw cause;
    error(400, 'Login expired. Please try again.');
  }
};
