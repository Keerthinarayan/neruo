from backend.database import db

def check_disease_props():
    db.connect()
    
    # Check properties
    q1 = "MATCH (d:Disease) RETURN keys(d) as props LIMIT 1"
    print(f"Props: {db.query(q1)}")
    
    # Check existing treatments count
    as_id = 'Disease::DOID:0050156'
    q2 = f"MATCH (d:Disease {{id: '{as_id}'}})<-[:TREATS]-(c:Compound) RETURN count(c) as treat_count"
    print(f"Treatments: {db.query(q2)}")
    
    # Check associated genes
    q3 = f"MATCH (d:Disease {{id: '{as_id}'}})-[:ASSOCIATES]-(g:Gene) RETURN count(g) as gene_count"
    print(f"Genes: {db.query(q3)}")
    
    # Check Anatomy
    q4 = f"MATCH (d:Disease {{id: '{as_id}'}})-[:LOCALIZES]-(a:Anatomy) RETURN a.name"
    print(f"Anatomy: {db.query(q4)}")
    
    db.close()

if __name__ == "__main__":
    check_disease_props()
