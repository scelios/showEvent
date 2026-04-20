
import { installAvatarPatcher } from './components/avatarInstaller';
import { IPlugin } from '@shell/core/types';
import { importTypes } from '@rancher/auto-import';
import pkg from './package.json';
import icon from './User-Circle.svg';

export default function(plugin: IPlugin): void {
  importTypes(plugin);
  plugin.metadata = {
    ...pkg,
    icon: icon
  };
  installAvatarPatcher();
}