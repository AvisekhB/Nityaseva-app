/****************************************************
 * NITYASEVA FAMILY SECURE ACCESS
 * app.js
 *
 * GitHub Pages
 *     ↓
 * JSONP
 *     ↓
 * Google Apps Script Web App
 *     ↓
 * Google Sheet + Email OTP
 ****************************************************/


"use strict";


/* ==================================================
   CONFIGURATION
   ================================================== */

const OTP_ENDPOINT =
  (
    window.NITYASEVA_CONFIG &&
    window.NITYASEVA_CONFIG.OTP_API
  )
    ? window.NITYASEVA_CONFIG.OTP_API
    : "";


/* ==================================================
   DOM ELEMENTS
   ================================================== */

const emailInput =
  document.getElementById("email");

const otpInput =
  document.getElementById("otp");

const sendOtpBtn =
  document.getElementById("sendOtpBtn");

const verifyOtpBtn =
  document.getElementById("verifyOtpBtn");

const otpSection =
  document.getElementById("otpSection");

const messageBox =
  document.getElementById("message");

const timerBox =
  document.getElementById("timer");


/* ==================================================
   STATE
   ================================================== */

let otpTimer = null;

let otpSecondsRemaining = 0;

if (!OTP_ENDPOINT) {
  console.error("Nityaseva OTP endpoint is missing.");
  showMessage("OTP service is not configured.", "error");
}

/* ==================================================
   INITIAL UI
   ================================================== */

if (messageBox) {
  messageBox.textContent = "";
  messageBox.className = "message";
}


if (otpSection) {
  otpSection.style.display = "none";
}


console.log(
  "Nityaseva OTP frontend loaded."
);


/* ==================================================
   CONFIGURATION CHECK
   ================================================== */

if (!OTP_ENDPOINT) {

  console.error(
    "Nityaseva OTP endpoint is missing."
  );

}


/* ==================================================
   SHOW MESSAGE
   ================================================== */

function showMessage(
  text,
  type = "error"
) {

  if (!messageBox) return;

  messageBox.textContent = text;

  messageBox.className =
    "message " + type;
}


/* ==================================================
   CLEAR MESSAGE
   ================================================== */

function clearMessage() {

  if (!messageBox) return;

  messageBox.textContent = "";

  messageBox.className =
    "message";
}


/* ==================================================
   EMAIL VALIDATION
   ================================================== */

function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


/* ==================================================
   JSONP REQUEST
   ==================================================

   Google Apps Script Web Apps do not need CORS
   when called through JSONP.

   Example generated request:

   https://script.google.com/macros/s/DEPLOYMENT_ID/exec
      ?action=sendOtp
      &email=test@gmail.com
      &callback=nityasevaCallback123

   ================================================== */

