<script lang="ts">
 import {onMount} from 'svelte';
 import {SunMoon} from '@lucide/svelte';
 import Dropdown from './Dropdown.svelte';
 import {observeTheme,setThemePreference,type ThemePreference} from './theme';
 let {language='pl'}:{language?:'pl'|'en'}=$props();
 let preference=$state<ThemePreference>('system');
 const text=(pl:string,en:string)=>language==='pl'?pl:en;
 onMount(()=>observeTheme(theme=>preference=theme));
</script>
<div class="theme-selector"><Dropdown variant="compact" label={text('Wygląd','Appearance')} value={preference} options={[{value:'system',label:text('Systemowy','System')},{value:'light',label:text('Jasny','Light')},{value:'dark',label:text('Ciemny','Dark')}]} onselect={value=>setThemePreference(value as ThemePreference)}>{#snippet leading()}<SunMoon size={15} aria-hidden="true"/>{/snippet}</Dropdown></div>
<style>.theme-selector{min-width:108px;}@media(max-width:480px){.theme-selector{min-width:90px;}}</style>
