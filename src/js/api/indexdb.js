// Utility to open and manage IndexedDB
export const openDatabase = (cacheKey) => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('siteCache', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Creating object store:', cacheKey);

            if (!db.objectStoreNames.contains(cacheKey)) {
                db.createObjectStore(cacheKey, { keyPath: 'id' }); // Adjust 'id' if your data structure is different
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result); // Resolve the database connection
        };

        request.onerror = (event) => {
            reject(`Error opening IndexedDB: ${event.target.errorCode}`);
        };
    });
};

export const saveToDB = async (cacheKey, data) => {
    try {
        const db = await openDatabase(cacheKey);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(cacheKey, 'readwrite');
            const store = transaction.objectStore(cacheKey);

            const request = store.put(data); // Inserts or updates the record
            request.onsuccess = () => {
                resolve('Data saved successfully');
            };
            request.onerror = (event) => {
                reject(`Error saving data: ${event.target.errorCode}`);
            };
        });
    } catch (error) {
        console.error('Error in saveToDB:', error);
    }
};

export const removeFromDB = async (cacheKey, id) => {
    try {
        const db = await openDatabase(cacheKey);

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(cacheKey, 'readwrite');
            const store = transaction.objectStore(cacheKey);

            const request = store.delete(id); // Deletes the item with the given `id`

            request.onsuccess = () => {
                resolve(`Item with id ${id} removed successfully`);
            };

            request.onerror = (event) => {
                reject(`Error removing item with id ${id}: ${event.target.error}`);
            };
        });
    } catch (error) {
        console.error('Error in removeFromDB:', error);
    }
};

export const updateById = async (cacheKey, id, data) => {
    try {
        const db = await openDatabase(cacheKey);

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(cacheKey, 'readwrite');
            const store = transaction.objectStore(cacheKey);

            const request = store.get(id);

            request.onsuccess = () => {
                const existingData = request.result;
                const updatedData = { ...existingData, ...data };
                const updateRequest = store.put(updatedData);

                updateRequest.onsuccess = () => {
                    resolve('Data updated successfully');
                };

                updateRequest.onerror = (event) => {
                    reject(`Error updating data: ${event.target.errorCode}`);
                };
            };

            request.onerror = (event) => {
                reject(`Error fetching item with id ${id}: ${event.target.errorCode}`);
            };
        });
    } catch (error) {
        console.error('Error in updateById:', error);
    }
};

export const clearDB = async (cacheKey) => {
    try {
        const db = await openDatabase(cacheKey);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(cacheKey, 'readwrite');
            const store = transaction.objectStore(cacheKey);

            const request = store.clear(); // Clears all records
            request.onsuccess = () => {
                resolve('All data cleared successfully');
            };
            request.onerror = (event) => {
                reject(`Error clearing data: ${event.target.errorCode}`);
            };
        });
    } catch (error) {
        console.error('Error in clearDB:', error);
    }
};

export const getFromDB = async (cacheKey) => {
    try {
        const db = await openDatabase(cacheKey);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(cacheKey, 'readonly');
            const store = transaction.objectStore(cacheKey);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject('Error fetching data from IndexedDB');
            };
        });
    } catch (error) {
        return [];
    }
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
