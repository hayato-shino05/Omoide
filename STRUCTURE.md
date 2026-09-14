# 📁 プロジェクト構成（Omoide）

> 想い出箱（Omoide Bako）のディレクトリ構成とアーキテクチャをまとめたドキュメントです。
>
> Next.js 16 の App Router を前提に、UI コンポーネント / ビジネスロジック / 状態管理 / 設定ファイルを明確に分離しています。

---

## 概要

- フロントエンドフレームワーク: **Next.js 16 (App Router)**
- 言語: **TypeScript / React**
- 状態管理: **Zustand**, 一部 React hooks
- バックエンド: **Supabase (PostgreSQL + Storage + Realtime)**

プロジェクトは「ページ」「機能」「UI」「コアライブラリ」をレイヤーごとに分け、保守しやすく拡張しやすい構成を目指しています。

---

## ディレクトリツリー（トップレベル）

```text
omoide/
├── app/                     # Next.js App Router エントリ & API ルート
├── components/              # 再利用可能な React コンポーネント
├── data/                    # i18n および祝祭日テーマ（13 種）のデータ
├── lib/                     # コアロジック（hooks, stores, i18n など）
├── config/                  # テーマ・音楽などの設定
├── types/                   # TypeScript 型定義
├── public/                  # 画像・フォントなどの静的アセット
├── __tests__/               # テストコード
└── 各種設定ファイル         # lint / format / build 設定
```

---

## `/app` – Next.js App Router

```text
app/
├── layout.tsx              # ルートレイアウト + 共通プロバイダ
├── page.tsx                # トップページ
├── globals.css             # グローバルスタイル + テーマ CSS
├── sitemap.ts              # SEO 用サイトマップ
├── favicon.ico             # ファビコン
│
└── api/                    # REST 形式の API ルート
    ├── birthdays/
    │   ├── route.ts        # GET（一覧・月 / limit 絞り込み）
    │   ├── [id]/route.ts   # GET（単件取得）
    │   ├── check/route.ts  # GET（指定日 or 今日が誕生日か）
    │   └── next/route.ts   # GET（次に来る誕生日を計算）
    │
    ├── messages/
    │   ├── route.ts        # GET（一覧）, POST（テキスト投稿）
    │   ├── [id]/route.ts   # GET（単件取得）
    │   └── latest/route.ts # GET（最新メッセージ）
    │
    ├── community/          # コミュニティ投稿（service_role 経由で DB に書き込む）
    │   ├── route.ts        # POST（メッセージ / 掲示板投稿。メディア・楽曲付きに対応）
    │   ├── birthday-threads/route.ts  # GET（今日の誕生日スレッド一覧）
    │   ├── reply/route.ts  # POST（誕生日スレッドへの返信。テキスト or 楽曲）
    │   └── media/
    │       ├── route.ts          # POST（multipart 直接アップロード + metadata 登録）
    │       ├── sign/route.ts     # POST（署名付き直接アップロード用トークン発行）
    │       └── finalize/route.ts # POST（アップロード実体の検証 + media_submissions 確定）
    │
    ├── media/
    │   ├── route.ts        # GET（一覧・検索・集計）
    │   ├── [id]/route.ts   # GET（単件取得）
    │   └── tags/route.ts   # GET（タグ一覧。現在は常に空を返す）
    │
    ├── gifts/
    │   ├── route.ts        # GET, POST（バーチャルギフト）
    │   └── [id]/route.ts   # GET（単件取得）
    │
    ├── music/              # 厳選楽曲（Cloudflare R2 + Supabase / Jamendo / SoundCloud）
    │   ├── curated/route.ts # GET（Supabase + R2 キュレーション楽曲一覧・歌詞・並び順取得）
    │   ├── search/route.ts  # GET（キーワード検索）
    │   └── resolve/route.ts # GET（provider:trackId → 再生 URL を解決）
    │
    ├── audio/route.ts      # GET（音声メッセージ一覧）
    ├── video/route.ts      # GET（動画メッセージ一覧）
    ├── upload/route.ts     # POST（常に 405。ブラウザから直接アップロードへ誘導）
    │
    ├── time-capsules/      # 認証ユーザー所有のタイムカプセル
    │   ├── route.ts        # GET（自分の一覧）, POST（作成）
    │   ├── [id]/route.ts   # GET（単件。所有者 or 招待トークン）
    │   ├── [id]/access/route.ts  # POST（招待トークンで開封）
    │   ├── [id]/revoke/route.ts  # POST（招待トークン無効化）
    │   ├── access/route.ts # POST（アクセスコードで開封）
    │   └── uploads/route.ts # POST（写真の署名付きアップロード準備）, DELETE（取消）
    │
    └── internal/
        └── birthday-scheduler/route.ts # POST（誕生日スレッド定期生成。シークレット認証付き）
```

