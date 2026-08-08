/**
 * Translate ASF config parameter / enum names when locale strings exist.
 * Falls back to the original technical name.
 */

export function translateConfigParam(vm, paramName) {
  const name = String(paramName || '');
  if (!name) return name;
  return vm.$t(`config-param-${name}`, name);
}

export function translateConfigEnum(vm, enumName) {
  const name = String(enumName || '');
  if (!name) return name;
  return vm.$t(`config-enum-${name}`, name);
}
