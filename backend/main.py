from fastapi import FastAPI, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from backend.database import db
from backend.services.neurosymbolic import service
from backend.models.gnn import gnn_predictor
from backend.services.amie import get_amie_service, get_disease_ids_for_pathology

app = FastAPI(title="Neurosymbolic Drug Repurposing API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    try:
        db.connect()
    except Exception as e:
        print(f"Failed to connect to Neo4j on startup: {e}")

@app.on_event("shutdown")
def shutdown_event():
    db.close()

@app.get("/")
def read_root():
    return {"message": "Neurosymbolic API is running"}

@app.get("/test-db")
def test_db():
    try:
        count = db.query("MATCH (n) RETURN count(n) as count")[0]['count']
        return {"status": "success", "node_count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/predict")
def predict(disease_id: str):
    try:
        results = service.predict_repurposing(disease_id)
        return {"status": "success", "data": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/diseases")
def get_diseases():
    try:
        query = "MATCH (d:Disease) RETURN d.id as id, d.name as name ORDER BY d.name LIMIT 100"
        results = db.query(query)
        return {"status": "success", "data": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/drugs")
def get_drugs(limit: int = 100):
    try:
        query = "MATCH (c:Compound) RETURN c.id as id, c.name as name ORDER BY c.name LIMIT $limit"
        results = db.query(query, {"limit": limit})
        return {"status": "success", "data": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/diseases/{disease_id}")
def get_disease_details(disease_id: str):
    try:
        # 1. Basic Info & Stats
        q_info = """
        MATCH (d:Disease {id: $did})
        OPTIONAL MATCH (d)-[:ASSOCIATES]-(g:Gene)
        OPTIONAL MATCH (c:Compound)-[:TREATS]->(d)
        OPTIONAL MATCH (d)-[:LOCALIZES]->(a:Anatomy)
        RETURN 
            d.name as name, 
            count(distinct g) as gene_count,
            count(distinct c) as treatment_count,
            collect(distinct a.name) as anatomy
        """
        info = db.query(q_info, {"did": disease_id})[0]
        
        # 2. Potential New Indications (Predictions)
        predictions = service.predict_repurposing(disease_id, top_k=5)
        
        # 3. Similar Diseases (RESEMBLES relationship)
        q_similar = """
        MATCH (d:Disease {id: $did})-[:RESEMBLES]-(similar:Disease)
        OPTIONAL MATCH (similar)-[:ASSOCIATES]-(g:Gene)
        OPTIONAL MATCH (c:Compound)-[:TREATS]->(similar)
        RETURN 
            similar.id as id,
            similar.name as name,
            count(distinct g) as shared_genes,
            count(distinct c) as treatment_count
        ORDER BY shared_genes DESC
        LIMIT 10
        """
        similar_diseases = db.query(q_similar, {"did": disease_id})
        
        # 4. Shared genes between this disease and similar ones
        q_shared_genes = """
        MATCH (d:Disease {id: $did})-[:ASSOCIATES]-(g:Gene)-[:ASSOCIATES]-(similar:Disease)
        WHERE d <> similar
        RETURN 
            g.name as gene_name,
            g.id as gene_id,
            collect(distinct similar.name)[0..3] as related_diseases
        LIMIT 10
        """
        shared_genes = db.query(q_shared_genes, {"did": disease_id})
        
        return {
            "status": "success", 
            "data": {
                "profile": info,
                "indications": predictions,
                "similar_diseases": similar_diseases,
                "shared_genes": shared_genes
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/diseases/{disease_id}/related")
def get_related_diseases(disease_id: str, limit: int = 20):
    """Get diseases related to the given disease through various relationships"""
    try:
        # Similar diseases via RESEMBLES
        q_resembles = """
        MATCH (d:Disease {id: $did})-[:RESEMBLES]-(similar:Disease)
        RETURN 
            similar.id as id,
            similar.name as name,
            'resembles' as relationship_type,
            1.0 as similarity_score
        LIMIT $limit
        """
        
        # Diseases sharing genes (comorbidity signal)
        q_shared_genes = """
        MATCH (d:Disease {id: $did})-[:ASSOCIATES]-(g:Gene)-[:ASSOCIATES]-(related:Disease)
        WHERE d <> related
        WITH related, count(distinct g) as shared_count
        ORDER BY shared_count DESC
        RETURN 
            related.id as id,
            related.name as name,
            'shared_genes' as relationship_type,
            shared_count as similarity_score
        LIMIT $limit
        """
        
        # Diseases treated by same drugs
        q_shared_drugs = """
        MATCH (d:Disease {id: $did})<-[:TREATS]-(c:Compound)-[:TREATS]->(related:Disease)
        WHERE d <> related
        WITH related, count(distinct c) as shared_count
        ORDER BY shared_count DESC
        RETURN 
            related.id as id,
            related.name as name,
            'shared_treatments' as relationship_type,
            shared_count as similarity_score
        LIMIT $limit
        """
        
        resembles = db.query(q_resembles, {"did": disease_id, "limit": limit})
        shared_genes = db.query(q_shared_genes, {"did": disease_id, "limit": limit})
        shared_drugs = db.query(q_shared_drugs, {"did": disease_id, "limit": limit})
        
        return {
            "status": "success",
            "data": {
                "resembles": resembles,
                "shared_genes": shared_genes,
                "shared_treatments": shared_drugs
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/drugs/{drug_id}/related")
def get_related_drugs(drug_id: str, limit: int = 20):
    """Get drugs related to the given drug"""
    try:
        # Similar drugs via RESEMBLES
        q_resembles = """
        MATCH (c:Compound {id: $did})-[:RESEMBLES]-(similar:Compound)
        RETURN 
            similar.id as id,
            similar.name as name,
            'resembles' as relationship_type
        LIMIT $limit
        """
        
        # Drugs targeting same genes
        q_shared_targets = """
        MATCH (c:Compound {id: $did})-[:BINDS|TARGETS]-(g:Gene)-[:BINDS|TARGETS]-(related:Compound)
        WHERE c <> related
        WITH related, collect(distinct g.name) as shared_genes, count(distinct g) as count
        ORDER BY count DESC
        RETURN 
            related.id as id,
            related.name as name,
            'shared_targets' as relationship_type,
            shared_genes[0..5] as shared_targets,
            count as target_count
        LIMIT $limit
        """
        
        # Drugs treating same diseases
        q_shared_diseases = """
        MATCH (c:Compound {id: $did})-[:TREATS]->(d:Disease)<-[:TREATS]-(related:Compound)
        WHERE c <> related
        WITH related, collect(distinct d.name) as shared_diseases, count(distinct d) as count
        ORDER BY count DESC
        RETURN 
            related.id as id,
            related.name as name,
            'shared_indications' as relationship_type,
            shared_diseases[0..5] as shared_diseases,
            count as disease_count
        LIMIT $limit
        """
        
        resembles = db.query(q_resembles, {"did": drug_id, "limit": limit})
        shared_targets = db.query(q_shared_targets, {"did": drug_id, "limit": limit})
        shared_diseases = db.query(q_shared_diseases, {"did": drug_id, "limit": limit})
        
        return {
            "status": "success",
            "data": {
                "resembles": resembles,
                "shared_targets": shared_targets,
                "shared_indications": shared_diseases
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/drugs/{drug_id}")
def get_drug_details(drug_id: str):
    """Get detailed information about a drug"""
    try:
        # Basic info
        q_info = """
        MATCH (c:Compound {id: $did})
        OPTIONAL MATCH (c)-[:TREATS]->(d:Disease)
        OPTIONAL MATCH (c)-[:PALLIATES]->(p:Disease)
        OPTIONAL MATCH (c)-[:BINDS|TARGETS]-(g:Gene)
        RETURN 
            c.name as name,
            c.id as id,
            collect(distinct d.name) as treats,
            collect(distinct p.name) as palliates,
            collect(distinct g.name)[0..20] as targets
        """
        info = db.query(q_info, {"did": drug_id})[0]
        
        # Mechanism of action (gene pathways)
        q_mechanism = """
        MATCH (c:Compound {id: $did})-[:BINDS|TARGETS]-(g:Gene)-[:PARTICIPATES]->(pw:Pathway)
        RETURN 
            g.name as gene,
            collect(distinct pw.name)[0..3] as pathways
        LIMIT 10
        """
        mechanisms = db.query(q_mechanism, {"did": drug_id})
        
        # Similar drugs
        q_similar = """
        MATCH (c:Compound {id: $did})-[:RESEMBLES]-(similar:Compound)
        RETURN similar.id as id, similar.name as name
        LIMIT 10
        """
        similar = db.query(q_similar, {"did": drug_id})
        
        return {
            "status": "success",
            "data": {
                "profile": info,
                "mechanisms": mechanisms,
                "similar_drugs": similar
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/explore/network")
def get_network_data(node_id: str, depth: int = 1):
    """Get network data for visualization centered on a node"""
    try:
        q_network = """
        MATCH path = (n {id: $nid})-[r*1..""" + str(min(depth, 2)) + """]-(connected)
        WHERE (n:Compound OR n:Disease OR n:Gene)
        WITH n, connected, relationships(path) as rels
        UNWIND rels as rel
        RETURN DISTINCT
            startNode(rel).id as source_id,
            startNode(rel).name as source_name,
            labels(startNode(rel))[0] as source_type,
            type(rel) as relationship,
            endNode(rel).id as target_id,
            endNode(rel).name as target_name,
            labels(endNode(rel))[0] as target_type
        LIMIT 100
        """
        network = db.query(q_network, {"nid": node_id})
        
        # Build nodes and edges
        nodes = {}
        edges = []
        
        for row in network:
            # Add source node
            if row['source_id'] not in nodes:
                nodes[row['source_id']] = {
                    'id': row['source_id'],
                    'name': row['source_name'],
                    'type': row['source_type']
                }
            # Add target node
            if row['target_id'] not in nodes:
                nodes[row['target_id']] = {
                    'id': row['target_id'],
                    'name': row['target_name'],
                    'type': row['target_type']
                }
            # Add edge
            edges.append({
                'source': row['source_id'],
                'target': row['target_id'],
                'relationship': row['relationship']
            })
        
        return {
            "status": "success",
            "data": {
                "nodes": list(nodes.values()),
                "edges": edges
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/explore/full-network/{entity_type}/{entity_id}")
def get_full_network(entity_type: str, entity_id: str, max_nodes: int = 50):
    """
    Get comprehensive network showing ALL relationship types for an entity.
    Shows the full structure: genes, diseases, drugs, pathways, anatomy, etc.
    """
    try:
        # Build different queries based on entity type
        if entity_type == "disease":
            query = """
            // Get the disease
            MATCH (d:Disease {id: $entity_id})
            
            // Get associated genes
            OPTIONAL MATCH (d)-[r1:ASSOCIATES]-(g:Gene)
            WITH d, collect(DISTINCT {node: g, rel: type(r1), relType: 'gene'}) as genes
            
            // Get drugs that treat/palliate
            OPTIONAL MATCH (d)<-[r2:TREATS|PALLIATES]-(drug:Compound)
            WITH d, genes, collect(DISTINCT {node: drug, rel: type(r2), relType: 'drug'}) as drugs
            
            // Get similar diseases
            OPTIONAL MATCH (d)-[r3:RESEMBLES]-(similar:Disease)
            WITH d, genes, drugs, collect(DISTINCT {node: similar, rel: 'RESEMBLES', relType: 'similar_disease'}) as similar_diseases
            
            // Get anatomy where disease localizes
            OPTIONAL MATCH (d)-[r4:LOCALIZES]-(a:Anatomy)
            WITH d, genes, drugs, similar_diseases, collect(DISTINCT {node: a, rel: 'LOCALIZES', relType: 'anatomy'}) as anatomy
            
            // Get symptoms
            OPTIONAL MATCH (d)-[r5:PRESENTS]-(s:Symptom)
            WITH d, genes, drugs, similar_diseases, anatomy, collect(DISTINCT {node: s, rel: 'PRESENTS', relType: 'symptom'}) as symptoms
            
            // Get upregulated/downregulated genes
            OPTIONAL MATCH (d)-[r6:UPREGULATES]-(ug:Gene)
            WITH d, genes, drugs, similar_diseases, anatomy, symptoms, collect(DISTINCT {node: ug, rel: 'UPREGULATES', relType: 'upregulated_gene'}) as up_genes
            
            OPTIONAL MATCH (d)-[r7:DOWNREGULATES]-(dg:Gene)
            WITH d, genes, drugs, similar_diseases, anatomy, symptoms, up_genes, collect(DISTINCT {node: dg, rel: 'DOWNREGULATES', relType: 'downregulated_gene'}) as down_genes
            
            RETURN d as center, genes, drugs, similar_diseases, anatomy, symptoms, up_genes, down_genes
            """
        elif entity_type == "drug":
            query = """
            // Get the drug
            MATCH (c:Compound {id: $entity_id})
            
            // Get diseases it treats
            OPTIONAL MATCH (c)-[r1:TREATS|PALLIATES]->(disease:Disease)
            WITH c, collect(DISTINCT {node: disease, rel: type(r1), relType: 'disease'}) as diseases
            
            // Get genes it binds/targets
            OPTIONAL MATCH (c)-[r2:BINDS]-(g:Gene)
            WITH c, diseases, collect(DISTINCT {node: g, rel: 'BINDS', relType: 'target_gene'}) as target_genes
            
            // Get similar drugs
            OPTIONAL MATCH (c)-[r3:RESEMBLES]-(similar:Compound)
            WITH c, diseases, target_genes, collect(DISTINCT {node: similar, rel: 'RESEMBLES', relType: 'similar_drug'}) as similar_drugs
            
            // Get pharmacologic class
            OPTIONAL MATCH (c)<-[r4:INCLUDES]-(pc:PharmacologicClass)
            WITH c, diseases, target_genes, similar_drugs, collect(DISTINCT {node: pc, rel: 'INCLUDES', relType: 'class'}) as drug_classes
            
            // Get upregulated genes
            OPTIONAL MATCH (c)-[r5:UPREGULATES]-(ug:Gene)
            WITH c, diseases, target_genes, similar_drugs, drug_classes, collect(DISTINCT {node: ug, rel: 'UPREGULATES', relType: 'upregulated_gene'}) as up_genes
            
            // Get downregulated genes
            OPTIONAL MATCH (c)-[r6:DOWNREGULATES]-(dg:Gene)
            WITH c, diseases, target_genes, similar_drugs, drug_classes, up_genes, collect(DISTINCT {node: dg, rel: 'DOWNREGULATES', relType: 'downregulated_gene'}) as down_genes
            
            RETURN c as center, diseases, target_genes, similar_drugs, drug_classes, up_genes, down_genes
            """
        else:  # gene
            query = """
            // Get the gene
            MATCH (g:Gene {id: $entity_id})
            
            // Get associated diseases
            OPTIONAL MATCH (g)-[r1:ASSOCIATES]-(d:Disease)
            WITH g, collect(DISTINCT {node: d, rel: 'ASSOCIATES', relType: 'disease'}) as diseases
            
            // Get drugs that bind
            OPTIONAL MATCH (g)<-[r2:BINDS]-(c:Compound)
            WITH g, diseases, collect(DISTINCT {node: c, rel: 'BINDS', relType: 'drug'}) as drugs
            
            // Get pathways
            OPTIONAL MATCH (g)-[r3:PARTICIPATES]-(p:Pathway)
            WITH g, diseases, drugs, collect(DISTINCT {node: p, rel: 'PARTICIPATES', relType: 'pathway'}) as pathways
            
            // Get interacting genes
            OPTIONAL MATCH (g)-[r4:INTERACTS]-(g2:Gene)
            WITH g, diseases, drugs, pathways, collect(DISTINCT {node: g2, rel: 'INTERACTS', relType: 'interacting_gene'}) as interacting_genes
            
            // Get anatomy where expressed
            OPTIONAL MATCH (g)<-[r5:EXPRESSES]-(a:Anatomy)
            WITH g, diseases, drugs, pathways, interacting_genes, collect(DISTINCT {node: a, rel: 'EXPRESSES', relType: 'anatomy'}) as anatomy
            
            RETURN g as center, diseases, drugs, pathways, interacting_genes, anatomy
            """
        
        result = db.query(query, {"entity_id": entity_id})
        
        if not result:
            return {"status": "error", "message": "Entity not found"}
        
        row = result[0]
        center = row['center']
        
        # Build nodes and edges
        nodes = [{
            'id': center['id'],
            'name': center.get('name', center['id']),
            'type': entity_type.capitalize() if entity_type != 'drug' else 'Compound',
            'isCenter': True
        }]
        edges = []
        seen_nodes = {center['id']}
        
        # Helper to add nodes from collections
        def add_nodes_from_collection(collection, limit=8):
            if not collection:
                return
            for item in collection[:limit]:
                if item and item.get('node'):
                    node = item['node']
                    node_id = node.get('id')
                    if node_id and node_id not in seen_nodes:
                        nodes.append({
                            'id': node_id,
                            'name': node.get('name', node_id),
                            'type': item.get('relType', 'unknown'),
                            'isCenter': False
                        })
                        seen_nodes.add(node_id)
                        edges.append({
                            'source': center['id'],
                            'target': node_id,
                            'relationship': item.get('rel', 'RELATED'),
                            'relationType': item.get('relType', 'unknown')
                        })
        
        # Add all collections based on entity type
        if entity_type == "disease":
            add_nodes_from_collection(row.get('genes'), limit=10)
            add_nodes_from_collection(row.get('drugs'), limit=8)
            add_nodes_from_collection(row.get('similar_diseases'), limit=5)
            add_nodes_from_collection(row.get('anatomy'), limit=5)
            add_nodes_from_collection(row.get('symptoms'), limit=5)
            add_nodes_from_collection(row.get('up_genes'), limit=5)
            add_nodes_from_collection(row.get('down_genes'), limit=5)
        elif entity_type == "drug":
            add_nodes_from_collection(row.get('diseases'), limit=8)
            add_nodes_from_collection(row.get('target_genes'), limit=10)
            add_nodes_from_collection(row.get('similar_drugs'), limit=5)
            add_nodes_from_collection(row.get('drug_classes'), limit=3)
            add_nodes_from_collection(row.get('up_genes'), limit=5)
            add_nodes_from_collection(row.get('down_genes'), limit=5)
        else:  # gene
            add_nodes_from_collection(row.get('diseases'), limit=8)
            add_nodes_from_collection(row.get('drugs'), limit=8)
            add_nodes_from_collection(row.get('pathways'), limit=5)
            add_nodes_from_collection(row.get('interacting_genes'), limit=8)
            add_nodes_from_collection(row.get('anatomy'), limit=5)
        
        # Limit total nodes
        if len(nodes) > max_nodes:
            nodes = nodes[:max_nodes]
            node_ids = {n['id'] for n in nodes}
            edges = [e for e in edges if e['target'] in node_ids]
        
        return {
            "status": "success",
            "data": {
                "center": {
                    'id': center['id'],
                    'name': center.get('name', center['id']),
                    'type': entity_type
                },
                "nodes": nodes,
                "edges": edges,
                "stats": {
                    "total_nodes": len(nodes),
                    "total_edges": len(edges)
                }
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


@app.get("/explore/drug-disease-path/{drug_id}/{disease_id}")
def get_drug_disease_path(drug_id: str, disease_id: str):
    """
    Get all paths connecting a drug to a disease through genes and other entities.
    Shows the full mechanistic reasoning.
    """
    try:
        # First, get drug and disease names
        name_query = """
        MATCH (c:Compound {id: $drug_id})
        MATCH (d:Disease {id: $disease_id})
        RETURN c.name as drug_name, d.name as disease_name
        """
        name_result = db.query(name_query, {"drug_id": drug_id, "disease_id": disease_id})
        
        if not name_result:
            return {"status": "error", "message": "Drug or disease not found"}
        
        drug_name = name_result[0]['drug_name']
        disease_name = name_result[0]['disease_name']
        
        query = """
        // Direct treatment path
        OPTIONAL MATCH direct = (c:Compound {id: $drug_id})-[r:TREATS|PALLIATES]->(d:Disease {id: $disease_id})
        
        // Path through genes (Drug -> Gene -> Disease)
        OPTIONAL MATCH gene_path = (c2:Compound {id: $drug_id})-[r1:BINDS|UPREGULATES|DOWNREGULATES]->(g:Gene)-[r2:ASSOCIATES|UPREGULATES|DOWNREGULATES]->(d2:Disease {id: $disease_id})
        
        // Path through similar drugs
        OPTIONAL MATCH similar_drug_path = (c3:Compound {id: $drug_id})-[:RESEMBLES]-(similar:Compound)-[:TREATS]->(d3:Disease {id: $disease_id})
        
        // Path through similar diseases  
        OPTIONAL MATCH similar_disease_path = (c4:Compound {id: $drug_id})-[:TREATS]->(similar_d:Disease)-[:RESEMBLES]-(d4:Disease {id: $disease_id})
        
        RETURN 
            collect(DISTINCT {
                type: 'direct',
                relationship: type(r)
            })[0] as direct_path,
            collect(DISTINCT {
                type: 'gene_mediated',
                gene: g.name,
                drug_gene_rel: type(r1),
                gene_disease_rel: type(r2)
            }) as gene_paths,
            collect(DISTINCT {
                type: 'similar_drug',
                similar_drug: similar.name
            }) as similar_drug_paths,
            collect(DISTINCT {
                type: 'similar_disease', 
                similar_disease: similar_d.name
            }) as similar_disease_paths
        """
        
        result = db.query(query, {"drug_id": drug_id, "disease_id": disease_id})
        
        if not result:
            return {"status": "error", "message": "No paths found"}
        
        row = result[0]
        
        # Build visualization nodes and edges
        nodes = [
            {'id': drug_id, 'name': drug_name, 'type': 'Compound', 'isCenter': True},
            {'id': disease_id, 'name': disease_name, 'type': 'Disease', 'isCenter': True}
        ]
        edges = []
        seen = {drug_id, disease_id}
        
        # Add direct path
        if row.get('direct_path') and row['direct_path'].get('relationship'):
            edges.append({
                'source': drug_id,
                'target': disease_id,
                'relationship': row['direct_path']['relationship'],
                'pathType': 'direct'
            })
        
        # Add gene-mediated paths
        for gp in row.get('gene_paths', []):
            if gp and gp.get('gene'):
                gene_id = f"Gene::{gp['gene']}"
                if gene_id not in seen:
                    nodes.append({'id': gene_id, 'name': gp['gene'], 'type': 'Gene'})
                    seen.add(gene_id)
                edges.append({
                    'source': drug_id,
                    'target': gene_id,
                    'relationship': gp.get('drug_gene_rel', 'TARGETS'),
                    'pathType': 'gene_mediated'
                })
                edges.append({
                    'source': gene_id,
                    'target': disease_id,
                    'relationship': gp.get('gene_disease_rel', 'ASSOCIATES'),
                    'pathType': 'gene_mediated'
                })
        
        # Add similar drug paths
        for sp in row.get('similar_drug_paths', []):
            if sp and sp.get('similar_drug'):
                sim_id = f"Compound::{sp['similar_drug']}"
                if sim_id not in seen:
                    nodes.append({'id': sim_id, 'name': sp['similar_drug'], 'type': 'Compound'})
                    seen.add(sim_id)
                edges.append({'source': drug_id, 'target': sim_id, 'relationship': 'RESEMBLES', 'pathType': 'similar_drug'})
                edges.append({'source': sim_id, 'target': disease_id, 'relationship': 'TREATS', 'pathType': 'similar_drug'})
        
        # Add similar disease paths
        for sd in row.get('similar_disease_paths', []):
            if sd and sd.get('similar_disease'):
                sim_id = f"Disease::{sd['similar_disease']}"
                if sim_id not in seen:
                    nodes.append({'id': sim_id, 'name': sd['similar_disease'], 'type': 'Disease'})
                    seen.add(sim_id)
                edges.append({'source': drug_id, 'target': sim_id, 'relationship': 'TREATS', 'pathType': 'similar_disease'})
                edges.append({'source': sim_id, 'target': disease_id, 'relationship': 'RESEMBLES', 'pathType': 'similar_disease'})
        
        return {
            "status": "success",
            "data": {
                "drug": {'id': drug_id, 'name': drug_name},
                "disease": {'id': disease_id, 'name': disease_name},
                "nodes": nodes,
                "edges": edges,
                "paths": {
                    "direct": row.get('direct_path'),
                    "gene_mediated": [p for p in row.get('gene_paths', []) if p and p.get('gene')],
                    "via_similar_drugs": [p for p in row.get('similar_drug_paths', []) if p and p.get('similar_drug')],
                    "via_similar_diseases": [p for p in row.get('similar_disease_paths', []) if p and p.get('similar_disease')]
                }
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/stats")
def get_stats():
    try:
        # Aggregate counts for dashboard
        q_nodes = """
        MATCH (n) 
        RETURN 
            count(n) as total,
            sum(CASE WHEN 'Compound' IN labels(n) THEN 1 ELSE 0 END) as compounds,
            sum(CASE WHEN 'Disease' IN labels(n) THEN 1 ELSE 0 END) as diseases,
            sum(CASE WHEN 'Gene' IN labels(n) THEN 1 ELSE 0 END) as genes,
            sum(CASE WHEN 'Anatomy' IN labels(n) THEN 1 ELSE 0 END) as anatomy,
            sum(CASE WHEN 'Pathway' IN labels(n) THEN 1 ELSE 0 END) as pathways
        """
        nodes = db.query(q_nodes)[0]
        
        q_rels = "MATCH ()-[r]->() RETURN count(r) as total_rels"
        rels = db.query(q_rels)[0]['total_rels']
        
        return {
            "status": "success",
            "data": {
                "nodes": nodes,
                "relationships": rels
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/cache/stats")
def get_cache_stats():
    """Get cache statistics for all prediction components"""
    try:
        stats = service.get_cache_stats()
        return {"status": "success", "data": stats}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/cache/clear")
def clear_cache():
    """Clear all prediction caches"""
    try:
        service.clear_all_caches()
        return {"status": "success", "message": "All caches cleared"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ============== MODEL TRAINING ENDPOINTS ==============

# Training status (for background training)
training_status = {
    "is_training": False,
    "progress": 0,
    "current_epoch": 0,
    "total_epochs": 0,
    "best_auc": 0,
    "message": ""
}


@app.get("/model/status")
def get_model_status():
    """Get current model status and info"""
    try:
        model_info = gnn_predictor.get_model_info()
        cache_stats = gnn_predictor.get_cache_stats()
        
        return {
            "status": "success",
            "data": {
                "model": model_info,
                "cache": cache_stats,
                "training": training_status
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def run_training_background(epochs: int, batch_size: int, learning_rate: float):
    """Background training task"""
    global training_status
    
    try:
        from backend.models.train import DrugRepurposingTrainer
        
        training_status["is_training"] = True
        training_status["total_epochs"] = epochs
        training_status["message"] = "Initializing training..."
        
        trainer = DrugRepurposingTrainer(
            embed_dim=128,
            hidden_dim=256,
            num_layers=3,
            learning_rate=learning_rate
        )
        
        # Custom training loop with status updates
        training_status["message"] = "Loading graph data..."
        num_nodes = trainer.load_graph_data()
        
        training_status["message"] = "Loading training pairs..."
        train_pairs, val_pairs = trainer.load_training_pairs()
        
        training_status["message"] = "Initializing model..."
        trainer.initialize_model(num_nodes)
        
        best_auc = 0
        for epoch in range(epochs):
            training_status["current_epoch"] = epoch + 1
            training_status["progress"] = int((epoch + 1) / epochs * 100)
            training_status["message"] = f"Training epoch {epoch + 1}/{epochs}..."
            
            train_loss = trainer.train_epoch(train_pairs, batch_size)
            val_metrics = trainer.evaluate(val_pairs)
            
            if val_metrics['auc'] > best_auc:
                best_auc = val_metrics['auc']
                trainer.save_model("backend/checkpoints/best_model.pt")
            
            training_status["best_auc"] = best_auc
        
        trainer.save_model("backend/checkpoints/final_model.pt")
        
        training_status["is_training"] = False
        training_status["progress"] = 100
        training_status["message"] = f"Training complete! Best AUC: {best_auc:.4f}"
        
        # Reload the model in predictor
        gnn_predictor._try_load_model()
        
    except Exception as e:
        training_status["is_training"] = False
        training_status["message"] = f"Training failed: {str(e)}"


@app.post("/model/train")
def start_training(
    background_tasks: BackgroundTasks,
    epochs: int = 50,
    batch_size: int = 256,
    learning_rate: float = 0.001
):
    """Start model training in background"""
    global training_status
    
    if training_status["is_training"]:
        return {
            "status": "error",
            "message": "Training already in progress",
            "data": training_status
        }
    
    # Reset status
    training_status = {
        "is_training": True,
        "progress": 0,
        "current_epoch": 0,
        "total_epochs": epochs,
        "best_auc": 0,
        "message": "Starting training..."
    }
    
    background_tasks.add_task(
        run_training_background,
        epochs=epochs,
        batch_size=batch_size,
        learning_rate=learning_rate
    )
    
    return {
        "status": "success",
        "message": "Training started in background",
        "data": training_status
    }


@app.get("/model/training-status")
def get_training_status():
    """Get current training progress"""
    return {
        "status": "success",
        "data": training_status
    }


@app.post("/model/reload")
def reload_model():
    """Reload the trained model"""
    try:
        gnn_predictor._try_load_model()
        return {
            "status": "success",
            "message": "Model reloaded",
            "data": gnn_predictor.get_model_info()
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ============================================
# AMIE - Advanced Medical Imaging Environment
# ============================================

@app.post("/amie/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    """
    Analyze a chest X-ray image using TorchXRayVision.
    Returns detected pathologies and relevant drug recommendations from Hetionet.
    """
    try:
        # Read file
        contents = await file.read()
        
        # Get AMIE service and analyze
        amie = get_amie_service()
        result = amie.analyze(contents)
        
        if result['status'] != 'success':
            return result
        
        # Get relevant drugs from Hetionet for detected conditions
        drug_recommendations = []
        
        for finding in result.get('significant_findings', [])[:3]:  # Top 3 findings
            pathology = finding['pathology']
            disease_ids = get_disease_ids_for_pathology(pathology)
            
            for disease_id in disease_ids:
                # Query drugs that treat this disease
                query = """
                MATCH (c:Compound)-[r:TREATS|PALLIATES]->(d:Disease {id: $disease_id})
                RETURN c.id as drug_id, c.name as drug_name, type(r) as relationship, d.name as disease_name
                LIMIT 5
                """
                drugs = db.query(query, {"disease_id": disease_id})
                
                for drug in drugs:
                    drug_recommendations.append({
                        'drug_id': drug['drug_id'],
                        'drug_name': drug['drug_name'],
                        'for_condition': pathology,
                        'disease_name': drug['disease_name'],
                        'relationship': drug['relationship']
                    })
        
        # Remove duplicates
        seen = set()
        unique_recommendations = []
        for rec in drug_recommendations:
            key = rec['drug_id']
            if key not in seen:
                seen.add(key)
                unique_recommendations.append(rec)
        
        return {
            "status": "success",
            "data": {
                "primary_condition": result['primary_condition'],
                "confidence": result['confidence'],
                "findings": [
                    {
                        'pathology': f['pathology'],
                        'probability': round(f['probability'], 3),
                        'severity': 'High' if f['probability'] > 0.7 else 'Moderate' if f['probability'] > 0.5 else 'Low'
                    }
                    for f in result.get('significant_findings', [])
                ],
                "all_predictions": [
                    {'pathology': p['pathology'], 'probability': round(p['probability'], 3)}
                    for p in result['all_predictions'][:10]  # Top 10
                ],
                "drug_recommendations": unique_recommendations[:10],
                "model_info": result['model_info']
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


@app.get("/amie/status")
def amie_status():
    """Check if AMIE service is available"""
    try:
        amie = get_amie_service()
        return {
            "status": "success",
            "data": {
                "available": True,
                "model": "DenseNet121",
                "pathologies": list(amie.pathology_labels) if amie.pathology_labels else []
            }
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": str(e),
            "data": {"available": False}
        }

