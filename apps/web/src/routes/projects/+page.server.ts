import type { PageServerLoad } from './$types';
import { backendFetch } from 'shared/server';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async (event) => {
  const projectsReq = await backendFetch(event, env, '/projects');
  let projects = [];
  if (projectsReq.ok) {
    const data = await projectsReq.json();
    projects = data.projects || data || [];
  }
  
  return {
    projects
  };
};
