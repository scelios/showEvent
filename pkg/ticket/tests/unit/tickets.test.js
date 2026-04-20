import { shallowMount } from '@vue/test-utils';
import Tickets from '../../components/tickets.vue';
import mockdata from '../../components/jqlOutput.json';
import mockIssueData from '../../components/issueOutput.json';

jest.mock('@shell/components/ResourceTable', () => ({
  name: 'ResourceTable',
  template: '<div></div>',
}));

jest.mock('@components/BadgeState', () => ({
  name: 'BadgeState',
  template: '<div></div>',
}));

describe('Tickets.vue - Unit Tests', () => {
  let fetchMock;

  beforeEach(() => {
    // Mock fetch globally
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
    jest.clearAllMocks();
  });

  function mountComponent(resource = { name: 'test-resource' }, props = {}) {
    return shallowMount(Tickets, {
      props: { resource, ...props },
      global: {
        stubs: {
          ResourceTable: true,
          BadgeState: true,
        },
      },
    });
  }

  it('fetches tickets and filters out test-related issues', async () => {
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
              key: 'MTSRE-1',
              self: 'https://jira-stg.steelhome.internal/rest/api/2/issue/MTSRE-1',
              fields: { summary: 'Normal Ticket' },
            },
            {
              key: 'MTSRE-2',
              self: 'https://jira-stg.steelhome.internal/rest/api/2/issue/MTSRE-2',
              fields: { summary: 'Test Issue' },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fields: {
            summary: 'Normal Ticket',
            description: 'Description 1',
            status: { name: 'Open' },
            priority: { name: 'High' },
            issuetype: { name: 'Bug' },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fields: {
            summary: 'Test Issue',
            description: 'Description 2',
            status: { name: 'Open' },
            priority: { name: 'High' },
            issuetype: { name: 'Test' },
          },
        }),
      });

    await wrapper.vm.fetchTickets();

    expect(wrapper.vm.values.tickets).toHaveLength(1);
    expect(wrapper.vm.values.tickets[0].name).toBe('Normal Ticket');
    expect(wrapper.vm.ticketRows[0].url).toBe('https://jira-stg.steelhome.internal/browse/MTSRE-1');
    expect(wrapper.vm.hasResources).toBe(true);
  });
});