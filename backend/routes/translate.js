const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { texts, target } = req.body;

  if (!Array.isArray(texts) || !target) {
    return res.status(400).json({ error: 'texts array and target are required' });
  }

  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    return res.json({ translations: texts });
  }

  try {
    const params = new URLSearchParams({
      target,
      key: process.env.GOOGLE_TRANSLATE_API_KEY,
    });

    texts.forEach((text) => params.append('q', text));

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?${params.toString()}`
    );
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Translate API error:', data.error || data);
      return res.json({ translations: texts });
    }

    const translations = (data.data?.translations || []).map((entry) => entry.translatedText);
    return res.json({ translations: translations.length === texts.length ? translations : texts });
  } catch (error) {
    console.error('Translate route error:', error);
    return res.json({ translations: texts });
  }
});

module.exports = router;