import { shallowMount } from '@vue/test-utils';
import { h } from 'vue';

import PanelWithTabs from '../../components/panelWithTabs.vue';

describe('panelWithTabs.vue (Vue 3)', () => {
  async function mountWithHash(hash) {
    window.location.hash = hash;

    return shallowMount(PanelWithTabs, {
      props: { resource: {} },
      global: {
        mocks: {
          $route: { fullPath: '/' },
        },
        stubs: {
          Tabbed: { render() { return h('div', this.$slots.default ? this.$slots.default() : []) } },
          Tab: { render() { return h('div', this.$slots.default ? this.$slots.default() : []) } },
          LinkedResourcesCore: true,
          showEventRancher: true,
        }
      }
    });
  }

  it('hides panel when window.location.hash is present', async () => {
    const wrapper = await mountWithHash('#events');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isHidden).toBe(true);
    
    // verify the element is not rendered
    expect(wrapper.find('.panel-header').exists()).toBe(false); 
  });

  it('shows panel when window.location.hash is empty', async () => {
    const wrapper = await mountWithHash('');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isHidden).toBe(false);
    expect(wrapper.find('.panel-header').exists()).toBe(true);
  });

  it('reacts to route change and re-evaluates hash', async () => {
    const wrapper = await mountWithHash('');
    expect(wrapper.vm.isHidden).toBe(false);

    window.location.hash = '#related';
    wrapper.vm.detectNativeTabs();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.isHidden).toBe(true);

    window.location.hash = '';
    wrapper.vm.detectNativeTabs();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.isHidden).toBe(false); 
  });
});