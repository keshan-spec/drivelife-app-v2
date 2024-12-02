import app from "./app.js";
import store from "./store.js";
import $ from 'dom7';;

import Swiper from 'swiper';


var trendingEventsStore = store.getters.getTrendingEvents;
var trendingVenuesStore = store.getters.getTrendingVenues;
var eventCategories = store.getters.getEventCategories;
var filteredEventsStore = store.getters.getFilteredEvents;
var filteredVenuesStore = store.getters.getFilteredVenues;
var trendingUsersStore = store.getters.getTrendingUsers;
var trendingVehiclesStore = store.getters.getTrendingVehicles;

var isFetchingPosts = false;
var currentEventsPage = 1;
var currentVenuesPage = 1;
var currentUsersPage = 1;
var refreshed = false;

var totalEventPages = 1;
var totalVenuesPages = 1;
var totalUsersPages = 1;
var totalVehiclePages = 1;

var autocomplete;
var filters = {};

//AUTOCOMPLETE FUNCTIONS
function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById("autocomplete"), {
        types: ["establishment", "geocode"],
        componentRestrictions: {
            country: 'GB'
        }
    }
    );
    autocomplete.setFields(["geometry", "address_component"]);
    autocomplete.addListener("place_changed", fillInAddress);
}

function fillInAddress() {
    const place = autocomplete.getPlace();
    document.getElementById('lat').value = place.geometry.location.lat();
    document.getElementById('lng').value = place.geometry.location.lng();
}

function populateEventCard(data = [], isSwiper = true) {
    const swiperContainer = document.querySelector('#trending-events');
    if (isSwiper) swiperContainer.innerHTML = '';

    const eventsTabContainer = document.querySelector('#filtered-events-tab');

    if (refreshed) {
        eventsTabContainer.innerHTML = '';
    }

    data.forEach(event => {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        // const startDate = new Date(event.dates[0].start_date);
        // const endDate = new Date(event.dates[0].end_date);

        let endDateString = '';

        if (startDate.getDate() !== endDate.getDate()) {
            endDateString = `
            <div class="event-date-item">
                <p>${endDate.toLocaleString('default', { month: 'short' })}</p>
                <h5>${endDate.getDate()}</h5>
            </div>
            `;
        }

        const card = `
        <a href="/discover-view-event/${event.id}">
            <div class="card event-item">
                <div class="event-image position-relative">
                    <div class="image-rectangle" style="background-image: url('${event.thumbnail}');"></div>
                    <div class="event-dates">
                        <div class="event-date-item">
                            <p>${startDate.toLocaleString('default', { month: 'short' })}</p>
                            <h5>${startDate.getDate()}</h5>
                        </div>
                        ${endDateString}
                    </div>
                </div>
                <div class="card-content">
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-info">Starts ${startDate.toLocaleString('default', { weekday: 'short' })}, ${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getFullYear()}</p>
                    <div class="event-info">
                        ${event.location}
                    </div>
                </div>
            </div>
        </a>
        `;

        if (isSwiper) {
            const swiperSlide = document.createElement('swiper-slide');
            swiperSlide.innerHTML = card;
            swiperContainer.appendChild(swiperSlide);
        }

        eventsTabContainer.innerHTML += card;
    });
}

function populateVenueCard(data = [], isSwiper = true) {
    const swiperContainer = document.querySelector('#trending-venues');

    if (isSwiper) swiperContainer.innerHTML = '';

    const eventsTabContainer = document.querySelector('#filtered-venues-tab');

    data.forEach(event => {
        const swiperSlide = document.createElement('swiper-slide');

        const card = `
        <a href="/discover-view-venue/${event.ID}">
            <div class="card event-item">
                <div class="event-image position-relative">
                    <div class="image-rectangle" style="background-image: url('${event.cover_image}');"></div>
                </div>
                <div class="card-content">
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-info">
                        ${event.venue_location}
                    </div>
                    <div class="event-info">
                        Apprx. ${event.distance} miles away
                    </div>
                </div>
            </div>
        </a>
        `;

        if (isSwiper) {
            swiperSlide.innerHTML = card;
            swiperContainer.appendChild(swiperSlide);
        }

        eventsTabContainer.innerHTML += card;
    });


}

