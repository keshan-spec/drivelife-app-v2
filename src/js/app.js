import $ from 'dom7';
import Framework7 from 'framework7/bundle';

// Import F7 Styles
import 'framework7/css/bundle';
import Swiper from 'swiper';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/custom.css';
import '../css/custom-kesh.css';

// Helpers
import {
  getSessionUser,
  verifyEmail,
} from './api/auth.js';

import {
  sendRNMessage
} from './api/consts.js';

// Import Routes
import routes from './routes.js';
// Import Store
import store from './store.js';

// Import main app component
import App from '../app.f7';

var userStore = store.getters.user;
var notificationCountStore = store.getters.getNotifCount;
var networkErrors = store.getters.checkPoorNetworkError;

var toolbarEl;

export function displayProfile(user, container = 'profile') {
  if (!user) {
    console.error('User object not provided');
    return;
  }

  // Select the container element
  const containerElem = document.querySelector(`.page[data-name="${container}"]`);
  if (!containerElem) {
    console.error(`Container element with data-name="${container}" not found.`);
    return;
  }

  // Profile Head
  const usernameElem = containerElem.querySelector('.profile-usernames .profile-username');
  const nameElem = containerElem.querySelector('.profile-usernames .profile-name');
  if (usernameElem) usernameElem.textContent = `@${user.username}`;
  if (nameElem) nameElem.textContent = `${user.first_name} ${user.last_name}`;


  // followers
  const followerCountElem = containerElem.querySelector('.profile-followers h3');
  if (followerCountElem) followerCountElem.textContent = user.followers.length || 0;

  const postCountElem = containerElem.querySelector('.profile-posts h3');
  if (postCountElem) postCountElem.textContent = user.posts_count || 0;

  // Profile Image
  const profileImageElem = containerElem.querySelector('.profile-head .profile-image');
  if (profileImageElem) {
    profileImageElem.style.backgroundImage = `url('${user.profile_image || 'img/profile-placeholder.jpg'}')`;
  }

  // Cover Image
  if (user.cover_image) {
    const profileBackgroundElem = containerElem.querySelector('.profile-background');
    if (profileBackgroundElem) {
      profileBackgroundElem.style.backgroundImage = `url('${user.cover_image}')`;
    }
  }

  // Profile Links
  const profileLinks = user.profile_links || {};

  const setLinkHref = (selector, url) => {
    const linkElem = containerElem.querySelector(selector);
    if (linkElem) {
      linkElem.setAttribute('href', url);
      linkElem.onclick = (e) => {
        e.preventDefault();
        window.open(url, '_blank');
      };

      // Enable the link
      linkElem.style.opacity = 1;
    }
  };

  if (profileLinks.instagram) {
    setLinkHref('#instagram', `https://www.instagram.com/${profileLinks.instagram}`);
  } else {
    // set opacity to 0.5
    const instagramElem = containerElem.querySelector('#instagram');
    if (instagramElem) {
      instagramElem.style.opacity = 0.2;
      // disable the link
      instagramElem.onclick = (e) => e.preventDefault();
    }
  }

  if (profileLinks.facebook) {
    setLinkHref('#facebook', `https://www.facebook.com/${profileLinks.facebook}`);
  } else {
    // set opacity to 0.5
    const facebookElem = containerElem.querySelector('#facebook');
    if (facebookElem) {
      facebookElem.style.opacity = 0.2;
      // disable the link
      facebookElem.onclick = (e) => e.preventDefault();
    }
  }

  if (profileLinks.tiktok) {
    setLinkHref('#tiktok', `https://www.tiktok.com/@${profileLinks.tiktok}`);
  } else {
    // set opacity to 0.5
    const tiktokElem = containerElem.querySelector('#tiktok');
    if (tiktokElem) {
      tiktokElem.style.opacity = 0.2;
      // disable the link
      tiktokElem.onclick = (e) => e.preventDefault();
    }
  }

  if (profileLinks.youtube) {
    setLinkHref('#youtube', `https://www.youtube.com/@${profileLinks.youtube}`);
  } else {
    // set opacity to 0.5
    const youtubeElem = containerElem.querySelector('#youtube');
    if (youtubeElem) {
      youtubeElem.style.opacity = 0.2;
      // disable the link
      youtubeElem.onclick = (e) => e.preventDefault();
    }
  }

  // Display External Links
  const externalLinks = profileLinks.external_links || []; // Assuming this is an array
  const linksList = containerElem.querySelector('.profile-external-links ul');
  if (linksList) {
    linksList.innerHTML = ''; // Clear any existing links

    if (externalLinks.length > 0) {

      if (profileLinks.custodian) {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = profileLinks.custodian;
        link.target = '_blank';

        link.onclick = (e) => {
          e.preventDefault();
          const url = new URL(profileLinks.custodian);
          window.open(url, '_blank');
        };

        link.textContent = 'Custodian Garage / Car Link';
        listItem.appendChild(link);
        linksList.appendChild(listItem);
      }

      externalLinks.forEach(linkObj => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = linkObj.link.url;

        link.target = '_blank';
        link.textContent = linkObj.link.label;

        link.onclick = (e) => {
          e.preventDefault();
          const url = new URL(linkObj.link.url);
          window.open(url, '_blank');
        };

        listItem.appendChild(link);
        linksList.appendChild(listItem);
      });
    } else {
      // Optionally handle the case where there are no external links
      const noLinksItem = document.createElement('li');
      noLinksItem.textContent = 'No external links available';
      linksList.appendChild(noLinksItem);
    }
  }
}

