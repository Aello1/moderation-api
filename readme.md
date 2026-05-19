# Moderation API

AI destekli içerik moderasyon API'si. Hugging Face'in `toxic-bert` modeli kullanılarak metinleri analiz eder ve zararlı içerikleri tespit eder.

## Özellikler

- Metin analizi — toxic, insult, threat, obscene, identity hate kategorilerinde skorlama
- Otomatik karar — allow, warn, block
- Moderasyon geçmişi — filtreleme ve sayfalama ile
- İstatistik endpoint'i
- Rate limiting
- Swagger dokümantasyonu

## Kurulum

1. Repoyu klonla

\`\`\`bash
git clone https://github.com/KULLANICI_ADIN/moderation-api.git
cd moderation-api
\`\`\`

2. Bağımlılıkları yükle

\`\`\`bash
npm install
\`\`\`

3. `.env` dosyasını oluştur

\`\`\`bash
cp .env.example .env
\`\`\`

4. `.env` dosyasını düzenle — kendi bilgilerini gir

5. Veritabanını hazırla

\`\`\`bash
npx prisma db push
\`\`\`

6. Server'ı başlat

\`\`\`bash
npm run dev
\`\`\`

## Kullanım

Swagger dokümantasyonu: `http://localhost:3000/docs`

### Metin analizi

\`\`\`bash
POST /api/moderate
Content-Type: application/json

{
  "text": "analiz edilecek metin"
}
\`\`\`

### Geçmiş sorgulama

\`\`\`bash
GET /api/logs?flagged=true&action=block&page=1&limit=10
\`\`\`

### İstatistikler

\`\`\`bash
GET /api/stats
\`\`\`

## Teknolojiler

- Node.js + TypeScript
- Express
- PostgreSQL + Prisma
- Hugging Face — toxic-bert
- Swagger UI