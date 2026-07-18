// =========================================================
// CLIP DETECTOR (HEURISTIC SCORING)
// =========================================================
// Tujuan: dari transcript hasil Whisper (teks polos), cari
// beberapa kalimat yang paling "layak" jadi klip pendek,
// dengan cara memberi SKOR ke tiap kalimat lalu mengambil
// yang skornya paling tinggi (target 3-5 klip per video).
//
// Catatan: transcript.txt dari Whisper belum menyimpan
// timestamp asli per kalimat, jadi start/end klip di sini
// masih PERKIRAAN (estimasi durasi per kalimat), bukan
// waktu pas di video aslinya.
// =========================================================

// Kata-kata "hook" yang biasa dipakai di konten viral/menarik perhatian
const HOOK_KEYWORDS = [
    "ternyata",
    "rahasia",
    "tidak percaya",
    "gak percaya",
    "akhirnya",
    "masalah",
    "kesalahan",
    "penting",
    "bahaya",
    "kunci",
    "trik",
    "gila",
    "parah",
    "bayangkan"
];

// Kata di awal kalimat yang biasanya menandakan pergantian topik/segmen baru
const TOPIC_TRANSITION_WORDS = [
    "tapi",
    "namun",
    "jadi",
    "nah",
    "kemudian",
    "selanjutnya",
    "akhirnya"
];

// Berapa detik diperkirakan untuk 1 kalimat (estimasi kasar)
const AVG_SECONDS_PER_SENTENCE = 5;

// Durasi tiap klip yang dihasilkan (detik)
const CLIP_DURATION = 20;

// Jarak minimum antar kalimat terpilih, supaya klip tidak
// numpuk di segmen yang sama
const MIN_SENTENCE_GAP = 3;

// Batas jumlah klip yang dihasilkan
const MAX_CLIPS = 5;


// =========================
// PECAH TRANSCRIPT JADI KALIMAT
// =========================
//
// PERBAIKAN: sebelumnya fungsi ini langsung menghapus SEMUA newline
// (\s+ -> " ") lalu memecah hanya berdasarkan tanda baca (. ? !).
// Masalahnya, file .txt dari Whisper menulis SATU SEGMEN PER BARIS,
// dan tidak semua segmen diakhiri tanda baca. Akibatnya newline
// (batas segmen asli dari Whisper) ikut terhapus duluan, sehingga
// banyak segmen malah tergabung jadi satu "kalimat raksasa" —
// itulah sebabnya sebelumnya sering cuma dapat 1 klip.
//
// Sekarang urutannya dibalik jadi 2 tahap:
//   TAHAP 1: pisah transcript berdasarkan baris (\n) dulu -> ini
//            menghormati batas segmen asli dari Whisper.
//   TAHAP 2: di DALAM tiap baris, kalau ternyata ada lebih dari
//            satu kalimat (mengandung . ? !), pecah lagi di situ.
function splitIntoSentences(transcript) {

    // TAHAP 1 (BARU): pisah per baris dulu, sesuai format asli
    // Whisper (1 segmen = 1 baris). Baris kosong dibuang.
    const lines = transcript
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const sentences = [];

    // TAHAP 2 (BARU): dalam satu baris, boleh jadi ada lebih dari
    // satu kalimat (misal "Halo semua. Ini video baru.") -> pecah
    // lagi berdasarkan tanda baca, SETELAH batas baris dihormati.
    lines.forEach(line => {

        const normalizedLine = line.replace(/\s+/g, " ").trim();

        const parts = normalizedLine
            .split(/(?<=[.?!])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        sentences.push(...parts);

    });

    return sentences;

}


// =========================
// HITUNG SKOR SATU KALIMAT
// =========================
function scoreSentence(text) {

    let score = 0;

    const lower = text.toLowerCase();

    // +3 untuk tiap kata kunci menarik yang ditemukan
    HOOK_KEYWORDS.forEach(keyword => {
        if (lower.includes(keyword)) {
            score += 3;
        }
    });

    // Kalimat hook (tanda seru / tanya) dianggap menarik perhatian
    if (text.includes("!")) score += 2;
    if (text.includes("?")) score += 2;

    // Panjang kalimat ideal untuk klip pendek
    const length = text.length;

    if (length >= 40 && length <= 140) {
        score += 2;      // panjang pas
    } else if (length < 20) {
        score -= 2;      // kemungkinan cuma potongan kalimat
    } else if (length > 200) {
        score -= 1;       // terlalu panjang untuk klip pendek
    }

    // Awal kalimat menandakan pergantian topik (kemungkinan awal segmen baru)
    const firstWord = lower.split(" ")[0].replace(/[.,!?]/g, "");

    if (TOPIC_TRANSITION_WORDS.includes(firstWord)) {
        score += 2;
    }

    return score;

}


// =========================
// FUNGSI UTAMA
// =========================
function detectClips(transcript) {

    if (!transcript || typeof transcript !== "string") {
        return [];
    }

    const sentences = splitIntoSentences(transcript);

    if (sentences.length === 0) {
        return [];
    }

    // Beri skor ke tiap kalimat
    const scoredSentences = sentences.map((text, index) => ({
        index,
        text,
        score: scoreSentence(text)
    }));

    // Urutkan dari skor tertinggi ke terendah
    const sortedByScore = [...scoredSentences].sort(
        (a, b) => b.score - a.score
    );

    // Pilih kandidat terbaik, tapi jaga jarak minimum antar
    // kalimat supaya klip tidak numpuk di segmen yang sama
    const selected = [];

    for (const candidate of sortedByScore) {

        const tooClose = selected.some(
            s => Math.abs(s.index - candidate.index) < MIN_SENTENCE_GAP
        );

        if (!tooClose) {
            selected.push(candidate);
        }

        if (selected.length >= MAX_CLIPS) {
            break;
        }

    }

    // Urutkan lagi berdasarkan urutan asli di video (bukan skor),
    // supaya klip yang dihasilkan tetap kronologis
    selected.sort((a, b) => a.index - b.index);

    // Bangun hasil akhir: start/end masih ESTIMASI
    const clips = selected.map(s => {

        const start = s.index * AVG_SECONDS_PER_SENTENCE;

        return {
            start: start,
            end: start + CLIP_DURATION,
            text: s.text,
            score: s.score
        };

    });

    return clips;

}

module.exports = detectClips;