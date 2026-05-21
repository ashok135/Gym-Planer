export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export const DEFAULT_PLAN = {
  1:{label:'Chest & Triceps',muscles:[
    {name:'Chest',exercises:['Barbell Bench Press','Incline Dumbbell Press','Cable Chest Fly','Decline Bench Press','Dumbbell Pullover']},
    {name:'Triceps',exercises:['Tricep Pushdown','Skull Crushers','Overhead Tricep Extension','Close Grip Bench Press','Diamond Push-ups']}
  ]},
  2:{label:'Back & Biceps',muscles:[
    {name:'Back',exercises:['Deadlift','Lat Pulldown','Bent Over Barbell Row','Seated Cable Row','Single Arm Dumbbell Row']},
    {name:'Biceps',exercises:['Barbell Curl','Incline Dumbbell Curl','Hammer Curl','Concentration Curl','Cable Curl']}
  ]},
  3:{label:'Legs & Shoulders',muscles:[
    {name:'Legs',exercises:['Barbell Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raises']},
    {name:'Shoulders',exercises:['Overhead Press','Dumbbell Lateral Raise','Front Raise','Face Pulls','Arnold Press']}
  ]},
  4:{label:'Chest & Triceps',muscles:[
    {name:'Chest',exercises:['Barbell Bench Press','Incline Dumbbell Press','Cable Chest Fly','Decline Bench Press','Dumbbell Pullover']},
    {name:'Triceps',exercises:['Tricep Pushdown','Skull Crushers','Overhead Tricep Extension','Close Grip Bench Press','Diamond Push-ups']}
  ]},
  5:{label:'Back & Biceps',muscles:[
    {name:'Back',exercises:['Deadlift','Lat Pulldown','Bent Over Barbell Row','Seated Cable Row','Single Arm Dumbbell Row']},
    {name:'Biceps',exercises:['Barbell Curl','Incline Dumbbell Curl','Hammer Curl','Concentration Curl','Cable Curl']}
  ]},
  6:{label:'Legs & Shoulders',muscles:[
    {name:'Legs',exercises:['Barbell Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raises']},
    {name:'Shoulders',exercises:['Overhead Press','Dumbbell Lateral Raise','Front Raise','Face Pulls','Arnold Press']}
  ]},
  0:{label:'Rest Day',muscles:[]},
  7:{label:'Full Body',muscles:[
    {name:'Chest',exercises:['Barbell Bench Press','Cable Chest Fly']},
    {name:'Back',exercises:['Lat Pulldown','Bent Over Barbell Row']},
    {name:'Legs',exercises:['Barbell Squat','Leg Press']},
    {name:'Shoulders',exercises:['Overhead Press','Dumbbell Lateral Raise']},
    {name:'Biceps',exercises:['Barbell Curl','Hammer Curl']},
    {name:'Triceps',exercises:['Tricep Pushdown','Diamond Push-ups']}
  ]}
};

