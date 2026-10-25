// Settings that change per deployment rather than per game version.
export const CONFIG = {
  // Where the game lives. Dare links point here, even when shared from the amplifyapp.com address.
  homeUrl: "https://chickens.thefunshed.com/",
  // The Shed service, shared by every Fun Shed app (the shed repo). null keeps the board on the phone.
  // Switch on once "chickens" is added to shed/api/apps.mjs: "https://api.thefunshed.com/v1/chickens"
  scoresUrl: null,
};
