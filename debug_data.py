from backend.database import db

def check_compound():
    db.connect()
    
    # Check Compound properties
    q2 = "MATCH (d:Compound) RETURN keys(d) LIMIT 1"
    keys = db.query(q2)
    print(f"Compound Keys: {keys}")
    
    # Check sample
    q4 = "MATCH (d:Compound) RETURN d LIMIT 1"
    sample = db.query(q4)
    print(f"Sample Compound: {sample}")

    db.close()

if __name__ == "__main__":
    check_compound()
