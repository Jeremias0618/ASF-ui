<template>
  <div class="form-item" :class="{ 'is-help-open': showDescription }">
    <input-label
      :label="label"
      :field="field"
      :hasDescription="hasDescription"
      :helpOpen="showDescription"
      @toggle-help="toggleDescription"
    ></input-label>

    <div class="form-item__value">
      <div class="input-option__field input-option__field--permissions">
        <Multiselect
          v-model="elementKey"
          class="input-permissions__select"
          :options="botOptions"
          label="label"
          track-by="key"
          :multiple="false"
          :close-on-select="true"
          :taggable="true"
          :placeholder="$t('bot-permissions-select')"
          deselect-label=""
          select-label=""
          selected-label=""
          :tag-placeholder="$t('tag-placeholder')"
          @tag="addSteamId"
        >
          <template slot="singleLabel" slot-scope="{ option }">
            <span class="input-permissions__value" :title="option.label">{{ option.label }}</span>
          </template>
          <template slot="option" slot-scope="{ option }">
            <span class="input-permissions__option" :title="option.label">{{ option.label }}</span>
          </template>
        </Multiselect>

        <AsfSelect
          v-if="valueIsEnum"
          :id="`${field}-value`"
          v-model="elementValue"
          class="input-permissions__role"
          :options="roleOptions"
          :placeholder="$t('input-select-enum-value')"
        ></AsfSelect>

        <button type="button" class="button input-permissions__add" @click.prevent="addElement">
          {{ $t('add') }}
        </button>
      </div>

      <div class="input-option__items">
        <button v-for="(keyValue, key) in value" :key="key" type="button" class="button input-option__item" @click.prevent="removeElement(key)">
          {{ resolveKey(key) }} => {{ translateEnum(resolveValue(keyValue)) }}
        </button>
      </div>
    </div>

    <input-description v-if="hasDescription" :shown="showDescription" :description="description"></input-description>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex';
  import Multiselect from 'vue-multiselect';
  import Input from './Input.vue';

  export default {
    name: 'InputSelect',
    components: {
      Multiselect,
    },
    mixins: [Input],
    data() {
      return {
        elementKey: null,
        elementValue: null,
      };
    },
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
      }),
      valueIsEnum() {
        return this.schema.value.type === 'enum';
      },
      valueAvailableEnumValues() {
        const availableEnumValues = [];

        Object.keys(this.schema.value.values).forEach(key => {
          availableEnumValues.push(this.schema.value.values[key]);
        });

        return availableEnumValues;
      },
      roleOptions() {
        return Object.entries(this.schema.value.values || {}).map(([name, enumValue]) => ({
          value: enumValue,
          label: this.translateEnum(name),
        }));
      },
      botOptions() {
        return this.bots.map(bot => {
          const botName = (bot.nickname) ? `${bot.name} · ${bot.nickname}` : bot.name;
          return { label: botName, key: bot.steamid };
        });
      },
    },
    created() {
      this.elementKey = this.getDefaultKey();
      this.elementValue = this.getDefaultValue();
    },
    methods: {
      getDefaultKey() {
        return null;
      },
      getDefaultValue() {
        if (this.valueIsEnum) return this.valueAvailableEnumValues[0];
        return null;
      },
      resolveKey(key) {
        const bot = this.bots.find(bot => bot.steamid === key);
        if (!bot) return key;
        return `${key} (${bot.name})`;
      },
      resolveValue(value) {
        if (!this.valueIsEnum) return value;
        return Object.keys(this.schema.value.values).find(key => this.schema.value.values[key] === value);
      },
      addElement() {
        if ((!this.elementValue && this.elementValue !== 0) || (!this.elementKey && this.elementKey !== 0)) return;

        this.$set(this.value, this.elementKey.key, this.elementValue);
        this.elementValue = this.getDefaultValue();
        this.elementKey = this.getDefaultKey();
      },
      removeElement(key) {
        this.$delete(this.value, key);
      },
      addSteamId(steamId) {
        this.elementKey = { label: steamId, key: steamId };
      },
    },
  };
</script>

<style lang="scss">
  @import "../../../style/partials/multiselect";

  .input-option__field--permissions {
    align-items: stretch;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-start;
    max-width: 36rem;
    width: 100%;
  }

  .input-permissions__select {
    flex: 1 1 12rem;
    max-width: 18rem;
    min-width: 0;

    &.multiselect {
      min-height: 2.75rem;
    }

    .multiselect__tags {
      align-items: center;
      box-sizing: border-box;
      display: flex;
      height: 2.75rem;
      min-height: 2.75rem;
      overflow: hidden;
      padding: 0 2.35rem 0 0.7rem;
    }

    .multiselect__single,
    .multiselect__input {
      background: transparent;
      margin: 0;
      overflow: hidden;
      padding: 0;
      text-overflow: ellipsis;
      top: 0;
      white-space: nowrap;
      width: 100%;
    }

    .multiselect__placeholder {
      margin: 0;
      overflow: hidden;
      padding: 0;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .multiselect__select {
      height: 2.75rem;
      width: 2.35rem;
    }

    .multiselect__content-wrapper {
      box-sizing: border-box;
      left: 0;
      max-height: 14rem;
      max-width: 100%;
      min-width: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      right: auto;
      width: 100%;
      z-index: 50;
    }

    .multiselect__content {
      width: 100%;
    }

    .multiselect__option {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .input-permissions__value,
  .input-permissions__option {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .input-permissions__role {
    flex: 0 1 10.5rem;
    min-width: 9.5rem;
    width: 10.5rem;
  }

  .input-permissions__add {
    flex: 0 0 auto;
    max-height: 2.75rem;
    min-height: 2.75rem;
    padding-left: 1rem;
    padding-right: 1rem;
    white-space: nowrap;
    width: auto;
  }

  @media screen and (max-width: 559px) {
    .input-option__field--permissions {
      max-width: none;
    }

    .input-permissions__select,
    .input-permissions__role,
    .input-permissions__add {
      flex: 1 1 100%;
      max-width: none;
      width: 100%;
    }
  }
</style>
