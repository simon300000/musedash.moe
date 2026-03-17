import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { DuckDBInstance } from '@duckdb/node-api'

import { RankValue } from './type.js'

const duckDbPath = resolve(process.cwd(), 'duck.db')
const currentDir = dirname(fileURLToPath(import.meta.url))
const duckTempDir = resolve(currentDir, '../duck-tmp')

const database = await DuckDBInstance.fromCache(duckDbPath, {
  max_memory: '4GB',
  threads: '4',
  temp_directory: duckTempDir
})

const connection = await database.connect()

await connection.run(`
  create table if not exists play (
    object_id varchar primary key,
    created_at timestamptz,
    updated_at timestamptz,
    user_id varchar,
    bms_id bigint,
    character_uid varchar,
    elfin_uid varchar,
    hp integer,
    music_uid varchar,
    music_difficulty integer,
    acc real,
    miss integer,
    judge varchar,
    combo integer,
    score integer,
    visible boolean,
    bms_version varchar,
    music_map_start_delay integer,
    is_check boolean,
    lb_version varchar,
    game_version varchar,
    platform varchar,
    raw varchar
  )
`)

await connection.run(`
  create table if not exists "user" (
    object_id varchar,
    created_at timestamptz,
    updated_at timestamptz,
    nickname varchar,
    user_id varchar primary key
  )
`)

const createPlayStagingTable = (tableName: string) => `
  create temp table ${tableName} (
    object_id varchar,
    created_at varchar,
    updated_at varchar,
    user_id varchar,
    bms_id bigint,
    character_uid varchar,
    elfin_uid varchar,
    hp integer,
    music_uid varchar,
    music_difficulty integer,
    acc real,
    miss integer,
    judge varchar,
    combo integer,
    score integer,
    visible boolean,
    bms_version varchar,
    music_map_start_delay integer,
    is_check boolean,
    lb_version varchar,
    game_version varchar,
    platform varchar,
    raw varchar
  )
`

const createUserStagingTable = (tableName: string) => `
  create temp table ${tableName} (
    object_id varchar,
    created_at varchar,
    updated_at varchar,
    nickname varchar,
    user_id varchar
  )
`

