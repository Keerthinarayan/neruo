"""
Training Pipeline for Drug Repurposing Model
Your competitive advantage: A trained neurosymbolic model on real biomedical data
"""

import os
import sys
import json
import logging
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, average_precision_score

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.architecture import DrugRepurposingModel
from database import db

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Relation type mapping
RELATION_TYPES = {
    'TREATS': 0,
    'PALLIATES': 1,
    'BINDS': 2,
    'TARGETS': 3,
    'UPREGULATES': 4,
    'DOWNREGULATES': 5,
    'ASSOCIATES': 6,
    'RESEMBLES': 7,
    'INTERACTS': 8,
    'LOCALIZES': 9,
}

# Node type mapping
NODE_TYPES = {
    'Compound': 0,
    'Drug': 0,  # Same as Compound
    'Disease': 1,
    'Gene': 2,
    'Anatomy': 3,
    'Pathway': 4,
    'PharmacologicClass': 5,
    'SideEffect': 6,
    'Symptom': 7,
}


class DrugRepurposingTrainer:
    """
    Complete training pipeline for the drug repurposing model
    """
    
    def __init__(
        self,
        embed_dim: int = 128,
        hidden_dim: int = 256,
        num_layers: int = 3,
        num_heads: int = 4,
        dropout: float = 0.2,
        learning_rate: float = 0.001,
        weight_decay: float = 0.01,
        device: Optional[str] = None
    ):
        self.embed_dim = embed_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.num_heads = num_heads
        self.dropout = dropout
        self.learning_rate = learning_rate
        self.weight_decay = weight_decay
        
        self.device = torch.device(
            device if device else ('cuda' if torch.cuda.is_available() else 'cpu')
        )
        logger.info(f"Using device: {self.device}")
        
        # Data structures
        self.node_to_idx: Dict[str, int] = {}
        self.idx_to_node: Dict[int, str] = {}
        self.node_types: Dict[str, int] = {}
        
        self.model: Optional[DrugRepurposingModel] = None
        self.optimizer: Optional[optim.Optimizer] = None
        self.scheduler: Optional[optim.lr_scheduler._LRScheduler] = None
        
        # Graph data
        self.edge_index: Optional[torch.Tensor] = None
        self.edge_type: Optional[torch.Tensor] = None
        self.node_ids: Optional[torch.Tensor] = None
        self.node_type_ids: Optional[torch.Tensor] = None
        
        # Training history
        self.history = {
            'train_loss': [],
            'val_loss': [],
            'val_auc': [],
            'val_ap': [],
            'val_accuracy': []
        }
    
    def load_graph_data(self) -> int:
        """Load knowledge graph from Neo4j"""
        logger.info("Loading graph data from Neo4j...")
        
        db.connect()
        
        # Load all nodes
        logger.info("Loading nodes...")
        nodes_query = """
        MATCH (n)
        WHERE n:Compound OR n:Disease OR n:Gene OR n:Anatomy OR n:Pathway OR n:PharmacologicClass
        RETURN n.id as id, n.name as name, labels(n)[0] as type
        """
        nodes = db.query(nodes_query)
        
        for node in nodes:
            node_id = node['id']
            node_type = node['type']
            
            if node_id not in self.node_to_idx:
                idx = len(self.node_to_idx)
                self.node_to_idx[node_id] = idx
                self.idx_to_node[idx] = node_id
                self.node_types[node_id] = NODE_TYPES.get(node_type, 0)
        
        logger.info(f"Loaded {len(self.node_to_idx)} nodes")
        
        # Load all edges
        logger.info("Loading edges...")
        edges_query = """
        MATCH (a)-[r]->(b)
        WHERE (a:Compound OR a:Disease OR a:Gene OR a:Anatomy OR a:Pathway OR a:PharmacologicClass)
          AND (b:Compound OR b:Disease OR b:Gene OR b:Anatomy OR b:Pathway OR b:PharmacologicClass)
        RETURN a.id as source, b.id as target, type(r) as rel_type
        """
        edges = db.query(edges_query)
        
        edge_src = []
        edge_dst = []
        edge_types = []
        
        for edge in edges:
            src = edge['source']
            dst = edge['target']
            rel = edge['rel_type']
            
            if src in self.node_to_idx and dst in self.node_to_idx:
                edge_src.append(self.node_to_idx[src])
                edge_dst.append(self.node_to_idx[dst])
                edge_types.append(RELATION_TYPES.get(rel, 8))  # Default to INTERACTS
        
        logger.info(f"Loaded {len(edge_src)} edges")
        
        # Convert to tensors
        self.edge_index = torch.tensor([edge_src, edge_dst], dtype=torch.long, device=self.device)
        self.edge_type = torch.tensor(edge_types, dtype=torch.long, device=self.device)
        
        # Node tensors
        num_nodes = len(self.node_to_idx)
        self.node_ids = torch.arange(num_nodes, dtype=torch.long, device=self.device)
        self.node_type_ids = torch.tensor(
            [self.node_types.get(self.idx_to_node[i], 0) for i in range(num_nodes)],
            dtype=torch.long,
            device=self.device
        )
        
        return num_nodes
    
    def load_training_pairs(self) -> Tuple[List[Tuple[int, int, int]], List[Tuple[int, int, int]]]:
        """Load positive and negative drug-disease pairs for training"""
        logger.info("Loading training pairs...")
        
        # Positive pairs: Known drug-disease treatments
        positive_query = """
        MATCH (d:Compound)-[r:TREATS|PALLIATES]->(dis:Disease)
        RETURN d.id as drug_id, dis.id as disease_id
        """
        positive_results = db.query(positive_query)
        
        positive_pairs = []
        positive_set = set()
        
        for row in positive_results:
            drug_id = row['drug_id']
            disease_id = row['disease_id']
            
            if drug_id in self.node_to_idx and disease_id in self.node_to_idx:
                drug_idx = self.node_to_idx[drug_id]
                disease_idx = self.node_to_idx[disease_id]
                positive_pairs.append((drug_idx, disease_idx, 1))
                positive_set.add((drug_idx, disease_idx))
        
        logger.info(f"Found {len(positive_pairs)} positive pairs")
        
        # Get all drugs and diseases for negative sampling
        drug_indices = [
            self.node_to_idx[node_id] 
            for node_id in self.node_to_idx 
            if self.node_types.get(node_id, 0) == NODE_TYPES['Compound']
        ]
        disease_indices = [
            self.node_to_idx[node_id] 
            for node_id in self.node_to_idx 
            if self.node_types.get(node_id, 0) == NODE_TYPES['Disease']
        ]
        
        logger.info(f"Found {len(drug_indices)} drugs and {len(disease_indices)} diseases")
        
        # Generate negative pairs (2x positive for hard negative mining)
        negative_pairs = []
        np.random.seed(42)
        
        num_negatives = min(len(positive_pairs) * 2, len(drug_indices) * len(disease_indices) - len(positive_set))
        
        attempts = 0
        max_attempts = num_negatives * 10
        
        while len(negative_pairs) < num_negatives and attempts < max_attempts:
            drug_idx = np.random.choice(drug_indices)
            disease_idx = np.random.choice(disease_indices)
            
            if (drug_idx, disease_idx) not in positive_set:
                negative_pairs.append((drug_idx, disease_idx, 0))
                positive_set.add((drug_idx, disease_idx))  # Prevent duplicates
            
            attempts += 1
        
        logger.info(f"Generated {len(negative_pairs)} negative pairs")
        
        # Combine and split
        all_pairs = positive_pairs + negative_pairs
        np.random.shuffle(all_pairs)
        
        train_pairs, val_pairs = train_test_split(
            all_pairs, 
            test_size=0.2, 
            random_state=42,
            stratify=[p[2] for p in all_pairs]  # Stratify by label
        )
        
        logger.info(f"Train: {len(train_pairs)}, Validation: {len(val_pairs)}")
        
        return train_pairs, val_pairs
    
    def initialize_model(self, num_nodes: int):
        """Initialize the model and optimizer"""
        logger.info("Initializing model...")
        
        self.model = DrugRepurposingModel(
            num_nodes=num_nodes,
            num_relations=len(RELATION_TYPES),
            embed_dim=self.embed_dim,
            hidden_dim=self.hidden_dim,
            num_layers=self.num_layers,
            num_heads=self.num_heads,
            dropout=self.dropout
        ).to(self.device)
        
        # Count parameters
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        logger.info(f"Model parameters: {total_params:,} total, {trainable_params:,} trainable")
        
        # Optimizer with weight decay
        self.optimizer = optim.AdamW(
            self.model.parameters(),
            lr=self.learning_rate,
            weight_decay=self.weight_decay
        )
        
        # Cosine annealing with warm restarts
        self.scheduler = CosineAnnealingWarmRestarts(
            self.optimizer,
            T_0=10,  # Restart every 10 epochs
            T_mult=2  # Double the restart period after each restart
        )
    
    def train_epoch(
        self, 
        train_pairs: List[Tuple[int, int, int]], 
        batch_size: int = 256
    ) -> float:
        """Train for one epoch"""
        self.model.train()
        
        total_loss = 0
        num_batches = 0
        
        # Shuffle training data
        indices = np.random.permutation(len(train_pairs))
        
        for i in range(0, len(train_pairs), batch_size):
            batch_indices = indices[i:i + batch_size]
            batch = [train_pairs[j] for j in batch_indices]
            
            drug_indices = torch.tensor([p[0] for p in batch], device=self.device)
            disease_indices = torch.tensor([p[1] for p in batch], device=self.device)
            labels = torch.tensor([p[2] for p in batch], dtype=torch.float, device=self.device)
            
            self.optimizer.zero_grad()
            
            # Forward pass
            scores = self.model(
                self.node_ids,
                self.node_type_ids,
                self.edge_index,
                self.edge_type,
                drug_indices,
                disease_indices
            ).squeeze()
            
            # Binary cross-entropy loss with label smoothing
            labels_smooth = labels * 0.9 + 0.05  # Label smoothing
            loss = nn.functional.binary_cross_entropy(scores, labels_smooth)
            
            # Backward pass
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            
            self.optimizer.step()
            
            total_loss += loss.item()
            num_batches += 1
        
        return total_loss / num_batches
    
    @torch.no_grad()
    def evaluate(self, val_pairs: List[Tuple[int, int, int]]) -> Dict[str, float]:
        """Evaluate model on validation set"""
        self.model.eval()
        
        drug_indices = torch.tensor([p[0] for p in val_pairs], device=self.device)
        disease_indices = torch.tensor([p[1] for p in val_pairs], device=self.device)
        labels = torch.tensor([p[2] for p in val_pairs], dtype=torch.float, device=self.device)
        
        # Forward pass
        scores = self.model(
            self.node_ids,
            self.node_type_ids,
            self.edge_index,
            self.edge_type,
            drug_indices,
            disease_indices
        ).squeeze()
        
        # Loss
        loss = nn.functional.binary_cross_entropy(scores, labels).item()
        
        # Move to CPU for sklearn metrics
        scores_np = scores.cpu().numpy()
        labels_np = labels.cpu().numpy()
        
        # Metrics
        predictions = (scores_np > 0.5).astype(int)
        accuracy = (predictions == labels_np).mean()
        
        try:
            auc = roc_auc_score(labels_np, scores_np)
        except ValueError:
            auc = 0.5
        
        try:
            ap = average_precision_score(labels_np, scores_np)
        except ValueError:
            ap = 0.5
        
        return {
            'loss': loss,
            'accuracy': accuracy,
            'auc': auc,
            'ap': ap
        }
    
    def train(
        self,
        epochs: int = 100,
        batch_size: int = 256,
        patience: int = 15,
        save_dir: str = 'checkpoints'
    ):
        """Full training loop"""
        logger.info("=" * 60)
        logger.info("Starting Drug Repurposing Model Training")
        logger.info("=" * 60)
        
        # Create save directory
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Load data
        num_nodes = self.load_graph_data()
        train_pairs, val_pairs = self.load_training_pairs()
        
        # Initialize model
        self.initialize_model(num_nodes)
        
        # Training loop
        best_auc = 0
        patience_counter = 0
        
        for epoch in range(epochs):
            # Train
            train_loss = self.train_epoch(train_pairs, batch_size)
            
            # Evaluate
            val_metrics = self.evaluate(val_pairs)
            
            # Update scheduler
            self.scheduler.step()
            
            # Log progress
            current_lr = self.optimizer.param_groups[0]['lr']
            logger.info(
                f"Epoch {epoch + 1:3d}/{epochs} | "
                f"LR: {current_lr:.6f} | "
                f"Train Loss: {train_loss:.4f} | "
                f"Val Loss: {val_metrics['loss']:.4f} | "
                f"Val AUC: {val_metrics['auc']:.4f} | "
                f"Val AP: {val_metrics['ap']:.4f} | "
                f"Val Acc: {val_metrics['accuracy']:.4f}"
            )
            
            # Save history
            self.history['train_loss'].append(train_loss)
            self.history['val_loss'].append(val_metrics['loss'])
            self.history['val_auc'].append(val_metrics['auc'])
            self.history['val_ap'].append(val_metrics['ap'])
            self.history['val_accuracy'].append(val_metrics['accuracy'])
            
            # Early stopping and checkpointing
            if val_metrics['auc'] > best_auc:
                best_auc = val_metrics['auc']
                patience_counter = 0
                
                # Save best model
                self.save_model(save_path / 'best_model.pt')
                logger.info(f"★ New best model! AUC: {best_auc:.4f}")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    logger.info(f"Early stopping at epoch {epoch + 1}")
                    break
            
            # Periodic checkpoint
            if (epoch + 1) % 10 == 0:
                self.save_model(save_path / f'checkpoint_epoch_{epoch + 1}.pt')
        
        # Save final model
        self.save_model(save_path / 'final_model.pt')
        
        # Save training history
        with open(save_path / 'training_history.json', 'w') as f:
            json.dump(self.history, f, indent=2)
        
        logger.info("=" * 60)
        logger.info(f"Training complete! Best validation AUC: {best_auc:.4f}")
        logger.info(f"Models saved to: {save_path}")
        logger.info("=" * 60)
        
        return best_auc
    
    def save_model(self, path: str):
        """Save model checkpoint"""
        checkpoint = {
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'node_to_idx': self.node_to_idx,
            'idx_to_node': self.idx_to_node,
            'node_types': self.node_types,
            'history': self.history,
            'config': {
                'embed_dim': self.embed_dim,
                'hidden_dim': self.hidden_dim,
                'num_layers': self.num_layers,
                'num_heads': self.num_heads,
                'dropout': self.dropout,
                'num_nodes': len(self.node_to_idx),
                'num_relations': len(RELATION_TYPES)
            },
            'timestamp': datetime.now().isoformat()
        }
        torch.save(checkpoint, path)
        logger.info(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """Load model checkpoint"""
        checkpoint = torch.load(path, map_location=self.device)
        
        # Restore mappings
        self.node_to_idx = checkpoint['node_to_idx']
        self.idx_to_node = checkpoint['idx_to_node']
        self.node_types = checkpoint['node_types']
        
        # Restore config
        config = checkpoint['config']
        
        # Initialize model with saved config
        self.model = DrugRepurposingModel(
            num_nodes=config['num_nodes'],
            num_relations=config['num_relations'],
            embed_dim=config['embed_dim'],
            hidden_dim=config['hidden_dim'],
            num_layers=config['num_layers'],
            num_heads=config['num_heads'],
            dropout=config['dropout']
        ).to(self.device)
        
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.history = checkpoint.get('history', {})
        
        logger.info(f"Model loaded from {path}")


def main():
    """Main training entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Train Drug Repurposing Model")
    parser.add_argument("--epochs", type=int, default=100, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=256, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--embed-dim", type=int, default=128, help="Embedding dimension")
    parser.add_argument("--hidden-dim", type=int, default=256, help="Hidden dimension")
    parser.add_argument("--num-layers", type=int, default=3, help="Number of GNN layers")
    parser.add_argument("--patience", type=int, default=15, help="Early stopping patience")
    parser.add_argument("--save-dir", type=str, default="checkpoints", help="Save directory")
    
    args = parser.parse_args()
    
    trainer = DrugRepurposingTrainer(
        embed_dim=args.embed_dim,
        hidden_dim=args.hidden_dim,
        num_layers=args.num_layers,
        learning_rate=args.lr
    )
    
    trainer.train(
        epochs=args.epochs,
        batch_size=args.batch_size,
        patience=args.patience,
        save_dir=args.save_dir
    )


if __name__ == "__main__":
    main()
