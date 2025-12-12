from backend.database import db

def check_pairs():
    db.connect()
    
    pairs = [
        ("Gene", "Pathway"),
        ("Pathway", "Gene"),
        ("Compound", "SideEffect"),
        ("Gene", "Gene"),
        ("Compound", "Gene") # Re-verify
    ]
    
    for src, dst in pairs:
        query = f"MATCH (a:{src})-[r]->(b:{dst}) RETURN type(r) LIMIT 5"
        res = db.query(query)
        types = list(set([x['type(r)'] for x in res]))
        print(f"{src}->{dst}: {types}")

    db.close()

if __name__ == "__main__":
    check_pairs()
