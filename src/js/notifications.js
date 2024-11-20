import {
    getSessionUser
} from "./api/auth.js";
import {
    approvePostTag,
    maybeFollowUser,
    removeTagFromPost
} from "./api/profile.js";
import app, { showToast } from "./app.js";
import store from "./store.js";

import $ from 'dom7';

var notificationsStore = store.getters.getNotifications;
var refreshed = false;
var userStore = store.getters.user;
let notificationInterval = null;

$(document).on('page:beforein', '.page[data-name="notifications"]', async function (e) {
    refreshed = true;
    store.dispatch('fetchNotifications', {
        load_more: false
    });
});

$(document).on('page:afterin', '.page[data-name="notifications"]', async function (e) {
    const data = notificationsStore.value;

    if (!data || !data.success) {
        return;
    }

    // a list if all unread notification ids
    const unreadNotificationIds = [
        ...data.data.recent,
        ...data.data.last_week,
        ...data.data.last_30_days,
    ].filter((item) => item.is_read === "0").map((item) => item._id);

    if (unreadNotificationIds.length > 0) {
        store.dispatch('markNotificationsAsRead', unreadNotificationIds);
    }
});


notificationsStore.onUpdated(async (data) => {
    if (!data || !data.success) {
        $('.notification-wrap').html(`<p class="text-center">${data?.message || 'Unable to get notifications'}</p>`);
    } else {
        const notifications = data.data;

        const recentContainer = document.getElementById('recent');
        const thisWeekContainer = document.getElementById('this-week');
        const last30DaysContainer = document.getElementById('last-30-days');

        if (refreshed) {
            if (recentContainer) {
                recentContainer.innerHTML = '';
            }

            if (thisWeekContainer) {
                thisWeekContainer.innerHTML = '';
            }

            if (last30DaysContainer) {
                last30DaysContainer.innerHTML = '';
            }
            refreshed = false;
        }

        var user = await getSessionUser();

        document.querySelectorAll('.app-notification-title').forEach(elem => {
            if (elem.getAttribute('data-id') === 'last-30') {
                if (notifications.last_30_days.length > 0) {
                    elem.innerHTML = elem.getAttribute('data-title');
                } else {
                    elem.innerHTML = '';
                }
                return;
            }
            elem.innerHTML = elem.getAttribute('data-title');
        });

        if (!notifications.recent.length && !notifications.is_paginated) {
            recentContainer.innerHTML = '<p class="text-center">No recent notifications</p>';
        }

        if (!notifications.last_week.length && !notifications.has_more_notifications) {
            thisWeekContainer.innerHTML = '<p class="text-center">No notifications from this week</p>';
        }

        notifications.last_30_days.forEach(notification => {
            const notificationItem = createNotificationItem(notification, user);
            last30DaysContainer.appendChild(notificationItem);
        });

        notifications.recent.forEach(notification => {
            const notificationItem = createNotificationItem(notification, user);
            recentContainer.appendChild(notificationItem);
        });

        notifications.last_week.forEach(notification => {
            const notificationItem = createNotificationItem(notification, user);
            thisWeekContainer.appendChild(notificationItem);
        });

        // add a load more button at the end
        if ((notifications.recent.length >= 0 || notifications.last_week.length >= 0) && (notifications.has_more_notifications)) {
            $('.load-more-notifications').removeClass('hidden');
        } else {
            $('.load-more-notifications').addClass('hidden');
        }
    }
});

$(document).on('click', '.load-more-notifications', async function (e) {
    await store.dispatch('fetchNotifications', {
        load_more: true
    });
});

function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }
}

