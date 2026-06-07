from dataclasses import dataclass, field
from typing import List


@dataclass
class TrainingConfig:
    model_name:           str   = "unsloth/hermes-3-llama-3.1-8b"
    max_seq_length:       int   = 2048
    lora_r:               int   = 16
    lora_alpha:           int   = 16
    lora_dropout:         float = 0.0
    target_modules: List[str]   = field(default_factory=lambda: [
        "q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"
    ])
    learning_rate:        float = 2e-4
    num_epochs:           int   = 3
    batch_size:           int   = 4
    warmup_ratio:         float = 0.1
    replay_buffer_ratio:  float = 0.7   # 70% old, 30% new — prevents catastrophic forgetting
    eval_bleu_threshold:  float = 0.65
    models_dir:           str   = "models"
    data_dir:             str   = "data"


CONFIG = TrainingConfig()
