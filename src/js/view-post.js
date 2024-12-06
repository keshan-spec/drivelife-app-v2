import app from "./app.js";
import {
  getPostById
} from "./api/posts.js";
import {
  formatPostDate,
  setImageStyle
} from "./utils.js";
import store from "./store.js";

import $ from 'dom7';
import { togglePostLike } from "./homepage.js";
import { createActionsSection, createBottomSection, createMediaSection } from "./post-ui-card.js";

var containerWidth = window.innerWidth;

function displaySinglePost(post) {
  const postsContainer = document.getElementById('post-view-container');
  postsContainer.innerHTML = ''; // Clear any existing posts

  const user = store.getters.user.value;

  let post_actions = `
  <div class="media-post-actions">
    <div class="media-post-like" data-post-id="${post.id}">
      <i class="icon f7-icons ${post.is_liked ? 'text-red' : ''}" data-post-id="${post.id}">${post.is_liked ? 'heart_fill' : 'heart'}</i>
    </div>
    <div class="media-post-comment popup-open" data-popup=".comments-popup" data-post-id="${post.id}">
      <i class="icon f7-icons">chat_bubble</i>
    </div>
    <div class="media-post-share popup-open" data-popup=".share-popup">
      <i class="icon f7-icons">paperplane</i>
    </div>
`;

  if (post.user_id == user.id) {
    post_actions += `
    <div class="media-post-edit popup-open" data-popup=".edit-post-popup" data-post-id="${post.id}">
      <i class="icon f7-icons">gear_alt</i>
    </div>
  `;
  }

  post_actions += `</div>`;

  const date = formatPostDate(post.post_date);
  const maxDescriptionLength = 200; // Set your character limit here
  const isLongDescription = post.caption.length > maxDescriptionLength;
  const shortDescription = isLongDescription ? post.caption.slice(0, maxDescriptionLength) : post.caption;

  let imageHeight = 400;

  if (post.media.length > 0) {
    const intrinsicWidth = post.media[0].media_width;
    const intrinsicHeight = post.media[0].media_height;
    const media_type = post.media[0].media_type;

    // Calculate intrinsic aspect ratio
    const intrinsicRatio = intrinsicWidth / intrinsicHeight;

    // Calculate the rendered height based on the container width
    const renderedHeight = containerWidth / intrinsicRatio;

    // Use either the rendered height or the fallback height
    if (renderedHeight > 0) {
      if (renderedHeight > 500) {
        imageHeight = 500;
      } else {
        imageHeight = renderedHeight;
      }


      if (media_type === 'video') {
        imageHeight = renderedHeight;
      }
    }
  }

  let profile_link;

  if (post.user_id == user.id) {
    profile_link = `
  <a href="#" class="view-profile media-post-header">
    <div class="media-post-avatar" style="background-image: url('${post.user_profile_image || 'img/profile-placeholder.jpg'}');"></div>
    <div class="media-post-user">${post.username}</div>
    <div class="media-post-date">${date}</div>
  </a>`;
  } else {
    profile_link = `
  <a href="/profile-view/${post.user_id}" class="media-post-header">
    <div class="media-post-avatar" style="background-image: url('${post.user_profile_image || 'img/profile-placeholder.jpg'}');"></div>
    <div class="media-post-user">${post.username}</div>
    <div class="media-post-date">${date}</div>
  </a>`;
  }

  const mediaSection = createMediaSection(post.media);
  const actionsSection = createActionsSection(post_actions, post.likes_count);
  const bottomSection = createBottomSection(post.username, shortDescription, isLongDescription, post.caption, post.comments_count, post.id);

  const postItem = `
    <div class="media-post single" data-post-id="${post.id}" data-is-liked="${post.is_liked}">
      <div class="media-post-content">
        ${profile_link}
        ${mediaSection}
      </div>
      ${actionsSection}
      ${bottomSection}
    </div>
  `;

  const postItem1 = `
  <div class="media-post single" data-post-id="${post.id}" data-is-liked="${post.is_liked}">
    <div class="media-single-post-content">
      ${profile_link}
      <div class="media-single-post-content">
      <swiper-container pagination class="demo-swiper-multiple" space-between="50">
            ${post.media.map((mediaItem) => {

    return `<swiper-slide class="swiper-slide post-media ${mediaItem.media_type === 'video' ? 'video' : ''}" style="height: ${imageHeight}px; ">
                ${mediaItem.media_type === 'video' ?
        `<video 
              style="height: ${imageHeight}px;" 
              class="video-js" 
              data-src="${mediaItem.media_url}/manifest/video.m3u8" 
              preload="auto" 
              playsinline 
              loop 
              controls 
              autoplay 
              poster="${mediaItem.media_url}/thumbnails/thumbnail.jpg"  <!-- Add the thumbnail as the poster image -->
            ></video>`
        : `
                <img 
                    src="${mediaItem.media_url}" 
                    alt="${mediaItem.caption || post.username + 's post'}"
                    style="text-align: center;"
                    onerror = "this.style.display='none';"
                  />`}
              </swiper-slide>
            `;
  }).join('')}
      </swiper-container>
      </div>
      ${post_actions}
      <div class="media-post-likecount" data-like-count="${post.likes_count}">${post.likes_count} likes</div>
      <div class="media-post-description">
        <strong>${post.username}</strong> <br/> <span class="post-caption">${shortDescription}</span>
        <span class="full-description hidden">${post.caption}</span>
        ${isLongDescription ? `<span class="media-post-readmore">... more</span>` : ''}
      </div>
      ${post.comments_count > 0 ? `<div class="media-post-commentcount popup-open" data-popup=".comments-popup" data-post-id="${post.id}">View ${post.comments_count} comments</div>` : ''}
    </div>
  </div>
`;

  postsContainer.insertAdjacentHTML('beforeend', postItem);

  const elem = $('.media-post.single[data-post-id="' + post.id + '"]')[0];
  const mc = new Hammer(elem);

  // listen to events...
  mc.on("doubletap", function (ev) {
    const postId = elem.getAttribute('data-post-id');
    const isLiked = elem.getAttribute('data-is-liked') === 'true';

    if (isLiked) {
      return;
    }

    togglePostLike(postId);
  });

  app.swiper.create('.post-view-swiper', {
    speed: 400,
    spaceBetween: 0,
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
    },
  });

  document.querySelectorAll('.swiper-slide .swiper-slide-image').forEach((img) => {
    if (img.complete) {
      setImageStyle(img);
    } else {
      img.onload = () => {
        setImageStyle(img);
      };
    }
  });
}

