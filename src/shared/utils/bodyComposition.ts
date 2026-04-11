/**
 * Cálculos de composição corporal.
 *
 * Protocolos suportados:
 *  - Jackson & Pollock 7 dobras
 *  - Pollock 3 dobras
 *  - Guedes (população brasileira)
 *  - Faulkner
 *
 * Todas as fórmulas operam em mm (dobras), cm (perímetros/diâmetros),
 * kg (peso) e metros (altura).
 */

export type Sex = 'M' | 'F'

export type Protocol = 'jackson_pollock_7' | 'pollock_3' | 'guedes' | 'faulkner'

export interface Skinfolds {
  subscapular?: number
  triceps?: number
  biceps?: number
  chest?: number
  midaxillary?: number
  suprailiac?: number
  abdominal?: number
  thigh?: number
  calf?: number
}

export interface Circumferences {
  waist?: number
  hip?: number
}

export interface BoneDiameters {
  humerus?: number // cm
  femur?: number // cm
  wrist?: number // cm (bi-estilóide)
}

export interface CompositionInput {
  sex: Sex
  ageYears: number
  weightKg: number
  heightM: number
  protocol: Protocol
  skinfolds: Skinfolds
  circumferences?: Circumferences
  bones?: BoneDiameters
  activityFactor?: number // default 1.5
}

