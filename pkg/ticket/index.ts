import { importTypes } from '@rancher/auto-import';
import { IPlugin, PanelLocation, TabLocation,  } from '@shell/core/types';
import pkg from './package.json';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);
  plugin.metadata = {
    ...pkg,
  };

  // Provide plugin metadata from package.json
  // plugin.metadata = require('./package.json');

  plugin.addTab(
    TabLocation.RESOURCE_DETAIL_PAGE,
    {},
    {
      name: 'Tickets',
      weight: -5,
      component: () => import('./components/tickets.vue'),
    }
  );
  
  plugin.addPanel(
    PanelLocation.DETAIL_TOP,
    {},
    {
      component: () => import('./components/tickets.vue'),
    }
  );

  // Load a product
  // plugin.addProduct(require('./product'));
}
