import {
    getSessionUser,
} from "./api/auth.js";
import {
    addUserProfileLinks,
    removeProfileLink,
    updateSocialLinks
} from "./api/profile.js";

import app, {
    showToast
} from "./app.js";

import store from "./store.js";

import $ from 'dom7';

// --------------- Edit Socials Page ---------------
$(document).on('page:init', '.page[data-name="profile-edit-socials"]', async function (e) {
    var view = app.views.current;

    const user = await getSessionUser();

    if (!user) {
        view.router.navigate('/login');
        return;
    }

    const externalLinks = user.profile_links || {};

    app.popup.create({
        el: '.add-link-popup',
        swipeToClose: 'to-bottom'
    });

    // Populate form fields
    document.querySelector('input[name="social_instagram"]').value = externalLinks.instagram || '';
    document.querySelector('input[name="social_facebook"]').value = externalLinks.facebook || '';
    document.querySelector('input[name="social_tiktok"]').value = externalLinks.tiktok || '';
    document.querySelector('input[name="social_youtube"]').value = externalLinks.youtube || '';
    document.querySelector('input[name="social_mivia"]').value = externalLinks.mivia || '';
    document.querySelector('input[name="social_custodian"]').value = externalLinks.custodian || '';

    // .social-other-links ul
    const externalLinksContainer = $('.social-other-links ul')[0];

    externalLinks.external_links?.forEach(linkObj => {
        const listItem = document.createElement('li');


        listItem.innerHTML = `
        <a class="item-link item-content" href="${linkObj.link.url}" data-link-id="${linkObj.id}">
            <div class="item-inner">
                <div class="item-title">
                    ${linkObj.link.label}
                </div>
                <div class="item-after delete-external-link"><i class="icon f7-icons">xmark_circle</i></div>
            </div>
        </a>
        `;
        externalLinksContainer.appendChild(listItem);
    });
});

