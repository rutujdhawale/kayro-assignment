// Vercel Serverless Function for GET /api/appointments
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const appointments = [
    {
      "id": "apt-1",
      "clientName": "Riya Shah",
      "phone": "+91 98200 11111",
      "date": "2026-10-24",
      "time": "10:00",
      "status": "Booked",
      "confirmedArrival": false,
      "reminderSent": false,
      "format": "in-person"
    },
    {
      "id": "apt-2",
      "clientName": "Arjun Mehta",
      "phone": "+91 98200 22222",
      "date": "2026-10-24",
      "time": "11:30",
      "status": "Booked",
      "confirmedArrival": true,
      "reminderSent": true,
      "format": "in-person"
    },
    {
      "id": "apt-3",
      "clientName": "Riya Shah",
      "phone": "+91 98200 11111",
      "date": "2026-10-25",
      "time": "16:00",
      "status": "Booked",
      "confirmedArrival": false,
      "reminderSent": false,
      "format": "virtual"
    },
    {
      "id": "apt-4",
      "clientName": "Meera Iyer",
      "phone": "",
      "date": "2026-10-23",
      "time": "09:00",
      "status": "Done",
      "confirmedArrival": true,
      "reminderSent": true,
      "format": "in-person"
    },
    {
      "id": "apt-5",
      "clientName": "Kabir Rao",
      "phone": "+91 98200 33333",
      "date": "2026-10-22",
      "time": "14:00",
      "status": "No-show",
      "confirmedArrival": false,
      "reminderSent": false,
      "format": "virtual"
    }
  ];

  res.status(200).json(appointments);
};
