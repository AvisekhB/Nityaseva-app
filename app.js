/****************************************************
 * NITYASEVA OTP CLIENT
 * GitHub Pages → Google Apps Script
 ****************************************************/

const NITYASEVA_OTP_URL =
  "https://script.google.com/macros/s/AKfycbxmh77rLwXoY1dh27QUdKi5kbaWHB1jpoGtH.../exec";


/**
 * JSONP REQUEST
 *
 * IMPORTANT:
 * Do not use fetch().
 * Google Apps Script does not provide the required
 * CORS headers for normal browser fetch requests.
 */
function jsonpRequest(action, params = {}, timeoutMs = 15000) {

  return new Promise((resolve, reject) => {

    const callbackName =
      "nityasevaCallback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 1000000);

    let finished = false;

    const script =
      document.createElement("script");

    const query =
      new URLSearchParams();

    query.set("action", action);
    query.set("callback", callbackName);

    Object.keys(params).forEach(key => {

      const value = params[key];

      if (
        value !== undefined &&
        value !== null
      ) {
        query.set(
          key,
          String(value)
        );
      }
    });


    const cleanup = () => {

      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      clearTimeout(timeout);
    };


    const timeout =
      setTimeout(() => {

        if (finished) return;

        finished = true;

        cleanup();

        reject(
          new Error(
            "Unable to connect to Nityaseva OTP service."
          )
        );

      }, timeoutMs);


    /*
     * IMPORTANT
     *
     * The callback MUST be attached to window.
     * This is required because Google Apps Script
     * executes the returned JavaScript globally.
     */
    window[callbackName] = function(result) {

      if (finished) return;

      finished = true;

      cleanup();

      resolve(result);
    };


    script.onerror = function() {

      if (finished) return;

      finished = true;

      cleanup();

      reject(
        new Error(
          "Unable to load Nityaseva OTP service."
        )
      );
    };


    /*
     * Do NOT resolve on script.onload.
     *
     * The Google Apps Script callback is what
     * confirms that the response was received.
     */
    script.onload = function() {

      console.log(
        "Nityaseva OTP script loaded."
      );

    };


    script.async = true;

    script.src =
      NITYASEVA_OTP_URL +
      "?" +
      query.toString();


    console.log(
      "Nityaseva OTP request:",
      script.src
    );


    document.head.appendChild(script);

  });
}


/****************************************************
 * CHECK OTP SERVICE
 ****************************************************/

async function checkOtpService() {

  try {

    const result =
      await jsonpRequest(
        "status"
      );


    console.log(
      "Nityaseva OTP service status:",
      result
    );


    if (
      !result ||
      result.success !== true
    ) {

      console.warn(
        "OTP service returned unexpected response:",
        result
      );

      return false;
    }


    return true;

  } catch (error) {

    console.warn(
      "OTP service status check failed:",
      error
    );

    return false;
  }
}


/****************************************************
 * SEND OTP
 ****************************************************/

async function sendOtp(email) {

  const cleanEmail =
    String(email || "")
      .trim()
      .toLowerCase();


  if (!cleanEmail) {

    throw new Error(
      "Email address is required."
    );
  }


  try {

    console.log(
      "Sending OTP to:",
      cleanEmail
    );


    const result =
      await jsonpRequest(
        "sendOtp",
        {
          email: cleanEmail
        }
      );


    console.log(
      "OTP service response:",
      result
    );


    if (
      !result ||
      result.success !== true
    ) {

      throw new Error(
        result?.error ||
        "OTP service returned an error."
      );
    }


    return result;

  } catch (error) {

    console.error(
      "OTP send error:",
      error
    );

    throw new Error(
      error.message ||
      "Unable to connect to Nityaseva OTP service."
    );
  }
}


/****************************************************
 * VERIFY OTP
 ****************************************************/

async function verifyOtp(email, otp) {

  const cleanEmail =
    String(email || "")
      .trim()
      .toLowerCase();


  const cleanOtp =
    String(otp || "")
      .trim();


  if (!cleanEmail) {

    throw new Error(
      "Email address is required."
    );
  }


  if (!cleanOtp) {

    throw new Error(
      "OTP is required."
    );
  }


  try {

    console.log(
      "Verifying OTP..."
    );


    const result =
      await jsonpRequest(
        "verifyOtp",
        {
          email: cleanEmail,
          otp: cleanOtp
        }
      );


    console.log(
      "OTP verification response:",
      result
    );


    if (
      !result ||
      result.success !== true
    ) {

      throw new Error(
        result?.error ||
        "Invalid OTP."
      );
    }


    return result;

  } catch (error) {

    console.error(
      "OTP verification error:",
      error
    );

    throw new Error(
      error.message ||
      "OTP verification failed."
    );
  }
}


/****************************************************
 * OPTIONAL AUTOMATIC SERVICE CHECK
 ****************************************************/

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(() => {

      checkOtpService();

    }, 1000);

  }
);
