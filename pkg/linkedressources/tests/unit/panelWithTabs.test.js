import { shallowMount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { h } from 'vue';

import PanelWithTabs from '../../components/panelWithTabs.vue';

describe('panelWithTabs.vue (Vue 3)', () => {
  function makeRouter() {
    return createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'home', component: { render: () => h('div') } },
        { path: '/x', name: 'x', component: { render: () => h('div') } },
      ]
    });
  }

  async function mountWithHash(hash) {
    // No need to set window.location.hash manually if we use the router
    const router = makeRouter();
    
    // Push the route INCLUDING the hash
    await router.push({ path: '/', hash: hash }); 
    await router.isReady();

    return shallowMount(PanelWithTabs, {
      props: { resource: {} },
      global: {
        plugins: [router],
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
    await wrapper.vm.$nextTick(); // Allow watcher to update isHidden to true if needed for intermediate check

    await wrapper.vm.$router.push('/x'); 
    await wrapper.vm.$nextTick(); 

    // Navigation to '/x' clears the hash, so the panel should SHOW again.
    expect(wrapper.vm.isHidden).toBe(false); 
  });
});