import { importTypes } from '@rancher/auto-import';
import { IPlugin, PanelLocation, TabLocation } from '@shell/core/types';
import pkg from './package.json';
import icon from './eyes.svg';



export default function(plugin: IPlugin): void {
  importTypes(plugin);
  plugin.metadata = {
    ...pkg,
    icon: icon
  };
  
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL_PAGE,
    {},
    {
      name: 'Linked Resources',
      weight: -5,
      component: () => import('./components/linkedressources.vue'),
    }
  );

  plugin.addTab(
    TabLocation.RESOURCE_DETAIL_PAGE,
    {},
    {
      name: 'Recent Events ext',
      weight: -5,
      component: () => import('./components/showEventRancher.vue'),
    }
  );

  

  // plugin.addTab(
  //   TabLocation.RESOURCE_DETAIL_PAGE,
  //   {},
  //   {
  //     name: 'Related Tickets',
  //     weight: -5,
  //     component: () => import('./components/tickets.vue'),
  //   }
  // );

  plugin.addPanel(
    PanelLocation.DETAIL_TOP,
    {},
    { component: () => import('./components/panelWithTabs.vue') }
  );
}