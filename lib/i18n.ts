import { promptLanguages } from "@/lib/ai/prompts";

type SupportedLanguage = (typeof promptLanguages)[number];

const FALLBACK_LANGUAGE: SupportedLanguage = "indonesian";

export type TranslationKey =
  | "autoDetect"
  | "preferredLanguage"
  | "languageSelectTitle"
  | "toastWait"
  | "toastUploadFailed"
  | "webSearch"
  | "news"
  | "toggleTitle"
  | "inputPlaceholder"
  | "thinkingPrimary"
  | "progressWebSearch"
  | "progressNews"
  | "progressReasoningHeading"
  | "progressReasoningStep1"
  | "progressReasoningStep2"
  | "progressReasoningStep3"
  | "reasoningTriggerThinking"
  | "reasoningTriggerDuration"
  | "scrollToBottom"
  | "newChat";

type TranslationMap = Record<TranslationKey, string>;

const translations: Record<SupportedLanguage, TranslationMap> = {
  indonesian: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Bahasa pilihan",
    languageSelectTitle: "Bahasa pilihan: {label}",
    toastWait: "Tunggu sampai model menyelesaikan respons!",
    toastUploadFailed: "Gagal mengunggah berkas, silakan coba lagi!",
    webSearch: "Pencarian Web",
    news: "Berita",
    toggleTitle: "Ubah status {label}",
    inputPlaceholder: "Ketik pesan...",
    thinkingPrimary: "Sedang memikirkan jawaban...",
    progressWebSearch: "Menelusuri informasi dari web...",
    progressNews: "Mengumpulkan berita terbaru Indonesia...",
    progressReasoningHeading: "Jejak penalaran",
    progressReasoningStep1: "Mengurai pertanyaan",
    progressReasoningStep2: "Menganalisis kemungkinan jawaban",
    progressReasoningStep3: "Menyiapkan jawaban terbaik",
    reasoningTriggerThinking: "Sedang berpikir...",
    reasoningTriggerDuration: "Berpikir selama {seconds} dtk",
    scrollToBottom: "Gulir ke bawah",
    newChat: "Obrolan baru",
  },
  acehnese: {
    autoDetect: "Otomat (deteksi)",
    preferredLanguage: "Bahsa pilihan",
    languageSelectTitle: "Bahsa pilihan: {label}",
    toastWait: "Meusaba wareh sampai model meupeugah jawaban!",
    toastUploadFailed: "Berkas hana le berhasil, coba lom!",
    webSearch: "Peusie web",
    news: "Beurita",
    toggleTitle: "Peuganto {label}",
    inputPlaceholder: "Tulis pesan...",
    thinkingPrimary: "Lagi meupeugah jawaban...",
    progressWebSearch: "Peusie informasi lewat web...",
    progressNews: "Peukop beurita baru dari Indonesia...",
    progressReasoningHeading: "Jejak pikir",
    progressReasoningStep1: "Meulheue pertanyaan",
    progressReasoningStep2: "Meu analisah cara jawaban",
    progressReasoningStep3: "Meupersiap jawaban mantong",
    reasoningTriggerThinking: "Lagi meupeugah...",
    reasoningTriggerDuration: "Meu pikir {seconds} detik",
    scrollToBottom: "Gule ke uroe",
    newChat: "Obrolan baro",
  },
  banjarese: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Bahasa pilihan",
    languageSelectTitle: "Bahasa pilihan: {label}",
    toastWait: "Tunggu haja sampai model ngarampungakan jawaban!",
    toastUploadFailed: "Berkas gagal diunggah, coba ulangi!",
    webSearch: "Pencarian Web",
    news: "Berita",
    toggleTitle: "Gantian {label}",
    inputPlaceholder: "Kirimakan pesan...",
    thinkingPrimary: "Lagi mikir jawaban...",
    progressWebSearch: "Mancari informasi liwat web...",
    progressNews: "Ngumpulkan berita Indonesia nang anyar...",
    progressReasoningHeading: "Jejak pamikiran",
    progressReasoningStep1: "Nguraiakan pertanyaan",
    progressReasoningStep2: "Menganalisa kemungkinan jawaban",
    progressReasoningStep3: "Mempersiapan jawaban paling bagus",
    reasoningTriggerThinking: "Lagi mikir...",
    reasoningTriggerDuration: "Mikir {seconds} detik",
    scrollToBottom: "Gulir ka handap",
    newChat: "Cakap anyar",
  },
  english: {
    autoDetect: "Auto (detect)",
    preferredLanguage: "Preferred language",
    languageSelectTitle: "Preferred language: {label}",
    toastWait: "Please wait for the model to finish its response!",
    toastUploadFailed: "Failed to upload the file, please try again!",
    webSearch: "Web Search",
    news: "News",
    toggleTitle: "Toggle {label}",
    inputPlaceholder: "Send a message...",
    thinkingPrimary: "Thinking...",
    progressWebSearch: "Searching the web for information...",
    progressNews: "Gathering the latest Indonesian news...",
    progressReasoningHeading: "Reasoning trace",
    progressReasoningStep1: "Breaking down the question",
    progressReasoningStep2: "Analyzing possible solutions",
    progressReasoningStep3: "Preparing the best answer",
    reasoningTriggerThinking: "Thinking...",
    reasoningTriggerDuration: "Thought for {seconds}s",
    scrollToBottom: "Scroll to bottom",
    newChat: "New Chat",
  },
  madurese: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Basa pilihan",
    languageSelectTitle: "Basa pilihan: {label}",
    toastWait: "Tunggu sakaj? sampai model nyeles?' aghab?n!",
    toastUploadFailed: "Berkas tak bisa kaungg?h, coba malem!",
    webSearch: "Pencarian Web",
    news: "Berita",
    toggleTitle: "Ganti {label}",
    inputPlaceholder: "Nulis pesen...",
    thinkingPrimary: "Lagi mikir jawaban...",
    progressWebSearch: "Nyari informasi ngal?bi web...",
    progressNews: "Ngumpol bh?r'ita anyar dari Indonesia...",
    progressReasoningHeading: "Tapak pamikiran",
    progressReasoningStep1: "Ngolah pertanyaan",
    progressReasoningStep2: "Ngalako analisa solusi",
    progressReasoningStep3: "Nyedi'yaghi jawaban paling bagus",
    reasoningTriggerThinking: "Lagi mikir...",
    reasoningTriggerDuration: "Mikir {seconds} detik",
    scrollToBottom: "Gulir ka bhawah",
    newChat: "Obrolan anyar",
  },
  ngaju: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Bahasa pilihan",
    languageSelectTitle: "Bahasa pilihan: {label}",
    toastWait: "Sabari dulu sampai model manyelesai jawaban!",
    toastUploadFailed: "Berkas gagal diunggah, cuba lagi!",
    webSearch: "Cari Web",
    news: "Berita",
    toggleTitle: "Ganti {label}",
    inputPlaceholder: "Tulis pesan...",
    thinkingPrimary: "Masih manyarah jawaban...",
    progressWebSearch: "Mencari informasi liwat web...",
    progressNews: "Ngumpul berita Indonesia paling baru...",
    progressReasoningHeading: "Jejak pangarah",
    progressReasoningStep1: "Ngurai pertanyaan",
    progressReasoningStep2: "Manyarah jalan jawab",
    progressReasoningStep3: "Nyusun jawaban paling handep",
    reasoningTriggerThinking: "Masih manyarah...",
    reasoningTriggerDuration: "Manyarah {seconds} detik",
    scrollToBottom: "Gulir ka bawah",
    newChat: "Cakap baru",
  },
  sundanese: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Basa pilihan",
    languageSelectTitle: "Basa pilihan: {label}",
    toastWait: "Tungguan heula dugi mod?lna r?ngs? ngawaler!",
    toastUploadFailed: "Berkas gagal diunggah, cobian deui!",
    webSearch: "Pilarian Web",
    news: "Warta",
    toggleTitle: "Pindahkeun {label}",
    inputPlaceholder: "Ketik pesen...",
    thinkingPrimary: "Sedang mikir jawaban...",
    progressWebSearch: "N?angan informasi ngaliwatan web...",
    progressNews: "Ngumpulkeun warta panganyarna ti Indonesia...",
    progressReasoningHeading: "Jejak pamikiran",
    progressReasoningStep1: "Ngabedah patal?kan",
    progressReasoningStep2: "Ngalalanyahan kamungkinan jawaban",
    progressReasoningStep3: "Nyusun jawaban pangsa?na",
    reasoningTriggerThinking: "Sedang mikir...",
    reasoningTriggerDuration: "Mikir {seconds} detik",
    scrollToBottom: "Gulir ka handap",
    newChat: "Obrolan anyar",
  },
  balinese: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Basa sane kapilih",
    languageSelectTitle: "Basa sane kapilih: {label}",
    toastWait: "Suati dados ngantos model ngametuang wangsalan!",
    toastUploadFailed: "Berkas gagal kaunggahang, sujati coba malih!",
    webSearch: "Pangelah Web",
    news: "Warta",
    toggleTitle: "Gentosang {label}",
    inputPlaceholder: "Tulisin pesan...",
    thinkingPrimary: "Taler ngametuang wangsalan...",
    progressWebSearch: "Ngupakara informasi ring web...",
    progressNews: "Ngumpulangang warta Indonesia sane anyar...",
    progressReasoningHeading: "Jejak pamikiran",
    progressReasoningStep1: "Ngrembag patakonan",
    progressReasoningStep2: "Ngakutin cara wangsalan",
    progressReasoningStep3: "Nyusun wangsalan sane becik",
    reasoningTriggerThinking: "Sampun mikir...",
    reasoningTriggerDuration: "Mikir {seconds} detik",
    scrollToBottom: "Gulir ka sor",
    newChat: "Obrolan anyar",
  },
  buginese: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Basa pilihan",
    languageSelectTitle: "Basa pilihan: {label}",
    toastWait: "Sabari sikko narekko model naselesaiang jawaban!",
    toastUploadFailed: "Berkas tena bisa naikkang, cobai ulang!",
    webSearch: "Pasusureng Web",
    news: "Berita",
    toggleTitle: "Pakkalinga {label}",
    inputPlaceholder: "Tulis pesan...",
    thinkingPrimary: "Lagi massappa jawaban...",
    progressWebSearch: "Massuro' informasi liwat web...",
    progressNews: "Mappunnai berita Indonesia terbaru...",
    progressReasoningHeading: "Jejak pamikiran",
    progressReasoningStep1: "Megae pole pertanyaan",
    progressReasoningStep2: "Mappunnai jalan solusi",
    progressReasoningStep3: "Massusun jawaban paling bagus",
    reasoningTriggerThinking: "Lagi massappa...",
    reasoningTriggerDuration: "Massappa {seconds} detik",
    scrollToBottom: "Gulir ri bawah",
    newChat: "Pabicara baru",
  },
  javanese: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Basa pilihan",
    languageSelectTitle: "Basa pilihan: {label}",
    toastWait: "Mangga antos rumiyin nganti modhel rampung mangsuli!",
    toastUploadFailed: "Berkas gagal diunggah, coba meneh!",
    webSearch: "Panggolekan Web",
    news: "Warta",
    toggleTitle: "Pindhahake {label}",
    inputPlaceholder: "Ketik pesen...",
    thinkingPrimary: "Isih mikir jawaban...",
    progressWebSearch: "Nggoleki informasi liwat web...",
    progressNews: "Ngumpulake warta anyar saka Indonesia...",
    progressReasoningHeading: "Trek panalaran",
    progressReasoningStep1: "Ngrembug pitakonan",
    progressReasoningStep2: "Nyawang cara-cara jawaban",
    progressReasoningStep3: "Nyusun jawaban sing paling becik",
    reasoningTriggerThinking: "Isih mikir...",
    reasoningTriggerDuration: "Mikir {seconds} detik",
    scrollToBottom: "Gulir mudhun",
    newChat: "Obrolan anyar",
  },
  minangkabau: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Bahaso pilihan",
    languageSelectTitle: "Bahaso pilihan: {label}",
    toastWait: "Sabanta, tunggu model manyesaikan jawaban!",
    toastUploadFailed: "Berkas indak berhasil diunggah, coba lai!",
    webSearch: "Carian Web",
    news: "Berito",
    toggleTitle: "Pindahkan {label}",
    inputPlaceholder: "Tulis pesan...",
    thinkingPrimary: "Sedang manyo pikir jawaban...",
    progressWebSearch: "Mancari informasi dari web...",
    progressNews: "Mangumpulkan berito tarbaru dari Indonesia...",
    progressReasoningHeading: "Jejak panalaran",
    progressReasoningStep1: "Mambuek jelas persoalan",
    progressReasoningStep2: "Mangareso pilihan jawaban",
    progressReasoningStep3: "Menyusun jawaban nan paliang bagus",
    reasoningTriggerThinking: "Sedang manyo pikir...",
    reasoningTriggerDuration: "Mampikia {seconds} detik",
    scrollToBottom: "Guliah ka bawah",
    newChat: "Obrolan baru",
  },
  toba_batak: {
    autoDetect: "Otomatis (deteksi)",
    preferredLanguage: "Hata pilihan",
    languageSelectTitle: "Hata pilihan: {label}",
    toastWait: "Sabari ma songon ndang model marampungi jawaban!",
    toastUploadFailed: "Berkas ndang boi diunggah, coba ma ulang!",
    webSearch: "Pangiduan Web",
    news: "Berita",
    toggleTitle: "Pindahon {label}",
    inputPlaceholder: "Tulis pesan...",
    thinkingPrimary: "Masih mamikirkon jawaban...",
    progressWebSearch: "Mamakkuna informasi sian web...",
    progressNews: "Manggombar berita Indonesia na imbaru...",
    progressReasoningHeading: "Jejak panalaran",
    progressReasoningStep1: "Mangarohahon pertanyaan",
    progressReasoningStep2: "Mangaloppar solusi na boi",
    progressReasoningStep3: "Mardomu jawaban na paling baik",
    reasoningTriggerThinking: "Masih mamikirkon...",
    reasoningTriggerDuration: "Mamikirkon {seconds} detik",
    scrollToBottom: "Gulir tu toru",
    newChat: "Pangobrolan baru",
  },
};

const formatTemplate = (
  template: string,
  values?: Record<string, string | number>
) => {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key];
    return value !== undefined ? String(value) : match;
  });
};

const resolveLanguage = (languagePreference?: string): SupportedLanguage => {
  if (!languagePreference || languagePreference === "auto") {
    return FALLBACK_LANGUAGE;
  }

  if ((translations as Record<string, TranslationMap>)[languagePreference]) {
    return languagePreference as SupportedLanguage;
  }

  return FALLBACK_LANGUAGE;
};

const translateWithLanguage = (
  language: SupportedLanguage,
  key: TranslationKey,
  values?: Record<string, string | number>
) => {
  const languageTranslations = translations[language] ?? translations[FALLBACK_LANGUAGE];
  const template =
    languageTranslations[key] ?? translations[FALLBACK_LANGUAGE][key];

  return formatTemplate(template, values);
};

export const createTranslator = (languagePreference?: string) => {
  const language = resolveLanguage(languagePreference);

  return (key: TranslationKey, values?: Record<string, string | number>) =>
    translateWithLanguage(language, key, values);
};

export const getResolvedLanguage = (languagePreference?: string) =>
  resolveLanguage(languagePreference);

