export function displayProfile(user, container = 'profile', userId = null) {
    if (!user) {
        console.error('User object not provided');
        return;
    }

    // Select the container element
    let containerElem = document.querySelector(`.page[data-name="${container}"]`);

    if (container == 'profile-view' && userId) {
        containerElem = document.querySelector(`.page-content[data-user-id="${userId}"]`);
    }


    if (!containerElem) {
        console.error(`Container element with data-name="${container}" not found.`);
        return;
    }

    // Profile Head
    const usernameElem = containerElem.querySelector('.profile-usernames .profile-username');
    const nameElem = containerElem.querySelector('.profile-usernames .profile-name');
    if (usernameElem) usernameElem.textContent = `@${user.username}`;
    if (nameElem) nameElem.textContent = `${user.first_name} ${user.last_name}`;


    // followers
    const followerCountElem = containerElem.querySelector('.profile-followers h3');
    if (followerCountElem) followerCountElem.textContent = user.followers.length || 0;

    const postCountElem = containerElem.querySelector('.profile-posts h3');
    if (postCountElem) postCountElem.textContent = user.posts_count || 0;

    // Profile Image
    const profileImageElem = containerElem.querySelector('.profile-head .profile-image');
    if (profileImageElem) {
        profileImageElem.style.backgroundImage = `url('${user.profile_image || 'img/profile-placeholder.jpg'}')`;
    }

    // Cover Image
    if (user.cover_image) {
        const profileBackgroundElem = containerElem.querySelector('.profile-background');
        if (profileBackgroundElem) {
            profileBackgroundElem.style.backgroundImage = `url('${user.cover_image}')`;
        }
    }

    // Profile Links
    const profileLinks = user.profile_links || {};

    const setLinkHref = (selector, url) => {
        const linkElem = containerElem.querySelector(selector);
        if (linkElem) {
            linkElem.setAttribute('href', url);
            linkElem.onclick = (e) => {
                e.preventDefault();
                window.open(url, '_blank');
            };

            // Enable the link
            linkElem.style.opacity = 1;
        }
    };

    if (profileLinks.instagram) {
        setLinkHref('#instagram', `https://www.instagram.com/${profileLinks.instagram}`);
    } else {
        // set opacity to 0.5
        const instagramElem = containerElem.querySelector('#instagram');
        if (instagramElem) {
            instagramElem.style.opacity = 0.2;
            // disable the link
            instagramElem.onclick = (e) => e.preventDefault();
        }
    }

    if (profileLinks.facebook) {
        setLinkHref('#facebook', `https://www.facebook.com/${profileLinks.facebook}`);
    } else {
        // set opacity to 0.5
        const facebookElem = containerElem.querySelector('#facebook');
        if (facebookElem) {
            facebookElem.style.opacity = 0.2;
            // disable the link
            facebookElem.onclick = (e) => e.preventDefault();
        }
    }

    if (profileLinks.tiktok) {
        setLinkHref('#tiktok', `https://www.tiktok.com/@${profileLinks.tiktok}`);
    } else {
        // set opacity to 0.5
        const tiktokElem = containerElem.querySelector('#tiktok');
        if (tiktokElem) {
            tiktokElem.style.opacity = 0.2;
            // disable the link
            tiktokElem.onclick = (e) => e.preventDefault();
        }
    }

    if (profileLinks.youtube) {
        setLinkHref('#youtube', `https://www.youtube.com/@${profileLinks.youtube}`);
    } else {
        // set opacity to 0.5
        const youtubeElem = containerElem.querySelector('#youtube');
        if (youtubeElem) {
            youtubeElem.style.opacity = 0.2;
            // disable the link
            youtubeElem.onclick = (e) => e.preventDefault();
        }
    }

    // Create a new array by copying the existing links
    let externalLinks = [...(profileLinks.external_links || [])]; // Shallow copy

    // Append custodian to the external links if it doesn't already exist
    if (profileLinks.custodian) {
        const custodianLink = externalLinks.find(link => link.id === 'custodian');

        if (!custodianLink) {
            externalLinks = [
                ...externalLinks,
                {
                    link: {
                        label: 'Custodian Garage / Car Link',
                        url: profileLinks.custodian
                    },
                    id: 'custodian'
                }
            ];
        }
    }

    // Append mivia to the external links if it doesn't already exist
    if (profileLinks.mivia) {
        const miviaLink = externalLinks.find(link => link.id === 'mivia');

        if (!miviaLink) {
            externalLinks = [
                ...externalLinks,
                {
                    link: {
                        label: 'Mivia',
                        url: profileLinks.mivia
                    },
                    id: 'mivia'
                }
            ];
        }
    }

    const linksList = containerElem.querySelector('.profile-external-links ul');
    if (linksList) {
        linksList.innerHTML = ''; // Clear any existing links

        if (externalLinks.length > 0) {
            externalLinks.forEach(linkObj => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = linkObj.link.url;

                link.target = '_blank';
                link.textContent = linkObj.link.label;

                link.onclick = (e) => {
                    e.preventDefault();
                    const url = new URL(linkObj.link.url);
                    window.open(url, '_blank');
                };

                listItem.appendChild(link);
                linksList.appendChild(listItem);
            });
        } else {
            // Optionally handle the case where there are no external links
            const noLinksItem = document.createElement('li');
            noLinksItem.textContent = 'No external links available';
            linksList.appendChild(noLinksItem);
        }
    }
}

export function displayGarage(garage, userId = null) {
    if (!garage) return;

    let garageContainer = document.getElementById('profile-garage'); // Make sure you have a container with this ID

    if (userId) {
        garageContainer = document.querySelector(`.page-content[data-user-id="${userId}"] #profile-garage`);
    }

    garageContainer.innerHTML = createGarageContent(garage);
}