---

## `/components` – React コンポーネント

### UI コンポーネント（`/components/ui/`）

デザインシステムに基づいた再利用可能な UI コンポーネント群です。

| Component | 説明 |
|-----------|------|
| `Button.tsx` | プライマリ / セカンダリ / ビンテージなどのボタンバリエーション |
| `ButtonVintage.tsx` | ビンテージ風スタイルのボタン |
| `Input.tsx` | バリデーション付きテキスト入力 |
| `Textarea.tsx` | 複数行テキスト入力 |
| `Select.tsx` | セレクトボックス |
| `Card.tsx` | 汎用カードコンテナ |
| `Modal.tsx` | モーダルダイアログ（sm, md, lg, xl, widescreen） |
| `ModalManager.tsx` | 全体のモーダル状態管理 |
| `Toast.tsx` | トースト通知コンポーネント |
| `Loading.tsx` | ローディングスピナー |
| `ErrorBoundary.tsx` | エラーバウンダリラッパー |

**音楽関連コンポーネント**

| Component | 説明 |
|-----------|------|
| `MusicPlayer.tsx` | デスクトップ向け常駐プレーヤー。再生 / 一時停止・音量・シーク（進行度フィル付き）・曲送り・シャッフル・リピートに加え、歌詞トグルと楽曲選択に対応 |
| `LyricsDrawer.tsx` | リアルタイム同期歌詞ドロワー。LRC 形式のタイムスタンプ解析と再生時間に合わせた自動スクロール表示 |

> 楽曲の選択 UI（`SongPickerModal.tsx`）、選択済み楽曲の表示（`SelectedMusicTrackRow.tsx`）、楽曲付き投稿のサウンドカード（`MusicComment.tsx`）は `/components/community/` に配置しています。モバイル向けのプレーヤー操作は `/components/ui/MobileBottomDock.tsx` に統合されています。

**ナビゲーションコンポーネント**

| Component | 説明 |
|-----------|------|
| `LanguageSelector.tsx` | UI 言語の切り替え（英語 / 日本語） |
| `ThemeIndicator.tsx` | 現在のテーマ表示 |
| `HeaderButtons.tsx` | ヘッダーアクションボタン群 |
| `GameButtons.tsx` | デスクトップ向けミニゲームナビゲーションボタン群 |
| `MobileBottomDock.tsx` | モバイル向けボトムナビゲーション & 和風の抽斗（Drawer）メニュー |
| `MobileGameMenu.tsx` | モバイル専用ミニゲームセレクター |
| `SocialButtons.tsx` | SNS 共有ボタン |
| `ShareButton.tsx` | 単体の共有ボタン |
| `FeatureButton.tsx` | 特定機能の ON/OFF トグル |

---

### 3D コンポーネント（`/components/3d/`）

Three.js WebGL を活用したリッチな 3D インタラクティブ体験を提供するコンポーネントです。

| Component | 説明 |
|-----------|------|
| `OmikujiCylinder3D.tsx` | 360 度回転・ドラッグ＆クリック物理シェイク対応の 3D おみくじ筒。RoomEnvironment 反射、PBR 真鍮金箔、手彫り木目テクスチャ、接地シャドウ、竹製みくじ棒のせり出し演出を実装 |

---

### 誕生日機能コンポーネント（`/components/features/`）

誕生日祝い体験に特化したコンポーネントです。

