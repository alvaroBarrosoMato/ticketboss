// Braze Web SDK service worker — required for web push notifications.
//
// The SDK is pointed at this file by `serviceWorkerLocation: './service-worker.js'`
// in braze.initialize(). Keep the version here in step with the braze.min.js
// version loaded in index.html.
//
// Web push additionally needs the site served over HTTPS (GitHub Pages is) and
// VAPID keys configured in the Braze dashboard under Settings → App Settings.

importScripts('https://js.appboycdn.com/web-sdk/6.13/service-worker.js');
