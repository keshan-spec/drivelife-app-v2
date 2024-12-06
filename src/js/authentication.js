import { showToast } from "./app.js";
import $ from 'dom7';
import store from './store.js';
import app from './app.js';

// Helpers
import {
    handleSignUp,
    updateAboutUserIds,
    updateContentIds,
    updateUsername,
    verifyUser
} from './api/auth.js';

// Handle login form submission;
$(document).on('submit', '.login-screen-content form', async function (e) {
    e.preventDefault();

    var username = $(this).find('input[name="username"]').val();
    var password = $(this).find('input[name="password"]').val();

    if (!username) {
        showToast('Username is required');
        return;
    }

    if (!password) {
        showToast('Password is required');
        return;
    }


    try {
        app.preloader.show();
        const response = await verifyUser({
            email: username,
            password
        });

        app.preloader.hide();

        if (!response || response.error) {
            app.dialog.alert(response.error || 'Login failed, please try again');
            return;
        }

        if (response.success) {
            showToast('Login successful');
            await store.dispatch('login', {
                token: response.token
            });

            // app.views.main.router.navigate('/');
            // $('.start-link').click();
            // reload page
            window.location.reload();
            return;
        }
    } catch (error) {
        app.dialog.alert('Login failed, please try again');
    }
});

// Register forms
// Step 1
$(document).on('submit', 'form#sign-up-step1', async function (e) {
    e.preventDefault();

    // store.dispatch('setRegisterData', {
    //     email: "test@test.test",
    //     password: ")eE7R6H2Vp$wpFS$uR@LNyzq",
    //     username: "kteshtestte",
    //     user_id: 65279
    // });
    // app.views.main.router.navigate('/signup-step2/');
    // return;

    var firstName = $(this).find('input[name="first_name"]').val().trim();
    var lastName = $(this).find('input[name="last_name"]').val().trim();
    var email = $(this).find('input[name="email"]').val().trim();
    var password = $(this).find('input[name="password"]').val().trim();
    var confirmPassword = $(this).find('input[name="confirm_password"]').val().trim();
    var agreeTerms = $(this).find('input[name="agree_terms"]').is(':checked');
    var agreePrivacy = $(this).find('input[name="agree_privacy"]').is(':checked');

    if (!firstName) {
        showToast('First name is required');
        return;
    }

    if (!lastName) {
        showToast('Last name is required');
        return;
    }

    if (!email) {
        showToast('Email is required');
        return;
    }

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showToast('Please enter a valid email address');
        return;
    }

    if (!password) {
        showToast('Password is required');
        return;
    }

    // Check if password has at least 8 characters
    if (password.length < 8) {
        showToast('Password must be at least 8 characters long.');
        return;
    }

    // Check if password contains at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        showToast('Password must contain at least one lowercase letter.');
        return;
    }

    // Check if password contains at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        showToast('Password must contain at least one uppercase letter.');
        return;
    }

    // Check if password contains at least one number
    if (!/\d/.test(password)) {
        showToast('Password must contain at least one number.');
        return;
    }

    if (password.length < 8) {
        showToast('Password must be at least 8 characters long');
        return;
    }

    if (!confirmPassword) {
        showToast('Please confirm your password');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match');
        return;
    }

    if (!agreeTerms) {
        showToast('You must agree to the Terms & Conditions');
        return;
    }

    if (!agreePrivacy) {
        showToast('You must agree to the Privacy Policy');
        return;
    }

    // add a loader to the login button
    var loginButton = $(this).find('button[type="submit"]')[0];
    loginButton.innerHTML = '<div class="preloader color-white"></div>';

    try {
        app.preloader.show();

        const response = await handleSignUp({
            full_name: `${firstName} ${lastName}`,
            email,
            password
        });

        app.preloader.hide();

        if (!response || !response.success) {
            app.dialog.alert(response.message || 'An error occurred, please try again');
            loginButton.innerHTML = 'Next';
            return;
        }

        store.dispatch('setRegisterData', {
            email,
            password,
            user_id: response.user_id,
            username: response.username
        });
        app.views.main.router.navigate('/signup-step2/');
    } catch (error) {
        console.log(error);
        app.dialog.alert(error.message || 'An error occurred, please try again');
        loginButton.innerHTML = 'Next';
        return;
    }
});

