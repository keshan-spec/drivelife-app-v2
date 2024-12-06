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
        <img class="media-image-background" src="${mediaItems[0].media_url}" 
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
                <img class="swiper-slide-background" src="${mediaItem.media_url}" alt="${mediaItem.caption || 'Post image'}" />
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