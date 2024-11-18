import {
    getDiscoverData
} from "./api/discover.js";
import store from "./store.js";

import $ from 'dom7';;

let activeTab = 'all';
let lastSearchText = '';
let controller; // To store the current AbortController

var searchResultsStore = store.getters.getSearchResults;

$(document).on('page:afterin', '.page[data-name="search"]', async function (e) {
    $('.loading-fullscreen.search-view').hide();

    // Delay the focus slightly to ensure it's triggered on mobile
    setTimeout(function () {
        $('#discover-search').focus();

        // Scroll to the input to make sure it's in view (this sometimes triggers the keyboard)
        $('#discover-search')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Re-trigger focus after scrolling
        $('#discover-search').focus();
    }, 300); // Adjust the delay if needed
});

// event listener for tab change
$(document).on('click', '.discovery-wrap .tab-link', async function (e) {
    const type = this.getAttribute('data-type');
    activeTab = type;
});

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

function addLoaderToTabs() {
    const eventsContainer = document.querySelector('#events-results .list ul');
    const usersContainer = document.querySelector('#users-results .list ul');
    const vehiclesContainer = document.querySelector('#vehicles-results .list ul');
    const venuesContainer = document.querySelector('#venues-results .list ul');
    const topContainer = document.querySelector('#top-results .list');

    const loader = `
    <div class="loading-fullscreen search-view">
        <div class="preloader preloader-central">
            <span class="preloader-inner"><span class="preloader-inner-line"></span><span
                class="preloader-inner-line"></span><span class="preloader-inner-line"></span><span
                class="preloader-inner-line"></span><span class="preloader-inner-line"></span><span
                class="preloader-inner-line"></span><span class="preloader-inner-line"></span><span
                class="preloader-inner-line"></span>
            </span>
        </div>
    </div>`;

    eventsContainer.innerHTML = loader;
    usersContainer.innerHTML = loader;
    venuesContainer.innerHTML = loader;
    topContainer.innerHTML = loader;
    vehiclesContainer.innerHTML = loader;
    $('.loading-fullscreen.search-view').show();
}

// Function to save searches to localStorage
function saveSearchToHistory(search) {
    const maxHistoryLength = 5; // Limit the number of stored searches
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

    // Check if search is already in the history
    if (!searchHistory.includes(search)) {
        // Add the new search to the beginning of the array
        searchHistory.unshift(search);

        // Keep only the last maxHistoryLength searches
        if (searchHistory.length > maxHistoryLength) {
            searchHistory = searchHistory.slice(0, maxHistoryLength);
        }

        // Save the updated history to localStorage
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
}

// Function to display search history
function displaySearchHistory() {
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

    const historyContainer = $('#search-history');
    historyContainer.empty(); // Clear previous history

    if (searchHistory.length > 0) {
        // Populate the history container with recent searches
        searchHistory.forEach(search => {
            historyContainer.append(`
                <li class="search-history-item" data-index="${searchHistory.indexOf(search)}">
                <div>
                    <i class="icon f7-icons">timer</i>
                    <span>${search}</span>
                </div>
                <i class="icon f7-icons delete-history">xmark</i>
                </li>
                `);
        });

        // Show the history container
        historyContainer.show();
    } else {
        // Hide the history container if there's no history
        historyContainer.hide();
    }
}

// Handle clicking on the delete history icon
$(document).on('click', '.delete-history', function (e) {
    e.stopPropagation(); // Prevent the search from being triggered

    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const index = $(this).closest('li').data('index');

    // Remove the search from the history
    searchHistory.splice(index, 1);
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));

    // Update the search history display after deletion
    displaySearchHistory();
});

// Hide search history when clicking outside
$(document).on('click', function (e) {
    if (!$(e.target).closest('#discover-search').length && !$(e.target).closest('#search-history').length) {
        $('#search-history').hide();
    }
});

// Handle clicking on a history item to perform the search
$(document).on('click', '#search-history li', function () {
    // Get the search text from the history item span
    const search = $(this).find('span').text();

    // clear the search input
    $('#discover-search').val('');

    $('#discover-search').val(search).trigger('input');
    $('#search-history').hide(); // Hide the history after selecting
});