| Component | 説明 |
|-----------|------|
| `BirthdayCake.tsx` | 3D ケーキ + アニメーション |
| `Cake2D.tsx` | 2D ケーキ（フォールバック） |
| `Candle.tsx` | ロウソク単体コンポーネント |
| `BlowButton.tsx` | マイク入力を使った「ロウソクを吹き消す」体験 |
| `CountdownTimer.tsx` | 誕生日までのカウントダウンロジック |
| `CountdownDisplay.tsx` | カウントダウン表示 |
| `BirthdayChecker.tsx` | 今日が誕生日かどうかのチェック |
| `BirthdayHub.tsx` | 誕生日イベントのハブ画面（今日 / これから / 過去の誕生日を整理） |
| `BirthdayHero.tsx` | ヒーローセクション |
| `BirthdayMessage.tsx` | お祝いメッセージ表示 |
| `DailyOmikuji.tsx` | 3D おみくじと連動した運勢表示（和歌・4大運勢・ラッキーアイテム・localStorage 永続化） |
| `OnThisDayFlashback.tsx` | 過去の同じ月日の思い出を振り返るフラッシュバック機能 |
| `PhotoFrame.tsx` | 和風・季節フレーム付きフォト撮影機能 |

**メディア関連コンポーネント**

| Component | 説明 |
|-----------|------|
| `PhotoGallery.tsx` | グリッド表示のフォトギャラリー |
| `PhotoCard.tsx` | 単一写真カード |
| `MediaViewer.tsx` | フルスクリーンのメディアビューア |
| `MediaUploader.tsx` | ドラッグ&ドロップ対応アップローダー |
| `Slideshow.tsx` | スライドショー |
| `TagInput.tsx` | メディア用タグ入力 |

**アニメーションコンポーネント**

| Component | 説明 |
|-----------|------|
| `Fireworks.tsx` | 花火アニメーション |
| `Balloons.tsx` | 風船アニメーション |
| `Confetti.tsx` | 紙吹雪アニメーション |

---

### コミュニティコンポーネント（`/components/community/`）

チャットや掲示板など、コミュニケーション機能をまとめたレイヤーです。

| Component | 説明 |
|-----------|------|
| `ChatRoom.tsx` | リアルタイムグループチャット |
| `MessageList.tsx` | メッセージ一覧表示 |
| `MessageForm.tsx` | メッセージ入力フォーム |
| `MessageModal.tsx` | モーダル形式のメッセージ表示 |
| `BulletinBoard.tsx` | ソーシャル掲示板 |
| `BulletinPost.tsx` | 単一投稿表示 |
| `PostForm.tsx` | 投稿作成フォーム |
| `PostDetail.tsx` | 返信を含む投稿詳細 |
| `ContributorPromptButtons.tsx` | 投稿内容の提案ボタン群（メッセージ / 投稿フォーム用） |
| `TimeCapsule.tsx` | 未来の指定日に届くタイムカプセル（手紙・写真・音声封入） |

**メディアメッセージ**

| Component | 説明 |
|-----------|------|
| `VideoMessageList.tsx` | 動画メッセージ一覧 |
| `VideoRecorder.tsx` | 動画録画 UI |
| `AudioMessageList.tsx` | 音声メッセージ一覧 |
| `AudioRecorder.tsx` | 音声録音 UI |
| `CameraCapture.tsx` | カメラキャプチャ |

**ギフト**

| Component | 説明 |
|-----------|------|
| `GiftSelector.tsx` | ギフト選択 UI |
| `GiftAnimation.tsx` | ギフト演出アニメーション |

**楽曲付きメッセージ・返信**

| Component | 説明 |
|-----------|------|
| `SongPickerModal.tsx` | 楽曲を検索 / プリセットから選ぶモーダル（プレビュー再生付き） |
| `SelectedMusicTrackRow.tsx` | 選択済み楽曲の表示行（プレビュー / 変更 / 解除） |
| `MusicComment.tsx` | 楽曲付きメッセージ・返信のサウンドカード表示（`provider:trackId` を解決して再生） |

---

### ゲームコンポーネント（`/components/games/`）

誕生日向けのミニゲーム群です。

| Component | 説明 |
|-----------|------|
| `MemoryGame.tsx` | 神経衰弱ゲーム |
| `MemoryCard.tsx` | 神経衰弱用カード |
| `BirthdayQuiz.tsx` | 誕生日クイズ |
| `PuzzleGame.tsx` | ジグソーパズル |
| `BirthdayCalendar.tsx` | 誕生日カレンダー |

---

