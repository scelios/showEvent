<template>
    <!-- renderless -->
</template>

<script>
import { useShell } from '@shell/apis';
import fileToRender from './showEvent.vue';

export default {
    props: {
        resource: {
            type: Object,
            required: true
        }
    },

    mounted() {
        this.openSlideIn();
    },

    render() {
        return null; // This component triggers a side-effect (opening slide-in) and doesn't render anything itself
    },

    methods: {
        openSlideIn() {
            const shell = useShell(); 
            shell.slideIn.open(fileToRender, {
                resource: this.resource,
                props: { resource: this.resource },
                title: 'Show Events',
                width: '80%'
            });
            // Emit an event to indicate the action is closed/done if this component is used in a way that expects it,
            // though typically action components are transient.
            this.$emit('close');
        }
    }
};
</script>

<style scoped>
</style>