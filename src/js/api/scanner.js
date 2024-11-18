import {
    getSessionUser
} from "./auth.js"
import {
    API_URL
} from "./consts.js"

export const verifyScan = async (decodedText) => {
    const user = await getSessionUser()

    const response = await fetch(`${API_URL}/wp-json/app/v1/verify-qr-code`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: user?.id,
            qr_code: decodedText
        }),
    })

    const data = await response.json()
    return data
}

const linkProfile = async (decodedText) => {
    const user = await getSessionUser()

    const response = await fetch(`${API_URL}/wp-json/app/v1/link-qr-code-entity`, {
        cache: "no-cache",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            entity_id: user?.id,
            qr_code: decodedText,
            entity_type: "profile"
        }),
    })

    const data = await response.json()
    return data
}

const unlinkProfile = async (decodedText) => {
    const user = await getSessionUser()

    const response = await fetch(`${API_URL}/wp-json/app/v1/unlink-qr-code-entity`, {
        cache: "no-cache",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            qr_code: decodedText,
            entity_id: user?.id,
            entity_type: "profile"
        }),
    })

    const data = await response.json()
    return data
}

export const getIDFromQrCode = async (decodedText) => {
    const response = await fetch(`${API_URL}/wp-json/app/v1/get-linked-entity`, {
        cache: "no-cache",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            qr_code: decodedText
        }),
    })

    const data = await response.json()

    if ((data && data.error) || response.status === 404) {
        throw new Error(data.error)
    }

    return data
}

export const handleLink = async (result) => {
    if (!result) {
        return
    }

    try {
        const response = await linkProfile(result?.qr_code)
        return response
    } catch (e) {
        console.error("Error linking profile", e)
        return {
            status: 'error',
            text: 'Error linking profile'
        }
    }
}

export const handleUnlink = async (result) => {
    if (!result) {
        return
    }

    try {
        const response = await unlinkProfile(result?.qr_code)

        if (response.status === 'error') {
            return {
                type: 'error',
                text: response.message
            }
        } else {
            return {
                type: 'success',
                text: response.message
            }
        }

    } catch (e) {
        console.error("Error unlinking profile", e)
        return {
            type: 'error',
            text: 'Error unlinking profile'
        }
    }
}