<template>
  <div
    v-if="!isHidden"
    class="mt-20"
  >
    <div class="panel-header">
      <h3 class="m-0">
        Extensions
      </h3>

      <button
        class="btn btn-sm role-link"
        type="button"
        @click="open = !open"
      >
        {{ open ? 'Hide' : 'Show' }}
      </button>
    </div>

    <transition name="collapse">
      <div
        v-show="open"
        class="panel-body"
      >
        <Tabbed
          :default-tab="'linked'"
          :use-hash="false"
          :show-extension-tabs="false"
        >
          <Tab
            name="linked"
            :label="`Linked Resources${linkedCount ? ` (${linkedCount})` : ''}`"
            :weight="1"
          >
            <LinkedResourcesCore
              :resource="resource"
              @counts="onLinkedCounts"
            />
          </Tab>

          <Tab
            name="events"
            :label="`Events${eventCount ? ` (${eventCount})` : ''}`"
            :weight="2"
          >
            <showEventRancher
              :resource="resource"
              @count="onEventCount"
            />
          </Tab>
        </Tabbed>
      </div>
    </transition>
  </div>
</template>

<script>
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import LinkedResourcesCore from './linkedressources.vue';
import showEventRancher from './showEventRancher.vue';


export default {
  name: 'LinkedResourcesPanelWithTabs',
  components: { Tabbed, Tab, LinkedResourcesCore, showEventRancher },

  props: {
    resource: { type: Object, required: false, default: null }
  }, 

  data() {
    return {
      open: false,
      linkedCount: 0,
      eventCount: 0,
      isHidden: false,
    };
  },

  watch: {
    $route: {
      handler() {
        this.detectNativeTabs();
      },
      immediate: true
    }
  },

  mounted() {
    this.detectNativeTabs();
  },

  methods: {
    onLinkedCounts({ referredToBy, refersTo }) {
      this.linkedCount = (referredToBy || 0) + (refersTo || 0);
    },

    onEventCount(count) {
      this.eventCount = count || 0;
    },

    detectNativeTabs() {
      // Look for visible native tab links (hash-based)
      if (window.location.hash) {
        this.isHidden = true;
      }
      else {
        this.isHidden = false;
      }
    },
  }
};
</script>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-body {
  margin-top: 10px;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 250ms ease, opacity 200ms ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 2000px;
  opacity: 1;
}
</style>