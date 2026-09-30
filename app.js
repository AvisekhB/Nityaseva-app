/****************************************************
 * NITYASEVA FAMILY SECURE ACCESS
 * app.js
 *
 * Works with:
 * - GitHub Pages
 * - Google Apps Script OTP API
 * - JSONP (no CORS problem)
 ****************************************************/

(function () {
  "use strict";

  console.log("Nityaseva OTP frontend loaded.");

  /* =================================================
     CONFIG
     ================================================= */

  const CONFIG =
    window.NITYASEVA_CONFIG || {};

  const OTP_API =
    String(
      CONFIG.OTP_ENDPOINT ||
      CONFIG.OTP_API ||
      ""
    ).trim();

  const OTP_VALID_SECONDS = 600;

  const REQUEST_TIMEOUT = 20000;


  /* =================================================
     DOM
     ================================================= */

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


  /* =================================================
     STATE
     ================================================= */

  let timerInterval = null;

  let otpRequestInProgress = false;

  let verifyRequestInProgress = false;


  /* =================================================
     INITIAL STATE
     ================================================= */

  if (message) {
    message.style.display = "none";
  }

  if (otpSection) {
    otpSection.style.display = "none";
  }


  /* =================================================
     MESSAGE
     ================================================= */

  function showMessage(text, type) {

    if (!message) return;

    message.textContent = text;

    message.className =
      "message " +
      (type || "");

    message.style.display = "block";
  }


  function hideMessage() {

    if (!message) return;

    message.style.display = "none";
  }


  /* =================================================
     EMAIL VALIDATION
     ================================================= */

  function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }


  /* =================================================
     GET EMAIL
     ================================================= */

  function getEmail() {

    return String(
      emailInput &&
      emailInput.value
        ? emailInput.value
        : ""
    )
      .trim()
      .toLowerCase();
  }


  /* =================================================
     JSONP REQUEST
     ================================================= */

  function jsonpRequest(action, params) {

    return new Promise(function (resolve, reject) {

      if (!OTP_API) {

        reject(
          new Error(
            "OTP service is not configured."
          )
        );

        return;
      }


      const callbackName =
        "nityasevaOtpCallback_" +
        Date.now() +
        "_" +
        Math.floor(
          Math.random() * 100000
        );


      let finished = false;

      let timeout = null;

      const script =
        document.createElement("script");


      /* ---------------------------------------------
         CLEANUP
         --------------------------------------------- */

      function cleanup() {

        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        try {
          delete window[callbackName];
        } catch (e) {
          window[callbackName] =
            undefined;
        }

        if (script.parentNode) {
          script.parentNode.removeChild(
            script
          );
        }
      }


      /* ---------------------------------------------
         FINISH
         --------------------------------------------- */

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


      /* ---------------------------------------------
         CALLBACK
         --------------------------------------------- */

      window[callbackName] =
        function (data) {

          console.log(
            "Nityaseva OTP response:",
            data
          );

          finishSuccess(data);
        };


      /* ---------------------------------------------
         BUILD URL
         --------------------------------------------- */

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


      query.set(
        "_",
        Date.now().toString()
      );


      if (params) {

        Object.keys(params).forEach(
          function (key) {

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
      }


      const separator =
        OTP_API.indexOf("?") >= 0
          ? "&"
          : "?";


      const url =
        OTP_API +
        separator +
        query.toString();


      console.log(
        "Nityaseva OTP request:",
        url
      );


      /* ---------------------------------------------
         SCRIPT
         --------------------------------------------- */

      script.src = url;

      script.async = true;

      script.type =
        "application/javascript";


      /* ---------------------------------------------
         SCRIPT ERROR
         --------------------------------------------- */

      script.onerror =
        function () {

          finishError(
            new Error(
              "Unable to connect to Nityaseva OTP service."
            )
          );
        };


      /* ---------------------------------------------
         TIMEOUT
         --------------------------------------------- */

      timeout =
        setTimeout(
          function () {

            finishError(
              new Error(
                "Nityaseva OTP service timed out. Please try again."
              )
            );

          },
          REQUEST_TIMEOUT
        );


      document.body.appendChild(
        script
      );

    });
  }


  /* =================================================
     SEND OTP
     ================================================= */

  async function sendOtp() {

    if (otpRequestInProgress) {
      return;
    }


    hideMessage();


    const email =
      getEmail();


    if (!email) {

      showMessage(
        "Please enter your registered email address.",
        "error"
      );

      if (emailInput) {
        emailInput.focus();
      }

      return;
    }


    if (!isValidEmail(email)) {

      showMessage(
        "Please enter a valid email address.",
        "error"
      );

      if (emailInput) {
        emailInput.focus();
      }

      return;
    }


    if (!OTP_API) {

      showMessage(
        "OTP service is not configured.",
        "error"
      );

      console.error(
        "NITYASEVA_CONFIG.OTP_API / OTP_ENDPOINT is missing."
      );

      return;
    }


    otpRequestInProgress = true;


    if (sendOtpBtn) {

      sendOtpBtn.disabled = true;

      sendOtpBtn.textContent =
        "Sending OTP...";
    }


    try {

      const result =
        await jsonpRequest(
          "sendOtp",
          {
            email: email
          }
        );


      console.log(
        "OTP send result:",
        result
      );


      if (
        !result ||
        result.success !== true
      ) {

        throw new Error(
          result &&
          result.error
            ? result.error
            : "Unable to send OTP."
        );
      }


      /* -------------------------------------------
         SUCCESS
         ------------------------------------------- */

      showMessage(
        "OTP sent successfully. Please check your email.",
        "success"
      );


      if (otpSection) {
        otpSection.style.display =
          "block";
      }


      if (otpInput) {

        otpInput.value = "";

        otpInput.focus();
      }


      startOtpTimer(
        Number(
          result.expiresIn ||
          OTP_VALID_SECONDS
        )
      );


    } catch (error) {

      console.error(
        "OTP send error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to send OTP. Please try again.",
        "error"
      );

    } finally {

      otpRequestInProgress = false;


      if (sendOtpBtn) {

        sendOtpBtn.disabled = false;

        sendOtpBtn.textContent =
          "Send OTP";
      }
    }
  }


  /* =================================================
     VERIFY OTP
     ================================================= */

  async function verifyOtp() {

    if (verifyRequestInProgress) {
      return;
    }


    hideMessage();


    const email =
      getEmail();


    const otp =
      String(
        otpInput &&
        otpInput.value
          ? otpInput.value
          : ""
      ).trim();


    if (!email) {

      showMessage(
        "Please enter your registered email address.",
        "error"
      );

      return;
    }


    if (!isValidEmail(email)) {

      showMessage(
        "Please enter a valid email address.",
        "error"
      );

      return;
    }


    if (!/^\d{6}$/.test(otp)) {

      showMessage(
        "Please enter the 6-digit OTP.",
        "error"
      );

      if (otpInput) {
        otpInput.focus();
      }

      return;
    }


    if (!OTP_API) {

      showMessage(
        "OTP service is not configured.",
        "error"
      );

      return;
    }


    verifyRequestInProgress = true;


    if (verifyOtpBtn) {

      verifyOtpBtn.disabled = true;

      verifyOtpBtn.textContent =
        "Verifying...";
    }


    try {

      const result =
        await jsonpRequest(
          "verifyOtp",
          {
            email: email,
            otp: otp
          }
        );


      console.log(
        "OTP verification result:",
        result
      );


      if (
        !result ||
        result.success !== true
      ) {

        throw new Error(
          result &&
          result.error
            ? result.error
            : "Invalid OTP."
        );
      }


      /* -------------------------------------------
         VERIFIED
         ------------------------------------------- */

      stopOtpTimer();


      showMessage(
        "OTP verified successfully.",
        "success"
      );


      if (verifyOtpBtn) {

        verifyOtpBtn.textContent =
          "Verified ✓";
      }


      /*
       * Store only the verified email.
       * Do NOT store the OTP.
       */

      try {

        sessionStorage.setItem(
          "nityaseva_verified_email",
          email
        );

        sessionStorage.setItem(
          "nityaseva_authenticated",
          "true"
        );

        sessionStorage.setItem(
          "nityaseva_verified_at",
          Date.now().toString()
        );

      } catch (storageError) {

        console.warn(
          "Session storage unavailable:",
          storageError
        );
      }


      /*
       * Continue to the family dashboard
       * if one is configured.
       */

      setTimeout(
        function () {

          const dashboardUrl =
            String(
              CONFIG.FAMILY_DASHBOARD_URL ||
              CONFIG.DASHBOARD_URL ||
              ""
            ).trim();


          if (dashboardUrl) {

            window.location.href =
              dashboardUrl;

            return;
          }


          /*
           * If no dashboard has been configured,
           * keep the user on the verified page.
           */

          showMessage(
            "Access verified successfully.",
            "success"
          );

        },
        700
      );


    } catch (error) {

      console.error(
        "OTP verification error:",
        error
      );


      showMessage(
        error.message ||
        "OTP verification failed. Please try again.",
        "error"
      );


      if (verifyOtpBtn) {

        verifyOtpBtn.disabled = false;

        verifyOtpBtn.textContent =
          "Verify OTP";
      }

    } finally {

      verifyRequestInProgress = false;

    }
  }


  /* =================================================
     OTP TIMER
     ================================================= */

  function startOtpTimer(seconds) {

    stopOtpTimer();


    let remaining =
      Number(seconds) || OTP_VALID_SECONDS;


    updateTimer(
      remaining
    );


    timerInterval =
      setInterval(
        function () {

          remaining--;

          updateTimer(
            remaining
          );


          if (remaining <= 0) {

            stopOtpTimer();


            showMessage(
              "OTP has expired. Please request a new OTP.",
              "error"
            );

          }

        },
        1000
      );
  }


  function stopOtpTimer() {

    if (timerInterval) {

      clearInterval(
        timerInterval
      );

      timerInterval = null;
    }
  }


  function updateTimer(seconds) {

    if (!timer) return;


    seconds =
      Math.max(
        0,
        Number(seconds) || 0
      );


    const minutes =
      Math.floor(
        seconds / 60
      );


    const secs =
      seconds % 60;


    timer.textContent =
      "OTP valid for " +
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0");
  }


  /* =================================================
     ENTER KEY
     ================================================= */

  if (emailInput) {

    emailInput.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          sendOtp();
        }
      }
    );
  }


  if (otpInput) {

    otpInput.addEventListener(
      "input",
      function () {

        /*
         * Allow numbers only.
         */

        otpInput.value =
          otpInput.value
            .replace(/\D/g, "")
            .slice(0, 6);
      }
    );


    otpInput.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          verifyOtp();
        }
      }
    );
  }


  /* =================================================
     BUTTON EVENTS
     ================================================= */

  if (sendOtpBtn) {

    sendOtpBtn.addEventListener(
      "click",
      sendOtp
    );
  }


  if (verifyOtpBtn) {

    verifyOtpBtn.addEventListener(
      "click",
      verifyOtp
    );
  }


  /* =================================================
     SERVICE CHECK
     ================================================= */

  async function checkOtpService() {

    if (!OTP_API) {

      console.error(
        "Nityaseva OTP API is missing."
      );

      return;
    }


    try {

      const result =
        await jsonpRequest(
          "status",
          {}
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
          "OTP service returned an unexpected response.",
          result
        );
      }

    } catch (error) {

      console.warn(
        "OTP service status check failed:",
        error
      );

    }
  }


  /* =================================================
     STARTUP
     ================================================= */

  checkOtpService();

})();