// Optionally, display history on input focus
// $(document).on('click', '#discover-search', displaySearchHistory);

const debouncedSearch = debounce(async function () {
    const search = $(this).val().trim();

    if (search.length < 3 || search === lastSearchText) {
        return;
    }

    lastSearchText = search;

    // Abort the previous request if it's still ongoing
    if (controller) {
        controller.abort();
    }

    // Create a new AbortController for the current request
    controller = new AbortController();
    const signal = controller.signal;

    addLoaderToTabs();


    // Save the valid search to history
    saveSearchToHistory(search);

    try {
        const searchResults = await getDiscoverData(search, 'all', 1, signal);
        store.dispatch('setSearchResults', searchResults);
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
        } else {
            console.error('Error fetching search results:', error);
        }
    }
}, 300); // Adjust the delay (in milliseconds) as needed

$(document).on('change input paste', '#discover-search', debouncedSearch);

// Function to render a list of items in the DOM
function renderList(container, items, renderItem) {
    container.innerHTML = '';

    const noResultsMessage = `
    <li class="item-content w-full">
        <strong class="text-center w-full">No results found</strong>
    </li>`;

    if (!items || items.length === 0) {
        container.innerHTML = noResultsMessage;
        return;
    }

    // Render each item
    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = renderItem(item);
        container.appendChild(li);
    });
}

