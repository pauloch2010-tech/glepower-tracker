/**
 * Fixture de validação: Adriana Bruno (planilha de referência).
 * Dados: F, 44 anos, 62kg, 1.61m, Jackson & Pollock 7 dobras.
 * Esperado: soma=190 (JP7), BMI=23.92, %G=34.19
 *
 * Rode: npx tsx src/shared/utils/bodyComposition.test.ts
 */
import {
  computeComposition,
  bmi,
  densityJacksonPollock7,
  siri,
} from './bodyComposition'

const input = {
  sex: 'F' as const,
  ageYears: 44,
  weightKg: 62,
  heightM: 1.61,
  protocol: 'jackson_pollock_7' as const,
  skinfolds: {
    subscapular: 19,
    triceps: 28,
    biceps: 26,
    chest: 21,
    midaxillary: 20,
    suprailiac: 25,
    abdominal: 31,
    thigh: 46,
    calf: 24,
  },
  circumferences: { waist: 77, hip: 106 },
}

const result = computeComposition(input)

function approx(a: number, b: number, tol = 0.01): boolean {
  return Math.abs(a - b) < tol
}

const checks = [
  ['BMI', approx(result.bmi, 23.9188, 0.001)],
  ['Soma 9 dobras', result.sumSkinfolds === 240],
  ['% Gordura JP7', approx(result.bodyFatPct, 34.1896, 0.001)],
  ['RCQ', approx(result.whr ?? 0, 0.7264, 0.001)],
  ['Classificação RCQ', result.whrClass === 'Baixo'],
  ['Classificação BMI', result.bmiClass === 'Peso Normal'],
]

let allOk = true
for (const [name, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${name}`)
  if (!ok) allOk = false
}

console.log('\nResultado completo:')
console.log(JSON.stringify(result, null, 2))

if (!allOk) {
  process.exit(1)
}
