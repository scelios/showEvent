import { importTypes } from '@rancher/auto-import';
import { IPlugin, CardLocation, TabLocation, PanelLocation, ActionLocation, ActionOpts} from '@shell/core/types';
import fileToRender from './components/showEvent.vue';

// Init the package
export default function(plugin: IPlugin): void {
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

//   plugin.addAction(
//   ActionLocation.TABLE,
//   {  }, 
//   {
//     label:    'Show Event',
//     icon:     'icon-show',
//     enabled(ctx: any) {
//       return true;
//     },
//     invoke(opts: ActionOpts, values: any[], globals: any) {
//       // render the fileToRender component
//       const shell = (window as any).$globalApp?.$shell;
//       if (shell?.slideIn) {
//         shell.slideIn.open(fileToRender, {
//           props: { resource: values[0] },
//           title: 'Show Event',
//           width: '80%'
//         });
//       } else {
//         console.error("Could not find shell instance to open slide-in", shell);
//       }
//     }
//   }
// );
//   plugin.addTab( 
//   TabLocation.RESOURCE_SHOW_CONFIGURATION,
//   {  }, 
//   {
//     name:       'show',
//     labelKey:   'plugin-examples.tab-label',
//     label:      'some-label',
//     weight:     -5,
//     showHeader: true,
//     tooltip:    'this is a tooltip message',
//     component:  () => import('./components/showEvent.vue')
//   }
// );
//   plugin.addTab( 
//     TabLocation.RESOURCE_DETAIL_PAGE,
//     {  }, 
//     {
//       name:       'resource-detail-page',
//       labelKey:   'plugin-examples.tab-label',
//       label:      'some-label',
//       weight:     -5,
//       showHeader: true,
//       tooltip:    'this is a tooltip message',
//       component:  () => import('./components/showEvent.vue')
//     }
//   );
//   plugin.addCard(
//   CardLocation.CLUSTER_DASHBOARD_CARD,
//   { },
//   {
//     label:     'some-label',
//     labelKey:  'generic.comingSoon',
//     component: () => import('./components/showEvent.vue')
//   }
// );
plugin.addPanel(
  PanelLocation.DETAIL_TOP,
  { },
  { component: () => import('./components/showEvent.vue') }
);
  // plugin.addProduct(require('./product'));
  plugin.metadata.icon = require('./eyes.svg');
}
