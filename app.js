/****************************************************
 * NITYASEVA FAMILY OTP FRONTEND
 * GitHub Pages + Google Apps Script
 *
 * IMPORTANT:
 * This version uses JSONP.
 * Do NOT use fetch() for the Apps Script OTP endpoint.
 ****************************************************/

(function () {

  "use strict";

  console.log("Nityaseva OTP frontend loaded.");

  /* =================================================
     ELEMENTS
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
     CONFIGURATION
  ================================================= */

  function getOtpEndpoint() {

    if (
      window.NITYASEVA_CONFIG &&
      window.NITYASEVA_CONFIG.OTP_ENDPOINT
    ) {

      return String(
        window.NITYASEVA_CONFIG.OTP_ENDPOINT
      ).trim();

    }


    if (
      window.NITYASEVA_CONFIG &&
      window.NITYASEVA_CONFIG.OTP_API
    ) {

      return String(
        window.NITYASEVA_CONFIG.OTP_API
      ).trim();

    }


    return "";

  }


  /* =================================================
     STATE
  ================================================= */

  let countdownInterval = null;

  let otpExpiresAt = 0;

  let requestInProgress = false;


  /* =================================================
     MESSAGE
  ================================================= */

  function showMessage(
    text,
    type
  ) {

    if (!message) {
      return;
    }


    message.textContent =
      text || "";


    message.className =
      "message " +
      (type || "");


    message.style.display =
      text ? "block" : "none";
  }


  function clearMessage() {

    showMessage("", "");

  }


  /* =================================================
     EMAIL VALIDATION
  ================================================= */

  function validEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);

  }


  /* =================================================
     JSONP REQUEST
  ================================================= */

  function jsonpRequest(
    action,
    params,
    timeoutMs
  ) {

    return new Promise(
      function (resolve, reject) {

        const callbackName =
          "__nityasevaCallback_" +
          Date.now() +
          "_" +
          Math.floor(
            Math.random() * 100000
          );


        const script =
          document.createElement("script");


        let finished = false;


        const timeout =
          setTimeout(
            function () {

              if (finished) {
                return;
              }

              finished = true;

              cleanup();


              reject(
                new Error(
                  "Nityaseva OTP service timed out."
                )
              );

            },
            timeoutMs || 20000
          );


        function cleanup() {

          clearTimeout(timeout);

          try {
            delete window[callbackName];
          } catch (e) {
            window[callbackName] = undefined;
          }


          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }

        }


        window[callbackName] =
          function (data) {

            if (finished) {
              return;
            }


            finished = true;

            cleanup();

            resolve(data);

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


        Object.keys(params || {})
          .forEach(
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


        const endpoint =
          getOtpEndpoint();


        if (!endpoint) {

          finished = true;

          cleanup();

          reject(
            new Error(
              "OTP service is not configured."
            )
          );

          return;
        }


        const separator =
          endpoint.indexOf("?") >= 0
            ? "&"
            : "?";


        const url =
          endpoint +
          separator +
          query.toString();


        console.log(
          "Nityaseva OTP request:",
          url
        );


        script.src =
          url;


        script.async = true;


        script.onerror =
          function () {

            if (finished) {
              return;
            }


            finished = true;

            cleanup();


            reject(
              new Error(
                "Unable to connect to Nityaseva OTP service."
              )
            );

          };


        document.body.appendChild(
          script
        );

      }
    );

  }


  /* =================================================
     SEND OTP
  ================================================= */

  async function sendOtp() {

    if (requestInProgress) {
      return;
    }


    clearMessage();


    const email =
      String(
        emailInput.value || ""
      )
        .trim()
        .toLowerCase();


    if (!email) {

      showMessage(
        "Please enter your registered email address.",
        "error"
      );

      emailInput.focus();

      return;
    }


    if (!validEmail(email)) {

      showMessage(
        "Please enter a valid email address.",
        "error"
      );

      emailInput.focus();

      return;
    }


    const endpoint =
      getOtpEndpoint();


    if (!endpoint) {

      showMessage(
        "OTP service is not configured.",
        "error"
      );

      console.error(
        "NITYASEVA OTP endpoint is missing."
      );

      return;
    }


    requestInProgress = true;


    sendOtpBtn.disabled = true;

    sendOtpBtn.textContent =
      "Sending OTP...";


    try {

      const result =
        await jsonpRequest(
          "sendOtp",
          {
            email: email
          },
          20000
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


        otpInput.value = "";


        otpInput.focus();


        showMessage(
          "OTP sent successfully to your registered email.",
          "success"
        );


        startTimer(
          Number(
            result.expiresIn || 600
          )
        );


        sendOtpBtn.textContent =
          "Resend OTP";


      } else {

        showMessage(
          result &&
          result.error
            ? result.error
            : "Unable to send OTP.",
          "error"
        );

      }


    } catch (error) {

      console.error(
        "OTP send error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to connect to Nityaseva OTP service.",
        "error"
      );


    } finally {

      requestInProgress = false;

      sendOtpBtn.disabled = false;


      if (
        sendOtpBtn.textContent ===
        "Sending OTP..."
      ) {

        sendOtpBtn.textContent =
          "Send OTP";

      }

    }

  }


  /* =================================================
     VERIFY OTP
  ================================================= */

  async function verifyOtp() {

    if (requestInProgress) {
      return;
    }


    clearMessage();


    const email =
      String(
        emailInput.value || ""
      )
        .trim()
        .toLowerCase();


    const otp =
      String(
        otpInput.value || ""
      )
        .trim();


    if (!validEmail(email)) {

      showMessage(
        "Please enter a valid registered email address.",
        "error"
      );

      return;
    }


    if (!/^\d{6}$/.test(otp)) {

      showMessage(
        "Please enter the 6-digit OTP.",
        "error"
      );

      otpInput.focus();

      return;
    }


    if (
      otpExpiresAt &&
      Date.now() > otpExpiresAt
    ) {

      showMessage(
        "OTP has expired. Please request a new OTP.",
        "error"
      );

      return;
    }


    requestInProgress = true;


    verifyOtpBtn.disabled = true;

    verifyOtpBtn.textContent =
      "Verifying...";


    try {

      const result =
        await jsonpRequest(
          "verifyOtp",
          {
            email: email,
            otp: otp
          },
          20000
        );


      console.log(
        "OTP verification response:",
        result
      );


      if (
        result &&
        result.success
      ) {

        stopTimer();


        showMessage(
          "OTP verified successfully.",
          "success"
        );


        verifyOtpBtn.textContent =
          "Verified";


        verifyOtpBtn.disabled =
          true;


        /*
         * Store a simple session marker.
         *
         * This is NOT the clinical authorization layer.
         * The actual report access must still perform
         * server-side authorization.
         */

        try {

          sessionStorage.setItem(
            "nityaseva_family_email",
            email
          );

          sessionStorage.setItem(
            "nityaseva_otp_verified",
            "true"
          );

          sessionStorage.setItem(
            "nityaseva_verified_at",
            String(Date.now())
          );

        } catch (storageError) {

          console.warn(
            "Session storage unavailable:",
            storageError
          );

        }


        /*
         * Optional next step.
         *
         * If your application later needs to open
         * a family dashboard, do it here.
         */

        console.log(
          "Family OTP verification completed."
        );


      } else {

        showMessage(
          result &&
          result.error
            ? result.error
            : "Invalid OTP.",
          "error"
        );


        verifyOtpBtn.disabled =
          false;


        verifyOtpBtn.textContent =
          "Verify OTP";

      }


    } catch (error) {

      console.error(
        "OTP verification error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to connect to Nityaseva OTP service.",
        "error"
      );


      verifyOtpBtn.disabled =
        false;


      verifyOtpBtn.textContent =
        "Verify OTP";

    } finally {

      requestInProgress = false;

    }

  }


  /* =================================================
     TIMER
  ================================================= */

  function startTimer(seconds) {

    stopTimer();


    let remaining =
      Number(seconds) || 600;


    otpExpiresAt =
      Date.now() +
      remaining * 1000;


    updateTimer(
      remaining
    );


    countdownInterval =
      setInterval(
        function () {

          remaining--;


          updateTimer(
            remaining
          );


          if (remaining <= 0) {

            stopTimer();


            showMessage(
              "OTP has expired. Please request a new OTP.",
              "error"
            );

          }

        },
        1000
      );

  }


  function updateTimer(seconds) {

    if (!timer) {
      return;
    }


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


  function stopTimer() {

    if (countdownInterval) {

      clearInterval(
        countdownInterval
      );

      countdownInterval =
        null;

    }

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

        this.value =
          this.value
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
     INITIAL STATE
  ================================================= */

  if (message) {

    message.style.display =
      "none";

  }


  if (otpSection) {

    otpSection.style.display =
      "none";

  }


})();
