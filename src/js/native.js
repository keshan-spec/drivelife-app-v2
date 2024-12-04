import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings';
import { Device } from '@capacitor/device';
import { Clipboard } from '@capacitor/clipboard';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';

import store from './store.js';
import { convertBlobToBase64 } from './utils.js';

const writeToClipboard = async (message) => {
    await Clipboard.write({
        string: message,
    });
};

/* Geolocation functions */
export const getCurrentPosition = async () => {
    if (await isRunningOnWeb()) {
        return;
    }

    if (await checkLocationPermission()) {
        const coordinates = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
        });

        // TODO: Update the user db with location
    }
};

const checkLocationPermission = async () => {
    const permission = await Geolocation.checkPermissions();

    if (permission.location === 'granted') {
        return true;
    } else if (permission.location === 'denied') {
        return false;
    }

    // Ask for permission
    const permissionRequest = await Geolocation.requestPermissions();

    if (permissionRequest.location === 'granted') {
        return true;
    }

    return false;
};

/* Push notifications functions */
export const registerNotifications = async () => {
    if (await isRunningOnWeb()) {
        return;
    }

    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
        return false;
    }

    await PushNotifications.register();
    return true;
};

export const addListeners = async () => {
    if (await isRunningOnWeb()) {
        return;
    }

    await PushNotifications.addListener('registration', token => {
        store.dispatch('setDeviceToken', {
            token: token.value,
        });
    });

    await PushNotifications.addListener('registrationError', err => {
        alert('Error on registration: ' + JSON.stringify(err));
    });

    await PushNotifications.addListener('pushNotificationReceived', notification => {
        alert('Push received: ' + JSON.stringify(notification));
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue);
    });
};

export const getDeliveredNotifications = async () => {
    if (await isRunningOnWeb()) {
        return;
    }

    const notificationList = await PushNotifications.getDeliveredNotifications();
};


/* Media functions */
const checkCameraPermission = async () => {
    const permission = await Camera.checkPermissions();
    if (permission.photos === 'granted' && permission.camera === 'granted') {
        return true;
    } else if (permission.photos === 'denied') {
        return false;
    }

    const permissionRequest = await Camera.requestPermissions();
    if (permissionRequest.photos === 'granted' && permissionRequest.camera === 'granted') {
        return true;
    }

    return false;
};

const checkFilePermission = async () => {
    const permission = await Filesystem.checkPermissions();

    if (permission.publicStorage === 'granted') {
        return true;
    } else if (permission.publicStorage === 'denied') {
        return false;
    }

    const permissionRequest = await Filesystem.requestPermissions();

    if (permissionRequest.publicStorage === 'granted') {
        return true;
    }

    return false;
};

export const checkMediaPermission = async () => {
    try {
        const cameraPermission = await checkCameraPermission();
        const filePermission = await checkFilePermission();

        return cameraPermission && filePermission;
    } catch (error) {
        console.error('An error occurred while checking media permissions:', error);
        return false;
    }
};


export async function getGalleryPhotos() {
    const image = await Camera.pickImages({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        correctOrientation: true,
        presentationStyle: 'fullscreen',
        width: 2000,
        height: 2000,
        // source: CameraSource., // Camera, Photos or Prompt!
        limit: 5,
    });

    const data = image.photos.map(async (photo) => {
        const base64 = await getImageURI(photo);

        return {
            base64: `data:image/${photo.format};base64,${base64}`,
            uri: photo.webPath, // webPath is the path to the image on the web
            ...photo
        };
    });

    return await Promise.all(data);
}

async function getImageURI(photo) {
    try {
        const isWeb = await isRunningOnWeb();

        if (!isWeb) {
            const file = await Filesystem.readFile({
                path: photo.path
            });

            return file.data;
        }
        else {
            console.log('Running on web, fetching image URI', photo.webPath);

            // Fetch the photo, read as a blob, then convert to base64 format
            const blob = await fetch(photo.webPath).then((res) => res.blob());
            return await convertBlobToBase64(blob);
        }
    } catch (error) {
        console.log('Error getting image URI', error);
    }
}

/* Misc functions */
export const openSettings = async () => {
    try {
        if (await isRunningOnWeb()) {
            console.log('Cannot open settings on web');
            return;
        }

        const { platform } = await Device.getInfo();
        if (platform === 'android') {
            await NativeSettings.openAndroid({
                option: AndroidSettings.ApplicationDetails,
            });
        } else if (platform === 'ios') {
            await NativeSettings.openIOS({
                option: IOSSettings.App,
            });
        } else {
            await NativeSettings.open();
        }
    } catch (error) {
        console.log('Error opening settings', error);
    }
};

export const isRunningOnWeb = async () => {
    const { platform } = await Device.getInfo();
    return platform === 'web';
};
