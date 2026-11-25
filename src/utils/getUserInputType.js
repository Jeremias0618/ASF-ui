// Mirrors ASF's ASF.EUserInputType. Todo: Read EUserInputType from api
export const USER_INPUT_TYPES = {
  None: 0,
  Login: 1,
  Password: 2,
  SteamGuard: 3,
  SteamParentalCode: 4,
  TwoFactorAuthentication: 5,
  Cryptkey: 6,
  DeviceConfirmation: 7,
  QrCodeLogin: 8,
};

/**
 * Returns the name of a RequiredInput value, or undefined when this UI does not know it.
 * Callers must treat undefined as an unsupported state instead of guessing.
 */
export default function getUserInputType(id) {
  if (typeof id === 'string' && Object.prototype.hasOwnProperty.call(USER_INPUT_TYPES, id)) return id;
  return Object.keys(USER_INPUT_TYPES).find(value => USER_INPUT_TYPES[value] === id);
}
