# BusinessDirectory

A web-based business directory that allows users to search, filter, and manage listings for local businesses.

## Google Maps integration

The add-business form supports Google Places Autocomplete to make it easier to capture business names and addresses. To enable it you’ll need a [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/get-api-key) key.

1. Create or locate your Maps API key in the Google Cloud console and ensure the **Places API** is enabled.
2. Update the `window.googleMapsConfig` object in [`index.html`](index.html) with your key:

   ```html
   <script>
     window.googleMapsConfig = {
       apiKey: "YOUR_REAL_API_KEY",
     };
   </script>
   ```

If no key (or the placeholder value) is provided, the directory will continue to work — you’ll just miss out on the autocomplete assistance.

## License

You’re free to use, modify, and distribute this code — as long as any changes or derivatives you share or host publicly are also released under the same open-source license.

If you deploy this project as a web service, you must make your modified source code available to your users.

👉 In short: You can use it freely, but you must keep it open.

This project is licensed under the terms of the [GNU Affero General Public License v3.0](LICENSE).




![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)
![GitHub last commit](https://img.shields.io/github/last-commit/consequentlyvaluable/BusinessDirectory)
