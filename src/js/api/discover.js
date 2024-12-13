import {
    getSessionUser
} from "./auth.js";
import {
    API_URL
} from "./consts.js";

/**
 * Fetches the discover data
 * 
 * @param {string} search
 * @param {'users' | 'events' | 'venues' | 'all'} type 
 * @param {number} page default 1
 * 
 */
export const getDiscoverData = async (search, type, page = 1, signal) => {
    const user = await getSessionUser();

    if (!user || !user.id) {
        return null;
    }

    const site = user?.last_location?.country || 'GB';

    const response = await fetch(`${API_URL}/wp-json/app/v1/discover-search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            search,
            user_id: user?.id,
            page,
            type,
            per_page: 20,
            site
        }),
        signal
    });

    const data = await response.json();
    return data;
};

export const fetchEvent = async (eventId) => {
    let user;
    try {
        user = await getSessionUser();
    } catch (e) {
        console.error("Error fetching user no session");
    }

    if (!user || !user.id) {
        return null;
    }

    const site = user?.last_location?.country || 'GB';

    const query = new URLSearchParams({
        event_id: eventId,
        user_id: user?.id,
        site
    }).toString();

    const response = await fetch(`${API_URL}/wp-json/app/v2/get-event?${query}`, {
        cache: "force-cache",
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        // body: JSON.stringify({
        //     event_id: eventId,
        //     user_id: user?.id,
        //     site
        // }),
    });

    const data = await response.json();
    if (response.status !== 200) {
        throw new Error(data.message);
    }

    return data;
};

export const fetchTrendingEvents = async (page, paginate = false, filters = null) => {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const user = await getSessionUser();

        if (!user) {
            throw new Error('Session user not found');
        }

        const query = new URLSearchParams({
            user_id: user.id,
            page,
            per_page: 10,
            paginate,
            filters: JSON.stringify(filters || {}),
            version: 2
        }).toString();

        const response = await fetch(`${API_URL}/wp-json/app/v2/get-events-trending?${query}`, {
            method: "GET",
            cache: "force-cache",
            headers: {
                "Content-Type": "application/json",
            },
            // body: JSON.stringify({
            //     user_id: user.id,
            //     page,
            //     per_page: 10,
            //     paginate,
            //     filters
            // }),
            signal
        });

        const data = await response.json();

        if (!data) {
            throw new Error('Failed to fetch trending events');
        }

        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const fetchTrendingVenues = async (page, paginate = false, filters = '{}') => {
    try {
        const user = await getSessionUser();

        if (!user) {
            throw new Error('Session user not found');
        }

        const query = new URLSearchParams({
            user_id: user.id,
            page,
            per_page: 10,
            paginate,
            filters: JSON.stringify(filters || {}),
        }).toString();

        const response = await fetch(`${API_URL}/wp-json/app/v2/get-venues-trending?${query}`, {
            method: "GET",
            cache: "force-cache",
            headers: {
                "Content-Type": "application/json",
            },
            // body: JSON.stringify({
            //     user_id: user.id,
            //     page,
            //     per_page: 10,
            //     paginate,
            //     filters
            // }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const fetchEventCats = async () => {
    const user = await getSessionUser();

    if (!user || !user.id) {
        return null;
    }

    const site = user?.last_location?.country || 'GB';

    const response = await fetch(`${API_URL}/wp-json/app/v1/get-event-categories?site=${site}`, {
        method: "GET",
        cache: "force-cache",
    });

    const data = await response.json();
    return data;
};

export const maybeFavoriteEvent = async (eventId) => {
    const user = await getSessionUser();

    if (!user || !user.id) {
        return null;
    }

    const response = await fetch(`${API_URL}/wp-json/app/v1/favourite-event`, {
        cache: "no-cache",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            event_id: eventId,
            user_id: user.id
        }),
    });

    const data = await response.json();
    return data;
};

export const maybeFollowVenue = async (venueId) => {
    const user = await getSessionUser();

    if (!user || !user.id) {
        return null;
    }
    const site = user?.last_location?.country || 'GB';

    const response = await fetch(`${API_URL}/wp-json/app/v1/follow-venue`, {
        cache: "no-cache",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            venue_id: venueId,
            user_id: user.id,
            site
        }),
    });

    const data = await response.json();
    return data;
};

export const fetchVenue = async (venueId) => {
    const user = await getSessionUser();

    if (!user || !user.id) {
        return null;
    }

    const site = user?.last_location?.country || 'GB';

    const response = await fetch(`${API_URL}/wp-json/app/v2/get-venue?venue_id=${venueId}&user_id=${user?.id}&site=${site}`, {
        cache: "force-cache",
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const data = await response.json();
    if (response.status !== 200) {
        throw new Error(data.message);
    }

    return data;
};

export const fetchTrendingUsers = async (page, is_vehicle = false) => {
    try {
        const user = await getSessionUser();

        if (!user) {
            throw new Error('Session user not found');
        }

        const response = await fetch(`${API_URL}/wp-json/app/v1/popular-users-cars`, {
            method: "POST",
            cache: "force-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
                page,
                per_page: 20,
                is_vehicle
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};