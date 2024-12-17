import $ from 'dom7';
import Framework7 from 'framework7/bundle';
import Swiper from 'swiper';

import { App as CapacitorApp } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';

// Import F7 Styles
import 'framework7/css/bundle';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/custom.css';
import '../css/custom-kesh.css';

import routes from './routes.js';
import store from './store.js';

// Import main app component
import App from '../app.f7';

// Import API functions
import {
  getIDFromQrCode
} from './api/scanner.js';

import { getQueryParameter, handleSSOSignIn, verifyUserEmail } from './utils.js';
import {
  openModal,
} from './qr.js';

import { addListeners, getCurrentPosition, getDeliveredNotifications, registerNotifications } from './native.js';
import { displayProfile } from './profile-ui-helpers.js';

var app;
var toolbarEl;

var userStore = store.getters.user;
var notificationCountStore = store.getters.getNotifCount;
var networkErrors = store.getters.checkPoorNetworkError;

if (window.f7App !== undefined) {
  app = window.f7App;
} else {
  app = new Framework7({
    initOnDeviceReady: true,
    name: 'DriveLife', // App name
    theme: 'ios', // Automatic theme detection
    view: {
      pushState: false,
      stackPages: true,
      xhrCache: true,
      preloadPreviousPage: true,
    },
    notification: {
      title: 'DriveLife',
      closeTimeout: 10000,
      closeOnClick: true,
      icon: '<img src="icons/favicon.png"/>',
    },
    toast: {
      closeTimeout: 3000,
      closeButton: true,
    },
    el: '#app', // App root element
    component: App, // App main component
    // App store
    store: store,
    // App routes
    routes: routes,
    // On app init
    on: {
      init: async function () {
        toolbarEl = $('.footer')[0];

        await store.dispatch('checkAuth');
        const isAuthenticated = store.getters.isAuthenticated.value;

        if (!isAuthenticated) {
          this.views.main.router.navigate('/auth/');
        } else {
          $('.init-loader').hide();
          $('.start-link').click();
        }

        const status = await Network.getStatus();

        if (!status.connected) {
          store.dispatch('setPoorNetworkError', true);
        } else {
          store.dispatch('setPoorNetworkError', false);
        }
      },
      pageInit: function (page) {
        if (page.name === 'store') {
          userStore.onUpdated((data) => {
            if (data && data.id && !data.refreshed) {
              store.dispatch('fetchStoreProducts', {
                page: 1,
              });
            }
          });
        }

        if (page.name === 'profile') {
          userStore.onUpdated((data) => {
            if (data && data.id) {
              const isEmailVerified = data.email_verified ?? false;

              if (!isEmailVerified) {
                const profileHead = $('.page[data-name="profile"] .profile-head');

                if (profileHead.length) {
                  // Add email verification message before the element
                  $(`
                  <div class="email-verification-message">
                    <p>Your email is not verified. Please verify your email address to access all features.</p>
                  </div>
                `).insertBefore(profileHead);

                  profileHead.addClass('email-not-verified');
                }
              }
            }

            if (data && data.id && !data.external_refresh) {
              displayProfile(data, 'profile');
              store.dispatch('getMyGarage');
              store.dispatch('fetchMyFollowers');
            }

            if (data && data.id && !data.refreshed) {
              store.dispatch('getMyPosts', {
                page: 1,
                clear: true
              });
              store.dispatch('getMyTags', {
                page: 1,
                clear: true
              });
            }
          });
        }

        if (page.name === 'discover') {
          userStore.onUpdated((data) => {
            if (data && data.id && !data.refreshed) {
              store.dispatch('getTrendingEvents');
              store.dispatch('getTrendingVenues');
              store.dispatch('filterTrendingUsers');
              store.dispatch('filterTrendingVehicles');
              store.dispatch('fetchEventCategories');
            }
          });
        }

        if (page.name === 'signup-step2') {
          const registerData = store.getters.getRegisterData.value;

          const userNameEl = document.getElementsByName('username')[0];
          userNameEl.value = registerData.username;
        }
      },
    },
  });

  window.f7App = app;
}

