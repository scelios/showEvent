const config = require('@rancher/shell/vue.config'); // eslint-disable-line @typescript-eslint/no-var-requires

const base = config(__dirname, {
  excludes: [],
  // excludes: ['fleet', 'example']
});

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