function jsonpRequest(
  action,
  params = {},
  timeoutMs = 20000
) {

  return new Promise(
    (resolve, reject) => {

      if (!OTP_ENDPOINT) {

        reject(
          new Error(
            "OTP service is not configured."
          )
        );

        return;
      }


      const callbackName =
        "nityasevaOTP_" +
        Date.now() +
        "_" +
        Math.floor(
          Math.random() * 1000000
        );


      const script =
        document.createElement("script");


      let finished = false;


      let timeoutId = null;


      function cleanup() {

        if (timeoutId) {

          clearTimeout(timeoutId);

          timeoutId = null;
        }


        try {

          delete window[callbackName];

        } catch (error) {

          window[callbackName] =
            undefined;
        }


        if (
          script &&
          script.parentNode
        ) {

          script.parentNode.removeChild(
            script
          );
        }
      }


      function finishSuccess(data) {

        if (finished) return;

        finished = true;

        cleanup();

        resolve(data);
      }


      function finishError(error) {

        if (finished) return;

        finished = true;

        cleanup();

        reject(error);
      }


      /*
       * IMPORTANT:
       *
       * Google Apps Script returns JavaScript
       * similar to:
       *
       * nityasevaOTP_123456({
       *   success:true
       * });
       *
       * Therefore callback must exist on window.
       */

      window[callbackName] =
        function(data) {

          console.log(
            "Nityaseva OTP response:",
            data
          );

          finishSuccess(data);
        };


      script.async = true;


      script.onerror =
        function() {

          finishError(
            new Error(
              "Unable to connect to Nityaseva OTP service."
            )
          );
        };


      const query =
        new URLSearchParams();


      query.set(
        "action",
        action
      );


      query.set(
        "callback",
        callbackName
      );


      Object.keys(params)
        .forEach(
          function(key) {

            const value =
              params[key];


            if (
              value !== undefined &&
              value !== null
            ) {

              query.set(
                key,
                String(value)
              );
            }
          }
        );


      const separator =
        OTP_ENDPOINT.includes("?")
          ? "&"
          : "?";


      script.src =
        OTP_ENDPOINT +
        separator +
        query.toString();


      console.log(
        "Nityaseva OTP request:",
        script.src
      );


      /*
       * Do NOT treat script.onload as success.
       *
       * The important response is the JSONP
       * callback above.
       */

      script.onload =
        function() {

          console.log(
            "Nityaseva OTP script loaded."
          );

        };


      document.head.appendChild(
        script
      );


      timeoutId =
        setTimeout(
          function() {

            finishError(
              new Error(
                "Nityaseva OTP service timed out. Please try again."
              )
            );

          },
          timeoutMs
        );

    }
  );
}


/* ==================================================
   SEND OTP
   ================================================== */

async function handleSendOtp() {

  clearMessage();


  if (!OTP_ENDPOINT) {

    showMessage(
      "OTP service is not configured."
    );

    return;
  }


  const email =
    String(
      emailInput?.value || ""
    )
      .trim()
      .toLowerCase();


  if (!email) {

    showMessage(
      "Please enter your registered email address."
    );

    emailInput?.focus();

    return;
  }


  if (!isValidEmail(email)) {

    showMessage(
      "Please enter a valid email address."
    );

    emailInput?.focus();

    return;
  }


  if (sendOtpBtn) {

    sendOtpBtn.disabled = true;

    sendOtpBtn.textContent =
      "Sending OTP...";
  }


  try {

    console.log(
      "Sending OTP to:",
      email
    );


    const result =
      await jsonpRequest(
        "sendOtp",
        {
          email: email
        }
      );


    console.log(
      "Send OTP result:",
      result
    );


    if (
      !result ||
      result.success !== true
    ) {

      throw new Error(
        result?.error ||
        "Unable to send OTP."
      );
    }


    /*
     * Show OTP section
     */

    if (otpSection) {

      otpSection.style.display =
        "block";
    }


    /*
     * Start 10-minute timer
     */

    startOtpTimer(
      Number(
        result.expiresIn || 600
      )
    );


    showMessage(
      "OTP sent successfully. Please check your email.",
      "success"
    );


    if (otpInput) {

      otpInput.value = "";

      otpInput.focus();
    }


  } catch (error) {

    console.error(
      "OTP send error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to connect to Nityaseva OTP service."
    );


  } finally {

    if (sendOtpBtn) {

      sendOtpBtn.disabled =
        false;

      sendOtpBtn.textContent =
        "Send OTP";
    }
  }
}


/* ==================================================
   VERIFY OTP
   ================================================== */