// Step 2
$(document).on('submit', 'form#sign-up-step2', async function (e) {
    e.preventDefault();

    var username = $(this).find('input[name="username"]').val().trim();

    if (!username) {
        showToast('Username is required');
        return;
    }

    // username can only have letters, numbers, and underscores
    var usernamePattern = /^[a-zA-Z0-9_]+$/;
    if (!usernamePattern.test(username)) {
        showToast('Username can only contain letters, numbers, and underscores');
        return;
    }

    // username must be at least 3 characters long
    if (username.length < 3) {
        showToast('Username must be at least 3 characters long');
        return;
    }

    let registerData = store.getters.getRegisterData.value;
    try {
        if (registerData.username !== username) {
            app.preloader.show();

            const response = await updateUsername(username, registerData.user_id);

            app.preloader.hide();

            if (!response || !response.success) {
                app.notification.create({
                    titleRightText: 'now',
                    subtitle: 'Oops, something went wrong',
                    text: error.message || 'Failed to update username',
                }).open();
                // app.dialog.alert(response.message || 'An error occurred, please try again')
                return;
            }

            store.dispatch('setRegisterData', {
                ...registerData,
                username
            });
        }

        app.views.main.router.navigate('/signup-step3/');
    } catch (error) {
        console.log(error);
        app.notification.create({
            titleRightText: 'now',
            subtitle: 'Oops, something went wrong',
            text: error.message || 'Failed to update username',
        }).open();
        return;
    }
});

// Step 3
$(document).on('submit', '#car-selection-form', async function (e) {
    e.preventDefault();

    // Get all checked checkboxes' values
    var selectedCarTypes = [];
    $(this).find('input[name="car_type"]:checked').each(function () {
        selectedCarTypes.push($(this).val());
    });

    // Check if at least one checkbox is selected
    if (selectedCarTypes.length === 0) {
        showToast('Please select at least one car type');
        return;
    }

    // For demonstration, log the selected values to the console
    let registerData = store.getters.getRegisterData.value;

    try {
        app.preloader.show();
        const response = await updateContentIds(selectedCarTypes, registerData.user_id);

        if (!response || !response.success) {
            app.dialog.alert(response.message || 'Oops, Unable to save your selection.');
        }

        app.preloader.hide();
        app.views.main.router.navigate('/signup-step4/');
    } catch (error) {
        console.log(error);
        app.dialog.alert('An error occurred, please try again');
        return;
    }

    // Redirect to the next step (this can be customized as needed)
    app.views.main.router.navigate('/signup-step4/');
});

// Step 4
$(document).on('submit', '#interest-selection-form', async function (e) {
    e.preventDefault();

    // Get all checked checkboxes' values
    var selectedInterests = [];
    $(this).find('input[name="interest"]:checked').each(function () {
        selectedInterests.push($(this).val());
    });

    // Check if at least one checkbox is selected
    if (selectedInterests.length === 0) {
        showToast('Please select at least one interest');
        return;
    }

    let registerData = store.getters.getRegisterData.value;

    try {
        app.preloader.show();
        const response = await updateAboutUserIds(selectedInterests, registerData.user_id);

        if (!response || !response.success) {
            app.dialog.alert(response.message || 'Oops, Unable to save your selection.');
        }

        app.preloader.hide();

        app.views.main.router.navigate('/signup-step5/');
    } catch (error) {
        console.log(error);
        app.dialog.alert('An error occurred, please try again');
        return;
    }
});

$(document).on('page:afterin', '.page[data-name="signup-step1"]', function (e) {
    app.popup.create({
        el: '.privacy-popup',
        swipeToClose: 'to-bottom'
    });
});

$(document).on('page:init', '.page[data-name="signup-step4"]', function (e) {
    const checkBoxes = document.querySelector('#user-interests ul');

    // Event listener for checkbox selection
    checkBoxes.addEventListener('change', function (e) {
        const targetCheckbox = e.target;

        // Uncheck all checkboxes except the one that was clicked
        if (targetCheckbox.type === "checkbox") {
            [...checkBoxes.querySelectorAll('input[type="checkbox"]')].forEach(checkbox => {
                if (checkbox !== targetCheckbox) {
                    checkbox.checked = false;
                }
            });
        }
    });
});