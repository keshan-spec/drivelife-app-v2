import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings';
import { Device } from '@capacitor/device';
import { Clipboard } from '@capacitor/clipboard';
import store from './store.js';

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
    const notificationList = await PushNotifications.getDeliveredNotifications();
};

/* Misc functions */
export const openSettings = async () => {
    try {
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