function createNotificationItem(notification, user) {
    const isFollow = notification.type === 'follow' ? true : false;
    const container = document.createElement(isFollow ? 'div' : 'a');

    if (!isFollow) {
        container.href = `/post-view/${notification.entity.entity_id}`;
    }

    let isReadClass = notification.is_read == "0" ? "unread-notif" : "";

    container.className = `notification-item ${isReadClass}`;
    container.dataset.notificationId = notification._id;

    // Profile image and notification content container
    const leftContainer = document.createElement('div');
    leftContainer.className = 'notification-left';

    const imageDiv = document.createElement('a');
    imageDiv.className = 'image-square image-rounded';
    imageDiv.style.backgroundImage = `url('${notification.entity.initiator_data.profile_image || 'img/profile-placeholder.jpg'}')`;
    imageDiv.href = `/profile-view/${notification.entity.user_id}`;

    const infoDiv = document.createElement('div');
    infoDiv.className = 'notification-info';

    let content = '';

    // Conditional content rendering based on the type
    if (notification.type === 'like') {
        content = `
            <div class="notification-text">
                <a href="/profile-view/${notification.entity.user_id}"><strong>${notification.entity.initiator_data.display_name}</strong></a> liked your ${notification.entity.entity_type}
                ${notification.entity.entity_data.comment ? `<span class="inline font-semibold text-black">: "${notification.entity.entity_data.comment}"</span>` : ''}
                <span class=""></span>
            </div>
        `;
    } else if (notification.type === 'comment') {
        const eclipseComment = notification.entity.entity_data.comment.length > 50 ? notification.entity.entity_data.comment.substring(0, 50) + '...' : notification.entity.entity_data.comment;

        container.href = `/post-view/${notification.entity.entity_data.post_id}?commentId=${notification.entity.entity_id}`;

        content = `
            <div class="notification-text">
                <a href="/profile-view/${notification.entity.user_id}"><strong>${notification.entity.initiator_data.display_name}</strong></a> commented on your post: 
                <span class="font-semibold text-black">"${eclipseComment}"</span>
                <span class="${isReadClass}"></span>
            </div>
        `;
    } else if (notification.type === 'follow') {
        content = `
            <div class="notification-text">
                <a href="/profile-view/${notification.entity.user_id}"><strong>${notification.entity.initiator_data.display_name}</strong></a> followed you
                <span class="${isReadClass}"></span>
            </div>
        `;
    } else if (notification.type === 'mention') {
        content = `
            <div class="notification-text">
                <a href="/profile-view/${notification.entity.user_id}"><strong>${notification.entity.initiator_data.display_name}</strong></a> mentioned you in a ${notification.entity.entity_type}
                ${notification.entity.entity_data.comment ? `<span class="block font-semibold text-black">"${notification.entity.entity_data.comment}"</span>` : ''}
                <span class="${isReadClass}"></span>
            </div>
        `;
    } else if (notification.type === 'post') {
        // <a href="/profile-garage-vehicle-view/${notification.entity.entity_data?.garage?.id}">
        //     <strong>${notification.entity.entity_data?.garage?.make || ''} ${notification.entity.entity_data?.garage?.model || ''}</strong>
        // </a>
        content = `
            <div class="notification-text">
                <a href="/profile-view/${notification.entity.user_id}"><strong>${notification.entity.initiator_data.display_name}</strong></a> has tagged ${notification.entity.entity_type === 'car' ? "your car" : "you"} in a post
                <span class="${isReadClass}"></span>
            </div>
            ${(notification.entity.entity_type === 'car' && !notification.entity.entity_data.tag_approved) ? `<div class="notification-text tag-actions">
                <div class="btn btn-primary btn-sm approve-tag" data-tag-id="${notification.entity.entity_data.tag_id}" data-tag-type="${notification.entity.entity_type}">Approve</div>
                <div class="btn btn-secondary btn-sm decline-tag" data-tag-id="${notification.entity.entity_data.tag_id}" data-tag-type="${notification.entity.entity_type}">Decline</div>
                </div>` : ''}
        `;

        container.href = `#`;
    } else if (notification.type === 'tag') {
        content = `
            <div class="notification-text">
                <a href="/profile-view/${notification.entity.user_id}"><strong>${notification.entity.initiator_data.display_name}</strong></a> ${notification.entity.entity_type === 'car' ? "tagged your car in a post" : "tagged you in a post"}
                <span class="${isReadClass}"></span>
            </div>
            ${(!notification.entity.entity_data.tag_approved && notification.entity.entity_data.tag_id) ? `<div class="notification-text tag-actions">
                <div class="btn btn-primary btn-sm approve-tag" data-tag-id="${notification.entity.entity_data.tag_id}" data-tag-type="${notification.entity.entity_type}">Approve</div>
                <div class="btn btn-secondary btn-sm decline-tag" data-tag-id="${notification.entity.entity_data.tag_id}" data-tag-type="${notification.entity.entity_type}">Decline</div>
                </div>` : ''}
        `;

        container.href = `#`;
    }

    // Add time ago
    const timeSpan = document.createElement('span');
    timeSpan.className = 'notification-time';
    timeSpan.textContent = timeAgo(notification.date);

    infoDiv.innerHTML = `${content} ${timeSpan.outerHTML}`;

    // Adding profile image and content to the left container
    leftContainer.appendChild(imageDiv);
    leftContainer.appendChild(infoDiv);

    // Append left container to the main container
    container.appendChild(leftContainer);

    if (notification.type === 'follow') {
        const isFollowing = user.following.includes(notification.entity.user_id);
        if (!isFollowing) {
            let followBtn = `<div class="btn btn-primary btn-sm toggle-follow" data-is-following="${isFollowing}" data-user-id="${notification.entity.user_id}">
                Follow
            </div>`;
            container.innerHTML += followBtn;
        }
    } else {
        const rightContainer = document.createElement('a');
        rightContainer.className = 'notification-left';
        let path;

        if (notification.entity.entity_type === 'car') {
            path = 'post-view';
            rightContainer.href = `/${path}/${notification.entity.entity_data.post_id}`;

        } else if (notification.entity.entity_type === 'post' || notification.entity.entity_type === 'tag') {
            path = 'post-view';
            rightContainer.href = `/${path}/${notification.entity.entity_id}`;

        } else if (notification.entity.entity_type === 'comment') {
            path = 'post-view';
            rightContainer.href = `/${path}/${notification.entity.entity_data.post_id}?commentId=${notification.entity.entity_id}`;
        } else {
            path = 'profile-view';
            rightContainer.href = `/${path}/${notification.entity.user_id}`;
        }

        if (notification.type === 'tag') {
            path = 'post-view';
            rightContainer.href = `/${path}/${notification.entity.entity_id}`;
        }


        const imageDiv = document.createElement('div');
        imageDiv.className = 'image-square image-rounded';
        imageDiv.style.backgroundImage = `url('${notification.entity.entity_data.media}')`;
        imageDiv.style.backgroundSize = 'cover';
        imageDiv.style.backgroundPosition = 'center';
        imageDiv.style.backgroundColor = '#f1f1f1';

        rightContainer.appendChild(imageDiv);
        container.appendChild(rightContainer);
    }

    return container;
}