$(document).on('click', '#goto-app', function (e) {
  // remove the query parameter from the URL
  window.history.pushState({}, document.title, window.location.pathname);
  // reload the page
  window.location.reload();
});

$(document).on('click', '.start-link', function (e) {
  if (toolbarEl !== undefined && toolbarEl !== null) {
    toolbarEl.style.display = 'flex';
  }

  var view = app.views.current;
  var addVehicle = window.localStorage.getItem('addVehicle');

  if (addVehicle) {
    window.localStorage.removeItem('addVehicle');
    view.router.navigate('/profile-garage-vehicle-add/');
  }
});

$(document).on('page:afterin', '.page[data-name="auth"]', function (e) {
  if (toolbarEl) {
    toolbarEl.style.display = 'none';
  }

  setTimeout(() => {
    $('.init-loader').hide();
  }, 300);
});

$(document).on('page:beforein', function (e) {
  $('.input-clear-button').off('click').on('click', function (e) {
    console.log('clearing input'); // Debugging
    const input = $(this).prev('input'); // Ensure you're targeting the correct element
    if (input.length) {
      input.val(''); // Clear input value
    } else {
      console.error('No input found before the button');
    }
  });
});

/* Store event listeners */
userStore.onUpdated(async (data) => {
  if (data && data.id && !data.external_refresh && !data.refreshed) {
    store.dispatch('getPosts', {
      page: 1,
      reset: true
    });

    store.dispatch('getFollowingPosts', {
      page: 1,
      reset: true
    });

    store.dispatch('loadCart');


    await registerNotifications();
    await getCurrentPosition();

    addListeners(onNotificationReceived, onNotificationOpened);
    getDeliveredNotifications();
  }
});

function onNotificationReceived(notification) {
  // alert('Notification received');
  // alert(JSON.stringify(notification));

  // var view = app.views.current;
  // if (notification && notification.data) {
  //   const { url } = notification.data;

  //   if (url) {
  //     view.router.navigate(url);
  //   }
  // }
}

function onNotificationOpened(notificationObj) {
  try {
    const notification = notificationObj.notification;

    var view = app.views.current;
    if (notification && notification.data) {
      const { url } = notification.data;

      if (url) {
        view.router.navigate(url);
      }
    }
  } catch (error) {
    alert(JSON.stringify(error));
  }
}

notificationCountStore.onUpdated((data) => {
  document.querySelectorAll('.notification-count').forEach((el) => {
    el.innerHTML = data;
    el.style.display = data > 0 ? 'flex' : 'none';
  });
});

/* Native listeners */
CapacitorApp.addListener('backButton', async () => {
  const { platform } = await Device.getInfo();
  if (platform !== 'android') {
    return;
  }

  try {
    var view = app.views.current;

    if (view.history.includes('/auth/')) {
      // CapacitorApp.minimizeApp();
      return true;
    }

    var leftp = app.panel.left && app.panel.left.opened;
    var rightp = app.panel.right && app.panel.right.opened;

    // Query all FS Lightbox elements
    const lightboxes = document.querySelectorAll('.fslightbox-container');
    if (lightboxes.length > 0) {
      // garage-mods
      if (window.fsLightboxInstances['garage-mods']) {
        window.fsLightboxInstances['garage-mods'].close();
        return false;
      }
    }

    if (leftp || rightp) {
      app.panel.close();
      return false;
    } else if ($('.modal-in').length > 0) {
      app.dialog.close();
      app.popup.close();
      return false;
    } else if (view.history[0] == '/') {
      if (view.history.length > 1) {
        // if routes have '/post-add/' or '/post-add-tags/ then dont go back
        // if (view.history.includes('/post-add/') || view.history.includes('/post-add-tags/')) {
        //   return false;
        // }

        view.router.back();
        return false;
      } else {
        // CapacitorApp.minimizeApp();
        return true;
      }
    } else {
      if (view.history.length < 2) {
        $('.tab-link[href="#view-social"]').click();
        return;
      }

      view.router.back();
      return false;
    }
  } catch (error) {
    console.log(error);
  }
});

// App state change
CapacitorApp.addListener('appStateChange', async (state) => {
  if (!state.isActive) {
    store.dispatch('setHomeListenersInitialized', false);
  }
});

