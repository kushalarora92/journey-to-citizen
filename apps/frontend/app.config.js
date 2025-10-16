module.exports = {
  expo: {
    name: 'Journey to Citizen',
    slug: 'journey-to-citizen',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'journey-to-citizen',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    owner: 'kodian-labs',
    extra: {
      eas: {
        projectId: '16fd1c91-cd6c-4507-9fb3-3ae48e1530cd',
      },
    },
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.kodianlabs.journeytocitizen',
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST || './GoogleService-Info.plist',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.kodianlabs.journeytocitizen',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router', '@react-native-firebase/app'],
    experiments: {
      typedRoutes: true,
    },
  },
};