$(document).on('page:beforein', '.page[data-name="post-view"]', async function (e) {
  var pathStore = store.getters.getPathData;

  var postId = e.detail.route.params.id;
  var query = e.detail.route.query;

  let commentId;

  if (query && query.commentId) {
    commentId = query.commentId;
  }

  if (!postId || postId === '-1') {
    return;
  }

  let cachedData = null;

  try {
    if (pathStore && pathStore.value[`/post/${postId}`]) {
      cachedData = pathStore.value[`/post/${postId}`];
    }
  } catch (error) {
    console.error('Error fetching cached data:', error);
  }

  if (!cachedData) {
    $('.loading-fullscreen.post-view').show();

    const post = await getPostById(postId);
    if (!post) {
      app.dialog.alert('Post not found', 'Error');
      return;
    }

    store.dispatch('setPathData', {
      path: `/post/${postId}`,
      data: post,
    });

    cachedData = post;
  } else {
    $('.loading-fullscreen.post-view').hide();
  }

  displaySinglePost(cachedData);

  if (commentId) {
    $('.media-post-comment').click();

    setTimeout(() => {
      // find .comment data-comment-id="${comment.id}" and animate it to glow#
      if (commentId) {
        const comment = $(`.comment[data-comment-id="${commentId}"]`);
        console.log('Comment:', comment);

        if (comment.length > 0) {
          comment.addClass('target-highlight');
          // Scroll to the comment
          document.querySelector(`.comment[data-comment-id="${commentId}"]`).scrollIntoView({
            behavior: 'smooth', // Optional, adds smooth scrolling
            block: 'start', // Aligns the element to the top of the view
            inline: 'nearest' // Aligns the element horizontally in the viewport
          });

        }

        setTimeout(() => {
          comment.removeClass('target-highlight');
        }, 3000);
      }
    }, 2000);
  }
});
