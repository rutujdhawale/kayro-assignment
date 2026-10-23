# Kayro Nourish • Mindful Consultations Platform

A calm, minimal, dual-sided appointments web app for wellness practices, built for the **Kayro AI Product Intern Assignment**.

---

## Demo Video

<video src="demo.mp4" controls="controls" width="100%">
 <a href="demo.mp4">Click here to play</a>.
</video>

*Direct link:* [Watch demo.mp4](demo.mp4)

---

## 🚀 How to Run from Scratch

### 1. Prerequisites
- **Python 3.8+** (installed by default on macOS and most Linux distros; download for Windows from [python.org](https://python.org)).
- *Zero npm packages or pip dependencies required* — runs entirely on Python's built-in standard library.

### 2. Clone the Repository
```bash
git clone https://github.com/rutujdhawale/kayro-assignment.git
cd kayro-assignment
```

### 3. Start the Local Server
```bash
python server.py
```
*(On some macOS/Linux setups, run `python3 server.py`)*

### 4. Open in Your Browser
- **Client App:** [http://localhost:3000](http://localhost:3000)
- **Nutritionist Dashboard:** [http://localhost:3000/#dashboard](http://localhost:3000/#dashboard)
- **Live API Endpoint:** [http://localhost:3000/api/appointments](http://localhost:3000/api/appointments)

> **Alternative (Without Python):**
> You can also open `index.html` using VS Code Live Server or run `npx serve .` in the folder.
> To deploy online in 10 seconds, import this repo into [Vercel](https://vercel.com) — `vercel.json` and `api/appointments.js` are already configured.

---

## How It Works

### 1. Client View (`/`)
- **Doctor Profile on Arrival:** When opened, visitors see Dr. Maya Sen's bio, credentials, and a direct button to **Book an appointment**. No other client's private bookings are ever exposed.
- **Personal Consultation View:** Once booked (or when a returning client enters their phone number), the app switches to their private space:
  - 1-tap pre-session confirmation (**"Yes, I'm coming"**) to reduce no-shows.
  - 1-time reschedule limit (protects calendar capacity).
  - Safe cancellation with an **"Are you sure?"** confirmation prompt (frees the slot immediately).
  - Organized upcoming and past history.
  - An **Exit** link to return to the doctor landing anytime.

### 2. Nutritionist Dashboard (`/#dashboard`)
- Full schedule overview with color-coded status badges: `Booked` (Blue), `Done` (Green), `No-show` (Amber), `Cancelled` (Slate).
- **Early Risk Detection:** Bookings not yet confirmed show as `⚠️ Unconfirmed`, alerting the doctor ahead of time.
- **Reminder Tracking:** 1-click `Remind` → `✓ Sent` toggle with toast confirmations.
- **Today Filter:** Quick filter for today's active schedule (`2026-10-24`).
- **Excel Export:** 1-click `.csv` download formatted for Microsoft Excel (UTF-8 BOM).
- **Add Consultation:** Quick modal to record a booking manually.

### 3. Dual-Mode REST API (`/api/appointments`)
- **Browser:** Renders a clean visual report with live counts, status colors, and collapsible JSON.
- **Code / API (`fetch` / `curl`):** Returns raw JSON with no-cache headers.

---

## What We Added & Why 
> **We added an interactive 1-tap "Still Coming?" confirmation step that flags unconfirmed bookings early on the dashboard, paired with reminder tracking, confirmation on cancellation, and an explicit "Cancelled" status to free slots without corrupting attendance metrics.**

---

## Demo Walkthrough

1. **First Arrival (Doctor Profile):**
   - Open [http://localhost:3000](http://localhost:3000).
   - Notice Dr. Maya Sen's credentials and the direct **"Book an appointment"** CTA. No private data is leaked.
2. **Book a Consultation:**
   - Click **"Book an appointment"**.
   - Enter your name and 10-digit mobile number (`+91`).
   - Pick a date and time slot (slots show `Free` vs `Taken`, past dates are disabled).
   - Tap **"Confirm consultation"** — instant toast appears, and your personal consultation view loads.
3. **Duplicate Booking Guard:**
   - Try booking another session for the same slot. The app politely prevents duplicate bookings.
4. **1-Tap Check-In:**
   - On the consultation card, tap **"Yes, I'm coming"** → marks the appointment as `✓ Confirmed`.
5. **Nutritionist View & Reminders:**
   - Click **"Nutritionist view"** in the footer.
   - See the confirmed appointment and unconfirmed risks.
   - Click **"Remind"** on an unconfirmed client to log a reminder.
   - Tap **"Download Excel"** to export the entire roster.
6. **Cancellation with Confirmation:**
   - Back in Client view, tap **"Cancel consultation"**.
   - An **"Are you sure?"** confirmation dialog appears.
   - Once confirmed, the slot is freed immediately, moves to "Past consultations", and shows a toast.

---

## 📑 Assignment Deliverables
- **[Part 1: Puzzle Answer](PART1_PUZZLE_ANSWER.pdf):** The behavioral psychology behind the 25% no-show problem and 3-part fix.
- **[Part 2: Product Documentation](DOCUMENTATION.pdf):** Product decisions, sample data normalization, trade-offs, and AI corrections.
- **[Product Collaboration Log](CHAT_LOG.pdf):** Raw, unedited prompt logs showing product decision-making and AI direction.
- **[Original Brief](Kayro-Intern-Assignment.pdf):** The Kayro AI intern assignment prompt.
