from backend.models.gnn import gnn_predictor
from backend.services.symbolic import symbolic_reasoner
from backend.database import db
from typing import Dict, List, Optional
import time

class NeuroSymbolicService:
    def __init__(self):
        self._result_cache: Dict[str, List[Dict]] = {}
        self._cache_hits = 0
        self._cache_misses = 0

    def _get_cache_key(self, disease_id: str, top_k: int) -> str:
        """Create cache key for full prediction results"""
        return f"{disease_id.lower()}:{top_k}"

    def predict_repurposing(self, disease_id: str, top_k: int = 10, use_cache: bool = True) -> List[Dict]:
        """
        Predict drug repurposing candidates with caching and batch processing.
        
        Args:
            disease_id: Target disease identifier
            top_k: Number of top results to return
            use_cache: Whether to use cached results
        """
        start_time = time.time()
        
        # Check full result cache first
        cache_key = self._get_cache_key(disease_id, top_k)
        if use_cache and cache_key in self._result_cache:
            self._cache_hits += 1
            return self._result_cache[cache_key]
        
        self._cache_misses += 1
        
        # 1. Candidate Selection - Get all drugs not already treating this disease
        query = """
        MATCH (d:Compound)
        WHERE NOT (d)-[:TREATS]->(:Disease {id: $disease_id})
        RETURN d.id as id, d.name as name
        LIMIT 50
        """
        candidates = db.query(query, {"disease_id": disease_id})
        print(f"DEBUG: Disease ID: {disease_id}")
        print(f"DEBUG: Candidates found: {len(candidates)}")
        
        if not candidates:
            return []
        
        # 2. Batch Neural Prediction (GNN) - Much faster than individual calls
        drug_disease_pairs = [(cand['id'], disease_id) for cand in candidates]
        scores = gnn_predictor.predict_batch(drug_disease_pairs)
        
        # 3. Build initial results with scores
        results = []
        high_score_pairs = []  # Pairs that need explanation
        
        for i, cand in enumerate(candidates):
            drug_id = cand['id']
            drug_name = cand['name']
            score = scores[i]
            
            results.append({
                "drug_id": drug_id,
                "drug_name": drug_name,
                "score": score,
                "explanations": []
            })
            
            # Only get explanations for candidates with score > 0
            if score > 0.0:
                high_score_pairs.append((i, drug_id))
        
        # 4. Batch Symbolic Explanation - Only for high-scoring candidates
        for idx, drug_id in high_score_pairs:
            explanation = symbolic_reasoner.explain(drug_id, disease_id)
            results[idx]["explanations"] = explanation
            
            # Boost score if symbolic explanation exists
            if explanation:
                results[idx]["score"] = min(results[idx]["score"] + 0.2, 1.0)
            
        # Sort by score
        results.sort(key=lambda x: x['score'], reverse=True)
        final_results = results[:top_k]
        
        # Cache results
        self._result_cache[cache_key] = final_results
        
        elapsed = time.time() - start_time
        print(f"DEBUG: Prediction completed in {elapsed:.3f}s")
        
        return final_results

    def clear_all_caches(self):
        """Clear all caches in the system"""
        self._result_cache.clear()
        self._cache_hits = 0
        self._cache_misses = 0
        gnn_predictor.clear_cache()
        symbolic_reasoner.clear_cache()

    def get_cache_stats(self) -> Dict:
        """Get comprehensive cache statistics"""
        total = self._cache_hits + self._cache_misses
        hit_rate = self._cache_hits / total if total > 0 else 0
        return {
            "service_cache": {
                "cache_size": len(self._result_cache),
                "cache_hits": self._cache_hits,
                "cache_misses": self._cache_misses,
                "hit_rate": f"{hit_rate:.2%}"
            },
            "gnn_cache": gnn_predictor.get_cache_stats(),
            "symbolic_cache": symbolic_reasoner.get_cache_stats()
        }

service = NeuroSymbolicService()
