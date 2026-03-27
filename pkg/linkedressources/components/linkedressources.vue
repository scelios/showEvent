<template>
  <div class="extension-container">
    <div v-if="isLoading">
      <i class="icon icon-spinner icon-spin" /> Loading linked resources...
    </div>
  
    <div
      v-else-if="errorMessage"
      class="error"
    >
      {{ errorMessage }}
    </div>
  
    <div v-else-if="!hasResources">
      No linked resources found for this resource.
    </div>
  
    <div v-else>
      <div
        v-if="referredToByResources.length > 0"
        class="mb-20"
      >
        <h3>Referred To By</h3>
        <ResourceTable
          :schema="null"
          :rows="referredToByRows"
          :headers="headers"
          :search="false"
          :table-actions="false"
          :row-actions="false"
          :paging="false"
          :groupable="false"
          :namespaced="true"
        >
          <template #cell:state="{ row }">
            <BadgeState :value="row" />
          </template>
  
          <template #cell:name="{ row }">
            <router-link
              v-if="row.detailLocation"
              :to="row.detailLocation"
            >
              {{ row.nameDisplay }}
            </router-link>
            <span v-else>
              {{ row.nameDisplay }}
            </span>
          </template>
        </ResourceTable>
      </div>
  
      <div
        v-if="refersToResources.length > 0"
        class="mb-20"
      >
        <h3>Refers To</h3>
        <ResourceTable
          :schema="null"
          :rows="refersToRows"
          :headers="headers"
          :search="false"
          :table-actions="false"
          :row-actions="false"
          :paging="false"
          :groupable="false"
          :namespaced="true"
        >
          <template #cell:state="{ row }">
            <BadgeState :value="row" />
          </template>
  
          <template #cell:name="{ row }">
            <router-link
              v-if="row.detailLocation"
              :to="row.detailLocation"
            >
              {{ row.nameDisplay }}
            </router-link>
            <span v-else>
              {{ row.nameDisplay }}
            </span>
          </template>
        </ResourceTable>
      </div>
    </div>
  </div>
