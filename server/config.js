// 設定値（環境変数で変更できるもの）
const PORT = process.env.PORT || 8788;
const USER_COUNT = Math.max(50, Math.min(5000, Number(process.env.USERS || 1000)));

// あなた（この端末でログインしている会員）の番号。本来この人の情報しか見えてはいけない。
const YOU = 1;

module.exports = { PORT, USER_COUNT, YOU };
