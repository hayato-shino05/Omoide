# Omoide

> **Omoide Bako（想い出箱）**
> 大切な人の誕生日と、みんなの思い出をひとつの場所に。

<p align="center">
  <img src="./public/images/banners/banner_option_2_minimal.jpg" alt="Omoide Bako Banner" width="100%">
</p>

<p align="center">
  <a href="README.en.md"><img src="https://img.shields.io/badge/lang-English-blue" alt="英語版README"></a>
  <img src="https://img.shields.io/badge/%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3-0.1.0-4f46e5" alt="バージョン 0.1.0">
  <a href="LICENSE"><img src="https://img.shields.io/badge/%E3%83%A9%E3%82%A4%E3%82%BB%E3%83%B3%E3%82%B9-MIT-yellow" alt="MIT ライセンス"></a>
  <img src="https://img.shields.io/badge/Next.js-16.0.7-black?logo=nextdotjs" alt="Next.js 16.0.7">
  <img src="https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react&logoColor=111111" alt="React 19.2.1">
  <img src="https://img.shields.io/badge/Three.js-0.185.1-black?logo=threedotjs" alt="Three.js 0.185.1">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=ffffff" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=ffffff" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Supabase-2.86.2-3FCF8E?logo=supabase&logoColor=ffffff" alt="Supabase 2.86.2">
  <img src="https://img.shields.io/badge/%E3%83%87%E3%83%97%E3%83%AD%E3%82%A4-Vercel-black?logo=vercel" alt="Vercel デプロイ">
</p>

## 目次