export interface CompositionResult {
  bmi: number
  bmiClass: string
  sumSkinfolds: number
  bodyDensity?: number // g/mL
  bodyFatPct: number
  bodyFatClass: string
  fatMassKg: number
  leanMassKg: number
  residualMassKg: number
  boneMassKg: number
  muscleMassKg: number
  whr?: number
  whrClass?: string
  bmr: number // Taxa Metabólica Basal (Harris-Benedict)
  tdee: number // Gasto Energético Total
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sum = (...vals: Array<number | undefined>): number =>
  vals.reduce<number>((acc, v) => acc + (v ?? 0), 0)

const allDefined = (...vals: Array<number | undefined>): boolean =>
  vals.every((v) => typeof v === 'number' && !Number.isNaN(v))

// ─── Fórmulas ────────────────────────────────────────────────────────────────

/** IMC: peso / altura² */
export function bmi(weightKg: number, heightM: number): number {
  return weightKg / (heightM * heightM)
}

export function classifyBmi(value: number): string {
  if (value < 18.5) return 'Abaixo do peso'
  if (value < 25) return 'Peso Normal'
  if (value < 30) return 'Sobrepeso'
  if (value < 35) return 'Obesidade Grau I'
  if (value < 40) return 'Obesidade Grau II'
  return 'Obesidade Grau III'
}

/** Siri: converte densidade corporal em % de gordura */
export function siri(density: number): number {
  return 495 / density - 450
}

/**
 * Densidade corporal — Jackson & Pollock 7 dobras (18-61 anos).
 * Dobras usadas: peitoral, axilar-média, tríceps, subescapular, abdominal,
 * supra-ilíaca, coxa.
 */
export function densityJacksonPollock7(
  sex: Sex,
  ageYears: number,
  s: Skinfolds,
): number | null {
  if (
    !allDefined(
      s.chest,
      s.midaxillary,
      s.triceps,
      s.subscapular,
      s.abdominal,
      s.suprailiac,
      s.thigh,
    )
  ) {
    return null
  }
  const sigma =
    (s.chest ?? 0) +
    (s.midaxillary ?? 0) +
    (s.triceps ?? 0) +
    (s.subscapular ?? 0) +
    (s.abdominal ?? 0) +
    (s.suprailiac ?? 0) +
    (s.thigh ?? 0)

  if (sex === 'M') {
    return (
      1.112 -
      0.00043499 * sigma +
      0.00000055 * sigma * sigma -
      0.00028826 * ageYears
    )
  }
  return (
    1.097 -
    0.00046971 * sigma +
    0.00000056 * sigma * sigma -
    0.00012828 * ageYears
  )
}

/**
 * Pollock 3 dobras.
 *  Homens: peitoral, abdominal, coxa
 *  Mulheres: tríceps, supra-ilíaca, coxa
 */
export function densityPollock3(
  sex: Sex,
  ageYears: number,
  s: Skinfolds,
): number | null {
  if (sex === 'M') {
    if (!allDefined(s.chest, s.abdominal, s.thigh)) return null
    const sigma = (s.chest ?? 0) + (s.abdominal ?? 0) + (s.thigh ?? 0)
    return (
      1.10938 -
      0.0008267 * sigma +
      0.0000016 * sigma * sigma -
      0.0002574 * ageYears
    )
  }
  if (!allDefined(s.triceps, s.suprailiac, s.thigh)) return null
  const sigma = (s.triceps ?? 0) + (s.suprailiac ?? 0) + (s.thigh ?? 0)
  return (
    1.0994921 -
    0.0009929 * sigma +
    0.0000023 * sigma * sigma -
    0.0001392 * ageYears
  )
}

/**
 * Guedes (brasileiros, adultos).
 *  Homens: tríceps, abdominal, supra-ilíaca
 *  Mulheres: subescapular, supra-ilíaca, coxa
 */
export function densityGuedes(sex: Sex, s: Skinfolds): number | null {
  if (sex === 'M') {
    if (!allDefined(s.triceps, s.abdominal, s.suprailiac)) return null
    const sigma = (s.triceps ?? 0) + (s.abdominal ?? 0) + (s.suprailiac ?? 0)
    return 1.17136 - 0.06706 * Math.log10(sigma)
  }
  if (!allDefined(s.subscapular, s.suprailiac, s.thigh)) return null
  const sigma = (s.subscapular ?? 0) + (s.suprailiac ?? 0) + (s.thigh ?? 0)
  return 1.1665 - 0.07063 * Math.log10(sigma)
}

/**
 * Faulkner — retorna % de gordura diretamente (não usa densidade).
 * Dobras: tríceps, subescapular, supra-ilíaca, abdominal.
 */
export function bodyFatFaulkner(s: Skinfolds): number | null {
  if (!allDefined(s.triceps, s.subscapular, s.suprailiac, s.abdominal))
    return null
  const sigma =
    (s.triceps ?? 0) +
    (s.subscapular ?? 0) +
    (s.suprailiac ?? 0) +
    (s.abdominal ?? 0)
  return sigma * 0.153 + 5.783
}

/** Taxa Metabólica Basal — Harris-Benedict revisada (1984). */
export function bmrHarrisBenedict(
  sex: Sex,
  weightKg: number,
  heightM: number,
  ageYears: number,
): number {
  const heightCm = heightM * 100
  if (sex === 'M') {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears
}

/** Massa residual (Würch): H 24.1% | M 20.9% do peso. */
export function residualMass(sex: Sex, weightKg: number): number {
  return weightKg * (sex === 'M' ? 0.241 : 0.209)
}

/** Massa óssea (Matiegka). Requer diâmetros em cm e altura em metros. */
export function boneMassMatiegka(
  heightM: number,
  humerus?: number,
  femur?: number,
): number | null {
  if (!allDefined(humerus, femur)) return null
  // Matiegka: O = 3.02 · (h² · r · R · 400)^0.712  (aprox.)
  // Versão simplificada frequentemente usada em planilhas:
  // OssMass = h² · (r + R)² · 400 · k
  // Implementamos a forma clássica com constantes validadas.
  const h = heightM
  const r = (humerus ?? 0) / 100 // converte cm → m
  const R = (femur ?? 0) / 100
  return 3.02 * Math.pow(h * h * r * R * 400, 0.712)
}

/** Classificação de % de gordura por sexo e idade (ACSM simplificado). */
export function classifyBodyFat(sex: Sex, ageYears: number, pct: number): string {
  // Tabelas condensadas
  const tablesM: Array<[number, number, number, number]> = [
    // [minAge, excelente_max, bom_max, media_max] — acima = ruim
    [20, 11, 14, 18],
    [30, 12, 16, 20],
    [40, 14, 18, 22],
    [50, 15, 20, 24],
    [60, 16, 21, 25],
  ]
  const tablesF: Array<[number, number, number, number]> = [
    [20, 16, 19, 23],
    [30, 17, 20, 24],
    [40, 18, 22, 27],
    [50, 19, 24, 30],
    [60, 20, 25, 31],
  ]
  const table = sex === 'M' ? tablesM : tablesF
  const row = [...table].reverse().find(([minAge]) => ageYears >= minAge) ?? table[0]
  const [, exc, good, avg] = row
  if (pct <= exc) return 'Excelente'
  if (pct <= good) return 'Bom'
  if (pct <= avg) return 'Média'
  return 'Ruim'
}

/** Relação Cintura-Quadril */
export function whr(waist: number, hip: number): number {
  return waist / hip
}

export function classifyWhr(sex: Sex, value: number): string {
  if (sex === 'M') {
    if (value < 0.9) return 'Baixo'
    if (value < 0.95) return 'Moderado'
    if (value < 1.0) return 'Alto'
    return 'Muito alto'
  }
  if (value < 0.8) return 'Baixo'
  if (value < 0.85) return 'Moderado'
  if (value < 0.9) return 'Alto'
  return 'Muito alto'
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/** Calcula a composição corporal completa a partir de um input único. */
export function computeComposition(input: CompositionInput): CompositionResult {
  const {
    sex,
    ageYears,
    weightKg,
    heightM,
    protocol,
    skinfolds,
    circumferences,
    bones,
    activityFactor = 1.5,
  } = input

  // Soma das dobras (todas as informadas)
  const sumSkinfolds = sum(
    skinfolds.subscapular,
    skinfolds.triceps,
    skinfolds.biceps,
    skinfolds.chest,
    skinfolds.midaxillary,
    skinfolds.suprailiac,
    skinfolds.abdominal,
    skinfolds.thigh,
    skinfolds.calf,
  )

  // % gordura conforme protocolo
  let bodyDensity: number | null = null
  let bodyFatPct = 0
  switch (protocol) {
    case 'jackson_pollock_7':
      bodyDensity = densityJacksonPollock7(sex, ageYears, skinfolds)
      bodyFatPct = bodyDensity ? siri(bodyDensity) : 0
      break
    case 'pollock_3':
      bodyDensity = densityPollock3(sex, ageYears, skinfolds)
      bodyFatPct = bodyDensity ? siri(bodyDensity) : 0
      break
    case 'guedes':
      bodyDensity = densityGuedes(sex, skinfolds)
      bodyFatPct = bodyDensity ? siri(bodyDensity) : 0
      break
    case 'faulkner':
      bodyFatPct = bodyFatFaulkner(skinfolds) ?? 0
      break
  }

  const fatMassKg = weightKg * (bodyFatPct / 100)
  const leanMassKg = weightKg - fatMassKg
  const residualMassKg = residualMass(sex, weightKg)
  const boneMassKg = boneMassMatiegka(heightM, bones?.humerus, bones?.femur) ?? 0
  const muscleMassKg = Math.max(0, weightKg - fatMassKg - residualMassKg - boneMassKg)

  const bmiValue = bmi(weightKg, heightM)
  const bmrValue = bmrHarrisBenedict(sex, weightKg, heightM, ageYears)
  const tdeeValue = bmrValue * activityFactor

  const waist = circumferences?.waist
  const hip = circumferences?.hip
  const whrValue = waist && hip ? whr(waist, hip) : undefined

  return {
    bmi: bmiValue,
    bmiClass: classifyBmi(bmiValue),
    sumSkinfolds,
    bodyDensity: bodyDensity ?? undefined,
    bodyFatPct,
    bodyFatClass: classifyBodyFat(sex, ageYears, bodyFatPct),
    fatMassKg,
    leanMassKg,
    residualMassKg,
    boneMassKg,
    muscleMassKg,
    whr: whrValue,
    whrClass: whrValue ? classifyWhr(sex, whrValue) : undefined,
    bmr: bmrValue,
    tdee: tdeeValue,
  }
}

export const PROTOCOL_LABELS: Record<Protocol, string> = {
  jackson_pollock_7: 'Jackson & Pollock (7 dobras)',
  pollock_3: 'Pollock (3 dobras)',
  guedes: 'Guedes',
  faulkner: 'Faulkner',
}

/** Dobras usadas por protocolo (para destacar no formulário). */
export const PROTOCOL_SKINFOLDS: Record<Protocol, Array<keyof Skinfolds>> = {
  jackson_pollock_7: [
    'chest',
    'midaxillary',
    'triceps',
    'subscapular',
    'abdominal',
    'suprailiac',
    'thigh',
  ],
  pollock_3: ['chest', 'abdominal', 'thigh'], // homens — mulheres override abaixo
  guedes: ['triceps', 'abdominal', 'suprailiac'],
  faulkner: ['triceps', 'subscapular', 'suprailiac', 'abdominal'],
}

export const PROTOCOL_SKINFOLDS_FEMALE: Partial<
  Record<Protocol, Array<keyof Skinfolds>>
> = {
  pollock_3: ['triceps', 'suprailiac', 'thigh'],
  guedes: ['subscapular', 'suprailiac', 'thigh'],
}

export function skinfoldsForProtocol(
  protocol: Protocol,
  sex: Sex,
): Array<keyof Skinfolds> {
  if (sex === 'F' && PROTOCOL_SKINFOLDS_FEMALE[protocol]) {
    return PROTOCOL_SKINFOLDS_FEMALE[protocol]!
  }
  return PROTOCOL_SKINFOLDS[protocol]
}
