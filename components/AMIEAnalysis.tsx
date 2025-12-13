import React, { useState, useCallback } from 'react';
import { 
  Scan, 
  Upload, 
  Brain, 
  Zap, 
  FileImage, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Eye,
  Layers,
  Target,
  Activity,
  Info,
  Sparkles
} from 'lucide-react';

interface AnalysisResult {
  condition: string;
  confidence: number;
  description: string;
  relevantDrugs: { name: string; mechanism: string }[];
  findings: string[];
}

interface APIAnalysisResult {
  primary_condition: string;
  confidence: number;
  findings: { pathology: string; probability: number; severity: string }[];
  all_predictions: { pathology: string; probability: number }[];
  drug_recommendations: { drug_id: string; drug_name: string; for_condition: string; disease_name: string; relationship: string }[];
  model_info: { name: string; trained_on: string; pathologies_count: number };
}

const AMIEAnalysis: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [apiResult, setApiResult] = useState<APIAnalysisResult | null>(null);
  const [selectedModality, setSelectedModality] = useState<string>('xray');
  const [useRealAPI, setUseRealAPI] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const modalities = [
    { id: 'xray', name: 'Chest X-Ray', icon: FileImage, description: 'Real AI Analysis • TorchXRayVision', realAI: true },
    { id: 'mri', name: 'Brain MRI', icon: Brain, description: 'Demo mode (simulated)', realAI: false },
    { id: 'ct', name: 'CT Scan', icon: Scan, description: 'Demo mode (simulated)', realAI: false },
    { id: 'pet', name: 'PET Scan', icon: Activity, description: 'Demo mode (simulated)', realAI: false },
  ];

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
        setApiResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setAnalyzing(true);
    setError(null);
    setApiResult(null);
    setAnalysisResult(null);
    
    // Use real API for X-ray analysis
    if (useRealAPI && selectedModality === 'xray' && selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const response = await fetch('http://127.0.0.1:8000/amie/analyze', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setApiResult(data.data);
        } else {
          setError(data.message || 'Analysis failed');
        }
      } catch (e: any) {
        setError(`Failed to connect to AMIE service: ${e.message}`);
      }
      setAnalyzing(false);
      return;
    }
    
    // Fallback: Simulated AI analysis for non-X-ray modalities
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Demo result based on modality
    const demoResults: Record<string, AnalysisResult> = {
      mri: {
        condition: 'Mild Cortical Atrophy',
        confidence: 0.87,
        description: 'Analysis suggests mild bilateral cortical atrophy predominantly in the temporal and parietal regions, consistent with early neurodegenerative changes.',
        relevantDrugs: [
          { name: 'Donepezil', mechanism: 'Acetylcholinesterase inhibitor - may slow cognitive decline' },
          { name: 'Memantine', mechanism: 'NMDA receptor antagonist - neuroprotective effects' },
          { name: 'Lecanemab', mechanism: 'Anti-amyloid antibody - reduces amyloid plaques' },
        ],
        findings: [
          'Hippocampal volume reduction (left > right)',
          'Enlarged lateral ventricles',
          'No acute infarcts or hemorrhage',
          'White matter hyperintensities (Fazekas grade 1)',
        ]
      },
      ct: {
        condition: 'Normal CT Findings',
        confidence: 0.92,
        description: 'No acute intracranial abnormality. Brain parenchyma demonstrates normal attenuation. Ventricles and sulci are appropriate for age.',
        relevantDrugs: [],
        findings: [
          'No intracranial hemorrhage',
          'No mass effect or midline shift',
          'Basal cisterns patent',
          'Calvarium intact',
        ]
      },
      pet: {
        condition: 'Hypometabolism Pattern',
        confidence: 0.84,
        description: 'FDG-PET demonstrates reduced metabolic activity in bilateral temporoparietal regions, a pattern often associated with Alzheimer\'s disease.',
        relevantDrugs: [
          { name: 'Aducanumab', mechanism: 'Amyloid-targeting monoclonal antibody' },
          { name: 'Galantamine', mechanism: 'Cholinesterase inhibitor with nicotinic modulation' },
        ],
        findings: [
          'Bilateral temporoparietal hypometabolism',
          'Preserved metabolism in primary sensorimotor cortex',
          'Posterior cingulate involvement',
          'Relative frontal sparing',
        ]
      },
      xray: {
        condition: 'No Acute Findings',
        confidence: 0.95,
        description: 'Chest radiograph shows clear lung fields bilaterally. Cardiac silhouette is within normal limits. No pleural effusion or pneumothorax.',
        relevantDrugs: [],
        findings: [
          'Clear lung fields',
          'Normal cardiac silhouette',
          'No pleural abnormality',
          'Intact bony structures',
        ]
      }
    };
    
    setAnalysisResult(demoResults[selectedModality]);
    setAnalyzing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
        setApiResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Scan className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              AMIE
              <span className="text-sm font-normal px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                Advanced Medical Imaging Environment
              </span>
            </h1>
            <p className="text-gray-400 text-sm">
              AI-powered medical image analysis with drug repurposing insights
            </p>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-400/80 text-xs">
            <strong>Research Demo:</strong> This is a demonstration of AI-assisted imaging analysis concepts. 
            Not for clinical diagnosis. Always consult qualified healthcare professionals for medical decisions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Upload & Modality Selection */}
        <div className="lg:col-span-1 space-y-4">
          {/* Modality Selection */}
          <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Imaging Modality
            </h3>
            <div className="space-y-2">
              {modalities.map(mod => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModality(mod.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      selectedModality === mod.id
                        ? mod.realAI ? 'bg-green-500/20 border border-green-500/30' : 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-black/20 border border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${selectedModality === mod.id ? (mod.realAI ? 'text-green-400' : 'text-blue-400') : 'text-gray-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${selectedModality === mod.id ? 'text-white' : 'text-gray-400'}`}>
                            {mod.name}
                          </p>
                          {mod.realAI && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/30 text-green-400 rounded font-medium">
                              REAL AI
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${mod.realAI ? 'text-green-400/70' : 'text-gray-500'}`}>{mod.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Area */}
          <div 
            className="bg-gray-900/50 border border-white/10 rounded-2xl p-4"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              Upload Image
            </h3>
            
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                selectedImage ? 'border-green-500/30 bg-green-900/10' : 'border-white/10 hover:border-white/20'
              }`}>
                {selectedImage ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                    <p className="text-green-400 text-sm">Image loaded</p>
                    <p className="text-gray-500 text-xs">Click to replace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileImage className="w-8 h-8 text-gray-500 mx-auto" />
                    <p className="text-gray-400 text-sm">Drop image here or click to upload</p>
                    <p className="text-gray-500 text-xs">DICOM, PNG, JPEG supported</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {selectedImage && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Image
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Preview & Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Image Preview */}
          <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              Image Preview
            </h3>
            
            <div className="aspect-video bg-black/50 rounded-xl overflow-hidden flex items-center justify-center">
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt="Medical scan preview" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <Scan className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No image selected</p>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Results */}
          {analyzing && (
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <div>
                  <p className="text-white font-medium">Analyzing medical image...</p>
                  <p className="text-gray-500 text-sm">Running AI models for pattern detection</p>
                </div>
              </div>
              <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && !analyzing && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Analysis Failed</p>
                <p className="text-red-400/70 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Real API Results (X-Ray) */}
          {apiResult && !analyzing && (
            <div className="space-y-4">
              {/* Real Analysis Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-500/30 rounded-lg w-fit">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-medium">Real TorchXRayVision Analysis</span>
              </div>

              {/* Primary Finding */}
              <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{apiResult.primary_condition}</h3>
                      <p className="text-gray-500 text-sm">AI Detected Condition • {apiResult.model_info.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">
                      {Math.round(apiResult.confidence * 100)}%
                    </div>
                    <p className="text-xs text-gray-500">Confidence</p>
                  </div>
                </div>
              </div>

              {/* Detected Pathologies */}
              {apiResult.findings.length > 0 && (
                <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-400" />
                    Detected Pathologies
                  </h3>
                  <div className="space-y-2">
                    {apiResult.findings.map((finding, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                        <span className="text-gray-300 text-sm">{finding.pathology}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            finding.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                            finding.severity === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {finding.severity}
                          </span>
                          <span className="text-cyan-400 text-sm font-mono">{Math.round(finding.probability * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Predictions */}
              <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  All Pathology Scores
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {apiResult.all_predictions.map((pred, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 truncate">{pred.pathology}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${pred.probability > 0.5 ? 'bg-red-500' : pred.probability > 0.3 ? 'bg-yellow-500' : 'bg-gray-500'}`}
                            style={{ width: `${pred.probability * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-500 w-8 text-right">{Math.round(pred.probability * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drug Recommendations from Hetionet */}
              {apiResult.drug_recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Relevant Therapeutics from Hetionet
                    <span className="text-xs text-gray-500">({apiResult.drug_recommendations.length} found)</span>
                  </h3>
                  <div className="space-y-3">
                    {apiResult.drug_recommendations.slice(0, 5).map((drug, idx) => (
                      <div key={idx} className="p-3 bg-black/30 rounded-xl">
                        <div className="flex items-center justify-between">
                          <p className="text-cyan-400 font-medium text-sm">{drug.drug_name}</p>
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                            {drug.relationship}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          For: {drug.for_condition} → {drug.disease_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Demo Results (Non-X-Ray) */}
          {analysisResult && !analyzing && !apiResult && (
            <div className="space-y-4">
              {/* Primary Finding */}
              <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{analysisResult.condition}</h3>
                      <p className="text-gray-500 text-sm">Primary AI Assessment</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">
                      {Math.round(analysisResult.confidence * 100)}%
                    </div>
                    <p className="text-xs text-gray-500">Confidence</p>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm leading-relaxed">
                  {analysisResult.description}
                </p>
              </div>

              {/* Findings */}
              <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  Key Findings
                </h3>
                <ul className="space-y-2">
                  {analysisResult.findings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Relevant Drugs */}
              {analysisResult.relevantDrugs.length > 0 && (
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Potentially Relevant Therapeutics
                    <span className="text-xs text-gray-500">(from Knowledge Graph)</span>
                  </h3>
                  <div className="space-y-3">
                    {analysisResult.relevantDrugs.map((drug, idx) => (
                      <div key={idx} className="p-3 bg-black/30 rounded-xl">
                        <p className="text-cyan-400 font-medium text-sm">{drug.name}</p>
                        <p className="text-gray-400 text-xs mt-1">{drug.mechanism}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AMIEAnalysis;
