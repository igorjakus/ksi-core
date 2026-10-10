import {env as privateEnvironment} from '$env/dynamic/private';
import {env as publicEnvironment} from '$env/dynamic/public';
export const env:Record<string,string|undefined>={...privateEnvironment,...publicEnvironment};