function populateUsersCard(data = []) {
    const tabContainer = document.querySelector('#users-tab');

    if (refreshed) {
        // clear the tab container
        tabContainer.innerHTML = '';
    }

    data.forEach(user => {
        let linkTo = user.type === 'user' ? `/profile-view/${user.id}` : `/profile-garage-vehicle-view/${user.id}`;
        let title;

        if (user.type === 'user') {
            title = user.name;
        }

        if (user.type === 'vehicle') {
            const userName = user.owner.username;
            const vehicleName = user.title;

            title = `${vehicleName} <br/> Owner ${userName}`;
        }


        const card = `
        <li>
            <a class="item-link search-result item-content" href="${linkTo}">
                <div class="item-media">
                    <div class="image-square image-rounded"
                        style="background-image:url('${user.thumbnail || 'img/profile-placeholder.jpg'}')">
                    </div>
                </div>
                <div class="item-inner">
                    <div class="item-title">${title}</div>
                </div>
            </a>
        </li>
        `;
        tabContainer.innerHTML += card;
    });
}

function populateVehiclesCard(data = []) {
    const tabContainer = document.querySelector('#vehicles-tab');

    data.forEach(user => {
        let linkTo = `/profile-garage-vehicle-view/${user.id}`;
        let title;

        const userName = user.owner.username;
        const vehicleName = user.title;

        title = `${vehicleName} <br/> Owner @${userName}`;

        const card = `
        <li>
            <a class="item-link search-result item-content" href="${linkTo}">
                <div class="item-media">
                    <div class="image-square image-rounded"
                        style="background-image:url('${user.thumbnail}')">
                    </div>
                </div>
                <div class="item-inner">
                    <div class="item-title">${title}</div>
                </div>
            </a>
        </li>
        `;
        tabContainer.innerHTML += card;
    });
}

function addCategoryOptions(categories) {
    const categoryFilters = document.querySelector('#category-filters ul');

    categories.forEach(category => {
        const listItem = document.createElement('li');

        listItem.innerHTML = `
            <label class="item-checkbox item-content">
                <input type="checkbox" name="${category.slug}" value="${category.id}" />
                <i class="icon icon-checkbox"></i>
                <div class="item-inner">
                    <div class="item-title">${category.name}</div>
                </div>
            </label>
        `;

        categoryFilters.appendChild(listItem);
    });
}

