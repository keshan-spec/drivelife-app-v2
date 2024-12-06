import {
    updatePost
} from "./api/posts.js";
import app, {
    showToast
} from "./app.js";
import store from "./store.js";

import $ from 'dom7';;

$(document).on('page:beforein', '.page[data-name="post-edit"]', async function (e) {
    var posts = store.getters.myPosts.value;
    var postId = e.detail.route.params.id;

    if (!postId || postId == -1) {
        return;
    }

    const post = posts.data.find(p => p.id == postId);

    $('#edit_post_id').val(postId);
    $('#post_content').val(post?.caption || '');

});

$('#app').on('click', '#update-post', async function (e) {
    var view = app.views.current;

    const description = $('#post_content').val();
    const postId = $('#edit_post_id').val();

    const data = {
        post_id: postId,
        caption: description
    };

    try {
        app.preloader.show();

        const response = await updatePost(data);

        app.preloader.hide();

        if (!response || response.error) {
            throw new Error(response.error);
        }

        showToast('Post updated successfully');

        // fine elem with data-post-id="52" and update the .media-post-description .post-caption text
        var postElem = $(`[data-post-id="${postId}"]`).find('.media-post-description');

        const maxDescriptionLength = 200; // Set your character limit here
        const isLongDescription = description.length > maxDescriptionLength;
        const shortDescription = isLongDescription ? description.slice(0, maxDescriptionLength) : description;

        // for each postElem, loop through and update the .post-caption and .full-description hidden input
        postElem.each(function () {
            var postCaption = $(this).find('.post-caption');
            var fullDescription = $(this).find('.full-description');

            postCaption.text(shortDescription);
            fullDescription.val(description);
        });

        store.dispatch('updatePost', {
            post_id: postId,
            caption: description
        });

        view.router.back();
    } catch (error) {
        app.notification.create({
            titleRightText: 'now',
            subtitle: 'Oops, something went wrong',
            text: error.message || 'Failed to update post',
        }).open();
        app.preloader.hide();
    }
});