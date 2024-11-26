import {
    API_URL,
    TIMEOUT_MS_HIGHER
} from "./consts.js";
import store from "../store.js";

export const getSessionUser = async () => {
    // get session from somewhere    
    if (store.state.user) {
        return store.state.user;
    }

    // check in local storage
    const session = window.localStorage.getItem('token');
    if (session) {
        return session;
    }

    return null;
};

export const getUserDetails = async (token) => {
    try {
        let url = `${API_URL}/wp-json/app/v2/get-user-profile/`;
        let response = await fetch(url, {
            method: "GET",
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (response.status !== 200) throw new Error(data.message);
        return data;
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
    }
};

export const verifyUser = async (credentials) => {
    try {
        // Convert the credentials object to a URL query string
        const queryParams = new URLSearchParams(credentials).toString();

        // Make a GET request with the query parameters
        const response = await fetch(`${API_URL}/wp-json/ticket_scanner/v1/verify_user/?${queryParams}`, {
            method: "GET",
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error('Failed to verify user:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error(error);
        return error;
    }
};

export const verifyEmail = async (token) => {
    try {
        const response = await fetch(`${API_URL}/wp-json/app/v1/verify-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error verifying email:', error);
        return null;
    }
};

export const sendEmailVerification = async () => {
    try {
        const user = await getSessionUser();
        if (!user) return;

        const response = await fetch(`${API_URL}/wp-json/app/v1/resend-verification-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending email verification:', error);
        return null;
    }
};

export const handleSignUp = async (user) => {
    try {
        const response = await fetch(`${API_URL}/wp-json/app/v1/register-user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        });

        const data = await response.json();

        if (response.status !== 201) {
            return {
                success: false,
                message: data.message,
                code: data.code,
            };
        }

        return data;
    } catch (error) {
        return error;
    }
};

export const updateUsername = async (username, user_id = null) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        if (!user_id) {
            const user = await getSessionUser();
            if (!user) return {
                success: false,
                message: 'User id not provided'
            };
            user_id = user.id;
        }

        setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS_HIGHER);

        const response = await fetch(`${API_URL}/wp-json/app/v1/update-username`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user_id,
                username
            }),
            signal
        });

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                message: "Failed to update your username, your connection timed out",
                name: "TimeOutError"
            };
        } else {
            throw error; // Rethrow any other errors
        }
    }
};

export const updateContentIds = async (content_ids, user_id) => {
    const response = await fetch(`${API_URL}/wp-json/app/v1/update-selected-content`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id,
            content_ids
        }),
    });

    const data = await response.json();
    return data;
};

export const updateAboutUserIds = async (content_ids, user_id) => {
    const response = await fetch(`${API_URL}/wp-json/app/v1/update-about-content`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id,
            content_ids
        }),
    });

    const data = await response.json();
    return data;
};

export const updatePassword = async (new_password, old_password) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const user = await getSessionUser();
        if (!user) return;

        setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS_HIGHER);

        const response = await fetch(`${API_URL}/wp-json/app/v1/update-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
                new_password,
                old_password
            }),
            signal
        });

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                message: "Failed to update your password, your connection timed out",
                name: "TimeOutError"
            };
        } else {
            throw error; // Rethrow any other errors
        }
    }
};

export const updateUserDetails = async (details, email_changed) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const user = await getSessionUser();
        if (!user) return;

        setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS_HIGHER);

        const response = await fetch(`${API_URL}/wp-json/app/v1/update-user-details`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
                ...details,
                email_changed
            }),
            signal
        });

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                message: "Failed to update your details, your connection timed out",
                name: "TimeOutError"
            };
        } else {
            throw error; // Rethrow any other errors
        }
    }
};

export const getUserById = async (id) => {
    try {
        let url = `${API_URL}/wp-json/app/v2/get-user-profile-next?user_id=${id}`;
        let response = await fetch(url, {
            method: "GET",
            // cache: 'force-cache',
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (response.status !== 200) throw new Error(data.message);
        return data;
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
    }
};

export const getUserNotifications = async (load_old_notifications = false) => {
    try {
        const user = await getSessionUser();
        if (!user || !user.id) {
            return null;
        }

        const response = await fetch(`${API_URL}/wp-json/app/v1/get-notifications`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
                load_old_notifications
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        return null;
    }
};

export const getNotificationCount = async () => {
    const user = await getSessionUser();
    if (!user || !user.id) return;

    const response = await fetch(`${API_URL}/wp-json/app/v1/get-new-notifications-count`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: user.id
        }),
    });

    const data = await response.json();
    return data;
};

export const markMultipleNotificationsAsRead = async (notificationIds) => {
    const user = await getSessionUser();
    if (!user) return null;

    const response = await fetch(`${API_URL}/wp-json/app/v1/bulk-notifications-read`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: user.id
        }),
    });

    const data = await response.json();
    return data;
};

export const deleteUserAccount = async (password) => {
    const user = await getSessionUser();
    if (!user || !user.id) return;

    try {
        const response = await fetch(`${API_URL}/wp-json/app/v1/delete_account`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
                password
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        return {
            success: false,
            message: 'Oops, unable to delete your account. Please try again later.'
        };
    }
};

export async function maybeSetUserLocation(coords) {
    const user = await getSessionUser();
    if (!user || !user.id) return;

    let data = {
        coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
        },
        user_id: user.id,
    };

    const response = await fetch(`${API_URL}/wp-json/app/v1/update-last-location`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    let json = await response.json();
    console.log('Response from server: ', json);
    return json;
}