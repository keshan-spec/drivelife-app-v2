import store from "./store.js";
import app, {
  showToast
} from "./app.js";

import {
  getSessionUser
} from "./api/auth.js";

import { removeFollower } from "./api/profile.js";
import $ from 'dom7';

var garageStore = store.getters.myGarage;
var myPostsStore = store.getters.myPosts;
var myFollowersStore = store.getters.myFollowers;
var myTagsStore = store.getters.myTags;
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

$(document).on('click', '.profile-external-links ul li a', function (e) {
  e.preventDefault();
  const url = new URL(e.target.href);
  window.open(url, '_blank');
});

export function displayGarage(garage) {
  if (!garage) return;

  const garageContainer = document.getElementById('profile-garage'); // Make sure you have a container with this ID
  garageContainer.innerHTML = createGarageContent(garage);
}

export function createGarageContent(garages, currentList, pastList) {
  // Elements for current and past vehicles
  const currentVehiclesList = document.querySelector(currentList);
  const pastVehiclesList = document.querySelector(pastList);

  if (!currentVehiclesList || !pastVehiclesList) {
    console.log('Invalid elements provided for current and past vehicles');
    return;
  }

  currentVehiclesList.innerHTML = ''; // Clear the list before adding new vehicles
  pastVehiclesList.innerHTML = ''; // Clear the list before adding new vehicles

  if (garages.error) {
    currentVehiclesList.innerHTML = '<li>No current vehicles</li>';
    pastVehiclesList.innerHTML = '<li>No past vehicles</li>';
    return;
  }

  // Function to generate vehicle HTML
  function generateVehicleHTML(vehicle) {
    return `
    <li>
        <a href="/profile-garage-vehicle-view/${vehicle.id}" class="item">
            <div class="imageWrapper">
                <div class="image-square image-rounded"
                    style="background-image:url('${vehicle.cover_photo || 'img/placeholder1.jpg'}');">
                    </div>
            </div>
            <div class="in">
                <div>
                    ${vehicle.make} ${vehicle.model}
                </div>
            </div>
        </a>
    </li>
    `;
  }

  // Sort vehicles into current and past vehicles
  garages.forEach(vehicle => {
    if (vehicle.owned_until === "" || vehicle.owned_until.toLowerCase() === "present") {
      currentVehiclesList.innerHTML += generateVehicleHTML(vehicle);
    } else {
      pastVehiclesList.innerHTML += generateVehicleHTML(vehicle);
    }
  });

  if (currentVehiclesList.innerHTML === '') {
    currentVehiclesList.innerHTML = '<li>No current vehicles</li>';
  }

  if (pastVehiclesList.innerHTML === '') {
    pastVehiclesList.innerHTML = '<li>No past vehicles</li>';
  }
}

function generatePostGridItem(post) {
  if (!post.media || post.media.length === 0) return '';

  const media = post.media[0]; // Get the first media item
  const isVideo = media.media_type === "video" || media.media_url.includes('.mp4');

  if (isVideo) {
    return `
      <a href="/post-view/${post.id}" class="grid-item" data-src="${media.media_url}/thumbnails/thumbnail.jpg">
        <img 
          src="${media.media_url}/thumbnails/thumbnail.jpg"
          loading="lazy"
          role="presentation"
          sizes="(max-width: 320px) 280px, 320px"
          decoding="async"
          fetchPriority="high"
          style="object-fit: cover; "
        />
      </a>`;
  } else {
    return `
      <a href="/post-view/${post.id}" class="grid-item image-square" data-src="${media.media_url}">
        <img 
          src="${media.media_url}"
          loading="lazy"
          role="presentation"
          sizes="(max-width: 320px) 280px, 320px"
          decoding="async"
          fetchPriority="high"
          style="object-fit: cover; "
        />
      </a>`;
  }
}

// Calculate the number of posts and decide if we need to add empty items
export function fillGridWithPosts(posts, profileGridID, reset = false) {
  // Select the container where the posts will be displayed
  const profileGrid = document.getElementById(profileGridID);

  if (reset) {
    profileGrid.innerHTML = ''; // Clear the grid before adding new posts
  }

  posts.forEach(post => {
    profileGrid.innerHTML += generatePostGridItem(post);
  });
}

export function displayFollowers(followersList, userFollowingList, container = 'profile') {
  const containerElem = document.querySelector(`.page[data-name="${container}"]`);
  if (!containerElem) {
    console.error(`Container element with data-name="${container}" not found.`);
    return;
  }

  const followersContainer = containerElem.querySelector('.profile-followers-list');
  if (!followersContainer) {
    console.error('Followers list container not found');
    return;
  }

  if (followersList.length === 0) {
    followersContainer.innerHTML = `
      <div class="notification-item">
        <div class="notification-left">
          <div class="notification-text">No followers</div>
        </div>
      </div>
    `;
    return;
  }

  followersContainer.innerHTML = ''; // Clear the list before adding new followers

  followersList.forEach(follower => {
    const followerItem = document.createElement('div');
    followerItem.classList.add('notification-item');

    followerItem.innerHTML = `
      <div class="notification-left ${container == 'profile' ? 'follower-item' : ''}" data-url="/profile-view/${follower.ID}">
        <div class="image-square image-rounded"
          style="background-image:url('${follower.profile_image || 'img/profile-placeholder.jpg'}')"></div>
        <div class="notification-info">
          <div class="notification-text follower-name"><strong>${follower.user_login}</strong></div>
        </div>
      </div>
    `;

    if (container === 'profile') {
      // const isFollowing = userFollowingList.includes(follower.ID)

      // if (isFollowing) {
      followerItem.innerHTML += `
        <div class="btn btn-primary btn-sm remove-follower" data-follower-id="${follower.ID}">Remove</div>
      `;
      // }
      // else {
      //   followerItem.innerHTML += `
      //   <div class="btn btn-primary btn-sm follow-user" data-follower-id="${follower.ID}">Follow</div>
      // `
      // }
    }

    followersContainer.appendChild(followerItem);
  });
}

$(document).on('click', '.follower-item', async function (e) {
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

$(document).on('click', '.remove-follower', async function (e) {
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
    fillGridWithPosts(posts, 'profile-grid-posts', data.cleared || false);
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
    fillGridWithPosts(posts, 'profile-grid-tags', data.cleared || false);
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
    fillGridWithPosts(posts, 'garage-posts-tab');
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
    fillGridWithPosts(posts, 'garage-tags-tab');
  }
});

$(document).on('page:init', '.page[data-name="profile-garage-edit"]', async function (e) {
  const garage = garageStore.value;
  createGarageContent(garage, '#garage-edit-current-list', '#garage-edit-past-list');
});