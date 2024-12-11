import { fillGridWithPosts, } from "./profile-ui-helpers.js";
import store from "./store.js";

import $ from 'dom7';

var totalPostPages = 1;
var totalFPostPages = 1;
var currentPostPage = 1;
var refreshed = false;
var currentFPostPage = 1;

var isFetchingPosts = false;

var userId = null;

$(document).on('page:init', '.page[data-name="profile-view"]', async function (e) {
    userId = e.detail.route.params.id;

    currentPostPage = 1;
    currentFPostPage = 1;
    isFetchingPosts = false;
    refreshed = false;
});

function populateUsersPosts(data) {
    if (data) {
        const postsKey = `user-${userId}-posts`;
        const tagsKey = `user-${userId}-tags`;

        // Handle posts
        if (data[postsKey]) {
            totalPostPages = data[postsKey].total_pages || 0;
            currentPostPage = data[postsKey].page || 1;

            let reset = data[postsKey].cleared || false;

            // Only update the DOM if there are new posts
            if (data[postsKey].new_data && data[postsKey].new_data.length > 0) {
                fillGridWithPosts(data[postsKey].new_data, `.page-content[data-user-id="${userId}"] #profile-view-grid-posts`, reset);
                // Clear new_data after processing to avoid re-rendering

                data[postsKey].new_data = [];
            }

            if ((data[postsKey].page === totalPostPages) || (totalPostPages == 0)) {
                // hide preloader
                $(`.page-content[data-user-id="${userId}"] .infinite-scroll-preloader.posts-tab.view-profile`).hide();
            }

            if (data[postsKey].data.length === 0) {
                const profileGrid = document.querySelector(`.page-content[data-user-id="${userId}"] #profile-view-grid-posts`);
                profileGrid.innerHTML = '<p></p><p>No posts</p>';
                return;
            }

        }

        // Handle tags
        if (data[tagsKey]) {
            totalFPostPages = data[tagsKey].total_pages || 0;
            currentFPostPage = data[tagsKey].page || 1;

            let reset = data[tagsKey].cleared || false;

            // Only update the DOM if there are new tags
            if (data[tagsKey].new_data && data[tagsKey].new_data.length > 0) {
                fillGridWithPosts(data[tagsKey].new_data, `.page-content[data-user-id="${userId}"] #profile-view-grid-tags`, reset);
                // Clear new_data after processing to avoid re-rendering
                data[tagsKey].new_data = [];
            }

            if ((data[tagsKey].page === totalFPostPages) || (totalFPostPages == 0)) {
                // hide preloader
                $(`.page-content[data-user-id="${userId}"] .infinite-scroll-preloader.tags-tab.view-profile`).hide();
            }

            if (data[tagsKey].data.length === 0) {
                const profileGrid = document.querySelector(`.page-content[data-user-id="${userId}"] #profile-view-grid-tags`);
                profileGrid.innerHTML = '<p></p><p>No tagged posts</p>';
                return;
            }

        }
    }
}

store.getters.getUserPathUpdated.onUpdated(() => {
    const data = store.getters.getUserPathData.value;
    populateUsersPosts(data);
});

$(document).on('infinite', '.profile-landing-page.infinite-scroll-content.view-page', async function (e) {
    if (isFetchingPosts) return;

    const activeTab = document.querySelector('.profile-tabs .tab-link-active');
    const activeTabId = activeTab.id;

    if (!activeTabId || activeTabId === 'my-garage') return;

    const getterFunc = activeTabId === 'my-posts' ? 'getUserPosts' : 'getUserTags';

    isFetchingPosts = true;

    if (activeTabId === 'my-posts') {
        currentPostPage++;
        if (currentPostPage <= totalPostPages) {
            await store.dispatch(getterFunc, {
                user_id: userId,
                page: currentPostPage
            });
            isFetchingPosts = false;
        }
    } else {
        currentFPostPage++;

        if (currentFPostPage <= totalFPostPages) {
            await store.dispatch(getterFunc, {
                user_id: userId,
                page: currentFPostPage
            });
            isFetchingPosts = false;
        }
    }
});
