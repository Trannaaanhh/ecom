AI Training Data — Guidelines

Purpose
- Provide structured examples for improving the AI recommendation and chatbot behavior.

Format (JSONL)
- Each line is a JSON object with fields:
  - `user_id` (string|null): optional anonymous id
  - `language` ("vi" or "en")
  - `query` (string): user's natural language request
  - `behavior` (array): optional recent events (objects with `action` and `product_id`)
  - `recommended_products` (array): objects {product_id, reason}
  - `chat_responses` (array): multiple good responses (diverse phrasing). Include short follow-up question in some.

Guidelines
- Provide 5–10 diverse `chat_responses` per common query type when possible.
- Vary tone: friendly, professional, concise, suggestive.
- Include edge cases: missing data, ambiguous requests, B2B vs B2C.
- For recommendations, include at least 2–4 items with concise reasons.

Examples
- See `ai_training_examples.jsonl` for sample entries.

Next steps
1. Add or edit entries in `ai_training_examples.jsonl` to reflect real product ids and richer responses.
2. When ready, ask me to run the training script (I can create and run it inside the `ai-service` container).

Notes
- Keep personally identifiable info out of training data.
- For large-scale training, split files and ensure consistent tokenization.
