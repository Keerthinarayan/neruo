from backend.database import db

def discover_connectivity():
    db.connect()
    
    # What connects to Compound?
    print("Compound Connections:")
    q1 = "MATCH (c:Compound)-[r]-(n) RETURN distinct labels(n) as lbl, type(r) as rel LIMIT 20"
    res1 = db.query(q1)
    for r in res1:
        print(r)
        
    print("\nDisease Connections:")
    q2 = "MATCH (d:Disease)-[r]-(n) RETURN distinct labels(n) as lbl, type(r) as rel LIMIT 20"
    res2 = db.query(q2)
    for r in res2:
        print(r)
        
    # Check Anatomy?
    print("\nAnatomy Connections:")
    q3 = "MATCH (a:Anatomy)-[r]-(n) RETURN distinct labels(n) as lbl, type(r) as rel LIMIT 20"
    res3 = db.query(q3)
    for r in res3:
        print(r)

    db.close()

if __name__ == "__main__":
    discover_connectivity()
