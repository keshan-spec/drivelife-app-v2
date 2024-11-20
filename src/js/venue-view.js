import {
    fetchVenue,
    maybeFollowVenue
} from "./api/discover.js";
import app from "./app.js";

import $ from 'dom7';;

//DISCOVER - VIEW EVENT
$(document).on('page:init', '.page[data-name="discover-view-venue"]', async function (e) {
    var venueId = e.detail.route.params.id;

    if (!venueId || venueId === '-1') {
        return;
    }

    $('.loading-fullscreen').show();
    const venueData = await fetchVenue(venueId);

    $('.loading-fullscreen').hide();

    $('#copy-venue-link').attr('data-venue-id', venueId);
    $('#share-email-venue-link').attr('data-venue-id', venueId);

    const mainContainer = $('.discover-view-event');

    if (!venueData) {
        mainContainer.html('<div class="text-align-center">No event found</div>');
        return;
    }

    // Populating the Event Title
    mainContainer.find('.event-detail-title').text(venueData.title);

    // Populating the Event Location
    // create a map link with the address
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${venueData.location}`;
    // create an anchor tag with the map link
    const mapLinkTag = `<a href="${mapLink}" target="_blank" class="event-location-map">${venueData.location}</a>`;
    mainContainer.find('.event-time-address span').html(mapLinkTag);

    // Populating the Cover Image
    mainContainer.find('.event-detail-img-box .swiper-slide .swiper-image')
        .css('background-image', `url('${venueData.cover_photo.url}')`)
        .attr('alt', venueData.cover_photo.alt);

    // Populating the "About" Tab Content
    mainContainer.find('#tab-about .event-des-wrap').html(`<p>${venueData.description}</p>`);

    // Populating the "Follow" button state
    const followButton = mainContainer.find('.event-list-btn .btn.bg-dark');
    if (venueData.is_following) {
        followButton.text('Following');
    } else {
        followButton.text('Follow');
    }

    // Populating the "Upcoming Events" Tab (if there are any events)
    const eventsContainer = mainContainer.find('#tab-events .grid.event-listing');
    eventsContainer.empty(); // Clear any placeholder content

    if (venueData.events.length > 0) {
        venueData.events.forEach(event => {
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);

            const startMonth = startDate.toLocaleString('default', {
                month: 'short'
            });
            const startDay = startDate.getDate();

            let endDateString = '';

            if (startDate.getDate() !== endDate.getDate()) {
                endDateString = `
            <div class="event-date-item">
                <p>${endDate.toLocaleString('default', { month: 'short' })}</p>
                <h5>${endDate.getDate()}</h5>
            </div>
            `;
            }

            const eventItem = `
            <a href="/discover-view-event/${event.id}" class="card event-item">
                <div class="event-image position-relative">
                    <div class="image-rectangle" style="background-image: url('${event.thumbnail}');"></div>
                    <div class="event-dates">
                        <div class="event-date-item">
                            <p>${startMonth}</p>
                            <h5>${startDay}</h5>
                        </div>
                        ${endDateString}
                    </div>
                </div>
                <div class="card-content">
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-info">Starts ${event.start_date}</p>
                    <div class="event-info">${event.location}</div>
                </div>
            </a>
        `;
            eventsContainer.append(eventItem);
        });
    } else {
        eventsContainer.html('<div class="text-align-center">No upcoming events</div>');
    }

    // follow button
    const is_following = venueData.is_following;

    if (is_following) {
        mainContainer.find('.venue-follow-btn').text('Following');
    }

    mainContainer.find('.venue-follow-btn').on('click', async function () {
        const followButton = $(this);
        const isFollowing = followButton.text() === 'Following';

        // change the button text
        followButton.text(isFollowing ? 'Follow' : 'Following');
        const response = await maybeFollowVenue(venueId);
    });
});

// event-location-map
$(document).on('click', '.event-time-address span a', function (e) {
    e.preventDefault();
    const mapLink = $(this).attr('href');
    window.open(mapLink, '_blank');
});

$(document).on('click', '#copy-venue-link', function () {
    const venueId = $(this).attr('data-venue-id');
    const eventLink = `https://app.mydrivelife.com/discover-view-venue/${venueId}`;

    navigator.clipboard.writeText(eventLink);

    app.toast.create({
        text: 'Link copied to clipboard',
        closeTimeout: 2000
    }).open();
});

// #share-email-venue-link click event
$(document).on('click', '#share-email-venue-link', function () {
    const venueId = $(this).attr('data-venue-id');
    const eventLink = `https://app.mydrivelife.com/discover-view-venue/${venueId}`;

    window.open(`mailto:?subject=Check out this venue&body=${eventLink}`);
});