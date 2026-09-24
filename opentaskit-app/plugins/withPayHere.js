const { withProjectBuildGradle, withAndroidManifest, withPodfile } = require('@expo/config-plugins');

// PayHere's React Native SDK (@payhere/payhere-mobilesdk-reactnative) ships
// as a bare-RN module with manual native setup steps in its README. Since
// this project uses `expo prebuild`, that setup has to be re-applied on
// every prebuild instead of hand-edited once - hence this plugin.
// Ref: https://github.com/PayHereLK/payhere-mobilesdk-reactnative#readme

function withPayHereAndroidRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const contents = config.modResults.contents;
      if (!contents.includes('jitpack.io')) {
        // The PayHere Android SDK is published on JitPack, needed by the
        // root project's `allprojects { repositories { ... } }` block.
        config.modResults.contents = contents.replace(
          /allprojects\s*\{\s*repositories\s*\{/,
          `allprojects {\n    repositories {\n        maven { url 'https://jitpack.io' }`
        );
      }
    }
    return config;
  });
}

function withPayHereManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const application = manifest.application?.[0];
    if (application) {
      const existing = application.$['tools:replace'];
      if (!existing) {
        application.$['tools:replace'] = 'android:allowBackup';
      } else if (!existing.includes('android:allowBackup')) {
        application.$['tools:replace'] = `${existing},android:allowBackup`;
      }
    }
    return config;
  });
}

function withPayHerePodfile(config) {
  return withPodfile(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes('payHereSDK')) {
      contents = contents.replace(
        /(use_react_native!\([^)]*\)\s*\n)/,
        `$1\n  pod 'payHereSDK', :git => 'https://github.com/PayHereLK/payhere-mobilesdk-ios.git'\n  pod 'payhere-mobilesdk-reactnative', :path => '../node_modules/@payhere/payhere-mobilesdk-reactnative'\n  use_frameworks!\n  pod 'SDWebImage', :modular_headers => true\n`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withPayHere(config) {
  config = withPayHereAndroidRepo(config);
  config = withPayHereManifest(config);
  config = withPayHerePodfile(config);
  return config;
};
