import { shallowMount } from '@vue/test-utils';
import ShowEvent from '../../components/showEvent.vue';

describe('showEvent.vue - Sorting Logic', () => {
  let wrapper;
  let mockDispatch;

  const mockResource = {
    metadata: { name: 'test-pod', namespace: 'default' },
    kind: 'Pod'
  };

  // Mock data with different dates and reasons to test sorting
  const mockEvents = [
    {
      id: '1',
      involvedObject: { name: 'test-pod', kind: 'Pod', namespace: 'default' },
      message: 'Event B',
      reason: 'B_Reason',
      type: 'Normal',
      lastTimestamp: '2023-01-01T10:00:00Z' // Older
    },
    {
      id: '2',
      involvedObject: { name: 'test-pod', kind: 'Pod', namespace: 'default' },
      message: 'Event A',
      reason: 'A_Reason',
      type: 'Warning',
      lastTimestamp: '2023-01-02T10:00:00Z' // Newer
    }
  ];

  beforeEach(async () => {
    mockDispatch = jest.fn().mockResolvedValue(mockEvents);
    
    wrapper = shallowMount(ShowEvent, {
      props: { resource: mockResource },
      global: {
        mocks: {
          $store: { dispatch: mockDispatch }
        }
      }
    });

    // Wait for mounted() and fetchEvents() to resolve
    await new Promise(resolve => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();
  });

  it('sorts by date in descending order by default (Newest first)', () => {
    const rows = wrapper.findAll('tbody tr');
    // Event 2 (Jan 2nd) should be first, Event 1 (Jan 1st) second
    expect(rows.at(0).text()).toContain('Event A'); 
    expect(rows.at(1).text()).toContain('Event B');
  });

  it('reverses order to ascending when date header is clicked', async () => {
    const dateHeader = wrapper.find('th'); // First TH is date
    await dateHeader.trigger('click'); // Change to 'asc'

    const rows = wrapper.findAll('tbody tr');
    // Event 1 (Jan 1st) should now be first
    expect(rows.at(0).text()).toContain('Event B');
    expect(rows.at(1).text()).toContain('Event A');
  });

  it('sorts by Reason alphabetically when Reason header is clicked', async () => {
    // Find the Reason header (3rd column)
    const headers = wrapper.findAll('th');
    const reasonHeader = headers.at(2); 
    
    await reasonHeader.trigger('click'); // Set sortKey to 'reason', order 'asc'

    const rows = wrapper.findAll('tbody tr');
    expect(rows.at(0).text()).toContain('A_Reason');
    expect(rows.at(1).text()).toContain('B_Reason');
    
    // Click again to toggle descending
    await reasonHeader.trigger('click');
    const reversedRows = wrapper.findAll('tbody tr');
    expect(reversedRows.at(0).text()).toContain('B_Reason');
  });

  it('updates the sort icon state correctly', async () => {
    const reasonHeader = wrapper.findAll('th').at(2);
    await reasonHeader.trigger('click');

    const icon = reasonHeader.find('.sort-icon');
    expect(icon.classes()).toContain('active');
    expect(icon.text()).toBe('▲'); // Ascending
  });
});