const mergePlay = (tableName: string) => `
  merge into play as target
  using (
    with deduped as (
      select
        object_id,
        cast(created_at as timestamptz) as created_at,
        cast(updated_at as timestamptz) as updated_at,
        user_id,
        bms_id,
        character_uid,
        elfin_uid,
        hp,
        music_uid,
        music_difficulty,
        acc,
        miss,
        judge,
        combo,
        score,
        visible,
        bms_version,
        music_map_start_delay,
        is_check,
        lb_version,
        game_version,
        platform,
        raw,
        row_number() over (
          partition by object_id
        ) as row_num
      from ${tableName}
    )
    select
      object_id,
      created_at,
      updated_at,
      user_id,
      bms_id,
      character_uid,
      elfin_uid,
      hp,
      music_uid,
      music_difficulty,
      acc,
      miss,
      judge,
      combo,
      score,
      visible,
      bms_version,
      music_map_start_delay,
      is_check,
      lb_version,
      game_version,
      platform,
      raw
    from deduped
    where row_num = 1
  ) as source
  on target.object_id = source.object_id
  when matched and
    (
      target.created_at is distinct from source.created_at or
      target.updated_at is distinct from source.updated_at or
      target.user_id is distinct from source.user_id or
      target.bms_id is distinct from source.bms_id or
      target.character_uid is distinct from source.character_uid or
      target.elfin_uid is distinct from source.elfin_uid or
      target.hp is distinct from source.hp or
      target.music_uid is distinct from source.music_uid or
      target.music_difficulty is distinct from source.music_difficulty or
      target.acc is distinct from source.acc or
      target.miss is distinct from source.miss or
      target.judge is distinct from source.judge or
      target.combo is distinct from source.combo or
      target.score is distinct from source.score or
      target.visible is distinct from source.visible or
      target.bms_version is distinct from source.bms_version or
      target.music_map_start_delay is distinct from source.music_map_start_delay or
      target.is_check is distinct from source.is_check or
      target.lb_version is distinct from source.lb_version or
      target.game_version is distinct from source.game_version or
      target.platform is distinct from source.platform or
      target.raw is distinct from source.raw
    )
  then update set
    created_at = source.created_at,
    updated_at = source.updated_at,
    user_id = source.user_id,
    bms_id = source.bms_id,
    character_uid = source.character_uid,
    elfin_uid = source.elfin_uid,
    hp = source.hp,
    music_uid = source.music_uid,
    music_difficulty = source.music_difficulty,
    acc = source.acc,
    miss = source.miss,
    judge = source.judge,
    combo = source.combo,
    score = source.score,
    visible = source.visible,
    bms_version = source.bms_version,
    music_map_start_delay = source.music_map_start_delay,
    is_check = source.is_check,
    lb_version = source.lb_version,
    game_version = source.game_version,
    platform = source.platform,
    raw = source.raw
  when not matched then insert (
    object_id,
    created_at,
    updated_at,
    user_id,
    bms_id,
    character_uid,
    elfin_uid,
    hp,
    music_uid,
    music_difficulty,
    acc,
    miss,
    judge,
    combo,
    score,
    visible,
    bms_version,
    music_map_start_delay,
    is_check,
    lb_version,
    game_version,
    platform,
    raw
  ) values (
    source.object_id,
    source.created_at,
    source.updated_at,
    source.user_id,
    source.bms_id,
    source.character_uid,
    source.elfin_uid,
    source.hp,
    source.music_uid,
    source.music_difficulty,
    source.acc,
    source.miss,
    source.judge,
    source.combo,
    source.score,
    source.visible,
    source.bms_version,
    source.music_map_start_delay,
    source.is_check,
    source.lb_version,
    source.game_version,
    source.platform,
    source.raw
  )
`

const mergeUser = (tableName: string) => `
  merge into "user" as target
  using (
    with deduped as (
      select
        object_id,
        cast(created_at as timestamptz) as created_at,
        cast(updated_at as timestamptz) as updated_at,
        nickname,
        user_id,
        row_number() over (
          partition by user_id
        ) as row_num
      from ${tableName}
    )
    select
      object_id,
      created_at,
      updated_at,
      nickname,
      user_id
    from deduped
    where row_num = 1
  ) as source
  on target.user_id = source.user_id
  when matched and
    (
      target.object_id is distinct from source.object_id or
      target.created_at is distinct from source.created_at or
      target.updated_at is distinct from source.updated_at or
      target.nickname is distinct from source.nickname
    )
  then update set
    object_id = source.object_id,
    created_at = source.created_at,
    updated_at = source.updated_at,
    nickname = source.nickname
  when not matched then insert (
    object_id,
    created_at,
    updated_at,
    nickname,
    user_id
  ) values (
    source.object_id,
    source.created_at,
    source.updated_at,
    source.nickname,
    source.user_id
  )
`

const getUndefinedEntries = (value: Record<string, unknown>) => Object.entries(value)
  .filter(([, entryValue]) => entryValue === undefined)

const logUndefinedEntries = (label: string, value: Record<string, unknown>) => {
  const undefinedEntries = getUndefinedEntries(value)
  if (!undefinedEntries.length) {
    return
  }

  console.error(`[duck] ${label} has undefined fields:`, undefinedEntries.map(([key]) => key))
  console.error(`[duck] ${label} payload:`, value)
}

const appendNullable = <T>(value: T | null | undefined, append: (entry: T) => void, appendNull: () => void) => {
  if (value === undefined || value === null) {
    appendNull()
    return
  }

  append(value)
}

