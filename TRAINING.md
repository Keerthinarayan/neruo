# 🧠 Model Training Guide

This guide explains how to train the Drug Repurposing GNN model on your local machine.

## Prerequisites

- Python 3.10+
- Neo4j database connection (already configured)
- ~500MB disk space for model checkpoints
- ~20-30 minutes training time (CPU)

## Quick Start

```bash
# 1. Activate virtual environment
.\.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate      # Linux/Mac

# 2. Install dependencies
pip install torch scikit-learn

# 3. Train the model
python -m backend.models.train --epochs 30
```

## Training Options

| Option | Default | Description |
|--------|---------|-------------|
| `--epochs` | 100 | Number of training epochs |
| `--batch-size` | 256 | Batch size for training |
| `--lr` | 0.001 | Learning rate |
| `--embed-dim` | 128 | Node embedding dimension |
| `--hidden-dim` | 256 | Hidden layer dimension |
| `--num-layers` | 3 | Number of GNN layers |
| `--patience` | 15 | Early stopping patience |
| `--save-dir` | checkpoints | Directory to save models |

### Example Commands

```bash
# Quick training (recommended for first run)
python -m backend.models.train --epochs 30 --batch-size 256

# Full training with custom settings
python -m backend.models.train --epochs 100 --lr 0.0005 --hidden-dim 512

# Save to custom directory
python -m backend.models.train --save-dir my_models
```

## What Happens During Training

1. **Load Graph Data** - Fetches nodes and edges from Neo4j (25,000+ nodes, 76,000+ edges)
2. **Create Training Pairs** - Extracts positive pairs (known treatments) and generates negative samples
3. **Train GNN** - Trains a Graph Neural Network with attention mechanisms
4. **Evaluate** - Validates on held-out test set after each epoch
5. **Save Checkpoints** - Saves best model and periodic checkpoints

## Expected Output

```
2025-12-12 21:56:00 - INFO - Using device: cpu
2025-12-12 21:56:00 - INFO - ============================================================
2025-12-12 21:56:00 - INFO - Starting Drug Repurposing Model Training
2025-12-12 21:56:00 - INFO - ============================================================
2025-12-12 21:56:03 - INFO - Loaded 25203 nodes
2025-12-12 21:56:17 - INFO - Loaded 76857 edges
2025-12-12 21:56:18 - INFO - Found 1145 positive pairs
2025-12-12 21:56:18 - INFO - Generated 2290 negative pairs
2025-12-12 21:56:18 - INFO - Train: 2748, Validation: 687
2025-12-12 21:56:18 - INFO - Model parameters: 9,796,097 total

Epoch   1/30 | Train Loss: 0.6039 | Val AUC: 0.8379 | ★ New best!
Epoch   2/30 | Train Loss: 0.5465 | Val AUC: 0.8385 | ★ New best!
...
Epoch  14/30 | Train Loss: 0.3674 | Val AUC: 0.8959 | ★ New best!
...
Training complete! Best validation AUC: 0.8959
```

## Model Performance

Our trained model achieves:

| Metric | Score |
|--------|-------|
| **AUC-ROC** | 89.6% |
| **Average Precision** | 75.7% |
| **Accuracy** | 83.1% |

## Output Files

After training, you'll find these files in `backend/checkpoints/`:

| File | Description |
|------|-------------|
| `best_model.pt` | Best model (highest validation AUC) |
| `final_model.pt` | Model from last epoch |
| `checkpoint_epoch_*.pt` | Periodic checkpoints |
| `training_history.json` | Loss and metrics per epoch |

## Using the Trained Model

Once trained, the model loads automatically when you start the backend:

```bash
python -m uvicorn backend.main:app --reload --port 8000
```

You should see:
```
INFO: ✅ Loaded trained model from backend/checkpoints/best_model.pt
INFO:    Model has 25,203 nodes, 10 relations
```

## API Endpoints for Model Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/model/status` | GET | Check if trained model is loaded |
| `/model/train` | POST | Start training in background |
| `/model/training-status` | GET | Check training progress |
| `/model/reload` | POST | Reload model from checkpoint |

### Example: Check Model Status

```bash
curl http://localhost:8000/model/status
```

Response:
```json
{
  "status": "success",
  "data": {
    "model": {
      "model_type": "Trained DrugRepurposingGNN",
      "status": "loaded",
      "num_nodes": 25203
    }
  }
}
```

## Troubleshooting

### "No trained model found"
Run the training script first:
```bash
python -m backend.models.train --epochs 30
```

### "CUDA out of memory"
Reduce batch size:
```bash
python -m backend.models.train --batch-size 64
```

### "Cannot connect to Neo4j"
Ensure the Neo4j database is accessible. Check `backend/database.py` for connection settings.

### Training is slow
- Use GPU if available (CUDA)
- Reduce `--num-layers` to 2
- Reduce `--hidden-dim` to 128

## Model Architecture

The model uses a **Graph Neural Network** with:

- **Node Embeddings** - Learned embeddings for each entity (drugs, diseases, genes)
- **Multi-Relational Convolutions** - Separate weights for each relationship type
- **Attention Mechanism** - Focuses on important neighbors
- **Bilinear Scorer** - Predicts drug-disease interaction probability

```
Input: Drug ID, Disease ID
    ↓
Node Embeddings (128-dim)
    ↓
GNN Layer 1 → GNN Layer 2 → GNN Layer 3
    ↓
Drug Embedding + Disease Embedding
    ↓
Bilinear + MLP Scorer
    ↓
Output: Probability (0-1)
```

## Important Notes

⚠️ **Scores are NOT clinical efficacy**

The model outputs a confidence score (0-95%) that represents:
- ✅ Pattern similarity to known drug-disease treatments
- ✅ Biological pathway alignment
- ✅ Research prioritization ranking

NOT:
- ❌ Probability the drug will work clinically
- ❌ FDA approval likelihood
- ❌ Medical advice

Always validate predictions through proper clinical trials.
