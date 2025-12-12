import { PredictionResult } from '../types';

export const exportToPDF = async (
  result: PredictionResult,
  searchTerm: string,
  searchType: 'drug' | 'disease'
) => {
  // Create a printable HTML document
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>NeuroGraph Analysis Report - ${searchTerm}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1e293b;
          line-height: 1.6;
        }
        .header { 
          border-bottom: 2px solid #06b6d4;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo { 
          font-size: 24px;
          font-weight: bold;
          color: #0f172a;
        }
        .logo span { color: #06b6d4; }
        .subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
        .section { margin-bottom: 24px; }
        .section-title { 
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .info-grid { 
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .info-item label { 
          font-size: 11px;
          color: #64748b;
          display: block;
          margin-bottom: 4px;
        }
        .info-item value { 
          font-size: 14px;
          color: #0f172a;
          font-weight: 500;
        }
        .score-bar { 
          background: #e2e8f0;
          height: 8px;
          border-radius: 4px;
          margin-top: 4px;
          overflow: hidden;
        }
        .score-fill { 
          height: 100%;
          border-radius: 4px;
        }
        .neural { background: #06b6d4; }
        .symbolic { background: #10b981; }
        .novelty { background: #8b5cf6; }
        .reasoning { 
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }
        .reasoning-chain { 
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }
        .chain-item { 
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
        }
        .chain-source { background: #06b6d4; color: white; }
        .chain-step { background: #e2e8f0; color: #475569; }
        .chain-target { background: #10b981; color: white; }
        .chain-arrow { color: #94a3b8; }
        .explanation { 
          font-size: 13px;
          color: #475569;
          margin-top: 12px;
        }
        .footer { 
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #94a3b8;
        }
        .confidence-box {
          background: linear-gradient(135deg, #f0f9ff, #f5f3ff);
          border: 1px solid #e0e7ff;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin-top: 16px;
        }
        .confidence-value {
          font-size: 36px;
          font-weight: bold;
          color: #0f172a;
        }
        .confidence-label {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Neuro<span>Graph</span> BioAI</div>
        <div class="subtitle">Neurosymbolic Drug Repurposing Analysis Report</div>
      </div>

      <div class="section">
        <div class="section-title">Query Information</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Entity Type</label>
            <value>${searchType.charAt(0).toUpperCase() + searchType.slice(1)}</value>
          </div>
          <div class="info-item">
            <label>Query</label>
            <value>${searchTerm}</value>
          </div>
          <div class="info-item">
            <label>Analysis Date</label>
            <value>${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</value>
          </div>
          <div class="info-item">
            <label>Predicted Target</label>
            <value style="color: #10b981; font-weight: 600;">${result.target}</value>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Confidence Scores</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Neural Score (GNN)</label>
            <value>${(result.neuralScore * 100).toFixed(1)}%</value>
            <div class="score-bar">
              <div class="score-fill neural" style="width: ${result.neuralScore * 100}%"></div>
            </div>
          </div>
          <div class="info-item">
            <label>Symbolic Confidence</label>
            <value>${(result.symbolicConfidence * 100).toFixed(1)}%</value>
            <div class="score-bar">
              <div class="score-fill symbolic" style="width: ${result.symbolicConfidence * 100}%"></div>
            </div>
          </div>
          <div class="info-item">
            <label>Novelty Score</label>
            <value>${(result.noveltyScore * 100).toFixed(1)}%</value>
            <div class="score-bar">
              <div class="score-fill novelty" style="width: ${result.noveltyScore * 100}%"></div>
            </div>
          </div>
        </div>
        <div class="confidence-box">
          <div class="confidence-value">${(((result.neuralScore + result.symbolicConfidence) / 2) * 100).toFixed(0)}%</div>
          <div class="confidence-label">Combined Confidence Score</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Reasoning Chain</div>
        <div class="reasoning">
          <div class="reasoning-chain">
            <span class="chain-item chain-source">${result.source}</span>
            ${result.reasoningChain.map(hop => `
              <span class="chain-arrow">→</span>
              <span class="chain-item chain-step">${hop.step}</span>
            `).join('')}
            <span class="chain-arrow">→</span>
            <span class="chain-item chain-target">${result.target}</span>
          </div>
          <p class="explanation">${result.explanation}</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Methodology</div>
        <div class="reasoning">
          <p style="font-size: 12px; color: #475569; margin-bottom: 8px;">
            This prediction was generated using a neurosymbolic approach combining:
          </p>
          <ul style="font-size: 12px; color: #64748b; margin-left: 20px;">
            <li>Graph Neural Network (GNN) embeddings from Hetionet knowledge graph</li>
            <li>Link prediction for identifying potential drug-disease associations</li>
            <li>Symbolic reasoning using PyReason for rule-based validation</li>
            <li>Explainability through mechanistic pathway analysis</li>
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>Generated by NeuroGraph BioAI • ${new Date().toISOString()}</p>
        <p style="margin-top: 4px;">This report is for research purposes only and should not be used for clinical decisions.</p>
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

export const exportToJSON = (
  result: PredictionResult,
  searchTerm: string,
  searchType: 'drug' | 'disease'
) => {
  const data = {
    query: {
      term: searchTerm,
      type: searchType,
      timestamp: new Date().toISOString()
    },
    prediction: {
      source: result.source,
      target: result.target,
      explanation: result.explanation
    },
    scores: {
      neural: result.neuralScore,
      symbolic: result.symbolicConfidence,
      novelty: result.noveltyScore,
      combined: (result.neuralScore + result.symbolicConfidence) / 2
    },
    reasoning: result.reasoningChain,
    metadata: {
      platform: 'NeuroGraph BioAI',
      version: '1.0.0',
      model: 'Llama 3.3 70B'
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `neurograph-${searchTerm.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
