import { getSessionUser } from "./auth";
import { API_URL } from "./consts";
import { LocalNotifications } from '@capacitor/local-notifications';

const uploadFilesToCloudflareV1 = async (user_id, mediaList) => {
    try {

        const formData = new FormData();
        mediaList.forEach((file, index) => {
            formData.append(`media_data[${index}]`, file.base64); // Append each base64 string with an indexed key
        });

        formData.append('user_id', user_id);

        const response = await fetch(`${API_URL}/wp-json/app/v1/upload-media-cloudflare`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (response.status !== 200) {
            throw new Error("Failed to upload media");
        }

        if (!data || !data.success) {
            throw new Error(data.message || "Failed to upload media");
        }

        if (data.success && data.media_ids) {
            return data.media_ids;
        } else {
            throw new Error("Failed to upload media");
        }
    } catch (error) {
        console.error('Error uploading files to Cloudflare:', error.message);
        throw error;
    }
};

export const addPost = async ({
    mediaList,
    caption,
    location,
    taggedEntities = [],
    association_id,
    association_type,
    onUpload = () => { },
    onError = () => { },
}) => {
    try {
        const user = await getSessionUser();

        if (!user || !user.id) {
            throw new Error("User session not found");
        }

        if (!mediaList || mediaList.length === 0) {
            throw new Error("No media found");
        }

        const media = await uploadFilesToCloudflareV1(user.id, mediaList);
        const formData = new FormData();

        formData.append("user_id", user.id);
        formData.append("caption", caption || "");
        formData.append("location", location || "");
        formData.append("media", JSON.stringify(media));

        if (association_id && association_type) {
            if (association_type !== 'garage') {
                formData.append("association_id", association_id);
                formData.append("association_type", association_type);
            }
        }

        const response = await fetch(`${API_URL}/wp-json/app/v1/create-post`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (!data || data.error || response.status !== 200) {
            await addNotification("Failed to create post", data.error || "Failed to create post");
            throw new Error(data.error || "Post creation failed, status: " + response.status);
        }

        if (taggedEntities.length > 0) {
            await addTagsForPost(data.post_id, taggedEntities);
        }

        await addNotification("Post created", "Post created successfully", {
            post_id: data.post_id,
        });

        onUpload();
        return data;
    } catch (e) {
        await addNotification("Failed to create post", e.message || "Failed to create post");
        onError();
        console.error("Error creating post", e.message);
    }
};

export const addTagsForPost = async (postId, tags) => {
    try {
        const user = await getSessionUser();

        if (!user || !user.id) {
            return [];
        }

        if (!postId || !tags || tags.length === 0) {
            throw new Error("Invalid data");
        }

        const response = await fetch(`${API_URL}/wp-json/app/v1/add-tags`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: user.id, post_id: postId, tags }),
        });

        const data = await response.json();
        if (!response.ok || response.status !== 200) {
            throw new Error(data.message);
        }

        return data;
    } catch (e) {
        await addNotification("Failed to add tags", e.message || "Failed to add tags");
        console.error("Error adding tags", e.message);
        return null;
    }
};

export const fetchTaggableEntites = async (search, tagged_entities, entity_type) => {
    const user = await getSessionUser();

    if (!user || !user.id) {
        return [];
    }

    let url;

    switch (entity_type) {
        case 'car':
            url = `${API_URL}/wp-json/app/v1/get-taggable-vehicles`;
            break;
        case 'events':
            url = `${API_URL}/wp-json/app/v1/get-taggable-events`;
            break;
        case 'users':
            url = `${API_URL}/wp-json/app/v1/get-taggable-entities`;
            break;
        default:
            url = `${API_URL}/wp-json/app/v1/get-taggable-entities`;
            break;
    }

    try {
        const response = await fetch(url, {
            cache: "no-cache",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ search, user_id: user.id, tagged_entities }),
        });

        const data = await response.json();
        if (!response.ok || response.status !== 200) {
            throw new Error(data.message);
        }


        if (entity_type === 'car' && data.length === 0) {
            return [{ name: search, type: 'car', entity_id: 'search_q', image: 'search_q' }];
        }

        return data;
    } catch (e) {
        console.log("Error fetching taggable entities", e);
        return [];
    }
};

export const addNotification = async (title, message, data = {}) => {
    await LocalNotifications.schedule({
        notifications: [
            {
                id: Math.ceil(Math.random() * 100),
                title: title, // Notification title
                body: message,   // Notification body
                schedule: { at: new Date(Date.now() + 1000) },
                sound: null,
                ongoing: false, // (optional, default: false)
                // extra: data,   // Optional extra data
            },
        ],
    });
};