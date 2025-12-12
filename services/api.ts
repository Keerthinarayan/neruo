const API_URL = 'http://127.0.0.1:8000';

export interface Disease {
    id: string;
    name: string;
}

export interface Prediction {
    drug_id: string;
    drug_name: string;
    score: number;
    explanations: Explanation[];
}

export interface Explanation {
    rule: string;
    confidence: number;
    path: any;
}

export interface RelatedDisease {
    id: string;
    name: string;
    relationship_type: string;
    similarity_score?: number;
    shared_genes?: number;
}

export interface RelatedDrug {
    id: string;
    name: string;
    relationship_type: string;
    shared_targets?: string[];
    shared_diseases?: string[];
    target_count?: number;
    disease_count?: number;
}

export interface DiseaseDetails {
    profile: {
        name: string;
        gene_count: number;
        treatment_count: number;
        anatomy: string[];
    };
    indications: Prediction[];
    similar_diseases: RelatedDisease[];
    shared_genes: {
        gene_name: string;
        gene_id: string;
        related_diseases: string[];
    }[];
}

export interface DrugDetails {
    profile: {
        name: string;
        id: string;
        treats: string[];
        palliates: string[];
        targets: string[];
    };
    mechanisms: {
        gene: string;
        pathways: string[];
    }[];
    similar_drugs: { id: string; name: string }[];
}

export interface NetworkData {
    nodes: {
        id: string;
        name: string;
        type: string;
    }[];
    edges: {
        source: string;
        target: string;
        relationship: string;
    }[];
}

export const api = {
    getDiseases: async (): Promise<Disease[]> => {
        const response = await fetch(`${API_URL}/diseases`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch diseases');
    },

    predict: async (diseaseId: string): Promise<Prediction[]> => {
        const response = await fetch(`${API_URL}/predict?disease_id=${diseaseId}`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to predict');
    },

    getStats: async () => {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch stats');
    },

    getDiseaseDetails: async (diseaseId: string): Promise<DiseaseDetails> => {
        const response = await fetch(`${API_URL}/diseases/${encodeURIComponent(diseaseId)}`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch disease details');
    },

    getRelatedDiseases: async (diseaseId: string): Promise<{
        resembles: RelatedDisease[];
        shared_genes: RelatedDisease[];
        shared_treatments: RelatedDisease[];
    }> => {
        const response = await fetch(`${API_URL}/diseases/${encodeURIComponent(diseaseId)}/related`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch related diseases');
    },

    getDrugDetails: async (drugId: string): Promise<DrugDetails> => {
        const response = await fetch(`${API_URL}/drugs/${encodeURIComponent(drugId)}`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch drug details');
    },

    getRelatedDrugs: async (drugId: string): Promise<{
        resembles: RelatedDrug[];
        shared_targets: RelatedDrug[];
        shared_indications: RelatedDrug[];
    }> => {
        const response = await fetch(`${API_URL}/drugs/${encodeURIComponent(drugId)}/related`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch related drugs');
    },

    getNetworkData: async (nodeId: string, depth: number = 1): Promise<NetworkData> => {
        const response = await fetch(`${API_URL}/explore/network?node_id=${encodeURIComponent(nodeId)}&depth=${depth}`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch network data');
    },

    getFullNetwork: async (entityType: string, entityId: string, maxNodes: number = 50): Promise<{
        center: { id: string; name: string; type: string };
        nodes: { id: string; name: string; type: string; isCenter?: boolean }[];
        edges: { source: string; target: string; relationship: string; relationType?: string }[];
        stats: { total_nodes: number; total_edges: number };
    }> => {
        const response = await fetch(`${API_URL}/explore/full-network/${entityType}/${encodeURIComponent(entityId)}?max_nodes=${maxNodes}`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch full network');
    },

    getDrugDiseasePath: async (drugId: string, diseaseId: string): Promise<{
        drug: { id: string; name: string };
        disease: { id: string; name: string };
        nodes: { id: string; name: string; type: string; isCenter?: boolean }[];
        edges: { source: string; target: string; relationship: string; pathType?: string }[];
        paths: {
            direct: { type: string; relationship: string } | null;
            gene_mediated: { type: string; gene: string; drug_gene_rel: string; gene_disease_rel: string }[];
            via_similar_drugs: { type: string; similar_drug: string }[];
            via_similar_diseases: { type: string; similar_disease: string }[];
        };
    }> => {
        const response = await fetch(`${API_URL}/explore/drug-disease-path/${encodeURIComponent(drugId)}/${encodeURIComponent(diseaseId)}`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch drug-disease path');
    },

    getModelStatus: async () => {
        const response = await fetch(`${API_URL}/model/status`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        throw new Error(data.message || 'Failed to fetch model status');
    }
};