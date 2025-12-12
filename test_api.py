import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_workflow():
    print(f"Testing API at {BASE_URL}...")
    
    # 1. Test Fetching Diseases
    try:
        resp = requests.get(f"{BASE_URL}/diseases")
        data = resp.json()
        if data['status'] == 'success':
            diseases = data['data']
            print(f"Found {len(diseases)} diseases.")
            if not diseases:
                print("No diseases found to test with.")
                sys.exit(1)
            target_disease = diseases[0]
            print(f"Selected Disease: {target_disease}")
        else:
            print(f"Error fetching diseases: {data}")
            sys.exit(1)
            
        # 2. Test Prediction
        disease_id = target_disease['id']
        print(f"Requesting prediction for {disease_id}...")
        resp = requests.get(f"{BASE_URL}/predict?disease_id={disease_id}")
        pred_data = resp.json()
        
        if pred_data['status'] == 'success':
            preds = pred_data['data']
            print(f"Received {len(preds)} predictions.")
            if preds:
                print("Top prediction:", preds[0])
        else:
            print(f"Error predicting: {pred_data}")
            
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_workflow()
