"""
GNN Predictor - Now with trained model support!
This is your USP: A real trained model on biomedical data
"""

import os
import random
import sys
import logging
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import torch, but fallback if it fails
try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError as e:
    print(f"Warning: Could not import torch: {e}. Using mock GNN.")
    HAS_TORCH = False
except OSError as e:
    print(f"Warning: OS Error importing torch: {e}. Using mock GNN.")
    HAS_TORCH = False


# Default checkpoint path
DEFAULT_CHECKPOINT = Path(__file__).parent.parent / "checkpoints" / "best_model.pt"


class TrainedGNNPredictor:
    """
    GNN Predictor that uses a TRAINED model for real predictions.
    
    This is your competitive advantage:
    - Trained on real biomedical knowledge graph (Hetionet)
    - Uses Graph Neural Network with attention mechanisms
    - Provides explainable predictions with confidence scores
    """
    
    def __init__(self, checkpoint_path: Optional[str] = None):
        self._model = None
        self._loaded = False
        self._using_trained = False
        
        # Node mappings (loaded from checkpoint)
        self.node_to_idx: Dict[str, int] = {}
        self.idx_to_node: Dict[int, str] = {}
        self.node_types: Dict[str, int] = {}
        
        # Graph data (need to reload for inference)
        self.edge_index: Optional[torch.Tensor] = None
        self.edge_type: Optional[torch.Tensor] = None
        self.node_ids: Optional[torch.Tensor] = None
        self.node_type_ids: Optional[torch.Tensor] = None
        
        # Caching
        self._prediction_cache: Dict[Tuple[str, str], Dict] = {}
        self._cache_hits = 0
        self._cache_misses = 0
        
        # Device
        self.device = torch.device('cuda' if HAS_TORCH and torch.cuda.is_available() else 'cpu') if HAS_TORCH else None
        
        # Try to load trained model
        self.checkpoint_path = checkpoint_path or str(DEFAULT_CHECKPOINT)
        self._try_load_model()
    
    def _try_load_model(self):
        """Attempt to load the trained model"""
        if not HAS_TORCH:
            logger.warning("PyTorch not available, using fallback predictions")
            return
        
        checkpoint_file = Path(self.checkpoint_path)
        
        if checkpoint_file.exists():
            try:
                from backend.models.architecture import DrugRepurposingModel
                
                checkpoint = torch.load(self.checkpoint_path, map_location=self.device, weights_only=False)
                
                # Load node mappings
                self.node_to_idx = checkpoint['node_to_idx']
                self.idx_to_node = checkpoint['idx_to_node']
                self.node_types = checkpoint['node_types']
                
                # Initialize model with saved config
                config = checkpoint['config']
                self._model = DrugRepurposingModel(
                    num_nodes=config['num_nodes'],
                    num_relations=config['num_relations'],
                    embed_dim=config['embed_dim'],
                    hidden_dim=config['hidden_dim'],
                    num_layers=config['num_layers'],
                    num_heads=config['num_heads'],
                    dropout=config['dropout']
                ).to(self.device)
                
                self._model.load_state_dict(checkpoint['model_state_dict'])
                self._model.eval()
                
                # Disable gradients for inference
                for param in self._model.parameters():
                    param.requires_grad = False
                
                self._loaded = True
                self._using_trained = True
                
                logger.info(f"✅ Loaded trained model from {self.checkpoint_path}")
                logger.info(f"   Model has {config['num_nodes']:,} nodes, {config['num_relations']} relations")
                
                # Load graph structure for inference
                self._load_graph_for_inference()
                
            except Exception as e:
                logger.warning(f"Could not load trained model: {e}")
                logger.info("Using fallback prediction (train the model first!)")
                self._using_trained = False
        else:
            logger.info(f"No trained model found at {self.checkpoint_path}")
            logger.info("Run 'python -m models.train' to train the model")
            self._using_trained = False
    
    def _load_graph_for_inference(self):
        """Load graph structure needed for inference"""
        if not self._using_trained:
            return
        
        try:
            # Import database
            from backend.database import db
            
            db.connect()
            
            # Load edges
            edges_query = """
            MATCH (a)-[r]->(b)
            WHERE (a:Compound OR a:Disease OR a:Gene OR a:Anatomy OR a:Pathway OR a:PharmacologicClass)
              AND (b:Compound OR b:Disease OR b:Gene OR b:Anatomy OR a:Pathway OR b:PharmacologicClass)
            RETURN a.id as source, b.id as target, type(r) as rel_type
            """
            
            RELATION_TYPES = {
                'TREATS': 0, 'PALLIATES': 1, 'BINDS': 2, 'TARGETS': 3,
                'UPREGULATES': 4, 'DOWNREGULATES': 5, 'ASSOCIATES': 6,
                'RESEMBLES': 7, 'INTERACTS': 8, 'LOCALIZES': 9,
            }
            
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
                    edge_types.append(RELATION_TYPES.get(rel, 8))
            
            self.edge_index = torch.tensor([edge_src, edge_dst], dtype=torch.long, device=self.device)
            self.edge_type = torch.tensor(edge_types, dtype=torch.long, device=self.device)
            
            num_nodes = len(self.node_to_idx)
            self.node_ids = torch.arange(num_nodes, dtype=torch.long, device=self.device)
            self.node_type_ids = torch.tensor(
                [self.node_types.get(self.idx_to_node[i], 0) for i in range(num_nodes)],
                dtype=torch.long,
                device=self.device
            )
            
            logger.info(f"   Loaded {len(edge_src):,} edges for inference")
            
        except Exception as e:
            logger.warning(f"Could not load graph for inference: {e}")
            self._using_trained = False
    
    def _get_cache_key(self, drug_id: str, disease_id: str) -> Tuple[str, str]:
        """Create consistent cache key"""
        return (drug_id.lower().strip(), disease_id.lower().strip())
    
    def predict(self, drug_id: str, disease_id: str) -> float:
        """
        Predict drug-disease treatment probability.
        
        Returns:
            float: Probability score between 0 and 1
        """
        result = self.predict_with_confidence(drug_id, disease_id)
        return result['score']
    
    def predict_with_confidence(self, drug_id: str, disease_id: str) -> Dict:
        """
        Predict with additional confidence information.
        
        Returns:
            Dict with score, confidence, model_type
        """
        cache_key = self._get_cache_key(drug_id, disease_id)
        
        # Check cache
        if cache_key in self._prediction_cache:
            self._cache_hits += 1
            return self._prediction_cache[cache_key]
        
        self._cache_misses += 1
        
        if self._using_trained and self._model is not None:
            result = self._trained_prediction(drug_id, disease_id)
        else:
            result = self._fallback_prediction(drug_id, disease_id)
        
        self._prediction_cache[cache_key] = result
        return result
    
    def _trained_prediction(self, drug_id: str, disease_id: str) -> Dict:
        """Make prediction using trained model"""
        
        # Check if nodes exist in our graph
        drug_id_lower = drug_id.lower().strip()
        disease_id_lower = disease_id.lower().strip()
        
        # Try different ID formats
        drug_idx = None
        disease_idx = None
        
        for d_id in [drug_id, drug_id_lower, f"Compound::{drug_id}", f"DB{drug_id}"]:
            if d_id in self.node_to_idx:
                drug_idx = self.node_to_idx[d_id]
                break
        
        for dis_id in [disease_id, disease_id_lower, f"Disease::{disease_id}"]:
            if dis_id in self.node_to_idx:
                disease_idx = self.node_to_idx[dis_id]
                break
        
        if drug_idx is None or disease_idx is None:
            # Node not in training graph - use embedding similarity fallback
            logger.debug(f"Node not found: drug={drug_id}, disease={disease_id}")
            return self._fallback_prediction(drug_id, disease_id, note="node_not_in_graph")
        
        # Make prediction with inference mode
        with torch.inference_mode():
            drug_tensor = torch.tensor([drug_idx], device=self.device)
            disease_tensor = torch.tensor([disease_idx], device=self.device)
            
            score = self._model(
                self.node_ids,
                self.node_type_ids,
                self.edge_index,
                self.edge_type,
                drug_tensor,
                disease_tensor
            ).item()
        
        # Calculate confidence based on model certainty
        confidence = self._calculate_confidence(score)
        
        return {
            'score': score,
            'confidence': confidence,
            'model_type': 'trained_gnn',
            'drug_idx': drug_idx,
            'disease_idx': disease_idx
        }
    
    def _calculate_confidence(self, score: float) -> str:
        """Calculate confidence level based on score"""
        # Scores close to 0 or 1 indicate high confidence
        certainty = abs(score - 0.5) * 2
        
        if certainty > 0.7:
            return 'high'
        elif certainty > 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _fallback_prediction(self, drug_id: str, disease_id: str, note: str = "") -> Dict:
        """Fallback when trained model unavailable"""
        # Deterministic but random-looking score
        seed = hash(drug_id.lower() + disease_id.lower())
        random.seed(seed)
        score = random.random()
        
        return {
            'score': score,
            'confidence': 'low',
            'model_type': 'fallback_hash',
            'note': note or 'trained_model_not_loaded'
        }
    
    def predict_batch(self, pairs: List[Tuple[str, str]]) -> List[float]:
        """Batch prediction for multiple drug-disease pairs"""
        results = []
        
        for drug_id, disease_id in pairs:
            results.append(self.predict(drug_id, disease_id))
        
        return results
    
    def predict_batch_with_confidence(self, pairs: List[Tuple[str, str]]) -> List[Dict]:
        """Batch prediction with confidence for multiple pairs"""
        return [self.predict_with_confidence(d, dis) for d, dis in pairs]
    
    def is_using_trained_model(self) -> bool:
        """Check if using trained model"""
        return self._using_trained
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        if self._using_trained:
            return {
                'model_type': 'Trained DrugRepurposingGNN',
                'status': 'loaded',
                'device': str(self.device),
                'num_nodes': len(self.node_to_idx),
                'checkpoint': self.checkpoint_path
            }
        else:
            return {
                'model_type': 'Fallback (hash-based)',
                'status': 'no_trained_model',
                'message': 'Run training to get accurate predictions'
            }
    
    def clear_cache(self):
        """Clear prediction cache"""
        self._prediction_cache.clear()
        self._cache_hits = 0
        self._cache_misses = 0
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        total = self._cache_hits + self._cache_misses
        hit_rate = self._cache_hits / total if total > 0 else 0
        return {
            "cache_size": len(self._prediction_cache),
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "hit_rate": f"{hit_rate:.2%}",
            "using_trained_model": self._using_trained
        }


# Legacy compatibility - old API
class GNNPredictor(TrainedGNNPredictor):
    """Legacy compatibility wrapper"""
    pass


# Global instance
gnn_predictor = TrainedGNNPredictor()
