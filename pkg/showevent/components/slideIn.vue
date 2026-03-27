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
    emits: ['close'],

    mounted() {
        this.openSlideIn();
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
            this.$emit('close');
        }
    },

    render() {
        return null; 
    }
};
</script>

<style scoped>
</style>