1. [概要](#概要)
2. [主な機能](#主な機能)
3. [このプロジェクトでできること](#このプロジェクトでできること)
4. [技術スタック](#技術スタック)
5. [動作環境](#動作環境)
6. [使い方](#使い方)
7. [デプロイ](#デプロイ)
8. [セキュリティ](#セキュリティ)
9. [プロジェクト構成](#プロジェクト構成)
10. [npm スクリプト](#npm-スクリプト)
11. [関連ドキュメント](#関連ドキュメント)
12. [コントリビューション](#コントリビューション)
13. [ライセンス](#ライセンス)

## 概要

`Omoide`（スローガン：**Omoide Bako / 想い出箱**）は、大切な人の誕生日や記念日を「覚える」「祝う」「記録する」「分かち合う」ためのインタラクティブな Web アプリケーションです。

<p align="center">
  <img src="./public/images/banners/banner_option_1_ghibli.jpg" alt="Omoide Bako Concept Illustration" width="100%">
</p>

誕生日カウントダウンや 2D/3D ケーキのろうそく吹き消し、Three.js による 3D おみくじ筒の回転・抽選演出、写真・動画アルバム、リアルタイムチャット、メッセージボード（寄せ書き）、フォトブース、タイムカプセル、ミニゲーム、そして日本の 13 の季節・祝祭日に合わせたテーマ演出を 1 つの温かい空間にまとめています。家族・友人・チームのためのオンライン記念日共有スペースとして活用できます。

> 補足: この README では装飾用 emoji を使わず、機能の識別には `lucide-react` のアイコン名を使っています。

## 主な機能

### 基本とお祝い体験

| アイコン | 機能 | 説明 |
|----------|------|------|
| `Timer` | リアルタイムカウントダウン | Supabase の誕生日データをもとに、次の誕生日や記念日までの残り時間を表示します。 |
| `Cake` | インタラクティブケーキ | 2D/3D ケーキとマイク入力によるロウソク吹き消し演出に対応します。 |
| `Music` | ミュージックプレイヤー / リアルタイム歌詞 / 楽曲検索 | Cloudflare R2 および Supabase から配信されるキュレーション楽曲の再生、SoundCloud / Jamendo の楽曲検索（`/api/music/search`）とストリーム解決（`/api/music/resolve`）に対応します。LRC 形式のリアルタイム同期歌詞ドロワー（`LyricsDrawer`）、シャッフル（🔀）・リピート（🔁 全曲/1曲/オフ）再生、進行状況フィル付きシークバー、音量調整、および F5 リロード後も再生位置と楽曲を保持する状態永続化（Zustand + `localStorage`）を備えています。 |

### メディア・思い出機能

| アイコン | 機能 | 説明 |
|----------|------|------|
| `Image` | 写真・動画アルバム | Supabase Storage を使い、思い出のメディアを整理して表示します。 |
| `Camera` | フォトフレーム / フォトブース | WebRTC カメラまたはライブラリの画像に季節フレームを付け、画像としてダウンロードできます。 |
| `Clock` | あの日・あの時フラッシュバック | 過去の同じ月日や記念日の思い出を振り返る機能です。 |
| `Mail` | タイムカプセル | 未来の記念日や誕生日に向けて、手紙と任意の写真を封入し、アクセスコードで共有できる機能です。開封後は印刷用の記念カードとして出力できます。 |
| `Tags` | タグ管理 | メディアにタグを付け、検索やフィルタリングに利用できます。 |
| `Upload` | メディアアップロード | `react-dropzone` を使った画像・動画アップロードに対応します。 |
| `Search` | 検索 | タグやテキストから、必要なメディアを見つけやすくします。 |

### ゲームとエンタメ

| アイコン | 機能 | 説明 |
|----------|------|------|
| `Brain` | 神経衰弱ゲーム | カードをめくってペアを探すミニゲームです。 |
| `Puzzle` | ジグソーパズル | 任意の思い出画像からパズルを作り、難易度を調整できます。 |
| `HelpCircle` | バースデークイズ | 誕生日に合わせたクイズを表示できます。 |
| `Calendar` | バースデーカレンダー | 月別に誕生日や記念日を確認できるカレンダー UI です。 |

### コミュニティ機能

| アイコン | 機能 | 説明 |
|----------|------|------|
| `MessageCircle` | リアルタイムチャット | Supabase Realtime を使ったグループチャット体験を提供します。 |
| `ClipboardList` | メッセージボード（寄せ書き） | お祝いメッセージの投稿、いいね、返信に対応します。 |
| `Mic` | ボイスメッセージ | ブラウザ上で録音し、音声メッセージとして保存できます。 |
| `Video` | ビデオメッセージ | Web カメラで動画を撮影し、ビデオメッセージとして残せます。 |
| `Gift` | バーチャルギフト | デジタルギフトを選んで送ることができます。 |
| `Share2` | 共有導線 | SNS 共有、Web Share API、リンクのコピーからお祝いページを共有できます。 |

### 勉強部屋・集中モード（Study Room & Zen Focus）

| アイコン | 機能 | 説明 |
|---|---|---|
| `BookOpen` | 勉強部屋（コワーキング） | 参加者同士で穏やかな存在感を共有しながら作業できるバーチャル空間です。ホストによる選曲・キュー再生・シャッフル・リピート状態の完全同期（NTPドリフト自動補正）、メンバーからの楽曲リクエスト送信とホスト承認モデレーション、ホスト退出時の自動権限移譲を備えています。 |
| `Sparkles` | Zen 集中モード & ポモドーロ | 全画面没入型キャンバス（Fullscreen API / ショートカット対応）。25分集中 / 5分休憩 / 15分大休憩のサイクル管理、SVG 円形プログレスリング、サイクル完了時の Solfeggio 528Hz 和みチャイム、連続集中 Streak の記録を提供します。 |
| `Sliders` | 個人環境音ミキサー (Ambient Mixer) | 雨音 (`rain`)、喫茶店 (`cafe`)、風鈴 (`wind_chime`)、暖炉 (`fireplace`) の 4 系統の環境音を独立ボリューム調整・プリセットワンクリック適用できる Web Audio 合成ミキサーです。部屋 BGM との 2 系統独立音量管理により「ソロ聴取（BGM 0%）」も可能です。 |
| `Coffee` | 机の存在感 & 静かな応援 (Silent Cheer) | 参加者の勉強机グリッド（アバター・集中状態・Streak）と、非言語応援アイコン（☕ お茶, 🔥 炎, ✨ 閃き, 📖 読書）が画面下部から穏やかに漂い消える静音アニメーションです。 |

### テーマとモバイル最適化

| アイコン | 機能 | 説明 |
|----------|------|------|
| `Palette` | 季節テーマ | 春、夏、秋、冬の雰囲気に合わせたテーマを切り替えます。 |
| `CalendarDays` | 13 の祝祭日テーマ | お正月、花見、こどもの日、七夕、お盆、月見、文化の日、ハロウィン、クリスマスなどに対応します。 |
| `Compass` | モバイル和風ドック & 抽斗メニュー | スマートフォン向けに最適化されたボトムドックと和風の抽斗（Drawer）メニューです。 |
| `Type` | 和風タイポグラフィ最適化 | Windows (Yu Gothic / Meiryo), macOS / iOS (Hiragino Sans), 明朝体 (Yu Mincho / Noto Serif JP) による高コントラストな文字表示を提供します。 |
| `Languages` | 多言語対応 | 日本語（JA）と英語（EN）を UI からスムーズに切り替えられます。 |

## このプロジェクトでできること

1. **記念日・誕生日を忘れにくくする**
   - 次の誕生日をカウントダウンで確認できます。
   - 家族、友人、チームの記念日を 1 つの場所にまとめられます。

2. **思い出を残しやすくする（想い出箱）**
   - 写真、動画、音声、テキストメッセージ、フォトブース写真、タイムカプセルをまとめて保存できます。
   - いつでも温かい気持ちで見返せるデジタルアルバムを作れます。

3. **オンラインのお祝いを楽しくする**
   - 3D おみくじやミニゲーム、エフェクトでお祝いの場に動きと遊びを加えます。
   - 13 の季節・祝祭日テーマ演出により、1 年中いつ訪れても新鮮な雰囲気を楽しめます。

4. **小さなコミュニティの共有スペースになる**
   - クラス、サークル、チーム、家族グループで使えます。
   - オープンソースなので、用途に合わせて拡張できます。

## 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|------------|------|
| Next.js | 16.0.7 | App Router と API Routes (Turbopack) |
| React | 19.2.1 | UI コンポーネント |
| Three.js | 0.185.1 | 3D おみくじ筒・WebGL レンダリング |
| TypeScript | 5.x | 型安全な実装 |
| Tailwind CSS | 4.x | スタイリング |
| Framer Motion | 12.23.25 | アニメーション |
| lucide-react | 0.556.0 | UI アイコン |
| Zustand | 5.0.9 | グローバル状態管理 |
| TanStack Query | 5.90.12 | サーバー状態とキャッシュ |
| react-dropzone | 14.3.8 | ファイルアップロード UI |
| date-fns | 4.1.0 | 日付処理 |

### バックエンドとサービス

| 技術 | 用途 |
|------|------|
| Supabase | PostgreSQL ベースの BaaS |
| Supabase Storage | メディアファイル保存 |
| Supabase Realtime | リアルタイム購読 |
| Next.js API Routes | API 境界 |
| Jamendo API / SoundCloud API | 楽曲検索とストリーム解決（`lib/music/server.ts`） |
| Vercel Analytics | Web 解析 |
| Vercel | ホスティング |

### 開発ツール

| ツール | 用途 |
|--------|------|
| Vitest | テスト実行 |
| Testing Library | React コンポーネントテスト |
| ESLint | 静的解析 |
| Prettier | フォーマット |

## 動作環境

### 必要条件

| 項目 | バージョンまたは条件 |
|------|----------------------|
| Node.js | 20.9.0 以上 |
| npm | Node.js に同梱されるバージョン |
| Supabase | プロジェクト URL と anonymous key が必要 |
| ブラウザ | Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+ |

### 環境変数

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

`.env.example` に含まれる変数のうち、`NEXT_PUBLIC_*` はクライアントバンドルへ埋め込まれる公開変数です。それ以外はサーバーサイド専用です。変数名の一覧は `.env.example` を参照してください。

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 必須 | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 必須 | Supabase anonymous key（公開キー。RLS と組み合わせて使います） |
| `NEXT_PUBLIC_BASE_URL` | 任意 | サイトの base URL。sitemap の canonical URL と、GitHub Actions からのスケジューラー実行先 URL に使います。 |

| 変数名 | 用途 |
|--------|------|
| `BIRTHDAY_SCHEDULER_SECRET` | バースデースレッド定期生成の認証。`POST /api/internal/birthday-scheduler` がリクエストヘッダー `x-birthday-scheduler-secret` と突き合わせます。デプロイ先と GitHub Actions に同じ値を設定してください。 |
| `JAMENDO_CLIENT_ID` | Jamendo API のクライアント ID。楽曲検索に使います。未設定時は Jamendo 検索のみ無効で、プリセット再生には影響しません。 |
| `SOUNDCLOUD_CLIENT_ID`, `SOUNDCLOUD_CLIENT_SECRET` | SoundCloud API の OAuth client credentials。SoundCloud の楽曲検索・ストリーム解決に使います。 |

> サーバーサイド変数はクライアントバンドルに含めないでください。`.env.example` はプレースホルダー値のみ記載しています。実値は Vercel の環境変数や GitHub Actions の secret で管理します。

> 多言語（i18n）切替のユーザー設定は `birthday-locale` という名前の cookie に保存されます（`lib/i18n/cookie.ts` の `LANGUAGE_COOKIE_NAME`）。SSR 時の言語判定と UI 切替はこの cookie を介して行います。

## 使い方

### 1. リポジトリを取得する

```bash
git clone https://github.com/hayato-shino05/Omoide.git
cd Omoide
```

### 2. 依存パッケージをインストールする

```bash
npm install
```

### 3. 環境変数を設定する

```bash
cp .env.example .env.local
```

`.env.local` を編集します。

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Supabase を準備する

必要なテーブル、Storage、RLS の詳細は [DATABASE.md](./DATABASE.md) を参照してください。

### 5. 開発サーバーを起動する

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 6. ローカルで動作確認する

```bash
npm run lint
npm run test
npm run build
```

### 7. 音楽と歌詞を追加・同期する

独自の楽曲や歌詞を追加する場合は、Cloudflare R2 および Supabase と連携する同期スクリプトを利用できます。詳細は [DATABASE.md](./DATABASE.md#音楽と歌詞の追加管理手順) を参照してください。

```bash
# ローカル音源 (FLAC/MP3)、カバー画像、.lrc 歌詞を一括変換・同期
node scripts/sync-local-music-to-r2-and-supabase.mjs

# 楽曲の再生順序を更新
node scripts/reorder-music-tracks.mjs
```

## デプロイ

### Vercel へのデプロイ

[Vercel でこのリポジトリを開く](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhayato-shino05%2FOmoide&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_BASE_URL&envDescription=Supabase%20configuration%20and%20public%20base%20URL&envLink=https%3A%2F%2Fsupabase.com%2Fdocs)

手動でデプロイする場合は、Vercel にリポジトリをインポートし、必要な環境変数を設定してください。

### 誕生日スレッドの定期生成

毎日 09:05 (JST) に、`.github/workflows/supabase-healthcheck.yml` のスケジュール（`cron: '5 0 * * *'` / `Asia/Tokyo`）が `POST /api/internal/birthday-scheduler` を呼び出し、当日が誕生日のメンバー向けスレッドを生成します。

- このエンドポイントは、リクエストヘッダー `x-birthday-scheduler-secret` が環境変数 `BIRTHDAY_SCHEDULER_SECRET` と一致する場合のみ処理します（`timingSafeEqual` による比較）。
- GitHub Actions の secret には、共有 secret の `BIRTHDAY_SCHEDULER_SECRET` と実行先 URL 用の `NEXT_PUBLIC_BASE_URL` を登録してください。デプロイ先 (Vercel) の環境変数にも同じ `BIRTHDAY_SCHEDULER_SECRET` を設定します。
- スケジュールを待たずに試す場合は、ワークフローを `workflow_dispatch` で手動実行できます。

## セキュリティ

| 項目 | 扱い |
|------|------|
| Supabase anonymous key | フロントエンドから利用する公開キーです。RLS と組み合わせて使います。 |
| Supabase service role key | 公開してはいけません。`.env.local`、README、client bundle に入れないでください。 |
| サーバーサイド secret | `BIRTHDAY_SCHEDULER_SECRET`、`SOUNDCLOUD_CLIENT_SECRET` など、`NEXT_PUBLIC_*` 以外の変数はクライアントへ公開しないでください。サーバー実行コンテキスト（API Route など）でのみ参照します。 |
| RLS | Supabase 側で有効化してください。 |
| アップロード | ファイルサイズ、種類、公開範囲を Supabase 側の設定とアプリ側の検証で管理してください。 |

## プロジェクト構成

詳細は [STRUCTURE.md](./STRUCTURE.md) を参照してください。

```text
omoide/
├── app/                      # Next.js App Router と API Routes
├── components/               # UI、機能、コミュニティ、ゲーム、エフェクト
├── config/                   # テーマと音楽の設定
├── data/                     # i18n および祭りデータパック
├── lib/                      # hooks, stores, Supabase, i18n, providers
├── public/                   # 静的アセット
├── types/                    # TypeScript 型定義
├── __tests__/                # Vitest テストコード
├── e2e/                      # Playwright E2E テスト
├── scripts/                  # データ生成や運用補助スクリプト
├── DATABASE.md               # Supabase スキーマ
├── STRUCTURE.md              # アーキテクチャ概要
└── package.json              # scripts と dependencies
```

## npm スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバーを起動します。 |
| `npm run build` | 本番ビルドを作成します。 |
| `npm run start` | 本番サーバーを起動します。 |
| `npm run lint` | ESLint を実行します。 |
| `npm run typecheck` | TypeScript の型検査（`tsc --noEmit`）を実行します。 |
| `npm run test` | Vitest を 1 回実行します。 |
| `npm run test:watch` | Vitest を watch mode で実行します。 |
| `npm run test:coverage` | coverage 付きでテストを実行します。 |
| `npm run test:e2e` | Playwright で E2E テストを実行します。 |
| `npm run generate:data` | `data/generated/` 配下のマニフェストを再生成します。 |

## 関連ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| [README.en.md](./README.en.md) | 英語版 README |
| [STRUCTURE.md](./STRUCTURE.md) | ディレクトリ構成とアーキテクチャ |
| [DATABASE.md](./DATABASE.md) | Supabase スキーマとポリシー |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | コントリビューションガイド |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | 行動規範 |

## コントリビューション

コントリビューションは歓迎します。大きな仕様変更やデザイン変更を行う場合は、先に Issue で方向性を相談してください。

1. Fork して clone します。
2. 作業用ブランチを作成します。
3. 実装またはドキュメントを更新します。
4. `npm run lint`、`npm run test`、必要に応じて `npm run build` を実行します。
5. Pull Request を作成します。

詳しくは [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## 作成者

- GitHub: [@hayato-shino05](https://github.com/hayato-shino05)

## ライセンス

このプロジェクトは [MIT License](./LICENSE) のもとで公開されています。

<p align="center">
  <strong>想い出を紡ぎ、大切な人と分かち合う時間のために。</strong>
</p>
