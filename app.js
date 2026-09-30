/****************************************************
 * NITYASEVA FAMILY SECURE ACCESS
 * GitHub Pages Frontend
 *
 * Uses JSONP to communicate with
 * Google Apps Script without CORS problems.
 ****************************************************/


const API =
  window.NITYASEVA_CONFIG &&
  window.NITYASEVA_CONFIG.OTP_API
    ? window.NITYASEVA_CONFIG.OTP_API
    : "";


let currentEmail = "";

let countdownInterval = null;


/****************************************************
 * ELEMENTS
 ****************************************************/

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

const message =
  document.getElementById("message");

const timer =
  document.getElementById("timer");


/****************************************************
 * INITIAL STATE
 ****************************************************/

if (message) {

  message.innerHTML = "";

  message.className =
    "message";
}


/****************************************************
 * MESSAGE
 ****************************************************/

function showMessage(text, type = "error") {

  if (!message) return;

  message.textContent =
    text;

  message.className =
    "message " + type;
}


/****************************************************
 * VALIDATE EMAIL
 ****************************************************/

function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
}


/****************************************************
 * JSONP CALL
 *
 * This avoids the CORS problem between
 * GitHub Pages and Google Apps Script.
 ****************************************************/

function callApi(action, params = {}) {

  return new Promise((resolve, reject) => {

    if (!API) {

      reject(
        new Error(
          "Google Apps Script URL is missing."
        )
      );

      return;
    }


    const callbackName =
      "nityasevaCallback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);


    const script =
      document.createElement("script");


    const timeout =
      setTimeout(() => {

        cleanup();

        reject(
          new Error(
            "Unable to connect to Nityaseva OTP service."
          )
        );

      }, 15000);


    function cleanup() {

      clearTimeout(timeout);

      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] =
          undefined;
      }

      if (script.parentNode) {

        script.parentNode
          .removeChild(script);
      }
    }


    window[callbackName] =
      function(data) {

        cleanup();

        resolve(data);
      };


    const query =
      new URLSearchParams();


    query.set(
      "action",
      action
    );


    Object.keys(params)
      .forEach(key => {

        query.set(
          key,
          params[key]
        );

      });


    query.set(
      "callback",
      callbackName
    );


    script.src =
      API +
      (
        API.includes("?")
          ? "&"
          : "?"
      ) +
      query.toString();


    script.async = true;


    script.onerror =
      function() {

        cleanup();

        reject(
          new Error(
            "Unable to connect to Nityaseva OTP service."
          )
        );
      };


    document.body
      .appendChild(script);

  });
}


/****************************************************
 * SEND OTP
 ****************************************************/

sendOtpBtn.addEventListener(
  "click",
  async function() {

    const email =
      emailInput.value
        .trim()
        .toLowerCase();


    if (!email) {

      showMessage(
        "Please enter your registered email address."
      );

      emailInput.focus();

      return;
    }


    if (!isValidEmail(email)) {

      showMessage(
        "Please enter a valid email address."
      );

      emailInput.focus();

      return;
    }


    if (!API) {

      showMessage(
        "OTP service is not configured."
      );

      return;
    }


    currentEmail =
      email;


    sendOtpBtn.disabled =
      true;

    sendOtpBtn.textContent =
      "Sending OTP...";


    showMessage(
      "Connecting to secure OTP service...",
      "success"
    );


    try {

      const result =
        await callApi(
          "sendOtp",
          {
            email:
              email
          }
        );


      console.log(
        "OTP response:",
        result
      );


      if (
        result &&
        result.success
      ) {

        otpSection.style.display =
          "block";


        showMessage(
          "OTP sent successfully. Please check your email.",
          "success"
        );


        otpInput.value =
          "";


        otpInput.focus();


        startTimer(600);

      } else {

        showMessage(
          result &&
          result.error
            ? result.error
            : "Unable to send OTP."
        );
      }


    } catch (error) {

      console.error(
        "OTP error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to connect to Nityaseva OTP service."
      );


    } finally {

      sendOtpBtn.disabled =
        false;

      sendOtpBtn.textContent =
        "Send OTP";
    }

  }
);


/****************************************************
 * VERIFY OTP
 ****************************************************/

verifyOtpBtn.addEventListener(
  "click",
  async function() {

    const otp =
      otpInput.value
        .trim();


    if (!currentEmail) {

      showMessage(
        "Please request an OTP first."
      );

      return;
    }


    if (!/^\d{6}$/.test(otp)) {

      showMessage(
        "Please enter the 6-digit OTP."
      );

      otpInput.focus();

      return;
    }


    verifyOtpBtn.disabled =
      true;

    verifyOtpBtn.textContent =
      "Verifying...";


    try {

      const result =
        await callApi(
          "verifyOtp",
          {
            email:
              currentEmail,

            otp:
              otp
          }
        );


      console.log(
        "Verify response:",
        result
      );


      if (
        result &&
        result.success
      ) {

        clearInterval(
          countdownInterval
        );


        showMessage(
          "OTP verified successfully.",
          "success"
        );


        verifyOtpBtn.textContent =
          "Access Granted";


        /*
         * TEMPORARY SUCCESS ACTION
         *
         * Later this can redirect to:
         *
         * /family-dashboard.html
         *
         * or your secure report page:
         *
         * /r/TOKEN
         */

        setTimeout(
          function() {

            window.location.href =
              "family-dashboard.html";

          },
          1000
        );


      } else {

        showMessage(
          result &&
          result.error
            ? result.error
            : "Invalid OTP."
        );


        verifyOtpBtn.disabled =
          false;

        verifyOtpBtn.textContent =
          "Verify OTP";
      }


    } catch (error) {

      console.error(
        "Verification error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to verify OTP."
      );


      verifyOtpBtn.disabled =
        false;

      verifyOtpBtn.textContent =
        "Verify OTP";
    }

  }
);


/****************************************************
 * OTP TIMER
 ****************************************************/

function startTimer(seconds) {

  clearInterval(
    countdownInterval
  );


  let remaining =
    seconds;


  updateTimer(
    remaining
  );


  countdownInterval =
    setInterval(
      function() {

        remaining--;


        updateTimer(
          remaining
        );


        if (remaining <= 0) {

          clearInterval(
            countdownInterval
          );


          timer.textContent =
            "OTP expired. Please request a new OTP.";
        }

      },
      1000
    );
}


/****************************************************
 * TIMER DISPLAY
 ****************************************************/

function updateTimer(seconds) {

  const minutes =
    Math.floor(
      seconds / 60
    );


  const secs =
    seconds % 60;


  timer.textContent =
    "OTP valid for " +
    String(minutes)
      .padStart(2, "0") +
    ":" +
    String(secs)
      .padStart(2, "0");
}


/****************************************************
 * CONSOLE
 ****************************************************/

console.log(
  "Nityaseva OTP frontend loaded."
);
