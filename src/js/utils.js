import { verifyEmail } from "./api/auth";

export function formatPostDate(date) {
    const postDate = new Date(date);
    // show date as Just now, 1 minute ago, 1 hour ago, 1 day ago, 1 week ago, 1 month ago, 1 year ago
    const currentDate = new Date();
    const diff = currentDate - postDate;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) {
        return months === 1 ? '1 month ago' : `${months} months ago`;
    }

    if (weeks > 0) {
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }

    if (days > 0) {
        return days === 1 ? '1 day ago' : `${days} days ago`;
    }

    if (hours > 0) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }

    if (minutes > 0) {
        return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }

    return 'Just now';
}

export const timedFetch = async (url, fetchObj, error = 'Your connection seems unstable.', timeout = TIMEOUT_MS_LOW) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const user = await getSessionUser();
        if (!user) return;

        setTimeout(() => {
            controller.abort();
        }, TIMEOUT_MS_LOW);

        const response = await fetch(url,
            fetchObj,
            signal
        );

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw {
                message: error,
                name: "TimeOutError"
            };
        } else {
            throw error; // Rethrow any other errors
        }
    }
};

// Function to parse query parameters from the URL
export function getQueryParameter(name, url) {
    const urlParams = new URLSearchParams(url || window.location.search);
    return urlParams.get(name);
}

export async function verifyUserEmail(token) {
    // remove the query parameter from the URL
    // window.history.pushState({}, document.title, window.location.pathname)

    try {
        // Clear the app landing page content
        $('.app-landing-page').html('');

        // Add content to show email verification in progress
        $('.app-landing-page').html(`
      <div class="verification-content">
        <div class="block">
          <img src="assets/img/ce-logo-dark.png" />
        <div class="verification-header">
          <h1>Email Verification</h1>
        </div>
        <div class="verification-body">
          <div class="verification-loader">
            <div class="preloader color-white"></div> 
          </div>
          <div class="verification-message">
            <p>Verifying your email address...</p>
          </div>
        </div>
        </div>
      </div>
    `);

        const response = await verifyEmail(token);

        // Check if there's an error in the response
        if (!response || response.status === 'error') {
            // Display an error message
            $('.verification-body').html(`
        <div class="verification-message">
          <p class="verification-error">An error occurred: ${response.message || 'Please try again.'}</p>
          <p class="verification-error">If you continue to experience issues, please contact support.</p>
          <div class="button button-fill button-large" id="goto-app">Go Back</div>
        </div>
      `);
            return;
        }

        if (response.status === 'success') {
            // Show a success message in the DOM
            $('.verification-body').html(`
        <div class="verification-message">
          <p class="verification-success">Your email has been successfully verified! You can now proceed.</p>
          <div class="button button-fill button-large" id="goto-app">Continue</div>
        </div>
      `);
            return;
        }
    } catch (error) {
        // Display a generic error message in case of exceptions
        $('.verification-body').html(`
      <div class="verification-message">
        <p class="verification-error">An unexpected error occurred. Please try again.</p>
        <p class="verification-error">If you continue to experience issues, please contact support.</p>
        <div class="button button-fill button-large" id="goto-app">Go Back</div>
      </div>
    `);
    }
}

export function handleSSOSignIn(url) {
    // SSO with CarEvents
    let path = url.split('/').slice(3).join('/');

    // get token= 
    if (path) {
        path = path.split('?token=')[1];
    }

    const ceToken = path;

    if (ceToken) {
        return ceToken;
    }

    // check if deeplink url has ?token= query parameter
    // if it does, save the token in the local storage
    const deeplink = getQueryParameter('deeplink');
    if (deeplink) {
        const token = deeplink.split('?token=')[1];
        if (token) {
            return token;
        }
    }

    return false;
}

export function isAndroid() {
    const toMatch = [
        /Android/i,
        // /webOS/i,
        // /iPhone/i,
        // /iPad/i,
        // /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i,
    ];

    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

/* Based on this http://jsfiddle.net/brettwp/J4djY/*/
export function detectDoubleTapClosure(callback) {
    let lastTap = 0;
    let timeout;

    return function detectDoubleTap(event) {

        const curTime = new Date().getTime();
        const tapLen = curTime - lastTap;
        if (tapLen < 500 && tapLen > 0) {
            event.preventDefault();

            // pass the event target to the callback
            callback(event.target);
        } else {
            timeout = setTimeout(() => {
                clearTimeout(timeout);
            }, 500);
        }

        lastTap = curTime;
    };
}

export const convertBlobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
});

export function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}