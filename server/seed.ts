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
  },
  {
    id: "rb",
    name: "Running Back",
    description: "Powerful runners who carry the ball and catch passes out of the backfield.",
    details: {
      id: "rb",
      name: "Running Back",
      roleInfo: "Workhorse of the offense. Requires vision, balance, and explosion.",
      workouts: {
        gym: [
          {
            type: "strength",
            title: "Lower Body Power",
            exercises: [
              { name: "Back Squats", sets: "5", reps: "5", notes: "Focus on depth and drive" },
              { name: "Clean Pulls", sets: "4", reps: "3", notes: "Explosive triple extension" }
            ]
          }
        ],
        field: [
          {
            type: "agility",
            title: "Vision & Cut Drills",
            exercises: [
              { name: "L-Drill", sets: "4", reps: "3 each way", notes: "Tight turns around cones" },
              { name: "Jump Cut Drills", sets: "5", reps: "10", notes: "Quick lateral movements" }
            ]
          }
        ]
      },
      diet: {
        meals: [
          { meal: "Breakfast", items: ["Steak and eggs", "Sweet potato hash"], protein: "50g" },
          { meal: "Dinner", items: ["Ground turkey pasta", "Mixed greens"], protein: "45g" }
        ],
        proteinTarget: "200g"
      },
      filmStudy: ["Identifying Gaps", "Blitz Pickup", "Finishing Runs"]
    }
  },
  {
    id: "lb",
    name: "Linebacker",
    description: "Versatile defenders who stop the run and cover receivers.",
    details: {
      id: "lb",
      name: "Linebacker",
      roleInfo: "The heart of the defense. Requires tackling power and lateral range.",
      workouts: {
        gym: [
          {
            type: "strength",
            title: "Total Body Impact",
            exercises: [
              { name: "Deadlifts", sets: "4", reps: "6", notes: "Maintain neutral spine" },
              { name: "Push Press", sets: "4", reps: "8", notes: "Drive through the legs" }
            ]
          }
        ],
        field: [
          {
            type: "technique",
            title: "Read & React",
            exercises: [
              { name: "Shuffling Drills", sets: "4", reps: "15 yards", notes: "Keep shoulders square" },
              { name: "Tackling Form", sets: "5", reps: "10", notes: "Head across the bow" }
            ]
          }
        ]
      },
      diet: {
        meals: [
          { meal: "Lunch", items: ["Roast beef sandwich", "Quinoa salad"], protein: "40g" },
          { meal: "Snack", items: ["Cottage cheese", "Almonds"], protein: "25g" }
        ],
        proteinTarget: "210g"
      },
      filmStudy: ["Reading Guard Pulls", "Gap Discipline", "Zone Drops"]
    }
  },
  {
    id: "db",
    name: "Defensive Back",
    description: "Secondary defenders specializing in pass coverage and speed.",
    details: {
      id: "db",
      name: "Defensive Back",
      roleInfo: "Lockdown specialists. Requires elite backpedal and ball skills.",
      workouts: {
        gym: [
          {
            type: "agility",
            title: "Fluid Hips",
            exercises: [
              { name: "Hip Openers", sets: "3", reps: "15", notes: "Improve range of motion" },
              { name: "Single Leg RDL", sets: "3", reps: "12", notes: "Stability and hamstring health" }
            ]
          }
        ],
        field: [
          {
            type: "technique",
            title: "Coverage Skills",
            exercises: [
              { name: "Backpedal to Sprint", sets: "6", reps: "20 yards", notes: "Smooth transition" },
              { name: "T-Drill", sets: "4", reps: "5", notes: "Break on the ball" }
            ]
          }
        ]
      },
      diet: {
        meals: [
          { meal: "Breakfast", items: ["Protein pancakes", "Blueberries"], protein: "30g" },
          { meal: "Dinner", items: ["Lean steak", "Wild rice", "Green beans"], protein: "50g" }
        ],
        proteinTarget: "170g"
      },
      filmStudy: ["Pattern Matching", "Bail Technique", "Playing the Hands"]
    }
  },
  {
    id: "ol",
    name: "Offensive Line",
    description: "The big men up front who protect the QB and pave the way for runners.",
    details: {
      id: "ol",
      name: "Offensive Line",
      roleInfo: "The protectors. Requires massive strength and hand technique.",
      workouts: {
        gym: [
          {
            type: "strength",
            title: "Massive Power",
            exercises: [
              { name: "Bench Press", sets: "5", reps: "5", notes: "Focus on explosive drive" },
              { name: "Heavy Rows", sets: "4", reps: "10", notes: "Build pulling strength" }
            ]
          }
        ],
        field: [
          {
            type: "technique",
            title: "Stance & Start",
            exercises: [
              { name: "Pass Pro Sets", sets: "10", reps: "5 yards", notes: "Maintain base" },
              { name: "Drive Blocks", sets: "5", reps: "10", notes: "Keep feet moving" }
            ]
          }
        ]
      },
      diet: {
        meals: [
          { meal: "Breakfast", items: ["6 Whole eggs", "Bagel with cream cheese", "Large fruit bowl"], protein: "60g" },
          { meal: "Lunch", items: ["Double chicken pasta", "Garlic bread"], protein: "70g" }
        ],
        proteinTarget: "250g"
      },
      filmStudy: ["Stunt Recognition", "Pass Set Variations", "Leverage Principles"]
    }
  },
  {
    id: "dl",
    name: "Defensive Line",
    description: "Explosive athletes who disrupt the backfield and sack the QB.",
    details: {
      id: "dl",
      name: "Defensive Line",
      roleInfo: "The disruptors. Requires get-off speed and violent hands.",
      workouts: {
        gym: [
          {
            type: "strength",
            title: "Violent Explosion",
            exercises: [
              { name: "Power Cleans", sets: "5", reps: "3", notes: "Max speed on the bar" },
              { name: "Front Squats", sets: "4", reps: "6", notes: "Core and leg drive" }
            ]
          }
        ],
        field: [
          {
            type: "technique",
            title: "Get-Off & Pass Rush",
            exercises: [
              { name: "Snap Reaction", sets: "8", reps: "5 yards", notes: "Explode on movement" },
              { name: "Rip & Swim Drills", sets: "5", reps: "10", notes: "Fast hand placement" }
            ]
          }
        ]
      },
      diet: {
        meals: [
          { meal: "Breakfast", items: ["Steak and eggs", "Protein shake"], protein: "70g" },
          { meal: "Dinner", items: ["Huge beef roast", "Mashed potatoes"], protein: "80g" }
        ],
        proteinTarget: "240g"
      },
      filmStudy: ["O-Line Tendencies", "Counters to Pass Pro", "Hand Swiping"]
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
