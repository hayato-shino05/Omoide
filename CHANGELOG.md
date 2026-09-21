# Changelog

このプロジェクトの変更履歴は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) の形式に沿い、バージョンは [Semantic Versioning](https://semver.org/lang/ja/) に従います。

## [1.1.0] - 2026-09-21

### Added

- 想い出カード・おみくじ結果の高解像度 PNG エクスポートにおける計算済みスタイル再帰注入（`applyComputedStylesRecursively`）およびドキュメントスタイルシート収集（`collectDocumentStyles`）エンジン
- PWA Service Worker v2 における言語別ルートシェル（`/`, `/?locale=ja`, `/?locale=en`）の独立事前キャッシュおよび和モダンオフライン HTML フォールバック
- Supabase によるクイズ（`birthday_quizzes`）、神経衰弱デッキ（`memory_card_decks`）、13 祝祭日パック（`festival_packs`）の動的 DB 移行とオフライン自動フォールバック

### Security

- 勉強部屋（`study_rooms`, `study_room_members`）における Column-Level Security（CLS）の導入。`anon` および `authenticated` ロールからの認証トークンハッシュ（`host_token_hash`, `member_token_hash`）公開 SELECT を完全遮断
- 掲示板（`bulletin_posts`）および返信（`post_replies`）の RLS `WITH CHECK` 制約強化によるシステム生成スレッドの偽造・いいね数改ざん防止

### Fixed

- Keepsake Exporter における Tailwind CSS スタイル欠落の解消
- Service Worker における多言語 HTML キャッシュの混在解消
- 全 19 テストスイート（110 テストケース）による画像読み込みライフサイクル・エクスポート・SQL 制約の網羅的検証

## [1.0.0] - 2026-09-20

### Added

- リアルタイム音楽同期勉強部屋（Study Room）機能を追加（ホストBGM同期、選曲キュー、シャッフル、リピート、NTP ドリフト補正）
- メンバーからの楽曲リクエスト送信およびホスト承認モデレーション機能を追加（`SongRequestListModal`）
- ホスト退出時の自動ホスト権限移譲（Host Migration）および放置部屋の24時間クリーンアップを追加
- 個人環境音ミキサー（Ambient Mixer）を追加（雨音、喫茶店、風鈴、暖炉の4系統独立音量調整およびプリセット）
- 全画面 Zen 集中モード（Zen Focus）およびポモドーロタイマー（Pomodoro Ring、Solfeggio 528Hz 和みチャイム、Streak 記録）を追加
- 参加者の机グリッド存在感表示（Desk Presence）および静音非言語応援機能（Silent Cheer: ☕, 🔥, ✨, 📖）を追加
- ブラウザのデフォルトダイアログ（`alert` / `confirm`）を完全排除し、カスタム `ConfirmModal` および `Toast` システムへ刷新
- アプリ名を「Omoide（想い出箱）」へ刷新し、ロゴ・ファビコン・アプリアイコン・フッター表記を更新
- 「あの日」の思い出フラッシュバック、日替わりおみくじ、タイムカプセルを追加
- Three.js による 3D 想い出みくじ（みくじ筒・神社・桜と金粉のパーティクル・12 種の運勢）を追加
- 掲示板に誕生日スレッドを表示し、返信へ楽曲を添付できるように追加
- 誕生日スレッドの定期生成をスケジューラー経由で追加（実行日時を明示指定）
- サウンドコメントを Jamendo / SoundCloud の参照へ統一し、楽曲選択を固定カタログの新モーダルへ刷新
- 掲示板の Keepsake Export を追加
- photo-album / music / avatars / time-capsules の Storage バケットと、music_tracks テーブルを追加
- モバイル用ボトムナビゲーション Dock を追加
- フォトストリップ設定とフレームカテゴリを追加
- LINE 共有導線と定型メッセージを、投稿・共有の各操作へ追加
- 誕生日カウントダウンの表示切替（背景鑑賞用トグル）と、ポラロイド風スクラップブックカードを追加
- Reminder の配信状態を永続化し、配信リースの再取得と競合更新に対応
- イベントデータのマニフェスト生成と、locale・暦の parity 検証基盤を追加
- コンタクトシャドウ・木目テクスチャ・PBR ライティングなど、3D 表示の質を向上

### Changed

- 匿名投稿向けに Supabase スキーマを再設計し、データベース正本を migration へ統一。取得・保存 API を匿名クライアントへ一本化
- 音楽カタログを固定カタログからの選択方式へ変更し、楽曲アップロード機能を廃止
- カウントダウンカード・テーマバッジ・UI アイコンを刷新し、テーマを 13 種へ拡張
- フォントスタックを Windows / macOS の標準フォントへ統一
- テーマ判定をイベント評価の正規ロジックへ統一し、旧テーマ API の互換層を整理

### Fixed

- Time Capsule の日時境界・部分取得・空状態・再試行・モバイル操作・アクセシビリティを修正
- SoundCloud public API の認証と再生状態を修正
- healthcheck の REST endpoint を read-only クエリへ変更
- スライドパズルの可解性と Safari / 接続耐性を修正
- SSR のテーマ初期検出を修正し Hydration Mismatch を解消
- migration を再実行可能にし、部分ユニーク制約をインデックスへ置換
- メディア検証をファイル全体の構造チェックへ変更し、音楽付きメッセージの重複を DB 制約で防止
- 誕生日カウントダウンの日付境界と、システム時刻変更時の再計算を修正
- エフェクトへのモーション軽減設定の反映と、クリーンアップ時刻を修正
- アクセシビリティ（ラベル・キーボード操作・フォーカス表示）を改善
- E2E・回帰テストを安定化（CRLF 差異・fake timer・匿名送信経路の更新）

### Removed

- メイン画面の誕生日カレンダーを削除
- 未使用の MusicUploader / MusicLibrary / 動画サムネイル export を削除
- 管理者用の Supabase クライアント・環境変数と、匿名ユーザーの更新・削除経路を廃止

### Docs

- README / README.en を実装と同期し、アプリ名・バナー・コンセプトアートを更新
- STRUCTURE.md / DATABASE.md を実装と一致させ、CONTRIBUTING.md と CODE_OF_CONDUCT.md を刷新

## [0.5.0] - 2026-07-22

初回リリース。誕生日を「覚える」「祝う」「共有する」ための対話型 Web アプリケーションとして公開。技術構成は Next.js / React / TypeScript / Tailwind CSS で、全体像とセットアップは README.md を参照。

### Added

- リアルタイムカウントダウン、2D バースデーケーキ、ミュージックプレイヤー、ビジュアルエフェクト
- 写真・動画アルバム、タグ管理、メディアアップロード、検索
- 神経衰弱ゲーム、ジグソーパズル、バースデークイズ、バースデーカレンダー
- リアルタイムチャット、メッセージボード、ボイス・ビデオメッセージ、バーチャルギフト、共有導線
- 季節・イベントテーマ、動画背景、多言語対応

[Unreleased]: https://github.com/hayato-shino05/Omoide/compare/0.5...HEAD
[0.5.0]: https://github.com/hayato-shino05/Omoide/releases/tag/0.5
