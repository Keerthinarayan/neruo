from backend.database import db

def inspect_schema():
    db.connect()
    
    # Get all labels
    labels = db.query("CALL db.labels()")
    print(f"Labels: {[r['label'] for r in labels]}")
    
    # Sample nodes to see what they are
    sample = db.query("MATCH (n) RETURN labels(n) as l, properties(n) as p LIMIT 5")
    for s in sample:
        print(f"Label: {s['l']}, Props: {s['p']}")

    db.close()

if __name__ == "__main__":
    inspect_schema()
