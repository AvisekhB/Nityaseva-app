/****************************************************
 * NITYASEVA FAMILY SECURE ACCESS
 * app.js
 *
 * Works with:
 * Google Apps Script OTP Service
 * GitHub Pages
 * JSONP (avoids CORS problems)
 ****************************************************/

(function () {
  "use strict";

  /****************************************************
   * CONFIGURATION
   ****************************************************/
  const CONFIG =
    window.NITYASEVA_CONFIG ||
    window.NITYASEVA_OTP_CONFIG ||
    {};

  const OTP_API =
    String(
      CONFIG.OTP_API ||
      CONFIG.OTP_ENDPOINT ||
      ""
    ).trim();


  /****************************************************
   * DOM ELEMENTS
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

  const messageBox =
    document.getElementById("message");

  const timerElement =
    document.getElementById("timer");


  /****************************************************
   * STATE
   ****************************************************/
  let countdownTimer = null;

  let otpExpiresAt = 0;

  let currentEmail = "";

  let requestInProgress = false;


  /****************************************************
   * INITIAL STATE
   ****************************************************/
  if (otpSection) {
    otpSection.style.display = "none";
  }

  if (messageBox) {
    messageBox.style.display = "none";
  }


  /****************************************************
   * DEBUG
   ****************************************************/
  console.log(
    "Nityaseva OTP frontend loaded."
  );

  console.log(
    "OTP API:",
    OTP_API
  );


  /****************************************************
   * SHOW MESSAGE
   ****************************************************/
  function showMessage(
    message,
    type
  ) {

    if (!messageBox) {
      return;
    }

    messageBox.textContent =
      String(message || "");

    messageBox.className =
      "message " +
      (
        type === "success"
          ? "success"
          : "error"
      );

    messageBox.style.display =
      "block";
  }


  /****************************************************
   * CLEAR MESSAGE
   ****************************************************/
  function clearMessage() {

    if (!messageBox) {
      return;
    }

    messageBox.textContent = "";

    messageBox.style.display =
      "none";

    messageBox.className =
      "message";
  }


  /****************************************************
   * VALIDATE EMAIL
   ****************************************************/
  function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  }


  /****************************************************
   * VALIDATE OTP
   ****************************************************/
  function isValidOtp(otp) {

    return /^\d{6}$/.test(otp);
  }


  /****************************************************
   * CREATE JSONP CALLBACK
   ****************************************************/
  function createCallbackName() {

    return (
      "nityasevaOtpCallback_" +
      Date.now() +
      "_" +
      Math.floor(
        Math.random() * 100000
      )
    );
  }


  /****************************************************
   * CALL GOOGLE APPS SCRIPT
   *
   * IMPORTANT:
   *
   * We intentionally use a <script> tag
   * instead of fetch().
   *
   * GitHub Pages -> Google Apps Script
   * can otherwise fail because of CORS.
   ****************************************************/
  function callOtpService(
    action,
    parameters
  ) {

    return new Promise(
      function (resolve, reject) {

        if (!OTP_API) {

          reject(
            new Error(
              "OTP service is not configured. Check config.js."
            )
          );

          return;
        }


        const callbackName =
          createCallbackName();


        const script =
          document.createElement("script");


        let finished = false;


        /************************************************
         * CLEANUP
         ************************************************/
        function cleanup() {

          if (
            script &&
            script.parentNode
          ) {

            script.parentNode.removeChild(
              script
            );
          }


          try {

            delete window[
              callbackName
            ];

          } catch (e) {

            window[
              callbackName
            ] = undefined;
          }
        }


        /************************************************
         * SUCCESS CALLBACK
         ************************************************/
        window[
          callbackName
        ] = function (data) {

          if (finished) {
            return;
          }

          finished = true;

          clearTimeout(timeout);

          cleanup();

          resolve(data);
        };


        /************************************************
         * SCRIPT ERROR
         ************************************************/
        script.onerror =
          function () {

            if (finished) {
              return;
            }

            finished = true;

            clearTimeout(timeout);

            cleanup();

            reject(
              new Error(
                "Unable to connect to Nityaseva OTP service."
              )
            );
          };


        /************************************************
         * TIMEOUT
         ************************************************/
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
            20000
          );


        /************************************************
         * BUILD QUERY
         ************************************************/
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


        if (parameters) {

          Object.keys(parameters)
            .forEach(
              function (key) {

                const value =
                  parameters[key];

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


        const requestUrl =
          OTP_API +
          (
            OTP_API.indexOf("?") >= 0
              ? "&"
              : "?"
          ) +
          query.toString();


        console.log(
          "Nityaseva OTP request:",
          requestUrl
        );


        script.src =
          requestUrl;


        script.async = true;


        document.body.appendChild(
          script
        );
      }
    );
  }


  /****************************************************
   * START COUNTDOWN
   ****************************************************/
  function startCountdown(
    seconds
  ) {

    clearInterval(
      countdownTimer
    );


    otpExpiresAt =
      Date.now() +
      (
        Number(seconds || 600) *
        1000
      );


    updateCountdown();


    countdownTimer =
      setInterval(
        updateCountdown,
        1000
      );
  }


  /****************************************************
   * UPDATE COUNTDOWN
   ****************************************************/
  function updateCountdown() {

    if (!timerElement) {
      return;
    }


    const remaining =
      Math.max(
        0,
        otpExpiresAt -
        Date.now()
      );


    if (remaining <= 0) {

      clearInterval(
        countdownTimer
      );


      timerElement.textContent =
        "OTP expired. Please request a new OTP.";

      return;
    }


    const totalSeconds =
      Math.ceil(
        remaining / 1000
      );


    const minutes =
      Math.floor(
        totalSeconds / 60
      );


    const seconds =
      totalSeconds % 60;


    timerElement.textContent =
      "OTP valid for " +
      String(minutes) +
      ":" +
      String(seconds)
        .padStart(2, "0");
  }


  /****************************************************
   * ENABLE / DISABLE SEND BUTTON
   ****************************************************/
  function setSendButtonState(
    disabled
  ) {

    if (!sendOtpBtn) {
      return;
    }


    sendOtpBtn.disabled =
      disabled;


    sendOtpBtn.textContent =
      disabled
        ? "Sending OTP..."
        : "Send OTP";
  }


  /****************************************************
   * ENABLE / DISABLE VERIFY BUTTON
   ****************************************************/
  function setVerifyButtonState(
    disabled
  ) {

    if (!verifyOtpBtn) {
      return;
    }


    verifyOtpBtn.disabled =
      disabled;


    verifyOtpBtn.textContent =
      disabled
        ? "Verifying..."
        : "Verify OTP";
  }


  /****************************************************
   * SEND OTP
   ****************************************************/
  async function sendOtp() {

    if (requestInProgress) {
      return;
    }


    clearMessage();


    const email =
      String(
        emailInput
          ? emailInput.value
          : ""
      )
        .trim()
        .toLowerCase();


    /************************************************
     * EMAIL VALIDATION
     ************************************************/
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


    /************************************************
     * CONFIG CHECK
     ************************************************/
    if (!OTP_API) {

      showMessage(
        "OTP service is not configured. Please check config.js.",
        "error"
      );

      console.error(
        "Nityaseva OTP error: OTP_API is empty."
      );

      return;
    }


    requestInProgress =
      true;


    setSendButtonState(
      true
    );


    try {

      const response =
        await callOtpService(
          "sendOtp",
          {
            email: email
          }
        );


      console.log(
        "OTP response:",
        response
      );


      /************************************************
       * SUCCESS
       ************************************************/
      if (
        response &&
        response.success === true
      ) {

        currentEmail =
          email;


        if (otpSection) {

          otpSection.style.display =
            "block";
        }


        if (otpInput) {

          otpInput.value = "";

          otpInput.focus();
        }


        startCountdown(
          Number(
            response.expiresIn ||
            600
          )
        );


        showMessage(
          response.message ||
          "OTP sent successfully. Please check your email.",
          "success"
        );


        return;
      }


      /************************************************
       * SERVER ERROR
       ************************************************/
      showMessage(
        (
          response &&
          response.error
        )
          ? response.error
          : "Unable to send OTP.",
        "error"
      );


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

      requestInProgress =
        false;

      setSendButtonState(
        false
      );
    }
  }


  /****************************************************
   * VERIFY OTP
   ****************************************************/
  async function verifyOtp() {

    if (requestInProgress) {
      return;
    }


    clearMessage();


    const email =
      String(
        currentEmail ||
        (
          emailInput
            ? emailInput.value
            : ""
        )
      )
        .trim()
        .toLowerCase();


    const otp =
      String(
        otpInput
          ? otpInput.value
          : ""
      )
        .trim();


    /************************************************
     * EMAIL CHECK
     ************************************************/
    if (!email) {

      showMessage(
        "Please enter your registered email address.",
        "error"
      );

      return;
    }


    /************************************************
     * OTP CHECK
     ************************************************/
    if (!otp) {

      showMessage(
        "Please enter the OTP.",
        "error"
      );

      if (otpInput) {
        otpInput.focus();
      }

      return;
    }


    if (!isValidOtp(otp)) {

      showMessage(
        "Please enter the 6-digit OTP.",
        "error"
      );

      if (otpInput) {
        otpInput.focus();
      }

      return;
    }


    /************************************************
     * LOCAL EXPIRY CHECK
     ************************************************/
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


    requestInProgress =
      true;


    setVerifyButtonState(
      true
    );


    try {

      const response =
        await callOtpService(
          "verifyOtp",
          {
            email: email,
            otp: otp
          }
        );


      console.log(
        "OTP verification response:",
        response
      );


      /************************************************
       * VERIFIED
       ************************************************/
      if (
        response &&
        response.success === true
      ) {

        clearInterval(
          countdownTimer
        );


        showMessage(
          "OTP verified successfully.",
          "success"
        );


        /************************************************
         * SAVE TEMPORARY SESSION
         *
         * This is only frontend state.
         *
         * For production clinical reports,
         * use authenticated Supabase session
         * and server-side authorization.
         ************************************************/
        try {

          sessionStorage.setItem(
            "nityaseva_family_email",
            email
          );


          sessionStorage.setItem(
            "nityaseva_verified_at",
            String(
              Date.now()
            )
          );

        } catch (e) {

          console.warn(
            "Session storage unavailable.",
            e
          );
        }


        /************************************************
         * NEXT PAGE
         *
         * If family-dashboard.html exists,
         * open it.
         *
         * Otherwise remain on this page.
         ************************************************/
        setTimeout(
          function () {

            const dashboardUrl =
              "family-dashboard.html";


            /*
             * Only redirect if the page exists.
             * GitHub Pages may return 404.
             *
             * We use a HEAD request only to check
             * availability. If unavailable, stay here.
             */

            fetch(
              dashboardUrl,
              {
                method: "HEAD",
                cache: "no-store"
              }
            )
              .then(
                function (res) {

                  if (res.ok) {

                    window.location.href =
                      dashboardUrl;

                  }

                }
              )
              .catch(
                function () {

                  /*
                   * Dashboard page is not created yet.
                   * Keep user on current page.
                   */

                  console.log(
                    "Family dashboard page not available yet."
                  );
                }
              );

          },
          800
        );


        return;
      }


      /************************************************
       * INVALID OTP
       ************************************************/
      showMessage(
        (
          response &&
          response.error
        )
          ? response.error
          : "Invalid OTP.",
        "error"
      );


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


    } finally {

      requestInProgress =
        false;

      setVerifyButtonState(
        false
      );
    }
  }


  /****************************************************
   * SEND OTP BUTTON
   ****************************************************/
  if (sendOtpBtn) {

    sendOtpBtn.addEventListener(
      "click",
      sendOtp
    );
  }


  /****************************************************
   * VERIFY OTP BUTTON
   ****************************************************/
  if (verifyOtpBtn) {

    verifyOtpBtn.addEventListener(
      "click",
      verifyOtp
    );
  }


  /****************************************************
   * ENTER KEY - EMAIL
   ****************************************************/
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


  /****************************************************
   * ENTER KEY - OTP
   ****************************************************/
  if (otpInput) {

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


    /************************************************
     * ONLY NUMBERS
     ************************************************/
    otpInput.addEventListener(
      "input",
      function () {

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


  /****************************************************
   * EXPOSE DEBUG FUNCTIONS
   *
   * Useful from browser console.
   ****************************************************/
  window.NityasevaOTP = {

    sendOtp:
      sendOtp,

    verifyOtp:
      verifyOtp,

    getConfig:
      function () {

        return {
          otpApiConfigured:
            Boolean(OTP_API),

          otpApi:
            OTP_API
        };
      }
  };


})();
