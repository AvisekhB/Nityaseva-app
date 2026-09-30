/****************************************************
 * NITYASEVA FAMILY SECURE ACCESS
 * GitHub Pages → Google Apps Script JSONP OTP
 ****************************************************/

(function () {

  "use strict";

  console.log("Nityaseva OTP frontend loaded.");

  const CONFIG = window.NITYASEVA_CONFIG || {};

  const OTP_API = String(CONFIG.OTP_API || "").trim();

  const emailInput = document.getElementById("email");
  const otpInput = document.getElementById("otp");

  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");

  const otpSection = document.getElementById("otpSection");
  const message = document.getElementById("message");
  const timer = document.getElementById("timer");

  let countdownInterval = null;
  let currentEmail = "";

  function showMessage(text, type) {

    if (!message) return;

    message.textContent = text;

    message.className =
      "message " + (type || "");

  }


  function clearMessage() {

    if (!message) return;

    message.textContent = "";

    message.className = "message";

  }


  function setButtonLoading(button, loading, text) {

    if (!button) return;

    button.disabled = loading;

    if (loading) {

      button.dataset.originalText =
        button.textContent;

      button.textContent = text || "Please wait...";

    } else {

      button.textContent =
        button.dataset.originalText ||
        button.textContent;

    }

  }


  function validateEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  }


  function startTimer(seconds) {

    clearInterval(countdownInterval);

    let remaining = Number(seconds) || 600;

    function updateTimer() {

      const minutes =
        Math.floor(remaining / 60);

      const secs =
        remaining % 60;

      if (timer) {

        timer.textContent =
          "OTP valid for " +
          minutes +
          ":" +
          String(secs).padStart(2, "0");

      }

      if (remaining <= 0) {

        clearInterval(countdownInterval);

        if (timer) {

          timer.textContent =
            "OTP expired. Please request a new OTP.";

        }

        return;

      }

      remaining--;

    }

    updateTimer();

    countdownInterval =
      setInterval(updateTimer, 1000);

  }


  function jsonp(action, params) {

    return new Promise(function (resolve, reject) {

      if (!OTP_API) {

        reject(
          new Error("OTP service is not configured.")
        );

        return;

      }


      const callbackName =
        "__nityaseva_jsonp_" +
        Date.now() +
        "_" +
        Math.floor(Math.random() * 100000);


      const script =
        document.createElement("script");


      let finished = false;


      function cleanup() {

        if (script && script.parentNode) {

          script.parentNode.removeChild(script);

        }

        try {

          delete window[callbackName];

        } catch (e) {

          window[callbackName] = undefined;

        }

      }


      const timeout =
        setTimeout(function () {

          if (finished) return;

          finished = true;

          cleanup();

          reject(
            new Error(
              "Unable to connect to Nityaseva OTP service."
            )
          );

        }, 20000);


      window[callbackName] =
        function (data) {

          if (finished) return;

          finished = true;

          clearTimeout(timeout);

          cleanup();

          resolve(data);

        };


      script.onerror =
        function () {

          if (finished) return;

          finished = true;

          clearTimeout(timeout);

          cleanup();

          reject(
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


      Object.keys(params || {}).forEach(function (key) {

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

      });


      query.set(
        "_t",
        String(Date.now())
      );


      script.src =
        OTP_API +
        (OTP_API.indexOf("?") >= 0 ? "&" : "?") +
        query.toString();


      script.async = true;

      document.head.appendChild(script);

    });

  }


  async function sendOtp() {

    clearMessage();

    const email =
      String(emailInput.value || "")
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


    if (!validateEmail(email)) {

      showMessage(
        "Please enter a valid email address.",
        "error"
      );

      emailInput.focus();

      return;

    }


    if (!OTP_API) {

      showMessage(
        "OTP service is not configured.",
        "error"
      );

      return;

    }


    setButtonLoading(
      sendOtpBtn,
      true,
      "Sending OTP..."
    );


    try {

      const result =
        await jsonp(
          "sendOtp",
          {
            email: email
          }
        );


      console.log(
        "Send OTP response:",
        result
      );


      if (
        result &&
        result.success === true
      ) {

        currentEmail = email;

        otpSection.style.display =
          "block";

        otpInput.value = "";

        otpInput.focus();

        startTimer(
          Number(result.expiresIn || 600)
        );

        showMessage(
          "OTP sent successfully to " +
          email +
          ".",
          "success"
        );

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

      setButtonLoading(
        sendOtpBtn,
        false
      );

    }

  }


  async function verifyOtp() {

    clearMessage();

    const email =
      currentEmail ||
      String(emailInput.value || "")
        .trim()
        .toLowerCase();


    const otp =
      String(otpInput.value || "")
        .trim();


    if (!email) {

      showMessage(
        "Please enter your email address.",
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


    setButtonLoading(
      verifyOtpBtn,
      true,
      "Verifying..."
    );


    try {

      const result =
        await jsonp(
          "verifyOtp",
          {
            email: email,
            otp: otp
          }
        );


      console.log(
        "Verify OTP response:",
        result
      );


      if (
        result &&
        result.success === true
      ) {

        clearInterval(
          countdownInterval
        );

        showMessage(
          "OTP verified successfully.",
          "success"
        );


        /*
         * Temporary success screen.
         * Replace this later with the
         * secure family dashboard/report
         * redirect.
         */

        setTimeout(function () {

          window.location.href =
            "dashboard.html";

        }, 800);


      } else {

        showMessage(
          result &&
          result.error
            ? result.error
            : "Invalid OTP.",
          "error"
        );

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

    } finally {

      setButtonLoading(
        verifyOtpBtn,
        false
      );

    }

  }


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

        if (event.key === "Enter") {

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

        otpInput.value =
          otpInput.value
            .replace(/\D/g, "")
            .slice(0, 6);

      }
    );


    otpInput.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {

          event.preventDefault();

          verifyOtp();

        }

      }
    );

  }

})();
