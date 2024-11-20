# DriveLife App

## Install Dependencies

First of all we need to install dependencies, run in terminal
```
npm install
```

## NPM Scripts

* 🔥 `start` - run development server
* 🔧 `dev` - run development server
* 🔧 `build` - build web app for production

## Capacitor Set up

To set up capacitor, after install the dependencies, run `npx cap add ${platform}`, for instance, `npx cap add android`. This will create the relative native folder(s). 

Now, once you've done developing, run `npm run run:${platform}` to build, sync, and run the app on an emulator or on a device. 

### Assets

Assets (icons, splash screens) source images located in `assets` folder. To generate the custom splash screen and icons, run the below command, it will create the necessary files and move them to the `android/` or `ios/App/` directories.

```
npm run assets
```

<hr/>

## Permissions and other configs

### Android 
We will need to copy over the configs for each native build manually when starting fresh, for android its the `android/app/src/main/AndroidManifest.xml`. We need to add the permissions and deep linking intents. I've left a copy of the manifest in `android-example`. 

### IOS
For IOS, it can be a little more complicated, there are multiple files that need to be updated. 
`ios/App/Podfile`, `ios/App/{App Name}/Info.plist`, and `ios/App/{App Name}/{App Name}.entitlements`.
Each files templates are in `ios-examples`.
