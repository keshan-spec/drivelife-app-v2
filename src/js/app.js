import $ from 'dom7';
import Framework7 from 'framework7/bundle';

// Import F7 Styles
import 'framework7/css/bundle';
import Swiper from 'swiper';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';

// Import Routes
import routes from './routes.js';
// Import Store
import store from './store.js';

// Import main app component
import App from '../app.f7';
import {
  getIDFromQrCode
} from './api/scanner.js';

import {
  displayProfile
} from './profile.js';

import { getQueryParameter, handleSSOSignIn, verifyUserEmail } from './utils.js';
import {
  openModal,
  openQRModal
} from './qr.js';

import { App as CapacitorApp } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { getCurrentPosition } from './native.js';

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

        const verifyToken = getQueryParameter('verifyToken');
        if (verifyToken) {
          await verifyUserEmail(verifyToken);
          return;
        }

        await handleSSOSignIn(); // SSO with CarEvents
        await store.dispatch('checkAuth');

        const isAuthenticated = store.getters.isAuthenticated.value;

        if (!isAuthenticated) {
          this.views.main.router.navigate('/auth/');
        } else {
          $('.init-loader').hide();
          $('.start-link').click();
        }

        await handleQRCode();
      },
      pageInit: function (page) {
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

$(document).on('mousedown', '.toolbar-bottom a', async function (e) {
  var targetHref = $(this).attr('href');
  var validTabs = ['#view-social', '#view-discover', '#view-store', '#view-profile'];

  if ($(this).hasClass('tab-link-active') && validTabs.includes(targetHref)) {
    var view = app.views.current;
    if (view.history.length > 1) {
      view.router.back(view.history[0], {
        force: true
      });
    }
  }
  if (!view || !view.history) {
    return;
  }

  if (targetHref == '#view-social' && view.history.length <= 1) {
    $('.page-current .page-content').scrollTop(0, 200);

    const ptrContent = app.ptr.get('.ptr-content.home-page');
    if (ptrContent) {
      ptrContent.refresh();
    }
  }
});

$(document).on('click', '.view-profile', function (e) {
  $('.view-profile-link').click();
});

$(document).on('page:afterin', '.page[data-name="auth"]', function (e) {
  if (toolbarEl) {
    toolbarEl.style.display = 'none';
  }

  setTimeout(() => {
    $('.init-loader').hide();
  }, 300);
});

$(document).on('click', '#scar-qr-code', function (e) {
  try {
    openQRModal();
  } catch (error) {
    console.log(error);
  }
});

/* Store event listeners */
userStore.onUpdated(async (data) => {
  if (data && data.id && !data.external_refresh && !data.refreshed) {
    getCurrentPosition();

    store.dispatch('getPosts', {
      page: 1,
      reset: true
    });
    store.dispatch('getFollowingPosts', {
      page: 1,
      reset: true
    });
  }
});

notificationCountStore.onUpdated((data) => {
  document.querySelectorAll('.notification-count').forEach((el) => {
    el.innerHTML = data;
    el.style.display = data > 0 ? 'flex' : 'none';
  });
});

networkErrors.onUpdated((data) => {
  if (data) {
    app.dialog.alert('Poor network connection. Please check your internet connection and try again.');
  }
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
      CapacitorApp.minimizeApp();
      return true;
    }

    var leftp = app.panel.left && app.panel.left.opened;
    var rightp = app.panel.right && app.panel.right.opened;

    if (leftp || rightp) {
      app.panel.close();
      return false;
    } else if ($('.modal-in').length > 0) {
      app.dialog.close();
      app.popup.close();
      return false;
    } else if (view.history[0] == '/social/') {
      if (view.history.length > 1) {
        view.router.back();
        return false;
      } else {
        CapacitorApp.minimizeApp();
        return true;
      }
    } else {
      if (view.history.length < 2) {
        $('.tab-link[href="#view-home"]').click();
        return;
      }

      view.router.back();
      return false;
    }
  } catch (error) {
    console.log(error);
  }
});

/* Deep linking */
CapacitorApp.addListener('appUrlOpen', async (data) => {
  const url = data.url;

  let path = url.split('/').slice(3).join('/');

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  const view = app.views.current;
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