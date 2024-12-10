import store from "./store.js";
import app, {
  showToast
} from "./app.js";

import {
  getSessionUser
} from "./api/auth.js";

import { removeFollower } from "./api/profile.js";
import $ from 'dom7';

import { createGarageContent, displayFollowers, displayProfile, fillGridWithPosts } from "./profile-ui-helpers.js";
import { OFFLINE_HTML } from "./api/consts.js";


var garageStore = store.getters.myGarage;
var myPostsStore = store.getters.myPosts;
var myFollowersStore = store.getters.myFollowers;
var myTagsStore = store.getters.myTags;
var networkErrors = store.getters.checkPoorNetworkError;
var userStore = store.getters.user;
var refreshed = false;

var isFetchingPosts = false;
var totalPostPages = 1;
var totalFPostPages = 1;

var currentPostPage = 1;
var currentFPostPage = 1;

// Garage posts
var totalGaragePostPages = 1;
var currentGaragePostPage = 1;

// Garage tags
var totalGarageTagPages = 1;
var currentGarageTagPage = 1;

var garageUpdated = null;

networkErrors.onUpdated((data) => {
  if (data === true) {
    // update the dom 
    $('.my-profile .profile-links').hide();
    $('.my-profile .profile-lower').html(OFFLINE_HTML);
  }
});

$('#app').on('click', '.profile-external-links ul li a', function (e) {
  e.preventDefault();
  const url = new URL(e.target.href);
  window.open(url, '_blank');
});

$('#app').on('click', '.follower-item', async function (e) {
  const view = app.views.current;

  const url = this.getAttribute('data-url');
  console.log(url);

  if (!url) return;

  // hide the comments popup
  app.popup.close();
  e.preventDefault();

  view.router.navigate(url, {
    force: true
  });

});

$('#app').on('click', '.remove-follower', async function (e) {
  const followerId = e.target.getAttribute('data-follower-id');

  if (!followerId) return;

  try {
    app.preloader.show();

    const response = await removeFollower(followerId);

    if (!response || !response.success) {
      throw new Error(response.message || 'Failed to remove follower');
    }

    app.preloader.hide();
    showToast('Follower removed successfully');

    // remove the element from the list
    e.target.parentElement.remove();
    store.dispatch('updateUserDetails');
  } catch (error) {
    app.preloader.hide();
    showToast(error.message || 'Failed to remove follower');
  }
});

userStore.onUpdated((user) => {
  displayProfile(user);
  isFetchingPosts = false;
  currentPostPage = 1;
  currentFPostPage = 1;
});

garageStore.onUpdated((garage) => {
  // clear path data
  store.dispatch('clearPathData');
  garageUpdated = garage;
  createGarageContent(garage, '.current-vehicles-list', '.past-vehicles-list');
  createGarageContent(garage, '#garage-edit-current-list', '#garage-edit-past-list');
});

myFollowersStore.onUpdated((data) => {
  const followers = data.followers || [];
  displayFollowers(followers, userStore?.value?.following || []);
});

myPostsStore.onUpdated((data) => {
  if (data && data.new_data) {
    const posts = data.new_data;
    totalPostPages = data.total_pages;

    if ((data.page === data.total_pages) || (data.total_pages == 0)) {
      // hide preloader
      $('.infinite-scroll-preloader.posts-tab').hide();
    }

    if (data.data.length === 0) {
      const profileGrid = document.getElementById('profile-grid-posts');
      profileGrid.innerHTML = '<p></p><p>No posts</p>';
      return;
    }

    // Call the function to fill the grid
    fillGridWithPosts(posts, '#profile-grid-posts', data.cleared || false);
  }
});

