import { getImageURI } from "../native";
import store from "../store";
import { getSessionUser } from "./auth";
import { API_URL } from "./consts";
import { LocalNotifications } from '@capacitor/local-notifications';

/* Unused functions */
const uploadSingleFileToCloudflare = async (user_id, file) => {
    try {
        const formData = new FormData();
        formData.append('media_data[0]', file.base64);
        formData.append('user_id', user_id);

        const response = await fetch(`${API_URL}/wp-json/app/v1/upload-media-cloudflare`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        alert(JSON.stringify(data));

        if (response.status !== 200 || !data.success) {
            throw new Error(data.message || "Failed to upload media");
        }

        return data.media_ids;
    } catch (error) {
        alert('Error uploading file to Cloudflare: ' + error.message);
        console.log('Error uploading file to Cloudflare:', error.message);
        throw error;
    }
};

const uploadFileInChunks = async (userId, file, chunkSize = 1024 * 600) => {
    try {
        const base64Data = await getImageURI(file); // Base64 string of the file
        const totalChunks = Math.ceil(base64Data.length / chunkSize);

        // Extract file name (optional, adjust based on your implementation)
        const uriParts = file.path.split('/');
        const fileName = uriParts[uriParts.length - 1];

        // get the last 1000 characters of the base64 string
        let media_id = null;

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, base64Data.length);

            // Slice the Base64 string for this chunk
            let base64Chunk = base64Data.slice(start, end);

            // if we're in the last iteration, make sure the full base64 string is sent
            if (i === totalChunks - 1) {
                base64Chunk = base64Data.slice(start);
            }

            const formData = new FormData();
            formData.append("user_id", userId);
            formData.append("file_name", fileName);
            formData.append("chunk_index", i);
            formData.append("total_chunks", totalChunks);
            formData.append("chunk_data", base64Chunk);

            // Send the chunk to the server
            const response = await fetch(`${API_URL}/wp-json/app/v1/upload-media-cloudflare-chunks`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(`Chunk upload failed at index ${i}: ${data.message}`);
            }

            if (data.media_id) {
                media_id = data.media_id;
            }
        }

        return media_id;
    } catch (error) {
        throw error;
    }
};

const uploadFilesToCloudflareV2 = async (user_id, mediaList) => {
    try {
        const uploadPromises = mediaList.map((file) =>
            uploadFileInChunks(user_id, file)
        );

        const results = await Promise.all(uploadPromises);
        return results.flat();
    } catch (error) {
        console.log('Error uploading files to Cloudflare:', error.message);
        throw error;
    }
};
/* Unused functions */

const uploadFileInChunksv1 = async (userId, file, chunkSize = 1024 * 600, onProgress) => {
    try {
        const base64Data = file.base64; // Base64 string of the file
        const totalChunks = Math.ceil(base64Data.length / chunkSize);

        // Extract file name (optional, adjust based on your implementation)
        const uriParts = file.path.split('/');


        // create a unique file name, timestamp + file name
        const fileName = new Date().getTime() + uriParts[uriParts.length - 1];
        // const fileName = uriParts[uriParts.length - 1];

        let media_id = null;

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, base64Data.length);

            // Slice the Base64 string for this chunk
            let base64Chunk = base64Data.slice(start, end);

            // if we're in the last iteration, make sure the full base64 string is sent
            if (i === totalChunks - 1) {
                base64Chunk = base64Data.slice(start);
            }

            const formData = new FormData();
            formData.append("user_id", userId);
            formData.append("file_name", fileName);
            formData.append("chunk_index", i);
            formData.append("total_chunks", totalChunks);
            formData.append("chunk_data", base64Chunk);

            // Send the chunk to the server
            const response = await fetch(`${API_URL}/wp-json/app/v1/upload-media-cloudflare-chunks`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(`Chunk upload failed at index ${i}: ${data.message}`);
            }

            if (data.media_id) {
                media_id = data.media_id;
            }

            // Calculate the progress and update the store
            const progress = ((i + 1) / totalChunks) * 100; // Percentage of upload progress
            onProgress(progress); // Pass the progress to the callback function
        }

        return media_id;
    } catch (error) {
        throw error;
    }
};

const uploadFilesToCloudflareV3 = async (user_id, mediaList) => {
    try {
        let totalChunksProcessed = 0;
        let totalChunks = mediaList.reduce((sum, file) => {
            const totalFileChunks = Math.ceil(file.base64.length / (1024 * 600)); // Same chunk size calculation
            return sum + totalFileChunks;
        }, 0);

        // Update the progress for all files
        const onProgress = (progress) => {
            const progressPercentage = ((totalChunksProcessed + progress) / totalChunks);

            // make sure the progress is not more than 100
            store.dispatch('setPostUploadProgress', progressPercentage); // Dispatch progress to store
        };

        const uploadPromises = mediaList.map((file) =>
            uploadFileInChunksv1(user_id, file, 1024 * 600, (progress) => {
                // Update the total progress for the file being uploaded
                totalChunksProcessed += progress;
                onProgress(progress);
            })
        );

        const results = await Promise.all(uploadPromises);
        return results.flat();
    } catch (error) {
        console.log('Error uploading files to Cloudflare:', error.message);
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

        const media = await uploadFilesToCloudflareV3(user.id, mediaList);

        if (!media || media.length === 0) {
            throw new Error("Failed to upload media");
        }

        const formData = new FormData();

        formData.append("user_id", user.id);
        formData.append("caption", caption || "");
        formData.append("location", location || "");
        formData.append("media", JSON.stringify(media));

        if (association_id && association_type) {
            if (association_type !== 'car') {
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


        // If association_id is present and association_type is garage
        // Check if the same entity is in the taggedEntities
        if (association_id && association_type === 'garage') {
            taggedEntities = taggedEntities.filter((entity) => {
                return entity.type == 'car' && entity.entity_id != association_id;
            });
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
        console.log("Error creating post", e.message);
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