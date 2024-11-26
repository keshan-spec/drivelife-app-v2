import {
    API_URL,
    TIMEOUT_MS_HIGHER
} from "./consts.js";
import {
    getSessionUser
} from "./auth.js";

export const addUserProfileLinks = async ({
    link,
    type,
}) => {
    const user = await getSessionUser();
    if (!user) return null;

    const response = await fetch(`${API_URL}/wp-json/app/v1/add-profile-links`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: user.id,
            link,
            type
        }),
    });

    const data = await response.json();
    return data;
};

export const updateSocialLinks = async (links) => {
    const user = await getSessionUser();
    if (!user) return;

    const response = await fetch(`${API_URL}/wp-json/app/v1/update-social-links`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: user.id,
            links
        }),
    });

    const data = await response.json();
    return data;
};

export const removeProfileLink = async (linkId) => {
    const user = await getSessionUser();
    if (!user) return;

    const response = await fetch(`${API_URL}/wp-json/app/v1/remove-profile-link`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: user.id,
            link_id: linkId
        }),
    });

    const data = await response.json();
    if (response.status !== 200 || data.error) {
        return false;
    }

    return true;
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

export const updateProfileImage = async (image, user_id = null) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const user = await getSessionUser();
        let userID = user_id;

        if (user && user.id) {
            userID = user.id;
        }

        if (!userID) return;

        setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS_HIGHER);


        const response = await fetch(`${API_URL}/wp-json/app/v2/update-profile-image`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userID,
                image
            }),
            signal
        });

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                message: "Failed to update your profile image, your connection timed out",
                name: "TimeOutError"
            };
        } else {
            throw error; // Rethrow any other errors
        }
    }
};

export const updateCoverImage = async (image, user_id = null) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const user = await getSessionUser();
        let userID = user_id;

        if (user && user.id) {
            userID = user.id;
        }

        if (!userID) return;

        setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS_HIGHER);

        const response = await fetch(`${API_URL}/wp-json/app/v2/update-cover-image`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userID,
                image
            }),
            signal
        });

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                message: "Failed to update your cover image, your connection timed out",
                name: "TimeOutError"
            };
        } else {
            throw error; // Rethrow any other errors
        }
    }
};

export const maybeFollowUser = async (profileId) => {
    const user = await getSessionUser();
    if (!user) return;

    const response = await fetch(`${API_URL}/wp-json/app/v1/follow-user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            following_id: profileId,
            follower_id: user.id
        }),
    });

    const data = await response.json();
    return data;
};

export const removeTagFromPost = async (tagId) => {
    const user = await getSessionUser();
    if (!user) return;

    const response = await fetch(`${API_URL}/wp-json/app/v1/remove-post-tag`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tag_id: tagId,
            user_id: user.id
        }),
    });

    const data = await response.json();
    return data;
};

export const approvePostTag = async (tagId, tagType) => {
    const user = await getSessionUser();
    if (!user || !user.id) {
        return null;
    }

    const response = await fetch(`${API_URL}/wp-json/app/v1/approve-post-tag`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tag_id: tagId,
            user_id: user.id,
            tag_type: tagType
        }),
    });

    const data = await response.json();
    return data;
};

export const getFollowersForUser = async (profileId) => {
    const user = await getSessionUser();
    if (!user || !user.id) {
        return null;
    }

    const response = await fetch(`${API_URL}/wp-json/app/v2/get-followers?user_id=${profileId}`, {
        method: "GET",
        cache: "force-cache",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const data = await response.json();
    return data;
};

export const removeFollower = async (followerId) => {
    const user = await getSessionUser();
    if (!user || !user.id) {
        return null;
    }

    const response = await fetch(`${API_URL}/wp-json/app/v1/remove-follower`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            follower_id: followerId,
            user_id: user.id
        }),
    });

    const data = await response.json();
    return data;
};