import prisma from '../prisma';

const HF_API_KEY = process.env.HF_API_KEY;
const MODEL_URL = 'https://router.huggingface.co/hf-inference/models/unitary/toxic-bert';

if (!HF_API_KEY) {
  throw new Error('HF_API_KEY tanımlı değil. .env dosyasını kontrol et.');
}

export async function moderateText(text: string) {
  const response = await fetch(MODEL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API hatası: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (!Array.isArray(result) || !Array.isArray(result[0])) {
    throw new Error('Hugging Face API beklenmeyen format döndürdü.');
  }

  const scores = result[0];

  const getScore = (label: string) =>
    scores.find((s: any) => s.label === label)?.score ?? 0;

  const toxic = getScore('toxic');
  const insult = getScore('insult');
  const threat = getScore('threat');
  const obscene = getScore('obscene');
  const identityHate = getScore('identity_hate');

  const flagged = toxic > 0.5 || threat > 0.5 || identityHate > 0.5;
  const action = flagged ? 'block' : insult > 0.3 || obscene > 0.3 ? 'warn' : 'allow';

  const log = await prisma.moderationLog.create({
    data: {
      text,
      flagged,
      categories: { toxic, insult, threat, obscene, identityHate },
      scores: { toxic, insult, threat, obscene, identityHate },
      action,
    },
  });

  return log;
}