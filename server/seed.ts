import { db } from "./db";
import { positions } from "@shared/schema";

const positionData = [
  {
    id: "qb",
    name: "Quarterback",
    description: "The leader of the offense, responsible for calling plays and throwing the ball.",
    details: {
      id: "qb",
      name: "Quarterback",
      roleInfo: "The field general. Requires elite decision making, arm talent, and leadership.",
      workouts: {
        gym: [
          {
            type: "strength",
            title: "Upper Body Power",
            exercises: [
              { name: "Rotational Med Ball Throws", sets: "3", reps: "10", notes: "Focus on explosive hip rotation" },
              { name: "Single Arm DB Press", sets: "4", reps: "8", notes: "Stabilize core throughout" }
            ]
          }
        ],
        field: [
          {
            type: "technique",
            title: "Dropback Mechanics",
            exercises: [
              { name: "3-Step Drop", sets: "5", reps: "10", notes: "Keep eyes downfield" },
              { name: "Pocket Movement Drills", sets: "4", reps: "5 mins", notes: "Stay light on feet" }
            ]
          }
        ]
      },
      diet: {
        meals: [
          { meal: "Breakfast", items: ["Oatmeal with berries", "4 Egg whites", "Greek yogurt"], protein: "35g" },
          { meal: "Post-Workout", items: ["Whey protein shake", "Banana"], protein: "30g" }
        ],
        proteinTarget: "180g"
      },
      filmStudy: ["Reading Cover 2", "Progressions vs Blitz", "Pocket Presence"]
    }
  },
  {
    id: "wr",
    name: "Wide Receiver",
    description: "Speedsters responsible for catching passes and stretching the defense.",
    details: {
      id: "wr",
      name: "Wide Receiver",
      roleInfo: "Dynamic playmakers. Requires elite speed, hands, and route running.",
      workouts: {
        gym: [
          {
            type: "agility",
            title: "Explosive Lower Body",
            exercises: [
              { name: "Box Jumps", sets: "4", reps: "5", notes: "Focus on vertical height" },
              { name: "Bulgarian Split Squats", sets: "3", reps: "10", notes: "Build unilateral strength" }
            ]
          }
        ],
        field: [
          {
            type: "technique",
            title: "Route Running",
            exercises: [
              { name: "Cone Weave", sets: "4", reps: "20 yards", notes: "Stay low in breaks" },
              { name: "Release Drills", sets: "5", reps: "5", notes: "Win at the line of scrimmage" }
            ]
          }
        ]
      },
      diet: {
        meals: [
          { meal: "Lunch", items: ["Grilled chicken breast", "Brown rice", "Broccoli"], protein: "45g" },
          { meal: "Dinner", items: ["Salmon filet", "Sweet potato", "Asparagus"], protein: "40g" }
        ],
        proteinTarget: "160g"
      },
      filmStudy: ["Beating Press Coverage", "Stemming Routes", "Hand Fighting"]
    }
  }
];

async function seed() {
  console.log("Seeding positions...");
  for (const pos of positionData) {
    await db.insert(positions).values(pos).onConflictDoUpdate({
      target: positions.id,
      set: { 
        name: pos.name, 
        description: pos.description, 
        details: pos.details 
      }
    });
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
