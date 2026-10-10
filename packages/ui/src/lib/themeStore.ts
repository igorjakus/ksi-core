import {writable} from 'svelte/store';
import {observeTheme,setThemePreference,type ThemePreference} from './platform/theme.js';
const store=writable<'light'|'dark'>('light');
export const themeStore={subscribe:store.subscribe,set:setThemePreference,initialize:()=>observeTheme(()=>store.set(document.documentElement.dataset.theme==='dark'?'dark':'light')),toggle:()=>setThemePreference(document.documentElement.dataset.theme==='dark'?'light':'dark'),setPreference:(value:ThemePreference)=>setThemePreference(value)};
