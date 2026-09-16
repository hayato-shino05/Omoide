# Changelog

このプロジェクトの変更履歴は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) の形式に沿い、バージョンは [Semantic Versioning](https://semver.org/lang/ja/) に従います。

## [Unreleased]

### Added

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
