import http.server
import socketserver
import json
import os
import urllib.parse
import sys

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'appointments.json')

RAW_SAMPLE_DATA = [
    {
        "id": "apt-1",
        "clientName": "Riya Shah",
        "phone": "+91 98200 11111",
        "date": "2026-10-24",
        "time": "10:00",
        "status": "Booked",
        "confirmedArrival": False,
        "reminderSent": False,
        "format": "in-person"
    },
    {
        "id": "apt-2",
        "clientName": "Arjun Mehta",
        "phone": "+91 98200 22222",
        "date": "2026-10-24",
        "time": "11:30",
        "status": "Booked",
        "confirmedArrival": True,
        "reminderSent": True,
        "format": "in-person"
    },
    {
        "id": "apt-3",
        "clientName": "Meera Iyer",
        "phone": "",
        "date": "2026-10-23",
        "time": "09:00",
        "status": "Done",
        "confirmedArrival": True,
        "reminderSent": True,
        "format": "in-person"
    },
    {
        "id": "apt-4",
        "clientName": "Kabir Rao",
        "phone": "+91 98200 33333",
        "date": "2026-10-22",
        "time": "14:00",
        "status": "No-show",
        "confirmedArrival": False,
        "reminderSent": True,
        "format": "in-person"
    }
]

# Ensure data file exists with default sample data
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(RAW_SAMPLE_DATA, f, indent=2)

def load_data():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return RAW_SAMPLE_DATA

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def format_phone_display(phone):
    if not phone:
        return '<span style="color:#B45309; background:#FEF3C7; padding:2px 8px; border-radius:4px; font-size:11.5px; font-weight:600;">No phone on file</span>'
    import re
    digits = re.sub(r'\D', '', str(phone))
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith('0'):
        digits = digits[1:]
    if len(digits) == 10:
        return f'+91 {digits[:5]} {digits[5:]}'
    return phone if str(phone).startswith('+91') else f'+91 {phone}'