### エフェクトコンポーネント（`/components/effects/`）

| Component | 説明 |
|-----------|------|
| `ThemeEffects.tsx` | テーマに応じたエフェクト切り替えディスパッチャー |
| `Bats.tsx` | コウモリが羽ばたき横断するハロウィン用エフェクト |
| `ChristmasLights.tsx` | 画面上部に吊るされた多色イルミネーション電飾エフェクト |
| `Confetti.tsx` | 4種形状・物理演算対応の汎用高機能紙吹雪エフェクト |
| `FallingLeaves.tsx` | モミジ・イチョウが3D回転しながら舞い落ちる秋エフェクト |
| `FallingPetals.tsx` | 桜の花びらが3Dフリップ回転で舞い散る春エフェクト |
| `FallingSnow.tsx` | 遠近感のある複数レイヤーで舞い散る雪結晶エフェクト |
| `Fireflies.tsx` | 夏・七夕の夜間に浮遊する有機的ホタル光エフェクト |
| `FloatingLanterns.tsx` | 温かな光を放ちながら上昇する日本の伝統提灯エフェクト |
| `Ghosts.tsx` | 半透明の愛らしいお化けが揺らめくハロウィン用エフェクト |
| `Koinobori.tsx` | 空を泳ぐ真鯉・緋鯉・子鯉のこどもの日エフェクト |
| `MoonGlow.tsx` | お月見用の満月神秘円形光背（コロナ）エフェクト |
| `ParticleSystem.tsx` | HTML5 Canvas 高性能パーティクル（5種プリセット・マウス追従） |
| `Sparkles.tsx` | 四芒星のゴールドキラキラパーティクルエフェクト |
| `VideoBackground.tsx` | サーバー時間同期再生対応の動画背景コンポーネント |

---

### レイアウトコンポーネント（`/components/layout/`）

ページ全体の骨組みを定義するコンポーネントです。

| Component | 説明 |
|-----------|------|
| `MainLayout.tsx` | アプリ全体のレイアウト |
| `Header.tsx` | ヘッダー |
| `Footer.tsx` | フッター |
| `FloatingNav.tsx` | 浮遊型ナビゲーション |

---

## `/lib` – コアライブラリ

### Hooks（`/lib/hooks/`）

ビジネスロジックや UI ロジックをカプセル化したカスタムフック群です。

**データ取得系 Hooks**

| Hook | 説明 |
|------|------|
| `useBirthdays.ts` | 誕生日の CRUD 操作 |
| `useBirthdayCheck.ts` | 今日が誕生日かどうかのチェック |
| `useNextBirthday.ts` | 次の誕生日情報を取得 |
| `useMessages.ts` | メッセージ一覧の管理 |
| `useRealtimeMessages.ts` | Realtime メッセージ購読 |
| `usePosts.ts` | 掲示板投稿 + 返信の取得 |
| `useGifts.ts` | バーチャルギフトの取得・送信 |
| `useMediaFiles.ts` | メディアファイル管理 |
| `useUserName.ts` | ローカルストレージに保存したユーザー名の管理 |

**メディア系 Hooks**

| Hook | 説明 |
|------|------|
| `useMusicPlayer.tsx` | 音楽プレーヤーの状態管理（Context Provider）。再生制御に加え `/api/music/resolve` 経由の楽曲プレビューに対応 |
| `useSlideshow.ts` | スライドショー制御 |
| `useVideoMessages.ts` | 動画メッセージ管理 |
| `useAudioMessages.ts` | 音声メッセージ管理 |
| `useVideoRecorder.ts` | 動画録画ロジック |
| `useAudioRecorder.ts` | 音声録音ロジック |
| `useMicrophone.ts` | マイクアクセス制御 |

**ゲームロジック Hooks**

| Hook | 説明 |
|------|------|
| `useMemoryGame.ts` | 神経衰弱ゲームのロジック |
| `usePuzzleGame.ts` | パズルゲームのロジック |
| `useQuiz.ts` | クイズロジック |

**ユーティリティ Hooks**

| Hook | 説明 |
|------|------|
| `useTheme.ts` | テーマ状態の管理・検出 |
| `useMediaQuery.ts` | レスポンシブブレークポイント判定 |
| `useSwipeGesture.ts` | スワイプジェスチャー検出 |
| `useKeyboardShortcuts.ts` | キーボードショートカット |
| `useUserName.ts` | ユーザー名の保持 |

