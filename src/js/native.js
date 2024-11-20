import { Geolocation } from '@capacitor/geolocation';
import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings';
import { Device } from '@capacitor/device';

export const getCurrentPosition = async () => {
    if (await isRunningOnWeb()) {
        return;
    }

    if (await checkPermission()) {
        const coordinates = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
        });

        // TODO: Update the user db with location
    }
};

const checkPermission = async () => {
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