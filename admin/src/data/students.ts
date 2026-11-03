import type { Student } from "@/types";
import { daysAfter, daysBefore, pad, pick } from "./helpers";

// Made-up people with example.com addresses. Nothing here is real.
const names = [
  "Aarav Sharma", "Diya Patel", "Rohan Mehta", "Ananya Iyer", "Kabir Singh", "Meera Nair", "Vihaan Gupta",
  "Isha Reddy", "Arjun Verma", "Saanvi Joshi", "Reyansh Das", "Kiara Menon", "Aditya Rao", "Navya Kapoor",
  "Dev Malhotra", "Tara Bose", "Yash Chopra", "Riya Sen", "Karan Bhatt", "Pooja Desai", "Nikhil Jain",
  "Sneha Pillai", "Harsh Agarwal", "Aditi Kulkarni", "Manav Saxena", "Ishaan Khanna", "Myra Banerjee", "Zoya Ansari",
];

const cities = ["Pune", "Delhi", "Mumbai", "Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Jaipur", "Lucknow", "Ahmedabad"];

const colleges = [
  "Apex Medical College",
  "Lotus Institute of Medical Sciences",
  "Riverside Medical College",
  "Crescent Institute of Medicine",
  "Northfield Medical College",
  "Summit Institute of Health Sciences",
];

// Which plan each student has. null = no paid plan.
const planCycle: (string | null)[] = ["p-004", "p-003", null, "p-002", "p-001", "p-003", "p-004", null, "p-002", "p-003"];

export const studentsData: Student[] = names.map((name, i) => {
  const planId = pick(planCycle, i);
  return {
    id: `stu-${pad(i + 1)}`,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
    phone: `+91 98${pad(10000 + i * 37, 5)} ${pad(10000 + i * 91, 5)}`,
    city: pick(cities, i * 3),
    college: pick(colleges, i),
    registeredAt: daysBefore(i * 5 + 2),
    lastActiveAt: daysBefore((i * 3) % 14),
    planId,
    planExpiresAt: planId ? daysAfter(40 + ((i * 17) % 300)) : null,
    status: i % 9 === 4 || i % 11 === 7 ? "inactive" : "active",
  };
});