myTagsStore.onUpdated((data) => {
  if (data && data.new_data) {
    const posts = data.new_data;
    totalFPostPages = data.total_pages;

    if ((data.page === data.total_pages) || (data.total_pages == 0)) {
      // hide preloader
      $('.infinite-scroll-preloader.tags-tab').hide();
    }

    if (data.data.length === 0) {
      const profileGrid = document.getElementById('profile-grid-tags');
      profileGrid.innerHTML = '<p></p><p>No tagged posts</p>';
      return;
    }

    // Call the function to fill the grid
    fillGridWithPosts(posts, '#profile-grid-tags', data.cleared || false);
  }
});

$(document).on('infinite', '.profile-landing-page.infinite-scroll-content', async function (e) {
  refreshed = false;

  if (isFetchingPosts) return;

  const activeTab = document.querySelector('.profile-tabs .tab-link-active');
  const activeTabId = activeTab.id;

  if (!activeTabId || activeTabId === 'my-garage') return;

  const getterFunc = activeTabId === 'my-posts' ? 'getMyPosts' : 'getMyTags';

  isFetchingPosts = true;

  if (activeTabId === 'my-posts') {
    currentPostPage++;

    if (currentPostPage <= totalPostPages) {
      await store.dispatch(getterFunc, {
        page: currentPostPage,
        clear: false
      });
      isFetchingPosts = false;
    }
  } else {
    currentFPostPage++;

    if (currentFPostPage <= totalFPostPages) {
      await store.dispatch(getterFunc, {
        page: currentPostPage,
        clear: false
      });
      isFetchingPosts = false;
    }
  }
});


$(document).on('page:beforein', '.page[data-name="profile"]', async function (e) {
  const user = await getSessionUser();

  if (user && user.id) {
    const isEmailVerified = user.email_verified ?? false;

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
      } else {
        console.log('Profile head element not found.');
      }
    }
  }

  if (garageUpdated) {
    createGarageContent(garageUpdated, '.current-vehicles-list', '.past-vehicles-list');
  }

  garageUpdated = null;

  app.popup.create({
    el: '.links-popup',
    swipeToClose: 'to-bottom'
  });
});

// ------- Garage Views -------
store.getters.getGarageViewPosts.onUpdated((data) => {
  if (data && data.data) {
    const posts = data.data;

    totalGaragePostPages = data.total_pages;

    // if there is only one page of posts or no posts
    if ((data.page == data.total_pages) || (data.total_pages == 0)) {
      // hide preloader
      $('.infinite-scroll-preloader.garage-posts-tab').hide();
    }

    if (data.data.length === 0) {
      const profileGrid = document.getElementById('garage-posts-tab');
      profileGrid.innerHTML = '<p></p><p>No posts yet</p>';
      return;
    }

    if (data.page === 1) {
      // clear the grid before adding new posts
      const profileGrid = document.getElementById('garage-posts-tab');
      profileGrid.innerHTML = '';
    }

    // Call the function to fill the grid
    fillGridWithPosts(posts, '#garage-posts-tab');
  }
});

store.getters.getGarageViewTags.onUpdated((data) => {
  if (data && data.data) {
    const posts = data.data;
    totalGarageTagPages = data.total_pages;

    // if there is only one page of posts or no posts
    if ((data.page == data.total_pages) || (data.total_pages == 0)) {
      // hide preloader
      $('.infinite-scroll-preloader.garage-tags-tab').hide();
    }

    if (data.data.length === 0) {
      const profileGrid = document.getElementById('garage-tags-tab');
      profileGrid.innerHTML = '<p></p><p>No tagged posts yet</p>';
      return;
    }

    if (data.page === 1) {
      // clear the grid before adding new posts
      const profileGrid = document.getElementById('garage-tags-tab');
      profileGrid.innerHTML = '';
    }

    // Call the function to fill the grid
    fillGridWithPosts(posts, '#garage-tags-tab');
  }
});

$(document).on('page:init', '.page[data-name="profile-garage-edit"]', async function (e) {
  const garage = garageStore.value;
  createGarageContent(garage, '#garage-edit-current-list', '#garage-edit-past-list');
});