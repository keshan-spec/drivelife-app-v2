import {
    verifyScan
} from "./api/scanner.js"
import store from "./store.js"

export const onScanSuccess = async (decodedText) => {
    // https://mydrivelife.com/qr/clpmhHGEXyUD
    // get the qr code and verify it

    if (store.getters.isScanningQrCode.value) {
        return
    }

    store.dispatch('setScanningQrCode', true)

    try {
        const url = new URL(decodedText)

        if (url.hostname === 'mydrivelife.com') {
            const qrCode = url.pathname.split('/').pop()
            if (qrCode) {
                const response = await verifyScan(qrCode)
                store.dispatch('setScannedData', response)
                store.dispatch('setScanningQrCode', false)
            }
        } else {
            store.dispatch('setScannedData', {
                status: 'error',
                message: 'Oops, looks like you scanned an invalid QR code',
                available: false
            })
            store.dispatch('setScanningQrCode', false)
        }
    } catch (error) {
        console.log('error', error)
    }
}

export function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
    // console.warn(`Code scan error = ${error}`)
}