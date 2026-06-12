"""
Template training script for LSTM recommender.
This is a skeleton. After you populate `training-data/ai_training_examples.jsonl`, we can implement
feature extraction, model definition, training loop, and save a `.pth` artifact to be consumed
by `HybridAIEngine._load_lstm_artifact`.

Run (inside project root or container):
python backend/services/ai-service/scripts/train_lstm_template.py --input training-data/ai_training_examples.jsonl --output training-data/lstm_artifact.pth

"""
import argparse
import json
from pathlib import Path

def load_examples(path: Path):
    examples = []
    with path.open('r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            examples.append(json.loads(line))
    return examples


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    examples = load_examples(input_path)
    print(f"Loaded {len(examples)} examples from {input_path}")

    # TODO: Implement feature extraction, dataset, model, training loop.
    # For now, write a placeholder artifact file so AI engine can detect it.
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('wb') as fh:
        fh.write(b"PLACEHOLDER_LSTM_ARTIFACT")
    print(f"Wrote placeholder artifact to {output_path}")

if __name__ == '__main__':
    main()
