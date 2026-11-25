import * as http from '../plugins/http';
import store from '../store';

// Every cache below stores promises, so concurrent callers share one in-flight request.
// A rejected promise is evicted so the next open retries instead of replaying the failure.
const cachedTypeDefinitions = new Map();
const cachedStructureDefinitions = new Map();
const cachedSchemas = new Map();

// Types whose structure is always needed, so it is requested together with the type definition.
const PREFETCH_STRUCTURE_TYPES = new Set(['ArchiSteamFarm.Steam.Storage.BotConfig']);

// Schemas only change with the ASF build, so everything is scoped to the running version.
let cacheScope = null;

const subtypeRegex = /\[[^\]]+]/g;

function syncCacheScope() {
  const scope = String(store.getters['asf/version'] || 'unknown');
  if (scope === cacheScope) return;

  cacheScope = scope;
  cachedTypeDefinitions.clear();
  cachedStructureDefinitions.clear();
  cachedSchemas.clear();
}

function cachePromise(cache, key, factory) {
  if (cache.has(key)) return cache.get(key);

  const promise = Promise.resolve().then(factory);
  cache.set(key, promise);

  promise.catch(() => {
    if (cache.get(key) === promise) cache.delete(key);
  });

  return promise;
}

function cloneSchema(value) {
  if (Array.isArray(value)) return value.map(cloneSchema);

  if (value && typeof value === 'object') {
    const clone = {};
    Object.keys(value).forEach(key => {
      clone[key] = cloneSchema(value[key]);
    });
    return clone;
  }

  return value;
}

function resolveSubtypes(type) {
  const subtypes = type.match(subtypeRegex);
  if (!subtypes) return [];
  return subtypes.map(subtype => subtype.slice(1, subtype.length - 1));
}

function getStructureDefinition(type) {
  return cachePromise(cachedStructureDefinitions, type, () => http.get(`structure/${encodeURIComponent(type)}`));
}

function getTypeDefinition(type) {
  return cachePromise(cachedTypeDefinitions, type, () => http.get(`type/${encodeURIComponent(type)}`));
}

async function resolveType(targetType) {
  const subtypes = resolveSubtypes(targetType);

  switch (targetType.split('`')[0]) {
    case 'System.Boolean':
      return { type: 'boolean' };
    case 'System.String':
    case 'System.Guid':
      return { type: 'string' };
    case 'System.Byte':
      return { type: 'byte' };
    case 'System.UInt32':
      return { type: 'uint32' };
    case 'System.UInt16':
      return { type: 'uint16' };
    case 'System.Collections.Generic.HashSet':
    case 'System.Collections.Immutable.ImmutableHashSet':
      return { type: 'hashSet', values: await resolveType(subtypes[0]) };
    case 'System.Collections.Immutable.ImmutableList':
      return { type: 'list', values: await resolveType(subtypes[0]) };
    case 'System.UInt64':
      return { type: 'uint64' };
    case 'System.Collections.Generic.Dictionary':
    case 'System.Collections.Immutable.ImmutableDictionary':
      return { type: 'dictionary', key: await resolveType(subtypes[0]), value: await resolveType(subtypes[1]) };
    case 'System.Nullable':
      const { type } = await resolveType(subtypes[0]);
      return { type, nullable: true };
    default: // Complex type
      return unwindType(targetType);
  }
}

async function unwindObject(type, typeDefinition) {
  const resolvedStructure = {
    type: 'object',
    body: {},
  };

  const [structureDefinition, resolvedTypes] = await Promise.all([
    getStructureDefinition(type),
    Promise.all(Object.keys(typeDefinition.Body).map(async param => ({ param, type: await resolveType(typeDefinition.Body[param]) }))),
  ]);

  resolvedTypes.forEach(resolvedType => {
    const { param, type } = resolvedType;
    const paramName = (typeDefinition.Body[param] !== 'System.UInt64') ? param : `s_${param}`;

    resolvedStructure.body[param] = {
      defaultValue: structureDefinition[param],
      paramName,
      param,
      ...type,
    };
  });

  return resolvedStructure;
}

function parseEnumValues(rawValues) {
  const enumValues = {};

  Object.keys(rawValues).forEach(key => {
    enumValues[key] = parseInt(rawValues[key], 10);
  });

  return enumValues;
}

async function unwindType(type) {
  // Request the structure in parallel with the type (saves a round trip), but inside the same
  // chain, so a failure of either request rejects the load instead of going unhandled.
  const [typeDefinition] = await Promise.all([
    getTypeDefinition(type),
    PREFETCH_STRUCTURE_TYPES.has(type) ? getStructureDefinition(type) : undefined,
  ]);

  switch (typeDefinition.Properties.BaseType) {
    case 'System.Object':
      return unwindObject(type, typeDefinition);
    case 'System.Enum':
      return {
        type: ((typeDefinition.Properties.CustomAttributes || []).includes('System.FlagsAttribute')) ? 'flag' : 'enum',
        values: parseEnumValues(typeDefinition.Body),
      };
    default: {
      const structureDefinition = await getStructureDefinition(type);
      return { type: 'unknown', typeDefinition, structureDefinition };
    }
  }
}

/**
 * Resolves the editable schema of a config type.
 * The resolved schema is shared between calls for the same ASF version; callers always receive
 * their own copy, so a form can mutate it without affecting later opens.
 */
export default function fetchConfigSchema(type) {
  syncCacheScope();

  const schema = cachePromise(cachedSchemas, type, () => unwindType(type));
  return schema.then(cloneSchema);
}
