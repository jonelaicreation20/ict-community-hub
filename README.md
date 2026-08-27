# Community ICT Hub

A phone-first, offline-capable learning app for Empowerment Technologies modules and quizzes.

## Pilot classroom flow

- A teacher creates one class and receives a six-digit code.
- A student enters the code, confirms the class, and registers a name and email.
- Lessons and quizzes continue to work offline after registration.
- Completed quiz results are queued on the device and synchronized to the teacher's Google Sheet when a connection returns.
- The teacher dashboard can refresh the records and download an Excel-compatible CSV file.

Without `NEXT_PUBLIC_SHEET_ENDPOINT`, the app runs in demo mode. A locally created code works only in the same browser. Follow [the Google Apps Script setup](integrations/google-apps-script/SETUP.md) before testing with different devices.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks and static deployment

```bash
npm run lint
npm run build
```

The production-ready static files are generated in `out/`.
