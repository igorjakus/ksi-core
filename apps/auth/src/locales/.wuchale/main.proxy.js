
            
            /** @typedef {() => Promise<import("wuchale/runtime").CatalogModule>} CatalogMod */
            /** @type {{[locale: string]: CatalogMod[]}} */
            const catalogs = {'en-us': [() => import('./main.0.en-us.compiled.js')],pl: [() => import('./main.0.pl.compiled.js')]}
            export const loadCatalog = (/** @type {number} */ loadID, /** @type {string} */ locale) => {
                return /** @type {CatalogMod} */ (/** @type {CatalogMod[]} */ (catalogs[locale])[loadID])()
            }
            export const loadCount = 1
            // not essential. in case it is needed and for debugging
            export const patterns = ["main"]
        