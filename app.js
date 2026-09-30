// ==========================================
// NITYASEVA FAMILY OTP - FINAL FRONTEND
// ==========================================

const CONFIG = window.NITYASEVA_CONFIG || {};

let currentEmail = "";
let otpTimer = null;
let otpSeconds = 600;


// ------------------------------------------
// Get HTML elements safely
// ------------------------------------------

const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");

const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");

const otpSection = document.getElementById("otpSection");
const messageBox = document.getElementById("message");
const timerBox = document.getElementById("timer");


// ------------------------------------------
// Message
// ------------------------------------------

function showMessage(text, type = "error") {

    if (!messageBox) {
        console.log(text);
        return;
    }

    messageBox.textContent = text;

    messageBox.className =
        "message " + type;
}


// ------------------------------------------
// Validate email
// ------------------------------------------

function validEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


// ------------------------------------------
// Apps Script JSONP
// ------------------------------------------

function callOtpApi(action, params = {}) {

    return new Promise((resolve, reject) => {

        const endpoint = CONFIG.OTP_ENDPOINT;

        if (!endpoint) {

            reject(
                new Error(
                    "OTP service URL is missing in config.js"
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


        const query =
            new URLSearchParams();


        query.set("action", action);

        query.set("callback", callbackName);


        Object.keys(params).forEach(key => {

            query.set(
                key,
                params[key]
            );

        });


        let finished = false;


        const timeout =
            setTimeout(() => {

                if (finished) return;

                finished = true;

                cleanup();

                reject(
                    new Error(
                        "OTP service timed out. Check the Apps Script Web App URL."
                    )
                );

            }, 30000);


        function cleanup() {

            clearTimeout(timeout);

            if (script.parentNode) {

                script.parentNode.removeChild(
                    script
                );

            }

            try {

                delete window[callbackName];

            } catch (e) {

                window[callbackName] =
                    undefined;

            }

        }


        window[callbackName] =
            function(data) {

                if (finished) return;

                finished = true;

                cleanup();

                resolve(data);

            };


        script.onerror =
            function() {

                if (finished) return;

                finished = true;

                cleanup();

                reject(
                    new Error(
                        "Unable to connect to Nityaseva OTP service."
                    )
                );

            };


        script.src =
            endpoint +
            "?" +
            query.toString();


        document.body.appendChild(
            script
        );

    });

}


// ------------------------------------------
// SEND OTP
// ------------------------------------------

async function sendOtp() {

    const email =
        emailInput
            ? emailInput.value
                .trim()
                .toLowerCase()
            : "";


    if (!email) {

        showMessage(
            "Please enter your registered email."
        );

        return;
    }


    if (!validEmail(email)) {

        showMessage(
            "Please enter a valid email address."
        );

        return;
    }


    currentEmail = email;


    if (sendOtpBtn) {

        sendOtpBtn.disabled = true;

        sendOtpBtn.textContent =
            "Sending...";
    }


    showMessage(
        "Sending OTP...",
        "success"
    );


    try {

        const result =
            await callOtpApi(
                "sendOtp",
                {
                    email: email
                }
            );


        console.log(
            "OTP response:",
            result
        );


        if (!result.success) {

            throw new Error(
                result.error ||
                "Unable to send OTP."
            );
        }


        if (otpSection) {

            otpSection.style.display =
                "block";
        }


        showMessage(
            "OTP sent successfully. Please check your email.",
            "success"
        );


        startTimer();


        if (otpInput) {

            otpInput.focus();

        }


    } catch (error) {

        console.error(
            "OTP error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to send OTP."
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


// ------------------------------------------
// VERIFY OTP
// ------------------------------------------

async function verifyOtp() {

    const email =
        currentEmail ||
        (
            emailInput
                ? emailInput.value
                    .trim()
                    .toLowerCase()
                : ""
        );


    const otp =
        otpInput
            ? otpInput.value.trim()
            : "";


    if (!email) {

        showMessage(
            "Please enter your registered email."
        );

        return;
    }


    if (!/^\d{6}$/.test(otp)) {

        showMessage(
            "Please enter the 6-digit OTP."
        );

        return;
    }


    if (verifyOtpBtn) {

        verifyOtpBtn.disabled =
            true;

        verifyOtpBtn.textContent =
            "Verifying...";
    }


    try {

        const result =
            await callOtpApi(
                "verifyOtp",
                {
                    email: email,
                    otp: otp
                }
            );


        console.log(
            "Verify response:",
            result
        );


        if (!result.success) {

            throw new Error(
                result.error ||
                "OTP verification failed."
            );
        }


        // Store pilot session

        sessionStorage.setItem(
            "nityaseva_email",
            email
        );


        sessionStorage.setItem(
            "nityaseva_session",
            result.sessionToken || ""
        );


        showMessage(
            "OTP verified successfully.",
            "success"
        );


        clearInterval(
            otpTimer
        );


        /*
         * For now, stay on this page.
         *
         * This prevents another missing
         * dashboard.html error.
         */

        if (verifyOtpBtn) {

            verifyOtpBtn.textContent =
                "Verified ✓";
        }


        if (emailInput) {

            emailInput.disabled =
                true;
        }


        if (otpInput) {

            otpInput.disabled =
                true;
        }


    } catch (error) {

        console.error(
            "Verification error:",
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


// ------------------------------------------
// TIMER
// ------------------------------------------

function startTimer() {

    clearInterval(
        otpTimer
    );


    otpSeconds = 600;


    updateTimer();


    otpTimer =
        setInterval(() => {

            otpSeconds--;

            updateTimer();


            if (otpSeconds <= 0) {

                clearInterval(
                    otpTimer
                );

                showMessage(
                    "OTP expired. Please request a new OTP."
                );

            }

        }, 1000);

}


function updateTimer() {

    if (!timerBox) return;


    const minutes =
        Math.floor(
            otpSeconds / 60
        );


    const seconds =
        otpSeconds % 60;


    timerBox.textContent =
        "OTP valid for " +
        minutes +
        ":" +
        String(seconds)
            .padStart(2, "0");

}


// ------------------------------------------
// Button events
// ------------------------------------------

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


// ------------------------------------------
// Enter key
// ------------------------------------------

if (emailInput) {

    emailInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                sendOtp();

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

                verifyOtp();

            }

        }
    );

}


console.log(
    "Nityaseva OTP frontend loaded."
);
