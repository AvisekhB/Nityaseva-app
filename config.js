/****************************************************
 * NITYASEVA CONFIG
 ****************************************************/

window.NITYASEVA_CONFIG = {

  APP_NAME: "Nityaseva",

  /*
   * PUT YOUR CURRENT DEPLOYED GOOGLE APPS SCRIPT
   * WEB APP URL HERE.
   *
   * It MUST end with /exec
   */
  OTP_API:
    "https://script.google.com/macros/s/AKfycbxmh77rwLxoY1dM270UdKi5KbaWHB1jpoGtUhkNvS8SgEvlrvkoK14Wcff9kC0dFlWuA/exec",

  OTP_EXPIRY_SECONDS: 600,

  /*
   * Secure report route.
   */
  REPORT_BASE_URL:
    window.location.origin +
    "/Nityaseva-app/r/",

  DEBUG: true

};
