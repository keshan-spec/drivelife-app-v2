import app, {
  showToast
} from "./app.js";
import store from "./store.js";

import {
  formatPostDate,
  hapticsImpactLight,
  setImageStyle
} from './utils.js';

import {
  fetchComments,
  maybeLikeComment,
  addComment,
  deletePost,
  deleteComment
} from './api/posts.js';
import {
  getSessionUser
} from "./api/auth.js";

import $ from 'dom7';
import { createActionsSection, createBottomSection, createMediaSection, togglePostLike } from "./post-ui-card.js";
import { OFFLINE_HTML } from "./api/consts.js";

var currentPostsPage = 1;
var currentFollowingPostsPage = 1;

var postsStore = store.getters.posts;
var followingPostsStore = store.getters.followingPosts;
var userStore = store.getters.user;
var networkErrors = store.getters.checkPoorNetworkError;

var totalPostPages = 0;
var totalFPostPages = 0;

// Infinite Scroll Event
var isFetchingPosts = false;
var activeTab = 'latest';
var refreshed = false;

// Function to pause all videos
function pauseAllVideos() {
  var videos = document.querySelectorAll('video.video-js');
  videos.forEach(function (video) {
    video.pause();
  });
}

export function loadVideos() {
  var videos = document.querySelectorAll('video.video-js');

  // Function to clean up video elements
  function cleanUpVideo(video) {
    var hlsInstance = video.hls; // Store HLS instance
    if (hlsInstance) {
      hlsInstance.destroy(); // Destroy the HLS instance
    }
    video.pause(); // Pause the video
    video.src = ''; // Clear the source
    video.load(); // Load the video element
  }

  // Clean up existing videos
  videos.forEach(function (video) {
    cleanUpVideo(video);
  });

  // Function to resume videos if needed (optional)
  function playVisibleVideos() {
    videos.forEach(function (video) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            video.play();
          }
        });
      }, { threshold: 0.5 });
      observer.observe(video);
    });
  }

  // Listen for visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      pauseAllVideos();
    } else {
      playVisibleVideos();
    }
  });

  // Loop through each video element
  videos.forEach(function (video) {
    var videoSrc = video.getAttribute('data-src');

    if (Hls.isSupported()) {
      var hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      video.hls = hls; // Store HLS instance on the video element
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        // Ready to play
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      video.addEventListener('loadedmetadata', function () {
        // Ready to play
      });
    }

    // Set up IntersectionObserver to pause/play videos based on visibility
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          video.play();
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.5 });

    observer.observe(video);

    video.addEventListener('play', function () {
      video.removeAttribute('controls'); // Hide controls
    });

    video.addEventListener('click', function () {
      video.setAttribute('controls', 'controls');
    });
  });
}

postsStore.onUpdated(async (data) => {
  totalPostPages = data.total_pages;

  if ((data.page == data.total_pages) || (data.new_data.length == 0)) {
    $('.infinite-scroll-preloader.home-posts').hide();

    if (data.data.length == 0) {
      $('#tab-latest .data').html('<p class="text-center">No posts</p>');
      return;
    }
  }

  if (data.reset) {
    refreshed = data.reset;
  }

  displayPosts(data.new_data, false);
});

followingPostsStore.onUpdated((data) => {
  totalFPostPages = data.total_pages;

  if ((data.page == data.total_pages) || (data.new_data.length == 0)) {
    $('.infinite-scroll-preloader.home-following-posts').hide();
    if (data.data.length == 0) {
      $('#tab-following .data').html('<p class="text-center">No posts</p>');
      return;
    }
  }

  if (data.reset) {
    refreshed = data.reset;
  }

  displayPosts(data.new_data, true);
});

userStore.onUpdated((data) => {
  const listenersInitialized = store.getters.homeListenersInitialized.value;

  if (data && data.id && !data.external_refresh && !data.refreshed) {
    if (!listenersInitialized) {
      initializeListeners();
    }
  }
});