</template>
  
  
  <script>
  import { STATES_ENUM, colorForState, stateDisplay as stateDisplayFn } from '@shell/plugins/dashboard-store/resource-class';
  import { buildApiUrlFromSelfLink , getApiUrlFromBrowserUrl } from './apiUrlHelpers';
  import ResourceTable from '@shell/components/ResourceTable';
  import { BadgeState } from '@components/BadgeState';
  import { STATE, TYPE, NAME, NAMESPACE } from '@shell/config/table-headers';
  import { NAME as EXPLORER } from '@shell/config/product/explorer';
  import { sortableNumericSuffix } from '@shell/utils/sort';
  
  async function fetchJson(url) {
    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
  
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`GET ${url} failed: ${resp.status} ${resp.statusText}: ${text}`);
    }
  
    return await resp.json();
  }

  export default {
      name: 'LinkedResources',
      components: {
          ResourceTable,
          BadgeState
      },
      props: {
          resource: {
              type: Object,
              required: true
          },
          apiUrl: {
              type: String,
              default: ''
          }
      },
      emits: ['counts'],
      data() {
          return {
              isLoading: false,
              errorMessage: '',
              referredToByResources: [],
              refersToResources: [],
          };
      },
      computed: {
          resourceName() {
              return this.resource?.metadata?.name || this.resource?.name || '';
          },
          resourceNamespace() {
              return this.resource?.metadata?.namespace || this.resource?.namespace || '';
          },
          resourceKind() {
              return this.resource?.kind || this.resource?.type || '';
          },
          headers() {
              return [STATE, TYPE, NAME, NAMESPACE];
          },
          hasResources() {
              return this.referredToByResources.length > 0 || this.refersToResources.length > 0;
          },
          referredToByRows() {
              return this.mapResourcesToRows(this.referredToByResources);
          },
          refersToRows() {
              return this.mapResourcesToRows(this.refersToResources);
          }
      },
  
      // Re-fetch if the user creates a new event or switches tabs
      watch: {
        $route: {
          handler() {
            this.checkVisibility();
          },
          immediate: true
        },
        resource: {
          handler() {
            this.loadLinkedResourcesFromRelationships();
          },
          deep: false
        }
      },
  
      mounted() {
      this.checkVisibility();
      this.loadLinkedResourcesFromRelationships();
    },
  
      methods: {
        checkVisibility(){
          if (document.getElementById('related')) {
                document.getElementById('Linked Resources').style.display = 'none';
          }
          else {
            document.getElementById('Linked Resources').style.display = '';
          }
        },
        async getRelationshipsFromObj(resourceObj) {
          if (!resourceObj || !resourceObj.links?.self) {
            console.warn("Resource has no self link", resourceObj);
            return { referredToBy: [], refersTo: [] };
          }
  
          const selfLink = resourceObj.links.self;
          // if (!selfLink){
          //   selflink = getApiUrlFromBrowserUrl(window.location.href);
          // }
          
          const url = buildApiUrlFromSelfLink(selfLink, {
            exclude: 'metadata.managedFields',
          });
  
          const obj = await fetchJson(url);
          const relationships = obj?.metadata?.relationships || [];
          return this.getRelationships(relationships);
        },
  
        async fetchLinkedResources() {
          // This is a backup method that tries to fetch the full resource and read relationships from metadata
          try {
            this.isLoading = true;
            this.errorMessage = '';
            
            this.referredToByResources = [];
            this.refersToResources = [];
            
            const selfLink =
                  this.resource?.links?.self ||
                  window.location.href;
  
            let url = buildApiUrlFromSelfLink(selfLink, {
                  exclude: 'metadata.managedFields',
              });
               if (!url) {
                   const link = getApiUrlFromBrowserUrl(window.location.href);
                   if (link) {
                       url = link.includes('?') ? link : link + '?exclude=metadata.managedFields';
                   }
              }
  
            if (!url) {
              throw new Error('Resource has no links.self or url; cannot build API URL reliably.');
            }
            
            const obj = await fetchJson(url);
            const { referredToBy, refersTo } = await this.getRelationshipsFromObj(obj);
            console.debug('Fetched relationships:', { referredToBy, refersTo });
            this.referredToByResources = referredToBy;
            this.refersToResources = refersTo;
          } catch (e) {
            console.error('Error fetching linked resources:', e);
            this.errorMessage = e?.message || 'Failed to fetch linked resources.';
            this.referredToByResources = [];
            this.refersToResources = [];
          } finally {
            this.isLoading = false;
          }
        },
  
        async loadLinkedResourcesFromRelationships() {
          try {
            this.isLoading = true;
            this.errorMessage = '';
  
            const relationships = this.resource?.metadata?.relationships || [];
            const { referredToBy, refersTo } = this.getRelationships(relationships);
            if (referredToBy.length === 0 && refersTo.length === 0) {
              console.debug('No relationships found in metadata, falling back to fetch method');
              await this.fetchLinkedResources();
              return;
            }
  
            this.referredToByResources = referredToBy;
            this.refersToResources = refersTo;
            this.$emit('counts', {
              referredToBy: this.referredToByResources.length,
              refersTo: this.refersToResources.length,
            });
            console.debug('Parsed relationships from metadata:', { referredToBy, refersTo });
          } catch (e) {
            this.errorMessage = e?.message || 'Failed to read linked resources.';
            this.referredToByResources = [];
            this.refersToResources = [];
          } finally {
            this.isLoading = false;
          }
        },
  
        mapResourcesToRows(resources) {
          const cluster = this.$store.getters['clusterId'];
          const inStore = this.$store.getters['currentStore']();
  
          return (resources || []).map((r) => {
            const type = r.type;
            const id = r.id;
  
            let namespace = r.namespace;
            let name = r.name;
  
            if (!name) {
              const raw = String(id);
              if (raw.includes('/')) {
                const parts = raw.split('/');
                namespace = namespace || parts[0];
                name = parts.slice(1).join('/');
              } else {
                name = raw;
              }
            }
  
            // Try to find the actual resource in the store (no network if already cached)
            const inStoreState = this.$store.getters[`${inStore}/byId`](type, id)?.state;
  
            const finalState = r.state || inStoreState || STATES_ENUM.MISSING;
            const stateColor = colorForState(finalState, r.error, r.transitioning);
  
            const schema = this.$store.getters[`${inStore}/schemaFor`](type);
            const typeDisplay = schema ? this.$store.getters['type-map/labelFor'](schema) : type;
  
            const detailLocation = {
              name: `c-cluster-product-resource${namespace ? '-namespace' : ''}-id`,
              params: {
                product:  EXPLORER,
                cluster:  inStore === 'management' ? 'local' : cluster,
                resource: type,
                namespace,
                id: name,
              }
            };
  
            if (!detailLocation.params.namespace) {
              delete detailLocation.params.namespace;
            }
  
            return {
              type,
              id,
              metadata: { name, namespace },
  
              // for table columns
              name,
              namespace,
              typeDisplay,
  
              // state badge
              state: finalState,
              stateDisplay: stateDisplayFn(finalState),
              stateBackground: stateColor.replace('text-', 'bg-'),
  
              // misc
              nameDisplay: name,
              nameSort: sortableNumericSuffix(name).toLowerCase(),
              _key: `${type}/${namespace || ''}/${name}`,
              detailLocation,
            };
          });
        },
  
        getRelationships(relationships) {
        const referredToBy = [];
        const refersTo = [];

        for (const r of (relationships || [])) {
            const common = {
            rel: r.rel,
            state: r.state,
            message: r.message,
            error: r.error,
            transitioning: r.transitioning,
            };

            // "Referred To By" == things that point *to* this resource => relationship has from*
            if (r.fromId && r.fromType) {
            const raw = String(r.fromId);
            const [namespace, name] = raw.includes('/') ? raw.split('/', 2) : [undefined, raw];

            referredToBy.push({
                ...common,
                type: r.fromType,
                id: r.fromId,
                namespace,
                name,
                direction: 'referredToBy',
            });
            }

            // "Refers To" == things this resource points to => relationship has to*
            if (r.toId && r.toType) {
            const raw = String(r.toId);
            const [namespace, name] = raw.includes('/') ? raw.split('/', 2) : [undefined, raw];

            refersTo.push({
                ...common,
                type: r.toType,
                id: r.toId,
                namespace,
                name,
                direction: 'refersTo',
            });
          }
        }

        return { referredToBy, refersTo };
        },
      }
  };
  
  </script>
  
  <style scoped>
  .extension-container {
      padding: 20px;
  }
  
  .error {
      color: #dc3545;
      padding: 10px;
      background: #ffe6e6;
      border-radius: 4px;
  }
  </style>