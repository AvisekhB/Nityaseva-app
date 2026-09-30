/* =====================================================
   NITYASEVA FRONTEND
   GitHub Pages + Google Apps Script OTP
   ===================================================== */

(function () {

  'use strict';

  console.log('Nityaseva OTP frontend loaded.');

  const config =
    window.NITYASEVA_CONFIG || {};

  const OTP_ENDPOINT =
    String(config.OTP_ENDPOINT || '').trim();


  /* -----------------------------------------------------
     DOM
     ----------------------------------------------------- */

  const emailInput =
    document.getElementById('email');

  const sendOtpButton =
    document.getElementById('sendOtpBtn');

  const otpSection =
    document.getElementById('otpSection');

  const otpInput =
    document.getElementById('otp');

  const verifyOtpButton =
    document.getElementById('verifyOtpBtn');

  const message =
    document.getElementById('message');


  /* -----------------------------------------------------
     Safety check
     ----------------------------------------------------- */

  function showMessage(text, type) {

    if (!message) {
      console.log(text);
      return;
    }

    message.textContent = text;

    message.className =
      'message ' + (type || '');
  }


  function getEmail() {

    if (!emailInput) {
      return '';
    }

    return String(emailInput.value || '')
      .trim()
      .toLowerCase();
  }


  function validEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  }


  /* -----------------------------------------------------
     JSONP ENGINE
     ----------------------------------------------------- */

  function callAppsScript(action, params) {

    return new Promise(function (resolve, reject) {

      if (!OTP_ENDPOINT) {

        reject(
          new Error(
            'OTP endpoint is not configured.'
          )
        );

        return;
      }

      const callbackName =
        'nityasevaCallback_' +
        Date.now() +
        '_' +
        Math.floor(
          Math.random() * 100000
        );

      const script =
        document.createElement('script');

      let finished = false;


      function cleanup() {

        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }

        try {
          delete window[callbackName];
        } catch (e) {
          window[callbackName] = undefined;
        }
      }


      function fail(error) {

        if (finished) return;

        finished = true;

        cleanup();

        reject(error);
      }


      window[callbackName] =
        function (data) {

          if (finished) return;

          finished = true;

          cleanup();

          resolve(data);
        };


      const query =
        new URLSearchParams();


      query.set(
        'action',
        action
      );

      query.set(
        'callback',
        callbackName
      );


      Object.keys(params || {})
        .forEach(function (key) {

          const value =
            params[key];

          query.set(
            key,
            String(value)
          );
        });


      script.src =
        OTP_ENDPOINT +
        (
          OTP_ENDPOINT.indexOf('?') >= 0
            ? '&'
            : '?'
        ) +
        query.toString();


      script.async = true;


      script.onerror =
        function () {

          fail(
            new Error(
              'Unable to connect to Nityaseva OTP service.'
            )
          );
        };


      document.body.appendChild(script);


      // Timeout
      setTimeout(function () {

        if (!finished) {

          fail(
            new Error(
              'OTP service timed out. Please try again.'
            )
          );
        }

      }, 20000);

    });
  }


  /* -----------------------------------------------------
     SEND OTP
     ----------------------------------------------------- */

  async function sendOtp() {

    const email =
      getEmail();


    if (!validEmail(email)) {

      showMessage(
        'Please enter a valid email address.',
        'error'
      );

      return;
    }


    if (!OTP_ENDPOINT) {

      showMessage(
        'OTP service is not configured.',
        'error'
      );

      return;
    }


    sendOtpButton.disabled = true;

    sendOtpButton.textContent =
      'Sending...';

    showMessage(
      'Sending secure OTP...',
      'info'
    );


    try {

      const result =
        await callAppsScript(
          'sendOtp',
          {
            email: email
          }
        );


      console.log(
        'OTP response:',
        result
      );


      if (!result || !result.success) {

        throw new Error(
          result &&
          result.error
            ? result.error
            : 'OTP could not be sent.'
        );
      }


      showMessage(
        'OTP sent to your registered email.',
        'success'
      );


      if (otpSection) {
        otpSection.style.display =
          'block';
      }


      if (otpInput) {
        otpInput.focus();
      }


      sendOtpButton.textContent =
        'OTP Sent';


    } catch (error) {

      console.error(
        'OTP error:',
        error
      );


      showMessage(
        error.message ||
        'Unable to connect to Nityaseva OTP service.',
        'error'
      );


      sendOtpButton.disabled =
        false;

      sendOtpButton.textContent =
        'Send OTP';
    }
  }


  /* -----------------------------------------------------
     VERIFY OTP
     ----------------------------------------------------- */

  async function verifyOtp() {

    const email =
      getEmail();

    const otp =
      otpInput
        ? String(
            otpInput.value || ''
          ).trim()
        : '';


    if (!validEmail(email)) {

      showMessage(
        'Please enter your email address.',
        'error'
      );

      return;
    }


    if (!/^\d{6}$/.test(otp)) {

      showMessage(
        'Please enter the 6-digit OTP.',
        'error'
      );

      return;
    }


    verifyOtpButton.disabled =
      true;

    verifyOtpButton.textContent =
      'Verifying...';


    try {

      const result =
        await callAppsScript(
          'verifyOtp',
          {
            email: email,
            otp: otp
          }
        );


      console.log(
        'Verification response:',
        result
      );


      if (!result || !result.success) {

        throw new Error(
          result &&
          result.error
            ? result.error
            : 'OTP verification failed.'
        );
      }


      showMessage(
        'OTP verified successfully.',
        'success'
      );


      /*
       * For now we show success.
       *
       * Later this can redirect to:
       *
       * /family-dashboard.html
       *
       * or:
       *
       * /r/<temporary-report-token>
       */


      setTimeout(function () {

        window.location.href =
          'family-dashboard.html';

      }, 700);


    } catch (error) {

      console.error(
        'OTP verification error:',
        error
      );


      showMessage(
        error.message ||
        'OTP verification failed.',
        'error'
      );


      verifyOtpButton.disabled =
        false;

      verifyOtpButton.textContent =
        'Verify OTP';
    }
  }


  /* -----------------------------------------------------
     BUTTON EVENTS
     ----------------------------------------------------- */

  if (sendOtpButton) {

    sendOtpButton.addEventListener(
      'click',
      sendOtp
    );
  }


  if (verifyOtpButton) {

    verifyOtpButton.addEventListener(
      'click',
      verifyOtp
    );
  }


  /* -----------------------------------------------------
     ENTER KEY
     ----------------------------------------------------- */

  if (emailInput) {

    emailInput.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Enter'
        ) {

          event.preventDefault();

          sendOtp();
        }

      }
    );
  }


  if (otpInput) {

    otpInput.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Enter'
        ) {

          event.preventDefault();

          verifyOtp();
        }

      }
    );
  }


  /* -----------------------------------------------------
     STARTUP
     ----------------------------------------------------- */

  if (!OTP_ENDPOINT) {

    console.warn(
      'Nityaseva OTP_ENDPOINT is missing.'
    );

  } else {

    console.log(
      'Nityaseva OTP endpoint configured.'
    );

  }

})();