networkErrors.onUpdated((data) => {
  if (data === true) {
    // update the dom 
    $('.home-page.social-content').html(OFFLINE_HTML);
  }
});

$(document).on('infinite', '.infinite-scroll-content.home-page', async function () {
  if (isFetchingPosts) return;

  const totalPages = activeTab === 'following' ? totalFPostPages : totalPostPages;
  const storeName = activeTab === 'following' ? 'getFollowingPosts' : 'getPosts';

  if (activeTab === 'following') {
    currentFollowingPostsPage++;
  } else {
    currentPostsPage++;
  }

  const currentPage = activeTab === 'following' ? currentFollowingPostsPage : currentPostsPage;
  if (currentPage >= totalPages) {
    return;
  }

  isFetchingPosts = true;

  await store.dispatch(storeName, {
    page: currentPage
  });
  isFetchingPosts = false;
});

$(document).on('ptr:refresh', '.ptr-content.home-page', async function (e) {
  refreshed = true;

  const storeName = activeTab === 'following' ? 'getFollowingPosts' : 'getPosts';

  if (isFetchingPosts) return;

  isFetchingPosts = true;

  if (activeTab === 'following') {
    currentFollowingPostsPage = 1;
  } else {
    currentPostsPage = 1;
  }

  await store.dispatch(storeName, {
    page: 1,
    clear: true
  });

  isFetchingPosts = false;
  app.ptr.get('.ptr-content.home-page').done();
});

