"""
MedSecure AI: Unsloth / HuggingFace QLoRA Fine-Tuning Pipeline
Architecture: Unsloth 4-bit Quantization + Low-Rank Adaption (LoRA)
Target: Medical Document Structured JSON Extraction

Experiment Hyperparameters:
- Base Model: unsloth/Llama-3.2-3B-Instruct (or unsloth/mistral-7b-v0.3-bnb-4bit)
- Max Sequence Length: 2048
- Quantization: 4-bit NormalFloat (NF4) with Double Quantization
- LoRA Rank (r): 16
- LoRA Alpha: 32
- LoRA Dropout: 0.05
- Target Modules: ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
- Optimizer: AdamW (8-bit)
- Learning Rate: 2e-4
- LR Scheduler: cosine
- Batch Size per device: 2 (Gradient Accumulation Steps: 4 -> Effective: 8)
- Epochs: 3
"""

import json
import os
import sys
from typing import Dict, Any

PROMPT_TEMPLATE = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request in valid JSON.

### Instruction:
{instruction}

### Input:
{input}

### Response:
{output}"""

def format_prompts(batch):
    instructions = batch["instruction"]
    inputs = batch["input"]
    outputs = [json.dumps(out, indent=2) for out in batch["output"]]
    
    texts = []
    for inst, inp, out in zip(instructions, inputs, outputs):
        text = PROMPT_TEMPLATE.format(instruction=inst, input=inp, output=out)
        texts.append(text)
    return {"text": texts}

def train():
    try:
        import torch
        from unsloth import FastLanguageModel
        from trl import SFTTrainer
        from transformers import TrainingArguments
        from datasets import load_dataset
    except ImportError as e:
        print("[MedSecure ML Notice] Unsloth / PyTorch / CUDA environment not detected in local Windows runtime.")
        print(f"Details: {e}")
        print("To run on GPU workstation / Google Colab / Lambda Cloud:")
        print("  pip install 'unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git'")
        print("  pip install --no-deps trl peft accelerate bitsandbytes")
        return

    print("--- Initializing FastLanguageModel with 4-bit Quantization ---")
    max_seq_length = 2048
    model_name = "unsloth/Llama-3.2-3B-Instruct"

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=model_name,
        max_seq_length=max_seq_length,
        load_in_4bit=True,
    )

    print("--- Applying QLoRA Adapters ---")
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42
    )

    print("--- Loading MedSecure Synthetic Dataset ---")
    dataset = load_dataset("json", data_files={
        "train": "ai/dataset/train.json",
        "validation": "ai/dataset/val.json"
    })

    dataset = dataset.map(format_prompts, batched=True)

    training_args = TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        max_steps=120,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=5,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=42,
        output_dir="ai/training/outputs",
        report_to="none"
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        dataset_text_field="text",
        max_seq_length=max_seq_length,
        dataset_num_proc=2,
        packing=False,
        args=training_args,
    )

    print("--- Commencing QLoRA Training ---")
    trainer.train()

    adapter_save_dir = "ai/training/medsecure_qlora_adapter"
    print(f"--- Saving Trained QLoRA Adapter to {adapter_save_dir} ---")
    model.save_pretrained(adapter_save_dir)
    tokenizer.save_pretrained(adapter_save_dir)
    print("Fine-tuning pipeline completed successfully.")

if __name__ == "__main__":
    train()
