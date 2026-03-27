declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '*.jpg';
declare module '*.png';
declare module '*.svg';

declare module '*.json' {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const value: any;
  export default value;
}