const buildTempTableName = (prefix: string) => {
  const suffix = `${process.pid}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`
  return `${prefix}_${suffix}`.replaceAll(/\W/g, '_')
}

export const insertPlays = async (platform: string, plays: RankValue[]) => {
  if (!plays.length) {
    return
  }

  const playStagingTable = buildTempTableName('play_staging')
  const userStagingTable = buildTempTableName('user_staging')

  const connection = await database.connect()

  try {
    await connection.run('begin')
    await connection.run(createPlayStagingTable(playStagingTable))
    await connection.run(createUserStagingTable(userStagingTable))

    const playAppender = await connection.createAppender(playStagingTable)
    const userAppender = await connection.createAppender(userStagingTable)

    try {
      for (const rankValue of plays) {
        const { history: _history, play, user } = rankValue

        const playPayload = {
          ...play,
          platform,
          raw: JSON.stringify({ play, user })
        }

        const userPayload = user

        try {
          appendNullable(playPayload.object_id, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.created_at, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.updated_at, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.user_id, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.bms_id, value => playAppender.appendBigInt(BigInt(value)), () => playAppender.appendNull())
          appendNullable(playPayload.character_uid, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.elfin_uid, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.hp, value => playAppender.appendInteger(value), () => playAppender.appendNull())
          appendNullable(playPayload.music_uid, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.music_difficulty, value => playAppender.appendInteger(value), () => playAppender.appendNull())
          appendNullable(playPayload.acc, value => playAppender.appendFloat(value), () => playAppender.appendNull())
          appendNullable(playPayload.miss, value => playAppender.appendInteger(value), () => playAppender.appendNull())
          appendNullable(playPayload.judge, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.combo, value => playAppender.appendInteger(value), () => playAppender.appendNull())
          appendNullable(playPayload.score, value => playAppender.appendInteger(value), () => playAppender.appendNull())
          appendNullable(playPayload.visible, value => playAppender.appendBoolean(value), () => playAppender.appendNull())
          appendNullable(playPayload.bms_version, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.music_map_start_delay, value => playAppender.appendInteger(value), () => playAppender.appendNull())
          appendNullable(playPayload.is_check, value => playAppender.appendBoolean(value), () => playAppender.appendNull())
          appendNullable(playPayload.lb_version, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.game_version, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.platform, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          appendNullable(playPayload.raw, value => playAppender.appendVarchar(value), () => playAppender.appendNull())
          playAppender.endRow()
        } catch (e) {
          console.error(`[duck] Failed to stage play ${play.object_id}:`, e)
          logUndefinedEntries(`[duck] ${platform} play staging payload`, playPayload)
          throw e
        }

        try {
          appendNullable(userPayload.object_id, value => userAppender.appendVarchar(value), () => userAppender.appendNull())
          appendNullable(userPayload.created_at, value => userAppender.appendVarchar(value), () => userAppender.appendNull())
          appendNullable(userPayload.updated_at, value => userAppender.appendVarchar(value), () => userAppender.appendNull())
          appendNullable(userPayload.nickname, value => userAppender.appendVarchar(value), () => userAppender.appendNull())
          appendNullable(userPayload.user_id, value => userAppender.appendVarchar(value), () => userAppender.appendNull())
          userAppender.endRow()
        } catch (e) {
          console.error(`[duck] Failed to stage user ${user.object_id}:`, e)
          logUndefinedEntries(`[duck] ${platform} user staging payload`, { ...userPayload })
          throw e
        }
      }

      playAppender.closeSync()
      userAppender.closeSync()
    } catch (e) {
      try {
        playAppender.closeSync()
      } catch { }
      try {
        userAppender.closeSync()
      } catch { }
      throw e
    }

    await connection.run(mergePlay(playStagingTable))
    await connection.run(mergeUser(userStagingTable))
    await connection.run('commit')
  } catch (e) {
    await connection.run('rollback').catch(() => undefined)
    throw e
  } finally {
    connection.closeSync()
  }
}
