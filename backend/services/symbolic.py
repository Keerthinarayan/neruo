from backend.database import db
from typing import Dict, List, Tuple
from functools import lru_cache
import hashlib

class SymbolicReasoner:
    def __init__(self):
        # Define rules/metapaths
        # Confirmed Schema: Compound, TREATS, BINDS, RESEMBLES, UPREGULATES
        # Relaxed rules for higher recall in demo
        self.rules = {
            "Mechanism of Action": """
                MATCH path = (d:Compound {id: $drug_id})-[:BINDS]->(g:Gene)-[]-(:Disease {id: $disease_id})
                RETURN path LIMIT 1
            """,
            "Gene Regulation": """
                MATCH path = (d:Compound {id: $drug_id})-[r:UPREGULATES|DOWNREGULATES]->(g:Gene)-[:ASSOCIATES]->(dis:Disease {id: $disease_id})
                RETURN path LIMIT 1
            """,
            "Anatomical Context": """
                MATCH path = (d:Compound {id: $drug_id})-[:TREATS]->(dis:Disease {id: $disease_id})-[:LOCALIZES]->(a:Anatomy)
                RETURN path LIMIT 1
            """,
            "Known Treatment": """
                 MATCH path = (d:Compound {id: $drug_id})-[:TREATS]->(d2:Disease)
                 RETURN path LIMIT 1
            """,
            "Pharmacologic Class": """
                MATCH path = (d:Compound {id: $drug_id})-[:INCLUDES]->(pc:PharmacologicClass)
                RETURN path LIMIT 1
            """,
            "Similar Compound Strategy": """
                MATCH path = (d:Compound {id: $drug_id})-[:RESEMBLES]->(other:Compound)-[:TREATS]->(dis:Disease {id: $disease_id})
                RETURN path LIMIT 1
            """,
            "Similar Disease Strategy": """
                MATCH path = (d:Compound {id: $drug_id})-[:TREATS]->(other:Disease)-[:RESEMBLES]->(dis:Disease {id: $disease_id})
                RETURN path LIMIT 1
            """
        }
        
        # Cache for explanations
        self._explanation_cache: Dict[str, List[Dict]] = {}
        self._cache_hits = 0
        self._cache_misses = 0

    def _get_cache_key(self, drug_id: str, disease_id: str) -> str:
        """Create consistent cache key"""
        return f"{drug_id.lower()}:{disease_id.lower()}"

    def explain(self, drug_id: str, disease_id: str) -> List[Dict]:
        """Get explanations with caching"""
        cache_key = self._get_cache_key(drug_id, disease_id)
        
        # Check cache first
        if cache_key in self._explanation_cache:
            self._cache_hits += 1
            return self._explanation_cache[cache_key]
        
        self._cache_misses += 1
        explanations = self._compute_explanations(drug_id, disease_id)
        
        # Cache result
        self._explanation_cache[cache_key] = explanations
        return explanations

    def _compute_explanations(self, drug_id: str, disease_id: str) -> List[Dict]:
        """Internal explanation computation"""
        explanations = []
        
        for rule_name, query in self.rules.items():
            results = db.query(query, {"drug_id": drug_id, "disease_id": disease_id})
            if results:
                # We found a path supporting this rule
                # Extract path details for visualization
                path_data = results[0]['path']
                explanations.append({
                    "rule": rule_name,
                    "confidence": 1.0, # Symbolic rules are explicit
                    "path": path_data # simplified for now
                })
        
        return explanations

    def explain_batch(self, pairs: List[Tuple[str, str]]) -> List[List[Dict]]:
        """Batch explanation - process multiple drug-disease pairs"""
        results = []
        
        for drug_id, disease_id in pairs:
            explanations = self.explain(drug_id, disease_id)
            results.append(explanations)
        
        return results

    def clear_cache(self):
        """Clear explanation cache"""
        self._explanation_cache.clear()
        self._cache_hits = 0
        self._cache_misses = 0

    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        total = self._cache_hits + self._cache_misses
        hit_rate = self._cache_hits / total if total > 0 else 0
        return {
            "cache_size": len(self._explanation_cache),
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "hit_rate": f"{hit_rate:.2%}"
        }

symbolic_reasoner = SymbolicReasoner()
