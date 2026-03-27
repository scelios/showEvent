// vue.config.js
const base = require('./.shell/pkg/vue.config')(__dirname);

// Reduce memory pressure in CI
base.parallel = false;

// Source maps increase memory & output size; usually not needed for packaging
base.productionSourceMap = false;

module.exports = base;