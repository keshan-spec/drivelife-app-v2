import { Geolocation } from '@capacitor/geolocation';

export const getCurrentPosition = async () => {
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
