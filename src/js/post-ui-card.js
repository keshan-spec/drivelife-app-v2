import { maybeLikePost } from "./api/posts";
import store from "./store";
import { preloadImage } from "./utils";

// New function to handle rendering of posts with multiple or single images
export const createMediaSection = (mediaItems) => {
  if (mediaItems.length === 1) {
    // Render a single image post
    return `
      <div class="single-image">
        <img class="media-image" src="${mediaItems[0].media_url}" 
             alt="${mediaItems[0].caption || 'Post image'}" 
             style="text-align: center;" 
             onerror="this.style.display='none';">
        <img class="media-image-background" src="${mediaItems[0].blurred_url}" 
             alt="${mediaItems[0].caption || 'Post image'}" 
             style="text-align: center;" 
             onerror="this.style.display='none';">
      </div>
    `;
  }

  // Render a carousel (Swiper) for multiple images
  return `
    <div class="post-view-images">
      <div class="swiper post-view-swiper">
        <div class="swiper-wrapper">
          ${mediaItems.map((mediaItem, index) => {
    // Preload the first image in the post
    if (index === 0 && mediaItem.media_type !== 'video') {
      preloadImage(mediaItem.media_url);
    }

    // Return the individual slide
    return `
              <div class="swiper-slide" data-id="${index + 1}">
                <img class="swiper-slide-image" src="${mediaItem.media_url}" alt="${mediaItem.caption || 'Post image'}" />
                <img class="swiper-slide-background" src="${mediaItem.blurred_url}" alt="${mediaItem.caption || 'Post image'}" />
              </div>
            `;
  }).join('')}
        </div>
        <div class="swiper-pagination"></div>
      </div>
    </div>
  `;
};

export const createActionsSection = (postActions, likeCount) => {
  return `
    ${postActions}
    <div class="media-post-likecount" data-like-count="${likeCount}">${likeCount} likes</div>
  `;
};

export const createBottomSection = (username, shortDescription, isLongDescription, fullDescription, commentsCount, postId) => {
  return `
    <div class="media-post-description">
      <strong>${username}</strong> <br/> <span class="post-caption">${shortDescription}</span>
      <span class="full-description hidden">${fullDescription}</span>
      ${isLongDescription ? `<span class="media-post-readmore">... more</span>` : ''}
    </div>
    ${commentsCount > 0 ?
      `<div class="media-post-commentcount popup-open" data-popup=".comments-popup" data-post-id="${postId}">View ${commentsCount} comments</div>` :
      ''}
  `;
};

export function togglePostLike(postId, single = false) {
  // Find all post elements with the specified postId
  let container = single ? `.media-post.single[data-post-id="${postId}"]` : `.media-post[data-post-id="${postId}"]`;
  const postElements = document.querySelectorAll(container);

  // Iterate through all matching post elements and update them
  postElements.forEach(postElement => {
    const likeIcon = postElement.querySelector('.media-post-like i');
    const isLiked = postElement.getAttribute('data-is-liked') === 'true';
    const likeCountElem = postElement.querySelector('.media-post-likecount');
    let likeCount = parseInt(likeCountElem.getAttribute('data-like-count'));

    // Toggle the like state
    if (isLiked) {
      likeIcon.classList.remove('text-red');
      likeIcon.innerText = 'heart';
      likeCount--;
      postElement.setAttribute('data-is-liked', 'false');
    } else {
      likeIcon.classList.add('text-red');
      likeIcon.innerText = 'heart_fill';
      likeCount++;
      postElement.setAttribute('data-is-liked', 'true');
    }

    // Update like count
    likeCountElem.innerText = `${likeCount} likes`;
    likeCountElem.setAttribute('data-like-count', likeCount);

    if (single) {
      var pathStore = store.getters.getPathData;

      if (pathStore && pathStore.value[`/post/${postId}`]) {
        var post = pathStore.value[`/post/${postId}`];
        post.is_liked = !isLiked;
        post.likes_count = likeCount;

        store.dispatch('setPathData', {
          path: `/post/${postId}`,
          data: post,
        });
      }
    }
  });

  // Optionally, make an API call to update the like status on the server
  maybeLikePost(postId);
}