$(document).on('page:beforein', '.page[data-name="profile-edit-socials"]', async function (e) {
    // Add event listener for the Save button
    $(document).on('click', '#add-link-btn', async function () {
        const linkTitle = $('input[name="custom_link_title"]').val();
        const linkUrl = $('input[name="custom_link_url"]').val();

        // Validate the inputs
        if (linkTitle === '') {
            console.log('Please enter a link title.', $('input[name="custom_link_title"]'));
            showToast('Please enter a link title.', 'Error');
            return;
        }

        if (linkUrl === '') {
            showToast('Please enter a link URL.', 'Error');
            return;
        }

        // Simple URL validation (basic check)
        // const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w \.-]*)*\/?$/;
        // if (!urlPattern.test(linkUrl)) {
        //     showToast('Please enter a valid URL.', 'Error');
        //     return;
        // }


        const urlPattern = /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g;
        if (!urlPattern.test(linkUrl)) {
            showToast('Please enter a valid URL.', 'Error');
            return;
        }

        // Mock API request (POST request)
        const requestData = {
            label: linkTitle,
            url: linkUrl
        };

        app.popup.close();

        app.preloader.show();

        const response = await addUserProfileLinks({
            type: 'external_links',
            link: requestData
        });

        if (response && response.success) {
            showToast('Link added successfully', 'Success');

            // Add the new link to the list
            const listItem = document.createElement('li');
            listItem.innerHTML = `
            <a class="item-link item-content" href="${linkUrl}" data-link-id="${response.id}">
                <div class="item-inner">
                    <div class="item-title">
                        ${linkTitle}
                    </div>
                    <div class="item-after"><i class="icon f7-icons delete-external-link">xmark_circle</i></div>
                </div>
            </a>
        `;

            const externalLinksContainer = $('.social-other-links ul')[0];
            externalLinksContainer.appendChild(listItem);
            store.dispatch('updateUserDetails');
        }

        app.preloader.hide();
    });

    // Save social links
    $(document).on('click', '#save-profile-socials', async function () {
        var view = app.views.current;

        const user = await getSessionUser();

        let instagram = $('input[name="social_instagram"]').val();
        let facebook = $('input[name="social_facebook"]').val();
        let tiktok = $('input[name="social_tiktok"]').val();
        let youtube = $('input[name="social_youtube"]').val();
        let mivia = $('input[name="social_mivia"]').val();
        let custodian = $('input[name="social_custodian"]').val();

        const links = {
            instagram,
            facebook,
            tiktok,
            youtube,
            mivia,
            custodian
        };

        // Define the allowed username pattern (alphanumeric, _, -, .)
        const usernamePattern = /^[a-zA-Z0-9._-]+$/;

        // Define a function to strip '@' from the start of a username
        function cleanUsername(username) {
            return username.startsWith('@') ? username.substring(1) : username;
        }

        // Clean and validate Instagram username
        if (instagram) {
            instagram = cleanUsername(instagram);
            links.instagram = instagram;

            if (!usernamePattern.test(instagram)) {
                showToast('Please enter a valid Instagram username (letters, numbers, underscores, periods, hyphens only)', 'Error');
                return;
            }
        }

        // Clean and validate TikTok username
        if (tiktok) {
            tiktok = cleanUsername(tiktok);
            links.tiktok = tiktok;

            if (!usernamePattern.test(tiktok)) {
                showToast('Please enter a valid TikTok username (letters, numbers, underscores, periods, hyphens only)', 'Error');
                return;
            }
        }

        // Clean and validate YouTube username
        if (youtube) {
            youtube = cleanUsername(youtube);
            links.youtube = youtube;

            if (!usernamePattern.test(youtube)) {
                showToast('Please enter a valid YouTube username (letters, numbers, underscores, periods, hyphens only)', 'Error');
                return;
            }
        }

        // Clean and validate Mivia username
        if (mivia) {
            mivia = cleanUsername(mivia);
            links.mivia = mivia;

            if (!usernamePattern.test(mivia)) {
                showToast('Please enter a valid Mivia username (letters, numbers, underscores, periods, hyphens only)', 'Error');
                return;
            }
        }

        // Allow URL with "https://" for Custodian and validate it
        const urlPattern = /^https:\/\/[\da-z\.-]+\.[a-z]{2,6}\/?$/;
        // Allow any URL that starts with "https://"
        if (custodian && !custodian.startsWith('https://')) {
            showToast('Please enter a valid Custodian URL that starts with https://', 'Error');
            return;
        }

        // Clean and validate Facebook username
        if (facebook) {
            facebook = cleanUsername(facebook);
            links.facebook = facebook;

            if (!usernamePattern.test(facebook)) {
                showToast('Please enter a valid Facebook username (letters, numbers, underscores, periods, hyphens only)', 'Error');
                return;
            }
        }


        // check if the request data is the same as userdata
        let dirtied = false;

        for (const key in links) {
            if (links[key] !== user.profile_links[key]) {
                dirtied = true;
                break;
            }
        }

        if (!dirtied) {
            return;
        }

        app.preloader.show();

        const response = await updateSocialLinks(links);

        app.preloader.hide();

        if (response && response.success) {
            showToast('Social links updated successfully', 'Success');
            view.router.navigate('/profile/');
            store.dispatch('updateUserDetails');
        } else {
            showToast('Failed to update social links', 'Error');
        }
    });

    // Delete link
    $(document).on('click', '.delete-external-link', async function (e) {
        const linkId = e.target.closest('.item-link').dataset.linkId;

        // confirm dialog
        app.dialog.confirm('Are you sure you want to delete this link?', 'Delete Link', async function () {
            app.preloader.show();

            const response = await removeProfileLink(linkId);

            app.preloader.hide();

            if (response) {
                showToast('Link deleted successfully', 'Success');
                // remove the link from the list
                e.target.closest('.item-link').remove();
                store.dispatch('updateUserDetails');

            } else {
                showToast('Failed to delete link', 'Error');
            }
        });
    });
});

$(document).on('page:beforeout', '.page[data-name="profile-edit-socials"]', async function (e) {
    // Remove event listener for the Save button
    $(document).off('click', '#save-profile-socials');
    $(document).off('click', '#add-link-btn');
    $(document).off('click', '.delete-external-link');
});
// --------------- End Edit Socials Page ---------------

