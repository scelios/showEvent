import { shallowMount } from '@vue/test-utils';

jest.mock('@shell/config/table-headers', () => ({
  STATE: {}, TYPE: {}, NAME: {}, NAMESPACE: {},
}));

jest.mock('@shell/config/product/explorer', () => ({
  NAME: 'explorer',
}));

jest.mock('@shell/plugins/dashboard-store/resource-class', () => ({
  __esModule: true,
  STATES_ENUM: { MISSING: 'missing' },
  colorForState: () => 'text-info',
  stateDisplay: () => 'Missing',
}));

jest.mock('@shell/utils/sort', () => ({
  sortableNumericSuffix: (x) => x,
}));

// Mock fetch globally to avoid ReferenceError
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ metadata: { relationships: [] } }),
  })
);

const LinkedResources = require('../../components/linkedressources.vue').default;

describe('linkedressources.vue (Vue 3)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ metadata: { relationships: [] } }),
      text: async () => '',
      status: 200,
      statusText: 'OK',
    });
  });

  afterEach(() => {
    console.debug.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  function mountComp(resource = { metadata: { relationships: [] } }) {
    return shallowMount(LinkedResources, {
      props: { resource },
      global: {
        stubs: {
          ResourceTable: true,
          BadgeState: true,
          RouterLink: true,
        },
        mocks: {
          $store: {
            getters: {
              clusterId: 'local',
              currentStore: () => 'cluster',
              'cluster/byId': () => null,
              'cluster/schemaFor': () => null,
            }
          },
          // provide minimal $route used by watcher
          $route: { fullPath: '/' },
        },
      }
    });
  }

  it('hides "Linked Resources" element when #related exists', async () => {
    const related = document.createElement('div');
    related.id = 'related';
    document.body.appendChild(related);

    const linked = document.createElement('div');
    linked.id = 'Linked Resources';
    linked.style.display = '';
    document.body.appendChild(linked);

    const wrapper = mountComp();
    await wrapper.vm.$nextTick();

    wrapper.vm.checkVisibility();
    expect(document.getElementById('Linked Resources').style.display).toBe('none');
  });

  it('keeps "Linked Resources" displayed when #related does not exist', async () => {
    const linked = document.createElement('div');
    linked.id = 'Linked Resources';
    linked.style.display = 'none';
    document.body.appendChild(linked);

    const wrapper = mountComp();
    await wrapper.vm.$nextTick();

    wrapper.vm.checkVisibility();
    expect(document.getElementById('Linked Resources').style.display).toBe('');
  });

  it('loads relationships from the api response', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        metadata: {
          relationships: [
            { fromId: 'ns-a/source-a', fromType: 'configmap', state: 'active' },
            { toId: 'ns-b/target-b', toType: 'secret', state: 'active' },
          ]
        }
      }),
      text: async () => '',
      status: 200,
      statusText: 'OK',
    });

    const wrapper = mountComp({
      metadata: {
        relationships: [],
      },
      links: { self: '/v1/configmaps/ns-a/source-a' },
    });

    global.fetch.mockClear();
    await wrapper.vm.loadLinkedResources();

    expect(global.fetch).toHaveBeenCalled();
    expect(wrapper.vm.referredToByResources).toHaveLength(1);
    expect(wrapper.vm.refersToResources).toHaveLength(1);

    const emits = wrapper.emitted('counts') || [];
    expect(emits[emits.length - 1][0]).toEqual({ referredToBy: 1, refersTo: 1 });
  });

  it('uses api relationships even when resource metadata is empty', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        metadata: {
          relationships: [
            { fromId: 'ns-a/source-a', fromType: 'configmap', state: 'active' },
            { toId: 'target-b', toType: 'secret', state: 'active' },
          ]
        }
      }),
      text: async () => '',
      status: 200,
      statusText: 'OK',
    });

    const wrapper = mountComp({
      metadata: { relationships: [] },
      links: { self: '/v1/configmaps/ns-a/source-a' },
    });

    await wrapper.vm.loadLinkedResources();

    expect(global.fetch).toHaveBeenCalled();
    expect(wrapper.vm.referredToByResources).toHaveLength(1);
    expect(wrapper.vm.refersToResources).toHaveLength(1);

    const emits = wrapper.emitted('counts') || [];
    expect(emits[emits.length - 1][0]).toEqual({ referredToBy: 1, refersTo: 1 });
  });

  it('parses namespaced and non-namespaced resource ids consistently', () => {
    const wrapper = mountComp();

    expect(wrapper.vm.parseResourceId('ns-a/name-a')).toEqual({ namespace: 'ns-a', name: 'name-a' });
    expect(wrapper.vm.parseResourceId('cluster-wide-name')).toEqual({ namespace: undefined, name: 'cluster-wide-name' });
    expect(wrapper.vm.parseResourceId('ns-a/path/with/slashes')).toEqual({ namespace: 'ns-a', name: 'path/with/slashes' });
  });
});