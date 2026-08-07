<template>
  <ConfigurationSection
    icon="power-off"
    :title="$t('configuration-section-instance')"
    :lead="$t('configuration-section-instance-lead')"
    title-id="config-instance-title"
  >
    <dl v-if="version" class="config-meta config-meta--inline">
      <div class="config-meta__row">
        <dt>{{ $t('configuration-instance-version') }}</dt>
        <dd>{{ version }} <span v-if="buildVariant">({{ buildVariant }})</span></dd>
      </div>
      <div v-if="memory" class="config-meta__row">
        <dt>{{ $t('home-memory') }}</dt>
        <dd>{{ memory }}</dd>
      </div>
    </dl>

    <div class="config-instance-actions">
      <button
        v-if="updatesEnabled && canUpdate"
        type="button"
        class="config-action-row"
        @click="$emit('request-action', 'update')"
      >
        <span class="config-action-row__icon" aria-hidden="true">
          <FontAwesomeIcon icon="cloud-download-alt" fixedWidth></FontAwesomeIcon>
        </span>
        <span class="config-action-row__title">{{ $t('update') }}</span>
      </button>

      <button type="button" class="config-action-row" @click="$emit('request-action', 'restart')">
        <span class="config-action-row__icon" aria-hidden="true">
          <FontAwesomeIcon icon="undo-alt" fixedWidth></FontAwesomeIcon>
        </span>
        <span class="config-action-row__title">{{ $t('restart') }}</span>
      </button>

      <button type="button" class="config-action-row config-action-row--danger" @click="$emit('request-action', 'shutdown')">
        <span class="config-action-row__icon" aria-hidden="true">
          <FontAwesomeIcon icon="power-off" fixedWidth></FontAwesomeIcon>
        </span>
        <span class="config-action-row__title">{{ $t('shutdown') }}</span>
      </button>
    </div>
  </ConfigurationSection>
</template>

<script>
  import { mapGetters } from 'vuex';
  import ConfigurationSection from './Section.vue';

  export default {
    name: 'ConfigurationInstance',
    components: { ConfigurationSection },
    computed: mapGetters({
      version: 'asf/version',
      buildVariant: 'asf/buildVariant',
      memory: 'asf/memory',
      updatesEnabled: 'asf/updatesEnabled',
      canUpdate: 'asf/canUpdate',
    }),
  };
</script>