async function handleVerifyOtp() {

  clearMessage();


  const email =
    String(
      emailInput?.value || ""
    )
      .trim()
      .toLowerCase();


  const otp =
    String(
      otpInput?.value || ""
    )
      .trim();


  if (!email) {

    showMessage(
      "Please enter your registered email address."
    );

    emailInput?.focus();

    return;
  }


  if (!isValidEmail(email)) {

    showMessage(
      "Please enter a valid email address."
    );

    return;
  }


  if (!otp) {

    showMessage(
      "Please enter the OTP."
    );

    otpInput?.focus();

    return;
  }


  if (!/^\d{6}$/.test(otp)) {

    showMessage(
      "OTP must contain 6 digits."
    );

    otpInput?.focus();

    return;
  }


  if (verifyOtpBtn) {

    verifyOtpBtn.disabled =
      true;

    verifyOtpBtn.textContent =
      "Verifying...";
  }


  try {

    console.log(
      "Verifying OTP..."
    );


    const result =
      await jsonpRequest(
        "verifyOtp",
        {
          email: email,
          otp: otp
        }
      );


    console.log(
      "Verify OTP result:",
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


    stopOtpTimer();


    showMessage(
      "OTP verified successfully.",
      "success"
    );


    /*
     * Store only the authenticated email
     * for this browser session.
     *
     * This is NOT the final production
     * authentication mechanism.
     */

    try {

      sessionStorage.setItem(
        "nityaseva_authenticated_email",
        email
      );

      sessionStorage.setItem(
        "nityaseva_authenticated_at",
        String(Date.now())
      );

    } catch (storageError) {

      console.warn(
        "Session storage unavailable.",
        storageError
      );
    }


    /*
     * Give the user a short success state.
     *
     * Secure report routing can be connected
     * here later.
     */

    if (verifyOtpBtn) {

      verifyOtpBtn.textContent =
        "Verified ✓";
    }


  } catch (error) {

    console.error(
      "OTP verification error:",
      error
    );


    showMessage(
      error.message ||
      "OTP verification failed."
    );


  } finally {

    if (
      verifyOtpBtn &&
      verifyOtpBtn.textContent !==
      "Verified ✓"
    ) {

      verifyOtpBtn.disabled =
        false;

      verifyOtpBtn.textContent =
        "Verify OTP";
    }
  }
}


/* ==================================================
   OTP TIMER
   ================================================== */

function startOtpTimer(
  seconds
) {

  stopOtpTimer();


  otpSecondsRemaining =
    Number(seconds) || 600;


  updateOtpTimer();


  otpTimer =
    setInterval(
      function() {

        otpSecondsRemaining--;

        updateOtpTimer();


        if (
          otpSecondsRemaining <= 0
        ) {

          stopOtpTimer();


          if (timerBox) {

            timerBox.textContent =
              "OTP expired. Please request a new OTP.";
          }


          if (otpInput) {

            otpInput.value = "";
          }
        }

      },
      1000
    );
}


/* ==================================================
   STOP OTP TIMER
   ================================================== */

function stopOtpTimer() {

  if (otpTimer) {

    clearInterval(
      otpTimer
    );

    otpTimer = null;
  }
}


/* ==================================================
   UPDATE OTP TIMER
   ================================================== */

function updateOtpTimer() {

  if (!timerBox) return;


  const minutes =
    Math.floor(
      otpSecondsRemaining / 60
    );


  const seconds =
    otpSecondsRemaining % 60;


  timerBox.textContent =
    "OTP valid for " +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");
}


/* ==================================================
   BUTTON EVENTS
   ================================================== */

if (sendOtpBtn) {

  sendOtpBtn.addEventListener(
    "click",
    handleSendOtp
  );
}


if (verifyOtpBtn) {

  verifyOtpBtn.addEventListener(
    "click",
    handleVerifyOtp
  );
}


/* ==================================================
   ENTER KEY SUPPORT
   ================================================== */

if (emailInput) {

  emailInput.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        handleSendOtp();
      }
    }
  );
}


if (otpInput) {

  otpInput.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        handleVerifyOtp();
      }
    }
  );
}


/* ==================================================
   OTP INPUT - NUMBERS ONLY
   ================================================== */

if (otpInput) {

  otpInput.addEventListener(
    "input",
    function() {

      otpInput.value =
        otpInput.value
          .replace(
            /\D/g,
            ""
          )
          .slice(
            0,
            6
          );
    }
  );
}


/* ==================================================
   FINAL STARTUP MESSAGE
   ================================================== */

console.log(
  "Nityaseva OTP frontend ready."
);
