/*******************************************************
 * NITYASEVA OTP SERVICE
 * Google Apps Script Web App
 *
 * Supports:
 *   GET  -> health/status check
 *   POST -> sendOtp / verifyOtp
 *
 * Frontend:
 *   GitHub Pages / Nityaseva
 *
 * Storage:
 *   Google Sheets
 *******************************************************/

const SHEET_ID =
  PropertiesService.getScriptProperties().getProperty('SHEET_ID');

const OTP_SHEET = 'OTP';
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;


/* =====================================================
   GET
   ===================================================== */

function doGet(e) {

  return HtmlService
    .createHtmlOutput(
      '<!doctype html>' +
      '<html>' +
      '<head>' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Nityaseva OTP Service</title>' +
      '</head>' +
      '<body style="font-family:Arial;padding:30px">' +
      '<h2>Nityaseva OTP Service</h2>' +
      '<p style="color:green">Service is running.</p>' +
      '</body>' +
      '</html>'
    );
}


/* =====================================================
   POST
   ===================================================== */

function doPost(e) {

  try {

    const p = (e && e.parameter) ? e.parameter : {};

    const action = String(p.action || '').trim();
    const email = String(p.email || '').trim().toLowerCase();
    const otp = String(p.otp || '').trim();

    const requestId = String(
      p.requestId || ('req_' + Date.now())
    );

    const parentOrigin = String(
      p.parentOrigin || '*'
    );

    let result;

    if (action === 'sendOtp') {

      result = sendOtp(email);

    } else if (action === 'verifyOtp') {

      result = verifyOtp(email, otp);

    } else {

      result = {
        ok: false,
        message: 'Invalid action.'
      };

    }

    return htmlResponse(
      result,
      requestId,
      parentOrigin
    );

  } catch (err) {

    return htmlResponse(
      {
        ok: false,
        message: 'Server error: ' + err.message
      },
      e && e.parameter
        ? String(e.parameter.requestId || '')
        : '',
      e && e.parameter
        ? String(e.parameter.parentOrigin || '*')
        : '*'
    );
  }
}


/* =====================================================
   SEND OTP
   ===================================================== */

function sendOtp(email) {

  if (!email) {

    return {
      ok: false,
      message: 'Email is required.'
    };

  }

  if (!isValidEmail(email)) {

    return {
      ok: false,
      message: 'Please enter a valid email address.'
    };

  }


  const sheet = getOtpSheet();

  const now = new Date();

  const otp = generateOtp();

  const expiresAt =
    new Date(
      now.getTime() +
      OTP_EXPIRY_MINUTES * 60 * 1000
    );


  /* Store OTP */

  sheet.appendRow([
    now,
    email,
    otp,
    expiresAt,
    0,
    'SENT'
  ]);


  /* Send email */

  const subject =
    'Nityaseva Family Login OTP';

  const body =
    'Dear Nityaseva Family Member,\n\n' +

    'Your Nityaseva verification OTP is:\n\n' +

    otp +

    '\n\nThis OTP is valid for ' +
    OTP_EXPIRY_MINUTES +
    ' minutes.\n\n' +

    'Do not share this OTP with anyone.\n\n' +

    'Regards,\n' +
    'Nityaseva\n' +
    'Eternal service, Timeless care.';


  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });


  return {

    ok: true,

    message:
      'OTP sent successfully.',

    expiresIn:
      OTP_EXPIRY_MINUTES * 60

  };
}


/* =====================================================
   VERIFY OTP
   ===================================================== */

