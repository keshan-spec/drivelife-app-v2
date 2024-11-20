import {
    onScanFailure,
    onScanSuccess
} from './qr-scanner.js';
import {
    handleLink,
    handleUnlink
} from './api/scanner.js';
import app, { showToast } from "./app.js";
import store from "./store.js";

import $ from 'dom7';
import { Html5Qrcode } from "html5-qrcode";
import { openSettings } from './native.js';

var html5QrCode;
let defaultConfig = {
    qrbox: {
        width: 250,
        height: 250
    },
    fps: 60,
    showTorchButtonIfSupported: true,
    showZoomSliderIfSupported: true,
    // aspectRatio: 1.7777778
};

const renderResult = (result) => {
    const user = store.getters.user.value;

    if (!result || result.status === 'error') {
        return `<h2 class="text-center">${result?.message || 'Oops, looks like you scanned an invalid QR code'}</h2>`;
    }

    if (result.available) {
        return (
            `<h2 class="text-center">Congrats! This QR code is up for grabs</h2>
        <button id="link-profile">
          Link Profile
        </button>`
        );
    }

    if (!result.available) {
        var view = app.views.current;

        if (result.data && result.data.linked_to != user?.id) {
            view.router.navigate(`/profile-view/${result.data.linked_to}`);
            return;
        }

        return (
            `
        <h2 class="text-center">Sorry, this QR code is already linked</h2>
        ${result.data && result.data.linked_to == user?.id ? (
                `<button id="unlink-profile"
          onClick={handleUnlink}
        >
          Unlink Profile
        </button>`
            ) : '  '}
      `
        );
    }
};

async function checkCameraPermissions() {
    try {
        // Check if the user has granted camera permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Close the stream after checking
        return true;
    } catch (error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            app.dialog.confirm('You need to grant camera permissions to scan QR codes', 'Camera Permissions', function () {
                openSettings();
            });
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            showToast('No camera found on this device');
        }
        return false;
    }
}

// Function to create and open the modal with default content
export function openModal() {
    const myModal = app.dialog.create({
        title: 'Scan QR Code',
        content: `
      <div id="custom-modal-content">
        <div id="reader" width="600px"></div>
      </div>
    `,
        buttons: [{
            text: 'Close',
            onClick: function () {
                try {
                    if (html5QrCode) {
                        html5QrCode.stop();
                    }

                    store.dispatch('setScannedData', null);
                } catch (error) {
                    console.error('Error stopping qr code', error);
                }
            }
        }]
    });

    // Open the modal
    myModal.open();
}

export async function openQRModal() {
    const permissionGranted = await checkCameraPermissions();
    if (!permissionGranted) return;

    openModal();

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode?.start(
        { facingMode: "environment" },
        defaultConfig,
        onScanSuccess,
        onScanFailure
    );
}

// on link profile
$(document).on('click', '#link-profile', async function () {
    const result = store.getters.scannedData.value;

    if (result) {
        const response = await handleLink(result);
        if (response.status === 'error') {
            store.dispatch('setScannedData', {
                status: 'error',
                message: response.text,
                available: false
            });
        }

        app.dialog.close();
        app.dialog.alert(response.message);

        // reset the scanned data
        store.dispatch('setScannedData', null);
    }
});

// unlink profile
$(document).on('click', '#unlink-profile', async function () {
    const result = store.getters.scannedData.value;
    // close the modal
    app.dialog.close();

    if (result) {
        const response = await handleUnlink(result);
        if (response.type === 'success') {
            app.dialog.alert(response.text);
        }

        // reset the scanned data
        store.dispatch('setScannedData', null);
    }
});

$(document).on('click', '.open-qr-modal', async function () {
    console.log('Opening QR modal');
    openQRModal();
});

store.getters.scannedData.onUpdated((data) => {
    if (html5QrCode) {
        html5QrCode.stop();
    }

    if (data) {
        const html = renderResult(data);

        if (!html) {
            // close the modal
            app.dialog.close();
            return;
        }

        document.getElementById('custom-modal-content').innerHTML = html;
    } else {
        // close the modal
        app.dialog.close();
    }
});