// Event listener for the submit button
$(document).on('click', '.apply-filters', function (e) {
    const dateFilters = document.querySelector('#date-filters ul');
    const locationFilters = document.querySelector('#location-filters ul');
    const categoryFilters = document.querySelector('#category-filters ul');

    e.preventDefault(); // Prevent form submission if you're handling it via JavaScript
    const selectedCats = [...categoryFilters.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
    const selectedLocation = [...locationFilters.querySelectorAll('input[type="radio"]:checked')].map(cb => cb.value);
    const dateFilter = [...dateFilters.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);

    const latitude = document.getElementById('lat').value;
    const longitude = document.getElementById('lng').value;

    let location = null;

    if (latitude && longitude) {
        location = {
            latitude,
            longitude
        };
    }

    filters = {
        'event_location': selectedLocation,
        'custom_location': location,
        'event_date': dateFilter,
        //  'event_start': customDateRange?.start,
        //  'event_end': customDateRange?.end,
        'event_category': !selectedCats?.includes(0) ? selectedCats : undefined,
    };

    // get active tab
    const activeTab = document.querySelector('.tabbar-nav .tab-link-active').getAttribute('data-id');

    if (activeTab === 'events') {
        store.dispatch('filterEvents', {
            page: 1,
            filters
        });

        currentEventsPage = 1;
        isFetchingPosts = false;

        const eventsTabContainer = document.querySelector('#filtered-events-tab');
        eventsTabContainer.innerHTML = '';
    }

    if (activeTab === 'venues') {
        // remove unwanted filters
        delete filters.event_date;
        delete filters.event_category;
        delete filters.event_location;

        filters['location'] = selectedLocation;

        store.dispatch('filterVenues', {
            page: 1,
            filters
        });

        currentVenuesPage = 1;
        isFetchingPosts = false;

        const venuesTabContainer = document.querySelector('#filtered-venues-tab');
        venuesTabContainer.innerHTML = '';
    }

    // close popup
    app.popup.close();
});

$(document).on('change', '#category-filters ul', function (e) {
    const categoryFilters = document.querySelector('#category-filters ul');
    var allCheckbox = categoryFilters.querySelector('input[name="all"]');

    const targetCheckbox = e.target;

    if (targetCheckbox.name !== "all") {
        // If any other checkbox is selected, uncheck "All"
        if (targetCheckbox.checked) {
            allCheckbox.checked = false;
        } else {
            // If all other checkboxes are unchecked, check "All"
            const allUnchecked = [...categoryFilters.querySelectorAll('input[type="checkbox"]')]
                .filter(cb => cb.name !== "all")
                .every(cb => !cb.checked);

            if (allUnchecked) {
                allCheckbox.checked = true;
            }
        }
    } else {
        // If "All" is selected, uncheck all other checkboxes
        if (targetCheckbox.checked) {
            [...categoryFilters.querySelectorAll('input[type="checkbox"]')]
                .filter(cb => cb.name !== "all")
                .forEach(cb => cb.checked = false);
        }
    }
});

eventCategories.onUpdated((data) => {
    addCategoryOptions(data);
});

trendingVenuesStore.onUpdated((data) => {
    const tabContainer = document.querySelector('#filtered-venues-tab');

    if (!data || data.data.length === 0) {
        tabContainer.innerHTML = `
            <div class="no-venues">
                <h3>No venues found</h3>
            </div>
        `;

        $('.infinite-scroll-preloader.venues-tab').hide();
        totalVenuesPages = 0;
        return;
    }

    totalVenuesPages = data.total_pages || 0;

    if ((totalVenuesPages == data.page) || (totalVenuesPages == 0)) {
        $('.infinite-scroll-preloader.venues-tab').hide();
        totalVenuesPages = 0;
    } else {
        $('.infinite-scroll-preloader.venues-tab').show();
        totalVenuesPages = data.total_pages;
        populateVenueCard(data.data, false);
    }

    // totalVenuesPages = data.total_pages

    // populateVenueCard(data.data);
});

trendingEventsStore.onUpdated((data) => {
    const eventsTabContainer = document.querySelector('#filtered-events-tab');
    if (!data || data.data.length === 0) {
        eventsTabContainer.innerHTML = `
            <div class="no-events">
                <h3>No events found</h3>
            </div>
        `;
        $('.infinite-scroll-preloader.events-tab').hide();
        return;
    }

    totalEventPages = data?.data?.length || 0;

    if ((totalEventPages == data.page) || (totalEventPages == 0)) {
        $('.infinite-scroll-preloader.events-tab').hide();
        totalEventPages = 0;
    } else {
        $('.infinite-scroll-preloader.events-tab').show();
        totalEventPages = data?.data?.length || 0;
        populateEventCard(data.data, false);
    }

    // totalEventPages = data.total_pages

    // populateEventCard(data.data);
});

trendingUsersStore.onUpdated((data) => {
    const tabContainer = document.querySelector('#users-tab');
    if (!data || data.data.length === 0) {
        tabContainer.innerHTML = `
            <div class="no-events">
                <h3>No trending users found for you</h3>
            </div>
        `;
        return;
    }

    totalUsersPages = data.total_pages;

    if ((totalUsersPages == data.page) || (totalUsersPages == 0) || (data.new_data.length < 10)) {
        $('.infinite-scroll-preloader.users-tab').hide();
    } else {
        $('.infinite-scroll-preloader.users-tab').show();
    }

    populateUsersCard(data.new_data);
});

trendingVehiclesStore.onUpdated((data) => {
    const tabContainer = document.querySelector('#vehicles-tab');
    if (!data || data.data.length === 0) {
        tabContainer.innerHTML = `
            <div class="no-events">
                <h3>No trending vehicles found for you</h3>
            </div>
        `;
        return;
    }

    totalVehiclePages = data.total_pages;

    if ((totalVehiclePages == data.page) || (totalVehiclePages == 0) || (data.new_data.length < 10)) {
        $('.infinite-scroll-preloader.vehicles-tab').hide();
    } else {
        $('.infinite-scroll-preloader.vehicles-tab').show();
    }

    populateVehiclesCard(data.new_data);
});

// Filtered views
filteredEventsStore.onUpdated((data) => {
    const eventsTabContainer = document.querySelector('#filtered-events-tab');
    if (!data || data.data.length === 0) {
        eventsTabContainer.innerHTML = `
            <div class="no-events">
                <h3>No events found</h3>
            </div>
        `;
        return;
    }

    totalEventPages = data?.data?.length || 0;

    if ((totalEventPages == data.page) || (totalEventPages == 0) || (data.new_data.length < 10)) {
        $('.infinite-scroll-preloader.events-tab').hide();
    } else {
        $('.infinite-scroll-preloader.events-tab').show();
    }

    populateEventCard(data.new_data, false);
});

filteredVenuesStore.onUpdated((data) => {
    const tabContainer = document.querySelector('#filtered-venues-tab');

    if (!data || data.data.length === 0) {
        tabContainer.innerHTML = `
            <div class="no-venues">
                <h3>No venues found</h3>
            </div>
        `;

        totalVenuesPages = 0;
        return;
    }

    if ((totalVenuesPages == data.page) || (totalVenuesPages == 0) || (data.new_data.length == 0)) {
        $('.infinite-scroll-preloader.venues-tab').hide();
        totalVenuesPages = 0;
    } else {
        $('.infinite-scroll-preloader.venues-tab').show();
        totalVenuesPages = data.total_pages;
        populateVenueCard(data.new_data, false);
    }
});

$(document).on('page:afterin', '.page[data-name="discover"]', function (e) {
    // initAutocomplete();
});

$(document).on('infinite', '.discover-page.infinite-scroll-content', async function (e) {
    if (isFetchingPosts) return;

    // get active tab
    const activeTabId = $('.tabbar-nav .tab-link-active').attr('data-id');

    if (!activeTabId) return;

    isFetchingPosts = true;

    if (activeTabId == 'events') {
        currentEventsPage++;

        if (currentEventsPage <= totalEventPages) {
            await store.dispatch('filterEvents', {
                page: currentEventsPage,
                filters
            });
            isFetchingPosts = false;
        }
    } else if (activeTabId == 'venues') {
        currentVenuesPage++;

        if (currentVenuesPage <= totalVenuesPages) {
            await store.dispatch('filterVenues', {
                page: currentVenuesPage,
                filters
            });
            isFetchingPosts = false;
        }
    }
    isFetchingPosts = false;
});

$(document).on('page:init', '.page[data-name="discover-view-event"]', function (e) {
    // Init slider
    new Swiper('.swiper-container', {
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
    });

    app.popup.create({
        el: '.share-listing-popup',
        swipeToClose: 'to-bottom'
    });
});

$(document).on('ptr:refresh', '.discover-page.ptr-content', async function (e) {
    refreshed = true;
    currentEventsPage = 1;
    currentVenuesPage = 1;

    try {
        await store.dispatch('getTrendingEvents');
        await store.dispatch('getTrendingVenues');
        await store.dispatch('filterTrendingUsers');
        await store.dispatch('fetchEventCategories');
    } catch (error) {
        console.log(error);
    }

    refreshed = false;
    app.ptr.get('.discover-page.ptr-content').done();
});

$(document).on('click', '#featured-event-link', function (e) {
    e.preventDefault();
    window.open(e.target.href, '_blank');
});