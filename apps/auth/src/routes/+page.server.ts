import { getUrls } from 'shared';
import { env } from '$env/dynamic/private';
export const load = () => ({ dashboardOrigin: getUrls(env).frontend.dashboard });
