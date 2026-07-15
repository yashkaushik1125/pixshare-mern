// Detect the visitor's current city using the browser Geolocation API and
// OpenStreetMap's free Nominatim reverse-geocoding service (no API key needed).
//
// Returns a promise that resolves to { city, region, lat, lon } or rejects
// with an Error carrying a user-friendly message.
export function detectCurrentCity() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) throw new Error("Reverse geocoding request failed.");
          const data = await res.json();
          const addr = data.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.county ||
            addr.state_district ||
            "";
          const region = addr.state || addr.country || "";
          if (!city) {
            reject(new Error("Could not determine your city from location."));
            return;
          }
          resolve({ city, region, lat, lon });
        } catch (err) {
          reject(new Error("Could not look up your city. Please try again."));
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location permission was denied."));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error("Location request timed out. Please try again."));
        } else {
          reject(new Error("Could not get your location."));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}
