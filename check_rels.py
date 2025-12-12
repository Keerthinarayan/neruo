from backend.database import db

def check():
    db.connect()
    # Check if Compound exists
    c = db.query("MATCH (c:Compound) RETURN count(c)")[0]['count(c)']
    print(f"Compound Count: {c}")
    
    if c > 0:
        # Check rels
        rels = db.query("MATCH (:Compound)-[r]->() RETURN type(r) LIMIT 10")
        print(f"Rels: {list(set([x['type(r)'] for x in rels]))}")
        
    db.close()

if __name__ == "__main__":
    check()
