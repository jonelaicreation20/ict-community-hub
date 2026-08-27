# Connect the pilot to Google Sheets

The app works offline after a student joins. A connection is required when a teacher creates a shared class, when a student joins for the first time, and when queued results are synchronized.

1. Create a blank Google Sheet for the pilot teacher records.
2. In that sheet, open **Extensions → Apps Script**.
3. Replace the editor contents with `Code.gs` from this folder and save.
4. Select **Deploy → New deployment → Web app**.
5. Set **Execute as** to yourself and **Who has access** to anyone using the pilot.
6. Authorize the script, deploy it, and copy the `/exec` URL.
7. Copy `.env.example` to `.env.local` and replace its sample URL with the `/exec` URL.
8. Restart `npm run dev`, or rebuild the deployed app with `npm run build`.

Open the `/exec` URL in a browser. A successful setup displays a small JSON message with `"status":"ready"`.

The script creates three tabs automatically: **Classes**, **Students**, and **Results**. Do not rename their headers while using the pilot.

## Pilot limitations

- This is a low-cost pilot connector, not the final authentication system.
- Treat the sheet as confidential student information and share it only with authorized school staff.
- A student needs internet for their first class-code check. Completed quizzes remain on the device and retry synchronization later.
- If browser storage is cleared, the teacher profile key on that device is lost. The rows remain in the Google Sheet.
