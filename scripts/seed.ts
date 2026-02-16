import { storage } from "../server/storage";

const INITIAL_DATA = [
  {
    id: "qb",
    name: "Quarterback",
    description: "The field general. Focus on arm strength, footwork, and mental agility.",
    details: {
      id: "qb",
      name: "Quarterback",
      roleInfo: "Lead the offense, make split-second decisions, and deliver the ball accurately.",
      workouts: { gym: [], field: [] },
      diet: { meals: [], proteinTarget: "1.8g/kg" },
      filmStudy: []
    }
  },
  {
    id: "wr",
    name: "Wide Receiver",
    description: "Speed and hands. Focus on explosive sprints, route running, and catching.",
    details: {
      id: "wr",
      name: "Wide Receiver",
      roleInfo: "Create separation, catch everything, and score touchdowns.",
      workouts: {
        gym: [
          {
            type: "strength",
            title: "Monday – Lower Body 1",
            exercises: [
              { name: "Deadlift", sets: "4", reps: "5", notes: "1–2 reps in reserve" },
              { name: "Hang Clean", sets: "4", reps: "4–3", notes: "bar close to body" }
            ]
          }
        ],
        field: []
      },
      diet: {
        meals: [
          { meal: "Breakfast", items: ["Oatmeal with berries", "4 Scrambled Eggs"] }
        ],
        proteinTarget: "1.6g - 1.8g/kg"
      },
      filmStudy: []
    }
  }
];

async function seed() {
  console.log("Seeding positions...");
  for (const pos of INITIAL_DATA) {
    await storage.updatePositionDetails(pos.id, pos.details);
  }
  console.log("Seeding complete.");
}

seed().catch(console.error);
