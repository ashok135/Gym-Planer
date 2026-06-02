export const ACTIVITY_LEVELS = [
  { id: 'sedentary',  label: 'Sedentary',        desc: 'Little or no exercise',                  mult: 1.2 },
  { id: 'light',      label: 'Light',             desc: '1–3 days/week workout',                  mult: 1.375 },
  { id: 'moderate',   label: 'Moderate',          desc: '3–5 days/week workout',                  mult: 1.55 },
  { id: 'active',     label: 'Active',            desc: '6–7 days/week workout',                  mult: 1.725 },
  { id: 'very_active',label: 'Very Active',       desc: 'Twice a day or physical job',            mult: 1.9 },
];

export const BMI_CATEGORIES = [
  { max: 18.5, label: 'Underweight', color: '#4D9FFF' },
  { max: 25,   label: 'Normal',      color: '#C8F135' },
  { max: 30,   label: 'Overweight',  color: '#FB923C' },
  { max: 999,  label: 'Obese',       color: '#FF6B6B' },
];

export function getBmiCategory(bmi) {
  return BMI_CATEGORIES.find(c => bmi < c.max) || BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}
