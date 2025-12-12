from backend.database import db

def check_expansion_schema():
    db.connect()
    
    # Check for likely additional node types
    labels = db.query("CALL db.labels()")
    print(f"All Labels: {[l['label'] for l in labels]}")
    
    # Check relationships between genes (Interaction?)
    # Assuming 'Gene' exists
    g_rels = db.query("MATCH (:Gene)-[r]->(:Gene) RETURN type(r) LIMIT 5")
    print(f"Gene-Gene Rels: {list(set([x['type(r)'] for x in g_rels]))}")
    
    # Check for Pathways
    p_nodes = db.query("MATCH (p:Pathway) RETURN count(p)")
    if p_nodes:
        print(f"Pathway count: {p_nodes[0]['count(p)']}")
        # Rels
        p_rels = db.query("MATCH (:Gene)-[r]->(:Pathway) RETURN type(r) LIMIT 5")
        print(f"Gene-Pathway Rels: {list(set([x['type(r)'] for x in p_rels]))}")
        
    db.close()

if __name__ == "__main__":
    check_expansion_schema()
