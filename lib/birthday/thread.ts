import type { SupabaseClient } from '@supabase/supabase-js'
import { getBusinessDate } from './date'

export interface BirthdayThreadRow {
  id: number
  sender: string
  message: string
  birthday_person: string | null
  celebration_date: string | null
  timezone: string | null
  birthday_event_key: string | null
  created_at: string
}

// 対象者 + 対象日で 1 件だけの誕生日スレッドを保証する。
// 同時実行で 2 件挿入されても partial unique index が片方を拒否し、敗者は勝者の行を読み直す。
export async function ensureBirthdayThread(
  supabase: SupabaseClient,
  input: { birthdayPerson: string; now?: Date },
): Promise<BirthdayThreadRow> {
  const businessDate = getBusinessDate(input.now)
  const threadQuery = () =>
    supabase
      .from('bulletin_posts')
      .select('*')
      .eq('birthday_person', input.birthdayPerson)
      .eq('celebration_date', businessDate.isoDate)
      .eq('is_system_generated', true)
  const { data: existing, error: selectError } = await threadQuery().maybeSingle()
  if (selectError) throw selectError
  if (existing) return existing as BirthdayThreadRow

  const message = `「${input.birthdayPerson}」さんのお誕生日おめでとう！（${businessDate.isoDate}）`
  const { data: inserted, error: insertError } = await supabase
    .from('bulletin_posts')
    .insert({
      sender: 'System',
      message,
      birthday_person: input.birthdayPerson,
      celebration_date: businessDate.isoDate,
      timezone: businessDate.timeZoneLabel,
      is_system_generated: true,
    })
    .select('*')
    .single()
  if (insertError) {
    if (insertError.code === '23505') {
      const { data: winner, error: winnerError } = await threadQuery().maybeSingle()
      if (winnerError) throw winnerError
      if (winner) return winner as BirthdayThreadRow
    }
    throw insertError
  }
  return inserted as BirthdayThreadRow
}

export interface BirthdayCover {
  objectPath: string
  publicUrl: string
}

// 表示時にアルバムから対象者の画像を deterministic に選ぶ。
// 元画像はコピーせず、既存 asset の参照だけを返す。該当がない場合は null。
export async function selectBirthdayCover(
  supabase: SupabaseClient,
  birthdayPerson: string,
): Promise<BirthdayCover | null> {
  const { data, error } = await supabase
    .from('media_submissions')
    .select('object_path')
    .eq('media_kind', 'image')
    .eq('birthday_person', birthdayPerson)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const { data: urlData } = supabase.storage.from('community-media').getPublicUrl(data.object_path)
  return { objectPath: data.object_path, publicUrl: urlData.publicUrl }
}

export interface TodaysBirthdayThread extends BirthdayThreadRow {
  coverUrl: string | null
}

// 今日（Asia/Tokyo）が誕生日の対象者のスレッドを、決定論的な順序で返す。
export async function listTodaysBirthdayThreads(
  supabase: SupabaseClient,
  now?: Date,
): Promise<TodaysBirthdayThread[]> {
  const businessDate = getBusinessDate(now)
  const { data: birthdays, error } = await supabase
    .from('birthdays')
    .select('*')
    .eq('month', businessDate.month)
    .eq('day', businessDate.day)
    .order('month', { ascending: true })
    .order('day', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error

  const threads = await Promise.all(
    (birthdays ?? []).map(async (record) => {
      const birthdayPerson = String(record.name)
      const thread = await ensureBirthdayThread(supabase, { birthdayPerson, now })
      const cover = await selectBirthdayCover(supabase, birthdayPerson)
      return { thread, cover }
    }),
  )

  return threads
    .sort((left, right) => {
      const dateDiff = (left.thread.celebration_date ?? '').localeCompare(right.thread.celebration_date ?? '')
      return dateDiff !== 0 ? dateDiff : (left.thread.birthday_person ?? '').localeCompare(right.thread.birthday_person ?? '')
    })
    .map(({ thread, cover }) => ({ ...thread, coverUrl: cover?.publicUrl ?? null }))
}