// DAY-WISE FOOD PLANNER
export const DEFAULT_DIET_PLAN = {
  1: [ // Monday
    { meal: 'Morning', items: [{ id: 'm1', name: '3 Eggs (Boiled/Omelette)', p: 18 }, { id: 'm2', name: '2 Bananas', p: 2 }, { id: 'm3', name: 'Tea/Coffee (Less sugar)', p: 0 }] },
    { meal: 'Mid-Morning', items: [{ id: 'mm1', name: 'Peanuts or Boiled Green Gram', p: 12 }] },
    { meal: 'Lunch', items: [{ id: 'l1', name: '300g Cooked Rice', p: 8 }, { id: 'l2', name: '100g Chicken OR 2 Eggs', p: 25 }, { id: 'l3', name: 'Dal / Sambar', p: 6 }, { id: 'l4', name: 'Veg Poriyal', p: 2 }, { id: 'l5', name: '1 Cup Curd', p: 5 }] },
    { meal: 'Pre-Workout', items: [{ id: 'pw1', name: '1 Banana', p: 1 }, { id: 'pw2', name: 'Black Coffee', p: 0 }] },
    { meal: 'Post-Workout (Recovery)', items: [{ id: 'po1', name: '100g Chicken OR 4 Eggs OR 50g Soya Chunks', p: 25 }] },
    { meal: 'Dinner', items: [{ id: 'd1', name: 'Rice or Chapati', p: 6 }, { id: 'd2', name: 'Dal/Sambar + Veg', p: 4 }, { id: 'd3', name: '2 Eggs', p: 12 }] }
  ],
  0: [ // Sunday (Rest Day)
    { meal: 'Morning', items: [{ id: 'm1', name: '3 Eggs (Boiled/Omelette)', p: 18 }, { id: 'm2', name: '2 Bananas', p: 2 }, { id: 'm3', name: 'Tea/Coffee (Less sugar)', p: 0 }] },
    { meal: 'Mid-Morning', items: [{ id: 'mm1', name: 'Peanuts or Boiled Green Gram', p: 12 }] },
    { meal: 'Lunch', items: [{ id: 'l1', name: '300g Cooked Rice', p: 8 }, { id: 'l2', name: '100g Chicken OR 2 Eggs', p: 25 }, { id: 'l3', name: 'Dal / Sambar', p: 6 }, { id: 'l4', name: 'Veg Poriyal', p: 2 }, { id: 'l5', name: '1 Cup Curd', p: 5 }] },
    { meal: 'Pre-Workout', items: [{ id: 'pw1', name: 'Rest Day', p: 0 }] },
    { meal: 'Post-Workout (Recovery)', items: [{ id: 'po1', name: '100g Chicken OR 4 Eggs OR 50g Soya Chunks', p: 25 }] },
    { meal: 'Dinner', items: [{ id: 'd1', name: 'Rice or Chapati', p: 6 }, { id: 'd2', name: 'Dal/Sambar + Veg', p: 4 }, { id: 'd3', name: '2 Eggs', p: 12 }] }
  ],
  2: [ // Tuesday
    { meal: 'Morning', items: [{ id: 'm1', name: 'Oats with Milk & Peanut Butter', p: 15 }, { id: 'm2', name: '1 Apple', p: 0 }] },
    { meal: 'Mid-Morning', items: [{ id: 'mm1', name: 'Roasted Channa', p: 18 }] },
    { meal: 'Lunch', items: [{ id: 'l1', name: 'Chapati (3-4)', p: 9 }, { id: 'l2', name: 'Paneer Curry OR Chicken', p: 20 }, { id: 'l3', name: 'Mixed Veg Salad', p: 2 }] },
    { meal: 'Pre-Workout', items: [{ id: 'pw1', name: 'Black Coffee & Handful of Almonds', p: 3 }] },
    { meal: 'Post-Workout (Recovery)', items: [{ id: 'po1', name: '50g Soya Chunks (Spicy)', p: 26 }] },
    { meal: 'Dinner', items: [{ id: 'd1', name: 'Rice & Dal Tadka', p: 12 }, { id: 'd2', name: '2 Boiled Eggs', p: 12 }] }
  ],
  3: [ // Wednesday
    { meal: 'Morning', items: [{ id: 'm1', name: '4 Egg Whites + 1 Whole Egg', p: 20 }, { id: 'm2', name: 'Coffee', p: 0 }] },
    { meal: 'Mid-Morning', items: [{ id: 'mm1', name: 'Sprouted Moong Salad', p: 15 }] },
    { meal: 'Lunch', items: [{ id: 'l1', name: 'Rice', p: 6 }, { id: 'l2', name: 'Fish Fry or Chicken Curry', p: 25 }, { id: 'l3', name: 'Spinach / Greens', p: 3 }] },
    { meal: 'Pre-Workout', items: [{ id: 'pw1', name: '1 Banana', p: 1 }] },
    { meal: 'Post-Workout (Recovery)', items: [{ id: 'po1', name: 'Protein Shake or 4 Eggs', p: 24 }] },
    { meal: 'Dinner', items: [{ id: 'd1', name: 'Chapati & Soya Sabzi', p: 18 }, { id: 'd2', name: 'Curd', p: 5 }] }
  ]
};
// Fallback for remaining days
for(let i=4; i<=6; i++) DEFAULT_DIET_PLAN[i] = JSON.parse(JSON.stringify(DEFAULT_DIET_PLAN[1]));

export const BUDGET_GUIDES = {
  0: [{name: 'Recovery Diet', desc: 'Focus on hydration and whole foods today.'}],
  1: [{name: 'Soya Chunks', desc: '52g P per 100g (Extremely cheap)'}, {name: 'Eggs', desc: '6g P per egg (Best bio-availability)'}],
  2: [{name: 'Roasted Channa', desc: '18g P per 100g (Great snack)'}, {name: 'Milk', desc: '3.4g P per 100ml (Slow casein)'}],
  3: [{name: 'Green Gram (Moong)', desc: '24g P per 100g (High fiber)'}, {name: 'Curd/Yogurt', desc: '11g P per cup (Gut health)'}],
  4: [{name: 'Peanuts', desc: '25g P per 100g (Calorie dense)'}, {name: 'Paneer', desc: '18g P per 100g (Vegetarian staple)'}],
  5: [{name: 'Chicken Breast', desc: '31g P per 100g (Leanest protein)'}, {name: 'Lentils (Dal)', desc: '9g P per cup (Complex carbs)'}],
  6: [{name: 'Whey Protein', desc: '24g P per scoop (Fast absorbing)'}, {name: 'Fish', desc: '22g P per 100g (Omega 3s)'}]
};

export const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatFull = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export const getDayVol = (e) => {
  if(!e) return 0;
  return Math.round(Object.keys(e).filter(k => !['meta', 'customName', 'done'].includes(k)).reduce((s,k) => {
    const v = e[k]; return s + (v.s||0)*(v.r||0)*(v.w||0);
  }, 0));
};
