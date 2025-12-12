"""
Advanced GNN Architecture for Drug Repurposing
This is your USP - a custom neurosymbolic model combining:
1. Graph Neural Networks (pattern learning)
2. Attention mechanisms (focus on important connections)
3. Multi-relational modeling (different edge types)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple
import math


class MultiHeadAttention(nn.Module):
    """Multi-head self-attention for combining node features"""
    
    def __init__(self, embed_dim: int, num_heads: int = 4, dropout: float = 0.1):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        
        assert self.head_dim * num_heads == embed_dim, "embed_dim must be divisible by num_heads"
        
        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.k_proj = nn.Linear(embed_dim, embed_dim)
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)
        
        self.dropout = nn.Dropout(dropout)
        self.scale = math.sqrt(self.head_dim)
    
    def forward(self, query: torch.Tensor, key: torch.Tensor, value: torch.Tensor, 
                mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        batch_size = query.size(0)
        
        # Project and reshape
        q = self.q_proj(query).view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(key).view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(value).view(batch_size, -1, self.num_heads, self.head_dim).transpose(1, 2)
        
        # Attention scores
        attn = torch.matmul(q, k.transpose(-2, -1)) / self.scale
        
        if mask is not None:
            attn = attn.masked_fill(mask == 0, float('-inf'))
        
        attn = F.softmax(attn, dim=-1)
        attn = self.dropout(attn)
        
        # Apply attention to values
        out = torch.matmul(attn, v)
        out = out.transpose(1, 2).contiguous().view(batch_size, -1, self.embed_dim)
        
        return self.out_proj(out)


class GraphConvLayer(nn.Module):
    """Custom graph convolution with edge-type awareness"""
    
    def __init__(self, in_dim: int, out_dim: int, num_relations: int = 10):
        super().__init__()
        self.in_dim = in_dim
        self.out_dim = out_dim
        self.num_relations = num_relations
        
        # Relation-specific transformations
        self.relation_weights = nn.Parameter(torch.Tensor(num_relations, in_dim, out_dim))
        self.relation_bias = nn.Parameter(torch.Tensor(num_relations, out_dim))
        
        # Self-loop transformation
        self.self_loop = nn.Linear(in_dim, out_dim)
        
        # Layer normalization
        self.layer_norm = nn.LayerNorm(out_dim)
        
        self._reset_parameters()
    
    def _reset_parameters(self):
        nn.init.xavier_uniform_(self.relation_weights)
        nn.init.zeros_(self.relation_bias)
    
    def forward(self, x: torch.Tensor, edge_index: torch.Tensor, 
                edge_type: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        x: Node features [num_nodes, in_dim]
        edge_index: Edge indices [2, num_edges]
        edge_type: Edge types [num_edges] (optional)
        """
        num_nodes = x.size(0)
        
        # Self-loop contribution
        out = self.self_loop(x)
        
        if edge_index.size(1) > 0:
            src, dst = edge_index[0], edge_index[1]
            
            # Default edge type if not provided
            if edge_type is None:
                edge_type = torch.zeros(edge_index.size(1), dtype=torch.long, device=x.device)
            
            # Aggregate messages by relation type
            for rel in range(self.num_relations):
                rel_mask = edge_type == rel
                if rel_mask.sum() > 0:
                    rel_src = src[rel_mask]
                    rel_dst = dst[rel_mask]
                    
                    # Transform source node features
                    messages = torch.matmul(x[rel_src], self.relation_weights[rel]) + self.relation_bias[rel]
                    
                    # Aggregate to destination nodes
                    out.index_add_(0, rel_dst, messages)
        
        return self.layer_norm(out)