---

### Stores（`/lib/stores/`）

Zustand を使ったグローバル状態管理レイヤーです。必要に応じて `persist` ミドルウェアで永続化します。

| Store | 説明 |
|-------|------|
| `birthdayStore.ts` | 誕生日データの状態（CRUD / 次の誕生日など） |
| `themeStore.ts` | テーマ選択（季節・日本 / 国際イベントから自動判定） |
| `musicStore.ts` | 音楽プレーヤー設定の永続化（音量 / リピート / シャッフル）。再生状態そのものは `useMusicPlayer` が管理 |
| `gameStore.ts` | ゲームスコアやハイスコア管理 |
| `uiStore.ts` | モーダル / トーストなど UI 状態 |
| `index.ts` | 各ストアのエクスポート集約 |

> 言語状態は Zustand ストアではなく `/lib/i18n/LanguageContext.tsx` の React Context で管理しています。

---

### Providers（`/lib/providers/`）

React コンテキストや外部ライブラリのプロバイダをまとめたレイヤーです。

| Provider | 説明 |
|----------|------|
| `ThemeProvider.tsx` | テーマコンテキスト（季節・イベントに応じた自動検出） |
| `QueryProvider.tsx` | TanStack Query クライアントのプロバイダ |

> 言語コンテキストは `/lib/i18n/LanguageContext.tsx` に配置しています。

---

### i18n（`/lib/i18n/`）

クライアント側の言語コンテキストと翻訳データです。

| File | 説明 |
|------|------|
| `LanguageContext.tsx` | 言語コンテキスト（英語 / 日本語） |
| `translations.ts` | 翻訳テーブル（型付き） |
| `types.ts` | 翻訳キーの型定義 |
| `resolveLocale.ts` | Cookie / 環境からロケールを解決 |
| `cookie.ts` | 言語 Cookie の読み書き |

---

### Festivals（`/lib/festivals/`）

祝祭日パックの評価・検証レイヤーです。

| File | 説明 |
|------|------|
| `types.ts` | 祝祭日パック・ルール関連の型定義 |
| `validation.ts` | 祝祭日パック JSON スキーマ検証 |
| `evaluator.ts` | 祝祭日の発生判定ロジック |
| `parity.ts` | ロケール間のパリティ（有効性 / 内容）チェック |
| `legacyAdapter.ts` | 旧フォーマットの祝祭日データを変換するアダプタ |

---

### Reminders（`/lib/reminders/`）

リマインダー配信ロジックです。

| File | 説明 |
|------|------|
| `engine.ts` | リマインダー判定エンジン |
| `durable.ts` | 永続化対応のリマインダースケジューラ |

---

### Time Capsule（`/lib/time-capsule/`）

サーバーサイドのタイムカプセル処理です。

| File | 説明 |
|------|------|
| `server.ts` | タイムカプセル API のサーバー側ヘルパー。`createServiceClient` や署名付きアップロード用トークンを提供し、community / birthday / music のサーバー処理からも共用する |

---

### その他のサブディレクトリ

| ディレクトリ | 説明 |
|-------------|------|
| `/lib/supabase/` | Supabase クライアントとクエリ関連ユーティリティ |
| `/lib/music/` | 厳選楽曲（Cloudflare R2 + Supabase / Jamendo / SoundCloud）。`types.ts`（provider / reference / TrackLyrics 型）、`reference.ts`（`provider:trackId` の parse / serialize）、`lyrics.ts`（LRC タイムスタンプ解析・リアルタイム同期歌詞ヘルパー）、`presets.ts`（Jamendo プリセット）、`server.ts`（server-only の検索・解決） |
| `/lib/community/` | コミュニティ投稿のサーバー側処理。`server.ts`（投稿 + メディア + 楽曲）、`reply.ts`（誕生日スレッド返信） |
| `/lib/birthday/` | 誕生日スレッド生成。`date.ts`（営業日 / タイムゾーン）、`thread.ts`（スレッド検索・生成・カバー選択） |
| `/lib/animations/` | `variants.ts` による Framer Motion 用バリアント定義 |
| `/lib/utils/` | 汎用ユーティリティ関数（`birthday.ts`, `media.ts`, `theme.ts`, `videoThumbnail.ts`） |
| `/lib/validations/` | Zod を使ったバリデーションスキーマ |

