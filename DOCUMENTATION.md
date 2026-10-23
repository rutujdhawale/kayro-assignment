# Product & Technical Documentation

---

## 1. What We Were Asked
Build a lightweight, human-centered appointments product with two sides sharing the same live data:
- **Side A (Client App):** Mobile-first, polished consumer feel. Show the client's next appointment, book a consultation without double bookings, view upcoming/past consultations, and reschedule or cancel.
- **Side B (Nutritionist Dashboard):** List appointments with name, phone, date, time, and status (`Booked`, `Done`, `No-show` in distinct colors). Ability to change status, add an appointment by hand, filter to today's consultations, and load sample data.
- **Part 1 Integration:** Include at least one feature that helps solve the 25% no-show problem.
- **Add what was missed:** Identify missing requirements, build them, and articulate what was added and why.

---

## 2. Your Approach
Rather than building an artificial marketing presentation or a heavyweight admin panel, we designed **Kayro Nourish** as a calm, distraction-free product:
- **Pure CSS Responsiveness:** Designed for 390px mobile viewports first with 16px side padding, 44px minimum tap targets, and bottom-anchored booking CTA. On desktop (`md` and up), the client view centers in a `max-w-md` column, and the nutritionist view expands to a clean `max-w-4xl` table.
- **Persistent Memory & REST Endpoint:** Backed by persistent storage (`localStorage` synchronized with a lightweight REST endpoint at `/api/appointments`), ensuring state persists across page refreshes and server restarts.
- **Slot Transparency & Past-Date Guard:** The slot grid explicitly renders available slots (`Free`) and reserved slots (`Taken`). Past calendar dates and past daily times are locked out.
- **Quiet Routing:** Default route (`/`) is the Client App; `/dashboard` (or `#/dashboard`) is the Nutritionist Dashboard. A small text link in the footer transitions between views.

---

## 3. Decisions and Assumptions (Including Sample Data Handling)

### Handling Sample Data
The assignment data contained real-world inconsistencies:
- **Inconsistent date formats:** `24/10/2026`, `2026-10-24`, and `25-10-2026`. We built a normalization parser that standardizes all dates into ISO `YYYY-MM-DD` for chronological sorting while presenting clean readable dates (`Sat, Oct 24, 2026`) in the UI.
- **Inconsistent time formats:** `10:00`, `11:30am`, `4 pm`, `09:00`, `14:00`. Normalized into 24-hour time (`16:00`) for conflict checks and rendered in human 12-hour format (`4:00 PM`).
- **Phone numbers & validation:** Enforced exactly 10-digit mobile number validation (`^\d{10}$`) on bookings to guarantee reliable SMS/WhatsApp contact. `Meera Iyer` had no phone number in the original table; we preserved this record safely without throwing exceptions or breaking call/WhatsApp links.
- **Duplicate Bookings in Mock Data (Riya Shah):** Riya Shah appears twice (Oct 24 at 10:00 AM and Oct 25 at 4:00 PM), directly violating the "no double booking" rule. This is typical of WhatsApp/Excel tracking where a reschedule is logged without deleting the old row. We preserved the historic record while building strict validation and atomic rescheduling so this cannot happen in software.
- **Today's Date:** The mock schedule centers around `2026-10-24` as "Today", showing Riya and Arjun's appointments when filtering for today.

