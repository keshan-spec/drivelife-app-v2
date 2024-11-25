import { SignJWT, jwtVerify } from 'jose';

// Secret key (use an environment variable or secure storage for production)
const secret = new TextEncoder().encode('your-secure-secret');
import { LAST_FETCHED_KEY, USER_DATA_KEY } from './consts';

// Encode (Sign) User Data
async function encodeUserData(userData) {
    return await new SignJWT(userData)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h') // Optional expiration
        .sign(secret);
}

// Decode (Verify) User Data
async function decodeUserData(token) {
    const { payload } = await jwtVerify(token, secret);
    return payload;
}


export const persistAuth = async (user_data = null) => {
    if (user_data) {
        // If user data exists, update it
        const encodedUserData = await encodeUserData(user_data);
        window.localStorage.setItem(USER_DATA_KEY, encodedUserData);

        // Update last fetched time
        window.localStorage.setItem(LAST_FETCHED_KEY, new Date().getTime());
    } else {
        // If user data doesn't exist, clear it
        window.localStorage.removeItem(USER_DATA_KEY);
        window.localStorage.removeItem(LAST_FETCHED_KEY);
    }
};

export const getPersistedAuth = async () => {
    const encodedUserData = window.localStorage.getItem(USER_DATA_KEY);
    const lastFetched = window.localStorage.getItem(LAST_FETCHED_KEY);

    if (encodedUserData) {
        const user_data = await decodeUserData(encodedUserData);
        return {
            user_data,
            lastFetched
        };
    }

    return null;
};