Network.addListener('networkStatusChange', status => {
  if (!status.connected) {
    store.dispatch('setPoorNetworkError', true);
  } else {
    store.dispatch('setPoorNetworkError', false);
  }
});

/* Deep linking */
CapacitorApp.addListener('appUrlOpen', async (data) => {
  const view = app.views.current;
  const url = data.url;

  let path = url.split('/').slice(3).join('/');

  // SSO with CarEvents
  const ceToken = handleSSOSignIn(url);
  if (ceToken) {
    $('.init-loader').show();

    await store.dispatch('login', {
      token: ceToken
    });

    window.location.reload();
    return;
  }

  // Verify user email
  if (path.includes('verifyToken')) {
    const token = path.split('?verifyToken=')[1];
    await verifyUserEmail(token);
    return;
  }

  // Handle root url
  if (!path || path === '') {
    return;
  }

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // if path is /qr/8700279E
  // redirect to the profile linked to the QR code
  const isQrCode = path.includes('/qr/');
  if (isQrCode) {
    const qrCode = path.split('/').slice(-1)[0];
    maybeRedirectToProfile(qrCode);
    return;
  }

  // redirect to payment success page
  const isPaymentSuccess = path.includes('payment-success');
  if (isPaymentSuccess) {
    // split by ? and add / before the path
    const params = path.split('?');
    path = `${params[0]}/?${params[1]}`;

    // if router has more than 1 history, go back
    if (view.history.length > 1) {
      view.router.back(path, {
        force: true,
      });
    } else {
      view.router.navigate(path);
    }
    return;
  }

  view.router.navigate(path);
});

/* Helper functions */
export function showToast(message, type = 'Message', position = 'bottom') {
  app.toast.create({
    text: message,
    position: position,
    closeTimeout: 3000,
  }).open();
}

/* Unused function */
async function handleQRCode() {
  const deeplink = getQueryParameter('deeplink');
  if (deeplink) {
    // check if deeplink has ?qr= query parameter
    // if it does, get the value of the qr parameter and redirect to the profile
    // ex; http://localhost:3000/?qr=123456
    const maybeQr = deeplink.split('?qr=')[1];
    const deepqrCode = maybeQr ? maybeQr : null;

    if (deepqrCode) {
      maybeRedirectToProfile(deepqrCode);
      return;
    }

    // check if url looks like https://mydrivelife.com/qr/8700279E
    // if it does, get the qr code and redirect to the profile
    const isDriveLifeUrl = deeplink.includes('mydrivelife.com/qr/');
    if (isDriveLifeUrl) {
      const qrCode = deeplink.split('/').slice(-1)[0];
      maybeRedirectToProfile(qrCode);
      return;
    }
  }

  const qrCode = getQueryParameter('qr');
  if (qrCode) {
    maybeRedirectToProfile(qrCode);
  }
}

async function maybeRedirectToProfile(qrCode) {
  var view = app.views.current;

  try {
    $('.init-loader').show();
    const response = await getIDFromQrCode(qrCode);

    if (response && response.status === 'error') {
      throw new Error(response.message || 'Oops, Unable to find the profile linked to this QR code.');
    }

    const user = store.getters.user.value;
    const id = response?.data?.linked_to;

    if (id) {
      if (user && user.id == id) {
        $('.view-profile-link').click();
      } else {
        view.router.navigate(`/profile-view/${id}`);
      }
    } else {
      openModal();
      setTimeout(() => {
        store.dispatch('setScannedData', {
          status: 'success',
          qr_code: qrCode,
          message: 'QR Code is not linked to any profile',
          available: true
        });
      }, 1000);
    }

    // remove the query parameter from the URL
    window.history.pushState({}, document.title, window.location.pathname);
    $('.init-loader').hide();
  } catch (error) {
    console.log(error);
    window.history.pushState({}, document.title, window.location.pathname);
    app.dialog.alert(error.message || 'Oops, Unable to find the profile linked to this QR code.');
    $('.init-loader').hide();
  }
}

/* Initialize Popups/Modals/Swipers */
new Swiper('.swiper-container', {
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
});

export default app;