export function createGarageContent(garages, currentList, pastList) {
    // Elements for current and past vehicles
    const currentVehiclesList = document.querySelector(currentList);
    const pastVehiclesList = document.querySelector(pastList);

    if (!currentVehiclesList || !pastVehiclesList) {
        console.log('Invalid elements provided for current and past vehicles');
        return;
    }

    currentVehiclesList.innerHTML = ''; // Clear the list before adding new vehicles
    pastVehiclesList.innerHTML = ''; // Clear the list before adding new vehicles

    if (garages.error) {
        currentVehiclesList.innerHTML = '<li>No current vehicles</li>';
        pastVehiclesList.innerHTML = '<li>No past vehicles</li>';
        return;
    }

    // Function to generate vehicle HTML
    function generateVehicleHTML(vehicle) {
        return `
    <li>
        <a href="/profile-garage-vehicle-view/${vehicle.id}" class="item">
            <div class="imageWrapper">
                <div class="image-square image-rounded"
                    style="background-image:url('${vehicle.cover_photo || 'img/placeholder1.jpg'}');">
                    </div>
            </div>
            <div class="in">
                <div>
                    ${vehicle.make} ${vehicle.model}
                </div>
            </div>
        </a>
    </li>
    `;
    }

    // Sort vehicles into current and past vehicles
    garages.forEach(vehicle => {
        if (vehicle.owned_until === "" || vehicle.owned_until.toLowerCase() === "present") {
            currentVehiclesList.innerHTML += generateVehicleHTML(vehicle);
        } else {
            pastVehiclesList.innerHTML += generateVehicleHTML(vehicle);
        }
    });

    if (currentVehiclesList.innerHTML === '') {
        currentVehiclesList.innerHTML = '<li>No current vehicles</li>';
    }

    if (pastVehiclesList.innerHTML === '') {
        pastVehiclesList.innerHTML = '<li>No past vehicles</li>';
    }
}

function generatePostGridItem(post) {
    if (!post.media || post.media.length === 0) return '';

    const media = post.media[0]; // Get the first media item
    const isVideo = media.media_type === "video" || media.media_url.includes('.mp4');

    if (isVideo) {
        return `
      <a href="/post-view/${post.id}" class="grid-item" data-src="${media.media_url}/thumbnails/thumbnail.jpg">
        <img 
          src="${media.media_url}/thumbnails/thumbnail.jpg"
          loading="lazy"
          role="presentation"
          sizes="(max-width: 320px) 280px, 320px"
          decoding="async"
          fetchPriority="high"
          style="object-fit: cover; "
        />
      </a>`;
    } else {
        return `
      <a href="/post-view/${post.id}" class="grid-item image-square" data-src="${media.media_url}">
        <img 
          src="${media.media_url}"
          loading="lazy"
          role="presentation"
          sizes="(max-width: 320px) 280px, 320px"
          decoding="async"
          fetchPriority="high"
          style="object-fit: cover; "
        />
      </a>`;
    }
}

// Calculate the number of posts and decide if we need to add empty items
export function fillGridWithPosts(posts, profileGridID, reset = false) {
    // Select the container where the posts will be displayed
    const profileGrid = document.querySelector(profileGridID);

    if (reset) {
        profileGrid.innerHTML = ''; // Clear the grid before adding new posts
    }

    posts.forEach(post => {
        profileGrid.innerHTML += generatePostGridItem(post);
    });
}

export function displayFollowers(followersList, userFollowingList, container = 'profile', userId = null) {
    // const containerElem = document.querySelector(`.page[data-name="${container}"]`);
    // if (!containerElem) {
    //     console.error(`Container element with data-name="${container}" not found.`);
    //     return;
    // }

    let containerElem = document.querySelector(`.page[data-name="${container}"]`);

    if (container == 'profile-view' && userId) {
        containerElem = document.querySelector(`.page-content[data-user-id="${userId}"]`);
    }


    const followersContainer = containerElem.querySelector('.profile-followers-list');
    if (!followersContainer) {
        console.error('Followers list container not found');
        return;
    }

    if (followersList.length === 0) {
        followersContainer.innerHTML = `
      <div class="notification-item">
        <div class="notification-left">
          <div class="notification-text">No followers</div>
        </div>
      </div>
    `;
        return;
    }

    followersContainer.innerHTML = ''; // Clear the list before adding new followers

    followersList.forEach(follower => {
        const followerItem = document.createElement('div');
        followerItem.classList.add('notification-item');

        followerItem.innerHTML = `
      <div class="notification-left ${container == 'profile' ? 'follower-item' : ''}" data-url="/profile-view/${follower.ID}">
        <div class="image-square image-rounded"
          style="background-image:url('${follower.profile_image || 'img/profile-placeholder.jpg'}')"></div>
        <div class="notification-info">
          <div class="notification-text follower-name"><strong>${follower.user_login}</strong></div>
        </div>
      </div>
    `;

        if (container === 'profile') {
            // const isFollowing = userFollowingList.includes(follower.ID)

            // if (isFollowing) {
            followerItem.innerHTML += `
        <div class="btn btn-primary btn-sm remove-follower" data-follower-id="${follower.ID}">Remove</div>
      `;
            // }
            // else {
            //   followerItem.innerHTML += `
            //   <div class="btn btn-primary btn-sm follow-user" data-follower-id="${follower.ID}">Follow</div>
            // `
            // }
        }

        followersContainer.appendChild(followerItem);
    });
}