class DrugRepurposingGNN(nn.Module):
    """
    Main GNN model for drug repurposing prediction
    
    Architecture:
    1. Node embedding layer
    2. Multiple graph convolution layers with residual connections
    3. Attention-based readout
    4. Prediction head
    """
    
    def __init__(
        self,
        num_nodes: int,
        num_relations: int = 10,
        embed_dim: int = 128,
        hidden_dim: int = 256,
        num_layers: int = 3,
        num_heads: int = 4,
        dropout: float = 0.2
    ):
        super().__init__()
        
        self.embed_dim = embed_dim
        self.num_layers = num_layers
        
        # Node embeddings (learnable)
        self.node_embeddings = nn.Embedding(num_nodes, embed_dim)
        
        # Node type embeddings (Drug, Disease, Gene, etc.)
        self.type_embeddings = nn.Embedding(10, embed_dim)  # Max 10 node types
        
        # Graph convolution layers
        self.conv_layers = nn.ModuleList()
        self.conv_norms = nn.ModuleList()
        
        for i in range(num_layers):
            in_dim = embed_dim if i == 0 else hidden_dim
            out_dim = hidden_dim
            self.conv_layers.append(GraphConvLayer(in_dim, out_dim, num_relations))
            self.conv_norms.append(nn.LayerNorm(out_dim))
        
        # Attention for combining layers
        self.layer_attention = MultiHeadAttention(hidden_dim, num_heads, dropout)
        
        # Final projection
        self.output_proj = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, embed_dim)
        )
        
        self.dropout = nn.Dropout(dropout)
        
        self._init_weights()
    
    def _init_weights(self):
        nn.init.xavier_uniform_(self.node_embeddings.weight)
        nn.init.xavier_uniform_(self.type_embeddings.weight)
    
    def forward(
        self,
        node_ids: torch.Tensor,
        node_types: torch.Tensor,
        edge_index: torch.Tensor,
        edge_type: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """
        Forward pass through the GNN
        
        Args:
            node_ids: Node indices [num_nodes]
            node_types: Node type indices [num_nodes]
            edge_index: Edge indices [2, num_edges]
            edge_type: Edge type indices [num_edges]
        
        Returns:
            Node embeddings [num_nodes, embed_dim]
        """
        # Initial embeddings = node embedding + type embedding
        x = self.node_embeddings(node_ids) + self.type_embeddings(node_types)
        x = self.dropout(x)
        
        # Store layer outputs for attention
        layer_outputs = []
        
        # Graph convolutions with residual connections
        for i, (conv, norm) in enumerate(zip(self.conv_layers, self.conv_norms)):
            residual = x if i > 0 and x.size(-1) == conv.out_dim else None
            
            x = conv(x, edge_index, edge_type)
            x = F.relu(x)
            x = self.dropout(x)
            
            if residual is not None:
                x = x + residual
            
            x = norm(x)
            layer_outputs.append(x)
        
        # Combine layer outputs with attention
        stacked = torch.stack(layer_outputs, dim=1)  # [num_nodes, num_layers, hidden_dim]
        attended = self.layer_attention(stacked, stacked, stacked)
        x = attended.mean(dim=1)  # [num_nodes, hidden_dim]
        
        # Final projection
        x = self.output_proj(x)
        
        return x


class DrugDiseaseScoringHead(nn.Module):
    """
    Scoring head for drug-disease pair prediction
    
    Uses multiple interaction types:
    1. Concatenation
    2. Element-wise product
    3. Bilinear interaction
    4. Cosine similarity
    """
    
    def __init__(self, embed_dim: int = 128, hidden_dim: int = 256, dropout: float = 0.2):
        super().__init__()
        
        self.embed_dim = embed_dim
        
        # Bilinear interaction
        self.bilinear = nn.Bilinear(embed_dim, embed_dim, hidden_dim)
        
        # MLP for combined features
        # Input: concat(2*embed) + bilinear(hidden) + element_wise(embed) + cosine(1)
        input_dim = 2 * embed_dim + hidden_dim + embed_dim + 1
        
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.LayerNorm(hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, 1)
        )
    
    def forward(self, drug_emb: torch.Tensor, disease_emb: torch.Tensor) -> torch.Tensor:
        """
        Score drug-disease pairs
        
        Args:
            drug_emb: Drug embeddings [batch, embed_dim]
            disease_emb: Disease embeddings [batch, embed_dim]
        
        Returns:
            Scores [batch, 1]
        """
        # Concatenation
        concat = torch.cat([drug_emb, disease_emb], dim=-1)
        
        # Element-wise product
        element_wise = drug_emb * disease_emb
        
        # Bilinear interaction
        bilinear = self.bilinear(drug_emb, disease_emb)
        
        # Cosine similarity
        cosine = F.cosine_similarity(drug_emb, disease_emb, dim=-1, eps=1e-8).unsqueeze(-1)
        
        # Combine all features
        combined = torch.cat([concat, element_wise, bilinear, cosine], dim=-1)
        
        # Score
        score = self.mlp(combined)
        
        return torch.sigmoid(score)


class DrugRepurposingModel(nn.Module):
    """
    Complete drug repurposing model combining GNN encoder and scoring head
    """
    
    def __init__(
        self,
        num_nodes: int,
        num_relations: int = 10,
        embed_dim: int = 128,
        hidden_dim: int = 256,
        num_layers: int = 3,
        num_heads: int = 4,
        dropout: float = 0.2
    ):
        super().__init__()
        
        self.encoder = DrugRepurposingGNN(
            num_nodes=num_nodes,
            num_relations=num_relations,
            embed_dim=embed_dim,
            hidden_dim=hidden_dim,
            num_layers=num_layers,
            num_heads=num_heads,
            dropout=dropout
        )
        
        self.scorer = DrugDiseaseScoringHead(
            embed_dim=embed_dim,
            hidden_dim=hidden_dim,
            dropout=dropout
        )
    
    def encode(
        self,
        node_ids: torch.Tensor,
        node_types: torch.Tensor,
        edge_index: torch.Tensor,
        edge_type: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """Get node embeddings"""
        return self.encoder(node_ids, node_types, edge_index, edge_type)
    
    def score(self, drug_emb: torch.Tensor, disease_emb: torch.Tensor) -> torch.Tensor:
        """Score drug-disease pairs"""
        return self.scorer(drug_emb, disease_emb)
    
    def forward(
        self,
        node_ids: torch.Tensor,
        node_types: torch.Tensor,
        edge_index: torch.Tensor,
        edge_type: Optional[torch.Tensor],
        drug_indices: torch.Tensor,
        disease_indices: torch.Tensor
    ) -> torch.Tensor:
        """
        Full forward pass: encode nodes and score pairs
        """
        # Encode all nodes
        node_embeddings = self.encode(node_ids, node_types, edge_index, edge_type)
        
        # Get drug and disease embeddings
        drug_emb = node_embeddings[drug_indices]
        disease_emb = node_embeddings[disease_indices]
        
        # Score pairs
        return self.score(drug_emb, disease_emb)
