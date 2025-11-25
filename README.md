# Welcome to your Expo app

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Focus Mode Live Activity (iOS) & Notification (Android)

The focus timer now drives a Live Activity (iOS 16.2+) and an Android persistent notification so users can monitor sessions after leaving the app.

**iOS setup (after any change run `npx expo prebuild -p ios --clean`):**

1. The `@bacons/apple-targets` config plugin links the widget inside `targets/widget`. Open the generated workspace in Xcode and you will find the “expo:targets/widget” bundle already configured.
2. Confirm the app and widget both use the shared App Group `group.com.sarvar.leora` (added in `app.json` and mirrored in `targets/widget/expo-target.config.js`).
3. Build and run on an iOS 16.2+ device. When Focus Mode is running with the “Dynamic Island” toggle enabled and you background the app, the Dynamic Island + Lock Screen Live Activity will appear with live progress, session metadata, and controls. Live updates are driven by [`expo-live-activity`](https://github.com/software-mansion-labs/expo-live-activity) and ActivityKit.

**Android experience:**

The first time Focus Mode runs in the background (Android 13+), the system prompts for notification permission. A sticky “Focus Mode” notification shows remaining time, session progress, and break info whenever the timer is active away from the app.
