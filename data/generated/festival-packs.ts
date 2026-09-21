import type { FestivalPack } from '@/lib/festivals/types'

export const festivalPacks = [
  {
    "id": "jp-bunka",
    "country": "jp",
    "locale": "en",
    "category": "public-holiday",
    "name": "Culture Day",
    "description": "A holiday celebrating culture and peace.",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 11,
          "startDay": 1,
          "endDay": 7
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "bunka"
  },
  {
    "id": "jp-bunka",
    "country": "jp",
    "locale": "ja",
    "category": "public-holiday",
    "name": "文化の日",
    "description": "文化を祝い、平和を願う祝日です。",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 11,
          "startDay": 1,
          "endDay": 7
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "bunka"
  },
  {
    "id": "jp-christmas",
    "country": "jp",
    "locale": "en",
    "category": "festival",
    "name": "Christmas",
    "description": "The winter holiday season.",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 12,
          "startDay": 20,
          "endDay": 25
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 50,
    "themeKey": "christmas"
  },
  {
    "id": "jp-christmas",
    "country": "jp",
    "locale": "ja",
    "category": "festival",
    "name": "クリスマス",
    "description": "冬の祝祭シーズンです。",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 12,
          "startDay": 20,
          "endDay": 25
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 50,
    "themeKey": "christmas"
  },
  {
    "id": "jp-halloween",
    "country": "jp",
    "locale": "en",
    "category": "festival",
    "name": "Halloween",
    "description": "An autumn festival of costumes and harvest.",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 10,
          "startDay": 28,
          "endDay": 31
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 50,
    "themeKey": "halloween"
  },
  {
    "id": "jp-halloween",
    "country": "jp",
    "locale": "ja",
    "category": "festival",
    "name": "ハロウィン",
    "description": "秋の仮装と収穫の祭りです。",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 10,
          "startDay": 28,
          "endDay": 31
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 50,
    "themeKey": "halloween"
  },
  {
    "id": "jp-hanami",
    "country": "jp",
    "locale": "en",
    "category": "season",
    "name": "Hanami",
    "description": "A spring seasonal event for enjoying cherry blossoms.",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 3,
          "startDay": 20,
          "endDay": 31
        },
        {
          "month": 4,
          "startDay": 1,
          "endDay": 30
        },
        {
          "month": 5,
          "startDay": 1,
          "endDay": 10
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "hanami"
  },
  {
    "id": "jp-hanami",
    "country": "jp",
    "locale": "ja",
    "category": "season",
    "name": "花見",
    "description": "桜を楽しむ春の季節行事です。",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 3,
          "startDay": 20,
          "endDay": 31
        },
        {
          "month": 4,
          "startDay": 1,
          "endDay": 30
        },
        {
          "month": 5,
          "startDay": 1,
          "endDay": 10
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "hanami"
  },
  {
    "id": "jp-kodomo",
    "country": "jp",
    "locale": "en",
    "category": "public-holiday",
    "name": "Children's Day",
    "description": "A holiday wishing for children's healthy growth.",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 5,
          "startDay": 1,
          "endDay": 5
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "kodomo"
  },
  {
    "id": "jp-kodomo",
    "country": "jp",
    "locale": "ja",
    "category": "public-holiday",
    "name": "こどもの日",
    "description": "子どもの健やかな成長を願う祝日です。",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 5,
          "startDay": 1,
          "endDay": 5
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "kodomo"
  },
  {
    "id": "jp-obon",
    "country": "jp",
    "locale": "en",
    "category": "festival",
    "name": "Obon",
    "description": "A traditional summer observance.",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 8,
          "startDay": 13,
          "endDay": 16
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "obon"
  },
  {
    "id": "jp-obon",
    "country": "jp",
    "locale": "ja",
    "category": "festival",
    "name": "お盆",
    "description": "夏に行われる伝統的な行事です。",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 8,
          "startDay": 13,
          "endDay": 16
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "obon"
  },
  {
    "id": "jp-shogatsu",
    "country": "jp",
    "locale": "en",
    "category": "public-holiday",
    "name": "Shogatsu",
    "description": "The New Year period.",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 1,
          "startDay": 1,
          "endDay": 7
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 50,
    "themeKey": "shogatsu"
  },
  {
    "id": "jp-shogatsu",
    "country": "jp",
    "locale": "ja",
    "category": "public-holiday",
    "name": "正月",
    "description": "新年を祝う年始の期間です。",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 1,
          "startDay": 1,
          "endDay": 7
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 50,
    "themeKey": "shogatsu"
  },
  {
    "id": "jp-tanabata",
    "country": "jp",
    "locale": "en",
    "category": "festival",
    "name": "Tanabata",
    "description": "A summer event for writing wishes on paper strips.",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 7,
          "startDay": 1,
          "endDay": 7
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "tanabata"
  },
  {
    "id": "jp-tanabata",
    "country": "jp",
    "locale": "ja",
    "category": "festival",
    "name": "七夕",
    "description": "願いごとを短冊に託す夏の行事です。",
    "dateRule": {
      "calendar": "gregorian",
      "recurrence": "yearly",
      "ranges": [
        {
          "month": 7,
          "startDay": 1,
          "endDay": 7
        }
      ],
      "timeZone": "Asia/Tokyo"
    },
    "enabled": true,
    "status": "enabled",
    "priority": 40,
    "themeKey": "tanabata"
  },
  {
    "id": "jp-tsukimi",
    "country": "jp",
    "locale": "en",
    "category": "festival",
    "name": "Tsukimi",
    "description": "An autumn observance for viewing the moon.",
    "dateRule": {
      "calendar": "lunar",
      "recurrence": "year-specific",
      "payload": {
        "calendarSystem": "traditional-lunar",
        "source": "catalog-review"
      },
      "timeZone": "Asia/Tokyo",
      "status": "unsupported-calendar"
    },
    "enabled": false,
    "status": "unsupported-calendar",
    "priority": 40,
    "themeKey": "tsukimi"
  },
  {
    "id": "jp-tsukimi",
    "country": "jp",
    "locale": "ja",
    "category": "festival",
    "name": "月見",
    "description": "月を眺める秋の行事です。",
    "dateRule": {
      "calendar": "lunar",
      "recurrence": "year-specific",
      "payload": {
        "calendarSystem": "traditional-lunar",
        "source": "catalog-review"
      },
      "timeZone": "Asia/Tokyo",
      "status": "unsupported-calendar"
    },
    "enabled": false,
    "status": "unsupported-calendar",
    "priority": 40,
    "themeKey": "tsukimi"
  }
] as const satisfies readonly FestivalPack[]
