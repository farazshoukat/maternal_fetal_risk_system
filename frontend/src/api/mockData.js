// Simulated Database

export const mockPatients = [
  {
    id: "p-001",
    name: "Sarah Jenkins",
    age: 28,
    gestationalAge: "32 weeks",
    status: "High Risk",
    lastVisit: "2023-10-24",
    vitalsHistory: [
      { date: "2023-10-14", systolicBP: 125, diastolicBP: 82, bloodSugar: 6.9, bodyTemp: 36.8, heartRate: 80 },
      { date: "2023-10-17", systolicBP: 128, diastolicBP: 84, bloodSugar: 7.1, bodyTemp: 36.9, heartRate: 82 },
      { date: "2023-10-20", systolicBP: 130, diastolicBP: 85, bloodSugar: 7.2, bodyTemp: 36.8, heartRate: 82 },
      { date: "2023-10-22", systolicBP: 135, diastolicBP: 88, bloodSugar: 7.5, bodyTemp: 36.8, heartRate: 85 },
      { date: "2023-10-24", systolicBP: 142, diastolicBP: 92, bloodSugar: 8.1, bodyTemp: 37.0, heartRate: 90 }
    ],
    fetalStatus: "Suspect"
  },
  {
    id: "p-002",
    name: "Emily Chen",
    age: 34,
    gestationalAge: "24 weeks",
    status: "Low Risk",
    lastVisit: "2023-10-25",
    vitalsHistory: [
      { date: "2023-10-10", systolicBP: 108, diastolicBP: 68, bloodSugar: 5.2, bodyTemp: 36.5, heartRate: 70 },
      { date: "2023-10-15", systolicBP: 110, diastolicBP: 70, bloodSugar: 5.4, bodyTemp: 36.4, heartRate: 72 },
      { date: "2023-10-20", systolicBP: 115, diastolicBP: 72, bloodSugar: 5.6, bodyTemp: 36.5, heartRate: 74 },
      { date: "2023-10-23", systolicBP: 113, diastolicBP: 71, bloodSugar: 5.5, bodyTemp: 36.5, heartRate: 73 },
      { date: "2023-10-25", systolicBP: 112, diastolicBP: 70, bloodSugar: 5.5, bodyTemp: 36.4, heartRate: 73 }
    ],
    fetalStatus: "Normal"
  },
  {
    id: "p-003",
    name: "Maria Rodriguez",
    age: 22,
    gestationalAge: "38 weeks",
    status: "Mid Risk",
    lastVisit: "2023-10-23",
    vitalsHistory: [
      { date: "2023-10-05", systolicBP: 118, diastolicBP: 78, bloodSugar: 6.5, bodyTemp: 36.7, heartRate: 76 },
      { date: "2023-10-10", systolicBP: 120, diastolicBP: 80, bloodSugar: 6.8, bodyTemp: 36.7, heartRate: 78 },
      { date: "2023-10-18", systolicBP: 125, diastolicBP: 82, bloodSugar: 6.9, bodyTemp: 36.6, heartRate: 80 },
      { date: "2023-10-23", systolicBP: 128, diastolicBP: 84, bloodSugar: 7.0, bodyTemp: 36.9, heartRate: 82 }
    ],
    fetalStatus: "Normal"
  },
  {
    id: "p-004",
    name: "Aisha Patel",
    age: 31,
    gestationalAge: "20 weeks",
    status: "Low Risk",
    lastVisit: "2023-10-26",
    vitalsHistory: [
      { date: "2023-10-12", systolicBP: 105, diastolicBP: 65, bloodSugar: 4.9, bodyTemp: 36.4, heartRate: 68 },
      { date: "2023-10-18", systolicBP: 108, diastolicBP: 67, bloodSugar: 5.0, bodyTemp: 36.5, heartRate: 70 },
      { date: "2023-10-26", systolicBP: 110, diastolicBP: 68, bloodSugar: 5.1, bodyTemp: 36.5, heartRate: 71 }
    ],
    fetalStatus: "Normal"
  },
  {
    id: "p-005",
    name: "Fatima Hassan",
    age: 26,
    gestationalAge: "35 weeks",
    status: "High Risk",
    lastVisit: "2023-10-24",
    vitalsHistory: [
      { date: "2023-10-10", systolicBP: 138, diastolicBP: 90, bloodSugar: 7.8, bodyTemp: 37.1, heartRate: 88 },
      { date: "2023-10-16", systolicBP: 143, diastolicBP: 93, bloodSugar: 8.0, bodyTemp: 37.2, heartRate: 91 },
      { date: "2023-10-20", systolicBP: 148, diastolicBP: 96, bloodSugar: 8.3, bodyTemp: 37.3, heartRate: 94 },
      { date: "2023-10-24", systolicBP: 152, diastolicBP: 99, bloodSugar: 8.7, bodyTemp: 37.4, heartRate: 96 }
    ],
    fetalStatus: "Pathological"
  },
  {
    id: "p-006",
    name: "Priya Sharma",
    age: 29,
    gestationalAge: "28 weeks",
    status: "Mid Risk",
    lastVisit: "2023-10-22",
    vitalsHistory: [
      { date: "2023-10-08", systolicBP: 122, diastolicBP: 79, bloodSugar: 6.6, bodyTemp: 36.7, heartRate: 77 },
      { date: "2023-10-15", systolicBP: 126, diastolicBP: 81, bloodSugar: 6.9, bodyTemp: 36.8, heartRate: 79 },
      { date: "2023-10-22", systolicBP: 129, diastolicBP: 83, bloodSugar: 7.0, bodyTemp: 36.9, heartRate: 81 }
    ],
    fetalStatus: "Suspect"
  }
];

export const mockCurrentUser = {
  id: "pat-current",
  name: "Jane Doe",
  age: 26,
  gestationalAge: "28 weeks",
  history: [
    { id: 1, date: "2023-10-19", systolicBP: 116, diastolicBP: 74, bloodSugar: 5.9, bodyTemp: 36.6, heartRate: 74, risk: "Low Risk" },
    { id: 2, date: "2023-10-21", systolicBP: 118, diastolicBP: 76, bloodSugar: 6.0, bodyTemp: 36.5, heartRate: 75, risk: "Low Risk" },
    { id: 3, date: "2023-10-23", systolicBP: 122, diastolicBP: 80, bloodSugar: 6.2, bodyTemp: 36.6, heartRate: 78, risk: "Low Risk" }
  ]
};
