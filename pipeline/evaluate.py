"""
Runs inference on eval.jsonl with the saved adapter.
Returns pass/fail (BLEU threshold: 0.65).
Writes models/eval-{timestamp}.json.
"""

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import nltk
from datasets import load_dataset
from nltk.translate.bleu_score import SmoothingFunction, corpus_bleu
from unsloth import FastLanguageModel

from config import CONFIG

nltk.download("punkt", quiet=True)


def main(adapter_path: str) -> dict:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=adapter_path,
        max_seq_length=CONFIG.max_seq_length,
        load_in_4bit=True,
    )
    FastLanguageModel.for_inference(model)

    eval_data = load_dataset("json", data_files=f"{CONFIG.data_dir}/eval.jsonl", split="train")

    references: list = []
    hypotheses: list = []
    latencies:  list = []

    for ex in eval_data:
        prompt = (
            f"### Instruction:\n{ex['instruction']}\n\n"
            f"### Input:\n{ex['input']}\n\n"
            f"### Response:\n"
        )
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        t0 = time.monotonic()
        out = model.generate(**inputs, max_new_tokens=256, use_cache=True)
        latencies.append(int((time.monotonic() - t0) * 1000))

        decoded = tokenizer.decode(out[0], skip_special_tokens=True)
        response = decoded[len(prompt):].strip()

        ref_tokens = nltk.word_tokenize(ex["output"].lower())
        hyp_tokens = nltk.word_tokenize(response.lower())
        references.append([ref_tokens])
        hypotheses.append(hyp_tokens)

    smoothing = SmoothingFunction().method1
    bleu = corpus_bleu(references, hypotheses, smoothing_function=smoothing)
    sorted_lat = sorted(latencies)
    p50 = sorted_lat[len(sorted_lat) // 2]
    p95 = sorted_lat[int(len(sorted_lat) * 0.95)]

    passed = bleu >= CONFIG.eval_bleu_threshold
    result = {
        "adapter_path":   adapter_path,
        "bleu":           round(bleu, 4),
        "passed":         passed,
        "threshold":      CONFIG.eval_bleu_threshold,
        "latency_p50_ms": p50,
        "latency_p95_ms": p95,
        "eval_count":     len(eval_data),
        "timestamp":      timestamp,
    }

    Path(CONFIG.models_dir).mkdir(exist_ok=True)
    result_path = f"{CONFIG.models_dir}/eval-{timestamp}.json"
    with open(result_path, "w") as f:
        json.dump(result, f, indent=2)

    print(json.dumps(result))
    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python evaluate.py <adapter_path>")
        sys.exit(1)
    r = main(sys.argv[1])
    sys.exit(0 if r["passed"] else 1)
