import { GraphData, NodeType, PredictionResult } from "../types";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

async function callGroq(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Groq API Error:", error);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data: GroqResponse = await response.json();
  return data.choices[0].message.content;
}

/**
 * Analyzes drug repurposing using Groq's Llama 3.3 70B
 */
export const analyzeRepurposing = async (
  entityName: string,
  entityType: 'drug' | 'disease'
): Promise<PredictionResult> => {
  const systemPrompt = `You are a neurosymbolic AI system specialized in drug repurposing. You combine Graph Neural Network (GNN) predictions with symbolic logic reasoning to identify novel drug-disease associations.

You must respond with valid JSON only, no other text.`;

  const prompt = `Perform a neurosymbolic analysis for drug repurposing focusing on: "${entityName}" (Type: ${entityType}).

${entityType === 'drug' 
  ? 'Find a potential NEW disease indication for this drug (drug repurposing).' 
  : 'Find a potential existing drug that could be repurposed to treat this disease.'}

Consider:
1. Known mechanisms of action
2. Biological pathways involved
3. Gene targets and protein interactions
4. Similar approved repurposing cases

Return JSON in this exact format:
{
  "source": "${entityName}",
  "target": "the predicted disease/drug name",
  "neuralScore": 0.85,
  "symbolicConfidence": 0.78,
  "explanation": "A detailed 2-3 sentence explanation of why this repurposing makes biological sense",
  "noveltyScore": 0.72,
  "reasoningChain": [
    {"step": "Gene/Protein 1", "logic": "inhibits/activates/binds"},
    {"step": "Pathway or Gene 2", "logic": "regulates/modulates"},
    {"step": "Biological Process", "logic": "affects/influences"}
  ]
}

The reasoning chain should show the biological path from the drug to the disease (3-4 steps).
Scores should be realistic floats between 0.6 and 0.98.`;

  const response = await callGroq(prompt, systemPrompt);
  
  try {
    const result = JSON.parse(response) as PredictionResult;
    return result;
  } catch (e) {
    console.error("Failed to parse Groq response:", response);
    throw new Error("Failed to parse prediction result");
  }
};

/**
 * Generates a knowledge subgraph around a biomedical entity
 */
export const generateKnowledgeSubgraph = async (topic: string): Promise<GraphData> => {
  const systemPrompt = `You are a biomedical knowledge graph expert. You generate accurate subgraphs from biomedical knowledge bases like Hetionet, DrugBank, and KEGG.

You must respond with valid JSON only, no other text.`;

  const prompt = `Generate a biomedical knowledge graph subgraph centered around "${topic}".

Include:
- Related drugs (blue nodes)
- Related diseases (red nodes)  
- Key genes/proteins involved (green nodes)
- Relevant biological pathways (yellow nodes)

Create 10-15 nodes and appropriate edges showing real biological relationships.

Return JSON in this exact format:
{
  "nodes": [
    {"id": "1", "label": "Entity Name", "type": "DRUG", "val": 8},
    {"id": "2", "label": "Another Entity", "type": "DISEASE", "val": 7}
  ],
  "links": [
    {"source": "1", "target": "2", "relation": "treats", "weight": 0.9}
  ]
}

Rules:
- "type" must be one of: "DRUG", "DISEASE", "GENE", "PATHWAY"
- "val" is importance (1-10), main entity should be 10
- "weight" is confidence (0.1-1.0)
- Use real biological relationships: treats, causes, inhibits, activates, binds_to, regulates, associated_with, upregulates, downregulates, metabolizes
- Make sure source and target IDs in links match node IDs
- The main topic "${topic}" should be the central node with highest val`;

  const response = await callGroq(prompt, systemPrompt);
  
  try {
    const data = JSON.parse(response);
    
    // Validate and fix node types
    const validTypes = ['DRUG', 'DISEASE', 'GENE', 'PATHWAY'];
    data.nodes = data.nodes.map((node: any) => ({
      ...node,
      type: validTypes.includes(node.type) ? node.type : 'GENE'
    }));
    
    return data as GraphData;
  } catch (e) {
    console.error("Failed to parse Groq response:", response);
    throw new Error("Failed to generate knowledge graph");
  }
};

/**
 * Get multiple repurposing candidates for a drug/disease
 */
export const getRepurposingCandidates = async (
  entityName: string,
  entityType: 'drug' | 'disease',
  count: number = 5
): Promise<PredictionResult[]> => {
  const systemPrompt = `You are a neurosymbolic AI for drug repurposing. Return valid JSON only.`;

  const prompt = `Find ${count} potential drug repurposing candidates for "${entityName}" (${entityType}).

Return JSON array:
{
  "candidates": [
    {
      "source": "${entityName}",
      "target": "candidate name",
      "neuralScore": 0.85,
      "symbolicConfidence": 0.78,
      "explanation": "Brief explanation",
      "noveltyScore": 0.72,
      "reasoningChain": [
        {"step": "Intermediate 1", "logic": "relationship"},
        {"step": "Intermediate 2", "logic": "relationship"}
      ]
    }
  ]
}`;

  const response = await callGroq(prompt, systemPrompt);
  
  try {
    const data = JSON.parse(response);
    return data.candidates as PredictionResult[];
  } catch (e) {
    console.error("Failed to parse Groq response:", response);
    throw new Error("Failed to get candidates");
  }
};

/**
 * Explain a drug-disease relationship in detail
 */
export const explainRelationship = async (
  drug: string,
  disease: string
): Promise<{ explanation: string; mechanisms: string[]; evidence: string[] }> => {
  const systemPrompt = `You are a biomedical AI expert. Explain drug-disease relationships with scientific accuracy. Return valid JSON only.`;

  const prompt = `Explain the potential therapeutic relationship between the drug "${drug}" and the disease "${disease}".

Return JSON:
{
  "explanation": "Detailed 3-4 sentence scientific explanation",
  "mechanisms": ["Mechanism 1", "Mechanism 2", "Mechanism 3"],
  "evidence": ["Evidence type 1", "Evidence type 2"]
}`;

  const response = await callGroq(prompt, systemPrompt);
  return JSON.parse(response);
};
