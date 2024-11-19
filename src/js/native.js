import { Geolocation } from '@capacitor/geolocation';
import { App as CapacitorApp } from '@capacitor/app';

export const getCurrentPosition = async () => {
    if (await checkPermission()) {
        const coordinates = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
        });

        alert(`Latitude: ${coordinates.coords.latitude}, Longitude: ${coordinates.coords.longitude}`);
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
