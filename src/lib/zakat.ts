/**
 * زكاة الذهب والفضة على ما تعتمده دار الإفتاء المصرية (المرجع الشرعي للأوقاف):
 * النصاب 85 جرامًا من الذهب عيار 21 — لا عيار 24 — أو 595 جرامًا من الفضة لمن
 * يملك فضة وحدها، والمقدار رُبع العُشر (2.5%) بعد حَوْل هجري كامل.
 * https://www.dar-alifta.org/ar/fatwa/details/21692
 */
export const GOLD_NISAB_GRAMS = 85;
export const SILVER_NISAB_GRAMS = 595;
export const ZAKAT_RATE = 0.025;

/** يُضَم الذهب والفضة معًا، ويُقوَّمان بنصاب الذهب إلا إذا كان المملوك فضةً خالصة. */
export function zakat(goldValue: number, silverValue: number, k21Gram: number, silverGram: number) {
  const total = goldValue + silverValue;
  const nisab = goldValue > 0 ? k21Gram * GOLD_NISAB_GRAMS : silverGram * SILVER_NISAB_GRAMS;
  return { total, nisab, due: total >= nisab ? total * ZAKAT_RATE : 0 };
}
