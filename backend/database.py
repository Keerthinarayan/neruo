import os
from neo4j import GraphDatabase
from typing import Optional

# Hardcoded for now based on user request, ideally load from env
NEO4J_URI = "neo4j+s://a67bf340.databases.neo4j.io"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "IpkcTqi1szBfOexZEzmCo5QKQPKWbmhEnVfL0YbY6Gc"

class Neo4jResult:
    def __init__(self, records):
        self.records = records

class Neo4jClient:
    def __init__(self):
        self.driver = None

    def connect(self):
        if not self.driver:
            print(f"Connecting to Neo4j at {NEO4J_URI}...")
            # increased connection timeout
            self.driver = GraphDatabase.driver(
                NEO4J_URI, 
                auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
                connection_timeout=30.0  
            )
            self.driver.verify_connectivity()
            print("Connected to Neo4j.")

    def close(self):
        if self.driver:
            self.driver.close()

    def query(self, query: str, parameters: Optional[dict] = None):
        if not self.driver:
            self.connect()
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]

# Singleton instance
db = Neo4jClient()
