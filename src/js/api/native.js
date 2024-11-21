import { getSessionUser } from "./auth";
import { API_URL } from "./consts";

export async function maybeSetUserLocation(coords) {
    const user = await getSessionUser();

    if (!user || !user.id) {
        return;
    }

    // send request to server to save token
    let url = `${API_URL}/wp-json/app/v1/update-last-location`;

    let data = {
        coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
        },
        user_id: user.id,
    };

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    let json = await response.json();
    return json;
}

export const associateDeviceWithUser = async (token) => {
    try {
        const user = await getSessionUser();

        if (!user || !user.id) {
            return;
        }

        // send request to server to save token
        let url = `${API_URL}/wp-json/expoapi/v1/associate-user-with-device`;

        let data = {
            user_id: user.id,
            device_id: token,
        };

        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        let json = await response.json();
        return json;
    } catch (error) {
        console.log(error);
    }
};

export const setUserAsInactive = async (token) => {
    try {
        const user = await getSessionUser();

        if (!user || !user.id) {
            return;
        }

        // send request to server to save token
        let url = `${API_URL}/wp-json/expoapi/v1/set-associated-user-as-inactive`;

        let data = {
            user_id: user.id,
            device_id: token,
        };

        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.log(error);
    }
};