---

### `/lib` ルート直下のユーティリティ

| File | 説明 |
|------|------|
| `healthcheck.ts` | 稼働確認用エンドポイントのヘルパー |
| `share.ts` | Web Share API フォールバックを含むシェアヘルパー |
| `time-capsule-client.ts` | クライアントからタイムカプセル API を呼び出すヘルパー |
| `omikujiHistory.ts` | おみくじ履歴の永続化ヘルパー |

---

## `/data` – 静的データとマニフェスト

| ディレクトリ / ファイル | 説明 |
|-----------------------|------|
| `omikujiData.ts` | 12 種類の本格和風おみくじデータ（大吉〜半吉、和歌・俳句、4大運勢、ラッキー色・品・数） |
| `i18n/en.json` | 英語 UI 辞書データ |
| `i18n/ja.json` | 日本語 UI 辞書データ |
| `i18n/keys.json` | i18n キー一覧（整合性チェック用） |
| `festivals/jp/en.json` | 日本の祝祭日データ辞書（英語）。`generated/themes.ts` の 13 テーマのうち和風イベント系 9 件（クリスマス・ハロウィン・お花見・お盆・月見・七夕・正月・こどもの日・文化の日）の表示用テキストを定義 |
| `festivals/jp/ja.json` | 日本の祝祭日データ辞書（日本語版、上記と同内容） |
| `schemas/festival-pack.schema.json` | 祝祭日パックの JSON Schema |
| `schemas/i18n.schema.json` | i18n 辞書の JSON Schema |
| `generated/festival-packs.ts` | 自動生成された祝祭日パックマニフェスト |
| `generated/locales.ts` | 自動生成されたロケールマニフェスト |
| `generated/themes.ts` | 自動生成されたテーママニフェスト（13 の祝祭日テーマ：季節 4 + 和風イベント 9） |

---

## `/config` – 設定ファイル

| File | 説明 |
|------|------|
| `themes.ts` | 季節・イベントごとのテーマ設定（色・背景・エフェクトなど） |
| `music.ts` | デフォルト楽曲リスト（`lib/music/presets.ts` の Jamendo プリセットを整形）と ID 検索ヘルパー |

---

## `/types` – TypeScript 型

主要なドメインモデルを TypeScript 型として定義しています。

```typescript
// 代表的な型（types/index.ts より一部抜粋）
interface Birthday { id: number; name: string; month: number; day: number; year?: number; message?: string }
interface CustomMessage { id: number; sender: string; message: string; media_url?: string }
interface AudioMessage { id: number; sender: string; audio_data: string; duration?: number }
interface VideoMessage { id: number; sender: string; video_url: string; thumbnail_url?: string }
interface MediaFile { id: number; file_name: string; file_path: string; file_type: 'image' | 'video' }
interface VirtualGift { id: number; sender: string; gift_emoji: string; gift_name: string }
interface BulletinPost { id: number; author: string; content: string; likes: number; replies?: BulletinReply[] }
type ThemeName = 'spring' | 'summer' | 'autumn' | 'winter' | ...
type Language = 'en' | 'ja'
```

---

## 設定ファイル群

| File | 説明 |
|------|------|
| `package.json` | 依存関係と npm scripts |
| `next.config.ts` | Next.js の設定 |
| `tsconfig.json` | TypeScript コンパイラ設定 |
| `vitest.config.ts` | Vitest 設定 |
| `vitest.setup.ts` | テストセットアップコード |
| `.prettierrc` | Prettier フォーマット設定 |
| `eslint.config.mjs` | ESLint ルール定義 |
| `postcss.config.mjs` | PostCSS / Tailwind 設定 |

---

## `/__tests__` – テストコード

Vitest ベースの単体・統合テストと、E2E（Playwright）以外の検証用テストを格納します。

### API ルート（`/__tests__/api/`）

