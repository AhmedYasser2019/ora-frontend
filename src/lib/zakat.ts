/**
 * زكاة الذهب والفضة: النصاب 85 جرامًا من الذهب الخالص (عيار 24) — أي 97.14 جرامًا من عيار 21 —
 * أو 595 جرامًا من الفضة لمن يملك فضة وحدها، والمقدار رُبع العُشر (2.5%) بعد حَوْل هجري كامل.
 */
export const GOLD_NISAB_GRAMS = 85;
export const SILVER_NISAB_GRAMS = 595;
export const ZAKAT_RATE = 0.025;

/** نصاب الذهب بجرامات العيار المختار: 85 ÷ النقاوة (21 ← 85 × 24 ÷ 21 = 97.14). */
export const goldNisabGrams = (karat: number) => (GOLD_NISAB_GRAMS * 24) / karat;

/**
 * يُضَم الذهب والفضة معًا، ويُقوَّمان بنصاب الذهب إلا إذا كان المملوك فضةً خالصة. نصاب الذهب
 * يُقوَّم بسعر جرام العيار المختار نفسه، فـ 85 جرامًا من عيار 21 دون النصاب.
 */
export function zakat(
  goldValue: number,
  silverValue: number,
  goldGram: number,
  karat: number,
  silverGram: number,
) {
  const total = goldValue + silverValue;
  const nisab = goldValue > 0 ? goldGram * goldNisabGrams(karat) : silverGram * SILVER_NISAB_GRAMS;
  return { total, nisab, due: total >= nisab ? total * ZAKAT_RATE : 0 };
}
