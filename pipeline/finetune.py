"""
QLoRA fine-tune using Unsloth + SFTTrainer.
Reads data/train.jsonl. Saves adapter to models/lora-{agent}-{timestamp}/.
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import torch
from datasets import load_dataset
from trl import SFTConfig, SFTTrainer
from unsloth import FastLanguageModel

from config import CONFIG

ALPACA_PROMPT = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""


def format_example(example: dict) -> dict:
    return {
        "text": ALPACA_PROMPT.format(
            example["instruction"],
            example["input"],
            example["output"],
        ) + "<|end_of_text|>"
    }


def main(agent_type: str = "general") -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_dir = f"{CONFIG.models_dir}/lora-{agent_type}-{timestamp}"
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=CONFIG.model_name,
        max_seq_length=CONFIG.max_seq_length,
        load_in_4bit=True,
    )
    model = FastLanguageModel.get_peft_model(
        model,
        r=CONFIG.lora_r,
        lora_alpha=CONFIG.lora_alpha,
        lora_dropout=CONFIG.lora_dropout,
        target_modules=CONFIG.target_modules,
        use_gradient_checkpointing="unsloth",
    )

    dataset = load_dataset("json", data_files=f"{CONFIG.data_dir}/train.jsonl", split="train")
    dataset = dataset.map(format_example)

    use_bf16 = torch.cuda.is_bf16_supported()
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        args=SFTConfig(
            dataset_text_field="text",
            max_seq_length=CONFIG.max_seq_length,
            output_dir=output_dir,
            num_train_epochs=CONFIG.num_epochs,
            per_device_train_batch_size=CONFIG.batch_size,
            learning_rate=CONFIG.learning_rate,
            warmup_ratio=CONFIG.warmup_ratio,
            fp16=not use_bf16,
            bf16=use_bf16,
            logging_steps=10,
            save_strategy="epoch",
            report_to="none",
        ),
    )

    trainer_stats = trainer.train()
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    metrics = {
        "adapter_path":  output_dir,
        "agent_type":    agent_type,
        "train_loss":    trainer_stats.training_loss,
        "train_runtime": trainer_stats.metrics.get("train_runtime", 0),
        "timestamp":     timestamp,
    }
    print(json.dumps(metrics))  # captured by run_pipeline.py
    return output_dir


if __name__ == "__main__":
    agent = sys.argv[1] if len(sys.argv) > 1 else "general"
    main(agent)
