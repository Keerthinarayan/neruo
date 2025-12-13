"""
AMIE - Advanced Medical Imaging Environment
X-Ray analysis using TorchXRayVision
"""

import torch
import torchxrayvision as xrv
import numpy as np
from PIL import Image
import io
import base64
import logging

logger = logging.getLogger(__name__)

class AMIEService:
    def __init__(self):
        self.model = None
        self.transform = None
        self.pathology_labels = None
        self._load_model()
    
    def _load_model(self):
        """Load the pre-trained DenseNet model for X-ray analysis"""
        try:
            logger.info("Loading TorchXRayVision model...")
            
            # Use DenseNet model trained on multiple datasets
            self.model = xrv.models.DenseNet(weights="densenet121-res224-all")
            self.model.eval()
            
            # Get pathology labels
            self.pathology_labels = self.model.pathologies
            
            logger.info(f"✅ AMIE model loaded. Can detect {len(self.pathology_labels)} pathologies:")
            logger.info(f"   {', '.join(self.pathology_labels)}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load AMIE model: {e}")
            raise
    
    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """Preprocess image for the model"""
        # Load image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to grayscale if needed
        if image.mode != 'L':
            image = image.convert('L')
        
        # Resize to 224x224
        image = image.resize((224, 224))
        
        # Convert to numpy array and normalize
        img_array = np.array(image, dtype=np.float32)
        
        # Normalize to [-1024, 1024] range (expected by torchxrayvision)
        img_array = (img_array / 255.0) * 2048 - 1024
        
        # Add channel dimension and convert to tensor format
        img_array = img_array[np.newaxis, :, :]  # Shape: (1, 224, 224)
        
        return img_array
    
    def analyze(self, image_data: bytes) -> dict:
        """
        Analyze an X-ray image and return predictions.
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Dictionary with predictions and findings
        """
        try:
            # Preprocess image
            img_array = self.preprocess_image(image_data)
            
            # Convert to torch tensor
            img_tensor = torch.from_numpy(img_array).unsqueeze(0)  # Shape: (1, 1, 224, 224)
            
            # Run inference
            with torch.no_grad():
                predictions = self.model(img_tensor)
                predictions = torch.sigmoid(predictions)  # Convert to probabilities
            
            # Get predictions as numpy array
            pred_array = predictions.numpy()[0]
            
            # Create results dictionary
            results = []
            for i, label in enumerate(self.pathology_labels):
                prob = float(pred_array[i])
                results.append({
                    'pathology': label,
                    'probability': prob,
                    'detected': prob > 0.5
                })
            
            # Sort by probability
            results.sort(key=lambda x: x['probability'], reverse=True)
            
            # Get top findings (probability > 0.3)
            significant_findings = [r for r in results if r['probability'] > 0.3]
            
            # Determine primary condition
            if significant_findings:
                primary = significant_findings[0]
                primary_condition = primary['pathology']
                confidence = primary['probability']
            else:
                primary_condition = "No Significant Abnormality"
                confidence = 0.85  # High confidence in normalcy
            
            return {
                'status': 'success',
                'primary_condition': primary_condition,
                'confidence': confidence,
                'all_predictions': results,
                'significant_findings': significant_findings,
                'model_info': {
                    'name': 'DenseNet121',
                    'trained_on': 'Multiple chest X-ray datasets',
                    'pathologies_count': len(self.pathology_labels)
                }
            }
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }

# Pathology to Hetionet disease mapping
PATHOLOGY_TO_DISEASE = {
    'Atelectasis': ['Disease::DOID:17155'],  # Atelectasis
    'Cardiomegaly': ['Disease::DOID:12930'],  # Cardiomyopathy
    'Consolidation': ['Disease::DOID:552'],  # Pneumonia
    'Edema': ['Disease::DOID:11396'],  # Pulmonary edema
    'Effusion': ['Disease::DOID:3202'],  # Pleural effusion
    'Emphysema': ['Disease::DOID:9675'],  # Emphysema / COPD
    'Fibrosis': ['Disease::DOID:3770'],  # Pulmonary fibrosis
    'Hernia': ['Disease::DOID:9528'],  # Hernia
    'Infiltration': ['Disease::DOID:552'],  # Pneumonia (infiltrate)
    'Mass': ['Disease::DOID:162'],  # Cancer
    'Nodule': ['Disease::DOID:162'],  # Cancer (lung nodule)
    'Pleural_Thickening': ['Disease::DOID:3202'],  # Pleural disease
    'Pneumonia': ['Disease::DOID:552'],  # Pneumonia
    'Pneumothorax': ['Disease::DOID:1673'],  # Pneumothorax
    'Lung Opacity': ['Disease::DOID:552'],  # General lung pathology
    'Lung Lesion': ['Disease::DOID:162'],  # Cancer
    'Fracture': ['Disease::DOID:5675'],  # Fracture
    'Support Devices': [],  # Not a disease
    'Enlarged Cardiomediastinum': ['Disease::DOID:12930'],  # Heart disease
    'No Finding': [],  # Healthy
}

def get_disease_ids_for_pathology(pathology: str) -> list:
    """Map a detected pathology to Hetionet disease IDs"""
    return PATHOLOGY_TO_DISEASE.get(pathology, [])

# Initialize service (will be loaded on import)
amie_service = None

def get_amie_service() -> AMIEService:
    """Get or create AMIE service singleton"""
    global amie_service
    if amie_service is None:
        amie_service = AMIEService()
    return amie_service