function initializeListeners() {
  store.dispatch('setHomeListenersInitialized', true);

  $('#app').on('click', '.media-post-readmore', function () {
    const postDescription = this.previousElementSibling.previousElementSibling; // The short description
    const fullDescription = this.previousElementSibling; // The full description

    if (fullDescription.classList.contains('hidden')) {
      postDescription.classList.add('hidden');
      fullDescription.classList.remove('hidden');
      this.textContent = '... less';
    } else {
      postDescription.classList.remove('hidden');
      fullDescription.classList.add('hidden');
      this.textContent = '... more';
    }
  });

  $('#app').on('click', '.media-post-like i', (e) => {
    const postId = e.target.getAttribute('data-post-id');

    const parent = e.target.closest('.media-post');
    const isSingle = parent.classList.contains('single') ? true : false;

    togglePostLike(postId, isSingle);
  });

  // set the post id as a data attribute from the edit post popup
  $('#app').on('click', '.media-post-edit', function () {
    const postId = $(this).closest('.media-post').attr('data-post-id');
    const isSingleView = $(this).closest('.media-post').hasClass('single');
    $('.edit-post-popup').attr('data-post-id', postId);
    $('.edit-post-popup').attr('data-is-single', isSingleView);
  });

  $('#app').on('click', '#delete-post', function () {
    var view = app.views.current;

    // set the post id as a data attribute from the edit post popup
    const postId = $('.edit-post-popup').attr('data-post-id');
    const isSingleView = $('.edit-post-popup').attr('data-is-single');

    app.dialog.confirm('Are you sure you want to delete this post?', 'Delete Post', async () => {
      app.preloader.show();
      const response = await deletePost(postId);
      app.preloader.hide();

      if (response) {
        store.dispatch('getMyPosts', {
          page: 1,
          clear: true
        });
        store.dispatch('getMyTags', {
          page: 1,
          clear: true
        });

        if (isSingleView == 'true') {
          // $('.view-profile-link').click()
          view.router.back();
          // view.router.navigate('/profile/')
        }

        showToast('Post deleted successfully');
        // remove the post from the DOM
        $(`.media-post[data-post-id="${postId}"]`).remove();
        app.popup.close('.edit-post-popup');
      } else {
        showToast('Failed to delete post');
        app.preloader.hide();
      }
    });
  });

  $('#app').on('click', '#edit-post', function () {
    var view = app.views.current;

    // set the post id as a data attribute from the edit post popup
    const postId = $('.edit-post-popup').attr('data-post-id');
    view.router.navigate(`/post-edit/${postId}`, {
      force: true
    });

    app.popup.close('.edit-post-popup');
  });

  // media-post-video click
  $('#app').on('click', '.media-post-video', function () {
    if (this.paused) {
      this.play();
    } else {
      this.pause();
    }
  });

  // on .popup-open click
  $('#app').on('click', '.media-post-comment, .media-post-commentcount', async function () {
    const postId = this.getAttribute('data-post-id');

    if (!postId) {
      return;
    }

    document.getElementById('comments-list').innerHTML = '<div class="preloader"></div>';
    document.getElementById('comment-form').reset();

    // update the post id in the comment form
    document.getElementById('comment-form').setAttribute('data-post-id', '');
    document.getElementById('comment-form').removeAttribute('data-comment-id');

    document.getElementById('comment-form').querySelector('.replying-to').innerHTML = '';
    document.getElementById('comment-form').querySelector('.replying-to').classList.add('hidden');

    try {
      const comments = await fetchComments(postId);
      displayComments(comments, postId);
    } catch (error) {
      app.notification.create({
        titleRightText: 'now',
        subtitle: 'Oops, something went wrong',
        text: error.message || 'Failed to fetch comments',
      }).open();
    }
  });

  $('#app').on('click', '.media-post-share', function () {
    // set the post id as a data attribute 
    const postId = $(this).closest('.media-post').attr('data-post-id');
    $('.share-popup').attr('data-post-id', postId);
    $('#copy-link').attr('data-clipboard-text', `https://app.mydrivelife.com/post-view/${postId}`);
  });

  $('#app').on('click', '#share-post-email', function () {
    const postId = $(this).closest('.popup').attr('data-post-id');
    const postLink = `https://app.mydrivelife.com/post-view/${postId}`;

    // open the email composer
    window.open(`mailto:?subject=Check out this post&body=${postLink}`);
  });

  // data-clipboard-text click
  $('#app').on('click', '#copy-link', function () {
    const copyText = $(this).attr('data-clipboard-text');
    navigator.clipboard.writeText(copyText);

    app.toast.create({
      text: 'Link copied to clipboard',
      closeTimeout: 2000
    }).open();
  });

  // on .comment-replies-toggle click
  $('#app').on('click', '.comment-replies-toggle', function () {
    const commentRepliesContainer = this.nextElementSibling;
    commentRepliesContainer.classList.toggle('show');
    const repliesCount = this.getAttribute('data-replies-count');

    this.innerText = this.innerText === `Show ${repliesCount} replies` ? `Hide ${repliesCount} replies` : `Show ${repliesCount} replies`;
  });

  // on comment form submit
  $(document).on('submit', '#comment-form', async function (e) {
    e.preventDefault();

    const postId = this.getAttribute('data-post-id');
    const commentId = this.getAttribute('data-comment-id');
    const comment = this.comment.value;

    if (!comment) {
      // app.dialog.alert('Please enter a comment')
      return;
    }

    app.preloader.show();

    try {
      const response = await addComment(postId, comment, commentId);

      app.preloader.hide();

      if (response) {
        this.reset();
        this.removeAttribute('data-comment-id');
        this.querySelector('.replying-to').innerHTML = '';
        this.querySelector('.replying-to').classList.add('hidden');
        const comments = await fetchComments(postId);
        displayComments(comments, postId);
      } else {
        app.notification.create({
          text: 'Failed to add comment',
          titleRightText: 'now',
          subtitle: 'Oops, something went wrong',
        }).open();
      }
    } catch (error) {
      app.notification.create({
        titleRightText: 'now',
        subtitle: 'Oops, something went wrong',
        text: error.message || 'Failed to add comment',
      }).open();
      app.preloader.hide();
    }
  });

  //.comment-reply click
  $('#app').on('click', '.comment-reply', function () {
    // get the comment id, and comment owner id
    const commentId = this.closest('.comment').getAttribute('data-comment-id');
    const ownerId = this.closest('.comment').getAttribute('data-owner-id');
    const ownerName = this.closest('.comment').getAttribute('data-owner-name');

    // add something above the comment form to show the user they are replying to a comment
    // add the comment id to the form
    document.getElementById('comment-form').setAttribute('data-comment-id', commentId);
    document.getElementById('comment-form').comment.focus();

    // add the owner name to the form
    //  <span class="replying-to">Replying to <strong>m88xrk</strong></span>
    const replyingTo = document.getElementById('comment-form').querySelector('.replying-to');
    replyingTo.innerHTML = `Replying to <strong>${ownerName}</strong>`;
    replyingTo.classList.remove('hidden');
    document.getElementById('comment-form').prepend(replyingTo);
  });

  $('#app').on('click', '.comment-delete', async function () {
    app.dialog.confirm('Are you sure you want to delete this comment? This will remove all replies to this comment', 'Delete Comment', async () => {
      try {
        const commentId = this.getAttribute('data-comment-id');
        const response = await deleteComment(commentId);

        if (response && response.success) {
          // remove the comment from the DOM
          $(`.comment[data-comment-id="${commentId}"]`).remove();
          showToast('Comment deleted successfully');
        }
      } catch (error) {
        app.dialog.alert('Failed to delete comment');
      }
    });
  });

  $('#app').on('click', '.comment a', function (e) {
    var view = app.views.current;
    // hide the comments popup
    app.popup.close();

    // get the href attribute
    const href = this.getAttribute('data-url');

    if (!href || href === '#') {
      return;
    }

    // prevent the default action
    e.preventDefault();

    view.router.navigate(href, {
      force: true
    });
  });

  // event listener for tab change
  $('#app').on('click', '.social-tabs .tab-link', async function (e) {
    const type = this.getAttribute('data-type');
    activeTab = type;
  });
}

