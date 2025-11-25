/** @type {import('@bacons/apple-targets').ConfigFunction} */
module.exports = (config) => {
  const appGroups =
    (config?.ios?.entitlements?.['com.apple.security.application-groups'] ?? [
      'group.com.sarvaryarbekov.leora',
    ]);

  return {
    type: 'widget',
    name: 'FocusLiveActivity',
    displayName: 'Focus Live Activity',
    deploymentTarget: '16.2',
    entitlements: {
      'com.apple.security.application-groups': appGroups,
    },
  };
};
