import { importTypes } from '@rancher/auto-import';
import { IPlugin, PanelLocation} from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin): void {
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.addPanel(
    PanelLocation.DETAIL_TOP,
    { },
    { component: () => import('./components/showEvent.vue') }
  );
  plugin.metadata.icon = require('./eyes.svg');
}
