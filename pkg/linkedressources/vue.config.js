// vue.config.js
const base = require('./.shell/pkg/vue.config')(__dirname);

// Reduce memory pressure in CI
base.parallel = false;

// Source maps increase memory & output size; usually not needed for packaging
base.productionSourceMap = false;

// Suppress Sass deprecation warnings coming from shell dependency styles.
base.css = base.css || {};
base.css.loaderOptions = base.css.loaderOptions || {};
const existingSassLoaderOptions = base.css.loaderOptions.sass || {};
const existingScssLoaderOptions = base.css.loaderOptions.scss || {};

const sassDeprecationOptions = {
  quietDeps: true,
  silenceDeprecations: ['import', 'if-function', 'legacy-js-api', 'global-builtin', 'slash-div']
};

base.css.loaderOptions.sass = {
  ...existingSassLoaderOptions,
  sassOptions: {
    ...(existingSassLoaderOptions.sassOptions || {}),
    ...sassDeprecationOptions
  }
};

const scssAdditionalData = existingScssLoaderOptions.additionalData || existingSassLoaderOptions.additionalData;

base.css.loaderOptions.scss = {
  ...existingScssLoaderOptions,
  ...(scssAdditionalData ? { additionalData: scssAdditionalData } : {}),
  sassOptions: {
    ...(existingScssLoaderOptions.sassOptions || {}),
    ...sassDeprecationOptions
  }
};

module.exports = base;