async function displayPosts(posts, following = false) {
  const postsContainer = $(following ? '#tab-following .data' : '#tab-latest .data');

  if (refreshed) {
    postsContainer.html('');
    refreshed = false;
  }

  const user = await getSessionUser();

  posts.forEach(post => {
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

    const mediaSection = createMediaSection(post.media);
    const actionsSection = createActionsSection(post_actions, post.likes_count);
    const bottomSection = createBottomSection(post.username, shortDescription, isLongDescription, post.caption, post.comments_count, post.id);

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

    const postItem = `
    <div class="media-post" data-post-id="${post.id}" data-is-liked="${post.is_liked}">
      <div class="media-post-content">
        <div id="lottie-animation" class="hidden"></div>
        ${profile_link}
        ${mediaSection}
      </div>
      ${actionsSection}
      ${bottomSection}
    </div>
  `;

    postsContainer.append(postItem);
  });

  // loadVideos();z
  initDoubleTapLike();
}

// Load the animation data once and reuse it
var animationData = null;
const loadLottieAnimation = async () => {
  if (!animationData) {
    // Fetch the JSON only once
    const response = await fetch('like.json');
    animationData = await response.json();
  }
  return animationData;
};

function initDoubleTapLike() {
  // Initialize swiper
  app.swiper.create('.post-view-swiper', {
    speed: 400,
    spaceBetween: 0,
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
    },
  });

  // Ensure images are styled
  document.querySelectorAll('.swiper-slide .swiper-slide-image').forEach((img) => {
    if (img.complete) {
      setImageStyle(img);
    } else {
      img.onload = () => {
        setImageStyle(img);
      };
    }
  });

  // Get all unprocessed media-post elements
  const mediaPosts = document.querySelectorAll('.media-post:not([data-initialized])');

  mediaPosts.forEach(async (post) => {
    const mc = new Hammer(post);

    // Load the Lottie animation data (cached)
    const animationData = await loadLottieAnimation();

    const anim = lottie.loadAnimation({
      container: post.querySelector('#lottie-animation'),
      renderer: 'svg',
      loop: false,
      autoplay: false,
      // path: 'like.json'
      animationData
    });

    anim.setSpeed(1.5); // Double the speed of the animation
    // Mark this post as initialized
    post.setAttribute('data-initialized', 'true');

    // Listen to double-tap events
    mc.on("doubletap", function () {
      // Add fade-out effect
      post.querySelector('#lottie-animation').classList.remove('hidden');

      const postId = post.getAttribute('data-post-id');
      const isLiked = post.getAttribute('data-is-liked') === 'true';

      // Play the animation forward
      anim.setDirection(1); // Forward direction
      anim.play();

      setTimeout(() => {
        // Reverse the animation
        anim.setDirection(-1); // Reverse direction
        anim.setSpeed(2); // Double the speed of the animation
        anim.play();

        // Pause and reset after reverse animation
        setTimeout(() => {
          // anim.pause();
          anim.goToAndStop(0, true); // Reset to the first frame

          post.querySelector('#lottie-animation').classList.add('hidden');
        }, anim.totalFrames / anim.frameRate * 700); // Duration of reverse animation
      }, 800);

      if (isLiked) {
        return;
      }

      // Play the Lottie animation
      hapticsImpactLight();
      togglePostLike(postId);
    });
  });
}

