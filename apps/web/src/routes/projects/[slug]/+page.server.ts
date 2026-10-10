import type { PageServerLoad } from './$types';
import { backendFetch } from 'shared/server';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const { slug } = event.params;
  const projectReq = await backendFetch(event, env, `/projects/${slug}`);
  
  if (!projectReq.ok) {
    throw error(projectReq.status, 'Project not found');
  }
  
  const project = await projectReq.json();
  
  return {
    project
  };
};