function verifyOtp(email, otp) {

  if (!email || !otp) {

    return {

      ok: false,

      message:
        'Email and OTP are required.'

    };

  }


  const sheet = getOtpSheet();

  const data =
    sheet.getDataRange().getValues();


  if (data.length <= 1) {

    return {

      ok: false,

      message:
        'No OTP found. Please request a new OTP.'

    };

  }


  /*
   * Search newest OTP first.
   */

  for (let i = data.length - 1; i >= 1; i--) {

    const row = data[i];

    const rowEmail =
      String(row[1] || '')
        .trim()
        .toLowerCase();

    const rowOtp =
      String(row[2] || '').trim();

    const expiresAt =
      row[3]
        ? new Date(row[3])
        : null;

    const attempts =
      Number(row[4] || 0);

    const status =
      String(row[5] || '');


    if (rowEmail !== email) {
      continue;
    }


    if (status === 'VERIFIED') {

      return {

        ok: false,

        message:
          'This OTP has already been used.'

      };

    }


    if (status === 'BLOCKED') {

      return {

        ok: false,

        message:
          'Too many attempts. Request a new OTP.'

      };

    }


    if (!expiresAt || expiresAt < new Date()) {

      sheet
        .getRange(i + 1, 6)
        .setValue('EXPIRED');

      return {

        ok: false,

        message:
          'OTP expired. Please request a new OTP.'

      };

    }


    if (attempts >= MAX_ATTEMPTS) {

      sheet
        .getRange(i + 1, 6)
        .setValue('BLOCKED');

      return {

        ok: false,

        message:
          'Too many incorrect attempts.'

      };

    }


    /*
     * Correct OTP
     */

    if (rowOtp === otp) {

      sheet
        .getRange(i + 1, 6)
        .setValue('VERIFIED');


      /*
       * Return success.
       *
       * The frontend will create its own
       * authenticated session.
       */

      return {

        ok: true,

        verified: true,

        email: email,

        message:
          'OTP verified successfully.'

      };

    }


    /*
     * Incorrect OTP
     */

    sheet
      .getRange(i + 1, 5)
      .setValue(attempts + 1);


    return {

      ok: false,

      message:
        'Incorrect OTP.'

    };

  }


  return {

    ok: false,

    message:
      'OTP not found. Please request a new OTP.'

  };

}


/* =====================================================
   HTML RESPONSE
   ===================================================== */

function htmlResponse(
  result,
  requestId,
  parentOrigin
) {

  const json =
    JSON.stringify(result)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');


  /*
   * Only allow http/https origins.
   * Otherwise use "*".
   */

  let targetOrigin = '*';

  if (
    parentOrigin &&
    /^https?:\/\//i.test(parentOrigin)
  ) {

    targetOrigin =
      parentOrigin;

  }


  const html = `

<!doctype html>

<html>

<head>

<meta charset="UTF-8">

<title>Nityaseva OTP</title>

</head>

<body>

<script>

(function(){

  const result = ${json};

  const message = {

    source: 'nityaseva-otp',

    requestId: ${JSON.stringify(requestId)},

    ok: !!result.ok,

    message: result.message || '',

    verified: !!result.verified,

    email: result.email || '',

    expiresIn: result.expiresIn || 0

  };

  try {

    window.parent.postMessage(
      message,
      ${JSON.stringify(targetOrigin)}
    );

  } catch(e) {

    window.parent.postMessage(
      message,
      '*'
    );

  }

})();

</script>

<p>
Nityaseva OTP request processed.
</p>

</body>

</html>

`;


  return HtmlService
    .createHtmlOutput(html);
}


/* =====================================================
   OTP SHEET
   ===================================================== */

function getOtpSheet() {

  if (!SHEET_ID) {

    throw new Error(
      'SHEET_ID is not configured in Script Properties.'
    );

  }


  const ss =
    SpreadsheetApp.openById(SHEET_ID);


  let sheet =
    ss.getSheetByName(OTP_SHEET);


  if (!sheet) {

    sheet =
      ss.insertSheet(OTP_SHEET);

  }


  /*
   * Add header if empty.
   */

  if (sheet.getLastRow() === 0) {

    sheet.appendRow([

      'Created At',

      'Email',

      'OTP',

      'Expires At',

      'Attempts',

      'Status'

    ]);

  }


  return sheet;

}


/* =====================================================
   GENERATE OTP
   ===================================================== */

function generateOtp() {

  return String(
    Math.floor(
      100000 +
      Math.random() * 900000
    )
  );

}


/* =====================================================
   EMAIL VALIDATION
   ===================================================== */

function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


/* =====================================================
   OPTIONAL CLEANUP
   ===================================================== */

function cleanupOldOtps() {

  const sheet =
    getOtpSheet();

  const data =
    sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return;
  }


  const now =
    new Date();


  for (let i = data.length - 1; i >= 1; i--) {

    const createdAt =
      data[i][0]
        ? new Date(data[i][0])
        : null;


    if (
      createdAt &&
      now.getTime() -
      createdAt.getTime() >
      24 * 60 * 60 * 1000
    ) {

      sheet.deleteRow(i + 1);

    }

  }

}
