import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getUrls } from 'shared';
export const load = () => redirect(303, `${getUrls(env).frontend.dashboard}/`);
