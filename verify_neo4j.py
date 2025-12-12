from neo4j import GraphDatabase
import sys

# URI = "neo4j+s://a67bf340.databases.neo4j.io"
# AUTH = ("neo4j", "IpkcTqi1szBfOexZEzmCo5QKQPKWbmhEnVfL0YbY6Gc")

def verify():
    print("Attempting to import neo4j...")
    try:
        from neo4j import GraphDatabase
        print("Import successful.")
    except ImportError as e:
        print(f"Import failed: {e}")
        return

    uri = "neo4j+s://a67bf340.databases.neo4j.io"
    auth = ("neo4j", "IpkcTqi1szBfOexZEzmCo5QKQPKWbmhEnVfL0YbY6Gc")

    try:
        print("Connecting to driver...")
        driver = GraphDatabase.driver(uri, auth=auth)
        print("Driver created. Verifying connectivity...")
        driver.verify_connectivity()
        print("Connectivity verified!")
        
        with driver.session() as session:
            print("Running query...")
            result = session.run("RETURN 1 AS num")
            print(f"Result: {result.single()['num']}")
            
            # labels
            print("Fetching labels...")
            res = session.run("CALL db.labels()")
            print([r["label"] for r in res])
            
        driver.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify()