function displayComments(comments, postId) {
  const user = store.getters.user.value;

  const commentsContainer = document.getElementById('comments-list');
  // reset the comments container
  commentsContainer.innerHTML = '';
  const commentForm = document.getElementById('comment-form');
  commentForm.setAttribute('data-post-id', postId);

  if (!comments.length) {
    commentsContainer.innerHTML = '<div class="no-comments">No comments found</div>';
    return;
  }

  comments.forEach(comment => {
    const replyItems = comment.replies.length > 0 ? `
        <div class="comment-replies">
          <span class="comment-replies-toggle" data-replies-count="${comment.replies.length}">
            Show ${comment.replies.length} ${comment.replies.length > 1 ? 'replies' : 'reply'}
          </span>
          <div class="comment-replies-container">
            ${comment.replies.map(reply => {

      // Determine the delete button visibility
      const deleteButton = reply.user_id == user.id ?
        `<div class="comment-delete" data-comment-id="${reply.id}">
                <i class="icon f7-icons text-red">trash</i>
                </div>` :
        '';

      return `
                <div class="comment" data-comment-id="${reply.id}" data-is-liked="${reply.liked}" data-owner-id="${reply.user_id}"
                  data-owner-name="${reply.user_login}">

                  <a href="#" data-url="${reply.user_id == user.id ? '#' : `/profile-view/${reply.user_id}`}" class="${reply.user_id == user.id ? 'view-profile' : ''} comment-profile-img" style="background-image:url('${reply.profile_image || 'img/profile-placeholder.jpg'}');">
                  </a>



                  <div class="comment-content-container">
                    <div class="comment-username">
                      <a href="#" data-url="${reply.user_id == user.id ? '#' : `/profile-view/${reply.user_id}`}" class="${reply.user_id == user.id ? 'view-profile' : 'a'}">
                        ${reply.user_login}
                      </a>
                      <span class="date">${formatPostDate(reply.comment_date)}</span>
                    </div>
                    
                    <div class="comment-content">${reply.comment}</div>
                    <div class="comment-actions">
                      <div class="comment-like">
                        <i class="icon f7-icons ${reply.liked ? 'text-red' : ''}">
                          ${reply.liked ? 'heart_fill' : 'heart'}
                        </i> 
                        <span class="comment-likes-count" data-likes-count="${reply.likes_count}">
                          ${reply.likes_count}
                        </span>
                      </div>
                      <div class="comment-reply">
                        <i class="icon f7-icons">chat_bubble</i> <span>Reply</span>
                      </div>
                      ${deleteButton}
                    </div>
                  </div>
                  <div class="clearfix"></div>
                </div>`;
    }).join('')}
          </div>
        </div>` : '';

    let commenter_link = `/profile-view/${comment.user_id}`;

    if (comment.user_id == user.id) {
      commenter_link = '/profile/';
    }

    const deleteButton = comment.user_id == user.id ?
      `<div class="comment-delete" data-comment-id="${comment.id}"><i class="icon f7-icons text-red">trash</i></div>` : '';

    const commentItem = `
      <div class="comment" 
        data-comment-id="${comment.id}" 
        data-is-liked="${comment.liked}" 
        data-owner-id="${comment.user_id}"
        data-owner-name="${comment.user_login}">

         <a href="#" data-url="${comment.user_id == user.id ? '#' : `/profile-view/${comment.user_id}`}" class="${comment.user_id == user.id ? 'view-profile' : ''} comment-profile-img" 
         style="background-image:url('${comment.profile_image || 'img/profile-placeholder.jpg'}');">
         </a>
         
        <div class="comment-content-container">
          <div class="comment-username">
            <a href="#" data-url="${comment.user_id == user.id ? '#' : `/profile-view/${comment.user_id}`}" class="${comment.user_id == user.id ? 'view-profile' : 'a'} comment-userlogin-link">
                ${comment.user_login}
                ${comment.liked_by_owner ? `
                  <div class="owner-liked-comment">
                    <div class="comment-profile-img" style="background-image:url('${comment.owner_profile_image || 'img/profile-placeholder.jpg'}');"></div>
                    <i class="icon f7-icons text-red">heart_fill</i> 
                  </div>
                  `: ''}
                </a>
            <span class="date">${formatPostDate(comment.comment_date)}</span>
          </div>
          <div class="comment-content">${comment.comment}</div>
          <div class="comment-actions">
            <div class="comment-like">
              <i class="icon f7-icons ${comment.liked && 'text-red'}">${comment.liked ? 'heart_fill' : 'heart'}</i> 
              <span class="comment-likes-count" data-likes-count="${comment.likes_count}">
                ${comment.likes_count}
              </span>
            </div>
            <div class="comment-reply">
              <i class="icon f7-icons">chat_bubble</i> <span>Reply</span>
            </div>
            ${deleteButton}
          </div>
          ${replyItems}
        </div>
        <div class="clearfix"></div>
      </div>
    `;
    commentsContainer.insertAdjacentHTML('beforeend', commentItem);
  });

  // Add click event listener for liking a comment
  const likeButtons = document.querySelectorAll('.comment-like');
  likeButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      const commentId = event.currentTarget.closest('.comment').getAttribute('data-comment-id');
      const ownerId = event.currentTarget.closest('.comment').getAttribute('data-owner-id');
      toggleCommentLike(commentId, ownerId);
    });
  });
}

function toggleCommentLike(commentId, ownerId) {
  // Find the comment element and its like icon
  const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
  const likeIcon = commentElement.querySelector('.comment-like i');
  const isLiked = commentElement.getAttribute('data-is-liked') === 'true';
  const likeCountElem = commentElement.querySelector('.comment-likes-count');
  let likeCount = parseInt(likeCountElem.getAttribute('data-likes-count'));

  // Toggle the like state
  if (isLiked) {
    likeIcon.classList.remove('text-red');
    likeIcon.innerText = 'heart';
    likeCount--;
    commentElement.setAttribute('data-is-liked', 'false');
  } else {
    likeIcon.classList.add('text-red');
    likeIcon.innerText = 'heart_fill';
    likeCount++;
    commentElement.setAttribute('data-is-liked', 'true');
  }

  // Update like count
  likeCountElem.innerText = likeCount;
  likeCountElem.setAttribute('data-likes-count', likeCount);

  maybeLikeComment(commentId, ownerId);
}