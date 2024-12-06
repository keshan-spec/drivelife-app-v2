import {
  getNotificationCount,
  getSessionUser,
  getUserDetails,
  getUserNotifications,
  markMultipleNotificationsAsRead
} from './api/auth.js';

import {
  sendRNMessage,
} from './api/consts.js';

import {
  fetchTrendingEvents,
  fetchTrendingUsers,
  fetchTrendingVenues,
  fetchEventCats
} from './api/discover.js';

import {
  getPostsForGarage,
  getUserGarage
} from './api/garage.js';
import { associateDeviceWithUser, setUserAsInactive } from './api/native.js';
import { getPersistedAuth, persistAuth } from './api/persisted-auth.js';

import {
  fetchPosts,
  getPostsForUser
} from './api/posts.js';

import { getFollowersForUser } from './api/profile.js';

import { createStore } from 'framework7';

const DEFAULT_SEARCH_RESULTS = {
  events: {
    data: [],
    total_pages: 0,
    page: 1,
    limit: 10,
  },
  users: {
    data: [],
    total_pages: 0,
    page: 1,
    limit: 10,
  },
  venues: {
    data: [],
    total_pages: 0,
    page: 1,
    limit: 10,
  },
  top_results: {
    events: [],
    users: [],
    venues: [],
  },
  success: false,
};

const DEFAULT_PAGINATED_DATA = {
  data: [],
  new_data: [],
  total_pages: 0,
  page: 1,
  limit: 10,
};