def render_api_html(data):
    sorted_data = sorted(data, key=lambda a: f"{a.get('date', '')} {a.get('time', '')}")
    total = len(sorted_data)
    booked = sum(1 for a in sorted_data if a.get('status') == 'Booked')
    done = sum(1 for a in sorted_data if a.get('status') == 'Done')
    noshow = sum(1 for a in sorted_data if a.get('status') == 'No-show')
    cancelled = sum(1 for a in sorted_data if a.get('status') == 'Cancelled')

    rows_html = []
    for a in sorted_data:
        status = a.get('status', 'Booked')
        phone = format_phone_display(a.get('phone', ''))
        confirmed = '<span style="color:#047857; font-weight:600; font-size:12px;">✓ Confirmed</span>' if a.get('confirmedArrival') else '<span style="color:#B45309; font-weight:600; font-size:12px;">⚠️ Unconfirmed</span>'
        reminder = '<span style="color:#047857; font-weight:600; font-size:12px;">✓ Sent</span>' if a.get('reminderSent') else '<span style="color:#78716C; font-size:12px;">Pending</span>'
        
        status_colors = {
            'Booked': ('#EFF6FF', '#1D4ED8', '#BFDBFE'),
            'Done': ('#ECFDF5', '#047857', '#A7F3D0'),
            'No-show': ('#FEF2F2', '#DC2626', '#FECACA'),
            'Cancelled': ('#F5F5F4', '#78716C', '#E7E5E4')
        }
        bg, text, border = status_colors.get(status, ('#F5F5F4', '#78716C', '#E7E5E4'))
        status_pill = f'<span style="background:{bg}; color:{text}; border:1px solid {border}; padding:3px 10px; border-radius:100px; font-weight:600; font-size:12px;">{status}</span>'
        
        rows_html.append(f"""
        <tr style="border-bottom:1px solid #E8E2D9;">
            <td style="padding:12px 14px; font-weight:600;">{a.get('clientName', '-')}</td>
            <td style="padding:12px 14px; color:#44403C;">{phone}</td>
            <td style="padding:12px 14px; color:#44403C;">{a.get('date', '-')}</td>
            <td style="padding:12px 14px; color:#44403C;">{a.get('time', '-')}</td>
            <td style="padding:12px 14px;">{status_pill}</td>
            <td style="padding:12px 14px;">{confirmed}</td>
            <td style="padding:12px 14px;">{reminder}</td>
        </tr>
        """)

    json_str = json.dumps(data, indent=2)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kayro Nourish • Live Appointments API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background-color: #FAF8F5;
      color: #1C1917;
      padding: 32px 20px 60px 20px;
      line-height: 1.5;
    }}
    .container {{
      max-width: 980px;
      margin: 0 auto;
    }}
    header {{
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #E8E2D9;
    }}
    h1 {{
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }}
    .endpoint-badge {{
      display: inline-block;
      background: #E8E2D9;
      color: #44403C;
      font-family: monospace;
      font-size: 13px;
      padding: 3px 8px;
      border-radius: 4px;
      margin-top: 4px;
    }}
    .nav-actions {{
      display: flex;
      gap: 10px;
      align-items: center;
    }}
    .btn {{
      display: inline-block;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid #D5CCC0;
      background: #FFFFFF;
      color: #1C1917;
      transition: all 0.2s;
    }}
    .btn:hover {{
      background: #F3EFEA;
    }}
    .btn-primary {{
      background: #C85A32;
      border-color: #C85A32;
      color: #FFFFFF;
    }}
    .btn-primary:hover {{
      background: #B44E28;
    }}
    .stats-row {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }}
    .stat-card {{
      background: #FFFFFF;
      border: 1px solid #E8E2D9;
      border-radius: 8px;
      padding: 12px 14px;
    }}
    .stat-val {{
      font-size: 22px;
      font-weight: 700;
    }}
    .stat-label {{
      font-size: 11.5px;
      font-weight: 600;
      color: #78716C;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .table-card {{
      background: #FFFFFF;
      border: 1px solid #E8E2D9;
      border-radius: 12px;
      overflow-x: auto;
      margin-bottom: 32px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13.5px;
    }}
    th {{
      background: #F9F6F0;
      padding: 12px 14px;
      font-size: 11.5px;
      font-weight: 700;
      color: #78716C;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #E8E2D9;
    }}
    .json-section {{
      background: #FFFFFF;
      border: 1px solid #E8E2D9;
      border-radius: 12px;
      padding: 20px;
    }}
    .json-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }}
    pre {{
      background: #1C1917;
      color: #A7F3D0;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: monospace;
      font-size: 12.5px;
      max-height: 400px;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Kayro Nourish • Live Appointments API</h1>
        <span class="endpoint-badge">GET /api/appointments</span>
      </div>
      <div class="nav-actions">
        <a href="/" class="btn">← Client View</a>
        <a href="/#dashboard" class="btn">Nutritionist Dashboard</a>
        <a href="/api/appointments?format=json" target="_blank" class="btn btn-primary">Raw JSON Payload</a>
      </div>
    </header>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-val">{total}</div>
        <div class="stat-label">Total Appointments</div>
      </div>
      <div class="stat-card" style="border-left: 3px solid #1D4ED8;">
        <div class="stat-val" style="color: #1D4ED8;">{booked}</div>
        <div class="stat-label">Booked</div>
      </div>
      <div class="stat-card" style="border-left: 3px solid #047857;">
        <div class="stat-val" style="color: #047857;">{done}</div>
        <div class="stat-label">Done</div>
      </div>
      <div class="stat-card" style="border-left: 3px solid #DC2626;">
        <div class="stat-val" style="color: #DC2626;">{noshow}</div>
        <div class="stat-label">No-show</div>
      </div>
      <div class="stat-card" style="border-left: 3px solid #78716C;">
        <div class="stat-val" style="color: #78716C;">{cancelled}</div>
        <div class="stat-label">Cancelled</div>
      </div>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Phone (+91)</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status Code</th>
            <th>Arrival Status</th>
            <th>Reminder Sent</th>
          </tr>
        </thead>
        <tbody>
          {"".join(rows_html)}
        </tbody>
      </table>
    </div>

    <div class="json-section">
      <div class="json-header">
        <strong style="font-size: 14px;">Raw JSON Output (application/json)</strong>
        <button type="button" class="btn" onclick="navigator.clipboard.writeText(document.getElementById('rawJsonCode').textContent); alert('JSON copied to clipboard!');">Copy JSON</button>
      </div>
      <pre><code id="rawJsonCode">{json_str}</code></pre>
    </div>
  </div>
</body>
</html>
"""

class KayroServerHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable caching for fresh SPA development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # REST Endpoint to see all bookings & statuses with persistent memory
        if parsed.path == '/api/appointments':
            data = load_data()
            query_params = urllib.parse.parse_qs(parsed.query)
            format_param = query_params.get('format', [''])[0].lower()
            accept_header = self.headers.get('Accept', '')

            # Return raw JSON if explicitly requested via query parameter ?format=json
            # OR if Accept header requests application/json without text/html
            wants_json = (format_param == 'json') or ('application/json' in accept_header and 'text/html' not in accept_header)

            if wants_json:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))
            else:
                html_content = render_api_html(data)
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
            return

        # SPA fallback: /dashboard serves index.html
        if parsed.path == '/dashboard':
            self.path = '/index.html'

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/appointments':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                new_data = json.loads(body.decode('utf-8'))
                save_data(new_data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
            return

        if parsed.path == '/api/reset':
            save_data(RAW_SAMPLE_DATA)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(RAW_SAMPLE_DATA).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    if BASE_DIR:
        os.chdir(BASE_DIR)

    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    elif 'PORT' in os.environ:
        try:
            port = int(os.environ['PORT'])
        except ValueError:
            pass

    socketserver.TCPServer.allow_reuse_address = True

    candidate_ports = [port] + [p for p in [3000, 3001, 8000, 8080] if p != port]
    httpd = None
    active_port = None

    for p in candidate_ports:
        try:
            httpd = socketserver.TCPServer(("", p), KayroServerHandler)
            active_port = p
            break
        except OSError:
            continue

    if not httpd:
        print(f"Error: Could not bind to any of the ports {candidate_ports}. Please free port {port} and try again.")
        sys.exit(1)

    print("\n========================================================", flush=True)
    print("  Kayro Nourish Server is running!", flush=True)
    print(f"  Client App:    http://localhost:{active_port}/", flush=True)
    print(f"  Dashboard:     http://localhost:{active_port}/#dashboard", flush=True)
    print(f"  API Endpoint:  http://localhost:{active_port}/api/appointments", flush=True)
    print("========================================================\n", flush=True)
    print("Press Ctrl+C to stop the server.\n", flush=True)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped gracefully.")
        httpd.server_close()
