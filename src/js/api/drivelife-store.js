import {
    getSessionUser
} from './auth.js';
import { STORE_API_URL } from "./consts";

import { Storage } from '@capacitor/storage';

const saveIntentId = async (intentId) => {
    try {
        await Storage.set({
            key: 'stripeIntentId',
            value: JSON.stringify({ id: 'intent', intentId }),
        });
    } catch (error) {
        console.error('Error saving intent ID', error);
        throw error;
    }
};

const getIntentId = async () => {
    try {
        const result = await Storage.get({ key: 'stripeIntentId' });
        if (result.value) {
            return JSON.parse(result.value);
        }
        return null;
    } catch (error) {
        console.error('Error retrieving intent ID', error);
        throw error;
    }
};

const saveSetupIntentId = async (intentId, email) => {
    try {
        await Storage.set({
            key: 'stripeSetupIntentId',
            // 10 minutes
            value: JSON.stringify({ id: email, intentId, expires: Date.now() + 600000 }),
        });
    } catch (error) {
        console.error('Error saving setup intent ID', error);
        throw error;
    }
};

const getSetupIntentId = async (email) => {
    try {
        const result = await Storage.get({ key: 'stripeSetupIntentId' });

        // Check if the email matches
        if (result.value) {
            const { id, intentId } = JSON.parse(result.value);
            if (id === email) {
                // Check if the intent has expired
                if (Date.now() > intentId.expires) {
                    return null;
                }

                return { clientSecret: intentId };
            }
        }

        return null;
    }
    catch (error) {
        console.error('Error retrieving setup intent ID', error);
        throw error;
    }
};

export const clearSetupIntentId = async () => {
    try {
        await Storage.remove({ key: 'stripeSetupIntentId' });
    } catch (error) {
        console.error('Error clearing setup intent ID', error);
    }
};

const generateMetaData = (cart) => {
    // DriveLife #WeDriveTogether – Raising Funds for MIND (26503) x1
    const items = cart.map(item => ` (${item.id}) ${item.name} x ${item.quantity}`).join(', ');

    return {
        Products: items,
    };
};

export const getStoreProducts = async () => {

    try {
        const user = await getSessionUser();
        if (!user || !user.id) return;

        const response = await fetch(`${STORE_API_URL}/wp-json/app-store/v1/get-products`, {
            method: "GET",
            // cors
            // mode: "no-cors",
            // cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        if (response.status !== 200) {
            return null;
        }

        return data;
    } catch (error) {
        console.log("Error getting store products", error);
        return null;
    }
};

export async function createPaymentIntent(amount, cart) {
    try {
        const user = await getSessionUser();
        if (!user || !user.id) return;

        const existing_intent = await getIntentId();
        const meta_data = generateMetaData(cart);

        const response = await fetch(`${STORE_API_URL}/wp-json/app-store/v1/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount * 100, // Convert amount to cents
                currency: 'gbp',
                user_id: user.id,
                // 'keshanth641@gmail.com',
                customer_email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                existing_intent: existing_intent ? existing_intent.intentId : null,
                meta_data
            }),
        });

        const data = await response.json();
        if (data.clientSecret && data.intentId) {
            saveIntentId(data.intentId);
            return data;
        } else {
            throw new Error(data.error || 'Failed to create payment intent');
        }
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return null;
    }
}

export async function createSetUpIntent() {
    try {
        const user = await getSessionUser();
        if (!user || !user.id) return;

        const existing_intent = await getSetupIntentId(user.email);
        console.log('existing_intent', existing_intent);

        if (existing_intent) {
            return existing_intent;
        }

        const response = await fetch(`${STORE_API_URL}/wp-json/app-store/v1/create-setup-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
            }),
        });

        const data = await response.json();
        if (data.clientSecret) {
            saveSetupIntentId(data.clientSecret, user.email);
            return data;
        } else {
            throw new Error(data.error || 'Failed to create payment intent');
        }
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return null;
    }
}