### Key Product Decisions
1. **Added a 4th Status — `Cancelled`:** The brief specified only `Booked`, `Done`, and `No-show`. If a client cancels, marking them as `No-show` corrupts attendance analytics, and deleting them erases audit history. We added `Cancelled` (slate grey), which preserves the record and immediately frees the time slot.
2. **Defined Working Hours & Slot Intervals:** Established standard operating hours: **09:00–13:00** and **14:00–17:00** in **30-minute intervals**, with a **13:00–14:00 lunch break** and past slots disabled.
3. **Pre-Session Check-in ("Still Coming?") & Reminder Tracking:** Passive reminders don't prevent no-shows. We added an interactive 1-tap confirmation step on the client's next appointment card (`Yes, I'm coming`). On the dashboard, unconfirmed bookings are flagged with an early warning marker (`⚠️ Unconfirmed`), and a dedicated **Reminder** column allows 1-click confirmation pings (`Remind` → `✓ Sent`) with instant toast feedback.
4. **Atomic Rescheduling & 1-Time Rule:** Rescheduling frees the old slot and reserves the new slot in a single transactional step, eliminating any window for duplicate bookings. A 1-time reschedule rule prevents clients from repeatedly pushing bookings without notice.
5. **Duplicate Booking Prevention:** If a client with the same name or phone number attempts to book another session while having an active upcoming booking, the system politely alerts them via toast: *"Already present! You already have an active booking on [Date] at [Time]"*.
6. **Standardized +91 Mobile Formatting:** All phone inputs feature a clean `+91` prefix group, and all phone displays across client views, dashboard tables, and Excel exports consistently format numbers as `+91 XXXXX XXXXX`.
7. **Dual-Mode Visual & JSON API Endpoint:** Navigating directly to `/api/appointments` in a browser renders a color-coded live appointments dashboard with summary stats and a collapsible raw JSON payload, while programmatic requests (`fetch` or `?format=json`) return pure JSON.
8. **No "Testing As" Distractions:** Removed test persona dropdowns. The client app uses the user's phone session with a quiet "Switch number" option.
9. **Doctor Landing & Patient Privacy Isolation:** First-time visitors see Dr. Maya Sen's bio and credentials with a direct "Book an appointment" button. We never default to another client's personal consultations on arrival.
10. **Cancellation Safety Guard:** Protects clients from accidental cancellations with an explicit confirmation dialog before releasing their reserved slot.

---

## 4. What You Added

### In One Line:
> **We added an interactive 1-Tap "Still Coming?" pre-session confirmation step that flags unconfirmed bookings as early risks on the dashboard, paired with a dedicated Reminder tracking column and an explicit "Cancelled" status to free slots without corrupting attendance metrics.**

### Why:
Nutrition clients ghost due to diet shame, procrastination, or commute friction. Giving them a 1-tap confirmation turns blind no-shows into predictable advance notices, a dedicated reminder column keeps the nutritionist organized with 1-click toast confirmations, and an explicit `Cancelled` status keeps the slot inventory accurate without skewing historical data.

### Gaps We Didn’t Build (Be Upfront About):
- **Client Authentication:** The demo identifies clients by phone number. In production, this requires SMS OTP authentication to prevent unauthorized cancellations.
- **Dashboard Access Control:** The brief asked for a link that opens without login. In production, the practitioner dashboard requires role-based authentication or a PIN.
- **Cancellation Cutoff Rule:** A cancellation 5 minutes before the session is effectively a no-show. A production rule (e.g., free cancellations up to 4 hours before) is needed.

---

## 5. What the AI Got Wrong (and How We Caught and Fixed It)
1. **Unnecessary Marketing Wrapper & Fake Bezels:**
   - *What happened:* The AI initially generated an elaborate presentation wrapper with a simulated iPhone bezel, dynamic island, marketing sidebar, and device toggle badges.
   - *Why it was wrong:* It treated the app like a design mockup rather than a real, usable web application that fills the screen naturally.
   - *The fix:* Stripped away all fake bezels, device toggles, and sidecards. Replaced them with pure CSS responsive layout (single-column max-w-md on mobile; max-w-4xl clean table on desktop).
2. **Color Names in Dropdown Text:**
   - *What happened:* The AI placed descriptive color labels in the dropdown text (e.g., `"Booked (Blue)"`).
   - *Why it was wrong:* UI labels should be clean and professional; the color should be conveyed strictly through visual CSS pills, not textual explanations.
   - *The fix:* Cleaned all options to `Booked`, `Done`, `No-show`, and `Cancelled`.
3. **Slot Deletion on Cancel:**
   - *What happened:* The AI originally deleted cancelled appointments from memory entirely.
   - *The fix:* Introduced the `Cancelled` status so the slot is released on the calendar while maintaining an accurate clinical audit log.

---

## 6. How to Run It

### Local Development
```bash
python server.py
```
Open [http://localhost:3000](http://localhost:3000) for the Client app, [http://localhost:3000/#dashboard](http://localhost:3000/#dashboard) for the Nutritionist dashboard, and [http://localhost:3000/api/appointments](http://localhost:3000/api/appointments) for the live REST API endpoint.

### Deployment (Vercel)
1. Push this folder to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. `vercel.json` and `api/appointments.js` automatically handle `/dashboard` rewrites and the serverless REST API endpoint with zero configuration.
