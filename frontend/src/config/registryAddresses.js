/**
 * Frontend registry addresses - MUST match backend
 * If backend returns different addresses, payment is blocked
 */
export const REGISTRY_ADDRESSES = Object.freeze({
  1: "0x0000000000000000000000000000000000000000", // UPDATE after deployment
  11155111: "0x206b33C964E95D987cFc45613FCE20fE14844E17", // UPDATE after deployment
  137: "0x0000000000000000000000000000000000000000", // UPDATE after deployment
});

export function getExpectedRegistry(chainId) {
  return REGISTRY_ADDRESSES[chainId];
}