$(document).on('click', '.toggle-follow', async function (e) {
    const userId = e.target.dataset.userId;
    const isFollowing = e.target.dataset.isFollowing === 'true';

    if (!isFollowing) {
        // hide the button
        e.target.style.display = 'none';
    }

    // update the button text
    e.target.textContent = isFollowing ? 'Follow' : 'Unfollow';
    e.target.dataset.isFollowing = !isFollowing;

    await maybeFollowUser(userId);
    store.dispatch('updateUserDetails');
});

$(document).on('ptr:refresh', '.notification-page.ptr-content', async function (e) {
    refreshed = true;

    try {
        await store.dispatch('notificationCount');
        await store.dispatch('fetchNotifications', {
            load_more: false
        });
    } catch (error) {
        console.log(error);
    }

    app.ptr.get('.notification-page.ptr-content').done();
});

$(document).on('click', '.approve-tag', async function (e) {
    e.preventDefault();

    const tagId = e.target.dataset.tagId;
    const tagTyype = e.target.dataset.tagType;

    app.preloader.show();
    const response = await approvePostTag(tagId, tagTyype);

    app.preloader.hide();

    if (response.success) {
        // remove the buttons
        e.target.parentElement.innerHTML = '';

        showToast('Tag has been approved');
    } else {
        showToast(response.message || 'Failed to approve tag');
    }
});

$(document).on('click', '.decline-tag', async function (e) {
    e.preventDefault();

    const tagId = e.target.dataset.tagId;

    app.dialog.confirm('Are you sure you want to decline this tag?', 'Decline Tag', async function () {
        try {
            app.preloader.show();

            const response = await removeTagFromPost(tagId);

            app.preloader.hide();

            if (response.success) {
                // refetch notifications
                store.dispatch('fetchNotifications', {
                    load_more: false
                });
                showToast('Tag has been declined');
            } else {
                showToast(response.message || 'Failed to decline tag');
            }
        } catch (error) {
            app.preloader.hide();
            showToast('Failed to decline tag');
        }
    });
});