| File | 対象 |
|------|------|
| `birthdays-route.test.ts` | `/api/birthdays` 一覧ルート |
| `route-limit-validation.test.ts` | ルート共通のレートリミット・バリデーション |
| `time-capsules-route.test.ts` | `/api/time-capsules` ルート |
| `time-capsules-access-route.test.ts` | `/api/time-capsules/access` ルート |
| `time-capsules-invite-access-route.test.ts` | 招待経由のアクセスルート |
| `community-route.test.ts` | `/api/community` ルート |
| `community-media-route.test.ts` | `/api/community/media`（multipart 直接アップロード）ルート |
| `community-media-signed-route.test.ts` | `/api/community/media/sign` / `finalize`（署名付きアップロード）ルート |
| `community-reply-route.test.ts` | `/api/community/reply` ルート |
| `community-birthday-threads-route.test.ts` | `/api/community/birthday-threads` ルート |
| `music-search-route.test.ts` | `/api/music/search` ルート |
| `music-resolve-route.test.ts` | `/api/music/resolve` ルート |
| `birthday-scheduler-route.test.ts` | `/api/internal/birthday-scheduler` ルート |

> `/api/media`（GET 一覧）のルートテストは `__tests__/app/api/media-route.test.ts` にあります。

### コンポーネント（`/__tests__/components/`）

| File | 対象 |
|------|------|
| `Button.test.tsx` | `Button` UI コンポーネント |
| `Input.test.tsx` | `Input` UI コンポーネント |
| `Confetti.test.tsx` | `Confetti` エフェクト |
| `DailyOmikuji.test.tsx` | `DailyOmikuji` 機能 |
| `PhotoCard.keyboard.test.tsx` | `PhotoCard` のキーボード操作 |
| `ContributorPromptButtons.test.tsx` | 投稿プロンプトボタン群 |
| `MessageList.test.tsx` | `MessageList` の楽曲付きメッセージ表示 |
| `SelectedMusicTrackRow.test.tsx` | `SelectedMusicTrackRow`（楽曲選択行） |
| `ChatRoom.test.ts` | `ChatRoom` コミュニティ |
| `TimeCapsule.test.tsx` | `TimeCapsule` コミュニティ |
| `features/BirthdayHub.events.test.ts` | `BirthdayHub` のイベント判定（midnight 跨ぎ） |
| `mobile-touch-targets.test.ts` | モバイルのタッチターゲット検証 |

### 統合テスト（`/__tests__/integration/`）

| File | 対象 |
|------|------|
| `anonymous-community-contract.test.ts` | 匿名コミュニティの API 契約 |
| `anonymous-flow.local.test.ts` | 匿名フローのローカル実行 |
| `production-snapshot-regression.test.ts` | 本番スナップショットに対する回帰検証 |
| `theme-provider-smoke.test.tsx` | `ThemeProvider` のスモークテスト |
| `community-submission-rpc-migration.test.ts` | `create_community_submission` RPC の migration 整合 |
| `birthday-thread-reply-migration.test.ts` | 誕生日スレッド + `create_birthday_reply` の migration 整合 |
| `revoke-anonymous-music-upload-migration.test.ts` | music 匿名アップロード取り消しの migration 整合 |

### ライブラリ（`/__tests__/lib/`）

| File | 対象 |
|------|------|
| `community-media.test.ts` | `lib/supabase/communityMedia.ts` |
| `birthday-date.test.ts` | `lib/birthday/date.ts` |
| `birthday-thread.test.ts` | `lib/birthday/thread.ts` |
| `music-presets.test.ts` | `lib/music/presets.ts` |
| `music-reference.test.ts` | `lib/music/reference.ts` |
| `music-server.test.ts` | `lib/music/server.ts` |
| `healthcheck.test.ts` | `lib/healthcheck.ts` |
| `media-objecturl.test.ts` | `lib/utils/media.ts` の ObjectURL 処理 |
| `omikujiData.test.ts` | おみくじデータ整合性 |
| `omikujiHistory.test.ts` | `lib/omikujiHistory.ts` |
| `share.test.ts` | `lib/share.ts` |
| `upload-validation.test.ts` | `lib/validations/upload.ts` |
| `validations.test.ts` | `lib/validations/schemas.ts` |
| `time-capsule-client.test.ts` | `lib/time-capsule-client.ts` |
| `time-capsule-server.test.ts` | `lib/time-capsule/server.ts` |
| `hooks/useMediaQuery.test.ts` | `useMediaQuery` フック |
| `hooks/useUserName.test.ts` | `useUserName` フック |
| `i18n/locale.test.ts` | ロケール解決ロジック |
| `i18n/translation-parity.test.ts` | 翻訳キーのロケール間パリティ |
| `festivals/evaluator.test.ts` | `lib/festivals/evaluator.ts` |
| `festivals/legacy-adapter.test.ts` | `lib/festivals/legacyAdapter.ts` |
| `festivals/parity.test.ts` | `lib/festivals/parity.ts` |
| `festivals/validation.test.ts` | `lib/festivals/validation.ts` |
| `festivals/fixtures/*.json` | テスト用フィクスチャ（重複 ID / 不正日付 / 未対応暦） |
| `reminders/durable.test.ts` | `lib/reminders/durable.ts` |
| `reminders/engine.test.ts` | `lib/reminders/engine.ts` |
| `stores/uiStore-focus.test.ts` | `uiStore` のフォーカス管理 |