// Function to render the search results
function renderSearchResults(searchResults) {
    const eventsContainer = document.querySelector('#events-results .list ul');
    const usersContainer = document.querySelector('#users-results .list ul');
    const vehiclesContainer = document.querySelector('#vehicles-results .list ul');
    const venuesContainer = document.querySelector('#venues-results .list ul');
    const topContainer = document.querySelector('#top-results .list');

    // Ensure containers are cleared before rendering
    eventsContainer.innerHTML = '';
    usersContainer.innerHTML = '';
    venuesContainer.innerHTML = '';
    topContainer.innerHTML = '';

    // Render events
    if (searchResults.events) {
        renderList(eventsContainer, searchResults.events.data, event => `
            <a class="item-link search-result item-content" href="/discover-view-event/${event.id}">
                <div class="item-media">
                    <div class="image-square image-rounded" style="background-image:url('${event.thumbnail}')"></div>
                </div>
                <div class="item-inner">
                    <div class="item-title">${event.name}</div>
                </div>
            </a>
        `);
    }

    // Render users
    if (searchResults.users) {
        renderList(usersContainer, searchResults.users.data, (user) => {
            const userLink = user.type == 'user' ? '/profile-view/' + user.id : '/profile-garage-vehicle-view/' + user.id;
            let contentText;

            if (user.type == 'user') {
                contentText = `${user.name} (@${user.username})`;
            }

            if (user.type == 'vehicle') {
                contentText = `${user.name}'s <b>${user.meta.make} ${user.meta.model}</b>`;
            }

            return `
                <a class="item-link search-result item-content" href="${userLink}">
                    <div class="item-media">
                        <div class="image-square image-rounded" style="background-image:url('${user.thumbnail || 'assets/img/profile-placeholder.jpg'}')"></div>
                    </div>
                    <div class="item-inner">
                        <div class="item-title">${contentText}</div>
                    </div>
                </a>`;
        });
    }

    if (searchResults.vehicles) {
        renderList(vehiclesContainer, searchResults.vehicles.data, (user) => {
            const userLink = user.type == 'post' ? '/post-view/' + user.id : '/profile-garage-vehicle-view/' + user.id;
            let contentText;

            if (user.type == 'post') {
                contentText = `${user.username} tagged ${user.name}`;
            }

            if (user.type == 'vehicle') {
                contentText = `${user.name}'s <b>${user.meta.make} ${user.meta.model}</b>`;
            }

            return `
                <a class="item-link search-result item-content" href="${userLink}">
                    <div class="item-media">
                        <div class="image-square image-rounded" style="background-image:url('${user.thumbnail || 'assets/img/profile-placeholder.jpg'}')"></div>
                    </div>
                    <div class="item-inner">
                        <div class="item-title">${contentText}</div>
                    </div>
                </a>`;
        });
    }

    // Render venues
    if (searchResults.venues) {
        renderList(venuesContainer, searchResults.venues.data, venue => `
            <a class="item-link search-result item-content" href="/discover-view-venue/${venue.id}">
                <div class="item-media">
                    <div class="image-square image-rounded" style="background-image:url('${venue.thumbnail}')"></div>
                </div>
                <div class="item-inner">
                    <div class="item-title">${venue.name} - ${venue.venue_location}</div>
                </div>
            </a>
        `);
    }

    // Render top results
    let hasTopResults = false;

    if (searchResults.top_results) {
        if (searchResults.top_results.events && searchResults.top_results.events.length > 0) {
            hasTopResults = true;
            const eventSubList = document.createElement('ul');
            const heading = document.createElement('h2');

            heading.innerHTML = 'Trending Events';
            heading.classList.add('section-title', 'mt-3', 'mb-2');
            topContainer.appendChild(heading);
            topContainer.appendChild(eventSubList);

            renderList(eventSubList, searchResults.top_results.events, event => `
                <a class="item-link search-result item-content" href="/discover-view-event/${event.id}">
                    <div class="item-media">
                        <div class="image-square image-rounded" style="background-image:url('${event.thumbnail}')"></div>
                    </div>
                    <div class="item-inner">
                        <div class="item-title">${event.name}</div>
                    </div>
                </a>
            `);
        }

        if (searchResults.top_results.users && searchResults.top_results.users.length > 0) {
            hasTopResults = true;

            const userSubList = document.createElement('ul');
            const heading = document.createElement('h2');

            heading.innerHTML = 'Trending Users';
            heading.classList.add('section-title', 'mt-3', 'mb-2');
            topContainer.appendChild(heading);
            topContainer.appendChild(userSubList);

            renderList(userSubList, searchResults.top_results.users, (user) => {
                const userLink = user.type == 'user' ? '/profile-view/' + user.id : '/profile-garage-vehicle-view/' + user.id;
                let contentText;

                if (user.type == 'user') {
                    contentText = `${user.name} (@${user.username})`;
                }

                if (user.type == 'vehicle') {
                    contentText = `${user.name}'s <b>${user.meta.make} ${user.meta.model}</b>`;
                }

                return `
                <a class="item-link search-result item-content" href="${userLink}">
                    <div class="item-media">
                        <div class="image-square image-rounded" style="background-image:url('${user.thumbnail || 'assets/img/profile-placeholder.jpg'}')"></div>
                    </div>
                    <div class="item-inner">
                        <div class="item-title">${contentText}</div>
                    </div>
                </a>`;
            });
        }

        if (searchResults.top_results.venues && searchResults.top_results.venues.length > 0) {
            hasTopResults = true;

            const venueSubList = document.createElement('ul');
            const heading = document.createElement('h2');

            heading.innerHTML = 'Trending Venues';
            heading.classList.add('section-title', 'mt-3', 'mb-2');

            topContainer.appendChild(heading);
            topContainer.appendChild(venueSubList);

            renderList(venueSubList, searchResults.top_results.venues, venue => `
                <a class="item-link search-result item-content" href="/discover-view-venue/${venue.id}">
                    <div class="item-media">
                        <div class="image-square image-rounded" style="background-image:url('${venue.thumbnail}')"></div>
                    </div>
                    <div class="item-inner">
                        <div class="item-title">${venue.name} - ${venue.venue_location}</div>
                    </div>
                </a>
            `);
        }
    }

    if (!hasTopResults) {
        topContainer.innerHTML = `
        <li class="item-content w-full">
            <strong class="text-center w-full">No results found</strong>
        </li>`;
    }
}

searchResultsStore.onUpdated((results) => {
    renderSearchResults(results);
});