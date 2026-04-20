import { shallowMount } from '@vue/test-utils';
import LaunchTest from '../../components/launchtest.vue';

jest.mock('@shell/components/ResourceTable', () => ({
  name: 'ResourceTable',
  template: '<div></div>',
}));

jest.mock('@components/BadgeState', () => ({
  name: 'BadgeState',
  template: '<div></div>',
}));

describe('launchtest.vue - Unit Tests', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ issues: [] }),
      text: async () => '',
      status: 200,
      statusText: 'OK',
    });
    global.fetch = fetchMock;

    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.debug.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
    console.log.mockRestore();
    jest.clearAllMocks();
  });

  function mountComponent(resource = { name: 'test-resource' }, props = {}) {
    return shallowMount(LaunchTest, {
      props: { resource, ...props },
      global: {
        stubs: {
          ResourceTable: true,
          BadgeState: true,
        },
      },
    });
  }

  it('fetches tests and maps rows using shared jira helpers', async () => {
    const wrapper = mountComponent({
      labels: { name: 'my-label' },
    });

    await Promise.resolve();
    await Promise.resolve();

    fetchMock.mockClear();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [
            {
              key: 'MTQAXRAY-1',
              self: 'https://jira-stg.steelhome.internal/rest/api/2/issue/MTQAXRAY-1',
              fields: { summary: 'Test Plan 1' },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fields: {
            summary: 'Test Plan 1',
            description: 'Description 1',
            status: { name: 'Open' },
            priority: { name: 'High' },
            issuetype: { name: 'Test Plan' },
          },
        }),
      });

    await wrapper.vm.fetchtest();

    expect(wrapper.vm.values.test).toHaveLength(1);
    expect(wrapper.vm.testRows[0].url).toBe('https://jira-stg.steelhome.internal/browse/MTQAXRAY-1');
    expect(wrapper.vm.hasResources).toBe(true);
  });

  it('launches automation using the jira token helper', async () => {
    const wrapper = mountComponent();

    fetchMock.mockClear();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    });

    await wrapper.vm.launchTest({ id: 'MTQAXRAY-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://jira-stg.steelhome.internal/rest/cb-automation/latest/project/17707/rule/141/execute/MTQAXRAY-1',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Bearer /),
          'X-Atlassian-Token': 'no-check',
        }),
      })
    );
  });
});