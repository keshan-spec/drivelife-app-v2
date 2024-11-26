import { SignJWT, jwtVerify } from 'jose';
import { Storage } from '@capacitor/storage';

// Secret key (use an environment variable or secure storage for production)
const secret = new TextEncoder().encode('skibiditoilet');
import { USER_DATA_KEY } from './consts';

// Encode (Sign) User Data
async function encodeUserData(userData) {
    return await new SignJWT(userData)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .sign(secret);
}

// Decode (Verify) User Data
async function decodeUserData(token) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        // If the token is invalid, return null
        // Remove the token from storage
        await Storage.remove({ key: USER_DATA_KEY });
        console.error('Error decoding token', error.message);
        return null;
    }
}

export const persistAuth = async (user_data = null) => {
    if (user_data) {
        // If user data exists, update it
        const encodedUserData = await encodeUserData(user_data);
        await Storage.set({
            key: USER_DATA_KEY,
            value: encodedUserData
        });
    } else {
        await Storage.remove({ key: USER_DATA_KEY });
    }
};

export const getPersistedAuth = async () => {
    const { value: encodedUserData } = await Storage.get({ key: USER_DATA_KEY });

    if (encodedUserData) {
        const user_data = await decodeUserData(encodedUserData);
        return {
            user_data
        };
    }

    return null;
};