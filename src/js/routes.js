import StorePage from '../pages/store.f7';
import HomePage from '../pages/home.f7';
import AppPage from '../app.f7';
import NotificationsPage from '../pages/notifications.f7';
import AuthPage from '../pages/auth.f7';
import SignInPage from '../pages/login.f7';
import SignUpStep1Page from '../pages/signup-step1.f7';
import SignUpStep2Page from '../pages/signup-step2.f7';
import SignUpStep3Page from '../pages/signup-step3.f7';
import SignUpStep4Page from '../pages/signup-step4.f7';
import SignUpStep5Page from '../pages/signup-step5.f7';
import SignUpCompletePage from '../pages/signup-complete.f7';
import ForgotPasswordPage from '../pages/forgot-password.f7';
import DiscoverPage from '../pages/discover.f7';
import DiscoverViewEventPage from '../pages/discover-view-event.f7';
import DiscoverViewVenuePage from '../pages/discover-view-venue.f7';
import ProfilePage from '../pages/profile.f7';
import ProfileViewPage from '../pages/profile-view.f7';
import ProfileGarageVehicleViewPage from '../pages/profile-garage-vehicle-view.f7';
import PostViewPage from '../pages/post-view.f7';
import ProfileEditPage from '../pages/profile-edit.f7';
import AppPermissionsPage from '../pages/app-permissions.f7';
import SearchPage from '../pages/search.f7';
import ProfileGarageEditPage from '../pages/profile-garage-edit.f7';
import ProfileGarageVehicleAddPage from '../pages/profile-garage-vehicle-add.f7';
import ProfileGarageVehicleEditPage from '../pages/profile-garage-vehicle-edit.f7';
import ProfileGarageVehicleModPage from '../pages/profile-garage-vehicle-mod.f7';
import ProfileEditImagesPage from '../pages/profile-edit-images.f7';
import ProfileEditSocialsPage from '../pages/profile-edit-socials.f7';
import ProfileEditMyDetailsPage from '../pages/profile-edit-mydetails.f7';
import ProfileEditUsernamePage from '../pages/profile-edit-username.f7';
import PostEditPage from '../pages/post-edit.f7';
import ProfileEditAccountSettingsPage from '../pages/profile-edit-account-settings.f7';
import NotFoundPage from '../pages/404.f7';

import CreatePostPage from '../pages/create-post.f7';
import CreatePostTagPage from '../pages/create-post-tags.f7';

import CartPage from '../pages/cart.f7';
import CheckoutPage from '../pages/checkout.f7';
import PaymentSuccessPage from '../pages/payment-success.f7';
import ProductViewPage from '../pages/product-view.f7';

var routes = [
  {
    path: '/',
    component: HomePage,
    keepAlive: true,
  },
  {
    path: '/notifications/',
    component: NotificationsPage,
    keepAlive: true,
  },
  {
    path: '/post-add/',
    component: CreatePostPage,
  },
  {
    path: '/post-add-tags/',
    component: CreatePostTagPage,
  },

  /* ------------------------ Auth Routes ------------------------ */
  {
    path: '/auth/',
    component: AuthPage,
    options: {
      animate: false,
    },
  },
  {
    path: '/signup-step1/',
    component: SignUpStep1Page,
  },
  {
    path: '/signup-step2/',
    component: SignUpStep2Page,
  },
  {
    path: '/signup-step3/',
    component: SignUpStep3Page,
  },
  {
    path: '/signup-step4/',
    component: SignUpStep4Page,
  },
  {
    path: '/signup-step5/',
    component: SignUpStep5Page,
  },
  {
    path: '/signup-complete/',
    component: SignUpCompletePage,
  },
  {
    path: '/login/',
    component: SignInPage,
  },
  {
    path: '/forgot-password/',
    component: ForgotPasswordPage,
  },
  /* ------------------------ End Auth Routes ------------------------ */
  {
    path: '/discover/',
    component: DiscoverPage,
    keepAlive: true,
  },
  {
    path: '/discover-view-event/:id',
    component: DiscoverViewEventPage,
  },
  {
    path: '/discover-view-venue/:id',
    component: DiscoverViewVenuePage,
  },
  {
    path: '/store/',
    component: StorePage,
  },
  {
    path: '/product-view/:id',
    component: ProductViewPage,
  },
  {
    path: '/cart/',
    component: CartPage,
  },
  {
    path: '/checkout/',
    component: CheckoutPage,
  },
  {
    path: '/payment-success/',
    component: PaymentSuccessPage,
  },
  {
    path: '/profile/',
    component: ProfilePage,
    keepAlive: true,
  },
  {
    path: '/profile-view/:id',
    component: ProfileViewPage,
  },
  {
    path: '/profile-garage-vehicle-view/:id',
    component: ProfileGarageVehicleViewPage,
  },
  {
    path: '/post-view/:id',
    component: PostViewPage,
  },
  {
    path: '/profile-edit/',
    component: ProfileEditPage,
  },
  {
    path: '/app-permissions/',
    component: AppPermissionsPage,
  },
  {
    path: '/search/',
    component: SearchPage,
  },
  {
    path: '/profile-garage-edit/',
    component: ProfileGarageEditPage,
  },
  {
    path: '/profile-garage-vehicle-add/',
    component: ProfileGarageVehicleAddPage,
  },
  {
    path: '/profile-garage-vehicle-edit/:id',
    component: ProfileGarageVehicleEditPage,
  },
  {
    path: '/profile-garage-vehicle-mod/:id',
    component: ProfileGarageVehicleModPage,
  },
  {
    path: '/profile-edit-images/',
    component: ProfileEditImagesPage,
  },
  {
    path: '/profile-edit-socials/',
    component: ProfileEditSocialsPage,
  },
  {
    path: '/profile-edit-mydetails/',
    component: ProfileEditMyDetailsPage,
  },
  {
    path: '/profile-edit-username/',
    component: ProfileEditUsernamePage,
  },
  {
    path: '/post-edit/:id',
    component: PostEditPage,
  },
  {
    path: '/profile-edit-account-settings/',
    component: ProfileEditAccountSettingsPage,
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;