import { type Position, type PositionDetails } from "@shared/schema";

export interface IStorage {
  getPositions(): Promise<Position[]>;
  getPositionDetails(id: string): Promise<PositionDetails | undefined>;
}

// Hardcoded data
const POSITIONS: Position[] = [
  { id: "qb", name: "Quarterback", description: "The field general. Focus on arm strength, footwork, and mental agility." },
  { id: "wr", name: "Wide Receiver", description: "Speed and hands. Focus on explosive sprints, route running, and catching." },
  { id: "rb", name: "Running Back", description: "Power and agility. Focus on balance, burst speed, and lower body strength." },
  { id: "lb", name: "Linebacker", description: "The defensive core. Focus on tackling power, lateral movement, and reaction time." },
  { id: "db", name: "Defensive Back", description: "Coverage specialist. Focus on backpedaling, hip fluidity, and closing speed." },
  { id: "ol", name: "Offensive Lineman", description: "The wall. Focus on massive strength, explosive blocking, and solid base." },
  { id: "dl", name: "Defensive Lineman", description: "The disruptor. Focus on get-off speed, hand fighting, and power." },
];

const DETAILS: Record<string, PositionDetails> = {
  qb: {
    id: "qb",
    name: "Quarterback",
    roleInfo: "Lead the offense, make split-second decisions, and deliver the ball accurately.",
    workouts: {
      gym: [
        {
          type: "strength",
          title: "Upper Body Power",
          exercises: [
            { name: "Dumbbell Bench Press", sets: "4", reps: "8-10", notes: "Focus on stability" },
            { name: "Overhead Press", sets: "3", reps: "8", notes: "Core engaged" },
            { name: "Medicine Ball Rotational Throws", sets: "4", reps: "10/side", notes: "Explosive movement" }
          ]
        },
        {
          type: "strength",
          title: "Lower Body Stability",
          exercises: [
            { name: "Bulgarian Split Squats", sets: "3", reps: "8/leg", notes: "Balance focus" },
            { name: "Hex Bar Deadlift", sets: "4", reps: "6", notes: "Explosive upward" }
          ]
        }
      ],
      field: [
        {
          type: "technique",
          title: "Footwork & Drops",
          exercises: [
            { name: "3-Step Drop", sets: "10", reps: "1", notes: "Quick rhythm" },
            { name: "5-Step Drop", sets: "10", reps: "1", notes: "Depth and balance" },
            { name: "Rollout Drills", sets: "5", reps: "Left/Right", notes: "Throw on the run" }
          ]
        }
      ]
    },
    diet: {
      meals: [
        { meal: "Breakfast", items: ["Oatmeal with berries", "4 Scrambled Eggs", "Banana"] },
        { meal: "Lunch", items: ["Grilled Chicken Breast", "Brown Rice", "Broccoli"] },
        { meal: "Dinner", items: ["Salmon or Lean Steak", "Sweet Potato", "Asparagus"] },
        { meal: "Snacks", items: ["Protein Shake", "Almonds", "Greek Yogurt"] }
      ],
      proteinTarget: "1.8g per kg of bodyweight"
    }
  },
  wr: {
    id: "wr",
    name: "Wide Receiver",
    roleInfo: "Create separation, catch everything, and score touchdowns.",
    workouts: {
      gym: [
        {
          type: "strength",
          title: "Monday – Lower Body 1",
          exercises: [
            { name: "Deadlift", sets: "4", reps: "5", notes: "tipp: 1–2 reps in reserve; tipp: neutral spine always" },
            { name: "Hang Clean", sets: "4", reps: "4–3", notes: "tipp: bar close to body; tipp: full hip extension" },
            { name: "Bulgarian Split Squat", sets: "4", reps: "6 (each leg)", notes: "tipp: knee over toes; tipp: control the eccentric" }
          ]
        },
        {
          type: "strength",
          title: "Tuesday – Upper Body 1",
          exercises: [
            { name: "Incline Bench Press (Explosive)", sets: "4", reps: "6–5", notes: "tipp: max bar speed; tipp: full reset each rep" },
            { name: "Flat Bench Press", sets: "4", reps: "8–6", notes: "tipp: controlled lowering" },
            { name: "Triceps Pushdown", sets: "4", reps: "8", notes: "tipp: full lockout; tipp: slow eccentric" },
            { name: "Shoulder Prehab (rotator cuff / face pulls)", sets: "4", reps: "N/A", notes: "tipp: light weight; tipp: strict form" }
          ]
        },
        {
          type: "strength",
          title: "Wednesday – Athletic 1",
          exercises: [
            { name: "Weighted Box Jump", sets: "4", reps: "3", notes: "tipp: full recovery; tipp: stick the landing" },
            { name: "Side Hurdle to Box Jump (Single Leg)", sets: "4", reps: "3 each leg", notes: "tipp: minimal ground contact; tipp: stay elastic" },
            { name: "Bulgarian Split Stance 3-Point Jumps (left/right/center)", sets: "4", reps: "4", notes: "tipp: project forward" },
            { name: "Nordic Hamstring", sets: "3", reps: "5", notes: "tipp: slow lowering; tipp: control hips" }
          ]
        },
        {
          type: "strength",
          title: "Thursday – Lower Body 2",
          exercises: [
            { name: "Back Squat", sets: "4", reps: "6", notes: "tipp: drive through mid-foot; tipp: explosive concentric" },
            { name: "Single-Leg Squat", sets: "4", reps: "8–6 each leg", notes: "tipp: balance first; tipp: controlled tempo" },
            { name: "Weighted Bulgarian Split Squat → Single-Leg Box Jump", sets: "4", reps: "4", notes: "tipp: quick transition; tipp: max intent jump" }
          ]
        },
        {
          type: "strength",
          title: "Friday – Upper Body 2",
          exercises: [
            { name: "Pull-ups / Lat Pulldown", sets: "4", reps: "8–6", notes: "tipp: chest to bar; tipp: full stretch" },
            { name: "Barbell or Dumbbell Row", sets: "4", reps: "8–6", notes: "tipp: squeeze shoulder blades; tipp: no torso swing" },
            { name: "Shrugs", sets: "4", reps: "8", notes: "tipp: pause at top; tipp: controlled down" },
            { name: "Barbell or Dumbbell Curls", sets: "4", reps: "8–6", notes: "tipp: strict reps; tipp: full extension" },
            { name: "Shoulder Prehab (rotator cuff / face pulls)", sets: "4", reps: "High reps", notes: "tipp: perfect posture" }
          ]
        },
        {
          type: "strength",
          title: "Saturday – Athletic 2",
          exercises: [
            { name: "Single-Leg Bulgarian Jump (max height)", sets: "4", reps: "4 each leg", notes: "tipp: minimal dip; tipp: explosive knee drive" },
            { name: "Hurdle to Box Jump", sets: "4", reps: "3", notes: "tipp: reactive contact; tipp: tall posture" },
            { name: "Depth Jump to Broad Jump", sets: "4", reps: "4", notes: "tipp: short ground time; tipp: project forward" },
            { name: "Pogo Hops", sets: "3", reps: "30 sec", notes: "tipp: stiff ankles; tipp: quick contacts" }
          ]
        },
        {
          type: "strength",
          title: "Sunday – Rest",
          exercises: [
            { name: "Recovery", sets: "1", reps: "N/A", notes: "tipp: mobility work; tipp: soft tissue recovery; tipp: 8+ hours sleep; tipp: eat snacks (reward :) )" }
          ]
        }
      ],
      field: [],
    },
    diet: {
      meals: [
        { meal: "REGGELI (olcsó, gyors, izomépítő)", items: ["Zabkása (zab + tej/víz) + banán + 1 kanál mogyoróvaj", "4 tojás rántotta + teljes kiőrlésű pirítós + spenót", "Görög joghurt (nagy dobozos, store brand) + zab + fagyasztott gyümölcs", "Tojásos tortilla wrap (tojás + spenót + kis sajt)", "Overnight oats (zab + tej + chia mag + banán)", "Cottage cheese + alma + méz", "Protein smoothie (tej + zab + banán + mogyoróvaj)"] },
        { meal: "EBÉD (tömegelés, regeneráció, de nem drága)", items: ["Grillezett csirkemell + rizs + fagyasztott brokkoli", "Darált pulyka vagy marha + rizs + zöldség", "Csirkés tészta (teljes kiőrlésű tészta + paradicsomszósz)", "Burrito bowl (rizs + bab + csirke + kukorica)", "Tonhal konzerv + rizs + saláta", "Édesburgonya + tojás + spenót", "Lencse + rizs + csirke (nagyon olcsó és brutál jó)"] },
        { meal: "VACSORA (könnyebb, de fehérjedús)", items: ["Csirke + párolt zöldség", "Tojásos omlett spenóttal", "Darált hús + saláta", "Cottage cheese + dió", "Tonhal + tojás + zöldség", "Csirke + rizs kisebb adagban", "Fehérjeturmix + banán (ha későn edzettél)"] },
        { meal: "Tippek", items: ["Olcsó alapok: zab, tojás, banán, spenót, joghurt nagy kiszerelésben", "Főzz nagy adag rizst 3–4 napra, sokat spórolsz."] }
      ],
      proteinTarget: "1.6g - 1.8g per kg of bodyweight"
    }
  },
  rb: {
    id: "rb",
    name: "Running Back",
    roleInfo: "Run hard, block well, and be versatile in the passing game.",
    workouts: {
      gym: [
        {
          type: "strength",
          title: "Lower Body Power",
          exercises: [
            { name: "Back Squat", sets: "5", reps: "5", notes: "Heavy load" },
            { name: "Romanian Deadlift", sets: "4", reps: "8", notes: "Hamstring focus" }
          ]
        }
      ],
      field: [
        {
          type: "agility",
          title: "Change of Direction",
          exercises: [
            { name: "Ladder Drills", sets: "4", reps: "Variations", notes: "Fast feet" },
            { name: "Bag Drills", sets: "4", reps: "High knees", notes: "Keep balance" }
          ]
        }
      ]
    },
    diet: {
      meals: [
        { meal: "Breakfast", items: ["Omelet with spinach/cheese", "Hash browns"] },
        { meal: "Lunch", items: ["Beef Burrito Bowl", "Rice", "Black Beans"] },
        { meal: "Dinner", items: ["Lean Ground Beef", "Pasta", "Marinara Sauce"] },
        { meal: "Snacks", items: ["Cottage Cheese", "Banana"] }
      ],
      proteinTarget: "2.0g per kg of bodyweight"
    }
  },
  lb: {
    id: "lb",
    name: "Linebacker",
    roleInfo: "Stop the run, cover the pass, and lead the defense.",
    workouts: {
      gym: [
        {
          type: "strength",
          title: "Total Body Strength",
          exercises: [
            { name: "Bench Press", sets: "4", reps: "6", notes: "Upper pushing" },
            { name: "Front Squat", sets: "4", reps: "6", notes: "Core & Legs" },
            { name: "Pull-ups", sets: "3", reps: "Max", notes: "Back strength" }
          ]
        }
      ],
      field: [
        {
          type: "agility",
          title: "Reaction & Movement",
          exercises: [
            { name: "Shuffles", sets: "4", reps: "10 yards", notes: "Stay low" },
            { name: "Backpedal to Sprint", sets: "5", reps: "15 yards", notes: "Fluid hips" }
          ]
        }
      ]
    },
    diet: {
      meals: [
        { meal: "Breakfast", items: ["Large Oatmeal", "4 Eggs", "Bacon"] },
        { meal: "Lunch", items: ["Chicken Breast", "Sweet Potato", "Mixed Veggies"] },
        { meal: "Dinner", items: ["Steak", "Rice", "Salad"] },
        { meal: "Snacks", items: ["Protein Bar", "Peanut Butter Toast"] }
      ],
      proteinTarget: "2.0g - 2.2g per kg of bodyweight"
    }
  },
  db: {
    id: "db",
    name: "Defensive Back",
    roleInfo: "Lock down receivers and provide run support.",
    workouts: {
      gym: [
        {
          type: "strength",
          title: "Explosive Legs",
          exercises: [
            { name: "Jump Squats", sets: "4", reps: "6", notes: "Speed focus" },
            { name: "Nordic Curls", sets: "3", reps: "8", notes: "Hamstring injury prevention" }
          ]
        }
      ],
      field: [
        {
          type: "agility",
          title: "Coverage Skills",
          exercises: [
            { name: "W-Drill", sets: "4", reps: "1", notes: "Backpedal breaks" },
            { name: "Ball Drills", sets: "10", reps: "Catches", notes: "High point the ball" }
          ]
        }
      ]
    },
    diet: {
      meals: [
        { meal: "Breakfast", items: ["Greek Yogurt Parfait", "2 Boiled Eggs"] },
        { meal: "Lunch", items: ["Tuna Salad Sandwich", "Fruit Cup"] },
        { meal: "Dinner", items: ["Grilled Fish", "Quinoa", "Spinach"] },
        { meal: "Snacks", items: ["Trail Mix", "Protein Shake"] }
      ],
      proteinTarget: "1.8g per kg of bodyweight"
    }
  },
  ol: {
    id: "ol",
    name: "Offensive Lineman",
    roleInfo: "Protect the QB and open lanes for the RB.",
    workouts: {
      gym: [
        {
          type: "strength",
          title: "Mass & Power",
          exercises: [
            { name: "Deadlift", sets: "5", reps: "3-5", notes: "Raw strength" },
            { name: "Overhead Press", sets: "4", reps: "6", notes: "Shoulder stability" },
            { name: "Farmer Carries", sets: "3", reps: "40 yards", notes: "Grip & Core" }
          ]
        }
      ],
      field: [
        {
          type: "technique",
          title: "Blocking Steps",
          exercises: [
            { name: "Kick Slides", sets: "10", reps: "10 yards", notes: "Pass pro" },
            { name: "Duck Walks", sets: "3", reps: "10 yards", notes: "Hip mobility" }
          ]
        }
      ]
    },
    diet: {
      meals: [
        { meal: "Breakfast", items: ["4-5 Eggs", "Pancakes/Oats", "Sausage"] },
        { meal: "Lunch", items: ["Double Burger (no bun opt.)", "Potato Wedges", "Milk"] },
        { meal: "Dinner", items: ["Roast Beef", "Mashed Potatoes", "Corn"] },
        { meal: "Snacks", items: ["PB&J Sandwiches", "Mass Gainer Shake"] }
      ],
      proteinTarget: "2.0g - 2.4g per kg of bodyweight"
    }
  },
  dl: {
    id: "dl",
    name: "Defensive Lineman",
    roleInfo: "Disrupt the offense, sack the QB, and stop the run.",
    workouts: {
      gym: [
        {
          type: "strength",
          title: "Explosive Power",
          exercises: [
            { name: "Power Clean", sets: "5", reps: "3", notes: "Explosion" },
            { name: "Incline Bench Press", sets: "4", reps: "6", notes: "Upper push" }
          ]
        }
      ],
      field: [
        {
          type: "technique",
          title: "Pass Rush",
          exercises: [
            { name: "Get-Off Drills", sets: "10", reps: "Reaction", notes: "React to ball movement" },
            { name: "Hand Combat Drills", sets: "5", reps: "1 min", notes: "Swim/Rip moves" }
          ]
        }
      ]
    },
    diet: {
      meals: [
        { meal: "Breakfast", items: ["Oatmeal", "4 Eggs", "Turkey Bacon"] },
        { meal: "Lunch", items: ["Chicken Pasta", "Side Salad"] },
        { meal: "Dinner", items: ["Steak or Ground Beef", "Rice", "Peas"] },
        { meal: "Snacks", items: ["Protein Bar", "Milk", "Nuts"] }
      ],
      proteinTarget: "2.0g - 2.2g per kg of bodyweight"
    }
  }
};

export class MemStorage implements IStorage {
  async getPositions(): Promise<Position[]> {
    return POSITIONS;
  }

  async getPositionDetails(id: string): Promise<PositionDetails | undefined> {
    return DETAILS[id];
  }
}

export const storage = new MemStorage();
