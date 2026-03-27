import { shallowMount } from '@vue/test-utils';
import ShowEventRancher from '../../components/showEventRancher.vue';

jest.mock('@shell/config/types', () => ({
  EVENT: 'event',
  NAMESPACE: 'namespace',
}));

jest.mock('@shell/config/table-headers', () => ({
  MESSAGE: {}, REASON: {},
}));

jest.mock('@shell/config/pagination-table-headers', () => ({
  STEVE_EVENT_FIRST_SEEN: {},
  STEVE_EVENT_LAST_SEEN: {},
  STEVE_EVENT_TYPE: {},
  STEVE_NAME_COL: {},
}));

jest.mock('@shell/store/type-map.utils', () => ({
  headerFromSchemaColString: () => ({}),
}));

describe('showEventRancher.vue (Vue 3)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    
    // Always create the element the component tries to verify visibility of
    const ext = document.createElement('div');
    ext.id = 'Recent Events ext';
    document.body.appendChild(ext);

    // Provide a default safe mock for fetch to prevent crashes on mount
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
      text: async () => '',
      status: 200,
      statusText: 'OK',
    });
  });

  function mountComp(resourceOverrides = {}) {
    const resource = {
      kind: 'SecretStore',
      type: 'secretstore',
      metadata: { name: 'x', namespace: 'ns', uid: 'uid-123' },
      ...resourceOverrides
    };

    return shallowMount(ShowEventRancher, {
      props: { resource },
      global: {
        stubs: {
          PaginatedResourceTable: true,
        },
        mocks: {
          $store: {
            getters: {
              currentStore: () => 'cluster',
              'cluster/schemaFor': () => ({ links: { collection: '/v1/events' } }),
              'i18n/t': () => 'x',
            },
            dispatch: jest.fn(),
          },
          $route: { fullPath: '/' },
        }
      }
    });
  }

  it('hides "Recent Events ext" when #events exists', async () => {
    const events = document.createElement('div');
    events.id = 'events';
    document.body.appendChild(events);

    const ext = document.createElement('div');
    ext.id = 'Recent Events ext';
    ext.style.display = '';
    document.body.appendChild(ext);

    const wrapper = mountComp();
    await wrapper.vm.$nextTick();

    wrapper.vm.checkVisibility();
    expect(document.getElementById('Recent Events ext').style.display).toBe('none');
  });

  it('shows "Recent Events ext" when #events does not exist', async () => {
    const ext = document.createElement('div');
    ext.id = 'Recent Events ext';
    ext.style.display = 'none';
    document.body.appendChild(ext);

    const wrapper = mountComp();
    await wrapper.vm.$nextTick();

    wrapper.vm.checkVisibility();
    expect(document.getElementById('Recent Events ext').style.display).toBe('');
  });

  it('emits count based on UID-filtered fetch result', async () => {
    const wrapper = mountComp();

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 1 }, { id: 2 }] }),
      text: async () => '',
      status: 200,
      statusText: 'OK',
    });

    await wrapper.vm.updateEventCount();

    const emits = wrapper.emitted('count') || [];
    expect(emits[emits.length - 1][0]).toBe(2);
  });

  it('emits 0 when fetch fails', async () => {
    const wrapper = mountComp();

    global.fetch.mockResolvedValue({
      ok: false,
      text: async () => 'fail',
      status: 500,
      statusText: 'Server Error',
    });

    await wrapper.vm.updateEventCount();

    const emits = wrapper.emitted('count') || [];
    expect(emits[emits.length - 1][0]).toBe(0);
  });
});