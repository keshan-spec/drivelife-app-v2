// Utility to open and manage IndexedDB
export const openDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('postsCache', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('posts')) {
                db.createObjectStore('posts', { keyPath: 'id' });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject('Error opening IndexedDB');
        };
    });
};

export const savePostToDB = async (post) => {
    const db = await openDatabase();
    const transaction = db.transaction('posts', 'readwrite');
    const store = transaction.objectStore('posts');
    store.put(post);
    return transaction.complete;
};

export const getPostFromDB = async (postId) => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('posts', 'readonly');
        const store = transaction.objectStore('posts');
        const request = store.get(postId);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject('Error fetching post from IndexedDB');
        };
    });
};