if (window.f7App !== undefined) {
  var app = window.f7App;
} else {
  // Initialize app
  var app = new Framework7({
    name: 'DriveLife App', // App name
    theme: 'auto', // Automatic theme detection
    view: {
      pushState: false,
      stackPages: true,
      xhrCache: true,
      preloadPreviousPage: true,
      // browserHistory: true,
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

        const deeplink = getQueryParameter('deeplink');
        if (deeplink) {
          // get the page from the deeplink and navigate to it
          // ex; http://localhost:3000/post-view/308
          // get the /post-view/308 and navigate to it
          let path = deeplink.split('/').slice(3).join('/');

          if (!path.startsWith('/')) {
            path = `/${path}`;
          }

          this.views.main.router.navigate(path);
          // remove the query parameter from the URL
          window.history.pushState({}, document.title, window.location.pathname);
        }
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

// Action Sheet with Grid Layout
var actionSheet = app.actions.create({
  grid: true,
  buttons: [
    [{
      text: '<div class="actions-grid-item">Add Post</div>',
      icon: '<img src="img/icon-add-post.svg" width="48" style="max-width: 100%"/>',
      onClick: async function () {
        const user = await getSessionUser();
        if (user) {
          sendRNMessage({
            type: "createPost",
            user_id: user.id,
            page: 'create-post',
          });
        }
      }
    },
    {
      text: '<div class="actions-grid-item">Scan QR Code</div>',
      icon: '<img src="img/icon-qr-code.svg" width="48" style="max-width: 100%;"/>',
      onClick: function () {
        openQRModal();
      }
    },
    {
      text: '<div class="actions-grid-item">My Vehicles</div>',
      icon: '<img src="img/icon-vehicle-add.svg" width="48" style="max-width: 100%;"/>',
      onClick: function () {
        var view = app.views.current;
        view.router.navigate('/profile-garage-edit/');
      }
    }
    ],
  ]
});

async function handleSSOSignIn() {
  $('.init-loader').show();

  // SSO with CarEvents
  const ceToken = getQueryParameter('token');
  if (ceToken) {
    // remove the query parameter from the URL
    window.history.pushState({}, document.title, window.location.pathname);
    window.localStorage.setItem('token', ceToken);
  }

  // check if deeplink url has ?token= query parameter
  // if it does, save the token in the local storage
  const deeplink = getQueryParameter('deeplink');
  if (deeplink) {
    const token = deeplink.split('?token=')[1];
    if (token) {
      window.localStorage.setItem('token', token);
      // remove the query parameter from the URL
      window.history.pushState({}, document.title, window.location.pathname);
    }
  }
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

async function verifyUserEmail(token) {
  // remove the query parameter from the URL
  // window.history.pushState({}, document.title, window.location.pathname)

  try {
    // Clear the app landing page content
    $('.app-landing-page').html('');

    // Add content to show email verification in progress
    $('.app-landing-page').html(`
      <div class="verification-content">
        <div class="block">
          <img src="img/ce-logo-dark.png" />
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

$(document).on('click', '#goto-app', function (e) {
  // remove the query parameter from the URL
  window.history.pushState({}, document.title, window.location.pathname);
  // reload the page
  window.location.reload();
});

$(document).on('click', '.start-link', function (e) {
  if (toolbarEl) {
    toolbarEl.style.display = 'block';
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

export function showToast(message, type = 'Message', position = 'bottom') {
  app.toast.create({
    text: message,
    position: position,
    closeTimeout: 3000,
  }).open();
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

// Function to parse query parameters from the URL
function getQueryParameter(name, url) {
  const urlParams = new URLSearchParams(url || window.location.search);
  return urlParams.get(name);
}

function isAndroid() {
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

export function onBackKeyDown() {
  // check if the device is an android device
  if (!isAndroid()) {
    return;
  }

  var view = app.views.current;

  var leftp = app.panel.left && app.panel.left.opened;
  var rightp = app.panel.right && app.panel.right.opened;

  window.ReactNativeWebView.postMessage(JSON.stringify({
    his: view.history,
    url: app.views.main.router.url,
    leftp,
    rightp
  }));

  if (leftp || rightp) {
    app.panel.close();
    return false;
  } else if ($('.modal-in').length > 0) {
    app.dialog.close();
    app.popup.close();
    return false;
  } else if (view.history[0] == '/social/') {
    window.ReactNativeWebView.postMessage('exit_app');
    return true;
  } else {
    if (view.history.length < 2) {
      $('.tab-link[href="#view-home"]').click();
      return;
    }

    view.router.back();
    return false;
  }
}

function onPostUpload() {
  store.dispatch('getMyPosts', {
    page: 1,
    clear: true
  });

  store.dispatch('getPosts', {
    page: 1,
    reset: true
  });
}

window.onPostUpload = onPostUpload;
window.onAppBackKey = onBackKeyDown;

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

// Init slider
new Swiper('.swiper-container', {
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
});

app.popup.create({
  el: '.share-popup',
  swipeToClose: 'to-bottom'
});

app.popup.create({
  el: '.edit-post-popup',
  swipeToClose: 'to-bottom'
});

// Comments Popup
app.popup.create({
  el: '.comments-popup',
  swipeToClose: 'to-bottom',
  swipeHandler: '.comments-popup .navbar'
});

// Followers Popup
app.popup.create({
  el: '.followers-popup',
  swipeToClose: 'to-bottom',
  swipeHandler: '.followers-popup .navbar'
});

$(document).on('click', '#open-action-sheet', function () {
  console.log('open action sheet', actionSheet);
  actionSheet.open();
});

$(document).on('click', '.view-profile', function (e) {
  $('.view-profile-link').click();
});

$(document).on('page:afterin', '.page[data-name="auth"]', function (e) {
  toolbarEl.style.display = 'none';

  setTimeout(() => {
    $('.init-loader').hide();
  }, 300);
});

export default app;