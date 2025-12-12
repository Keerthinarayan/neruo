import requests
import json

def check_structure():
    # Fetch prediction for a disease to see the explanation structure
    resp = requests.get("http://127.0.0.1:8000/predict?disease_id=Disease::DOID:0050156")
    data = resp.json()
    
    if data['status'] == 'success' and data['data']:
        top_pred = data['data'][0]
        explanations = top_pred.get('explanations', [])
        if explanations:
            print("Explanation Structure:")
            print(json.dumps(explanations[0], indent=2))
        else:
            print("No explanations found for top prediction.")
    else:
        print("Failed to get predictions.")

if __name__ == "__main__":
    check_structure()
