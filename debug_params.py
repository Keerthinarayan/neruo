from backend.database import db

def check_params():
    db.connect()
    
    did = 'Disease::DOID:0050156'
    
    # 1. Direct query
    q1 = f"MATCH (d:Disease {{id: '{did}'}}) RETURN d.name"
    print(f"Direct Query: {db.query(q1)}")
    
    # 2. Parameterized query
    q2 = "MATCH (d:Disease {id: $disease_id}) RETURN d.name"
    print(f"Param Query: {db.query(q2, {'disease_id': did})}")
    
    # 3. Test Compound query with WHERE NOT
    q3 = """
        MATCH (d:Compound)
        WHERE NOT (d)-[:TREATS]->(:Disease {id: $disease_id})
        RETURN d.name LIMIT 5
    """
    print(f"Compound Query: {db.query(q3, {'disease_id': did})}")

    db.close()

if __name__ == "__main__":
    check_params()
