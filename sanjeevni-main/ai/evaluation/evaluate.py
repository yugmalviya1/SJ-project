import json
import sys
from typing import Dict, Any, List
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from ai.inference.baseline_extractor import BaselineHeuristicExtractor

def evaluate_predictions(gold_records: List[Dict[str, Any]], pred_records: List[Dict[str, Any]]) -> Dict[str, float]:
    total_samples = len(gold_records)
    valid_json_count = 0
    
    patient_name_correct = 0
    patient_mrn_correct = 0
    report_type_correct = 0
    
    total_gold_labs = 0
    matched_labs = 0
    hallucinated_labs = 0
    
    for gold_obj, pred in zip(gold_records, pred_records):
        gold = gold_obj["output"]
        
        # Valid JSON structure check
        if isinstance(pred, dict) and "report_type" in pred and "patient_info" in pred:
            valid_json_count += 1
            
        if pred.get("report_type") == gold.get("report_type"):
            report_type_correct += 1
            
        if pred.get("patient_info", {}).get("name") == gold.get("patient_info", {}).get("name"):
            patient_name_correct += 1
            
        if pred.get("patient_info", {}).get("mrn") == gold.get("patient_info", {}).get("mrn"):
            patient_mrn_correct += 1
            
        # Lab evaluation
        gold_lab_dict = {item["name"]: item["value"] for item in gold.get("lab_results", [])}
        pred_lab_dict = {item["name"]: item["value"] for item in pred.get("lab_results", [])}
        
        total_gold_labs += len(gold_lab_dict)
        for lab_name, lab_val in pred_lab_dict.items():
            if lab_name in gold_lab_dict:
                if str(gold_lab_dict[lab_name]) == str(lab_val):
                    matched_labs += 1
            else:
                hallucinated_labs += 1
                
    json_validity = (valid_json_count / total_samples) * 100 if total_samples > 0 else 0.0
    report_type_acc = (report_type_correct / total_samples) * 100 if total_samples > 0 else 0.0
    patient_name_acc = (patient_name_correct / total_samples) * 100 if total_samples > 0 else 0.0
    patient_mrn_acc = (patient_mrn_correct / total_samples) * 100 if total_samples > 0 else 0.0
    lab_recall = (matched_labs / total_gold_labs) * 100 if total_gold_labs > 0 else 0.0
    hallucination_rate = (hallucinated_labs / max(1, matched_labs + hallucinated_labs)) * 100
    
    return {
        "Total Samples Evaluated": total_samples,
        "JSON Validity (%)": round(json_validity, 2),
        "Report Type Accuracy (%)": round(report_type_acc, 2),
        "Patient Name Accuracy (%)": round(patient_name_acc, 2),
        "Patient MRN Accuracy (%)": round(patient_mrn_acc, 2),
        "Lab Value Recall (%)": round(lab_recall, 2),
        "Medical Hallucination Rate (%)": round(hallucination_rate, 2)
    }

def run_baseline_benchmarks(test_file: str = "ai/dataset/test.json"):
    with open(test_file, "r", encoding="utf-8") as f:
        test_data = json.load(f)
        
    extractor = BaselineHeuristicExtractor()
    preds = [extractor.extract(sample["input"]) for sample in test_data]
    
    metrics = evaluate_predictions(test_data, preds)
    print("\n================= M1.1 BASELINE EVALUATION METRICS =================")
    for k, v in metrics.items():
        print(f"  {k:<32}: {v}")
    print("===================================================================\n")
    return metrics

if __name__ == "__main__":
    run_baseline_benchmarks()
