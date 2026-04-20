import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
// Import assets and JSON at the top level
import pkg from './package.json';
// import icon from './eyes.svg';

// Init the package
export default function(plugin: IPlugin): void {
  importTypes(plugin);

  plugin.metadata = {
    ...pkg,
    // icon: icon
  };

  // plugin.addPanel(
  //   PanelLocation.DETAIL_TOP,
  //   {},
  //   { component: () => import('./components/showEventRancher.vue') }
  // );
}
