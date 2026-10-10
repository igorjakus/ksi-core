import {getUrls} from 'shared';
import {env} from '$lib/server/environment';
export const load=()=>({dashboardOrigin:getUrls(env).frontend.dashboard,websiteOrigin:getUrls(env).frontend.landing});
