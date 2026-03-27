import { shallowMount } from '@vue/test-utils';
import LinkedResources from '../../components/linkedressources.vue';

jest.mock('@shell/config/table-headers', () => ({
  STATE: {}, TYPE: {}, NAME: {}, NAMESPACE: {},
}));

jest.mock('@shell/config/product/explorer', () => ({
  NAME: 'explorer',
}));

jest.mock('@shell/plugins/dashboard-store/resource-class', () => ({
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

describe('linkedressources.vue (Vue 3)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  function mountComp() {
    return shallowMount(LinkedResources, {
      props: { resource: { metadata: { relationships: [] } } },
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

  it('shows "Linked Resources" element when #related does not exist', async () => {
    const linked = document.createElement('div');
    linked.id = 'Linked Resources';
    linked.style.display = 'none';
    document.body.appendChild(linked);

    const wrapper = mountComp();
    await wrapper.vm.$nextTick();

    wrapper.vm.checkVisibility();
    expect(document.getElementById('Linked Resources').style.display).toBe('');
  });
});