### スクリプト（`/__tests__/scripts/`）

| File | 対象 |
|------|------|
| `collect-festival-snapshot.test.ts` | `scripts/collect-festival-snapshot.mjs` |
| `compare-festival-catalogs.test.ts` | `scripts/compare-festival-catalogs.mjs` |
| `generate-data-manifest.test.ts` | `scripts/generate-data-manifest.mjs` |

### Supabase マイグレーション整合性

| File | 対象 |
|------|------|
| `supabase-time-capsule-access-migration.test.ts` | タイムカプセルアクセスマイグレーション |
| `supabase-time-capsule-open-tracking-migration.test.ts` | 開封トラッキングマイグレーション |

---

## `/e2e` – End-to-End テスト

Playwright による E2E スモークテストです。

| File | 説明 |
|------|------|
| `smoke.spec.ts` | 起動・主要画面のスモーク確認 |

---

## `/scripts` – 運用・データ生成スクリプト

CLI から実行する Node スクリプト群です。対応するテストは `__tests__/scripts/` 配下にあります。

| File | 説明 |
|------|------|
| `apply-production-allowlist.mjs` | 本番環境向け許可リスト適用 |
| `collect-festival-snapshot.mjs` | 祝祭日カタログのスナップショット収集 |
| `compare-festival-catalogs.mjs` | 祝祭日カタログの差分比較 |
| `generate-data-manifest.mjs` | `data/generated/` のマニフェスト再生成 |
| `local-healthcheck-mock.mjs` | CI の Supabase read-only 検証（psql attestation）をローカルで再現するモック |

---

## アーキテクチャ指針

### 1. コンポーネント構成

- **Atomic Design** を意識し、UI → Features → Pages の階層で整理
- **機能単位のグルーピング**: 誕生日 / メッセージ / メディア / ゲームなど
- **関心の分離**: 表示ロジックとビジネスロジックを切り離す

### 2. 状態管理

- グローバル状態は 基本的に **Zustand ストア** で管理
- 各画面固有の状態は **React Hooks** でローカルに保持
- サーバーサイドのデータは **TanStack Query** によるキャッシュ & フェッチ制御

### 3. データフロー

```text
User Action → Hook → API Route → Supabase → Response → UI Update
                ↓
            Zustand Store（必要な場合のみ）
```

### 4. スタイリング

- **Tailwind CSS** をベースに、ユーティリティクラスでレイアウト
- テーマ切り替え用に **CSS カスタムプロパティ**（色・影など）を活用
- アニメーションは **Framer Motion** を中心に実装

---

## レスポンシブ設計

```css
/* Mobile First Breakpoints */
@media (max-width: 480px)  { /* Small Mobile */ }
@media (max-width: 768px)  { /* Mobile */ }
@media (max-width: 1024px) { /* Tablet */ }
@media (min-width: 1025px) { /* Desktop */ }
```

---

## パフォーマンス最適化

- **Code Splitting**: App Router による自動コード分割
- **Image Optimization**: Next.js `Image` コンポーネント
- **Lazy Loading**: 重いコンポーネントは動的インポート
- **State Persistence**: 必要なストアのみ永続化
- **Caching**: TanStack Query を活用したサーバーサイドデータのキャッシュ
