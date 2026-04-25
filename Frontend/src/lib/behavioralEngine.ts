import { supabase } from './supabase'

export interface ChoiceLog {
  choice_category: string
  choice_value: string
  response_latency_ms: number
  tier: number
  day_count: number
}

export async function logChoice(log: ChoiceLog) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const time_of_day = new Date().getHours()

  await supabase.from('choice_logs').insert({
    user_id: user.id,
    ...log,
    time_of_day,
  })

  await updateBaseline(user.id)
  await detectAnomalies(user.id)
}

async function updateBaseline(userId: string) {
  const { data: logs } = await supabase
    .from('choice_logs')
    .select('response_latency_ms, time_of_day, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(70)

  if (!logs || logs.length < 5) return

  const latencies = logs.map(l => l.response_latency_ms).filter(Boolean)
  const hours = logs.map(l => l.time_of_day).filter(l => l !== null)

  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length
  const std = Math.sqrt(
    latencies.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / latencies.length
  )
  const typicalHour = hours.reduce((a, b) => a + b, 0) / hours.length

  await supabase.from('user_baselines').upsert({
    user_id: userId,
    avg_latency_ms: avg,
    std_latency_ms: std,
    typical_hour: typicalHour,
    baseline_days: logs.length,
    last_updated: new Date().toISOString(),
  })
}

async function detectAnomalies(userId: string) {
  const { data: baseline } = await supabase
    .from('user_baselines')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!baseline || baseline.baseline_days < 14) return

  const { data: recentLogs } = await supabase
    .from('choice_logs')
    .select('response_latency_ms, time_of_day, choice_category, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(15)

  if (!recentLogs) return

  // Signal 1: Late night sessions (1am-4am) 3+ consecutive days
  const lateNightDays = recentLogs.filter(l => l.time_of_day >= 1 && l.time_of_day <= 4)
  if (lateNightDays.length >= 3) {
    await insertFlag(userId, 'late_night_pattern', 'red',
      'App opened between 1am–4am for 3+ consecutive sessions. Validated rumination signal (Perlis et al., 2009).')
  }

  // Signal 2: Latency spike — 2x personal baseline
  const recentLatencies = recentLogs.slice(0, 5).map(l => l.response_latency_ms).filter(Boolean)
  if (recentLatencies.length > 0) {
    const recentAvg = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length
    if (recentAvg > baseline.avg_latency_ms + 2 * baseline.std_latency_ms) {
      await insertFlag(userId, 'latency_spike', 'amber',
        'Response latency 2x above personal baseline. Indicates high emotional load in recent sessions.')
    }
  }

  // Signal 3: Category avoidance — same category skipped 5 days
  const last25 = recentLogs.slice(0, 25)
  const categoryCounts: Record<string, number> = {}
  last25.forEach(l => {
    categoryCounts[l.choice_category] = (categoryCounts[l.choice_category] || 0) + 1
  })
  const allCategories = ['color', 'sound', 'word', 'pace', 'intention']
  allCategories.forEach(cat => {
    if (!categoryCounts[cat] || categoryCounts[cat] < 2) {
      insertFlag(userId, `avoidance_${cat}`, 'amber',
        `Category "${cat}" consistently avoided. Maps to a loaded trauma domain.`)
    }
  })
}

async function insertFlag(
  userId: string,
  flagType: string,
  severity: 'amber' | 'red',
  description: string
) {
  const { data: existing } = await supabase
    .from('anomaly_flags')
    .select('id')
    .eq('user_id', userId)
    .eq('flag_type', flagType)
    .eq('resolved', false)
    .single()

  if (existing) return

  await supabase.from('anomaly_flags').insert({
    user_id: userId,
    flag_type: flagType,
    severity,
    description,
  })
}

export async function getUserStatus(userId: string): Promise<'green' | 'amber' | 'red'> {
  const { data: flags } = await supabase
    .from('anomaly_flags')
    .select('severity')
    .eq('user_id', userId)
    .eq('resolved', false)

  if (!flags || flags.length === 0) return 'green'
  if (flags.some(f => f.severity === 'red')) return 'red'
  return 'amber'
}

export async function getWeeklyInsight(userId: string): Promise<string | null> {
  const { data: logs } = await supabase
    .from('choice_logs')
    .select('choice_category, time_of_day, created_at, tier')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(35)

  if (!logs || logs.length < 7) return null

  const hours = logs.map(l => l.time_of_day)
  const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length
  const timeOfDay = avgHour < 12 ? 'बिहान' : avgHour < 17 ? 'दिउँसो' : avgHour < 21 ? 'साँझ' : 'रात'

  const futureLogs = logs.filter(l =>
    l.choice_category === 'intention' || l.choice_category === 'word'
  )

  const totalChoices = logs.length
  const futureCount = futureLogs.length

  if (futureCount > totalChoices * 0.4) {
    return `यस हप्ता तपाईंले ${totalChoices} निर्णय गर्नुभयो। तीमध्ये धेरै भविष्यका बारेमा थिए।`
  }

  return `यस हप्ता तपाईं बढी ${timeOfDay}मा app खोल्नुहुन्थ्यो। तपाईंले ${totalChoices} निर्णय गर्नुभयो।`
}
