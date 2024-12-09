import {
    getSessionUser
} from './auth.js';
import {
    API_URL,
    TIMEOUT_MS_HIGH,
} from './consts.js';

export const getUserGarage = async (profileId) => {
    try {
        const response = await fetch(`${API_URL}/wp-json/app/v2/get-user-garage?user_id=${profileId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

        const data = await response.json();
        if (response.status !== 200) {
            return [];
        }

        return data;
    } catch (error) {
        return [];
    }
};

export const getGargeById = async (garageId) => {
    try {
        const response = await fetch(`${API_URL}/wp-json/app/v2/get-garage?garage_id=${garageId}`, {
            method: "GET",
            cache: "force-cache",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (response.status !== 200) {
            throw new Error('Failed to fetch users posts');
        }

        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const getPostsForGarage = async (garageId, page = 1, tagged = false) => {
    try {
        const query = new URLSearchParams({
            garage_id: garageId,
            page,
            limit: 9,
            tagged: tagged ? 1 : 0
        });

        const response = await fetch(`${API_URL}/wp-json/app/v2/get-garage-posts?${query}`, {
            method: "GET",
            // cache: "force-cache",
            headers: {
                "Content-Type": "application/json",
            },
            // body: JSON.stringify({
            //     garage_id: garageId,
            //     page,
            //     limit: 10,
            //     tagged
            // }),
        });

        const data = await response.json();
        if (response.status !== 200) {
            return null;
        }

        return data;
    } catch (error) {
        return null;
    }
};

export const addVehicleToGarage = async (data) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const user = await getSessionUser();
        if (!user) return;

        setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS_HIGH);

        const response = await fetch(`${API_URL}/wp-json/app/v1/add-vehicle-to-garage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ...data,
                user_id: user.id,
            }),
            signal
        });

        const res = await response.json();
        return res;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                message: "Failed to add your vehicle, your connection timed out",
                name: "TimeOutError"
            };
        } else {
            throw error; // Rethrow any other errors
        }
    }
};

export const updateVehicleInGarage = async (data, garageId) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const user = await getSessionUser();
        if (!user) return;

        setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS_HIGH);

        const response = await fetch(`${API_URL}/wp-json/app/v1/update-garage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ...data,
                user_id: user.id,
                garage_id: garageId,
            }),
            signal
        });

        const res = await response.json();
        return res;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                message: "Failed to update your vehicle, your connection timed out",
                name: "TimeOutError"
            };
        } else {
            throw error; // Rethrow any other errors
        }
    }
};

export const deleteVehicleFromGarage = async (garageId) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const user = await getSessionUser();
        if (!user) return;

        setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS_HIGH);

        const response = await fetch(`${API_URL}/wp-json/app/v1/delete-garage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
                garage_id: garageId,
            }),
            signal
        });

        const res = await response.json();
        return res;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                message: "Failed to delete your vehicle, your connection timed out",
                name: "TimeOutError"
            };
        } else {
            throw error; // Rethrow any other errors
        }
    }
};