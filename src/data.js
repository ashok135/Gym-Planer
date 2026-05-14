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
  6:{label:'Progressive Overload',muscles:[
    {name:'Progressive',exercises:['Back Squat (Heavy)','Deadlift (Heavy)','Overhead Press (Heavy)','Weighted Pull-ups','Barbell Row (Heavy)']}
  ]},
  0:{label:'Rest Day',muscles:[]}
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
  ]
};
for(let i=2; i<=6; i++) DEFAULT_DIET_PLAN[i] = JSON.parse(JSON.stringify(DEFAULT_DIET_PLAN[1]));

export const dateKey = (d) => d.toISOString().slice(0,10);
export const formatFull = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export const getDayVol = (e) => {
  if(!e) return 0;
  return Math.round(Object.keys(e).filter(k => !['meta', 'customName'].includes(k)).reduce((s,k) => {
    const v = e[k]; return s + (v.s||0)*(v.r||0)*(v.w||0);
  }, 0));
};
