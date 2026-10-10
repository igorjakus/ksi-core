import { redirect, error } from '@sveltejs/kit';
import {env} from '$lib/server/environment';
import { backendFetch } from 'shared/server';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) {
    if (event.url.searchParams.get('prompt') === 'none') {
      const { getUrls } = await import('shared');
      const destination = new URL(event.url.searchParams.get('destination') ?? '');
      if (
        ![getUrls(env).frontend.landing, getUrls(env).frontend.dashboard].includes(
          destination.origin
        ) ||
        destination.pathname !== '/sso/callback'
      )
        error(400, 'Invalid destination');
      destination.searchParams.set('guest', 'true');
      destination.searchParams.set('state', event.url.searchParams.get('state') ?? '');
      redirect(303, destination.href);
    }
    redirect(303, `/?${event.url.searchParams}`);
  }
  const response = await backendFetch(event, env, '/sso/authorize', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: event.request.headers.get('cookie') ?? ''
    },
    body: JSON.stringify({
      destination: event.url.searchParams.get('destination'),
      state: event.url.searchParams.get('state'),
      challenge: event.url.searchParams.get('challenge')
    })
  });
  if (!response.ok) error(response.status, 'Logowanie wygasło lub cel nie jest dozwolony.');
  const { code, state } = await response.json();
  const destination = new URL(event.url.searchParams.get('destination')!);
  destination.searchParams.set('code', code);
  destination.searchParams.set('state', state);
  redirect(303, destination.href);
};