const store = createStore({
  state: {
    homeListenersInitialized: false,
    postUploadProgress: 0,
    createPostMedia: null,
    createPostContent: null,
    createPostTaggedEntities: [],
    createPostAssociations: {
      association_id: null,
      association_type: null,
    },
    isPostCreating: false,
    user: null,
    posts: {
      new_data: [],
      data: [],
      total_pages: 0,
      page: 1,
      limit: 10,
    },
    following_posts: {
      new_data: [],
      data: [],
      total_pages: 0,
      page: 1,
      limit: 10,
    },
    registerData: {
      user_id: '',
      email: '',
      password: '',
      username: '',
    },
    myGarage: [],
    myPosts: {
      new_data: [],
      data: [],
      total_pages: 0,
      page: 1,
      limit: 10,
    },
    myTags: {
      new_data: [],
      data: [],
      total_pages: 0,
      page: 1,
      limit: 10,
    },
    garageViewPosts: {
      data: [],
      total_pages: 0,
      page: 1,
      limit: 10,
    },
    garageViewTags: {
      data: [],
      total_pages: 0,
      page: 1,
      limit: 10,
    },
    scannedData: null,
    scanningQrCode: false,
    paths: {}, // Object to store unique paths and their data
    userPaths: {}, // Object to store unique user paths and their data
    userPathsUpdated: false,
    notifications: [],
    // discover page
    trendingEvents: [],
    trendingVenues: [],
    eventCategories: [],
    filteredEvents: {
      data: [],
      total_pages: 0,
      page: 1,
      limit: 10,
    },
    filteredVenues: {
      data: [],
      total_pages: 0,
      page: 1,
      limit: 10,
    },
    discoverSearchData: DEFAULT_SEARCH_RESULTS,
    trendingUsers: DEFAULT_PAGINATED_DATA,
    // Search results
    searchResults: DEFAULT_SEARCH_RESULTS,
    notificationCount: 0,
    poorNetworkError: false,
    trendingVehicles: DEFAULT_PAGINATED_DATA,
    myFollowers: [],
  },
  getters: {
    getPostUploadProgress({
      state
    }) {
      return state.postUploadProgress;
    },
    getCreatePostAssociations({
      state
    }) {
      return state.createPostAssociations;
    },
    homeListenersInitialized({
      state
    }) {
      return state.homeListenersInitialized;
    },
    getIsPostCreating({
      state
    }) {
      return state.isPostCreating;
    },
    getCreatePostMedia({
      state
    }) {
      return state.createPostMedia;
    },
    getCreatePostContent({
      state
    }) {
      return state.createPostContent;
    },
    getCreatePostTaggedEntities({
      state
    }) {
      return state.createPostTaggedEntities;
    },
    myFollowers({
      state
    }) {
      return state.myFollowers;
    },
    getTrendingVehicles({
      state
    }) {
      return state.trendingVehicles;
    },
    checkPoorNetworkError({
      state
    }) {
      return state.poorNetworkError;
    },
    getNotifCount({
      state
    }) {
      return state.notificationCount;
    },
    getTrendingUsers({
      state
    }) {
      return state.trendingUsers;
    },
    getSearchResults({
      state
    }) {
      return state.searchResults;
    },
    getFilteredEvents({
      state
    }) {
      return state.filteredEvents;
    },
    getFilteredVenues({
      state
    }) {
      return state.filteredVenues;
    },
    getEventCategories({
      state
    }) {
      return state.eventCategories;
    },
    getTrendingEvents({
      state
    }) {
      return state.trendingEvents;
    },
    getTrendingVenues({
      state
    }) {
      return state.trendingVenues;
    },
    getPathData({
      state
    }) {
      return state.paths;
    },
    getUserPathUpdated({
      state
    }) {
      return state.userPathsUpdated;
    },
    getUserPathData({
      state
    }) {
      return state.userPaths;
    },
    getGarageViewPosts({
      state
    }) {
      return state.garageViewPosts;
    },
    getGarageViewTags({
      state
    }) {
      return state.garageViewTags;
    },
    user({
      state
    }) {
      return state.user;
    },
    getRegisterData({
      state
    }) {
      return state.registerData;
    },
    isAuthenticated({
      state
    }) {
      return !!state.user;
    },
    posts({
      state
    }) {
      return state.posts;
    },
    followingPosts({
      state
    }) {
      return state.following_posts;
    },
    myGarage({
      state
    }) {
      return state.myGarage;
    },
    myPosts({
      state
    }) {
      return state.myPosts;
    },
    myTags({
      state
    }) {
      return state.myTags;
    },
    scannedData({
      state
    }) {
      return state.scannedData;
    },
    isScanningQrCode({
      state
    }) {
      return state.scanningQrCode;
    },
    getNotifications({
      state
    }) {
      return state.notifications;
    },
  },
  actions: {
    setPostUploadProgress({
      state
    }, progress) {
      state.postUploadProgress = progress;
    },
    setCreatePostAssociations({
      state
    }, {
      association_id,
      association_type,
      association_label,
    }) {
      state.createPostAssociations = {
        association_id: association_id,
        association_type: association_type,
        association_label: association_label
      };

      // update tagged entities
      state.createPostTaggedEntities = [{
        x: 1,
        y: 1,
        index: 0,
        label: association_label,
        type: 'car',
        id: association_id,
        arr_idx: 0,
      }];
    },
    setHomeListenersInitialized({
      state
    }, value) {
      state.homeListenersInitialized = value;
    },
    setIsPostCreating({
      state
    }, value) {
      state.isPostCreating = value;
    },
    resetCreatePost({
      state
    }) {
      state.createPostMedia = null;
      state.createPostContent = null;
      state.createPostTaggedEntities = [];
      state.isPostCreating = false;
      state.createPostAssociations = null;

      state.postUploadProgress = 0;
    },
    setPostMedia({
      state
    }, {
      media
    }) {
      state.createPostMedia = media;
    },
    setCreatePostContent({
      state
    }, {
      content
    }) {
      state.createPostContent = content;
    },
    setPostTaggedEntities({
      state
    }, {
      entities
    }) {
      state.createPostTaggedEntities = entities;
    },
    async fetchMyFollowers({
      state
    }) {
      try {
        const followers = await getFollowersForUser(state.user.id);
        state.myFollowers = followers;
      } catch (error) {
        console.error('Failed to fetch followers', error);
        state.myFollowers = [];
      }
    },
    updatePost({
      state
    }, {
      post_id,
      caption
    }) {
      // loop through the posts and find the post with the post_id
      const posts = state.posts.data;
      const post = posts.find(p => p.id == post_id);

      const myPosts = state.myPosts.data;
      const myPost = myPosts.find(p => p.id == post_id);

      // update the post with the new data
      if (post) {
        // update the post with the new data
        post.caption = caption;
        // update the state with the new posts
        state.posts = {
          ...state.posts,
          data: posts,
        };
      }

      if (myPost) {
        myPost.caption = caption;

        state.myPosts = {
          ...state.myPosts,
          data: myPosts,
        };
      }
    },
    markNotificationsAsRead({
      state
    }, notification_ids) {
      markMultipleNotificationsAsRead(notification_ids);
      state.notificationCount = 0;
    },
    async notificationCount({
      state
    }) {
      const response = await getNotificationCount();
      state.notificationCount = response.count;
    },
    setSearchResults({
      state
    }, payload) {
      state.searchResults = payload;
    },
    async filterEvents({
      state
    }, {
      filters,
      page = 1
    }) {
      try {
        const events = await fetchTrendingEvents(page, true, filters);

        const data = {
          new_data: events.data,
          data: [
            ...state.filteredEvents.data,
            ...events.data,
          ],
          total_pages: events.total_pages,
          page: page,
          limit: events.limit,
        };

        state.filteredEvents = data;
      } catch (error) {
        console.error('Failed to filter events', error);
        state.filteredEvents = {
          new_data: [],
          data: [],
          total_pages: 0,
          page: 1,
          limit: 10,
        };
      }
    },
    async filterTrendingUsers({
      state
    }, page = 1) {
      try {
        const response = await fetchTrendingUsers(page);

        const data = {
          new_data: response.data,
          data: [
            ...state.trendingUsers.data,
            ...response.data,
          ],
          total_pages: response.total_pages,
          page: page,
          limit: response.limit,
        };

        state.trendingUsers = data;
      } catch (error) {
        console.log('Failed to fetch trending users', error);
        state.trendingUsers = {
          new_data: [],
          data: [],
          total_pages: 0,
          page: 1,
          limit: 10,
        };
      }
    },
    async filterTrendingVehicles({
      state
    }, page = 1) {
      try {
        const response = await fetchTrendingUsers(page, true);

        const data = {
          new_data: response.data,
          data: [
            ...state.trendingVehicles.data,
            ...response.data,
          ],
          total_pages: response.total_pages,
          page: page,
          limit: response.limit,
        };

        state.trendingVehicles = data;
      } catch (error) {
        console.log('Failed to fetch trending vehicles', error);
        state.trendingVehicles = {
          new_data: [],
          data: [],
          total_pages: 0,
          page: 1,
          limit: 10,
        };
      }
    },
    async filterTrendingUsers({
      state
    }, page = 1) {
      try {
        const response = await fetchTrendingUsers(page);

        const data = {
          new_data: response.data,
          data: [
            ...state.trendingUsers.data,
            ...response.data,
          ],
          total_pages: response.total_pages,
          page: page,
          limit: response.limit,
        };

        state.trendingUsers = data;
      } catch (error) {
        console.log('Failed to fetch trending users', error);
        state.trendingUsers = {
          new_data: [],
          data: [],
          total_pages: 0,
          page: 1,
          limit: 10,
        };
      }
    },
    async filterVenues({
      state
    }, {
      filters,
      page = 1
    }) {
      try {
        const events = await fetchTrendingVenues(page, true, filters);

        let existingVenues = state.filteredVenues.data.length > 0 ? state.filteredVenues.data : state.trendingVenues.data;

        const data = {
          new_data: events.data,
          data: [
            ...existingVenues,
            ...events.data,
          ],
          total_pages: events.total_pages,
          page: page,
          limit: events.limit,
        };

        state.filteredVenues = data;
      } catch (error) {
        console.error('Failed to filter venues', error);
        state.filteredVenues = {
          new_data: [],
          data: [],
          total_pages: 0,
          page: 1,
          limit: 10,
        };
      }
    },
    async fetchEventCategories({
      state
    }) {
      const categories = await fetchEventCats();

      state.eventCategories = categories;
    },
    async getTrendingEvents({
      state
    }) {
      const events = await fetchTrendingEvents(1, false);
      state.trendingEvents = events;
    },
    async getTrendingVenues({
      state
    }) {
      const venues = await fetchTrendingVenues(1, false);
      state.trendingVenues = venues;
    },
    async fetchNotifications({
      state
    }, {
      load_more = false,
      refreshed = false
    }) {
      const notifications = await getUserNotifications(load_more);
      state.notifications = {
        ...notifications,
        refreshed: refreshed,
      };
    },
    async getUserPosts({
      state
    }, {
      user_id,
      page = 1,
      clear = false
    }) {
      const userPathData = state.userPaths;

      let posts = null;

      if (userPathData && userPathData[`user-${user_id}-posts`]) {
        if (userPathData[`user-${user_id}-posts`].page >= page) {
          posts = userPathData[`user-${user_id}-posts`];

          if (posts && posts.total_pages == posts.page) {
            posts['cleared'] = true;
            posts['new_data'] = posts.data;

            state.userPaths[`user-${user_id}-posts`] = posts;
            state.userPathsUpdated = true;
            return;
          }


        } else {
          posts = await getPostsForUser(user_id, page);
        }
      } else {
        posts = await getPostsForUser(user_id, page);
      }

      let prevUserPosts = {
        data: []
      };

      if (!clear) {
        if (state.userPaths[`user-${user_id}-posts`]) {
          prevUserPosts = state.userPaths[`user-${user_id}-posts`];
        }
      }

      const data = {
        new_data: posts.data,
        data: [
          ...prevUserPosts.data,
          ...posts.data,
        ],
        total_pages: posts.total_pages,
        page: posts.page,
        limit: posts.limit,
        cleared: clear,
      };

      state.userPaths[`user-${user_id}-posts`] = data;
      state.userPathsUpdated = true;
    },
    async getUserTags({
      state
    }, {
      user_id,
      page = 1,
      clear = false
    }) {
      const userPathData = state.userPaths;

      let posts = null;

      if (userPathData && userPathData[`user-${user_id}-tags`]) {
        if (userPathData[`user-${user_id}-tags`].page >= page) {
          posts = userPathData[`user-${user_id}-tags`];

          if (posts && posts.total_pages == posts.page) {
            posts['cleared'] = true;
            posts['new_data'] = posts.data;

            state.userPaths[`user-${user_id}-tags`] = posts;
            state.userPathsUpdated = true;
            return;
          }


        } else {
          posts = await getPostsForUser(user_id, page, true);
        }
      } else {
        posts = await getPostsForUser(user_id, page, true);
      }

      let prevUserPosts = {
        data: []
      };

      if (!clear) {
        if (state.userPaths[`user-${user_id}-tags`]) {
          prevUserPosts = state.userPaths[`user-${user_id}-tags`];
        }
      }

      const data = {
        new_data: posts.data,
        data: [
          ...prevUserPosts.data,
          ...posts.data,
        ],
        total_pages: posts.total_pages,
        page: page,
        limit: posts.limit,
        cleared: clear,
      };

      state.userPaths[`user-${user_id}-tags`] = data;
      state.userPathsUpdated = true;
    },
    clearPathData({
      state
    }) {
      state.paths = {};
    },
    setPathData({
      state
    }, {
      path,
      data
    }) {
      // Ensure the path key exists
      if (!state.paths[path]) {
        state.paths[path] = {};
      }

      // Update the data for the given path
      state.paths[path] = {
        ...state.paths[path],
        ...data,
      };
    },
    removePathData({
      state
    }, path) {
      if (state.paths[path]) {
        delete state.paths[path];
      }
    },
    async login({
      state
    }, {
      token
    }) {
      try {
        const persistedAuth = await getPersistedAuth();

        if (persistedAuth) {
          state.user = persistedAuth.user_data;
          window.localStorage.setItem('token', token);
          return;
        }

        const userDetails = await getUserDetails(token);

        if (!userDetails || !userDetails.success) {
          window.localStorage.removeItem('token');
          throw new Error('User not found');
        }

        window.localStorage.setItem('token', token);
        state.user = userDetails.user;

        persistAuth(userDetails.user);

        setTimeout(() => {
          sendRNMessage({
            type: "authData",
            user_id: userDetails.user.id,
            page: 'auth',
          });
        }, 1000);
      } catch (error) {
        console.error('Login failed', error);
      }
    },
    setDeviceToken({
      state
    }, {
      token
    }) {
      associateDeviceWithUser(token);
      state.user.fcmToken = token;
    },
    async logout({
      state
    }) {
      if (state.user && state.user.fcmToken) {
        await setUserAsInactive(state.user.fcmToken);
      }

      state.user = null;
      window.localStorage.removeItem('token');

      // Clear the persisted user data
      persistAuth(null);

      window.location.reload();
    },
    async updateUserDetails({
      state
    }, external = false) {
      const token = window.localStorage.getItem('token');

      if (!token) {
        return this.logout();
      }

      try {
        const userDetails = await getUserDetails(token);

        if (!userDetails || !userDetails.success) {
          window.localStorage.removeItem('token');
          // Clear the persisted user data
          persistAuth(null);
          throw new Error('User not found');
        }

        window.localStorage.setItem('token', token);
        state.user = {
          ...userDetails.user,
          refreshed: true,
          external_refresh: external,
        };

        // Persist the user data
        persistAuth(userDetails.user);
      } catch (error) {
        console.error('Login failed', error);
      }
    },
    async checkAuth(context) {
      const token = await getSessionUser();

      if (token) {
        await context.dispatch('login', {
          token: token
        });
      } else {
        window.localStorage.removeItem('token');
        persistAuth(null);
      }
    },
    async getPosts({
      state
    }, {
      page = 1,
      reset = false
    }) {
      try {
        const posts = await fetchPosts(page);

        if (reset) {
          state.posts = {
            new_data: posts.data,
            data: posts.data,
            total_pages: posts.total_pages,
            page: page,
            limit: posts.limit,
            reset: true,
          };
          return;
        }

        const data = {
          new_data: posts.data,
          data: [
            ...state.posts.data,
            ...posts.data,
          ],
          total_pages: posts.total_pages,
          page: page,
          limit: posts.limit,
        };

        state.posts = data;
      } catch (error) {
        console.error('Failed to fetch posts', error);

        if (error.name === 'RequestTimeout') {
          state.poorNetworkError = true;
        }

        state.posts = {
          new_data: [],
          data: [],
          total_pages: 0,
          page: 1,
          limit: 10,
        };
      }
    },
    async setGarageViewPosts({
      state
    }, garage_id, page = 1) {
      const posts = await getPostsForGarage(garage_id, page);

      let prevData = state.garageViewPosts.data;

      if (page === 1) {
        prevData = [];
      }

      const data = {
        data: [
          ...prevData,
          ...posts.data,
        ],
        total_pages: posts.total_pages,
        page: page,
        limit: posts.limit,
      };

      state.garageViewPosts = data;
    },
    async setGarageViewTags({
      state
    }, garage_id, page = 1) {
      const posts = await getPostsForGarage(garage_id, page, true);

      let prevData = state.garageViewTags.data;

      if (page === 1) {
        prevData = [];
      }

      const data = {
        data: [
          ...prevData,
          ...posts.data,
        ],
        total_pages: posts.total_pages,
        page: page,
        limit: posts.limit,
      };

      state.garageViewTags = data;
    },
    async getFollowingPosts({
      state
    }, {
      page = 1,
      reset = false
    }) {
      try {
        const posts = await fetchPosts(page, true);

        if (reset) {
          state.following_posts = {
            new_data: posts.data,
            data: posts.data,
            total_pages: posts.total_pages,
            page: page,
            limit: posts.limit,
            reset: true,
          };
          return;
        }

        const data = {
          new_data: posts.data,
          data: [
            ...state.following_posts.data,
            ...posts.data,
          ],
          total_pages: posts.total_pages,
          page: page,
          limit: posts.limit,
        };

        state.following_posts = data;
      } catch (error) {
        console.error('Failed to fetch following posts', error);

        if (error.name === 'RequestTimeout') {
          state.poorNetworkError = true;
        }

        state.following_posts = {
          new_data: [],
          data: [],
          total_pages: 0,
          page: 1,
          limit: 10,
        };
      }
    },
    async setRegisterData({
      state
    }, {
      email,
      password,
      username,
      user_id
    }) {
      state.registerData = {
        email: email,
        password: password,
        username: username,
        user_id: user_id,
      };
    },
    async getMyGarage({
      state
    }) {
      const garage = await getUserGarage(state.user.id);
      state.myGarage = garage;
    },
    async getMyPosts({
      state
    }, {
      page = 1,
      clear = false
    }) {
      const posts = await getPostsForUser(state.user.id, page, false, 9, clear);

      if (clear) {
        state.myPosts = {
          new_data: posts.data,
          data: posts.data,
          total_pages: posts.total_pages || 0,
          page: page,
          limit: posts.limit || 10,
          cleared: true,
        };
        return;
      }

      const data = {
        new_data: posts.data,
        data: [
          ...state.myPosts.data,
          ...posts.data,
        ],
        total_pages: posts.total_pages,
        page: page,
        limit: posts.limit,
      };

      state.myPosts = data;
    },
    async getMyTags({
      state
    }, {
      page = 1,
      clear = false
    }) {
      const posts = await getPostsForUser(state.user.id, page, true, 9, clear);

      if (clear) {
        state.myTags = {
          new_data: posts.data,
          data: posts.data,
          total_pages: posts.total_pages || 0,
          page: page,
          limit: posts.limit || 10,
          cleared: true,
        };
        return;
      }

      const data = {
        new_data: posts.data,
        data: [
          ...state.myTags.data,
          ...posts.data,
        ],
        total_pages: posts.total_pages,
        page: page,
        limit: posts.limit,
      };

      state.myTags = data;
    },
    setScannedData({
      state
    }, data) {
      state.scannedData = data;
    },
    setScanningQrCode({
      state
    }, value) {
      state.scanningQrCode = value;
    },
  },
});

export default store;