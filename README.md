# Kayro Nourish • Mindful Consultations Platform

A calm, minimal, dual-sided appointments web app for wellness practices, built for the **Kayro AI Product Intern Assignment**.

---

## 🧭 How It Works

### 1. Client View (`/`)
- **Fresh Visitor Landing:** When opened, the user sees **Dr. Maya Sen’s profile** (M.Sc. Clinical Nutrition, 10+ yrs experience) and a direct button to **Book an appointment**. No other client's private bookings are ever exposed.
- **Personal Consultation View:** Once booked (or when a returning client enters their number), the app switches to their private space:
  - 1-tap pre-session confirmation (**"Yes, I'm coming"**) to reduce no-shows.
  - 1-time reschedule limit (protects practice capacity).
  - Smooth 1-tap cancellation (instantly frees the slot).
  - Organized upcoming and past consultations history.
  - An **Exit** link to return to the doctor profile anytime.

### 2. Nutritionist Dashboard (`/#dashboard` or `/dashboard`)
- Full schedule overview with real-time status pills: `Booked` (Blue), `Done` (Emerald), `No-show` (Amber), `Cancelled` (Slate).
- **Early Risk Detection:** Bookings not yet confirmed show as `⚠️ Unconfirmed`, alerting the doctor ahead of time.
- **Reminder Tracking:** Dedicated reminder column with 1-click `Remind` → `✓ Sent` toggle.
- **Today Filter:** Quick filter for today's active consultations (`2026-10-24`).
- **Excel Export:** 1-click `.csv` download with UTF-8 BOM encoding for Excel compatibility.
- **Add Consultation:** Quick modal to add bookings by hand.

### 3. Dual-Mode REST API (`/api/appointments`)
- **In Browser:** Renders a visual HTML report with live counts, status colors, and a collapsible payload.
- **Programmatic (`fetch` / `curl`):** Returns clean JSON data with zero caching.

---

## 💡 What We Added & Why (In One Line)
> **We added a 1-tap "Still Coming?" confirmation step that flags unconfirmed bookings early on the dashboard, paired with reminder tracking and an explicit "Cancelled" status to free slots without corrupting attendance metrics.**

---

## 🎬 2-Minute Demo Walkthrough

1. **First Arrival (Doctor Landing):**
   - Open [http://localhost:3000](http://localhost:3000).
   - Notice Dr. Maya Sen's credentials and the prominent **"Book an appointment"** CTA. No other person's details are shown.
2. **Book a Consultation:**
   - Click **"Book an appointment"**.
   - Enter your name and 10-digit phone number.
   - Pick a date and time slot (slots clearly indicate `Free` vs `Taken`, past dates are disabled).
   - Tap **"Confirm consultation"** — instant toast appears, and your personal consultation view loads.
3. **Preventing Duplicate Bookings:**
   - Try booking another session for the same slot or while holding an active booking. The app politely reminds you that an appointment is already booked.
4. **1-Tap Check-In:**
   - On your next consultation card, tap **"Yes, I'm coming"**.
   - It marks the appointment as `✓ Confirmed`.
5. **Nutritionist View & Excel:**
   - Click **"Nutritionist view"** in the footer.
   - See the confirmed appointment and unconfirmed risks.
   - Click **"Remind"** on an unconfirmed client to log a reminder.
   - Tap **"Download Excel"** to export the entire roster.
6. **Cancellation & Slot Release:**
   - Back in Client view, tap **"Cancel consultation"**.
   - The slot is freed instantly, moves to "Past consultations", and shows a toast.

---

## 📑 Assignment Deliverables
- **[Part 1 Puzzle Answer](PART1_PUZZLE_ANSWER.md):** The behavioral psychology behind the 25% no-show problem and our 3-part fix.
- **[Part 2 Documentation](DOCUMENTATION.md):** Product decisions, sample data normalization, gaps, and AI corrections.
- **[Original Brief](Kayro-Intern-Assignment.pdf):** The Kayro AI intern assignment prompt.

---

## 🚀 How to Run Locally

### Requirements
- Python 3.8+ (Zero dependencies — uses Python's built-in `http.server`).

```bash
python server.py
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
